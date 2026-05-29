const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { initUpdater } = require('./core/updater');

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'converthub-media',
        privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            bypassCSP: true,
            stream: true
        }
    }
]);


let mainWindow;
let conversionManager = null;
const PROGRESS_EVENT_INTERVAL_MS = 120;
const progressDispatchState = new Map();
const appIconPath = path.join(__dirname, 'assets', 'app-icon.ico');
const preloadPath = path.resolve(__dirname, 'preload.js');

function getTitleBarOverlayOptions(theme = 'dark') {
    if (theme === 'light') {
        return {
            color: '#eef1f7',
            symbolColor: '#475569',
            height: 60
        };
    }

    return {
        color: '#15192a',
        symbolColor: '#e2e8f0',
        height: 60
    };
}

function getTargetWindow(sender) {
    if (sender) {
        const senderWindow = BrowserWindow.fromWebContents(sender);
        if (senderWindow && !senderWindow.isDestroyed()) {
            return senderWindow;
        }
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
        return mainWindow;
    }

    return BrowserWindow.getFocusedWindow();
}

function getConversionManager() {
    if (!conversionManager) {
        conversionManager = require('./core/conversionManager');
    }

    return conversionManager;
}

function sendProgressToRenderer(payload) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send('conversion-progress', payload);
}

function relayConversionProgress(payload) {
    const progressKey = payload.fileId || '__single__';
    let state = progressDispatchState.get(progressKey);
    
    if (!state) {
        state = {
            lastSentAt: 0,
            lastPercent: -1,
            timeout: null,
            pendingPayload: null
        };
        progressDispatchState.set(progressKey, state);
    }

    const now = Date.now();
    const isFinalUpdate = payload.percent >= 100;
    const elapsed = now - state.lastSentAt;

    const flush = (nextPayload) => {
        if (state.timeout) {
            clearTimeout(state.timeout);
            state.timeout = null;
        }

        state.pendingPayload = null;
        state.lastSentAt = Date.now();
        state.lastPercent = nextPayload.percent;
        sendProgressToRenderer(nextPayload);

        if (nextPayload.percent >= 100) {
            progressDispatchState.delete(progressKey);
        }
    };

    if (isFinalUpdate || payload.percent <= state.lastPercent || elapsed >= PROGRESS_EVENT_INTERVAL_MS) {
        flush(payload);
        return;
    }

    state.pendingPayload = payload;

    if (!state.timeout) {
        state.timeout = setTimeout(() => {
            const latestPayload = state.pendingPayload;
            if (latestPayload) {
                flush(latestPayload);
            } else {
                progressDispatchState.delete(progressKey);
            }
        }, Math.max(PROGRESS_EVENT_INTERVAL_MS - elapsed, 0));
    }
}

function createWindow() {
    console.log('[main] Creating window with preload:', preloadPath);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true,
        icon: appIconPath,
        backgroundColor: '#0f111a', // Space background color
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true
        },
        titleBarStyle: 'hidden'
    });

    mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));

    mainWindow.webContents.once('did-finish-load', () => {
        console.log('[main] Renderer finished loading.');
    });

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });

    const emitWindowState = () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }

        mainWindow.webContents.send('window-state-changed', {
            isMaximized: mainWindow.isMaximized()
        });
    };

    mainWindow.on('maximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window:maximized');
        }
        emitWindowState();
    });
    mainWindow.on('unmaximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window:unmaximized');
        }
        emitWindowState();
    });
    mainWindow.on('enter-full-screen', emitWindowState);
    mainWindow.on('leave-full-screen', emitWindowState);
    mainWindow.webContents.once('did-finish-load', emitWindowState);

    // Initialize auto-updater
    initUpdater(mainWindow);
}

app.whenReady().then(() => {
    protocol.handle('converthub-media', (request) => {
        try {
            const url = new URL(request.url);
            const filePath = url.searchParams.get('path');
            if (!filePath) {
                return new Response('Path parameter is missing', { status: 400 });
            }
            return net.fetch(pathToFileURL(filePath).toString());
        } catch (e) {
            return new Response('Error loading file: ' + e.message, { status: 500 });
        }
    });
    createWindow();
});


// Application version IPC
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// Window controls IPC
ipcMain.handle('window-minimize', (event) => {
    console.log('[main] IPC window-minimize received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.minimize();
        console.log('[main] Window minimized');
    } else {
        console.warn('[main] No valid target window for minimize');
    }
    return true;
});

ipcMain.handle('window:minimize', (event) => {
    console.log('[main] IPC window:minimize received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.minimize();
        console.log('[main] Window minimized');
    } else {
        console.warn('[main] No valid target window for minimize');
    }
    return true;
});

ipcMain.handle('window-maximize', (event) => {
    console.log('[main] IPC window-maximize received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        if (targetWindow.isMaximized()) {
            targetWindow.unmaximize();
            console.log('[main] Window restored');
        } else {
            targetWindow.maximize();
            console.log('[main] Window maximized');
        }
    } else {
        console.warn('[main] No valid target window for maximize');
    }
    return true;
});

ipcMain.handle('window:maximize', (event) => {
    console.log('[main] IPC window:maximize received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        if (targetWindow.isMaximized()) {
            targetWindow.unmaximize();
            console.log('[main] Window restored');
        } else {
            targetWindow.maximize();
            console.log('[main] Window maximized');
        }
    } else {
        console.warn('[main] No valid target window for maximize');
    }
    return true;
});

ipcMain.handle('window-close', (event) => {
    console.log('[main] IPC window-close received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.close();
        console.log('[main] Window close requested');
    } else {
        console.warn('[main] No valid target window for close');
    }
    return true;
});

ipcMain.handle('window:close', (event) => {
    console.log('[main] IPC window:close received');
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.close();
        console.log('[main] Window close requested');
    } else {
        console.warn('[main] No valid target window for close');
    }
    return true;
});

ipcMain.handle('window:isMaximized', (event) => {
    const targetWindow = getTargetWindow(event.sender);
    return !!(targetWindow && !targetWindow.isDestroyed() && targetWindow.isMaximized());
});

ipcMain.handle('set-titlebar-theme', (event, theme) => {
    const targetWindow = getTargetWindow(event.sender);
    if (targetWindow && !targetWindow.isDestroyed() && typeof targetWindow.setTitleBarOverlay === 'function') {
        targetWindow.setTitleBarOverlay(getTitleBarOverlayOptions(theme));
    }
    return true;
});

// ─── File Conversion with Progress ─────────────────────────────
ipcMain.handle('convert-file', async (_event, data) => {
    const manager = getConversionManager();
    const controller = manager.activateCancellationController(
        manager.createCancellationController(data?.fileId || 'single-conversion')
    );

    try {
        const result = await manager.convert(data, (percent) => {
            relayConversionProgress({
                fileId: data.fileId,
                percent
            });
        }, controller);
        return { success: true, ...result };
    } catch (error) {
        if (manager.isCancellationError?.(error)) {
            return {
                success: false,
                cancelled: true,
                error: error.message || 'Conversion stopped.'
            };
        }

        return {
            success: false,
            error: error.message || 'Conversion failed.'
        };
    } finally {
        manager.releaseCancellationController?.(controller);
    }
});

ipcMain.handle('cancel-conversion', async () => {
    const manager = getConversionManager();
    return manager.cancelActiveConversions?.('Conversion stopped.') || { success: false, cancelledCount: 0 };
});

ipcMain.handle('cancel-file', async (_event, { fileId }) => {
    const manager = getConversionManager();
    return manager.cancelConversionById?.(fileId, 'Conversion stopped.') || { success: false };
});

// ─── Get supported format lists ─────────────────────────────────
ipcMain.handle('convert-batch', async (_event, data) => {
    const manager = getConversionManager();
    const controller = manager.activateCancellationController(
        manager.createCancellationController('batch-conversion')
    );

    try {
        return await manager.convertBatch(data, ({ fileId, percent, batchIndex, totalJobs }) => {
            relayConversionProgress({
                fileId,
                percent,
                batchIndex,
                totalJobs
            });
        }, controller);
    } catch (error) {
        if (manager.isCancellationError?.(error)) {
            return {
                success: false,
                cancelled: true,
                results: [],
                totalJobs: Array.isArray(data?.jobs) ? data.jobs.length : 0,
                successCount: 0,
                errorCount: 0,
                cancelledCount: Array.isArray(data?.jobs) ? data.jobs.length : 0,
                error: error.message || 'Conversion stopped.'
            };
        }

        return {
            success: false,
            results: [],
            totalJobs: Array.isArray(data?.jobs) ? data.jobs.length : 0,
            successCount: 0,
            errorCount: Array.isArray(data?.jobs) ? data.jobs.length : 0,
            error: error.message || 'Batch conversion failed.'
        };
    } finally {
        manager.releaseCancellationController?.(controller);
    }
});

// ─── Output Folder Picker ───────────────────────────────────────
ipcMain.handle('select-output-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Output Folder',
        properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

ipcMain.handle('open:folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Output Folder',
        properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

// ─── File Picker (alternative to drag/drop) ─────────────────────
ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Files to Convert',
        properties: ['openFile', 'multiSelections']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }
    return result.filePaths;
});

ipcMain.handle('open:file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Files',
        properties: ['openFile', 'multiSelections']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }
    return result.filePaths;
});

// ─── Open folder in system explorer ─────────────────────────────
ipcMain.handle('open-folder', async (_event, folderPath) => {
    try {
        await shell.openPath(folderPath);
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle('open:path', async (_event, targetPath) => {
    try {
        await shell.openPath(targetPath);
        return true;
    } catch {
        return false;
    }
});

// ─── Get default output path (user's Downloads) ─────────────────
ipcMain.handle('get-default-output', () => {
    return app.getPath('downloads');
});

const fs = require('fs');

let pdfProcessor = null;
function getPDFProcessor() {
    if (!pdfProcessor) {
        pdfProcessor = require('./core/pdfProcessor');
    }
    return pdfProcessor;
}

// ─── PDF Toolkit IPC Handlers ────────────────────────────────────
ipcMain.handle('pdf:create', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.compileImagesToPDF(data);
    } catch (error) {
        console.error('[main] Error in pdf:create:', error);
        return { success: false, error: error.message || 'Failed to create PDF.' };
    }
});

ipcMain.handle('pdf:merge', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.mergePDFs(data, (progress) => {
            try {
                // Attach a fileId to group merge progress events
                const fileId = data?.pdfName || `merge:${Date.now()}`;
                relayConversionProgress({ fileId, percent: progress.percent || 0, message: progress.message || 'Merging PDFs' });
            } catch (err) {
                // ignore
            }
        });
    } catch (error) {
        console.error('[main] Error in pdf:merge:', error);
        return { success: false, error: error.message || 'Failed to merge PDFs.' };
    }
});

ipcMain.handle('pdf:save-page', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.saveExtractedPage(data);
    } catch (error) {
        console.error('[main] Error in pdf:save-page:', error);
        return { success: false, error: error.message || 'Failed to save page image.' };
    }
});

ipcMain.handle('pdf:create-images-zip', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.createImagesZip(data);
    } catch (error) {
        console.error('[main] Error in pdf:create-images-zip:', error);
        return { success: false, error: error.message || 'Failed to create ZIP.' };
    }
});

ipcMain.handle('pdf:watermark', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.watermarkPDF(data);
    } catch (error) {
        console.error('[main] Error in pdf:watermark:', error);
        return { success: false, error: error.message || 'Failed to watermark PDF.' };
    }
});

ipcMain.handle('pdf:compress-lossless', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.compressPDFLossless(data);
    } catch (error) {
        console.error('[main] Error in pdf:compress-lossless:', error);
        return { success: false, error: error.message || 'Failed to compress PDF.' };
    }
});

ipcMain.handle('pdf:organize', async (_event, data) => {
    try {
        const processor = getPDFProcessor();
        return await processor.organizePDF(data);
    } catch (error) {
        console.error('[main] Error in pdf:organize:', error);
        return { success: false, error: error.message || 'Failed to organize PDF.' };
    }
});

ipcMain.handle('pdf:read-folder-images', async (_event, { folderPath }) => {
    try {
        const results = [];
        async function scan(dir) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
                        const stat = await fs.promises.stat(fullPath);
                        results.push({
                            name: entry.name,
                            path: fullPath,
                            size: stat.size
                        });
                    }
                }
            }
        }
        await scan(folderPath);
        return { success: true, files: results };
    } catch (error) {
        console.error('[main] Error in pdf:read-folder-images:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('path-exists', async (_event, { path: targetPath }) => {
    try {
        await fs.promises.access(targetPath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
});

// Ensure 'get-formats' handler is registered only once
if (!ipcMain.eventNames().includes('get-formats')) {
    ipcMain.handle('get-formats', () => {
        return getConversionManager().FORMAT_TYPES;
    });
}

// Ensure 'get-engine-status' handler is registered only once
if (!ipcMain.eventNames().includes('get-engine-status')) {
    ipcMain.handle('get-engine-status', () => {
        return getConversionManager().getEngineStatus();
    });
}
