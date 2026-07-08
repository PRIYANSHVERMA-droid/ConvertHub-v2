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

function getFileExtension(filePath) {
    const fileName = getFileName(filePath);
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1) : '';
}

function detectPlatform() {
    const userAgent = String(globalThis.navigator?.userAgent || '').toLowerCase();
    if (userAgent.includes('windows')) return 'win32';
    if (userAgent.includes('mac os')) return 'darwin';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
}

const appBridge = {
    // Conversion
    convertFile: (data) => ipcRenderer.invoke('convert-file', data),
    convertBatch: (data) => ipcRenderer.invoke('convert-batch', data),
    cancelConversion: (data) => ipcRenderer.invoke('cancel-conversion', data),
    cancelFile: (data) => ipcRenderer.invoke('cancel-file', data),
    getFormats: () => ipcRenderer.invoke('get-formats'),
    getEngineStatus: () => ipcRenderer.invoke('get-engine-status'),

    // PDF Toolkit
    createPDF: (data) => ipcRenderer.invoke('pdf:create', data),
    saveExtractedPage: (data) => ipcRenderer.invoke('pdf:save-page', data),
    createExtractedImagesZip: (data) => ipcRenderer.invoke('pdf:create-images-zip', data),
    mergePDFs: (data) => ipcRenderer.invoke('pdf:merge', data),
    readFolderImages: (folderPath) => ipcRenderer.invoke('pdf:read-folder-images', { folderPath }),
    watermarkPDF: (data) => ipcRenderer.invoke('pdf:watermark', data),
    compressPDFLossless: (data) => ipcRenderer.invoke('pdf:compress-lossless', data),
    organizePDF: (data) => ipcRenderer.invoke('pdf:organize', data),


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
    openFileDialog: () => ipcRenderer.invoke('select-files'),
    openFolderDialog: () => ipcRenderer.invoke('select-output-folder'),
    getDefaultOutput: () => ipcRenderer.invoke('get-default-output'),
    getPathForFile: (file) => {
        try {
            return webUtils.getPathForFile(file);
        } catch {
            return '';
        }
    },
    buildOutputPath,
    getFileExtension,
    getPlatform: () => detectPlatform(),

    // Shell
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
    openPath: (targetPath) => ipcRenderer.invoke('open:path', targetPath),
    pathExists: (pathObj) => ipcRenderer.invoke('path-exists', pathObj),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', { filePath }),
    getFileSize: (filePath) => ipcRenderer.invoke('get-file-size', { filePath }),

    // History IPC
    getHistory: () => ipcRenderer.invoke('get-history'),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    onHistoryUpdated: (callback) => {
        ipcRenderer.on('history-updated', () => callback());
    },

    // Presets IPC
    getPresets: () => ipcRenderer.invoke('get-presets'),
    savePreset: (type, preset) => ipcRenderer.invoke('save-preset', { type, preset }),
    deletePreset: (type, presetId) => ipcRenderer.invoke('delete-preset', { type, presetId }),

    // Theme IPC
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    onSystemThemeUpdated: (callback) => {
        ipcRenderer.on('system-theme-updated', (_event, theme) => callback(theme));
    },

    // Notifications IPC
    setNotificationsEnabled: (enabled) => ipcRenderer.invoke('set-notifications-enabled', enabled),
    onConversionCompleteFocused: (callback) => {
        ipcRenderer.on('conversion-complete-focused', (_event, record) => callback(record));
    },
    onConversionCompleteBackground: (callback) => {
        ipcRenderer.on('conversion-complete-background', (_event, record) => callback(record));
    },

    // Image Toolkit IPC
    processImage: (payload) => ipcRenderer.invoke('process-image', payload),

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
    },

    // Updater & External Links
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download'),
    restartAndInstallUpdate: () => ipcRenderer.invoke('updater:restart-install'),
    setUpdaterConfig: (config) => ipcRenderer.invoke('updater:set-config', config),
    onUpdateStatus: (callback) => {
        ipcRenderer.on('updater:status', (_event, data) => callback(data));
    },
    removeUpdateStatusListeners: () => {
        ipcRenderer.removeAllListeners('updater:status');
    }
};

const videoProgressListeners = new Map();

const videoAPI = {
    trim: (options) => ipcRenderer.invoke('video:trim', options),
    merge: (options) => ipcRenderer.invoke('video:merge', options),
    extractAudio: (options) => ipcRenderer.invoke('video:extractAudio', options),
    compress: (options) => ipcRenderer.invoke('video:compress', options),
    hardcodeSubtitles: (options) => ipcRenderer.invoke('video:hardcodeSubtitles', options),
    cancel: (jobId) => ipcRenderer.invoke('video:cancel', { jobId }),
    getActiveJobs: () => ipcRenderer.invoke('video:getActiveJobs'),
    getMediaInfo: (filePath) => ipcRenderer.invoke('video:getMediaInfo', { filePath }),
    onProgress: (callback) => {
        const wrapper = (_, data) => callback(data);
        videoProgressListeners.set(callback, wrapper);
        ipcRenderer.on('video:progress', wrapper);
    },
    offProgress: (callback) => {
        const wrapper = videoProgressListeners.get(callback);
        if (wrapper) {
            ipcRenderer.removeListener('video:progress', wrapper);
            videoProgressListeners.delete(callback);
        }
    }
};

contextBridge.exposeInMainWorld('videoAPI', videoAPI);
contextBridge.exposeInMainWorld('app', appBridge);
contextBridge.exposeInMainWorld('electronAPI', appBridge);

console.log('[preload] window.app, window.electronAPI, and window.videoAPI exposed');


