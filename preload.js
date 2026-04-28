const { contextBridge, ipcRenderer, webUtils } = require('electron');

console.log('[preload] preload loaded');

function normalizeSlashes(value) {
    return String(value || '').replace(/\\/g, '/');
}

function getLastSeparatorIndex(filePath) {
    const normalized = normalizeSlashes(filePath);
    return normalized.lastIndexOf('/');
}

function getDirectoryName(filePath) {
    const normalized = normalizeSlashes(filePath);
    const lastSeparatorIndex = getLastSeparatorIndex(normalized);
    return lastSeparatorIndex >= 0 ? normalized.slice(0, lastSeparatorIndex) : '';
}

function getFileName(filePath) {
    const normalized = normalizeSlashes(filePath);
    const lastSeparatorIndex = getLastSeparatorIndex(normalized);
    return lastSeparatorIndex >= 0 ? normalized.slice(lastSeparatorIndex + 1) : normalized;
}

function getFileStem(filePath) {
    const fileName = getFileName(filePath);
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
}

function joinPath(directory, fileName) {
    const safeDirectory = String(directory || '');
    if (!safeDirectory) {
        return fileName;
    }
    return `${safeDirectory.replace(/[\\/]+$/, '')}\\${String(fileName || '').replace(/^[\\/]+/, '')}`;
}

function buildOutputPath(inputPath, format, outputFolder) {
    const safeInputPath = String(inputPath || '');
    const ext = String(format || '').trim().replace(/^\./, '').toLowerCase();
    const outputDirectory = String(outputFolder || '') || getDirectoryName(safeInputPath);
    const fileStem = getFileStem(safeInputPath);
    return joinPath(outputDirectory, ext ? `${fileStem}.${ext}` : fileStem);
}

function detectPlatform() {
    const userAgent = String(globalThis.navigator?.userAgent || '').toLowerCase();
    if (userAgent.includes('windows')) return 'win32';
    if (userAgent.includes('mac os')) return 'darwin';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
}

contextBridge.exposeInMainWorld('app', {
    // Conversion
    convertFile: (data) => ipcRenderer.invoke('convert-file', data),
    convertBatch: (data) => ipcRenderer.invoke('convert-batch', data),
    cancelConversion: (data) => ipcRenderer.invoke('cancel-conversion', data),
    getFormats: () => ipcRenderer.invoke('get-formats'),
    getEngineStatus: () => ipcRenderer.invoke('get-engine-status'),

    // Progress listener
    onProgress: (callback) => {
        ipcRenderer.on('conversion-progress', (_event, data) => callback(data));
    },
    removeProgressListeners: () => {
        ipcRenderer.removeAllListeners('conversion-progress');
    },

    // Dialogs
    selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
    selectFiles: () => ipcRenderer.invoke('select-files'),
    openFileDialog: () => ipcRenderer.invoke('open:file-dialog'),
    openFolderDialog: () => ipcRenderer.invoke('open:folder-dialog'),
    getDefaultOutput: () => ipcRenderer.invoke('get-default-output'),
    getPathForFile: (file) => {
        try {
            return webUtils.getPathForFile(file);
        } catch {
            return '';
        }
    },
    buildOutputPath,
    getPlatform: () => detectPlatform(),

    // Shell
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
    openPath: (targetPath) => ipcRenderer.invoke('open:path', targetPath),

    // Window controls
    minimize: async () => {
        console.log('[preload] invoking window:minimize');
        return ipcRenderer.invoke('window:minimize');
    },
    maximize: async () => {
        console.log('[preload] invoking window:maximize');
        return ipcRenderer.invoke('window:maximize');
    },
    close: async () => {
        console.log('[preload] invoking window:close');
        return ipcRenderer.invoke('window:close');
    },
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (callback) => {
        ipcRenderer.on('window:maximized', () => callback());
    },
    onUnmaximized: (callback) => {
        ipcRenderer.on('window:unmaximized', () => callback());
    },
    setTitlebarTheme: (theme) => ipcRenderer.invoke('set-titlebar-theme', theme),
    onWindowStateChanged: (callback) => {
        ipcRenderer.on('window-state-changed', (_event, data) => callback(data));
    }
});

console.log('[preload] window.app exposed');
