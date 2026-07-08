const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

// Configure autoUpdater logger
autoUpdater.logger = console;

function sanitizeUpdateError(err) {
    if (!err) return 'An unknown error occurred during the update check.';
    
    let message = typeof err === 'string' ? err : (err.message || String(err));
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('latest.yml') && lowerMessage.includes('404')) {
        return 'Update check failed: No published updates found (404). This usually means no releases have been published yet, or the repository is private.';
    }
    
    if (lowerMessage.includes('enotfound') || lowerMessage.includes('etimedout') || lowerMessage.includes('fetch failed') || lowerMessage.includes('network')) {
        return 'Network connection failed. Unable to reach the update server. Please check your internet connection.';
    }
    
    if (lowerMessage.includes('auth') || lowerMessage.includes('token') || lowerMessage.includes('401') || lowerMessage.includes('403')) {
        return 'Authentication failed. Please verify your repository permissions or configuration.';
    }
    
    if (message.includes('HttpError:')) {
        const parts = message.split('HttpError:');
        const mainMessage = parts[0].trim();
        const codeMatch = parts[1].match(/\b\d{3}\b/);
        const code = codeMatch ? ` (${codeMatch[0]})` : '';
        return `${mainMessage.replace(/\(?https?:\/\/[^\s\)]+\)?/g, '').trim()}${code}`.trim() || 'HTTP error occurred during update check.';
    }
    
    const firstLine = message.split('\n')[0].trim();
    if (firstLine.length > 150) {
        return firstLine.substring(0, 150) + '...';
    }
    return firstLine;
}

function initUpdater(mainWindow) {
    // Disable auto-download by default to give users control over bandwidth
    autoUpdater.autoDownload = false;

    // Helper to send update status updates to UI
    function sendUpdateStatus(status, details = {}) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater:status', { status, ...details });
        }
    }

    // Bind autoUpdater event listeners
    autoUpdater.on('checking-for-update', () => {
        console.log('[updater] Checking for updates...');
        sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('[updater] Update available:', info.version);
        sendUpdateStatus('available', {
            version: info.version,
            releaseName: info.releaseName || info.version,
            releaseNotes: info.releaseNotes,
            releaseDate: info.releaseDate
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('[updater] Update not available. Current version is latest.');
        sendUpdateStatus('not-available', {
            version: info.version
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('[updater] Error during update check:', err);
        sendUpdateStatus('error', {
            message: sanitizeUpdateError(err)
        });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        sendUpdateStatus('download-progress', {
            percent: Math.round(progressObj.percent),
            bytesPerSecond: progressObj.bytesPerSecond,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('[updater] Update downloaded:', info.version);
        sendUpdateStatus('downloaded', {
            version: info.version,
            releaseName: info.releaseName || info.version
        });
    });

    // Register IPC main handlers
    ipcMain.handle('updater:check', async () => {
        console.log('[updater:check] Triggered');
        if (!app.isPackaged) {
            // Gracefully handle dev environment
            console.log('[updater:check] Running in development. Simulating check...');
            sendUpdateStatus('checking');
            setTimeout(() => {
                sendUpdateStatus('not-available', { version: app.getVersion() });
            }, 1000);
            return { success: true, simulated: true };
        }

        try {
            const result = await autoUpdater.checkForUpdates();
            return { success: true, result };
        } catch (error) {
            console.error('[updater:check] Error:', error);
            const cleanMessage = sanitizeUpdateError(error);
            sendUpdateStatus('error', { message: cleanMessage });
            return { success: false, error: cleanMessage };
        }
    });

    ipcMain.handle('updater:download', async () => {
        console.log('[updater:download] Triggered');
        if (!app.isPackaged) {
            console.log('[updater:download] Running in development. Simulating download...');
            let percent = 0;
            const interval = setInterval(() => {
                percent += 15;
                if (percent >= 100) {
                    percent = 100;
                    clearInterval(interval);
                    sendUpdateStatus('download-progress', {
                        percent,
                        bytesPerSecond: 1024 * 1024 * 2.5,
                        transferred: 1024 * 1024 * 25,
                        total: 1024 * 1024 * 25
                    });
                    setTimeout(() => {
                        sendUpdateStatus('downloaded', { version: '2.0.0-dev' });
                    }, 500);
                } else {
                    sendUpdateStatus('download-progress', {
                        percent,
                        bytesPerSecond: 1024 * 1024 * 1.5,
                        transferred: Math.round(1024 * 1024 * 25 * (percent / 100)),
                        total: 1024 * 1024 * 25
                    });
                }
            }, 300);
            return { success: true, simulated: true };
        }

        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            console.error('[updater:download] Error:', error);
            const cleanMessage = sanitizeUpdateError(error);
            sendUpdateStatus('error', { message: cleanMessage });
            return { success: false, error: cleanMessage };
        }
    });

    ipcMain.handle('updater:restart-install', () => {
        console.log('[updater:restart-install] Triggered');
        if (!app.isPackaged) {
            console.log('[updater:restart-install] Restart requested in dev mode.');
            return { success: true, simulated: true };
        }

        // 1. Forcefully kill all child processes immediately
        if (global.activeChildProcesses) {
            const { spawn } = require('child_process');
            for (const proc of global.activeChildProcesses) {
                try {
                    if (process.platform === 'win32') {
                        spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { windowsHide: true });
                    } else {
                        process.kill(-proc.pid, 'SIGKILL');
                    }
                } catch (_) {
                    try { proc.kill('SIGKILL'); } catch (_) {}
                }
            }
            global.activeChildProcesses.clear();
        }

        // 2. Destroy all windows (bypasses any prompt-on-close/beforeunload logic)
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((w) => {
            if (!w.isDestroyed()) {
                w.destroy();
            }
        });

        // 3. Initiate installer quit & run
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
    });

    ipcMain.handle('updater:set-config', (event, config) => {
        if (config) {
            if (typeof config.autoDownload === 'boolean') {
                autoUpdater.autoDownload = config.autoDownload;
                console.log('[updater] Set autoDownload to:', config.autoDownload);
            }
        }
        return true;
    });
}

module.exports = { initUpdater };
