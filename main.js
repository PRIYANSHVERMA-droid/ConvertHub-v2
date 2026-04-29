const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

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
    const state = progressDispatchState.get(progressKey) || {
        lastSentAt: 0,
        lastPercent: -1,
        timeout: null,
        pendingPayload: null
    };
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
            return;
        }

        progressDispatchState.set(progressKey, state);
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

    progressDispatchState.set(progressKey, state);
}

function createWindow() {
    console.log('[main] Creating window with preload:', preloadPath);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        icon: appIconPath,
        backgroundColor: '#0f111a', // Space background color
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true
        }
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
}

app.whenReady().then(createWindow);

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

ipcMain.handle('get-formats', () => {
    return getConversionManager().FORMAT_TYPES;
});

ipcMain.handle('get-engine-status', () => {
    return getConversionManager().getEngineStatus();
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
