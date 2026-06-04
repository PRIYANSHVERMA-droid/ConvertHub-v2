const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, nativeTheme, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { initUpdater } = require('./core/updater');

let desktopNotificationsEnabled = true;
let mainWindow;
const PROGRESS_EVENT_INTERVAL_MS = 120;
let conversionManager = null;
let imageProcessor = null;
let pdfProcessor = null;
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
    // Register custom protocol handler
    protocol.handle('converthub-media', (request) => {
        try {
            const url = new URL(request.url);
            const filePath = url.searchParams.get('path');
            if (!filePath) return new Response('Path missing', { status: 400 });
            return net.fetch(pathToFileURL(filePath).toString());
        } catch (e) {
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
    ipcMain.handle('open-folder', (_e, p) => shell.openPath(p));
    ipcMain.handle('path-exists', async (_e, { path: p }) => {
        try { await fs.promises.access(p, fs.constants.F_OK); return true; } catch { return false; }
    });
    ipcMain.handle('get-file-size', async (_e, { filePath: p }) => {
        try { return (await fs.promises.stat(p)).size; } catch { return 0; }
    });
    ipcMain.handle('get-default-output', () => app.getPath('downloads'));
    ipcMain.handle('get-app-version', () => app.getVersion());

    // History & Presets
    ipcMain.handle('get-history', () => getHistoryStore().getHistory());
    ipcMain.handle('clear-history', () => getHistoryStore().clearHistory());
    ipcMain.handle('get-presets', () => getPresetStore().getPresets());
    ipcMain.handle('save-preset', (_e, { type, preset }) => getPresetStore().savePreset(type, preset));
    ipcMain.handle('delete-preset', (_e, { type, presetId }) => getPresetStore().deletePreset(type, presetId));
    ipcMain.handle('get-system-theme', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));
    ipcMain.handle('set-notifications-enabled', (_e, enabled) => { desktopNotificationsEnabled = !!enabled; return true; });

    // Processors
    ipcMain.handle('process-image', (_e, payload) => getImageProcessor().processImage(payload));
    ipcMain.handle('pdf:create', (_e, data) => getPDFProcessor().compileImagesToPDF(data));
    ipcMain.handle('pdf:merge', (_e, data) => getPDFProcessor().mergePDFs(data, (p) => {
        relayConversionProgress({ fileId: data?.pdfName || 'merge', percent: p.percent || 0 });
    }));
    ipcMain.handle('pdf:save-page', (_e, data) => getPDFProcessor().saveExtractedPage(data));
    ipcMain.handle('pdf:create-images-zip', (_e, data) => getPDFProcessor().createImagesZip(data));
    ipcMain.handle('pdf:watermark', (_e, data) => getPDFProcessor().watermarkPDF(data));
    ipcMain.handle('pdf:compress-lossless', (_e, data) => getPDFProcessor().compressPDFLossless(data));
    ipcMain.handle('pdf:organize', (_e, data) => getPDFProcessor().organizePDF(data));
    ipcMain.handle('pdf:read-folder-images', async (_e, { folderPath }) => {
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
        await scan(folderPath); return { success: true, files: results };
    });

    ipcMain.on('show-notification', (_e, { title, body, folderToOpen }) => {
        const n = new Notification({ title, body, icon: appIconPath });
        n.show();
        if (folderToOpen) n.on('click', () => shell.openPath(folderToOpen));
    });

    // Delete file handler
    ipcMain.handle('delete-file', async (_e, { filePath }) => {
        try {
            await fs.promises.rm(filePath, { force: true });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // Open path handler
    ipcMain.handle('open:path', (_e, p) => shell.openPath(p));

    // Register global history listener once app is ready
    const manager = getConversionManager();
    manager.conversionEvents.on('job-complete', (record) => {
        getHistoryStore().appendJob(record);
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
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('system-theme-updated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
});
