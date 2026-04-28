const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PLATFORM = process.platform;
const DEV_ROOT = path.resolve(__dirname, '..');
const DEV_ENGINES_ROOT = path.join(DEV_ROOT, 'engines');
const PROD_ENGINES_ROOT = process.resourcesPath
    ? path.join(process.resourcesPath, 'engines')
    : DEV_ENGINES_ROOT;
const IS_PACKAGED = process.env.NODE_ENV === 'production' || process.defaultApp === false;

function getEngineCandidatePaths(...segments) {
    const relativeEnginePath = path.join(...segments);
    const devPath = path.join(DEV_ENGINES_ROOT, relativeEnginePath);
    const packagedPath = path.join(PROD_ENGINES_ROOT, relativeEnginePath);

    return IS_PACKAGED
        ? [packagedPath, devPath]
        : [devPath, packagedPath];
}

const ENGINE_DEFINITIONS = {
    ffmpeg: {
        probeArgs: ['-version'],
        candidates: PLATFORM === 'win32'
            ? [...getEngineCandidatePaths('ffmpeg.exe'), 'ffmpeg.exe', 'ffmpeg']
            : ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']
    },
    libreoffice: {
        probeArgs: ['--version'],
        candidates: PLATFORM === 'win32'
            ? [...getEngineCandidatePaths('libreoffice', 'program', 'soffice.exe'), 'soffice.exe', 'soffice']
            : PLATFORM === 'darwin'
                ? [
                    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
                    'soffice',
                    '/opt/homebrew/bin/soffice',
                    '/usr/local/bin/soffice',
                    '/usr/bin/soffice'
                ]
                : ['soffice', '/usr/bin/soffice', '/usr/local/bin/soffice']
    },
    '7zip': {
        probeArgs: ['--help'],
        candidates: PLATFORM === 'win32'
            ? [...getEngineCandidatePaths('7zip', '7za.exe'), '7za.exe', '7z.exe']
            : ['7z', '7za', '/usr/bin/7z', '/usr/local/bin/7z', '/opt/homebrew/bin/7z']
    }
};
const resolvedEngineExecutables = new Map();

const FORMAT_TYPES = {
    audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'],
    video: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv'],
    image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'ico', 'gif'],
    document: ['pdf', 'docx', 'txt', 'odt', 'rtf', 'html', 'xlsx', 'pptx'],
    archive: ['zip', '7z', 'tar', 'gz']
};

const ARCHIVE_FORMATS = new Set(FORMAT_TYPES.archive);
const DOCUMENT_FILTERS = {
    pdf: 'pdf',
    docx: 'docx:MS Word 2007 XML',
    txt: 'txt:Text',
    odt: 'odt',
    rtf: 'rtf',
    html: 'html:XHTML Writer File:UTF8',
    xlsx: 'xlsx:Calc MS Excel 2007 XML',
    pptx: 'pptx:Impress MS PowerPoint 2007 XML'
};
const HARDWARE_ENCODER_PLANS = {
    mp4: [
        { encoder: 'h264_nvenc', codecArgs: ['-c:v', 'h264_nvenc', '-c:a', 'aac'] },
        { encoder: 'h264_qsv', codecArgs: ['-c:v', 'h264_qsv', '-c:a', 'aac'] },
        { encoder: 'h264_amf', codecArgs: ['-c:v', 'h264_amf', '-c:a', 'aac'] },
        { encoder: 'h264_mf', codecArgs: ['-c:v', 'h264_mf', '-c:a', 'aac'] }
    ],
    mov: [
        { encoder: 'h264_nvenc', codecArgs: ['-c:v', 'h264_nvenc', '-c:a', 'aac'] },
        { encoder: 'h264_qsv', codecArgs: ['-c:v', 'h264_qsv', '-c:a', 'aac'] },
        { encoder: 'h264_amf', codecArgs: ['-c:v', 'h264_amf', '-c:a', 'aac'] },
        { encoder: 'h264_mf', codecArgs: ['-c:v', 'h264_mf', '-c:a', 'aac'] }
    ],
    mkv: [
        { encoder: 'h264_nvenc', codecArgs: ['-c:v', 'h264_nvenc', '-c:a', 'aac'] },
        { encoder: 'h264_qsv', codecArgs: ['-c:v', 'h264_qsv', '-c:a', 'aac'] },
        { encoder: 'h264_amf', codecArgs: ['-c:v', 'h264_amf', '-c:a', 'aac'] },
        { encoder: 'h264_mf', codecArgs: ['-c:v', 'h264_mf', '-c:a', 'aac'] }
    ],
    webm: [
        { encoder: 'vp9_qsv', codecArgs: ['-c:v', 'vp9_qsv', '-c:a', 'libopus'] },
        { encoder: 'av1_nvenc', codecArgs: ['-c:v', 'av1_nvenc', '-c:a', 'libopus'] },
        { encoder: 'av1_qsv', codecArgs: ['-c:v', 'av1_qsv', '-c:a', 'libopus'] },
        { encoder: 'av1_amf', codecArgs: ['-c:v', 'av1_amf', '-c:a', 'libopus'] },
        { encoder: 'av1_mf', codecArgs: ['-c:v', 'av1_mf', '-c:a', 'libopus'] }
    ],
    jpg: [
        { encoder: 'mjpeg_qsv', codecArgs: ['-c:v', 'mjpeg_qsv'] }
    ],
    jpeg: [
        { encoder: 'mjpeg_qsv', codecArgs: ['-c:v', 'mjpeg_qsv'] }
    ]
};

let ffmpegEncodersPromise = null;
const DEFAULT_BATCH_WORKER_LIMIT = Math.max(1, Math.min(3, Math.ceil((os.cpus()?.length || 2) / 2)));
const ENGINE_CONCURRENCY_LIMITS = {
    ffmpeg: DEFAULT_BATCH_WORKER_LIMIT,
    libreoffice: 1,
    '7zip': 2
};

async function pathExists(targetPath) {
    try {
        await fs.promises.access(targetPath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function isLikelyAbsolutePath(targetPath) {
    return path.isAbsolute(targetPath) || /^[A-Za-z]:[\\/]/.test(String(targetPath || ''));
}

async function ensureDirectoryExists(dirPath) {
    await fs.promises.mkdir(dirPath, { recursive: true });
}

function normalizeFormat(format) {
    return String(format || '').trim().replace(/^\./, '').toLowerCase();
}

function formatDisplayName(targetPath) {
    return path.basename(String(targetPath || '').trim()) || String(targetPath || '').trim();
}

function normalizeOutputKey(targetPath) {
    return path.normalize(targetPath).toLowerCase();
}

function splitOutputPath(targetPath) {
    const parsed = path.parse(targetPath);
    return {
        dir: parsed.dir,
        name: parsed.name,
        ext: parsed.ext
    };
}

async function probeExecutable(candidate, probeArgs) {
    return new Promise((resolve) => {
        let settled = false;

        const finish = (available) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(available);
        };

        let proc;
        try {
            proc = spawn(candidate, probeArgs, { windowsHide: true });
        } catch (error) {
            if (error && error.code === 'ENOENT') {
                finish(false);
                return;
            }
            finish(isLikelyAbsolutePath(candidate));
            return;
        }

        proc.on('error', (error) => {
            if (error && error.code === 'ENOENT') {
                finish(false);
                return;
            }
            finish(isLikelyAbsolutePath(candidate));
        });

        proc.on('spawn', () => finish(true));
        proc.on('close', (code) => finish(code !== 127));
    });
}

async function resolveExecutable(engine) {
    if (resolvedEngineExecutables.has(engine)) {
        return resolvedEngineExecutables.get(engine);
    }

    const definition = ENGINE_DEFINITIONS[engine];
    if (!definition) {
        return null;
    }

    for (const candidate of definition.candidates) {
        if (isLikelyAbsolutePath(candidate) && !await pathExists(candidate)) {
            continue;
        }
        if (await probeExecutable(candidate, definition.probeArgs)) {
            resolvedEngineExecutables.set(engine, candidate);
            return candidate;
        }
    }

    resolvedEngineExecutables.set(engine, null);
    return null;
}

async function getEngineStatus() {
    const entries = await Promise.all(Object.keys(ENGINE_DEFINITIONS).map(async (engine) => {
        const executable = await resolveExecutable(engine);
        return [engine, {
            available: Boolean(executable),
            executable: executable || null
        }];
    }));

    return {
        isPackaged: IS_PACKAGED,
        platform: PLATFORM,
        engineRoot: IS_PACKAGED ? PROD_ENGINES_ROOT : DEV_ENGINES_ROOT,
        engines: Object.fromEntries(entries)
    };
}

function getEngineForType(type) {
    switch (type) {
        case 'audio':
        case 'video':
        case 'image':
            return 'ffmpeg';
        case 'document':
            return 'libreoffice';
        case 'archive':
            return '7zip';
        default:
            return null;
    }
}

function getJobType(job) {
    if (job && job.type) {
        return job.type;
    }

    return detectTypeFromExtension(path.extname(job?.inputPath || ''));
}

function getJobEngine(job) {
    return getEngineForType(getJobType(job));
}

function getEngineConcurrencyLimit(engine) {
    return ENGINE_CONCURRENCY_LIMITS[engine] || 1;
}

function getBatchWorkerLimit(jobCount) {
    return Math.max(1, Math.min(DEFAULT_BATCH_WORKER_LIMIT, jobCount));
}

function detectTypeFromExtension(ext) {
    const normalized = normalizeFormat(ext);
    for (const [type, formats] of Object.entries(FORMAT_TYPES)) {
        if (formats.includes(normalized)) {
            return type;
        }
    }
    return null;
}

async function validateRequest({ inputPath, outputPath, format, type }) {
    if (!inputPath || typeof inputPath !== 'string') {
        throw new Error('Missing input file path.');
    }
    if (!outputPath || typeof outputPath !== 'string') {
        throw new Error('Missing output file path.');
    }
    if (!path.isAbsolute(inputPath)) {
        throw new Error('Input path must be absolute.');
    }
    if (!path.isAbsolute(outputPath)) {
        throw new Error('Output path must be absolute.');
    }
    if (!await pathExists(inputPath)) {
        throw new Error(`Input file does not exist: ${inputPath}`);
    }

    const stats = await fs.promises.stat(inputPath);
    if (!stats.isFile()) {
        throw new Error(`Input path is not a file: ${inputPath}`);
    }

    const normalizedFormat = normalizeFormat(format);
    if (!normalizedFormat) {
        throw new Error('Missing output format.');
    }

    if (type && (!FORMAT_TYPES[type] || !FORMAT_TYPES[type].includes(normalizedFormat))) {
        throw new Error(`Format .${normalizedFormat} is not supported for type "${type}".`);
    }

    const normalizedInput = path.normalize(inputPath).toLowerCase();
    const normalizedOutput = path.normalize(outputPath).toLowerCase();
    if (normalizedInput === normalizedOutput) {
        throw new Error('Output file cannot overwrite the input file.');
    }

    await ensureDirectoryExists(path.dirname(outputPath));

    return normalizedFormat;
}

async function createUniqueOutputPath(desiredPath, reservedPaths = new Set()) {
    const parsed = splitOutputPath(desiredPath);
    const ext = parsed.ext || '';
    const baseDir = parsed.dir;
    const baseName = parsed.name || 'output';
    let attempt = 0;
    let candidate = desiredPath;

    while (true) {
        const normalizedCandidate = normalizeOutputKey(candidate);
        if (!reservedPaths.has(normalizedCandidate) && !await pathExists(candidate)) {
            reservedPaths.add(normalizedCandidate);
            return candidate;
        }

        attempt += 1;
        candidate = path.join(baseDir, `${baseName} (${attempt})${ext}`);
    }
}

function simplifyEngineError(errorMessage, { engine, inputPath, format } = {}) {
    const raw = String(errorMessage || '').trim();
    const fileName = formatDisplayName(inputPath);
    const normalized = raw.toLowerCase();

    if (!raw) {
        return `The ${engine || 'conversion'} process failed for ${fileName}.`;
    }

    if (normalized.includes('permission denied') || normalized.includes('access is denied')) {
        return `ConvertHub could not write the output for ${fileName}. Try a different output folder or close any app using that file.`;
    }

    if (normalized.includes('invalid data found') || normalized.includes('could not find codec parameters')) {
        return `${fileName} appears to be unreadable or damaged, so it could not be converted to ${String(format || '').toUpperCase()}.`;
    }

    if (normalized.includes('moov atom not found') || normalized.includes('invalid argument')) {
        return `${fileName} uses an unsupported or damaged source format for this conversion.`;
    }

    if (normalized.includes('password') && normalized.includes('protected')) {
        return `${fileName} is password-protected, so ConvertHub could not open it automatically.`;
    }

    if (normalized.includes('source file could not be loaded') || normalized.includes('general input/output error')) {
        return `ConvertHub could not read ${fileName}. Make sure the file still exists and is not open in another app.`;
    }

    if (normalized.includes('not found at:')) {
        return `The required ${engine || 'conversion'} engine is not installed on this system yet.`;
    }

    return raw;
}

function parseDuration(str) {
    const match = str.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 3600
        + parseInt(match[2], 10) * 60
        + parseInt(match[3], 10)
        + parseInt(match[4], 10) / 100;
}

function parseTime(str) {
    const match = str.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 3600
        + parseInt(match[2], 10) * 60
        + parseInt(match[3], 10)
        + parseInt(match[4], 10) / 100;
}

function getQualityArgs(type, quality, format) {
    const q = Math.min(100, Math.max(1, parseInt(quality, 10) || 80));

    if (type === 'audio') {
        const bitrate = Math.round(64 + (q / 100) * (320 - 64));
        return ['-b:a', `${bitrate}k`];
    }

    if (type === 'video') {
        const crf = Math.round(28 - (q / 100) * 10);
        return ['-crf', `${crf}`];
    }

    if (type === 'image') {
        if (format === 'jpg' || format === 'jpeg') {
            const qscale = Math.round(31 - (q / 100) * 29);
            return ['-qscale:v', `${qscale}`];
        }
        if (format === 'webp') {
            return ['-quality', `${q}`];
        }
    }

    return [];
}

function getVideoQualityArgsForEncoder(encoder, quality) {
    const q = Math.min(100, Math.max(1, parseInt(quality, 10) || 80));
    const cq = Math.round(35 - (q / 100) * 17);
    const bitrate = Math.round(1500 + (q / 100) * 6500);

    switch (encoder) {
        case 'h264_nvenc':
            return ['-preset', 'p5', '-rc', 'vbr', '-cq', `${cq}`, '-b:v', '0'];
        case 'h264_qsv':
            return ['-global_quality', `${cq}`];
        case 'h264_amf':
        case 'h264_mf':
            return ['-b:v', `${bitrate}k`];
        case 'vp9_qsv':
        case 'av1_qsv':
            return ['-global_quality', `${cq}`];
        case 'av1_nvenc':
            return ['-preset', 'p5', '-cq', `${cq}`, '-b:v', '0'];
        case 'av1_amf':
        case 'av1_mf':
            return ['-b:v', `${bitrate}k`];
        default:
            return ['-crf', `${Math.round(28 - (q / 100) * 10)}`];
    }
}

function getImageQualityArgsForEncoder(encoder, quality) {
    const q = Math.min(100, Math.max(1, parseInt(quality, 10) || 80));

    switch (encoder) {
        case 'mjpeg_qsv': {
            const globalQuality = Math.round(1 + ((100 - q) / 100) * 30);
            return ['-global_quality', `${globalQuality}`];
        }
        default:
            return getQualityArgs('image', quality, 'jpg');
    }
}

function getFFmpegCodecArgs(type, format) {
    if (type === 'audio') {
        switch (format) {
            case 'mp3':
                return ['-c:a', 'libmp3lame'];
            case 'aac':
            case 'm4a':
                return ['-c:a', 'aac'];
            case 'flac':
                return ['-c:a', 'flac'];
            case 'ogg':
                return ['-c:a', 'libvorbis'];
            case 'wav':
                return ['-c:a', 'pcm_s16le'];
            case 'wma':
                return ['-c:a', 'wmav2'];
            default:
                return [];
        }
    }

    if (type === 'video') {
        switch (format) {
            case 'mp4':
            case 'mov':
                return ['-c:v', 'libx264', '-c:a', 'aac'];
            case 'mkv':
                return ['-c:v', 'libx264', '-c:a', 'aac'];
            case 'webm':
                return ['-c:v', 'libvpx-vp9', '-c:a', 'libopus'];
            case 'avi':
                return ['-c:v', 'mpeg4', '-c:a', 'libmp3lame'];
            case 'wmv':
                return ['-c:v', 'wmv2', '-c:a', 'wmav2'];
            case 'flv':
                return ['-c:v', 'flv', '-c:a', 'libmp3lame'];
            default:
                return [];
        }
    }

    if (type === 'image') {
        switch (format) {
            case 'png':
                return ['-c:v', 'png'];
            case 'jpg':
            case 'jpeg':
                return ['-c:v', 'mjpeg'];
            case 'webp':
                return ['-c:v', 'libwebp'];
            case 'bmp':
                return ['-c:v', 'bmp'];
            case 'tiff':
                return ['-c:v', 'tiff'];
            case 'gif':
                return ['-c:v', 'gif'];
            case 'ico':
                return ['-c:v', 'bmp'];
            default:
                return [];
        }
    }

    return [];
}

async function getAvailableFFmpegEncoders() {
    if (!ffmpegEncodersPromise) {
        ffmpegEncodersPromise = resolveExecutable('ffmpeg')
            .then((ffmpegPath) => {
                if (!ffmpegPath) {
                    return { code: 1, stdout: '' };
                }
                return runProcess(ffmpegPath, ['-hide_banner', '-encoders']);
            })
            .then(({ code, stdout }) => {
                if (code !== 0) {
                    return new Set();
                }

                const encoders = new Set();
                for (const line of stdout.split(/\r?\n/)) {
                    const match = line.match(/^\s*[VAS]\S*\s+([a-z0-9_]+)/i);
                    if (match) {
                        encoders.add(match[1].toLowerCase());
                    }
                }
                return encoders;
            })
            .catch(() => new Set());
    }

    return ffmpegEncodersPromise;
}

async function getFFmpegPlans(type, format, quality) {
    const normalizedFormat = normalizeFormat(format);

    const softwarePlan = {
        codecArgs: getFFmpegCodecArgs(type, normalizedFormat),
        qualityArgs: getQualityArgs(type, quality, normalizedFormat),
        isHardwareAccelerated: false
    };

    const hardwarePlanTemplates = HARDWARE_ENCODER_PLANS[normalizedFormat];
    if (!hardwarePlanTemplates || !['video', 'image'].includes(type)) {
        return [softwarePlan];
    }

    const encoders = await getAvailableFFmpegEncoders();
    const hardwarePlans = hardwarePlanTemplates
        .filter(({ encoder }) => encoders.has(encoder))
        .map(({ encoder, codecArgs }) => ({
            codecArgs,
            qualityArgs: type === 'video'
                ? getVideoQualityArgsForEncoder(encoder, quality)
                : getImageQualityArgsForEncoder(encoder, quality),
            isHardwareAccelerated: true,
            encoder
        }));

    return [...hardwarePlans, softwarePlan];
}

function deleteFileIfExists(targetPath) {
    return fs.promises.rm(targetPath, { force: true }).catch(() => undefined);
}

function createProgressReporter(onProgress, minIntervalMs = 120) {
    let lastPercent = -1;
    let lastSentAt = 0;

    return (percent) => {
        if (!onProgress || !Number.isFinite(percent)) {
            return;
        }

        const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)));
        const now = Date.now();
        const isFinalUpdate = normalizedPercent >= 100;

        if (normalizedPercent <= lastPercent && !isFinalUpdate) {
            return;
        }

        if (!isFinalUpdate && lastSentAt !== 0 && now - lastSentAt < minIntervalMs) {
            return;
        }

        lastPercent = normalizedPercent;
        lastSentAt = now;
        onProgress(normalizedPercent);
    };
}

function runFFmpegConversionAttempt({ ffmpegPath, inputPath, outputPath, codecArgs, qualityArgs, imageFrameArgs, onProgress }) {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-i',
            inputPath,
            ...codecArgs,
            ...qualityArgs,
            ...imageFrameArgs,
            outputPath
        ];

        let stderrOutput = '';
        let totalDuration = 0;

        const proc = spawn(ffmpegPath, args, { windowsHide: true });

        proc.stderr.on('data', (chunk) => {
            const msg = chunk.toString();
            stderrOutput += msg;

            if (totalDuration === 0) {
                totalDuration = parseDuration(stderrOutput);
            }

            if (totalDuration > 0 && onProgress) {
                const currentTime = parseTime(msg);
                if (currentTime > 0) {
                    const percent = Math.min(Math.round((currentTime / totalDuration) * 100), 99);
                    onProgress(percent);
                }
            }
        });

        proc.on('error', (error) => {
            reject(new Error(error.code === 'ENOENT'
                ? `ffmpeg not found at: ${ffmpegPath}`
                : `Failed to start ffmpeg: ${error.message}`));
        });

        proc.on('close', async (code) => {
            if (code !== 0) {
                const trimmed = stderrOutput.trim().split('\n').pop() || `ffmpeg exited with code ${code}`;
                return reject(new Error(trimmed));
            }

            if (!await pathExists(outputPath)) {
                return reject(new Error('Conversion finished, but no output file was created.'));
            }

            resolve({ success: true, outputPath });
        });
    });
}

function runProcess(executable, args, { onStdout, onStderr } = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(executable, args, { windowsHide: true });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            stdout += text;
            if (onStdout) onStdout(text);
        });

        proc.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            stderr += text;
            if (onStderr) onStderr(text);
        });

        proc.on('error', reject);
        proc.on('close', (code) => resolve({ code, stdout, stderr }));
    });
}

function convertWithFFmpeg({ inputPath, outputPath, format, type, quality, onProgress }) {
    return new Promise(async (resolve, reject) => {
        const ffmpegPath = await resolveExecutable('ffmpeg');
        if (!ffmpegPath) {
            return reject(new Error('ffmpeg not found at: ffmpeg'));
        }

        const normalizedFormat = normalizeFormat(format);
        const desiredOutput = path.format({
            dir: path.dirname(outputPath),
            name: path.parse(outputPath).name,
            ext: `.${normalizedFormat}`
        });
        const finalOutput = await createUniqueOutputPath(desiredOutput);

        const imageFrameArgs = type === 'image' && normalizedFormat !== 'gif' ? ['-frames:v', '1'] : [];
        const plans = await getFFmpegPlans(type, normalizedFormat, quality);
        const reportProgress = createProgressReporter(onProgress);
        let lastError = null;

        for (const plan of plans) {
            await deleteFileIfExists(finalOutput);

            try {
                await runFFmpegConversionAttempt({
                    ffmpegPath,
                    inputPath,
                    outputPath: finalOutput,
                    codecArgs: plan.codecArgs,
                    qualityArgs: plan.qualityArgs,
                    imageFrameArgs,
                    onProgress: reportProgress
                });

                reportProgress(100);
                return resolve({
                    success: true,
                    outputPath: finalOutput,
                    format: normalizedFormat,
                    hardwareAccelerated: Boolean(plan.isHardwareAccelerated),
                    encoder: plan.encoder || null
                });
            } catch (error) {
                lastError = new Error(simplifyEngineError(error.message, {
                    engine: 'ffmpeg',
                    inputPath,
                    format: normalizedFormat
                }));
            }
        }

        reject(lastError || new Error('FFmpeg conversion failed.'));
    });
}

async function renameIfNeeded(sourcePath, targetPath) {
    const normalizedSource = path.normalize(sourcePath).toLowerCase();
    const normalizedTarget = path.normalize(targetPath).toLowerCase();

    if (normalizedSource === normalizedTarget) {
        return sourcePath;
    }

    if (await pathExists(targetPath)) {
        await fs.promises.unlink(targetPath);
    }

    await fs.promises.rename(sourcePath, targetPath);
    return targetPath;
}

function convertWithLibreOffice({ inputPath, outputPath, format, onProgress }) {
    return new Promise(async (resolve, reject) => {
        const sofficePath = await resolveExecutable('libreoffice');
        if (!sofficePath) {
            return reject(new Error('LibreOffice not found at: soffice'));
        }

        const normalizedFormat = normalizeFormat(format);
        const outputDir = path.dirname(outputPath);
        const baseName = path.parse(inputPath).name;
        const expectedOutput = path.join(outputDir, `${baseName}.${normalizedFormat}`);
        const convertTarget = DOCUMENT_FILTERS[normalizedFormat] || normalizedFormat;
        const args = [
            '--headless',
            '--norestore',
            '--nolockcheck',
            '--convert-to',
            convertTarget,
            '--outdir',
            outputDir,
            inputPath
        ];

        const reportProgress = createProgressReporter(onProgress);
        reportProgress(10);

        const proc = spawn(sofficePath, args, { windowsHide: true });
        let stdoutOutput = '';
        let stderrOutput = '';

        proc.stdout.on('data', (chunk) => {
            stdoutOutput += chunk.toString();
            reportProgress(65);
        });

        proc.stderr.on('data', (chunk) => {
            stderrOutput += chunk.toString();
        });

        proc.on('error', (error) => {
            reject(new Error(`Failed to start LibreOffice: ${error.message}`));
        });

        proc.on('close', async (code) => {
            if (code !== 0) {
                const errorMsg = stderrOutput.trim() || stdoutOutput.trim() || `LibreOffice exited with code ${code}`;
                return reject(new Error(errorMsg));
            }

            if (!await pathExists(expectedOutput)) {
                return reject(new Error('LibreOffice did not produce the expected output file.'));
            }

            const finalOutput = await renameIfNeeded(expectedOutput, await createUniqueOutputPath(outputPath));
            reportProgress(100);
            resolve({ success: true, outputPath: finalOutput, format: normalizedFormat });
        });
    });
}

async function recompressArchive({ extractDir, outputPath, format, onProgress }) {
    const sevenZipPath = await resolveExecutable('7zip');
    if (!sevenZipPath) {
        throw new Error('7-Zip not found at: 7z');
    }
    const args = ['a', `-t${format}`, outputPath, path.join(extractDir, '*'), '-y'];

    const result = await runProcess(sevenZipPath, args, {
        onStdout: (msg) => {
            const percentMatch = msg.match(/(\d+)%/);
            if (percentMatch && onProgress) {
                onProgress(Math.min(parseInt(percentMatch[1], 10), 99));
            }
        }
    });

    if (result.code !== 0) {
        throw new Error(result.stderr.trim() || result.stdout.trim() || `7-Zip exited with code ${result.code}`);
    }
}

function convertWithSevenZip({ inputPath, outputPath, format, onProgress }) {
    return new Promise(async (resolve, reject) => {
        const sevenZipPath = await resolveExecutable('7zip');
        if (!sevenZipPath) {
            return reject(new Error('7-Zip not found at: 7z'));
        }

        const normalizedFormat = normalizeFormat(format);
        const inputExt = normalizeFormat(path.extname(inputPath));
        const desiredOutput = path.format({
            dir: path.dirname(outputPath),
            name: path.parse(outputPath).name,
            ext: `.${normalizedFormat}`
        });
        const finalOutput = await createUniqueOutputPath(desiredOutput);
        const reportProgress = createProgressReporter(onProgress);
        let tempRoot = null;

        try {
            if (!ARCHIVE_FORMATS.has(inputExt)) {
                const args = ['a', `-t${normalizedFormat}`, finalOutput, inputPath, '-y'];
                reportProgress(10);

                const result = await runProcess(sevenZipPath, args, {
                    onStdout: (msg) => {
                        const percentMatch = msg.match(/(\d+)%/);
                        if (percentMatch) {
                            reportProgress(Math.min(parseInt(percentMatch[1], 10), 99));
                        }
                    }
                });

                if (result.code !== 0) {
                    throw new Error(result.stderr.trim() || result.stdout.trim() || `7-Zip exited with code ${result.code}`);
                }

                if (!await pathExists(finalOutput)) {
                    throw new Error('Archive conversion finished, but no output file was created.');
                }

                reportProgress(100);
                return resolve({ success: true, outputPath: finalOutput, format: normalizedFormat });
            }

            tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'converthub-archive-'));
            const extractDir = path.join(tempRoot, 'extracted');
            await ensureDirectoryExists(extractDir);

            reportProgress(10);

            const extractArgs = ['x', inputPath, `-o${extractDir}`, '-y'];
            const extractResult = await runProcess(sevenZipPath, extractArgs, {
                onStdout: (msg) => {
                    const percentMatch = msg.match(/(\d+)%/);
                    if (percentMatch) {
                        const percent = Math.min(Math.round(parseInt(percentMatch[1], 10) * 0.5), 50);
                        reportProgress(percent);
                    }
                }
            });

            if (extractResult.code !== 0) {
                throw new Error(extractResult.stderr.trim() || extractResult.stdout.trim() || `7-Zip exited with code ${extractResult.code}`);
            }

            reportProgress(55);
            await recompressArchive({ extractDir, outputPath: finalOutput, format: normalizedFormat, onProgress: (value) => {
                const scaled = 55 + Math.round(value * 0.45);
                reportProgress(Math.min(scaled, 99));
            } });

            if (!await pathExists(finalOutput)) {
                throw new Error('Archive conversion finished, but no output file was created.');
            }

            reportProgress(100);
            resolve({ success: true, outputPath: finalOutput, format: normalizedFormat });
        } catch (error) {
            reject(new Error(simplifyEngineError(error.message, {
                engine: '7-Zip',
                inputPath,
                format: normalizedFormat
            })));
        } finally {
            if (tempRoot) {
                await fs.promises.rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
            }
        }
    });
}

async function prepareBatchJobs(jobs) {
    const reservedPaths = new Set();

    return Promise.all(jobs.map(async (job) => {
        if (!job || !job.outputPath) {
            return job;
        }

        const normalizedFormat = normalizeFormat(job.format);
        const desiredOutput = path.format({
            dir: path.dirname(job.outputPath),
            name: path.parse(job.outputPath).name,
            ext: normalizedFormat ? `.${normalizedFormat}` : path.extname(job.outputPath)
        });

        return {
            ...job,
            format: normalizedFormat,
            outputPath: await createUniqueOutputPath(desiredOutput, reservedPaths)
        };
    }));
}

async function convert({ inputPath, outputPath, format, type, quality }, onProgress) {
    const normalizedFormat = await validateRequest({ inputPath, outputPath, format, type });

    let resolvedType = type;
    if (!resolvedType) {
        resolvedType = detectTypeFromExtension(path.extname(inputPath));
    }
    if (!resolvedType) {
        throw new Error('Unable to determine conversion type from the selected file.');
    }

    const engine = getEngineForType(resolvedType);
    if (!engine) {
        throw new Error(`Unsupported conversion type: ${resolvedType}`);
    }

    try {
        switch (engine) {
            case 'ffmpeg':
                return await convertWithFFmpeg({
                    inputPath,
                    outputPath,
                    format: normalizedFormat,
                    type: resolvedType,
                    quality,
                    onProgress
                });
            case 'libreoffice':
                return await convertWithLibreOffice({
                    inputPath,
                    outputPath,
                    format: normalizedFormat,
                    onProgress
                });
            case '7zip':
                return await convertWithSevenZip({
                    inputPath,
                    outputPath,
                    format: normalizedFormat,
                    onProgress
                });
            default:
                throw new Error(`Unknown engine for type: ${resolvedType}`);
        }
    } catch (error) {
        throw new Error(simplifyEngineError(error.message, {
            engine,
            inputPath,
            format: normalizedFormat
        }));
    }
}

async function convertBatch({ jobs }, onProgress) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
        throw new Error('Batch conversion requires at least one job.');
    }

    const preparedJobs = await prepareBatchJobs(jobs);
    const results = new Array(preparedJobs.length);
    const engineActiveCounts = new Map();
    const pendingIndexes = preparedJobs.map((_, index) => index);
    const maxWorkers = getBatchWorkerLimit(preparedJobs.length);

    await new Promise((resolve) => {
        let activeJobs = 0;
        let completedJobs = 0;

        const finishJob = () => {
            completedJobs += 1;
            if (completedJobs >= preparedJobs.length) {
                resolve();
                return;
            }

            tryStartJobs();
        };

        const tryStartJobs = () => {
            while (activeJobs < maxWorkers) {
                const nextPendingPosition = pendingIndexes.findIndex((index) => {
                    const engine = getJobEngine(preparedJobs[index] || {});
                    const activeForEngine = engineActiveCounts.get(engine) || 0;
                    return activeForEngine < getEngineConcurrencyLimit(engine);
                });

                if (nextPendingPosition === -1) {
                    break;
                }

                const index = pendingIndexes.splice(nextPendingPosition, 1)[0];
                const job = preparedJobs[index] || {};
                const engine = getJobEngine(job);

                activeJobs += 1;
                engineActiveCounts.set(engine, (engineActiveCounts.get(engine) || 0) + 1);

                convert(job, (percent) => {
                    if (onProgress) {
                        onProgress({
                            batchIndex: index,
                            totalJobs: preparedJobs.length,
                            fileId: job.fileId || null,
                            percent
                        });
                    }
                }).then((result) => {
                    results[index] = {
                        success: true,
                        fileId: job.fileId || null,
                        inputPath: job.inputPath,
                        outputPath: result.outputPath,
                        format: result.format,
                        hardwareAccelerated: Boolean(result.hardwareAccelerated),
                        encoder: result.encoder || null
                    };
                }).catch((error) => {
                    results[index] = {
                        success: false,
                        fileId: job.fileId || null,
                        inputPath: job.inputPath,
                        outputPath: job.outputPath,
                        format: normalizeFormat(job.format),
                        error: error.message || 'Conversion failed.'
                    };
                }).finally(() => {
                    activeJobs -= 1;
                    const remainingActiveForEngine = (engineActiveCounts.get(engine) || 1) - 1;
                    if (remainingActiveForEngine <= 0) {
                        engineActiveCounts.delete(engine);
                    } else {
                        engineActiveCounts.set(engine, remainingActiveForEngine);
                    }

                    finishJob();
                });
            }
        };

        tryStartJobs();
    });

    const successCount = results.filter((result) => result.success).length;
    const errorCount = results.length - successCount;

    return {
        success: errorCount === 0,
        results,
        totalJobs: preparedJobs.length,
        successCount,
        errorCount
    };
}

module.exports = {
    convert,
    convertBatch,
    getEngineStatus,
    FORMAT_TYPES,
    FFMPEG_PATH: ENGINE_DEFINITIONS.ffmpeg.candidates[0],
    SOFFICE_PATH: ENGINE_DEFINITIONS.libreoffice.candidates[0],
    SEVENZIP_PATH: ENGINE_DEFINITIONS['7zip'].candidates[0]
};
