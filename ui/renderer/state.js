export const state = {
    customPresets: {},
    engineStatus: null,
    dragSrcId: null,
    dragOverId: null,
    appSettings: {
        theme: 'dark',
        autoDetectType: true,
        defaultQuality: 80,
        defaultOutputFolder: '',
        openFolderOnComplete: false,
        showToasts: true,
        startupWorkspace: 'last',
        suppressLibreOfficeSetupGuide: false,
        autoCheckUpdates: true,
        autoDownloadUpdates: false
    },
    notifications: [],
    fileQueue: [],
    groupSettingsByType: {},
    selectedScope: { kind: 'group', type: 'audio' },
    isConverting: false,
    fileIdCounter: 0,
    defaultDownloadsPath: '',
    activeBatch: null,
    isSyncingScopeControls: false,
    isCancellingConversion: false,
    pdfImages: [],
    pdfImageIdCounter: 0,
    pdfImageDragId: null,
    selectedPdfFile: null,
    pdfMergeFiles: [],
    pdfMergeIdCounter: 0,
    pdfMergeDragId: null,
    selectedWatermarkFile: null,
    watermarkLogoFile: null,
    selectedOrganizeFile: null,
    pdfOrganizePages: [],
    pdfCompressFiles: [],
    pdfOrganizeDragSrcIndex: null,

    FORMAT_MAP: {
        audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv'],
        image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'ico', 'gif'],
        document: ['pdf', 'docx', 'txt', 'odt', 'rtf', 'html', 'xlsx', 'pptx'],
        archive: ['zip', '7z', 'tar', 'gz']
    },

    ICON_MAP: {
        audio: { class: 'audio', icon: 'fa-music' },
        video: { class: 'video', icon: 'fa-film' },
        image: { class: 'image', icon: 'fa-image' },
        document: { class: 'document', icon: 'fa-file-lines' },
        archive: { class: 'archive', icon: 'fa-file-zipper' },
        unknown: { class: 'unknown', icon: 'fa-file-circle-question' }
    },

    TYPE_LABELS: {
        audio: 'Audio',
        video: 'Video',
        image: 'Image',
        document: 'Document',
        archive: 'Archive'
    },

    PRESET_CATALOG: {
        audio: [
            { id: 'audio-balanced-mp3', label: 'Balanced MP3', type: 'audio', format: 'mp3', quality: 75, isDefault: true },
            { id: 'audio-high-mp3', label: 'High Quality MP3', type: 'audio', format: 'mp3', quality: 92 },
            { id: 'audio-lossless-flac', label: 'Lossless FLAC', type: 'audio', format: 'flac', quality: 100 }
        ],
        video: [
            { id: 'video-balanced-mp4', label: 'Balanced MP4', type: 'video', format: 'mp4', quality: 75, isDefault: true },
            { id: 'video-high-mp4', label: 'High Quality MP4', type: 'video', format: 'mp4', quality: 92 },
            { id: 'video-webm-web', label: 'WebM for Web', type: 'video', format: 'webm', quality: 72 }
        ],
        image: [
            { id: 'image-jpeg-balanced', label: 'JPEG Balanced', type: 'image', format: 'jpg', quality: 78, isDefault: true },
            { id: 'image-jpeg-high', label: 'JPEG High Quality', type: 'image', format: 'jpg', quality: 92 },
            { id: 'image-png-lossless', label: 'PNG Lossless', type: 'image', format: 'png', quality: 100 },
            { id: 'image-webp-optimized', label: 'WEBP Optimized', type: 'image', format: 'webp', quality: 75 }
        ],
        document: [
            { id: 'document-pdf-export', label: 'PDF Export', type: 'document', format: 'pdf', isDefault: true },
            { id: 'document-word-editable', label: 'Word Editable', type: 'document', format: 'docx' },
            { id: 'document-plain-text', label: 'Plain Text', type: 'document', format: 'txt' }
        ],
        archive: [
            { id: 'archive-zip-compatible', label: 'ZIP Compatible', type: 'archive', format: 'zip', isDefault: true },
            { id: 'archive-7z-smaller', label: '7Z Smaller Size', type: 'archive', format: '7z' }
        ]
    },

    DEFAULT_SETTINGS: {
        theme: 'dark',
        autoDetectType: true,
        defaultQuality: 80,
        defaultOutputFolder: '',
        openFolderOnComplete: false,
        showToasts: true,
        startupWorkspace: 'last',
        suppressLibreOfficeSetupGuide: false,
        autoCheckUpdates: true,
        autoDownloadUpdates: false
    }
};

export const desktopBridge = window.app;

export function getSavedSettings() {
    try {
        return { ...state.DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('converthub_settings') || '{}') };
    } catch {
        return { ...state.DEFAULT_SETTINGS };
    }
}

export function saveSettings() {
    localStorage.setItem('converthub_settings', JSON.stringify(state.appSettings));
}

export function getSavedNotifications() {
    try {
        return JSON.parse(localStorage.getItem('converthub_notifications') || '[]');
    } catch {
        return [];
    }
}

export function saveNotifications() {
    localStorage.setItem('converthub_notifications', JSON.stringify(state.notifications.slice(0, 50)));
}

export function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function truncateName(name, max) {
    if (!name) return '';
    if (name.length <= max) return name;
    return name.substring(0, max - 3) + '...';
}

export function getIconForFormat(format) {
    for (const [type, exts] of Object.entries(state.FORMAT_MAP)) {
        if (exts.includes(format)) {
            return state.ICON_MAP[type];
        }
    }
    return state.ICON_MAP.unknown;
}

export function getIconForType(type) {
    return state.ICON_MAP[type] || state.ICON_MAP.unknown;
}

export function getFolderFromPath(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[/\\]/);
    parts.pop();
    return parts.join('\\');
}

export function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatBytes(bytes) {
    return formatSize(bytes);
}
