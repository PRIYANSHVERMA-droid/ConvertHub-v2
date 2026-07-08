import { state, getSavedSettings, getSavedNotifications, saveSettings, saveNotifications, escapeHtml, truncateName, getIconForFormat, getIconForType, getFolderFromPath, formatSize } from './state.js';
import { showToast, addNotification, closeNotifications, openNotifications } from './notifications.js';
import { loadCustomPresets, getPresetsForType, getDefaultPreset, getPresetById, getMatchingPreset, typeUsesQuality } from './presetsUI.js';
import { refreshRecentFiles, loadRecentFiles } from './historyUI.js';

export { getSavedSettings, getSavedNotifications };

export function getSelectedType() {
    return state.selectedScope.type;
}

export function getScopeSettings(scope = state.selectedScope) {
    if (scope.kind === 'file') {
        const item = getFileById(scope.id);
        return item ? item.settings : null;
    }
    return ensureGroupSettings(scope.type);
}

export function ensureGroupSettings(type) {
    if (!state.groupSettingsByType[type]) {
        const defaultPreset = getDefaultPreset(type);
        state.groupSettingsByType[type] = {
            format: defaultPreset?.format || state.FORMAT_MAP[type][0],
            quality: defaultPreset?.quality || state.appSettings.defaultQuality || 80,
            outputFolder: state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || ''
        };
    }
    return state.groupSettingsByType[type];
}

export function detectTypeFromFileName(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    for (const [type, extensions] of Object.entries(state.FORMAT_MAP)) {
        if (extensions.includes(ext)) {
            return type;
        }
    }
    return null;
}

export function getFileById(fileId) {
    return state.fileQueue.find(item => item.id === fileId);
}

export function markBatchItemComplete(fileId) {
    if (state.activeBatch) {
        state.activeBatch.completed += 1;
        state.activeBatch.completedIds.push(fileId);
    }
}

export function setBatchStatus(status) {
    const batchStatus = document.getElementById('batch-status');
    const batchStatusTitle = document.getElementById('batch-status-title');
    const batchStatusMeta = document.getElementById('batch-status-meta');
    const batchProgressFill = document.getElementById('batch-progress-fill');
    if (!batchStatus) return;

    if (status) {
        batchStatusTitle.textContent = status.title || '';
        batchStatusMeta.textContent = status.meta || '';
        batchProgressFill.style.width = `${status.percent || 0}%`;
        batchStatus.classList.remove('hidden');
    } else {
        batchStatus.classList.add('hidden');
    }
}

export function updateQueueItemProgress(fileId, percent) {
    const item = getFileById(fileId);
    if (item) {
        item.progress = percent;
        if (percent >= 100) {
            item.status = 'done';
        }
        renderQueue();
    }
}

export function initConversion() {
    // Helper function to sync local variables to state and vice versa
    window.syncState = () => {
        appSettings = state.appSettings;
        notifications = state.notifications;
        fileQueue = state.fileQueue;
        groupSettingsByType = state.groupSettingsByType;
        selectedScope = state.selectedScope;
        isConverting = state.isConverting;
        fileIdCounter = state.fileIdCounter;
        defaultDownloadsPath = state.defaultDownloadsPath;
        activeBatch = state.activeBatch;
        isSyncingScopeControls = state.isSyncingScopeControls;
        isCancellingConversion = state.isCancellingConversion;
        customPresets = state.customPresets;
        engineStatus = state.engineStatus;
    };

    // Helper function to sync reassignments back to state
    function syncQueueState() {
        state.fileQueue = fileQueue;
    }


    const winMinButton = document.getElementById('win-min');
    const winMaxButton = document.getElementById('win-max');
    const winCloseButton = document.getElementById('win-close');
    const desktopBridge = window.app;

    console.log('[renderer] app.js loaded');
    console.log('[renderer] window.app =', desktopBridge);

    // Startup splash helper: hide then remove the splash element










































































































































































































































    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const queueList = document.getElementById('queue-list');
    const queueEmpty = document.getElementById('queue-empty');
    const queueCount = document.getElementById('queue-count');
    const recentList = document.getElementById('recent-list');
    const convertBtn = document.getElementById('convert-btn');
    const outputFormatSelect = document.getElementById('output-format');
    const presetSelect = document.getElementById('preset-select');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const qualityGroup = document.querySelector('.quality-group');
    const outputFolderInput = document.getElementById('output-folder-input');
    const pickFolderBtn = document.getElementById('pick-folder-btn');
    const openFolderBtn = document.getElementById('open-folder-btn');
    const clearQueueBtn = document.getElementById('clear-queue-btn');
    const clearRecentBtn = document.getElementById('clear-recent-btn');
    const outputScopeLabel = document.getElementById('output-scope-label');
    const resetFileOverrideBtn = document.getElementById('reset-file-override-btn');

    // v2.2 New Elements
    const savePresetBtn = document.getElementById('save-preset-btn');
    const presetSaveInputGroup = document.getElementById('preset-save-input-group');
    const newPresetNameInput = document.getElementById('new-preset-name');
    const confirmSavePresetBtn = document.getElementById('confirm-save-preset');
    const cancelSavePresetBtn = document.getElementById('cancel-save-preset');
    const deletePresetBtn = document.getElementById('delete-preset-btn');
    const notificationBadge = document.getElementById('notification-badge');
    const launchImageBtn = document.getElementById('launch-image-btn');
    const launchVideoBtn = document.getElementById('launch-video-btn');

    let customPresets = {};
    let engineStatus = null;
    let dragSrcId = null;
    let dragOverId = null;
    const batchStatus = document.getElementById('batch-status');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    const batchStatusTitle = document.getElementById('batch-status-title');
    const batchStatusMeta = document.getElementById('batch-status-meta');
    const batchProgressFill = document.getElementById('batch-progress-fill');
    const settingsSave = document.getElementById('settings-save');
    const settingsReset = document.getElementById('settings-reset');
    const settingsTheme = document.getElementById('settings-theme');
    const settingsStartupWorkspace = document.getElementById('settings-startup-workspace');
    const settingsShowToasts = document.getElementById('settings-show-toasts');
    const settingsAutoDetectType = document.getElementById('settings-auto-detect-type');
    const settingsDefaultQuality = document.getElementById('settings-default-quality');
    const settingsDefaultQualityValue = document.getElementById('settings-default-quality-value');
    const settingsOpenFolderOnComplete = document.getElementById('settings-open-folder-on-complete');
    const settingsDefaultOutputFolder = document.getElementById('settings-default-output-folder');
    const settingsPickFolderBtn = document.getElementById('settings-pick-folder-btn');
    const settingsOpenFolderBtn = document.getElementById('settings-open-folder-btn');
    const environmentPlatform = document.getElementById('environment-platform');
    const environmentEngines = document.getElementById('environment-engines');
    const environmentSupport = document.getElementById('environment-support');
    const engineSetupGuideBtn = document.getElementById('engine-setup-guide-btn');
    const engineModalOverlay = document.getElementById('engine-modal-overlay');
    const engineModalClose = document.getElementById('engine-modal-close');
    const engineModalDoneBtn = document.getElementById('engine-modal-done-btn');
    const engineModalDismissCheckbox = document.getElementById('engine-modal-dismiss-checkbox');
    const engineModalMissingList = document.getElementById('engine-modal-missing-list');
    const engineTabs = Array.from(document.querySelectorAll('.engine-tab'));
    const engineTabContents = Array.from(document.querySelectorAll('.engine-tab-content'));
    const engineCopyButtons = Array.from(document.querySelectorAll('.engine-copy-btn'));
    const engineDownloadButtons = Array.from(document.querySelectorAll('.engine-download-btn'));

    // Updater elements
    const updaterCheckBtn = document.getElementById('updater-check-btn');
    const updaterDownloadBtn = document.getElementById('updater-download-btn');
    const updaterInstallBtn = document.getElementById('updater-install-btn');
    const updaterStatusText = document.getElementById('updater-status-text');
    const updaterVersionInfo = document.getElementById('updater-version-info');
    const updaterProgressContainer = document.getElementById('updater-progress-container');
    const updaterProgressPercent = document.getElementById('updater-progress-percent');
    const updaterProgressSpeed = document.getElementById('updater-progress-speed');
    const updaterProgressFill = document.getElementById('updater-progress-fill');
    const settingsAutoCheckUpdates = document.getElementById('settings-auto-check-updates');
    const settingsAutoDownloadUpdates = document.getElementById('settings-auto-download-updates');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const notificationsOverlay = document.getElementById('notifications-overlay');
    const notificationsClose = document.getElementById('notifications-close');
    const notificationsMarkRead = document.getElementById('notifications-mark-read');
    const notificationsClear = document.getElementById('notifications-clear');
    const notificationsList = document.getElementById('notifications-list');
    const notificationsEmpty = document.getElementById('notifications-empty');
    const typeCards = Array.from(document.querySelectorAll('.type-card'));

    const launchpadWorkspace = document.getElementById('launchpad-workspace');
    const converterWorkspace = document.getElementById('converter-workspace');
    const pdfWorkspace = document.getElementById('pdf-workspace');
    const imageToolkitWorkspace = document.getElementById('image-toolkit-workspace');
    const videoToolkitWorkspace = document.getElementById('video-toolkit-workspace');
    const headerHomeBtn = document.getElementById('header-home-btn');
    const launchConverterBtn = document.getElementById('launch-converter-btn');
    const launchPdfBtn = document.getElementById('launch-pdf-btn');
    const bypassLaunchpadCheckbox = document.getElementById('bypass-launchpad-checkbox');

    const pdfTabs = Array.from(document.querySelectorAll('#pdf-workspace .pdf-tab'));
    const pdfImgPanel = document.getElementById('panel-img-to-pdf');
    const pdfExtractPanel = document.getElementById('panel-pdf-to-img');
    const pdfMergePanel = document.getElementById('panel-merge-pdf');
    const pdfImgDropzone = document.getElementById('pdf-img-dropzone');
    const pdfImgInput = document.getElementById('pdf-img-input');
    const pdfImageGridSection = document.getElementById('pdf-image-grid-section');
    const pdfThumbnailsGrid = document.getElementById('pdf-thumbnails-grid');
    const pdfImgCount = document.getElementById('pdf-img-count');
    const pdfImgClearBtn = document.getElementById('pdf-img-clear-btn');
    const pdfOutputName = document.getElementById('pdf-output-name');
    const pdfPageSize = document.getElementById('pdf-page-size');
    const pdfPageOrientation = document.getElementById('pdf-page-orientation');
    const pdfPageMargin = document.getElementById('pdf-page-margin');
    const pdfOutputFolderInput = document.getElementById('pdf-output-folder-input');
    const pdfPickFolderBtn = document.getElementById('pdf-pick-folder-btn');
    const pdfOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfCompileBtn = document.getElementById('pdf-compile-btn');
    const pdfFileDropzone = document.getElementById('pdf-file-dropzone');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const pdfFileDetails = document.getElementById('pdf-file-details');
    const pdfDetailName = document.getElementById('pdf-detail-name');
    const pdfDetailMeta = document.getElementById('pdf-detail-meta');
    const pdfRemoveFileBtn = document.getElementById('pdf-remove-file-btn');
    const pdfExtractFormat = document.getElementById('pdf-extract-format');
    const pdfExtractRangeType = document.getElementById('pdf-extract-range-type');
    const pdfExtractRangeGroup = document.getElementById('pdf-extract-range-group');
    const pdfExtractRangeInput = document.getElementById('pdf-extract-range-input');
    const pdfResolutionMode = document.getElementById('pdf-resolution-mode');
    const pdfWidthSlider = document.getElementById('pdf-width-slider');
    const pdfWidthVal = document.getElementById('pdf-width-val');
    const pdfDpiGroup = document.getElementById('pdf-dpi-group');
    const pdfDpiSelect = document.getElementById('pdf-dpi-select');
    const pdfJpgQualityGroup = document.getElementById('pdf-jpg-quality-group');
    const pdfJpgQualitySlider = document.getElementById('pdf-jpg-quality-slider');
    const pdfJpgQualityVal = document.getElementById('pdf-jpg-quality-val');
    const pdfFileNaming = document.getElementById('pdf-file-naming');
    const pdfExtractSubfolder = document.getElementById('pdf-extract-subfolder');
    const pdfExtractZip = document.getElementById('pdf-extract-zip');
    const pdfExtractFolderInput = document.getElementById('pdf-extract-folder-input');
    const pdfExtractPickFolderBtn = document.getElementById('pdf-extract-pick-folder-btn');
    const pdfExtractOpenFolderBtn = document.getElementById('pdf-extract-open-folder-btn');
    const pdfExtractBtn = document.getElementById('pdf-extract-btn');
    const pdfMergeDropzone = document.getElementById('pdf-merge-dropzone');
    const pdfMergeInput = document.getElementById('pdf-merge-input');
    const pdfMergeListSection = document.getElementById('pdf-merge-list-section');
    const pdfMergeList = document.getElementById('pdf-merge-list');
    const pdfMergeCount = document.getElementById('pdf-merge-count');
    const pdfMergeClearBtn = document.getElementById('pdf-merge-clear-btn');
    const pdfMergeOutputName = document.getElementById('pdf-merge-output-name');
    const pdfMergeFolderInput = document.getElementById('pdf-merge-folder-input');
    const pdfMergePickFolderBtn = document.getElementById('pdf-merge-pick-folder-btn');
    const pdfMergeOpenFolderBtn = document.getElementById('pdf-merge-open-folder-btn');
    const pdfMergeBtn = document.getElementById('pdf-merge-btn');
    const pdfMergedPagesSection = document.getElementById('pdf-merged-pages-section');
    const pdfMergedPagesList = document.getElementById('pdf-merged-pages-list');
    const pdfMergedClearBtn = document.getElementById('pdf-merged-clear-btn');
    const sidebarImgToPdf = document.getElementById('sidebar-img-to-pdf');
    const sidebarPdfToImg = document.getElementById('sidebar-pdf-to-img');
    const sidebarMergePdf = document.getElementById('sidebar-merge-pdf');

    // Watermark Elements
    const pdfWatermarkPanel = document.getElementById('panel-watermark-pdf');
    const pdfWatermarkDropzone = document.getElementById('pdf-watermark-dropzone');
    const pdfWatermarkInput = document.getElementById('pdf-watermark-input');
    const pdfWatermarkDetails = document.getElementById('pdf-watermark-details');
    const pdfWatermarkDetailName = document.getElementById('pdf-watermark-detail-name');
    const pdfWatermarkDetailMeta = document.getElementById('pdf-watermark-detail-meta');
    const pdfWatermarkRemoveFileBtn = document.getElementById('pdf-watermark-remove-file-btn');
    const pdfWatermarkPreviewSection = document.getElementById('pdf-watermark-preview-section');
    const watermarkPreviewCanvas = document.getElementById('watermark-preview-canvas');

    const sidebarWatermarkPdf = document.getElementById('sidebar-watermark-pdf');
    const pdfWatermarkOutputName = document.getElementById('pdf-watermark-output-name');
    const pdfWatermarkType = document.getElementById('pdf-watermark-type');
    const pdfWatermarkTextGroup = document.getElementById('pdf-watermark-text-group');
    const pdfWatermarkTextInput = document.getElementById('pdf-watermark-text-input');
    const pdfWatermarkFont = document.getElementById('pdf-watermark-font');
    const pdfWatermarkSizeVal = document.getElementById('pdf-watermark-size-val');
    const pdfWatermarkSizeSlider = document.getElementById('pdf-watermark-size-slider');
    const pdfWatermarkColor = document.getElementById('pdf-watermark-color');
    const pdfWatermarkColorHex = document.getElementById('pdf-watermark-color-hex');
    const pdfWatermarkRotationVal = document.getElementById('pdf-watermark-rotation-val');
    const pdfWatermarkRotationSlider = document.getElementById('pdf-watermark-rotation-slider');

    const pdfWatermarkImageGroup = document.getElementById('pdf-watermark-image-group');
    const pdfWatermarkLogoPath = document.getElementById('pdf-watermark-logo-path');
    const pdfWatermarkLogoBrowseBtn = document.getElementById('pdf-watermark-logo-browse-btn');
    const pdfWatermarkLogoScaleVal = document.getElementById('pdf-watermark-logo-scale-val');
    const pdfWatermarkLogoScaleSlider = document.getElementById('pdf-watermark-logo-scale-slider');

    const pdfWatermarkOpacityVal = document.getElementById('pdf-watermark-opacity-val');
    const pdfWatermarkOpacitySlider = document.getElementById('pdf-watermark-opacity-slider');
    const pdfWatermarkPlacement = document.getElementById('pdf-watermark-placement');
    const pdfWatermarkPagesSelect = document.getElementById('pdf-watermark-pages-select');
    const pdfWatermarkPagesRangeGroup = document.getElementById('pdf-watermark-pages-range-group');
    const pdfWatermarkPagesRangeInput = document.getElementById('pdf-watermark-pages-range-input');
    const pdfWatermarkFolderInput = document.getElementById('pdf-watermark-folder-input');
    const pdfWatermarkPickFolderBtn = document.getElementById('pdf-watermark-pick-folder-btn');
    const pdfWatermarkOpenFolderBtn = document.getElementById('pdf-watermark-open-folder-btn');
    const pdfWatermarkBtn = document.getElementById('pdf-watermark-btn');

    // Compression Elements
    const pdfCompressPanel = document.getElementById('panel-compress-pdf');
    const pdfCompressDropzone = document.getElementById('pdf-compress-dropzone');
    const pdfCompressInput = document.getElementById('pdf-compress-input');
    const pdfCompressListSection = document.getElementById('pdf-compress-list-section');
    const pdfCompressCount = document.getElementById('pdf-compress-count');
    const pdfCompressClearBtn = document.getElementById('pdf-compress-clear-btn');
    const pdfCompressList = document.getElementById('pdf-compress-list');

    const sidebarCompressPdf = document.getElementById('sidebar-compress-pdf');
    const pdfCompressProfile = document.getElementById('pdf-compress-profile');
    const pdfCompressProfileDesc = document.getElementById('pdf-compress-profile-desc');
    const pdfCompressFolderInput = document.getElementById('pdf-compress-folder-input');
    const pdfCompressPickFolderBtn = document.getElementById('pdf-compress-pick-folder-btn');
    const pdfCompressOpenFolderBtn = document.getElementById('pdf-compress-open-folder-btn');
    const pdfCompressBtn = document.getElementById('pdf-compress-btn');

    // Page Organizer Elements
    const pdfOrganizePanel = document.getElementById('panel-organize-pdf');
    const pdfOrganizeDropzone = document.getElementById('pdf-organize-dropzone');
    const pdfOrganizeInput = document.getElementById('pdf-organize-input');
    const pdfOrganizeDetails = document.getElementById('pdf-organize-details');
    const pdfOrganizeDetailName = document.getElementById('pdf-organize-detail-name');
    const pdfOrganizeDetailMeta = document.getElementById('pdf-organize-detail-meta');
    const pdfOrganizeRemoveFileBtn = document.getElementById('pdf-organize-remove-file-btn');
    const pdfOrganizePagesSection = document.getElementById('pdf-organize-pages-section');
    const pdfOrganizePageCount = document.getElementById('pdf-organize-page-count');
    const pdfOrganizeSelectAll = document.getElementById('pdf-organize-select-all');
    const pdfOrganizeRotateAll = document.getElementById('pdf-organize-rotate-all');
    const pdfOrganizePagesList = document.getElementById('pdf-organize-pages-list');

    const sidebarOrganizePdf = document.getElementById('sidebar-organize-pdf');
    const pdfOrganizeOutputName = document.getElementById('pdf-organize-output-name');
    const pdfOrganizeFolderInput = document.getElementById('pdf-organize-folder-input');
    const pdfOrganizePickFolderBtn = document.getElementById('pdf-organize-pick-folder-btn');
    const pdfOrganizeOpenFolderBtn = document.getElementById('pdf-organize-open-folder-btn');
    const pdfOrganizeBtn = document.getElementById('pdf-organize-btn');


    const DEFAULT_SETTINGS = {
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
    };


    let FORMAT_MAP = {
        audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv'],
        image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'ico', 'gif'],
        document: ['pdf', 'docx', 'txt', 'odt', 'rtf', 'html', 'xlsx', 'pptx'],
        archive: ['zip', '7z', 'tar', 'gz']
    };

    const ICON_MAP = {
        audio: { class: 'audio', icon: 'fa-music' },
        video: { class: 'video', icon: 'fa-film' },
        image: { class: 'image', icon: 'fa-image' },
        document: { class: 'document', icon: 'fa-file-lines' },
        archive: { class: 'archive', icon: 'fa-file-zipper' },
        unknown: { class: 'unknown', icon: 'fa-file-circle-question' }
    };

    const TYPE_LABELS = {
        audio: 'Audio',
        video: 'Video',
        image: 'Image',
        document: 'Document',
        archive: 'Archive'
    };

    let pdfBankDrag = null;
    let pdfPageDragId = null;

    const PRESET_CATALOG = {
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
    };

    let appSettings = { ...DEFAULT_SETTINGS };
    let notifications = [];
    let fileQueue = []; syncQueueState();
    let groupSettingsByType = {};
    let selectedScope = { kind: 'group', type: 'audio' };
    let isConverting = false;
    let fileIdCounter = 0;
    let defaultDownloadsPath = '';
    let activeBatch = null;
    let isSyncingScopeControls = false;
    let isCancellingConversion = false;
    let pdfImages = [];
    let pdfImageIdCounter = 0;
    let pdfImageDragId = null;
    let selectedPdfFile = null;
    let pdfMergeFiles = [];
    let pdfMergeIdCounter = 0;
    let pdfMergeDragId = null;

    let selectedWatermarkFile = null;
    let watermarkLogoFile = null;
    let selectedOrganizeFile = null;
    let pdfOrganizePages = []; // array of { pageNum, rotation, deleted, thumbCanvas }
    let pdfCompressFiles = []; // array of { id, file, status, compressedSize, originalSize, savings }
    let pdfOrganizeDragSrcIndex = null;



























    function serializeQueue() {
        const serialized = fileQueue.map(item => ({
            id: item.id,
            filePath: item.file.path,
            fileName: item.file.name,
            fileSize: item.file.size,
            detectedType: item.detectedType,
            status: item.status,
            progress: item.progress,
            override: item.override,
            recordedInRecent: item.recordedInRecent,
            hardwareAccelerated: item.hardwareAccelerated,
            encoder: item.encoder
        }));
        localStorage.setItem('converthub_queue', JSON.stringify(serialized));
    }

    async function restoreQueue() {
        const saved = localStorage.getItem('converthub_queue');
        if (!saved) return;
        try {
            const items = JSON.parse(saved);
            const restored = [];
            for (const item of items) {
                const exists = await window.app.pathExists({ path: item.filePath });
                if (!exists) continue;
                restored.push({
                    ...item,
                    file: {
                        name: item.fileName,
                        path: item.filePath,
                        size: item.fileSize
                    },
                    status: item.status === 'converting' ? 'ready' : item.status
                });
            }
            fileQueue = restored;
            renderQueue();
        } catch (e) {
            console.error('Failed to restore queue:', e);
        }
    }





































































    function getPlatformLabel(platform) {
        if (platform === 'win32') return 'Windows';
        if (platform === 'darwin') return 'macOS';
        if (platform === 'linux') return 'Linux';
        return platform || 'Unknown';
    }

    function renderEngineStatus() {
        if (!environmentPlatform || !environmentEngines || !environmentSupport) {
            return;
        }

        if (!engineStatus || !engineStatus.engines) {
            environmentPlatform.textContent = `Platform: ${getPlatformLabel(window.app?.getPlatform?.() || '')}`;
            environmentEngines.textContent = 'Engine detection unavailable';
            environmentSupport.textContent = 'Support status: unknown';
            return;
        }

        const engineEntries = Object.entries(engineStatus.engines);
        const availableCount = engineEntries.filter(([, info]) => info.available).length;
        environmentPlatform.textContent = `Platform: ${getPlatformLabel(engineStatus.platform)}`;
        environmentEngines.textContent = engineEntries
            .map(([name, info]) => `${name}: ${info.available ? 'ready' : 'missing'}`)
            .join(' • ');
        environmentSupport.textContent = availableCount === engineEntries.length
            ? 'Support status: ready for the installed feature set'
            : 'Support status: some converters need local engine installs';
        if (engineSetupGuideBtn) {
            engineSetupGuideBtn.classList.toggle('hidden', !isLibreOfficeMissing());
        }
    }

    function persistSettings() {
        state.appSettings = { ...appSettings };
        saveSettings();
    }

    function isLibreOfficeMissing() {
        return Boolean(engineStatus?.engines?.libreoffice && !engineStatus.engines.libreoffice.available);
    }

    function getPreferredEngineGuideTab() {
        if (engineStatus?.platform === 'darwin') return 'macos';
        if (engineStatus?.platform === 'linux') return 'linux';
        if (engineStatus?.platform === 'win32') return 'windows';
        const bridgePlatform = window.app?.getPlatform?.();
        if (bridgePlatform === 'darwin') return 'macos';
        if (bridgePlatform === 'linux') return 'linux';
        return 'windows';
    }

    function selectEngineGuideTab(tabName) {
        engineTabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        engineTabContents.forEach((panel) => {
            panel.classList.toggle('hidden', panel.id !== `engine-tab-${tabName}`);
        });
    }

    function renderEngineGuideMissingList() {
        if (!engineModalMissingList) return;
        if (!engineStatus?.engines) {
            engineModalMissingList.innerHTML = '<div class="engine-missing-pill warning"><i class="fa-solid fa-circle-question"></i> Engine detection is unavailable</div>';
            return;
        }

        const missing = Object.entries(engineStatus.engines).filter(([, info]) => !info.available);
        if (missing.length === 0) {
            engineModalMissingList.innerHTML = '<div class="engine-missing-pill ready"><i class="fa-solid fa-circle-check"></i> All local converters are ready</div>';
            return;
        }

        engineModalMissingList.innerHTML = missing
            .map(([name]) => `<div class="engine-missing-pill"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(name)} missing</div>`)
            .join('');
    }

    function openEngineSetupGuide({ startup = false } = {}) {
        if (!engineModalOverlay) return;
        if (startup && (!isLibreOfficeMissing() || appSettings.suppressLibreOfficeSetupGuide)) {
            return;
        }
        renderEngineGuideMissingList();
        selectEngineGuideTab(getPreferredEngineGuideTab());
        if (engineModalDismissCheckbox) {
            engineModalDismissCheckbox.checked = !!appSettings.suppressLibreOfficeSetupGuide;
        }
        engineModalOverlay.classList.remove('hidden');
        document.body.classList.add('settings-open');
    }

    function closeEngineSetupGuide() {
        if (!engineModalOverlay) return;
        if (engineModalDismissCheckbox?.checked) {
            appSettings.suppressLibreOfficeSetupGuide = true;
            persistSettings();
        }
        engineModalOverlay.classList.add('hidden');
        if (settingsOverlay?.classList.contains('hidden') && notificationsOverlay?.classList.contains('hidden')) {
            document.body.classList.remove('settings-open');
        }
    }

























    async function applyTheme(theme) {
        let actualTheme = theme;
        if (theme === 'auto' && window.app?.getSystemTheme) {
            actualTheme = await window.app.getSystemTheme();
        }
        
        const normalizedTheme = actualTheme === 'light' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', normalizedTheme);
        themeToggle.innerHTML = normalizedTheme === 'light'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        
        if (settingsTheme) {
            settingsTheme.value = theme;
        }
        appSettings.theme = theme;
        window.app?.setTitlebarTheme?.(normalizedTheme);
    }

    function setDefaultQuality(value) {
        const safeValue = Math.min(100, Math.max(1, parseInt(value, 10) || DEFAULT_SETTINGS.defaultQuality));
        appSettings.defaultQuality = safeValue;
        settingsDefaultQuality.value = safeValue;
        settingsDefaultQualityValue.textContent = `${safeValue}%`;
        return safeValue;
    }

    function syncSettingsForm() {
        settingsShowToasts.checked = !!appSettings.showToasts;
        settingsAutoDetectType.checked = !!appSettings.autoDetectType;
        settingsOpenFolderOnComplete.checked = !!appSettings.openFolderOnComplete;
        settingsDefaultOutputFolder.value = appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        applyTheme(appSettings.theme);
        setDefaultQuality(appSettings.defaultQuality);
        if (settingsStartupWorkspace) {
            settingsStartupWorkspace.value = appSettings.startupWorkspace || 'last';
        }
        if (settingsAutoCheckUpdates) {
            settingsAutoCheckUpdates.checked = !!appSettings.autoCheckUpdates;
        }
        if (settingsAutoDownloadUpdates) {
            settingsAutoDownloadUpdates.checked = !!appSettings.autoDownloadUpdates;
        }
    }

    function ensureGroupSettings(type) {
        if (!FORMAT_MAP[type]) {
            return null;
        }
        if (!groupSettingsByType[type]) {
            const preset = getDefaultPreset(type);
            groupSettingsByType[type] = {
                presetId: preset?.id || '',
                format: preset?.format || (FORMAT_MAP[type] || [])[0] || '',
                quality: typeUsesQuality(type) ? (typeof preset?.quality === 'number' ? preset.quality : appSettings.defaultQuality) : null,
                outputFolder: ''
            };
        }
        return groupSettingsByType[type];
    }

    function getFileById(fileId) {
        return fileQueue.find((item) => item.id === fileId) || null;
    }

    function getSelectedFile() {
        return selectedScope.kind === 'file' ? getFileById(selectedScope.fileId) : null;
    }

    function getSelectedType() {
        if (selectedScope.kind === 'file') {
            return getSelectedFile()?.detectedType || 'audio';
        }
        return selectedScope.type || 'audio';
    }

    function resolveFileSettings(item) {
        const type = item.detectedType;
        if (!type || !FORMAT_MAP[type]) {
            return {
                type: null,
                format: '',
                quality: null,
                outputFolder: '',
                presetId: ''
            };
        }

        const group = ensureGroupSettings(type);
        const override = item.override || {};
        const format = override.format || group.format;
        const quality = typeUsesQuality(type)
            ? (typeof override.quality === 'number' ? override.quality : group.quality)
            : null;
        const outputFolder = override.outputFolder || group.outputFolder || appSettings.defaultOutputFolder || '';
        const presetId = override.presetId || group.presetId || '';

        return { type, format, quality, outputFolder, presetId };
    }

    function getScopeSettings(scope = selectedScope) {
        if (scope.kind === 'file') {
            const item = getFileById(scope.fileId);
            return item ? resolveFileSettings(item) : null;
        }

        const type = scope.type || 'audio';
        const group = ensureGroupSettings(type);
        if (!group) {
            return null;
        }
        return {
            type,
            format: group.format,
            quality: group.quality,
            outputFolder: group.outputFolder || appSettings.defaultOutputFolder || '',
            presetId: group.presetId || ''
        };
    }

    function setBatchStatus(state) {
        activeBatch = state;
        if (!state) {
            batchStatus.classList.add('hidden');
            batchStatusTitle.textContent = 'Conversion progress';
            batchStatusMeta.textContent = '0 completed • 0 remaining';
            batchProgressFill.style.width = '0%';
            return;
        }
        batchStatus.classList.remove('hidden');
        batchStatusTitle.textContent = state.title;
        batchStatusMeta.textContent = state.meta;
        batchProgressFill.style.width = `${Math.max(0, Math.min(100, state.percent || 0))}%`;
    }

    function createBatchTracker(totalJobs) {
        return {
            totalJobs,
            completed: 0,
            completedIds: new Set(),
            cancelled: false
        };
    }

    function markBatchItemComplete(fileId) {
        if (!activeBatch || !fileId || activeBatch.completedIds.has(fileId)) {
            return false;
        }
        activeBatch.completedIds.add(fileId);
        activeBatch.completed = activeBatch.completedIds.size;
        return true;
    }








































































































    function openSettings() {
        if (!settingsOverlay.classList.contains('hidden')) {
            closeSettings();
            return;
        }
        closeNotifications();
        syncSettingsForm();
        settingsOverlay.classList.remove('hidden');
        document.body.classList.add('settings-open');
    }

    function closeSettings() {
        settingsOverlay.classList.add('hidden');
        document.body.classList.remove('settings-open');
    }








































































































    function buildOutputPath(inputPath, format, resolvedOutputFolder) {
        if (window.app && window.app.buildOutputPath) {
            return window.app.buildOutputPath(inputPath, format, resolvedOutputFolder);
        }

        const outDir = resolvedOutputFolder || getFolderFromPath(inputPath);
        const baseName = inputPath.split('\\').pop().split('/').pop();
        const nameWithoutExt = baseName.lastIndexOf('.') > -1 ? baseName.slice(0, baseName.lastIndexOf('.')) : baseName;
        const separator = outDir.includes('\\') ? '\\' : '/';
        return `${outDir}${separator}${nameWithoutExt}.${format}`;
    }

    function getQueueGroups() {
        const groups = [];
        Object.keys(FORMAT_MAP).forEach((type) => {
            const items = fileQueue.filter((item) => item.detectedType === type);
            if (items.length > 0) {
                groups.push({ type, items });
            }
        });
        const unsupportedItems = fileQueue.filter((item) => !item.detectedType);
        if (unsupportedItems.length > 0) {
            groups.push({ type: 'unsupported', items: unsupportedItems });
        }
        return groups;
    }

    function selectGroup(type) {
        if (type !== 'unsupported' && !FORMAT_MAP[type]) {
            return;
        }
        selectedScope = { kind: 'group', type: type === 'unsupported' ? 'audio' : type };
        syncSidebarFromScope();
        renderTypeCards();
        renderQueue();
    }

    function selectFile(fileId) {
        const item = getFileById(fileId);
        if (!item || !item.detectedType) {
            return;
        }
        selectedScope = { kind: 'file', fileId };
        syncSidebarFromScope();
        renderTypeCards();
        renderQueue();
    }

    function renderTypeCards() {
        const selectedType = getSelectedType();
        const presentTypes = new Set(fileQueue.map((item) => item.detectedType).filter(Boolean));
        const queueHasFiles = fileQueue.length > 0;

        typeCards.forEach((card) => {
            const type = card.dataset.type;
            card.classList.toggle('active', type === selectedType);
            card.classList.toggle('type-card-empty', queueHasFiles && !presentTypes.has(type));
        });
    }

    function syncPresetSelectionFromControls(type, format, quality) {
        const matchingPreset = getMatchingPreset(type, format, quality);
        const builtIn = PRESET_CATALOG[type] || [];
        const isBuiltIn = builtIn.some(p => p.id === matchingPreset?.id);
        const isCustom = matchingPreset && matchingPreset.isCustom;

        if (matchingPreset) {
            presetSelect.value = matchingPreset.id;
            savePresetBtn?.classList.toggle('hidden', isBuiltIn);
            deletePresetBtn?.classList.toggle('hidden', !isCustom);
            const customOption = presetSelect.querySelector('option[value="__custom__"]');
            if (customOption) customOption.remove();
        } else {
            let customOption = presetSelect.querySelector('option[value="__custom__"]');
            if (!customOption) {
                customOption = document.createElement('option');
                customOption.value = '__custom__';
                customOption.textContent = 'Custom';
                presetSelect.appendChild(customOption);
            }
            presetSelect.value = '__custom__';
            savePresetBtn?.classList.remove('hidden');
            deletePresetBtn?.classList.add('hidden');
        }
    }

    function syncSidebarFromScope() {
        const scope = getScopeSettings();
        const type = getSelectedType();

        isSyncingScopeControls = true;
        outputFormatSelect.innerHTML = '';
        (FORMAT_MAP[type] || []).forEach((format) => {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format.toUpperCase();
            outputFormatSelect.appendChild(option);
        });

        presetSelect.innerHTML = '';
        getPresetsForType(type).forEach((preset) => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.label;
            presetSelect.appendChild(option);
        });

        if (scope) {
            outputFormatSelect.value = scope.format;
            qualitySlider.value = typeof scope.quality === 'number' ? scope.quality : appSettings.defaultQuality;
            qualityValue.textContent = `${qualitySlider.value}%`;
            outputFolderInput.value = scope.outputFolder || defaultDownloadsPath || '';
            syncPresetSelectionFromControls(type, scope.format, scope.quality);
        }

        qualityGroup.style.display = typeUsesQuality(type) ? '' : 'none';
        const fileItem = getSelectedFile();
        outputScopeLabel.textContent = fileItem
            ? `Editing: ${truncateName(fileItem.file.name, 28)}`
            : `Editing: ${TYPE_LABELS[type]} group`;
        resetFileOverrideBtn.classList.toggle('hidden', !(fileItem && fileItem.override));
        isSyncingScopeControls = false;
    }

    function getScopeTargetContainer() {
        if (selectedScope.kind === 'file') {
            return getSelectedFile();
        }
        return ensureGroupSettings(getSelectedType());
    }

    function updateScopeFromPreset(presetId) {
        const type = getSelectedType();
        const preset = getPresetById(type, presetId) || getDefaultPreset(type);
        if (!preset) {
            return;
        }

        const target = getScopeTargetContainer();
        if (!target) {
            return;
        }

        if (selectedScope.kind === 'file') {
            target.override = {
                ...(target.override || {}),
                presetId: preset.id,
                format: preset.format,
                quality: typeUsesQuality(type) ? preset.quality : undefined
            };
        } else {
            target.presetId = preset.id;
            target.format = preset.format;
            if (typeUsesQuality(type)) {
                target.quality = preset.quality;
            }
        }
        syncSidebarFromScope();
        renderQueue();
    }

    function updateScopeFormat(format) {
        const type = getSelectedType();
        const target = getScopeTargetContainer();
        if (!target) {
            return;
        }
        if (selectedScope.kind === 'file') {
            target.override = { ...(target.override || {}), format };
        } else {
            target.format = format;
        }
        const quality = typeUsesQuality(type) ? parseInt(qualitySlider.value, 10) : null;
        syncPresetSelectionFromControls(type, format, quality);
        renderQueue();
    }

    function updateScopeQuality(value) {
        const type = getSelectedType();
        if (!typeUsesQuality(type)) {
            return;
        }
        const safeValue = Math.min(100, Math.max(1, parseInt(value, 10) || appSettings.defaultQuality));
        qualityValue.textContent = `${safeValue}%`;
        const target = getScopeTargetContainer();
        if (!target) {
            return;
        }
        if (selectedScope.kind === 'file') {
            target.override = { ...(target.override || {}), quality: safeValue };
        } else {
            target.quality = safeValue;
        }
        syncPresetSelectionFromControls(type, outputFormatSelect.value, safeValue);
        renderQueue();
    }

    function updateScopeOutputFolder(folder) {
        const target = getScopeTargetContainer();
        if (!target) {
            return;
        }
        if (selectedScope.kind === 'file') {
            target.override = { ...(target.override || {}), outputFolder: folder || '' };
        } else {
            target.outputFolder = folder || '';
        }
        syncSidebarFromScope();
    }

    function getQueueStatusPresentation(item) {
        if (item.status === 'converting') {
            return {
                text: `Converting... ${item.progress}%`,
                color: 'var(--accent-audio)',
                width: `${item.progress}%`,
                background: 'var(--primary-btn)'
            };
        }
        if (item.status === 'done') {
            return {
                text: 'Completed',
                color: 'var(--accent-image)',
                width: '100%',
                background: 'var(--accent-image)'
            };
        }
        if (item.status === 'error') {
            return {
                text: item.errorMessage || 'Failed',
                color: '#f43f5e',
                width: '100%',
                background: '#f43f5e'
            };
        }
        if (item.status === 'cancelled') {
            return {
                text: item.errorMessage || 'Stopped',
                color: '#f59e0b',
                width: `${Math.max(0, Math.min(100, item.progress || 0))}%`,
                background: '#f59e0b'
            };
        }
        return {
            text: 'Ready',
            color: 'var(--text-muted)',
            width: '0%',
            background: 'var(--primary-btn)'
        };
    }

    function canRetryItem(item) {
        return Boolean(
            item?.detectedType
            && ['error', 'cancelled'].includes(item?.status)
            && item?.file?.path
            && !isConverting
        );
    }

    function createQueueItemElement(item) {
        const div = document.createElement('div');
        div.className = 'queue-item slide-in';
        div.id = `queue-${item.id}`;
        div.innerHTML = `
            <div class="queue-icon"><i class="fa-regular"></i></div>
            <div class="queue-info">
                <span class="queue-name"></span>
                <i class="fa-solid fa-arrow-right queue-arrow"></i>
                <span class="queue-format"></span>
                <span class="queue-size"></span>
                <span class="queue-encoder-badge hidden"></span>
                <span class="queue-override-badge hidden">Custom</span>
            </div>
            <div class="progress-container">
                <div class="progress-text"></div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
            <div class="queue-actions">
                <button class="no-drag queue-cancel-btn hidden" data-id="${item.id}" title="Cancel conversion">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <button class="no-drag queue-retry-btn hidden" data-id="${item.id}" title="Retry conversion">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button class="no-drag queue-delete-btn" data-id="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        div.querySelector('.queue-cancel-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            window.app.cancelFile({ fileId: item.id });
        });

        div.querySelector('.queue-retry-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            retryQueueItem(item.id);
        });
        
        div.querySelector('.queue-delete-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            removeFromQueue(item.id);
        });

        if (item.detectedType) {
            div.addEventListener('click', () => selectFile(item.id));
        }

        div.draggable = item.status === 'ready';
        div.addEventListener('dragstart', (event) => {
            if (isConverting || item.status !== 'ready') {
                event.preventDefault();
                return;
            }
            dragSrcId = item.id;
            div.classList.add('queue-item-dragging');
        });

        div.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (item.id === dragSrcId) return;
            dragOverId = item.id;
            div.classList.add('queue-item-drag-over');
            document.querySelectorAll('.queue-item').forEach(el => {
                if (el !== div) el.classList.remove('queue-item-drag-over');
            });
        });

        div.addEventListener('dragleave', () => {
            div.classList.remove('queue-item-drag-over');
        });

        div.addEventListener('drop', (event) => {
            event.preventDefault();
            if (dragSrcId && dragSrcId !== dragOverId) {
                const srcIdx = fileQueue.findIndex(i => i.id === dragSrcId);
                const targetIdx = fileQueue.findIndex(i => i.id === dragOverId);
                const [removed] = fileQueue.splice(srcIdx, 1);
                fileQueue.splice(targetIdx, 0, removed);
                serializeQueue();
                renderQueue();
            }
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('queue-item-dragging');
            document.querySelectorAll('.queue-item').forEach(el => {
                el.classList.remove('queue-item-dragging', 'queue-item-drag-over');
            });
            dragSrcId = null;
            dragOverId = null;
        });

        patchQueueItemElement(div, item);
        return div;
    }

    function patchQueueItemElement(el, item) {
        const settings = resolveFileSettings(item);
        const iconInfo = getIconForType(item.detectedType || 'unknown');
        const status = getQueueStatusPresentation(item);
        const sizeMB = item.file.size ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB` : '';

        const iconWrap = el.querySelector('.queue-icon');
        const icon = el.querySelector('.queue-icon i');
        const name = el.querySelector('.queue-name');
        const formatEl = el.querySelector('.queue-format');
        const sizeEl = el.querySelector('.queue-size');
        const encoderBadge = el.querySelector('.queue-encoder-badge');
        const progressText = el.querySelector('.progress-text');
        const progressBar = el.querySelector('.progress-bar-fill');
        const cancelBtn = el.querySelector('.queue-cancel-btn');
        const retryBtn = el.querySelector('.queue-retry-btn');
        const deleteBtn = el.querySelector('.queue-delete-btn');
        const overrideBadge = el.querySelector('.queue-override-badge');
        const retryVisible = canRetryItem(item);

        iconWrap.className = `queue-icon ${iconInfo.class}`;
        icon.className = `fa-regular ${iconInfo.icon}`;
        name.textContent = truncateName(item.file.name, 25);
        name.title = item.file.name;
        formatEl.textContent = settings.format ? settings.format.toUpperCase() : 'N/A';
        sizeEl.textContent = sizeMB;
        sizeEl.style.display = sizeMB ? '' : 'none';
        progressText.textContent = status.text;
        progressText.style.color = status.color;
        progressBar.style.width = status.width;
        progressBar.style.background = status.background;
        cancelBtn.classList.toggle('hidden', item.status !== 'converting');
        retryBtn.classList.toggle('hidden', !retryVisible);
        retryBtn.disabled = !retryVisible;
        deleteBtn.disabled = item.status === 'converting';
        overrideBadge.classList.toggle('hidden', !item.override);
        el.classList.toggle('queue-item-selected', selectedScope.kind === 'file' && selectedScope.fileId === item.id);
        el.classList.toggle('queue-item-disabled', !item.detectedType);

        if (item.status === 'done') {
            if (item.hardwareAccelerated && item.encoder) {
                encoderBadge.textContent = `⚡ ${item.encoder.toUpperCase()}`;
                encoderBadge.dataset.hw = 'true';
                encoderBadge.classList.remove('hidden');
            } else {
                encoderBadge.textContent = 'CPU';
                encoderBadge.dataset.hw = 'false';
                encoderBadge.classList.remove('hidden');
            }
        } else {
            encoderBadge.classList.add('hidden');
        }

        el.draggable = item.status === 'ready' && !isConverting;
    }

    function createGroupSection(group, isMixedBatch, renderState) {
        const wrapper = document.createElement('div');
        wrapper.className = 'queue-group';

        if (group.type === 'unsupported') {
            wrapper.classList.add('queue-group-unsupported');
        }

        if (isMixedBatch || group.type === 'unsupported') {
            const header = document.createElement('div');
            header.className = 'queue-group-header';

            if (group.type === 'unsupported') {
                header.innerHTML = `
                    <div>
                        <h5>Unsupported Files (${group.items.length})</h5>
                        <p>These items cannot be converted until a supported format is added.</p>
                    </div>
                `;
            } else {
                const groupSettings = ensureGroupSettings(group.type);
                const summary = groupSettings
                    ? `${groupSettings.format.toUpperCase()}${typeUsesQuality(group.type) ? ` • ${groupSettings.quality}%` : ''}`
                    : '';
                header.innerHTML = `
                    <div>
                        <h5>${TYPE_LABELS[group.type]} Files (${group.items.length})</h5>
                        <p>${summary}</p>
                    </div>
                `;
                header.addEventListener('click', () => selectGroup(group.type));
                header.classList.toggle('queue-group-header-active', selectedScope.kind === 'group' && getSelectedType() === group.type);
            }

            wrapper.appendChild(header);
        }

        const maxTotalRender = 50;
        let skippedCount = 0;

        group.items.forEach((item) => {
            if (renderState.renderedCount < maxTotalRender) {
                wrapper.appendChild(createQueueItemElement(item));
                renderState.renderedCount++;
            } else {
                skippedCount++;
            }
        });

        if (skippedCount > 0) {
            const footerNote = document.createElement('div');
            footerNote.style.padding = '8px 14px';
            footerNote.style.fontSize = '12px';
            footerNote.style.color = 'var(--text-muted, #94a3b8)';
            footerNote.style.fontStyle = 'italic';
            footerNote.textContent = `... and ${skippedCount} additional files in this group (hidden to preserve app responsiveness). All files will be converted.`;
            wrapper.appendChild(footerNote);
        }

        return wrapper;
    }

    function updateConvertButtonLabel() {
        const readyCount = fileQueue.filter((item) => item.status === 'ready' && item.detectedType).length;
        if (isConverting) {
            convertBtn.innerHTML = isCancellingConversion
                ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Stopping...'
                : '<i class="fa-solid fa-stop"></i> Stop Conversion';
            convertBtn.disabled = isCancellingConversion;
            convertBtn.classList.add('processing');
            return;
        }

        convertBtn.disabled = false;
        convertBtn.classList.remove('processing');
        convertBtn.innerHTML = readyCount > 1
            ? `<i class="fa-solid fa-layer-group"></i> Convert ${readyCount} Files`
            : readyCount === 1
                ? '<i class="fa-solid fa-play"></i> Convert File'
                : '<i class="fa-solid fa-play"></i> Start Conversion';
    }

    function renderQueue() {
        const groups = getQueueGroups();

        if (fileQueue.length === 0) {
            queueList.replaceChildren(queueEmpty);
            queueEmpty.style.display = 'flex';
            queueCount.textContent = '';
            updateConvertButtonLabel();
            renderTypeCards();
            return;
        }

        queueEmpty.style.display = 'none';
        queueCount.textContent = `(${fileQueue.length})`;
        const supportedGroups = groups.filter((group) => group.type !== 'unsupported');
        const isMixedBatch = supportedGroups.length > 1;
        const fragment = document.createDocumentFragment();
        const renderState = { renderedCount: 0 };

        groups.forEach((group) => {
            fragment.appendChild(createGroupSection(group, isMixedBatch, renderState));
        });

        queueList.replaceChildren(queueEmpty, fragment);

        updateConvertButtonLabel();
        renderTypeCards();
    }

    function updateQueueItemProgress(fileId, percent) {
        const item = getFileById(fileId);
        if (!item) {
            return;
        }
        item.progress = percent;
        if (percent >= 100 && item.status === 'converting') {
            item.status = 'done';
        }
        const el = document.getElementById(`queue-${fileId}`);
        if (el) {
            patchQueueItemElement(el, item);
        }
    }

    function removeFromQueue(id) {
        fileQueue = fileQueue.filter((item) => item.id !== id);
        if (selectedScope.kind === 'file' && selectedScope.fileId === id) {
            selectedScope = { kind: 'group', type: getQueueGroups()[0]?.type && getQueueGroups()[0].type !== 'unsupported' ? getQueueGroups()[0].type : 'audio' };
        }
        if (fileQueue.every((item) => item.detectedType !== getSelectedType())) {
            selectedScope = { kind: 'group', type: fileQueue.find((item) => item.detectedType)?.detectedType || 'audio' };
        }
        serializeQueue();
        renderQueue();
        syncSidebarFromScope();
    }

    function removeCompletedItemsFromQueue(fileIds) {
        const idsToRemove = new Set((fileIds || []).filter(Boolean));
        if (idsToRemove.size === 0) {
            return;
        }
        fileQueue = fileQueue.filter((item) => !idsToRemove.has(item.id));

        if (selectedScope.kind === 'file' && idsToRemove.has(selectedScope.fileId)) {
            selectedScope = {
                kind: 'group',
                type: getQueueGroups()[0]?.type && getQueueGroups()[0].type !== 'unsupported'
                    ? getQueueGroups()[0].type
                    : 'audio'
            };
        }

        if (fileQueue.every((item) => item.detectedType !== getSelectedType())) {
            selectedScope = {
                kind: 'group',
                type: fileQueue.find((item) => item.detectedType)?.detectedType || 'audio'
            };
        }
        serializeQueue();
    }

    function addFilesToQueue(files) {
        const firstDetectedType = appSettings.autoDetectType ? detectTypeFromFileName(files[0]) : null;
        let supportedAdded = 0;
        let unsupportedAdded = 0;

        files.forEach((file) => {
            const detectedType = detectTypeFromFileName(file);
            if (detectedType) {
                ensureGroupSettings(detectedType);
                supportedAdded += 1;
            } else {
                unsupportedAdded += 1;
            }

            fileQueue.push({
                id: `file-${fileIdCounter++}`,
                file,
                detectedType,
                status: detectedType ? 'ready' : 'error',
                progress: detectedType ? 0 : 100,
                override: null,
                errorMessage: detectedType ? '' : 'Unsupported file type',
                recordedInRecent: false
            });
        });

        if (firstDetectedType) {
            selectedScope = { kind: 'group', type: firstDetectedType };
        } else if (!fileQueue.some((item) => item.detectedType === getSelectedType())) {
            selectedScope = { kind: 'group', type: fileQueue.find((item) => item.detectedType)?.detectedType || 'audio' };
        }

        renderQueue();
        syncSidebarFromScope();

        if (supportedAdded > 0) {
            showToast(`${supportedAdded} file${supportedAdded > 1 ? 's' : ''} added to queue`, 'info');
        }
        if (unsupportedAdded > 0) {
            showToast(`${unsupportedAdded} file${unsupportedAdded > 1 ? 's are' : ' is'} not supported yet`, 'warning');
        }
        serializeQueue();
    }

    async function retryQueueItem(fileId) {
        const item = getFileById(fileId);
        if (!item || !canRetryItem(item)) {
            return;
        }

        const resolved = resolveFileSettings(item);
        if (!resolved?.type || !resolved?.format) {
            showToast(`Retry settings are incomplete for ${item.file.name}`, 'warning');
            return;
        }

        item.status = 'converting';
        item.progress = 0;
        item.errorMessage = '';
        renderQueue();

        try {
            const requestedOutputPath = buildOutputPath(item.file.path, resolved.format, resolved.outputFolder);
            const result = await window.app.convertFile({
                inputPath: item.file.path,
                outputPath: requestedOutputPath,
                format: resolved.format,
                type: resolved.type,
                quality: resolved.quality,
                fileId: item.id
            });

                if (result?.success) {
                    item.status = 'done';
                    item.progress = 100;
                    item.errorMessage = '';
                    item.hardwareAccelerated = Boolean(result.hardwareAccelerated);
                    item.encoder = result.encoder || null;

                    if (!item.recordedInRecent) {
                        refreshRecentFiles();
                        item.recordedInRecent = true;
                    }
                    serializeQueue();
                    showToast(`${item.file.name} converted successfully`, 'success');
                    if (result.outputPath && result.outputPath !== requestedOutputPath) {
                        showToast('Output file was auto-renamed to avoid overwriting an existing file', 'info');
                    }

                    if (appSettings.openFolderOnComplete && result.outputPath && window.app?.openFolder) {
                        await window.app.openFolder(getFolderFromPath(result.outputPath));
                    }

                    removeCompletedItemsFromQueue([item.id]);
            } else if (result?.cancelled) {
                item.status = 'cancelled';
                item.errorMessage = result?.error || 'Conversion stopped.';
                showToast(item.errorMessage, 'warning');
            } else {
                item.status = 'error';
                item.progress = 100;
                item.errorMessage = result?.error || 'Failed';
                showToast(item.errorMessage || `Failed to convert ${item.file.name}`, 'error', 6000);
            }
        } catch (error) {
            item.status = 'error';
            item.progress = 100;
            item.errorMessage = error?.message || 'Failed';
            showToast(item.errorMessage || `Failed to convert ${item.file.name}`, 'error', 6000);
        } finally {
            serializeQueue();
            renderQueue();
        }
    }

    async function stopActiveConversion() {
        if (!isConverting || isCancellingConversion || !window.app?.cancelConversion) {
            return;
        }

        isCancellingConversion = true;
        updateConvertButtonLabel();
        showToast('Stopping conversion...', 'info', 2500, { skipNotification: true });

        try {
            const result = await window.app.cancelConversion();
            if (!result?.success) {
                isCancellingConversion = false;
                updateConvertButtonLabel();
                showToast(result?.error || 'Nothing is currently running to stop.', 'warning');
            }
        } catch (error) {
            isCancellingConversion = false;
            updateConvertButtonLabel();
            showToast(error?.message || 'Unable to stop the current conversion.', 'error', 6000);
        }
    }

    async function runBatchConversion() {
        if (isConverting) {
            return;
        }

        const readyFiles = fileQueue.filter((item) => item.status === 'ready' && item.detectedType);
        if (readyFiles.length === 0) {
            uploadZone.classList.add('error-shake');
            setTimeout(() => uploadZone.classList.remove('error-shake'), 500);
            showToast('No files to convert. Add files first!', 'error', 6000);
            return;
        }

        isConverting = true;
        isCancellingConversion = false;
        updateConvertButtonLabel();

        let successCount = 0;
        let errorCount = 0;
        let cancelledCount = 0;
        let renamedOutputCount = 0;
        const completedQueueIds = [];
        const isSingleConversion = readyFiles.length === 1;

        readyFiles.forEach((item) => {
            item.status = 'converting';
            item.progress = 0;
        });

        renderQueue();
        setBatchStatus({
            title: isSingleConversion ? 'Preparing conversion' : `Preparing batch of ${readyFiles.length}`,
            meta: `0 completed • ${readyFiles.length} remaining`,
            percent: 0,
            completed: 0,
            completedIds: new Set()
        });
        activeBatch = createBatchTracker(readyFiles.length);

        const invalidItems = readyFiles.filter((item) => !item.file.path);
        invalidItems.forEach((item) => {
            item.status = 'error';
            item.progress = 100;
            item.errorMessage = 'Missing source path';
            errorCount += 1;
            markBatchItemComplete(item.id);
            showToast(`Unable to read the source path for ${item.file.name}`, 'error', 6000);
        });

        const jobs = readyFiles
            .filter((item) => item.file.path)
            .map((item) => {
                const resolved = resolveFileSettings(item);
                return {
                    inputPath: item.file.path,
                    outputPath: buildOutputPath(item.file.path, resolved.format, resolved.outputFolder),
                    format: resolved.format,
                    type: resolved.type,
                    quality: resolved.quality,
                    fileId: item.id
                };
            });

        if (jobs.length > 0) {
            try {
                const result = await window.app.convertBatch({ jobs });
                const results = Array.isArray(result?.results) ? result.results : [];
                const batchWasCancelled = Boolean(result?.cancelled);
                if (batchWasCancelled && activeBatch) {
                    activeBatch.cancelled = true;
                }

                results.forEach((entry, resultIndex) => {
                    const item = getFileById(entry.fileId);
                    if (!item) {
                        return;
                    }
                    if (entry.success) {
                        item.status = 'done';
                        item.progress = 100;
                        item.errorMessage = '';
                        item.hardwareAccelerated = Boolean(entry.hardwareAccelerated);
                        item.encoder = entry.encoder || null;
                        successCount += 1;
                        if (entry.outputPath && jobs[resultIndex] && entry.outputPath !== jobs[resultIndex].outputPath) {
                            renamedOutputCount += 1;
                        }
                        markBatchItemComplete(item.id);
                        if (!item.recordedInRecent) {
                            refreshRecentFiles();
                            item.recordedInRecent = true;
                        }
                        completedQueueIds.push(item.id);
                    } else if (entry.cancelled) {
                        item.status = 'cancelled';
                        item.errorMessage = entry.error || 'Conversion stopped.';
                        cancelledCount += 1;
                    } else {
                        item.status = 'error';
                        item.progress = 100;
                        item.errorMessage = entry.error || 'Failed';
                        errorCount += 1;
                        markBatchItemComplete(item.id);
                        console.error('Batch conversion failed:', entry.error);
                        showToast(entry.error || `Failed to convert ${item.file.name}`, 'error', 6000);
                    }

                    const completed = successCount + errorCount;
                    setBatchStatus({
                        title: isSingleConversion ? 'Processing conversion' : `Processed ${resultIndex + 1} of ${results.length}`,
                        meta: `${completed} completed • ${Math.max(0, readyFiles.length - completed - cancelledCount)} remaining`,
                        percent: results.length ? Math.round(((resultIndex + 1) / results.length) * 100) : 100,
                        completed,
                        completedIds: activeBatch?.completedIds || new Set()
                    });
                });

                if (!result?.success && result?.error && results.length === 0) {
                    showToast(result.error, batchWasCancelled ? 'warning' : 'error', 6000);
                }

                if (appSettings.openFolderOnComplete && successCount > 0 && window.app && window.app.openFolder) {
                    const firstSuccess = results.find((entry) => entry.success && entry.outputPath);
                    if (firstSuccess) {
                        await window.app.openFolder(getFolderFromPath(firstSuccess.outputPath));
                    }
                }
            } catch (error) {
                console.error('Batch conversion error:', error);
                showToast(error?.message || 'Batch conversion failed.', 'error', 6000);
                readyFiles.forEach((item) => {
                    if (item.status === 'converting') {
                        item.status = 'error';
                        item.progress = 100;
                        item.errorMessage = 'Batch failed';
                        errorCount += 1;
                    }
                });
            }
        }

        isConverting = false;
        isCancellingConversion = false;
        updateConvertButtonLabel();
        setBatchStatus({
            title: cancelledCount > 0
                ? (isSingleConversion ? 'Conversion stopped' : 'Batch stopped')
                : errorCount === 0
                    ? (isSingleConversion ? 'Conversion complete' : 'Batch complete')
                    : (isSingleConversion ? 'Conversion finished with issues' : 'Batch finished with issues'),
            meta: cancelledCount > 0
                ? `${successCount} completed • ${cancelledCount} stopped`
                : `${successCount} completed • ${errorCount} failed`,
            percent: 100,
            completed: successCount + errorCount + cancelledCount,
            completedIds: activeBatch?.completedIds || new Set()
        });
        serializeQueue();
        removeCompletedItemsFromQueue(completedQueueIds);
        renderQueue();


        if (cancelledCount > 0) {
            showToast(
                isSingleConversion
                    ? 'Conversion stopped.'
                    : `${cancelledCount} conversion${cancelledCount > 1 ? 's were' : ' was'} stopped.`,
                'warning'
            );
        } else if (successCount > 0 && errorCount === 0) {
            showToast(`${successCount} file${successCount > 1 ? 's' : ''} converted successfully!`, 'success');
        } else if (successCount > 0 && errorCount > 0) {
            showToast(`${successCount} succeeded, ${errorCount} failed`, 'warning');
        } else {
            showToast(`Conversion failed for ${errorCount} file${errorCount > 1 ? 's' : ''}`, 'error');
        }

        if (renamedOutputCount > 0) {
            showToast(`${renamedOutputCount} output file${renamedOutputCount > 1 ? 's were' : ' was'} auto-renamed to avoid overwriting existing files`, 'info');
        }
    }

    function formatBytes(bytes) {
        const size = Number(bytes) || 0;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }




















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































    let videoToolkitLoaded = false;
    async function lazyLoadVideoToolkit() {
        if (videoToolkitLoaded) return;
        try {
            const container = document.getElementById('video-toolkit-workspace');
            const response = await fetch('video-toolkit.html', { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch video-toolkit.html');
            const html = await response.text();
            container.innerHTML = html;

            // Load and append script
            const script = document.createElement('script');
            script.src = 'video-toolkit.js?v=' + Date.now();
            document.body.appendChild(script);

            videoToolkitLoaded = true;
        } catch (err) {
            console.error('[renderer] Failed to lazy load Video Toolkit:', err);
            if (typeof window.showToast === 'function') {
                window.showToast('Failed to load Video Toolkit module.', 'error');
            }
        }
    }

    function switchWorkspace(target) {
        if (!launchpadWorkspace || !converterWorkspace || !pdfWorkspace || !imageToolkitWorkspace || !videoToolkitWorkspace || !headerHomeBtn) {
            return;
        }

        if (target === 'converter') {
            launchpadWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
            imageToolkitWorkspace.classList.add('hidden');
            videoToolkitWorkspace.classList.add('hidden');
            converterWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.remove('hidden');
            localStorage.setItem('converthub_last_workspace', 'converter');
        } else if (target === 'pdf') {
            launchpadWorkspace.classList.add('hidden');
            converterWorkspace.classList.add('hidden');
            imageToolkitWorkspace.classList.add('hidden');
            videoToolkitWorkspace.classList.add('hidden');
            setPdfMode('img-to-pdf');
            pdfWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.remove('hidden');
            localStorage.setItem('converthub_last_workspace', 'pdf');
        } else if (target === 'image-toolkit') {
            launchpadWorkspace.classList.add('hidden');
            converterWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
            videoToolkitWorkspace.classList.add('hidden');
            imageToolkitWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.remove('hidden');
            localStorage.setItem('converthub_last_workspace', 'image-toolkit');
        } else if (target === 'video') {
            launchpadWorkspace.classList.add('hidden');
            converterWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
            imageToolkitWorkspace.classList.add('hidden');
            
            lazyLoadVideoToolkit().then(() => {
                videoToolkitWorkspace.classList.remove('hidden');
                headerHomeBtn.classList.remove('hidden');
                localStorage.setItem('converthub_last_workspace', 'video');
            });
        } else {
            // launchpad
            converterWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
            imageToolkitWorkspace.classList.add('hidden');
            videoToolkitWorkspace.classList.add('hidden');
            launchpadWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.add('hidden');
        }
    }

    async function init() {

        appSettings = getSavedSettings();
        notifications = getSavedNotifications();

        if (window.app && window.app.getFormats) {
            try {
                const formats = await window.app.getFormats();
                if (formats && typeof formats === 'object') {
                    FORMAT_MAP = formats;
                }
            } catch {
                // Keep fallback list.
            }
        }

        if (window.app && window.app.getDefaultOutput) {
            try {
                defaultDownloadsPath = await window.app.getDefaultOutput();
            } catch {
                defaultDownloadsPath = '';
            }
        }

        await restoreQueue();

        if (window.app && window.app.getEngineStatus) {
            try {
                engineStatus = await window.app.getEngineStatus();
            } catch {
                engineStatus = null;
            }
        }

        syncSettingsForm();
        if (pdfOutputFolderInput && !pdfOutputFolderInput.value) {
            pdfOutputFolderInput.value = appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        }
        if (pdfExtractFolderInput && !pdfExtractFolderInput.value) {
            pdfExtractFolderInput.value = appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        }
        if (pdfMergeFolderInput && !pdfMergeFolderInput.value) {
            pdfMergeFolderInput.value = appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        }
        window.renderPdfImageList?.();
        window.renderPdfMergeList?.();
        window.clearPdfExtractFile?.();
        setPdfMode('img-to-pdf');
        ensureGroupSettings('audio');
        syncSidebarFromScope();
        loadRecentFiles();
        renderNotifications();
        updateNotificationBadge();
        renderEngineStatus();
        renderQueue();

        // Setup Launchpad bypass checkbox visual state from localStorage
        const bypassLaunchpad = localStorage.getItem('converthub_bypass_launchpad') === 'true';
        if (bypassLaunchpadCheckbox) {
            bypassLaunchpadCheckbox.checked = bypassLaunchpad;
        }

        // Determine which workspace to load on startup
        const lastWorkspace = localStorage.getItem('converthub_last_workspace') || 'converter';
        const startupPref = appSettings.startupWorkspace || 'last';
        if (bypassLaunchpad) {
            if (startupPref === 'last') {
                switchWorkspace(lastWorkspace);
            } else {
                switchWorkspace(startupPref);
            }
        } else {
            switchWorkspace('launchpad');
        }


        const missingEngines = Object.entries(engineStatus?.engines || {})
            .filter(([, info]) => !info.available)
            .map(([name]) => name);
        if (missingEngines.length > 0) {
            showToast(`Some converters are unavailable on this ${getPlatformLabel(engineStatus?.platform)} setup: ${missingEngines.join(', ')}`, 'warning', 6000, { skipNotification: true });
        }
        openEngineSetupGuide({ startup: true });

        if (window.app?.onSystemThemeUpdated) {
            window.app.onSystemThemeUpdated((theme) => {
                if (appSettings.theme === 'auto') {
                    applyTheme('auto');
                }
            });
        }

        if (window.app?.onConversionCompleteFocused) {
            window.app.onConversionCompleteFocused((record) => {
                loadRecentFiles();
            });
        }

        if (window.app?.onConversionCompleteBackground) {
            window.app.onConversionCompleteBackground((record) => {
                loadRecentFiles();
                // Add an in-app notification too
                addNotification(
                    'Conversion Complete',
                    `${record.inputFiles[0]?.name || 'File'} converted to ${record.outputFormat.toUpperCase()}`,
                    'success'
                );
            });
        }

        if (window.app && window.app.onProgress) {
            window.app.onProgress((data) => {
                updateQueueItemProgress(data.fileId, data.percent);
                if (activeBatch && typeof data.batchIndex === 'number' && typeof data.totalJobs === 'number') {
                    if (data.percent >= 100) {
                        const item = getFileById(data.fileId);
                        if (item && item.status === 'converting') {
                            item.status = 'done';
                        }
                        markBatchItemComplete(data.fileId);
                    }
                    const completed = activeBatch.completed || 0;
                    const remaining = Math.max(0, data.totalJobs - completed);
                    setBatchStatus({
                        title: data.totalJobs === 1
                            ? 'Converting file'
                            : `Batch converting ${data.batchIndex + 1} of ${data.totalJobs}`,
                        meta: `${completed} completed • ${remaining} remaining`,
                        percent: Math.round(((data.batchIndex + (data.percent / 100)) / data.totalJobs) * 100),
                        completed,
                        completedIds: activeBatch.completedIds
                    });
                }
            });
        }
        initClientUpdater();
    }

    let isManualUpdateCheck = false;

    function initClientUpdater() {
        if (!window.app) {
            console.warn('[renderer] updater unavailable: desktop bridge not loaded');
            if (updaterVersionInfo) {
                updaterVersionInfo.textContent = 'Updater offline: Desktop bridge unavailable.';
            }
            return;
        }

        // Fetch version dynamically
        if (window.app.getAppVersion) {
            window.app.getAppVersion().then((version) => {
                const versionPill = document.querySelector('.about-version-pill');
                if (versionPill) {
                    versionPill.textContent = `v${version}`;
                }
                if (updaterVersionInfo) {
                    updaterVersionInfo.textContent = `Current version: v${version} • Last checked: Never`;
                }
            }).catch((e) => {
                console.error('[renderer] failed to fetch app version:', e);
            });
        }

        // Sync initial updater config
        if (window.app.setUpdaterConfig) {
            window.app.setUpdaterConfig({
                autoDownload: !!appSettings.autoDownloadUpdates
            });
        }

        // Button events
        if (updaterCheckBtn) {
            updaterCheckBtn.addEventListener('click', async () => {
                isManualUpdateCheck = true;
                updaterCheckBtn.disabled = true;
                updaterCheckBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Checking...';
                try {
                    await window.app.checkForUpdates();
                } catch (e) {
                    console.error('[renderer] Check for updates failed:', e);
                    updaterCheckBtn.disabled = false;
                    updaterCheckBtn.textContent = 'Check for Updates';
                    showToast('Update check failed: ' + (e.message || e), 'error');
                }
            });
        }

        if (updaterDownloadBtn) {
            updaterDownloadBtn.addEventListener('click', async () => {
                updaterDownloadBtn.disabled = true;
                updaterDownloadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Downloading...';
                try {
                    await window.app.downloadUpdate();
                } catch (e) {
                    console.error('[renderer] Download failed:', e);
                    updaterDownloadBtn.disabled = false;
                    updaterDownloadBtn.textContent = 'Download Update';
                    showToast('Download failed: ' + (e.message || e), 'error');
                }
            });
        }

        if (updaterInstallBtn) {
            updaterInstallBtn.addEventListener('click', () => {
                window.app.restartAndInstallUpdate();
            });
        }

        // Event listener for status changes
        if (window.app.onUpdateStatus) {
            window.app.onUpdateStatus((data) => {
                console.log('[renderer] Received updater status:', data);
                const status = data.status;

                // Reset statuses
                if (updaterStatusText) {
                    updaterStatusText.className = ''; // remove coloring classes
                }

                if (status === 'checking') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = 'Checking for updates...';
                        updaterStatusText.classList.add('updater-status-info');
                    }
                    if (updaterCheckBtn) {
                        updaterCheckBtn.disabled = true;
                        updaterCheckBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Checking...';
                    }
                    updaterDownloadBtn?.classList.add('hidden');
                    updaterInstallBtn?.classList.add('hidden');
                    updaterProgressContainer?.classList.add('hidden');
                }
                else if (status === 'available') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = `New Update Available (v${data.version})`;
                        updaterStatusText.classList.add('updater-status-info');
                    }
                    if (updaterVersionInfo) {
                        updaterVersionInfo.textContent = `Version v${data.version} is ready to download.`;
                    }
                    if (updaterCheckBtn) {
                        updaterCheckBtn.disabled = false;
                        updaterCheckBtn.textContent = 'Check for Updates';
                    }

                    showToast(`A new version of ConvertHub is available (v${data.version})!`, 'info', 6000);

                    if (appSettings.autoDownloadUpdates) {
                        updaterDownloadBtn?.classList.add('hidden');
                        updaterInstallBtn?.classList.add('hidden');
                        updaterProgressContainer?.classList.remove('hidden');
                        // Trigger download automatically
                        window.app.downloadUpdate().catch(console.error);
                    } else {
                        if (updaterDownloadBtn) {
                            updaterDownloadBtn.classList.remove('hidden');
                            updaterDownloadBtn.disabled = false;
                            updaterDownloadBtn.textContent = `Download v${data.version}`;
                        }
                        updaterInstallBtn?.classList.add('hidden');
                        updaterProgressContainer?.classList.add('hidden');
                    }
                }
                else if (status === 'not-available') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = 'Up to date';
                        updaterStatusText.classList.add('updater-status-success');
                    }
                    if (updaterVersionInfo) {
                        const now = new Date().toLocaleTimeString();
                        updaterVersionInfo.textContent = `Current version is latest • Last checked: ${now}`;
                    }
                    if (updaterCheckBtn) {
                        updaterCheckBtn.disabled = false;
                        updaterCheckBtn.textContent = 'Check for Updates';
                    }
                    updaterDownloadBtn?.classList.add('hidden');
                    updaterInstallBtn?.classList.add('hidden');
                    updaterProgressContainer?.classList.add('hidden');

                    if (isManualUpdateCheck) {
                        showToast('You are on the latest version of ConvertHub.', 'success');
                        isManualUpdateCheck = false;
                    }
                }
                else if (status === 'download-progress') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = 'Downloading update...';
                        updaterStatusText.classList.add('updater-status-info');
                    }
                    updaterDownloadBtn?.classList.add('hidden');
                    updaterInstallBtn?.classList.add('hidden');
                    updaterProgressContainer?.classList.remove('hidden');

                    const percent = data.percent || 0;
                    if (updaterProgressFill) {
                        updaterProgressFill.style.width = `${percent}%`;
                    }
                    if (updaterProgressPercent) {
                        updaterProgressPercent.textContent = `${percent}%`;
                    }
                    if (updaterProgressSpeed && data.bytesPerSecond) {
                        const mbps = (data.bytesPerSecond / (1024 * 1024)).toFixed(1);
                        updaterProgressSpeed.textContent = `${mbps} MB/s`;
                    }
                }
                else if (status === 'downloaded') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = 'Update ready to install';
                        updaterStatusText.classList.add('updater-status-success');
                    }
                    if (updaterVersionInfo) {
                        updaterVersionInfo.textContent = `Version v${data.version || ''} downloaded successfully. Restart app to update.`;
                    }
                    if (updaterCheckBtn) {
                        updaterCheckBtn.disabled = false;
                        updaterCheckBtn.textContent = 'Check for Updates';
                    }
                    updaterDownloadBtn?.classList.add('hidden');
                    if (updaterInstallBtn) {
                        updaterInstallBtn.classList.remove('hidden');
                        updaterInstallBtn.disabled = false;
                        updaterInstallBtn.textContent = 'Restart & Install';
                    }
                    updaterProgressContainer?.classList.add('hidden');

                    showToast('Update downloaded. Click Restart & Install to apply.', 'success', 8000);
                }
                else if (status === 'error') {
                    if (updaterStatusText) {
                        updaterStatusText.textContent = 'Update check failed';
                        updaterStatusText.classList.add('updater-status-warning');
                    }
                    if (updaterVersionInfo) {
                        updaterVersionInfo.textContent = `Error: ${data.message || 'An unknown error occurred.'}`;
                    }
                    if (updaterCheckBtn) {
                        updaterCheckBtn.disabled = false;
                        updaterCheckBtn.textContent = 'Check for Updates';
                    }
                    updaterDownloadBtn?.classList.add('hidden');
                    updaterInstallBtn?.classList.add('hidden');
                    updaterProgressContainer?.classList.add('hidden');

                    if (isManualUpdateCheck) {
                        showToast(`Failed to check updates: ${data.message || 'Unknown error'}`, 'error');
                        isManualUpdateCheck = false;
                    }
                }
            });
        }

        // Automatic startup updates check
        if (appSettings.autoCheckUpdates) {
            setTimeout(() => {
                console.log('[renderer] Auto check updates started');
                window.app.checkForUpdates().catch(console.error);
            }, 3000);
        }
    }

    themeToggle.addEventListener('click', () => {
        applyTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        persistSettings();
    });

    settingsToggle.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    notificationsToggle.addEventListener('click', openNotifications);
    notificationsClose.addEventListener('click', closeNotifications);
    settingsOverlay.addEventListener('click', (event) => {
        if (event.target === settingsOverlay) {
            closeSettings();
        }
    });
    notificationsOverlay.addEventListener('click', (event) => {
        if (event.target === notificationsOverlay) {
            closeNotifications();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !settingsOverlay.classList.contains('hidden')) {
            closeSettings();
        }
        if (event.key === 'Escape' && engineModalOverlay && !engineModalOverlay.classList.contains('hidden')) {
            closeEngineSetupGuide();
        }
        if (event.key === 'Escape' && !notificationsOverlay.classList.contains('hidden')) {
            closeNotifications();
        }
    });

    notificationsMarkRead.addEventListener('click', () => {
        notifications = notifications.map((item) => ({ ...item, read: true }));
        persistAndRenderNotifications();
        showToast('All notifications marked as read', 'info', 4000, { skipNotification: true });
    });

    notificationsClear.addEventListener('click', () => {
        notifications = [];
        persistAndRenderNotifications();
        showToast('Notifications cleared', 'info', 4000, { skipNotification: true });
    });

    typeCards.forEach((card) => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            if (fileQueue.length === 0) {
                selectGroup(type);
                return;
            }
            if (fileQueue.some((item) => item.detectedType === type)) {
                selectGroup(type);
            }
        });
    });

    presetSelect.addEventListener('change', () => {
        if (isSyncingScopeControls || presetSelect.value === '__custom__') {
            return;
        }
        updateScopeFromPreset(presetSelect.value);
    });

    outputFormatSelect.addEventListener('change', () => {
        if (isSyncingScopeControls) {
            return;
        }
        updateScopeFormat(outputFormatSelect.value);
    });

    qualitySlider.addEventListener('input', () => {
        if (isSyncingScopeControls) {
            qualityValue.textContent = `${qualitySlider.value}%`;
            return;
        }
        updateScopeQuality(qualitySlider.value);
    });

    resetFileOverrideBtn.addEventListener('click', () => {
        const item = getSelectedFile();
        if (!item) {
            return;
        }
        item.override = null;
        syncSidebarFromScope();
        renderQueue();
    });

    settingsDefaultQuality.addEventListener('input', () => {
        settingsDefaultQualityValue.textContent = `${settingsDefaultQuality.value}%`;
    });

    function normalizeSelectedFiles(files) {
        return files.map((file) => ({
            name: file.name,
            path: file.path || (window.app && window.app.getPathForFile ? window.app.getPathForFile(file) : ''),
            size: file.size || 0,
            type: file.type || ''
        })).filter((file) => file.path);
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = normalizeSelectedFiles(Array.from(event.dataTransfer.files || []));
        if (files.length > 0) {
            addFilesToQueue(files);
        } else {
            showToast('Unable to read the dropped file path.', 'error');
        }
    });

    fileInput.addEventListener('change', (event) => {
        const files = normalizeSelectedFiles(Array.from(event.target.files || []));
        if (files.length > 0) {
            addFilesToQueue(files);
        } else if ((event.target.files || []).length > 0) {
            showToast('Unable to read the selected file path.', 'error');
        }
        fileInput.value = '';
    });

    clearQueueBtn.addEventListener('click', () => {
        if (isConverting) {
            showToast('Cannot clear queue during conversion', 'warning');
            return;
        }
        fileQueue = []; syncQueueState();
        groupSettingsByType = {};
        fileIdCounter = 0;
        selectedScope = { kind: 'group', type: 'audio' };
        ensureGroupSettings('audio');
        setBatchStatus(null);
        localStorage.removeItem('converthub_queue');
        renderQueue();
        syncSidebarFromScope();
        showToast('Queue cleared', 'info');
    });

    pickFolderBtn.addEventListener('click', async () => {
        if (window.app && window.app.selectOutputFolder) {
            const folder = await window.app.selectOutputFolder();
            if (folder) {
                updateScopeOutputFolder(folder);
                showToast('Output folder updated', 'success');
            }
        }
    });

    openFolderBtn.addEventListener('click', async () => {
        const scope = getScopeSettings();
        const folder = scope?.outputFolder || defaultDownloadsPath;
        if (folder && window.app && window.app.openFolder) {
            await window.app.openFolder(folder);
        }
    });

    settingsPickFolderBtn.addEventListener('click', async () => {
        if (window.app && window.app.selectOutputFolder) {
            const folder = await window.app.selectOutputFolder();
            if (folder) {
                settingsDefaultOutputFolder.value = folder;
            }
        }
    });

    settingsOpenFolderBtn.addEventListener('click', async () => {
        const folder = settingsDefaultOutputFolder.value || defaultDownloadsPath;
        if (folder && window.app && window.app.openFolder) {
            await window.app.openFolder(folder);
        }
    });

    settingsSave.addEventListener('click', () => {
        appSettings = {
            ...appSettings,
            theme: settingsTheme.value,
            showToasts: settingsShowToasts.checked,
            autoDetectType: settingsAutoDetectType.checked,
            defaultQuality: parseInt(settingsDefaultQuality.value, 10) || DEFAULT_SETTINGS.defaultQuality,
            openFolderOnComplete: settingsOpenFolderOnComplete.checked,
            defaultOutputFolder: settingsDefaultOutputFolder.value || '',
            startupWorkspace: settingsStartupWorkspace ? settingsStartupWorkspace.value : (appSettings.startupWorkspace || DEFAULT_SETTINGS.startupWorkspace)
        };
        if (settingsAutoCheckUpdates) {
            appSettings.autoCheckUpdates = !!settingsAutoCheckUpdates.checked;
        }
        if (settingsAutoDownloadUpdates) {
            appSettings.autoDownloadUpdates = !!settingsAutoDownloadUpdates.checked;
        }
        if (window.app && window.app.setUpdaterConfig) {
            window.app.setUpdaterConfig({
                autoDownload: !!appSettings.autoDownloadUpdates
            });
        }
        persistSettings();
        syncSettingsForm();
        if (outputFolderInput && !outputFolderInput.value) {
            outputFolderInput.value = appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        }
        syncSidebarFromScope();
        renderQueue();
        closeSettings();
        showToast('Settings saved', 'success');
    });

    settingsReset.addEventListener('click', () => {
        appSettings = { ...DEFAULT_SETTINGS, defaultOutputFolder: defaultDownloadsPath };
        persistSettings();
        syncSettingsForm();
        syncSidebarFromScope();
        renderQueue();
        showToast('Settings reset to defaults', 'info');
    });

    engineSetupGuideBtn?.addEventListener('click', () => openEngineSetupGuide());
    engineModalClose?.addEventListener('click', closeEngineSetupGuide);
    engineModalDoneBtn?.addEventListener('click', closeEngineSetupGuide);
    engineModalOverlay?.addEventListener('click', (event) => {
        if (event.target === engineModalOverlay) {
            closeEngineSetupGuide();
        }
    });

    engineTabs.forEach((tab) => {
        tab.addEventListener('click', () => selectEngineGuideTab(tab.dataset.tab));
    });

    engineCopyButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const command = button.dataset.copy || '';
            if (!command) return;
            try {
                await navigator.clipboard.writeText(command);
                const originalHtml = button.innerHTML;
                button.innerHTML = '<i class="fa-solid fa-check"></i>';
                showToast('Command copied', 'success', 1800, { skipNotification: true });
                setTimeout(() => { button.innerHTML = originalHtml; }, 1200);
            } catch {
                showToast('Copy failed. Select the command text manually.', 'warning', 3000, { skipNotification: true });
            }
        });
    });

    engineDownloadButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const url = button.dataset.url;
            if (url) {
                window.app?.openExternal?.(url);
            }
        });
    });

    convertBtn.addEventListener('click', () => {
        if (isConverting) {
            stopActiveConversion();
            return;
        }
        runBatchConversion();
    });

    clearRecentBtn.addEventListener('click', async () => {
        if (window.app && window.app.clearHistory) {
            try {
                await window.app.clearHistory();
            } catch (err) {
                console.error('[renderer] Failed to clear history:', err);
            }
        }
        localStorage.removeItem('converthub_recent');
        loadRecentFiles();
        showToast('Recent history cleared', 'info');
    });

    // Launchpad Card Click Events
    launchConverterBtn?.addEventListener('click', () => {
        switchWorkspace('converter');
    });

    launchPdfBtn?.addEventListener('click', () => {
        switchWorkspace('pdf');
    });

    launchVideoBtn?.addEventListener('click', () => {
        switchWorkspace('video');
    });

    // Home Button Event
    headerHomeBtn?.addEventListener('click', () => {
        switchWorkspace('launchpad');
    });

    // Bypass Launchpad Checkbox Event
    bypassLaunchpadCheckbox?.addEventListener('change', (e) => {
        localStorage.setItem('converthub_bypass_launchpad', String(e.target.checked));
    });


























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































    // ─── Image Toolkit Controller ──────────────────────────────────────────
    let imageToolkitFiles = [];
    let imageToolkitMode = 'image-resize';
    
    let imageResizeRotate = 0;
    let imageResizeFlipH = false;
    let imageResizeFlipV = false;
    let imageWatermarkLogoFile = null;
    let imagePreviewOrig = false;

    const imageTabs = Array.from(document.querySelectorAll('#image-toolkit-workspace .pdf-tab'));
    const imagePanels = {
        'image-resize': document.getElementById('panel-image-resize'),
        'image-compress': document.getElementById('panel-image-compress'),
        'image-watermark': document.getElementById('panel-image-watermark')
    };
    const imageSidebars = {
        'image-resize': document.getElementById('sidebar-image-resize'),
        'image-compress': document.getElementById('sidebar-image-compress'),
        'image-watermark': document.getElementById('sidebar-image-watermark')
    };

    function setImageToolkitMode(mode) {
        imageToolkitMode = mode;
        imageTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
        Object.keys(imagePanels).forEach(m => imagePanels[m]?.classList.toggle('hidden', m !== mode));
        Object.keys(imageSidebars).forEach(m => imageSidebars[m]?.classList.toggle('hidden', m !== mode));
        updateImageToolkitButtons();
        renderImageToolkitPreview();
    }

    function updateImageToolkitButtons() {
        const hasFiles = imageToolkitFiles.length > 0;
        document.getElementById('image-process-resize-btn').disabled = !hasFiles || imageToolkitMode !== 'image-resize';
        document.getElementById('image-process-compress-btn').disabled = !hasFiles || imageToolkitMode !== 'image-compress';
        document.getElementById('image-process-watermark-btn').disabled = !hasFiles || imageToolkitMode !== 'image-watermark';
    }

    async function renderImageToolkitPreview() {
        const modes = ['resize', 'compress', 'watermark'];
        modes.forEach(m => {
            const btnDiff = document.getElementById(`image-${m}-preview-mode-diff`);
            const btnOrig = document.getElementById(`image-${m}-preview-mode-orig`);
            if (btnDiff && btnOrig) {
                btnDiff.classList.toggle('active', !imagePreviewOrig);
                btnOrig.classList.toggle('active', imagePreviewOrig);
            }
        });

        if (imageToolkitFiles.length === 0) {
            modes.forEach(m => {
                document.getElementById(`image-${m}-preview-section`)?.classList.add('hidden');
            });
            return;
        }

        const modeSuffix = imageToolkitMode.split('-')[1];
        modes.forEach(m => {
            const sec = document.getElementById(`image-${m}-preview-section`);
            sec?.classList.toggle('hidden', m !== modeSuffix);
        });

        const canvas = document.getElementById(`image-${modeSuffix}-preview-canvas`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        try {
            const firstFile = imageToolkitFiles[0];
            const img = new Image();
            img.src = `converthub-media://local-file/?path=${encodeURIComponent(firstFile.path)}`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            let w = img.width;
            let h = img.height;
            if (imageResizeRotate === 90 || imageResizeRotate === 270) {
                w = img.height;
                h = img.width;
            }

            let targetWidth = w;
            let targetHeight = h;

            if (imageToolkitMode === 'image-resize') {
                const rWidth = parseInt(document.getElementById('image-resize-width').value, 10) || null;
                const rHeight = parseInt(document.getElementById('image-resize-height').value, 10) || null;
                const fit = document.getElementById('image-resize-fit').value;

                if (rWidth && rHeight) {
                    if (fit === 'inside') {
                        const ratio = Math.min(rWidth / w, rHeight / h);
                        targetWidth = Math.round(w * ratio);
                        targetHeight = Math.round(h * ratio);
                    } else if (fit === 'outside') {
                        const ratio = Math.max(rWidth / w, rHeight / h);
                        targetWidth = Math.round(w * ratio);
                        targetHeight = Math.round(h * ratio);
                    } else {
                        targetWidth = rWidth;
                        targetHeight = rHeight;
                    }
                } else if (rWidth) {
                    const ratio = rWidth / w;
                    targetWidth = rWidth;
                    targetHeight = Math.round(h * ratio);
                } else if (rHeight) {
                    const ratio = rHeight / h;
                    targetWidth = Math.round(w * ratio);
                    targetHeight = rHeight;
                }
            }

            const maxSide = 600;
            let drawScale = 1;
            if (targetWidth > maxSide || targetHeight > maxSide) {
                drawScale = maxSide / Math.max(targetWidth, targetHeight);
            }

            canvas.width = Math.round(targetWidth * drawScale);
            canvas.height = Math.round(targetHeight * drawScale);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            if (imagePreviewOrig) {
                const scaleX = canvas.width / img.width;
                const scaleY = canvas.height / img.height;
                const scaleFit = Math.min(scaleX, scaleY);
                const dw = img.width * scaleFit;
                const dh = img.height * scaleFit;
                const dx = (canvas.width - dw) / 2;
                const dy = (canvas.height - dh) / 2;
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();
                return;
            }

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            let origW = img.width;
            let origH = img.height;
            if (imageResizeRotate === 90 || imageResizeRotate === 270) {
                origW = img.height;
                origH = img.width;
            }
            tempCanvas.width = origW;
            tempCanvas.height = origH;

            tempCtx.translate(origW / 2, origH / 2);
            if (imageResizeRotate !== 0) {
                tempCtx.rotate((imageResizeRotate * Math.PI) / 180);
            }
            tempCtx.scale(imageResizeFlipH ? -1 : 1, imageResizeFlipV ? -1 : 1);
            tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

            const fit = document.getElementById('image-resize-fit')?.value || 'inside';
            const bgColor = document.getElementById('image-resize-bg-hex')?.value || '#000000';

            if (fit === 'contain') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            let dw = canvas.width;
            let dh = canvas.height;
            let dx = 0;
            let dy = 0;

            if (fit === 'inside' || fit === 'contain') {
                const ratioX = canvas.width / tempCanvas.width;
                const ratioY = canvas.height / tempCanvas.height;
                const scaleFit = Math.min(ratioX, ratioY);
                dw = tempCanvas.width * scaleFit;
                dh = tempCanvas.height * scaleFit;
                dx = (canvas.width - dw) / 2;
                dy = (canvas.height - dh) / 2;
            } else if (fit === 'cover') {
                const ratioX = canvas.width / tempCanvas.width;
                const ratioY = canvas.height / tempCanvas.height;
                const scaleFit = Math.max(ratioX, ratioY);
                dw = tempCanvas.width * scaleFit;
                dh = tempCanvas.height * scaleFit;
                dx = (canvas.width - dw) / 2;
                dy = (canvas.height - dh) / 2;
            }

            ctx.drawImage(tempCanvas, dx, dy, dw, dh);
            ctx.restore();

            if (imageToolkitMode === 'image-compress') {
                const quality = parseInt(document.getElementById('image-compress-quality-slider').value, 10);
                const targetFormat = document.getElementById('image-compress-format').value;
                const originalSize = firstFile.size;

                let factor = 1.0;
                const format = targetFormat === 'original' ? firstFile.name.split('.').pop().toLowerCase() : targetFormat;

                if (format === 'jpg' || format === 'jpeg') {
                    factor = 0.15 + (quality / 100) * 0.45;
                } else if (format === 'webp') {
                    factor = 0.10 + (quality / 100) * 0.35;
                } else if (format === 'avif') {
                    factor = 0.05 + (quality / 100) * 0.25;
                } else if (format === 'png') {
                    factor = 0.85;
                }

                const estSize = Math.round(originalSize * factor);
                const savingsPercent = Math.max(0, Math.round(((originalSize - estSize) / originalSize) * 100));

                const estEl = document.getElementById('image-compress-estimate');
                if (estEl) estEl.textContent = `${formatBytes(estSize)} (-${savingsPercent}%)`;
                const detailsEl = document.getElementById('image-compress-details');
                if (detailsEl) {
                    detailsEl.innerHTML = `Original: <strong>${formatBytes(originalSize)}</strong> • Estimated savings based on ${format.toUpperCase()} formatting at ${quality}% quality.`;
                }
            }

            if (imageToolkitMode === 'image-watermark') {
                const type = document.getElementById('image-watermark-type').value;
                const opacity = Number(document.getElementById('image-watermark-opacity-slider').value) / 100;
                const placement = document.getElementById('image-watermark-placement').value;

                ctx.save();
                ctx.globalAlpha = opacity;

                if (type === 'text') {
                    const text = document.getElementById('image-watermark-text').value || '© ConvertHub';
                    const scaleVal = Number(document.getElementById('image-watermark-scale-slider').value) / 100;
                    const color = document.getElementById('image-watermark-color').value || '#ffffff';
                    const rotation = Number(document.getElementById('image-watermark-rotation-slider').value) * Math.PI / 180;
                    const font = document.getElementById('image-watermark-font').value;

                    let fontStack = 'Arial';
                    if (font === 'serif') fontStack = 'Times New Roman, Georgia';
                    else if (font === 'monospace') fontStack = 'Courier New, monospace';
                    else if (font === 'cursive') fontStack = 'Brush Script MT, cursive';

                    const fontSize = Math.max(10, Math.round(canvas.width * scaleVal));
                    ctx.fillStyle = color;
                    ctx.font = `bold ${fontSize}px ${fontStack}`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';

                    const textWidth = ctx.measureText(text).width;
                    const textHeight = fontSize;

                    if (placement === 'TILED') {
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(rotation);
                        ctx.translate(-canvas.width / 2, -canvas.height / 2);
                        const stepX = textWidth + 80;
                        const stepY = textHeight + 80;
                        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                            for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                                ctx.fillText(text, x, y);
                            }
                        }
                    } else {
                        let x = canvas.width / 2;
                        let y = canvas.height / 2;

                        const padX = Math.max(10, canvas.width * 0.03);
                        const padY = Math.max(10, canvas.height * 0.03);

                        if (placement === 'TOP_LEFT') {
                            x = textWidth / 2 + padX; y = textHeight / 2 + padY;
                        } else if (placement === 'TOP_RIGHT') {
                            x = canvas.width - textWidth / 2 - padX; y = textHeight / 2 + padY;
                        } else if (placement === 'BOTTOM_LEFT') {
                            x = textWidth / 2 + padX; y = canvas.height - textHeight / 2 - padY;
                        } else if (placement === 'BOTTOM_RIGHT') {
                            x = canvas.width - textWidth / 2 - padX; y = canvas.height - textHeight / 2 - padY;
                        }

                        ctx.translate(x, y);
                        ctx.rotate(rotation);
                        ctx.fillText(text, 0, 0);
                    }
                } else if (type === 'image' && imageWatermarkLogoFile) {
                    const logoScale = Number(document.getElementById('image-watermark-logo-scale-slider').value) / 100;
                    const imgLogo = new Image();
                    imgLogo.src = imageWatermarkLogoFile.url;
                    await new Promise((resolve, reject) => {
                        imgLogo.onload = resolve;
                        imgLogo.onerror = reject;
                    });

                    let lw = canvas.width * logoScale;
                    let lh = imgLogo.height * (lw / imgLogo.width);

                    if (lh > canvas.height * 0.9) {
                        lh = canvas.height * 0.9;
                        lw = imgLogo.width * (lh / imgLogo.height);
                    }

                    if (placement === 'TILED') {
                        const stepX = lw + 80;
                        const stepY = lh + 80;
                        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                            for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                                ctx.drawImage(imgLogo, x, y, lw, lh);
                            }
                        }
                    } else {
                        let x = (canvas.width - lw) / 2;
                        let y = (canvas.height - lh) / 2;

                        const pad = 15;
                        if (placement === 'TOP_LEFT') {
                            x = pad; y = pad;
                        } else if (placement === 'TOP_RIGHT') {
                            x = canvas.width - lw - pad; y = pad;
                        } else if (placement === 'BOTTOM_LEFT') {
                            x = pad; y = canvas.height - lh - pad;
                        } else if (placement === 'BOTTOM_RIGHT') {
                            x = canvas.width - lw - pad; y = canvas.height - lh - pad;
                        }

                        ctx.drawImage(imgLogo, x, y, lw, lh);
                    }
                }
                ctx.restore();
            }

        } catch (err) {
            console.error('Image preview rendering failed:', err);
        }
    }

    async function addImageToolkitFiles(files) {
        const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']);
        const newFiles = Array.from(files).map(file => ({
            name: file.name,
            path: file.path || (window.app?.getPathForFile ? window.app.getPathForFile(file) : ''),
            size: file.size,
            type: file.type
        })).filter(f => allowed.has(f.name.split('.').pop().toLowerCase()));

        if (newFiles.length === 0) {
            showToast('Please select valid image files (JPG, PNG, WebP, AVIF, GIF).', 'warning');
            return;
        }

        imageToolkitFiles = [...imageToolkitFiles, ...newFiles];
        renderImageToolkitGrid();
        
        if (imageToolkitFiles.length > 0 && !document.getElementById('image-output-folder-input').value) {
            const dir = getFolderFromPath(imageToolkitFiles[0].path);
            document.getElementById('image-output-folder-input').value = dir || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
        }
        
        showToast(`${newFiles.length} image(s) added to toolkit.`, 'info');
    }

    function renderImageToolkitGrid() {
        const modes = ['resize', 'compress', 'watermark'];
        modes.forEach(mode => {
            const grid = document.getElementById(`image-${mode}-grid`);
            const section = document.getElementById(`image-${mode}-grid-section`);
            const dropzone = document.getElementById(`image-${mode}-dropzone`);
            const countEl = document.getElementById(`image-${mode}-count`);

            if (!grid || !section || !dropzone) return;

            if (imageToolkitFiles.length === 0) {
                section.classList.add('hidden');
                dropzone.classList.remove('hidden');
            } else {
                dropzone.classList.add('hidden');
                section.classList.remove('hidden');
                countEl.textContent = `${imageToolkitFiles.length} Image(s) Selected`;
                
                grid.innerHTML = '';
                imageToolkitFiles.forEach((file, index) => {
                    const card = document.createElement('div');
                    card.className = 'pdf-thumb-card no-drag';
                    const safeName = escapeHtml(file.name);
                    const previewUrl = `converthub-media://local-file/?path=${encodeURIComponent(file.path)}`;
                    
                    card.innerHTML = `
                        <div class="thumb-preview-wrap"><img src="${previewUrl}" alt="${safeName}"></div>
                        <div class="thumb-copy">
                            <div class="thumb-title" title="${safeName}">${safeName}</div>
                            <div class="thumb-meta">${formatBytes(file.size)}</div>
                        </div>
                        <button class="thumb-act-btn remove-btn" title="Remove image"><i class="fa-solid fa-xmark"></i></button>
                    `;
                    
                    card.querySelector('.remove-btn').addEventListener('click', () => {
                        imageToolkitFiles.splice(index, 1);
                        renderImageToolkitGrid();
                    });
                    
                    grid.appendChild(card);
                });
            }
        });
        updateImageToolkitButtons();
        renderImageToolkitPreview();
    }

    function clearImageToolkitFiles() {
        imageToolkitFiles = [];
        renderImageToolkitGrid();
    }

    async function processImageToolkit() {
        if (imageToolkitFiles.length === 0) return;
        
        const outputFolder = document.getElementById('image-output-folder-input').value;
        if (!outputFolder) {
            showToast('Please select an output folder.', 'warning');
            return;
        }

        const options = {};

        if (imageToolkitMode === 'image-resize') {
            options.resize = {
                width: document.getElementById('image-resize-width').value || null,
                height: document.getElementById('image-resize-height').value || null,
                fit: document.getElementById('image-resize-fit').value || 'inside',
                background: document.getElementById('image-resize-bg-hex').value || '#000000'
            };
            options.rotate = imageResizeRotate;
            options.flipH = imageResizeFlipH;
            options.flipV = imageResizeFlipV;
        } else if (imageToolkitMode === 'image-compress') {
            const formatVal = document.getElementById('image-compress-format').value;
            if (formatVal !== 'original') {
                options.format = formatVal;
            }
            options.quality = parseInt(document.getElementById('image-compress-quality-slider').value, 10);
            options.stripMetadata = document.getElementById('image-compress-strip').checked;
        } else if (imageToolkitMode === 'image-watermark') {
            const wmType = document.getElementById('image-watermark-type').value;
            if (wmType === 'text') {
                options.watermark = {
                    type: 'text',
                    text: document.getElementById('image-watermark-text').value || '© ConvertHub',
                    font: document.getElementById('image-watermark-font').value || 'sans-serif',
                    color: document.getElementById('image-watermark-color').value || '#ffffff',
                    scale: Number(document.getElementById('image-watermark-scale-slider').value) / 100,
                    rotation: parseInt(document.getElementById('image-watermark-rotation-slider').value, 10) || 0,
                    placement: document.getElementById('image-watermark-placement').value || 'CENTER',
                    opacity: parseInt(document.getElementById('image-watermark-opacity-slider').value, 10) / 100
                };
            } else if (wmType === 'image') {
                if (!imageWatermarkLogoFile) {
                    showToast('Please select a logo image first.', 'warning');
                    return;
                }
                options.watermark = {
                    type: 'image',
                    imagePath: imageWatermarkLogoFile.path,
                    scale: Number(document.getElementById('image-watermark-logo-scale-slider').value) / 100,
                    placement: document.getElementById('image-watermark-placement').value || 'CENTER',
                    opacity: parseInt(document.getElementById('image-watermark-opacity-slider').value, 10) / 100
                };
            }
        }

        const btnId = `image-process-${imageToolkitMode.split('-')[1]}-btn`;
        const btn = document.getElementById(btnId);
        const originalLabel = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        const totalFiles = imageToolkitFiles.length;
        let successCount = 0;
        let processedFiles = 0;

        setBatchStatus({ title: 'Processing Images', meta: `0/${totalFiles} files`, percent: 0 });

        let progressHandler = null;
        let progressCleanup = null;

        try {
            if (window.app?.onProgress) {
                progressHandler = (data) => {
                    if (data && typeof data.percent === 'number') {
                        const filePercent = data.percent;
                        const overallPercent = Math.min(100, Math.round(((processedFiles + filePercent / 100) / totalFiles) * 100));
                        setBatchStatus({
                            title: 'Processing Images',
                            meta: data.message || `${processedFiles}/${totalFiles} files (${filePercent}%)`,
                            percent: overallPercent
                        });
                    }
                };
                progressCleanup = window.app.onProgress(progressHandler);
            }

            for (const file of imageToolkitFiles) {
                const fileExt = window.app.getFileExtension(file.path) || 'png';
                const res = await window.app.processImage({
                    inputPath: file.path,
                    outputFolder,
                    options: {
                        ...options,
                        format: options.format || fileExt
                    }
                });
                if (res.success) {
                    successCount++;
                    refreshRecentFiles();
                }
                processedFiles++;
            }
            showToast(`Successfully processed ${successCount} image(s).`, 'success');
            if (appSettings.openFolderOnComplete) {
                await window.app.openFolder(outputFolder);
            }
            clearImageToolkitFiles();
            setBatchStatus({ title: 'Processing Images', meta: `Complete`, percent: 100 });
        } catch (err) {
            console.error('Image processing failed:', err);
            showToast(`Processing failed: ${err.message}`, 'error');
        } finally {
            if (progressCleanup) progressCleanup();
            else if (window.app?.removeProgressListeners) window.app.removeProgressListeners();
            btn.innerHTML = originalLabel;
            btn.disabled = false;
            setTimeout(() => setBatchStatus(null), 1500);
        }
    }


    // ─── Event Listeners Bindings ────────────────────────────────────────────
    
    // PDF Watermark Panel Bindings



























































































































































































    // v2.2 New Listeners
    savePresetBtn?.addEventListener('click', () => {
        presetSaveInputGroup?.classList.remove('hidden');
        newPresetNameInput?.focus();
    });

    cancelSavePresetBtn?.addEventListener('click', () => {
        presetSaveInputGroup?.classList.add('hidden');
        newPresetNameInput.value = '';
    });

    confirmSavePresetBtn?.addEventListener('click', async () => {
        const name = newPresetNameInput?.value.trim();
        if (!name) {
            showToast('Please enter a name for the preset.', 'warning');
            return;
        }

        const type = getSelectedType();
        const scope = getScopeSettings();
        const preset = {
            id: `custom-${type}-${Date.now()}`,
            label: name,
            type: type,
            format: scope.format,
            quality: scope.quality,
            isCustom: true
        };

        try {
            const success = await window.app.savePreset(type, preset);
            if (success) {
                await loadCustomPresets();
                presetSaveInputGroup?.classList.add('hidden');
                newPresetNameInput.value = '';
                syncSidebarFromScope();
                showToast(`Preset "${name}" saved!`, 'success');
            }
        } catch (err) {
            console.error('[renderer] Failed to save preset:', err);
            showToast('Failed to save preset.', 'error');
        }
    });

    deletePresetBtn?.addEventListener('click', async () => {
        const type = getSelectedType();
        const presetId = presetSelect.value;
        const preset = getPresetById(type, presetId);
        
        if (!preset || !preset.isCustom) return;

        if (confirm(`Are you sure you want to delete the preset "${preset.label}"?`)) {
            try {
                const success = await window.app.deletePreset(type, presetId);
                if (success) {
                    await loadCustomPresets();
                    syncSidebarFromScope();
                    showToast(`Preset "${preset.label}" deleted.`, 'info');
                }
            } catch (err) {
                console.error('[renderer] Failed to delete preset:', err);
                showToast('Failed to delete preset.', 'error');
            }
        }
    });

    launchImageBtn?.addEventListener('click', () => {
        switchWorkspace('image-toolkit');
    });

    // Image Toolkit Tab Bindings
    imageTabs.forEach(tab => {
        tab.addEventListener('click', () => setImageToolkitMode(tab.dataset.mode));
    });

    // Image Toolkit Dropzones & Inputs
    const imageToolkitDropzones = [
        { id: 'image-resize-dropzone', input: 'image-resize-input', btn: 'image-resize-browse-btn' },
        { id: 'image-compress-dropzone', input: 'image-compress-input', btn: 'image-compress-browse-btn' },
        { id: 'image-watermark-dropzone', input: 'image-watermark-input', btn: 'image-watermark-browse-btn' }
    ];

    imageToolkitDropzones.forEach(dz => {
        const dropzone = document.getElementById(dz.id);
        const input = document.getElementById(dz.input);
        const browseBtn = document.getElementById(dz.btn);

        dropzone?.addEventListener('click', () => input?.click());
        browseBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            input?.click();
        });

        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            addImageToolkitFiles(e.dataTransfer.files);
        });

        input?.addEventListener('change', (e) => {
            addImageToolkitFiles(e.target.files);
            e.target.value = '';
        });
    });

    // Image Toolkit Clear Buttons
    ['resize', 'compress', 'watermark'].forEach(mode => {
        document.getElementById(`image-${mode}-clear-btn`)?.addEventListener('click', clearImageToolkitFiles);
    });

    // Image Toolkit Process Buttons
    document.getElementById('image-process-resize-btn')?.addEventListener('click', processImageToolkit);
    document.getElementById('image-process-compress-btn')?.addEventListener('click', processImageToolkit);
    document.getElementById('image-process-watermark-btn')?.addEventListener('click', processImageToolkit);

    // Image Toolkit Sliders
    document.getElementById('image-compress-quality-slider')?.addEventListener('input', (e) => {
        document.getElementById('image-compress-quality-val').textContent = `${e.target.value}%`;
    });
    document.getElementById('image-watermark-opacity-slider')?.addEventListener('input', (e) => {
        document.getElementById('image-watermark-opacity-val').textContent = `${e.target.value}%`;
    });

    // Image Toolkit Folder Picker
    document.getElementById('image-pick-folder-btn')?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder) {
            document.getElementById('image-output-folder-input').value = folder;
        }
    });

    // New Image Toolkit Advanced Event Listeners
    document.getElementById('image-resize-preset')?.addEventListener('change', (e) => {
        const preset = e.target.value;
        const widthInput = document.getElementById('image-resize-width');
        const heightInput = document.getElementById('image-resize-height');
        if (preset === 'custom') {
            widthInput.disabled = false;
            heightInput.disabled = false;
        } else {
            const [w, h] = preset.split('x').map(Number);
            widthInput.value = w;
            heightInput.value = h;
            widthInput.disabled = true;
            heightInput.disabled = true;
        }
        renderImageToolkitPreview();
    });

    document.getElementById('image-resize-width')?.addEventListener('input', renderImageToolkitPreview);
    document.getElementById('image-resize-height')?.addEventListener('input', renderImageToolkitPreview);
    
    document.getElementById('image-resize-fit')?.addEventListener('change', (e) => {
        const fit = e.target.value;
        document.getElementById('image-resize-bg-group')?.classList.toggle('hidden', fit !== 'contain');
        renderImageToolkitPreview();
    });

    document.getElementById('image-resize-bg-color')?.addEventListener('input', (e) => {
        document.getElementById('image-resize-bg-hex').value = e.target.value;
        renderImageToolkitPreview();
    });
    document.getElementById('image-resize-bg-hex')?.addEventListener('input', (e) => {
        let hex = e.target.value;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (hex.length === 7) {
            document.getElementById('image-resize-bg-color').value = hex;
        }
        renderImageToolkitPreview();
    });

    document.getElementById('image-btn-rotate-ccw')?.addEventListener('click', () => {
        imageResizeRotate = (imageResizeRotate - 90 + 360) % 360;
        renderImageToolkitPreview();
    });
    document.getElementById('image-btn-rotate-cw')?.addEventListener('click', () => {
        imageResizeRotate = (imageResizeRotate + 90) % 360;
        renderImageToolkitPreview();
    });
    document.getElementById('image-btn-flip-h')?.addEventListener('click', (e) => {
        imageResizeFlipH = !imageResizeFlipH;
        e.currentTarget.classList.toggle('active', imageResizeFlipH);
        renderImageToolkitPreview();
    });
    document.getElementById('image-btn-flip-v')?.addEventListener('click', (e) => {
        imageResizeFlipV = !imageResizeFlipV;
        e.currentTarget.classList.toggle('active', imageResizeFlipV);
        renderImageToolkitPreview();
    });

    document.getElementById('image-compress-format')?.addEventListener('change', renderImageToolkitPreview);
    document.getElementById('image-compress-quality-slider')?.addEventListener('input', renderImageToolkitPreview);

    document.getElementById('image-watermark-type')?.addEventListener('change', (e) => {
        const isImage = e.target.value === 'image';
        document.getElementById('image-watermark-text-group')?.classList.toggle('hidden', isImage);
        document.getElementById('image-watermark-image-group')?.classList.toggle('hidden', !isImage);
        renderImageToolkitPreview();
    });

    document.getElementById('image-watermark-text')?.addEventListener('input', renderImageToolkitPreview);
    document.getElementById('image-watermark-font')?.addEventListener('change', renderImageToolkitPreview);
    document.getElementById('image-watermark-placement')?.addEventListener('change', renderImageToolkitPreview);
    
    document.getElementById('image-watermark-opacity-slider')?.addEventListener('input', renderImageToolkitPreview);
    
    document.getElementById('image-watermark-scale-slider')?.addEventListener('input', (e) => {
        document.getElementById('image-watermark-scale-val').textContent = `${e.target.value}%`;
        renderImageToolkitPreview();
    });
    document.getElementById('image-watermark-rotation-slider')?.addEventListener('input', (e) => {
        document.getElementById('image-watermark-rotation-val').textContent = `${e.target.value}°`;
        renderImageToolkitPreview();
    });
    document.getElementById('image-watermark-color')?.addEventListener('input', (e) => {
        document.getElementById('image-watermark-color-hex').value = e.target.value;
        renderImageToolkitPreview();
    });
    document.getElementById('image-watermark-color-hex')?.addEventListener('input', (e) => {
        let hex = e.target.value;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (hex.length === 7) {
            document.getElementById('image-watermark-color').value = hex;
        }
        renderImageToolkitPreview();
    });

    document.getElementById('image-watermark-logo-browse-btn')?.addEventListener('click', async () => {
        const files = await window.app?.selectFiles?.();
        if (files && files.length > 0) {
            const logoPath = files[0];
            const name = logoPath.split('\\').pop().split('/').pop();
            imageWatermarkLogoFile = {
                name,
                path: logoPath,
                url: `converthub-media://local-file/?path=${encodeURIComponent(logoPath)}`
            };
            document.getElementById('image-watermark-logo-path').value = name;
            renderImageToolkitPreview();
        }
    });
    document.getElementById('image-watermark-logo-scale-slider')?.addEventListener('input', (e) => {
        document.getElementById('image-watermark-logo-scale-val').textContent = `${e.target.value}%`;
        renderImageToolkitPreview();
    });

    // Preview Mode Toggles
    ['resize', 'compress', 'watermark'].forEach(mode => {
        document.getElementById(`image-${mode}-preview-mode-diff`)?.addEventListener('click', () => {
            imagePreviewOrig = false;
            renderImageToolkitPreview();
        });
        document.getElementById(`image-${mode}-preview-mode-orig`)?.addEventListener('click', () => {
            imagePreviewOrig = true;
            renderImageToolkitPreview();
        });
    });

    init();

    
    // Expose helpers globally for other modules or index.html to call
    window.applyTheme = applyTheme;
    window.addFilesToQueue = addFilesToQueue;
    window.ensureGroupSettings = ensureGroupSettings;
    window.syncSidebarFromScope = syncSidebarFromScope;
    window.detectTypeFromFileName = detectTypeFromFileName;
    window.switchWorkspace = switchWorkspace;
    window.setSelectedScope = (val) => {
        selectedScope = val;
        state.selectedScope = val;
    };
    window.getSelectedType = getSelectedType;
    window.getScopeSettings = getScopeSettings;
}
