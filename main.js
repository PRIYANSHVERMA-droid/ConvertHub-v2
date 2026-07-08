const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, nativeTheme, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');
const { initUpdater } = require('./core/updater');

global.activeChildProcesses = new Set();

// Register custom protocol as privileged to allow video streaming and fetching
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'converthub-media',
        privileges: {
            standard: true,
            secure: true,
            stream: true,
            bypassCSP: true,
            supportFetchAPI: true,
            corsEnabled: true
        }
    }
]);

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.aac': 'audio/aac',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf'
    };
    return map[ext] || 'application/octet-stream';
}

// IPC sender origin validation
function verifySender(event) {
    if (!event || !event.senderFrame) {
        throw new Error('Access Denied: Invalid sender');
    }
    const url = event.senderFrame.url;
    const normalizedUrl = url.toLowerCase().replace(/\\/g, '/');
    const isIndexHtml = normalizedUrl.includes('ui/index.html');
    const isAboutHtml = normalizedUrl.includes('ui/about.html');
    if (!normalizedUrl.startsWith('file://') || (!isIndexHtml && !isAboutHtml)) {
        throw new Error('Access Denied: Unauthorized sender origin.');
    }
}

// Override ipcMain.handle and ipcMain.on to secure all IPC channels automatically
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => {
    return originalHandle(channel, async (event, ...args) => {
        verifySender(event);
        return handler(event, ...args);
    });
};

const originalOn = ipcMain.on.bind(ipcMain);
ipcMain.on = (channel, handler) => {
    return originalOn(channel, (event, ...args) => {
        try {
            verifySender(event);
            handler(event, ...args);
        } catch (e) {
            console.error(`[main] Blocked unauthorized message on channel ${channel}:`, e.message);
        }
    });
};

let desktopNotificationsEnabled = true;
let mainWindow;
const PROGRESS_EVENT_INTERVAL_MS = 120;
let conversionManager = null;
let imageProcessor = null;
let pdfProcessor = null;
let videoProcessor = null;
let _historyStore = null;
let _presetStore = null;
const progressDispatchState = new Map();
const preloadPath = path.resolve(__dirname, 'preload.js');
const appIconPath = path.join(__dirname, 'assets', 'app-icon.ico');

// Lazy loading helpers
function getHistoryStore() {
    if (!_historyStore) _historyStore = require('./core/historyStore');
    return _historyStore;
}

function getPresetStore() {
    if (!_presetStore) _presetStore = require('./core/presetStore');
    return _presetStore;
}

function getConversionManager() {
    if (!conversionManager) {
        conversionManager = require('./core/conversionManager');
    }
    return conversionManager;
}

function getImageProcessor() {
    if (!imageProcessor) {
        imageProcessor = require('./engines/imageProcessor');
    }
    return imageProcessor;
}

function getPDFProcessor() {
    if (!pdfProcessor) {
        pdfProcessor = require('./core/pdfProcessor');
    }
    return pdfProcessor;
}

function getVideoProcessor() {
    if (!videoProcessor) {
        videoProcessor = require('./core/videoProcessor');
    }
    return videoProcessor;
}

function getTitleBarOverlayOptions(theme = 'dark') {
    if (theme === 'light') {
        return { color: '#eef1f7', symbolColor: '#475569', height: 60 };
    }
    return { color: '#15192a', symbolColor: '#e2e8f0', height: 60 };
}

function getTargetWindow(sender) {
    if (sender) {
        const senderWindow = BrowserWindow.fromWebContents(sender);
        if (senderWindow && !senderWindow.isDestroyed()) return senderWindow;
    }
    if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
    return BrowserWindow.getFocusedWindow();
}

function relayConversionProgress(payload) {
    const progressKey = payload.fileId || '__single__';
    let state = progressDispatchState.get(progressKey);
    if (!state) {
        state = { lastSentAt: 0, lastPercent: -1, timeout: null, pendingPayload: null };
        progressDispatchState.set(progressKey, state);
    }

    const now = Date.now();
    const isFinalUpdate = payload.percent >= 100;
    const elapsed = now - state.lastSentAt;

    const flush = (nextPayload) => {
        if (state.timeout) { clearTimeout(state.timeout); state.timeout = null; }
        state.pendingPayload = null;
        state.lastSentAt = Date.now();
        state.lastPercent = nextPayload.percent;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('conversion-progress', nextPayload);
        }
        if (nextPayload.percent >= 100) progressDispatchState.delete(progressKey);
    };

    if (isFinalUpdate || payload.percent <= state.lastPercent || elapsed >= PROGRESS_EVENT_INTERVAL_MS) {
        flush(payload);
    } else {
        state.pendingPayload = payload;
        if (!state.timeout) {
            state.timeout = setTimeout(() => {
                const latestPayload = state.pendingPayload;
                if (latestPayload) flush(latestPayload);
                else progressDispatchState.delete(progressKey);
            }, Math.max(PROGRESS_EVENT_INTERVAL_MS - elapsed, 0));
        }
    }
}

let aboutWindow = null;

function createAboutWindow() {
    if (aboutWindow && !aboutWindow.isDestroyed()) {
        aboutWindow.focus();
        return;
    }

    aboutWindow = new BrowserWindow({
        width: 480,
        height: 540,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: 'About ConvertHub',
        parent: mainWindow,
        modal: true,
        icon: appIconPath,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    aboutWindow.setMenuBarVisibility(false);
    aboutWindow.loadFile(path.join(__dirname, 'ui/about.html'));

    aboutWindow.on('closed', () => {
        aboutWindow = null;
    });
}

function setupApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About ConvertHub',
                    click: () => createAboutWindow()
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    console.log('[main] Creating window with preload:', preloadPath);
    mainWindow = new BrowserWindow({
        width: 1200, height: 800, minWidth: 950, minHeight: 650,
        frame: false, icon: appIconPath, backgroundColor: '#0f111a',
        webPreferences: { preload: preloadPath, nodeIntegration: false, contextIsolation: true },
        titleBarStyle: 'hidden'
    });

    mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });

    const emitWindowState = () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window-state-changed', { isMaximized: mainWindow.isMaximized() });
        }
    };

    mainWindow.on('maximize', emitWindowState);
    mainWindow.on('unmaximize', emitWindowState);
    mainWindow.on('enter-full-screen', emitWindowState);
    mainWindow.on('leave-full-screen', emitWindowState);
    mainWindow.webContents.once('did-finish-load', emitWindowState);

    initUpdater(mainWindow);
}

app.whenReady().then(() => {
    // Register custom protocol handler with support for Range requests and fs.createReadStream
    protocol.handle('converthub-media', async (request) => {
        try {
            const url = new URL(request.url);
            const filePath = url.searchParams.get('path');
            if (!filePath) return new Response('Path missing', { status: 400 });
            
            const resolvedPath = path.resolve(filePath);
            const ext = path.extname(resolvedPath).toLowerCase();
            const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.pdf', '.mp3', '.wav', '.ogg', '.aac', '.mp4', '.mkv', '.webm', '.mov'];
            if (!allowedExts.includes(ext)) {
                return new Response('Forbidden: Invalid file type or extension', { status: 403 });
            }

            // Verify file exists and is readable
            try {
                await fs.promises.access(resolvedPath, fs.constants.R_OK);
            } catch {
                return new Response('File not found', { status: 404 });
            }

            const stat = await fs.promises.stat(resolvedPath);
            const size = stat.size;
            const mimeType = getMimeType(resolvedPath);
            const range = request.headers.get('range');

            if (range) {
                // Parse Range header (e.g. "bytes=0-1000" or "bytes=500-")
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

                if (isNaN(start) || start < 0 || start >= size || end < start || end >= size) {
                    return new Response('Requested range not satisfiable', {
                        status: 416,
                        headers: {
                            'Content-Range': `bytes */${size}`,
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                const chunkSize = (end - start) + 1;
                const fileStream = fs.createReadStream(resolvedPath, { start, end });
                
                return new Response(fileStream, {
                    status: 206,
                    headers: {
                        'Content-Range': `bytes ${start}-${end}/${size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize.toString(),
                        'Content-Type': mimeType,
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                const fileStream = fs.createReadStream(resolvedPath);
                return new Response(fileStream, {
                    status: 200,
                    headers: {
                        'Content-Length': size.toString(),
                        'Content-Type': mimeType,
                        'Accept-Ranges': 'bytes',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        } catch (e) {
            console.error('[main] converthub-media protocol error:', e);
            return new Response('Error: ' + e.message, { status: 500 });
        }
    });

    // Window controls
    ipcMain.handle('window:minimize', (e) => getTargetWindow(e.sender)?.minimize());
    ipcMain.handle('window:maximize', (e) => {
        const win = getTargetWindow(e.sender);
        if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
    });
    ipcMain.handle('window:close', (e) => getTargetWindow(e.sender)?.close());
    ipcMain.handle('window:isMaximized', (e) => !!getTargetWindow(e.sender)?.isMaximized());
    ipcMain.handle('set-titlebar-theme', (e, theme) => {
        try {
            getTargetWindow(e.sender)?.setTitleBarOverlay?.(getTitleBarOverlayOptions(theme));
        } catch (err) {
            // Titlebar overlay not enabled/supported in current window setup
        }
    });

    // File Conversion
    ipcMain.handle('convert-file', async (_e, data) => {
        const mgr = getConversionManager();
        const ctrl = mgr.activateCancellationController(mgr.createCancellationController(data?.fileId || 'single'));
        try {
            const res = await mgr.convert(data, (p) => relayConversionProgress({ fileId: data.fileId, percent: p }), ctrl);
            return { success: true, ...res };
        } catch (err) {
            return { success: false, cancelled: mgr.isCancellationError?.(err), error: err.message };
        } finally { mgr.releaseCancellationController?.(ctrl); }
    });

    ipcMain.handle('convert-batch', async (_e, data) => {
        const mgr = getConversionManager();
        const ctrl = mgr.activateCancellationController(mgr.createCancellationController('batch'));
        try {
            return await mgr.convertBatch(data, (p) => relayConversionProgress(p), ctrl);
        } catch (err) {
            return { success: false, cancelled: mgr.isCancellationError?.(err), error: err.message };
        } finally { mgr.releaseCancellationController?.(ctrl); }
    });

    ipcMain.handle('cancel-conversion', () => getConversionManager().cancelActiveConversions?.());
    ipcMain.handle('cancel-file', (_e, { fileId }) => getConversionManager().cancelConversionById?.(fileId));
    ipcMain.handle('get-formats', () => getConversionManager().FORMAT_TYPES);
    ipcMain.handle('get-engine-status', () => getConversionManager().getEngineStatus());

    // UI Helpers
    ipcMain.handle('select-output-folder', async () => {
        const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
        return res.canceled ? null : res.filePaths[0];
    });
    ipcMain.handle('select-files', async () => {
        const res = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'] });
        return res.canceled ? [] : res.filePaths;
    });
    ipcMain.handle('open-folder', async (_e, p) => {
        try {
            const resolvedPath = path.resolve(p);
            const stat = await fs.promises.stat(resolvedPath);
            if (!stat.isDirectory()) {
                throw new Error('Access Denied: Path is not a directory.');
            }
            return await shell.openPath(resolvedPath);
        } catch (e) {
            console.error('[main] open-folder blocked:', e.message);
            return '';
        }
    });
    ipcMain.handle('path-exists', async (_e, { path: p }) => {
        try { await fs.promises.access(p, fs.constants.F_OK); return true; } catch { return false; }
    });
    ipcMain.handle('get-file-size', async (_e, { filePath: p }) => {
        try { return (await fs.promises.stat(p)).size; } catch { return 0; }
    });
    ipcMain.handle('get-default-output', () => app.getPath('downloads'));
    ipcMain.handle('get-app-version', () => app.getVersion());
    ipcMain.handle('open-external', (event, url) => {
        const allowedDomains = ['github.com', 'ffmpeg.org', 'libreoffice.org', '7-zip.org', 'evermeet.cx', 'johnvansickle.com'];
        try {
            const parsed = new URL(url);
            if (allowedDomains.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))) {
                shell.openExternal(url);
            }
        } catch (_) {}
    });

    // History & Presets
    ipcMain.handle('get-history', () => getHistoryStore().getHistory());
    ipcMain.handle('clear-history', () => getHistoryStore().clearHistory());
    ipcMain.handle('get-presets', () => getPresetStore().getPresets());
    ipcMain.handle('save-preset', (_e, { type, preset }) => getPresetStore().savePreset(type, preset));
    ipcMain.handle('delete-preset', (_e, { type, presetId }) => getPresetStore().deletePreset(type, presetId));
    ipcMain.handle('get-system-theme', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));
    ipcMain.handle('set-notifications-enabled', (_e, enabled) => { desktopNotificationsEnabled = !!enabled; return true; });

    // Processors
    ipcMain.handle('process-image', (_e, payload) => getImageProcessor().processImage(payload, (p) => {
        relayConversionProgress({ fileId: payload?.inputPath || 'image-process', percent: p.percent || 0 });
    }));
    ipcMain.handle('pdf:create', (_e, data) => getPDFProcessor().compileImagesToPDF(data, (p) => {
        relayConversionProgress({ fileId: data?.pdfName || 'pdf-create', percent: p.percent || 0 });
    }));
    ipcMain.handle('pdf:merge', (_e, data) => getPDFProcessor().mergePDFs(data, (p) => {
        relayConversionProgress({ fileId: data?.pdfName || 'merge', percent: p.percent || 0 });
    }));
    ipcMain.handle('pdf:save-page', (_e, data) => getPDFProcessor().saveExtractedPage(data));
    ipcMain.handle('pdf:create-images-zip', (_e, data) => getPDFProcessor().createImagesZip(data));
    ipcMain.handle('pdf:watermark', (_e, data) => getPDFProcessor().watermarkPDF(data));
    ipcMain.handle('pdf:compress-lossless', (_e, data) => getPDFProcessor().compressPDFLossless(data));
    ipcMain.handle('pdf:organize', (_e, data) => getPDFProcessor().organizePDF(data));
    ipcMain.handle('pdf:read-folder-images', async (_e, { folderPath }) => {
        try {
            const stat = await fs.promises.stat(folderPath);
            if (!stat.isDirectory()) {
                return { success: false, error: 'Not a directory' };
            }
            const results = [];
            const scan = async (dir) => {
                for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
                    const full = path.join(dir, entry.name);
                    if (entry.isDirectory()) await scan(full);
                    else if (entry.isFile() && ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(entry.name).toLowerCase())) {
                        results.push({ name: entry.name, path: full, size: (await fs.promises.stat(full)).size });
                    }
                }
            };
            await scan(folderPath);
            return { success: true, files: results };
        } catch (err) {
            console.error('[main] Failed to read folder images:', err);
            return { success: false, error: err.message };
        }
    });

    // --- VIDEO TOOLKIT ---
    ipcMain.handle('video:getMediaInfo', async (event, { filePath }) => {
        try {
            return await getVideoProcessor().getMediaInfo(filePath);
        } catch (err) {
            console.error('[main] Failed to get media info:', err);
            throw new Error(`Media info retrieval failed: ${err.message}`);
        }
    });

    ipcMain.handle('video:trim', async (event, options) => {
        const proc = getVideoProcessor();
        const jobId = options.jobId || require('crypto').randomUUID();
        const controller = new AbortController();
        proc.activeJobs.set(jobId, {
            controller,
            operation: 'Trim',
            inputFile: options.inputPath,
            startedAt: Date.now()
        });

        try {
            await proc.trimVideo({
                jobId,
                ...options,
                signal: controller.signal,
                onProgress: (percent) => {
                    event.sender.send('video:progress', { jobId, percent, operation: 'Trim' });
                }
            });
            return { success: true, jobId };
        } catch (err) {
            console.error('[main] Video trim failed:', err);
            return { success: false, error: err.message, jobId };
        } finally {
            proc.activeJobs.delete(jobId);
        }
    });

    ipcMain.handle('video:merge', async (event, options) => {
        const proc = getVideoProcessor();
        const jobId = options.jobId || require('crypto').randomUUID();
        const controller = new AbortController();
        proc.activeJobs.set(jobId, {
            controller,
            operation: 'Merge',
            inputFile: options.inputPaths[0],
            startedAt: Date.now()
        });

        try {
            await proc.mergeVideos({
                jobId,
                ...options,
                signal: controller.signal,
                onProgress: (percent) => {
                    event.sender.send('video:progress', { jobId, percent, operation: 'Merge' });
                }
            });
            return { success: true, jobId };
        } catch (err) {
            console.error('[main] Video merge failed:', err);
            return { success: false, error: err.message, jobId };
        } finally {
            proc.activeJobs.delete(jobId);
        }
    });

    ipcMain.handle('video:extractAudio', async (event, options) => {
        const proc = getVideoProcessor();
        const jobId = options.jobId || require('crypto').randomUUID();
        const controller = new AbortController();
        proc.activeJobs.set(jobId, {
            controller,
            operation: 'Audio Extract',
            inputFile: options.inputPath,
            startedAt: Date.now()
        });

        try {
            await proc.extractAudio({
                jobId,
                ...options,
                signal: controller.signal,
                onProgress: (percent) => {
                    event.sender.send('video:progress', { jobId, percent, operation: 'Audio Extract' });
                }
            });
            return { success: true, jobId };
        } catch (err) {
            console.error('[main] Video audio extraction failed:', err);
            return { success: false, error: err.message, jobId };
        } finally {
            proc.activeJobs.delete(jobId);
        }
    });

    ipcMain.handle('video:compress', async (event, options) => {
        const proc = getVideoProcessor();
        const jobId = options.jobId || require('crypto').randomUUID();
        const controller = new AbortController();
        proc.activeJobs.set(jobId, {
            controller,
            operation: 'Compress',
            inputFile: options.inputPath,
            startedAt: Date.now()
        });

        try {
            await proc.compressVideo({
                jobId,
                ...options,
                signal: controller.signal,
                onProgress: ({ percent, estimatedReduction }) => {
                    event.sender.send('video:progress', { jobId, percent, estimatedReduction, operation: 'Compress' });
                }
            });
            return { success: true, jobId };
        } catch (err) {
            console.error('[main] Video compression failed:', err);
            return { success: false, error: err.message, jobId };
        } finally {
            proc.activeJobs.delete(jobId);
        }
    });

    ipcMain.handle('video:hardcodeSubtitles', async (event, options) => {
        const proc = getVideoProcessor();
        const jobId = options.jobId || require('crypto').randomUUID();
        const controller = new AbortController();
        proc.activeJobs.set(jobId, {
            controller,
            operation: 'Subtitles',
            inputFile: options.inputPath,
            startedAt: Date.now()
        });

        try {
            const res = await proc.hardcodeSubtitles({
                jobId,
                ...options,
                signal: controller.signal,
                onProgress: (percent) => {
                    event.sender.send('video:progress', { jobId, percent, operation: 'Subtitles' });
                }
            });
            return { success: true, ...res, jobId };
        } catch (err) {
            console.error('[main] Subtitle burn failed:', err);
            return { success: false, error: err.message, jobId };
        } finally {
            proc.activeJobs.delete(jobId);
        }
    });

    ipcMain.handle('video:cancel', async (event, { jobId }) => {
        try {
            return getVideoProcessor().cancelJob(jobId);
        } catch (err) {
            console.error('[main] Failed to cancel video job:', err);
            return false;
        }
    });

    ipcMain.handle('video:getActiveJobs', async () => {
        try {
            return getVideoProcessor().getActiveJobs();
        } catch (err) {
            console.error('[main] Failed to get active video jobs:', err);
            return [];
        }
    });

    ipcMain.on('show-notification', (_e, { title, body, folderToOpen }) => {
        const n = new Notification({ title, body, icon: appIconPath });
        n.show();
        if (folderToOpen) n.on('click', () => shell.openPath(folderToOpen));
    });

    // Delete file handler
    ipcMain.handle('delete-file', async (_e, { filePath }) => {
        try {
            const resolvedPath = path.resolve(filePath);
            const downloadsPath = app.getPath('downloads');
            const userDataPath = app.getPath('userData');
            const tempPath = os.tmpdir();
            
            const isAllowed = resolvedPath.startsWith(downloadsPath) ||
                              resolvedPath.startsWith(userDataPath) ||
                              resolvedPath.startsWith(tempPath);
                              
            if (!isAllowed) {
                throw new Error('Access Denied: Cannot delete files outside allowed user spaces.');
            }
            await fs.promises.rm(resolvedPath, { force: true });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // Open path handler
    ipcMain.handle('open:path', async (_e, p) => {
        try {
            const resolvedPath = path.resolve(p);
            const ext = path.extname(resolvedPath).toLowerCase();
            const blockedExts = ['.exe', '.bat', '.cmd', '.msi', '.lnk', '.vbs', '.js', '.wsf', '.sh'];
            if (blockedExts.includes(ext)) {
                throw new Error('Access Denied: Opening executable files is disabled for security.');
            }
            return await shell.openPath(resolvedPath);
        } catch (e) {
            console.error('[main] open:path blocked:', e.message);
            return '';
        }
    });

    // Register global history listener once app is ready
    const manager = getConversionManager();
    manager.conversionEvents.on('job-complete', (record) => {
        getHistoryStore().appendJob(record)
            .then(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('history-updated');
                }
            })
            .catch(err =>
                console.error('[main] Failed to append job to history:', err)
            );
        if (!desktopNotificationsEnabled || !mainWindow || mainWindow.isDestroyed()) return;
        if (mainWindow.isFocused()) {
            mainWindow.webContents.send('conversion-complete-focused', record);
        } else {
            const n = new Notification({
                title: 'ConvertHub — Conversion Complete',
                body: `${record.inputFiles.length} files converted to ${record.outputFormat.toUpperCase()}.`,
                icon: appIconPath
            });
            n.on('click', () => { shell.openPath(record.outputPath); mainWindow.focus(); });
            n.show();
            mainWindow.webContents.send('conversion-complete-background', record);
        }
    });

    createWindow();
    setupApplicationMenu();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('system-theme-updated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
});

app.on('will-quit', () => {
    // Kill any active child processes
    if (global.activeChildProcesses) {
        const { spawn } = require('child_process');
        for (const proc of global.activeChildProcesses) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { windowsHide: true });
                } else {
                    process.kill(-proc.pid, 'SIGKILL');
                }
            } catch (e) {
                try { proc.kill('SIGKILL'); } catch (_) {}
            }
        }
        global.activeChildProcesses.clear();
    }

    try {
        const tempDir = os.tmpdir();
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
            if (file.startsWith('converthub-archive-') || file.startsWith('converthub_pdf_')) {
                const fullPath = path.join(tempDir, file);
                try {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                } catch (e) {
                    // Ignore individual file removal errors on quit
                }
            }
        }
    } catch (err) {
        console.error('[main] Failed to clean up temp files on exit:', err);
    }
});
