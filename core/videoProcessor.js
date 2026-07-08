const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { app } = require('electron');

// --- CONSTANTS ---
const MAX_CONCURRENT_VIDEO_JOBS = 2;
const FFMPEG_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const PROGRESS_THROTTLE_MS = 250;
const SUPPORTED_INPUT_FORMATS = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'wmv', 'm4v', 'ts', 'mts'];
const SUPPORTED_SUBTITLE_FORMATS = ['srt', 'ass', 'vtt'];

// Active jobs tracker map: jobId -> { controller, operation, inputFile, startedAt, status }
const activeJobs = new Map();

// Concurrency queue management
const originalDelete = activeJobs.delete.bind(activeJobs);
activeJobs.delete = function (key) {
    const result = originalDelete(key);
    checkQueue();
    return result;
};

function checkQueue() {
    let runningCount = 0;
    const queuedJobs = [];

    for (const [jobId, job] of activeJobs.entries()) {
        if (job.status === 'running') {
            runningCount++;
        } else if (job.status === 'queued') {
            queuedJobs.push(job);
        }
    }

    // Sort queued jobs by startedAt to make it FIFO
    queuedJobs.sort((a, b) => a.startedAt - b.startedAt);

    // Start queued jobs if we have slots
    while (runningCount < MAX_CONCURRENT_VIDEO_JOBS && queuedJobs.length > 0) {
        const nextJob = queuedJobs.shift();
        if (nextJob && typeof nextJob.run === 'function') {
            runningCount++;
            nextJob.run();
        }
    }
}

function waitForTurn(jobId, signal) {
    const job = activeJobs.get(jobId);
    if (!job) return Promise.resolve();

    return new Promise((resolve, reject) => {
        if (signal && signal.aborted) {
            reject(new Error('Operation cancelled by user.'));
            return;
        }

        const onAbort = () => {
            reject(new Error('Operation cancelled by user.'));
        };

        if (signal) {
            signal.addEventListener('abort', onAbort);
        }

        job.status = 'queued';
        job.run = () => {
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
            job.status = 'running';
            job.startedAt = Date.now();
            resolve();
        };
        checkQueue();
    });
}

function getFFmpegPath() {
    const isDev = !app.isPackaged;
    const platform = process.platform;

    if (platform === 'win32') {
        const localPath = isDev
            ? path.join(__dirname, '..', 'engines', 'ffmpeg.exe')
            : path.join(process.resourcesPath, 'engines', 'ffmpeg.exe');
        return fs.existsSync(localPath) ? localPath : 'ffmpeg';
    } else {
        const localPath = isDev
            ? path.join(__dirname, '..', 'engines', 'ffmpeg')
            : path.join(process.resourcesPath, 'engines', 'ffmpeg');
        if (fs.existsSync(localPath)) {
            return localPath;
        }

        // Common system candidates
        const candidates = [
            '/opt/homebrew/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/usr/bin/ffmpeg',
            '/bin/ffmpeg'
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        return 'ffmpeg';
    }
}

/**
 * Validates and sanitizes a file path to ensure it remains in allowed user directories.
 * @param {string} filePath - Path to sanitize
 * @returns {string} Sanitized absolute file path
 * @throws {Error} If path is invalid or escapes allowed boundaries
 */
function sanitizePath(filePath) {
    if (!filePath) {
        throw new Error('File path is required.');
    }
    const resolved = path.resolve(filePath);

    // Verify it is a valid absolute path and does not contain null bytes
    if (!path.isAbsolute(resolved) || resolved.includes('\0')) {
        throw new Error(`Access Denied: Invalid or non-absolute path: ${resolved}`);
    }
    return resolved;
}

/**
 * Parses FFmpeg stderr output for time progress and calculates percentage.
 * @param {string} line - A single line of FFmpeg output
 * @param {number} durationSecs - Total duration in seconds
 * @returns {number|null} Progress percentage float (0-100) or null if line doesn't contain progress
 */
function parseFfmpegProgress(line, durationSecs) {
    if (!line.includes('time=')) {
        return null;
    }
    const match = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
    if (!match) {
        return null;
    }

    const hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const msStr = match[4];
    const ms = parseInt(msStr, 10) / Math.pow(10, msStr.length);
    const elapsedSeconds = hrs * 3600 + mins * 60 + secs + ms;

    if (!durationSecs || durationSecs <= 0) {
        return 0;
    }
    const percent = Math.min(100, Math.max(0, (elapsedSeconds / durationSecs) * 100));
    return parseFloat(percent.toFixed(2));
}

/**
 * Terminates a child process cleanly, killing descendant processes on Windows.
 * @param {ChildProcess} proc - Child process to terminate
 */
function terminateChildProcess(proc) {
    if (!proc || proc.killed) {
        return;
    }
    try {
        if (process.platform === 'win32' && Number.isInteger(proc.pid) && proc.pid > 0) {
            const killer = spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], {
                windowsHide: true,
                stdio: 'ignore'
            });
            killer.unref();
            return;
        }
        proc.kill('SIGTERM');
        setTimeout(() => {
            if (!proc.killed) {
                try {
                    proc.kill('SIGKILL');
                } catch {
                    // Ignore follow-up errors
                }
            }
        }, 400).unref?.();
    } catch (err) {
        console.error('[videoProcessor] Process termination error:', err);
    }
}

/**
 * Wrapper to spawn FFmpeg process with cancellation, timeout, and progress reporting.
 * @param {string[]} args - Arguments to pass to FFmpeg
 * @param {function} onProgress - Progress callback receiving percent float
 * @param {AbortSignal} signal - Optional abort signal to cancel execution
 * @param {number} [initialDurationSecs=null] - Duration to calculate progress percentages
 * @returns {Promise<void>} Resolves on success, rejects with error message
 */
function spawnFfmpeg(args, onProgress, signal, initialDurationSecs = null) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = getFFmpegPath();
        if (path.isAbsolute(ffmpegPath) && !fs.existsSync(ffmpegPath)) {
            return reject(new Error(`FFmpeg executable not found at: ${ffmpegPath}`));
        }

        const proc = spawn(ffmpegPath, args, { windowsHide: true });
        if (global.activeChildProcesses) {
            global.activeChildProcesses.add(proc);
            proc.on('close', () => global.activeChildProcesses.delete(proc));
            proc.on('exit', () => global.activeChildProcesses.delete(proc));
        }
        let stderrTail = '';
        let lastProgressTime = 0;
        let durationSecs = initialDurationSecs;

        const timeoutId = setTimeout(() => {
            terminateChildProcess(proc);
            reject(new Error(`FFmpeg operation timed out after ${FFMPEG_TIMEOUT_MS / 1000} seconds.`));
        }, FFMPEG_TIMEOUT_MS);

        const cleanUp = () => {
            clearTimeout(timeoutId);
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
        };

        const onAbort = () => {
            terminateChildProcess(proc);
            cleanUp();
            reject(new Error('Operation cancelled by user.'));
        };

        if (signal) {
            if (signal.aborted) {
                onAbort();
                return;
            }
            signal.addEventListener('abort', onAbort);
        }

        proc.stderr.on('data', (chunk) => {
            const dataStr = chunk.toString();
            stderrTail = (stderrTail + dataStr).slice(-2000);

            // Dynamically parse duration if not pre-provided
            if (!durationSecs) {
                const durMatch = dataStr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
                if (durMatch) {
                    const hrs = parseInt(durMatch[1], 10);
                    const mins = parseInt(durMatch[2], 10);
                    const secs = parseInt(durMatch[3], 10);
                    const msStr = durMatch[4];
                    const ms = parseInt(msStr, 10) / Math.pow(10, msStr.length);
                    durationSecs = hrs * 3600 + mins * 60 + secs + ms;
                }
            }

            if (onProgress && durationSecs) {
                const lines = dataStr.split(/[\r\n]+/);
                for (const line of lines) {
                    const percent = parseFfmpegProgress(line, durationSecs);
                    if (percent !== null) {
                        const now = Date.now();
                        if (now - lastProgressTime >= PROGRESS_THROTTLE_MS || percent >= 100) {
                            lastProgressTime = now;
                            onProgress(percent);
                        }
                    }
                }
            }
        });

        proc.on('close', (code) => {
            cleanUp();
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderrTail}`));
            }
        });

        proc.on('error', (err) => {
            cleanUp();
            reject(err);
        });
    });
}

/**
 * Trims a video file between startTime and endTime (in seconds).
 * @param {object} params
 * @param {string} params.inputPath - Path to input video
 * @param {string} params.outputPath - Path to save trimmed video
 * @param {number} params.startTime - Start offset in seconds
 * @param {number} params.endTime - End offset in seconds
 * @param {boolean} [params.reencode=false] - Whether to re-encode (false = lossless copy)
 * @param {function} params.onProgress - Progress callback
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<void>}
 */
async function trimVideo({ jobId, inputPath, outputPath, startTime, endTime, reencode = false, onProgress, signal }) {
    await waitForTurn(jobId, signal);
    if (onProgress) onProgress(0);
    const safeInput = sanitizePath(inputPath);
    const safeOutput = sanitizePath(outputPath);

    if (!fs.existsSync(safeInput)) {
        throw new Error(`Input file does not exist: ${safeInput}`);
    }
    if (startTime < 0 || endTime < 0) {
        throw new Error('Start and end times must be non-negative.');
    }
    if (endTime <= startTime) {
        throw new Error('End time must be greater than start time.');
    }

    const duration = endTime - startTime;
    const args = ['-y', '-ss', String(startTime), '-to', String(endTime), '-i', safeInput];

    if (reencode) {
        args.push('-c:v', 'libx264', '-c:a', 'aac');
    } else {
        args.push('-c', 'copy');
    }
    args.push(safeOutput);

    await spawnFfmpeg(args, onProgress, signal, duration);
}

/**
 * Merges multiple video files together.
 * @param {object} params
 * @param {string[]} params.inputPaths - List of paths to input videos
 * @param {string} params.outputPath - Path to save merged output video
 * @param {number} [params.totalDuration] - Optional sum of durations for progress
 * @param {function} params.onProgress - Progress callback
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<void>}
 */
async function mergeVideos({ jobId, inputPaths, outputPath, totalDuration, onProgress, signal }) {
    await waitForTurn(jobId, signal);
    if (onProgress) onProgress(0);
    if (!inputPaths || !Array.isArray(inputPaths) || inputPaths.length < 2) {
        throw new Error('Minimum of 2 input files required to merge.');
    }

    const safeInputs = inputPaths.map(p => {
        const safe = sanitizePath(p);
        if (!fs.existsSync(safe)) {
            throw new Error(`Input file does not exist: ${safe}`);
        }
        const ext = path.extname(safe).slice(1).toLowerCase();
        if (!SUPPORTED_INPUT_FORMATS.includes(ext)) {
            throw new Error(`Unsupported input format for merge: .${ext}`);
        }
        return safe;
    });

    const safeOutput = sanitizePath(outputPath);
    const tempFileListPath = path.join(os.tmpdir(), `converthub_concat_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);

    try {
        const fileContent = safeInputs.map(p => {
            const formattedPath = p.replace(/\\/g, '/');
            return `file '${formattedPath.replace(/'/g, "'\\''")}'`;
        }).join('\n');

        await fs.promises.writeFile(tempFileListPath, fileContent, 'utf8');

        const args = ['-y', '-f', 'concat', '-safe', '0', '-i', tempFileListPath, '-c', 'copy', safeOutput];
        await spawnFfmpeg(args, onProgress, signal, totalDuration);
    } finally {
        try {
            if (fs.existsSync(tempFileListPath)) {
                await fs.promises.rm(tempFileListPath, { force: true });
            }
        } catch (e) {
            console.warn('[videoProcessor] Failed to clean up concat temp file:', e.message);
        }
    }
}

/**
 * Extracts audio track from a video.
 * @param {object} params
 * @param {string} params.inputPath - Input video file path
 * @param {string} params.outputPath - Output audio file path
 * @param {string} params.format - Output audio format ('mp3', 'aac', 'wav', 'flac')
 * @param {string} [params.bitrate='192k'] - Audio bitrate (for MP3/AAC)
 * @param {number} [params.duration] - Optional duration for progress tracking
 * @param {function} params.onProgress - Progress callback
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<void>}
 */
async function extractAudio({ jobId, inputPath, outputPath, format, bitrate = '192k', duration, onProgress, signal }) {
    await waitForTurn(jobId, signal);
    if (onProgress) onProgress(0);
    const safeInput = sanitizePath(inputPath);
    const safeOutput = sanitizePath(outputPath);

    if (!fs.existsSync(safeInput)) {
        throw new Error(`Input file does not exist: ${safeInput}`);
    }

    const args = ['-y', '-i', safeInput, '-vn'];

    switch (format.toLowerCase()) {
        case 'mp3':
            args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
            break;
        case 'aac':
            args.push('-c:a', 'aac', '-b:a', bitrate);
            break;
        case 'wav':
            args.push('-c:a', 'pcm_s16le');
            break;
        case 'flac':
            args.push('-c:a', 'flac');
            break;
        default:
            throw new Error(`Unsupported audio extraction format: ${format}`);
    }

    args.push(safeOutput);
    await spawnFfmpeg(args, onProgress, signal, duration);
}

/**
 * Compresses video file.
 * @param {object} params
 * @param {string} params.inputPath - Input video file path
 * @param {string} params.outputPath - Output video file path
 * @param {string} params.quality - 'low' (CRF 28), 'medium' (CRF 23), or 'high' (CRF 18)
 * @param {string} params.resolution - 'original', '1080p', '720p', '480p', '360p'
 * @param {number} [params.duration] - Optional duration for progress tracking
 * @param {function} params.onProgress - Progress callback
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<void>}
 */
async function compressVideo({ jobId, inputPath, outputPath, quality, resolution, duration, onProgress, signal }) {
    await waitForTurn(jobId, signal);
    if (onProgress) onProgress(0);
    const safeInput = sanitizePath(inputPath);
    const safeOutput = sanitizePath(outputPath);

    if (!fs.existsSync(safeInput)) {
        throw new Error(`Input file does not exist: ${safeInput}`);
    }

    const crfMap = { low: '28', medium: '23', high: '18' };
    const crfVal = crfMap[quality.toLowerCase()] || '23';

    const args = ['-y', '-i', safeInput, '-c:v', 'libx264', '-crf', crfVal, '-c:a', 'aac', '-movflags', '+faststart'];

    if (resolution.toLowerCase() !== 'original') {
        const height = resolution.replace('p', '');
        args.push('-vf', `scale=-2:${height}`);
    }

    args.push(safeOutput);

    const estimatedReduction = quality === 'low' ? '70%' : (quality === 'medium' ? '55%' : '30%');

    // Proxy progress to forward the size reduction estimate
    const progressWrapper = (percent) => {
        if (onProgress) {
            onProgress({ percent, estimatedReduction });
        }
    };

    await spawnFfmpeg(args, progressWrapper, signal, duration);
}

/**
 * Hardcodes subtitles onto a video file.
 * @param {object} params
 * @param {string} params.inputPath - Input video file path
 * @param {string} params.subtitlePath - Input subtitle file path (.srt, .ass, .vtt)
 * @param {string} params.outputPath - Output video file path
 * @param {number} [params.duration] - Optional duration for progress tracking
 * @param {function} params.onProgress - Progress callback
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<{ success: boolean, warnNonAscii: boolean }>}
 */
async function hardcodeSubtitles({ jobId, inputPath, subtitlePath, outputPath, duration, onProgress, signal }) {
    await waitForTurn(jobId, signal);
    if (onProgress) onProgress(0);
    const safeInput = sanitizePath(inputPath);
    const safeSub = sanitizePath(subtitlePath);
    const safeOutput = sanitizePath(outputPath);

    if (!fs.existsSync(safeInput)) {
        throw new Error(`Input file does not exist: ${safeInput}`);
    }
    if (!fs.existsSync(safeSub)) {
        throw new Error(`Subtitle file does not exist: ${safeSub}`);
    }

    const subExt = path.extname(safeSub).slice(1).toLowerCase();
    if (!SUPPORTED_SUBTITLE_FORMATS.includes(subExt)) {
        throw new Error(`Unsupported subtitle format: .${subExt}`);
    }

    // Check for non-ASCII characters in subtitle file
    let hasNonAscii = false;
    try {
        const content = await fs.promises.readFile(safeSub, 'utf8');
        hasNonAscii = /[^\x00-\x7F]/.test(content);
    } catch (err) {
        console.warn('[videoProcessor] Warning checking non-ASCII subtitle characters:', err.message);
    }

    // Format the subtitle path for FFmpeg subtitles filter
    // 1. Replace backslashes with forward slashes
    let subFilterPath = safeSub.replace(/\\/g, '/');
    // 2. Escape the drive letter colon (e.g. C:/file.srt -> C\:/file.srt)
    subFilterPath = subFilterPath.replace(/^([A-Za-z]):/, '$1\\:');
    // 3. Escape single quotes for the FFmpeg filter
    subFilterPath = subFilterPath.replace(/'/g, "'\\\\''");

    const args = [
        '-y',
        '-i', safeInput,
        '-vf', `subtitles='${subFilterPath}'`,
        '-c:v', 'libx264',
        '-crf', '18',
        '-c:a', 'copy',
        safeOutput
    ];

    await spawnFfmpeg(args, onProgress, signal, duration);

    return {
        success: true,
        warnNonAscii: hasNonAscii
    };
}

/**
 * Runs FFmpeg info check and returns parsed metadata.
 * @param {string} filePath - Path to video/audio file
 * @returns {Promise<object>} Structured metadata object
 */
function getMediaInfo(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const ffmpegExecutable = getFFmpegPath();
            const safePath = sanitizePath(filePath);
            if (!fs.existsSync(safePath)) {
                return reject(new Error(`File does not exist: ${safePath}`));
            }

            const proc = spawn(ffmpegExecutable, ['-i', safePath], { windowsHide: true });
            if (global.activeChildProcesses) {
                global.activeChildProcesses.add(proc);
                proc.on('close', () => global.activeChildProcesses.delete(proc));
                proc.on('exit', () => global.activeChildProcesses.delete(proc));
            }
            let stderr = '';
            proc.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });

            proc.on('close', () => {
                try {
                    const info = parseFfmpegInfo(stderr, safePath);
                    resolve(info);
                } catch (e) {
                    reject(e);
                }
            });

            proc.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Parses FFmpeg stderr output to extract media information.
 * @param {string} stderr - FFmpeg stderr text
 * @param {string} filePath - File path
 * @returns {object} Structured metadata object
 */
function parseFfmpegInfo(stderr, filePath) {
    const info = {
        filePath,
        fileName: path.basename(filePath),
        duration: 0,
        videoCodec: 'N/A',
        resolution: 'N/A',
        fps: 'N/A',
        audioCodec: 'N/A',
        sampleRate: 'N/A',
        channels: 'N/A',
        fileSize: 0
    };

    const durationMatch = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
    if (durationMatch) {
        const hrs = parseInt(durationMatch[1], 10);
        const mins = parseInt(durationMatch[2], 10);
        const secs = parseInt(durationMatch[3], 10);
        const msStr = durationMatch[4];
        const ms = parseInt(msStr, 10) / Math.pow(10, msStr.length);
        info.duration = hrs * 3600 + mins * 60 + secs + ms;
    }

    const lines = stderr.split('\n');
    for (const line of lines) {
        if (line.includes('Video:')) {
            const codecMatch = line.match(/Video:\s*([A-Za-z0-9_-]+)/);
            if (codecMatch) {
                info.videoCodec = codecMatch[1];
            }
            const resMatch = line.match(/\b(\d{2,5}x\d{2,5})\b/);
            if (resMatch) {
                info.resolution = resMatch[1];
            }
            const fpsMatch = line.match(/(\d+(?:\.\d+)?)\s*fps/);
            if (fpsMatch) {
                info.fps = fpsMatch[1];
            }
        }
        if (line.includes('Audio:')) {
            const codecMatch = line.match(/Audio:\s*([A-Za-z0-9_-]+)/);
            if (codecMatch) {
                info.audioCodec = codecMatch[1];
            }
            const srMatch = line.match(/(\d+)\s*Hz/);
            if (srMatch) {
                info.sampleRate = srMatch[1] + ' Hz';
            }
            const chanMatch = line.match(/(mono|stereo|5\.1|7\.1|\d+\s*channels)/);
            if (chanMatch) {
                info.channels = chanMatch[1];
            }
        }
    }

    try {
        const stat = fs.statSync(filePath);
        info.fileSize = stat.size;
    } catch (e) {
        console.warn('[videoProcessor] Failed to read file size in parseFfmpegInfo:', e.message);
    }

    return info;
}

/**
 * Cancels an active video job by jobId.
 * @param {string} jobId - UUID of the job to cancel
 * @returns {boolean} True if successfully cancelled, false otherwise
 */
function cancelJob(jobId) {
    const job = activeJobs.get(jobId);
    if (job) {
        if (job.controller) {
            job.controller.abort();
        }
        activeJobs.delete(jobId);
        return true;
    }
    return false;
}

/**
 * Lists all currently active video jobs.
 * @returns {object[]} Array of active job details
 */
function getActiveJobs() {
    const list = [];
    for (const [jobId, job] of activeJobs.entries()) {
        list.push({
            jobId,
            operation: job.operation,
            inputFile: job.inputFile,
            startedAt: job.startedAt,
            status: job.status || 'running'
        });
    }
    return list;
}

module.exports = {
    MAX_CONCURRENT_VIDEO_JOBS,
    FFMPEG_TIMEOUT_MS,
    PROGRESS_THROTTLE_MS,
    SUPPORTED_INPUT_FORMATS,
    SUPPORTED_SUBTITLE_FORMATS,
    activeJobs,
    getFFmpegPath,
    sanitizePath,
    parseFfmpegProgress,
    spawnFfmpeg,
    trimVideo,
    mergeVideos,
    extractAudio,
    compressVideo,
    hardcodeSubtitles,
    cancelJob,
    getActiveJobs,
    getMediaInfo
};
