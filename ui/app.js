(function () {
    const winMinButton = document.getElementById('win-min');
    const winMaxButton = document.getElementById('win-max');
    const winCloseButton = document.getElementById('win-close');
    const desktopBridge = window.app;

    console.log('[renderer] app.js loaded');
    console.log('[renderer] window.app =', desktopBridge);

    if (!desktopBridge) {
        console.warn('window.app is undefined. Frameless window controls are unavailable.');
        window.addEventListener('DOMContentLoaded', () => {
            const bridgeError = document.createElement('div');
            bridgeError.textContent = 'Window controls unavailable: preload bridge failed to load.';
            bridgeError.style.position = 'fixed';
            bridgeError.style.top = '72px';
            bridgeError.style.left = '50%';
            bridgeError.style.transform = 'translateX(-50%)';
            bridgeError.style.padding = '10px 14px';
            bridgeError.style.borderRadius = '10px';
            bridgeError.style.background = 'rgba(244, 63, 94, 0.92)';
            bridgeError.style.color = '#fff';
            bridgeError.style.fontSize = '13px';
            bridgeError.style.fontWeight = '600';
            bridgeError.style.zIndex = '10000';
            bridgeError.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
            document.body.appendChild(bridgeError);
        });
    } else {
        winMinButton?.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('[renderer] minimize button clicked');
            await desktopBridge.minimize();
            console.log('[renderer] minimize invoke completed');
        });
        winMaxButton?.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('[renderer] maximize button clicked');
            await desktopBridge.maximize();
            console.log('[renderer] maximize invoke completed');
        });
        winCloseButton?.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('[renderer] close button clicked');
            await desktopBridge.close();
            console.log('[renderer] close invoke completed');
        });
        desktopBridge.onWindowStateChanged?.((state) => {
            console.log('[renderer] window state changed', state);
            if (!winMaxButton) {
                return;
            }

            const icon = winMaxButton.querySelector('i');
            if (!icon) {
                return;
            }

            const isMaximized = !!state?.isMaximized;
            icon.className = isMaximized
                ? 'fa-regular fa-clone'
                : 'fa-regular fa-square';
            winMaxButton.title = isMaximized ? 'Restore' : 'Maximize';
        });
    }

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
    const batchStatus = document.getElementById('batch-status');
    const batchStatusTitle = document.getElementById('batch-status-title');
    const batchStatusMeta = document.getElementById('batch-status-meta');
    const batchProgressFill = document.getElementById('batch-progress-fill');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsToggle = document.getElementById('settings-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const notificationBadge = document.getElementById('notification-badge');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    const settingsSave = document.getElementById('settings-save');
    const settingsReset = document.getElementById('settings-reset');
    const settingsTheme = document.getElementById('settings-theme');
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
    const headerHomeBtn = document.getElementById('header-home-btn');
    const launchConverterBtn = document.getElementById('launch-converter-btn');
    const launchPdfBtn = document.getElementById('launch-pdf-btn');
    const bypassLaunchpadCheckbox = document.getElementById('bypass-launchpad-checkbox');

    const pdfTabs = Array.from(document.querySelectorAll('.pdf-tab'));
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


    const DEFAULT_SETTINGS = {
        theme: 'dark',
        autoDetectType: true,
        defaultQuality: 80,
        defaultOutputFolder: '',
        openFolderOnComplete: false,
        showToasts: true
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
    let fileQueue = [];
    let groupSettingsByType = {};
    let selectedScope = { kind: 'group', type: 'audio' };
    let isConverting = false;
    let fileIdCounter = 0;
    let defaultDownloadsPath = '';
    let activeBatch = null;
    let isSyncingScopeControls = false;
    let engineStatus = null;
    let isCancellingConversion = false;
    let pdfImages = [];
    let pdfImageIdCounter = 0;
    let pdfImageDragId = null;
    let selectedPdfFile = null;
    let pdfMergeFiles = [];
    let pdfMergeIdCounter = 0;
    let pdfMergeDragId = null;

    function getSavedSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('converthub_settings') || '{}') };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        localStorage.setItem('converthub_settings', JSON.stringify(appSettings));
    }

    function getSavedNotifications() {
        try {
            return JSON.parse(localStorage.getItem('converthub_notifications') || '[]');
        } catch {
            return [];
        }
    }

    function saveNotifications() {
        localStorage.setItem('converthub_notifications', JSON.stringify(notifications.slice(0, 50)));
    }

    function getRecentFiles() {
        try {
            return JSON.parse(localStorage.getItem('converthub_recent') || '[]');
        } catch {
            return [];
        }
    }

    function saveRecentFiles(files) {
        localStorage.setItem('converthub_recent', JSON.stringify(files.slice(0, 20)));
    }

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

    function typeUsesQuality(type) {
        return type === 'audio' || type === 'video' || type === 'image';
    }

    function getPresetsForType(type) {
        return PRESET_CATALOG[type] || [];
    }

    function getDefaultPreset(type) {
        const presets = getPresetsForType(type);
        return presets.find((preset) => preset.isDefault) || presets[0] || null;
    }

    function getPresetById(type, presetId) {
        return getPresetsForType(type).find((preset) => preset.id === presetId) || null;
    }

    function getMatchingPreset(type, format, quality) {
        return getPresetsForType(type).find((preset) => {
            if (preset.format !== String(format || '').toLowerCase()) {
                return false;
            }
            return !typeUsesQuality(type) || Number(preset.quality) === Number(quality);
        }) || null;
    }

    function detectTypeFromFileName(file) {
        const rawName = file?.name || file?.path || '';
        const dotIndex = rawName.lastIndexOf('.');
        if (dotIndex === -1) {
            return null;
        }
        const ext = rawName.slice(dotIndex + 1).toLowerCase();
        for (const [type, formats] of Object.entries(FORMAT_MAP)) {
            if (formats.includes(ext)) {
                return type;
            }
        }
        return null;
    }

    function normalizeSelectedFiles(files) {
        return files.map((file) => ({
            name: file.name,
            path: file.path || (window.app && window.app.getPathForFile ? window.app.getPathForFile(file) : ''),
            size: file.size || 0,
            type: file.type || ''
        })).filter((file) => file.path);
    }

    function getFolderFromPath(filePath) {
        const lastBackslash = filePath.lastIndexOf('\\');
        const lastSlash = filePath.lastIndexOf('/');
        const separatorIndex = Math.max(lastBackslash, lastSlash);
        return separatorIndex > -1 ? filePath.slice(0, separatorIndex) : '';
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
    }

    function truncateName(name, max) {
        if (name.length <= max) {
            return name;
        }
        const extIndex = name.lastIndexOf('.');
        const ext = extIndex > -1 ? name.slice(extIndex) : '';
        const base = extIndex > -1 ? name.slice(0, extIndex) : name;
        const allowed = Math.max(1, max - ext.length - 3);
        return `${base.slice(0, allowed)}...${ext}`;
    }

    function getIconForType(type) {
        return ICON_MAP[type] || ICON_MAP.unknown;
    }

    function getIconForFormat(format) {
        for (const [type, formats] of Object.entries(FORMAT_MAP)) {
            if (formats.includes(format)) {
                return getIconForType(type);
            }
        }
        return ICON_MAP.unknown;
    }

    function applyTheme(theme) {
        const normalizedTheme = theme === 'light' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', normalizedTheme);
        themeToggle.innerHTML = normalizedTheme === 'light'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        settingsTheme.value = normalizedTheme;
        appSettings.theme = normalizedTheme;
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

    function formatNotificationTime(timestamp) {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return '';
        }
    }

    function getNotificationIcon(type) {
        if (type === 'success') return 'fa-circle-check';
        if (type === 'error') return 'fa-circle-xmark';
        if (type === 'warning') return 'fa-triangle-exclamation';
        return 'fa-circle-info';
    }

    function renderNotifications() {
        notificationsList.querySelectorAll('.notification-item').forEach((item) => item.remove());
        notificationsEmpty.style.display = notifications.length === 0 ? 'flex' : 'none';

        notifications.forEach((item) => {
            const article = document.createElement('article');
            article.className = `notification-item ${item.read ? '' : 'unread'} notification-${item.type}`;
            article.innerHTML = `
                <div class="notification-icon-wrap">
                    <i class="fa-solid ${getNotificationIcon(item.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-topline">
                        <strong>${item.title}</strong>
                        <span>${formatNotificationTime(item.timestamp)}</span>
                    </div>
                    <p>${item.message}</p>
                </div>
            `;
            notificationsList.appendChild(article);
        });
    }

    function updateNotificationBadge() {
        const unreadCount = notifications.filter((item) => !item.read).length;
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : `${unreadCount}`;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }

    function persistAndRenderNotifications() {
        saveNotifications();
        renderNotifications();
        updateNotificationBadge();
    }

    function addNotification(title, message, type = 'info') {
        notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            title,
            message,
            type,
            read: !notificationsOverlay.classList.contains('hidden'),
            timestamp: Date.now()
        });
        notifications = notifications.slice(0, 50);
        persistAndRenderNotifications();
    }

    function showToast(message, type = 'info', duration = 4000, options = {}) {
        if (!options.skipNotification) {
            addNotification(
                type === 'success' ? 'Success' : type === 'error' ? 'Issue detected' : type === 'warning' ? 'Attention needed' : 'Update',
                message,
                type
            );
        }

        if (!appSettings.showToasts && type !== 'error') {
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} slide-in`;
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            info: 'fa-circle-info',
            warning: 'fa-triangle-exclamation'
        };
        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;
        document.getElementById('toast-container').appendChild(toast);
        const dismiss = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 400);
        };
        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        setTimeout(dismiss, duration);
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

    function openNotifications() {
        if (!notificationsOverlay.classList.contains('hidden')) {
            closeNotifications();
            return;
        }
        closeSettings();
        notifications = notifications.map((item) => ({ ...item, read: true }));
        persistAndRenderNotifications();
        notificationsOverlay.classList.remove('hidden');
        document.body.classList.add('settings-open');
    }

    function closeNotifications() {
        notificationsOverlay.classList.add('hidden');
        if (settingsOverlay.classList.contains('hidden')) {
            document.body.classList.remove('settings-open');
        }
    }

    function addRecentFile(fileName, format, outputPath) {
        const recents = getRecentFiles();
        recents.unshift({
            name: fileName,
            format: String(format || '').toUpperCase(),
            outputPath: outputPath || '',
            time: new Date().toLocaleTimeString()
        });
        saveRecentFiles(recents);
        loadRecentFiles();
    }

    function loadRecentFiles() {
        const recents = getRecentFiles();
        recentList.innerHTML = '';
        if (recents.length === 0) {
            recentList.innerHTML = '<p class="no-recents">No recent conversions</p>';
            return;
        }
        recents.forEach((item) => {
            const iconInfo = getIconForFormat(String(item.format || '').toLowerCase());
            const div = document.createElement('div');
            div.className = 'recent-item slide-in';
            div.innerHTML = `
                <div class="recent-icon ${iconInfo.class}"><i class="fa-regular ${iconInfo.icon}"></i></div>
                <div class="recent-info">
                    <span class="recent-name" title="${item.name}">${truncateName(item.name, 22)}</span>
                    <span class="recent-meta">→ ${item.format} • ${item.time}</span>
                </div>
                <div class="recent-actions">
                    <button class="recent-action-btn" title="Open file"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
                    <button class="recent-action-btn" title="Show in folder"><i class="fa-regular fa-folder-open"></i></button>
                </div>
                <i class="fa-regular fa-circle-check success-icon pulse-anim"></i>
            `;
            if (item.outputPath && window.app) {
                div.querySelector('.recent-action-btn:first-child').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.app.openPath(item.outputPath);
                });
                div.querySelector('.recent-action-btn:last-child').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.app.openFolder(getFolderFromPath(item.outputPath));
                });
            }
            recentList.appendChild(div);
        });
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
        const customOption = presetSelect.querySelector('option[value="__custom__"]');
        if (!matchingPreset && !customOption) {
            const option = document.createElement('option');
            option.value = '__custom__';
            option.textContent = 'Custom';
            presetSelect.appendChild(option);
        }
        if (matchingPreset && customOption) {
            customOption.remove();
        }
        presetSelect.value = matchingPreset ? matchingPreset.id : '__custom__';
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

    function createGroupSection(group, isMixedBatch) {
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

        group.items.forEach((item) => {
            wrapper.appendChild(createQueueItemElement(item));
        });
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

        groups.forEach((group) => {
            fragment.appendChild(createGroupSection(group, isMixedBatch));
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
                        addRecentFile(item.file.name, result.format || resolved.format, result.outputPath);
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

                results.forEach((entry, index) => {
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
                        if (entry.outputPath && jobs[index] && entry.outputPath !== jobs[index].outputPath) {
                            renamedOutputCount += 1;
                        }
                        markBatchItemComplete(item.id);
                        if (!item.recordedInRecent) {
                            addRecentFile(item.file.name, entry.format || resolveFileSettings(item).format, entry.outputPath);
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
                        title: isSingleConversion ? 'Processing conversion' : `Processed ${index + 1} of ${results.length}`,
                        meta: `${completed} completed • ${Math.max(0, readyFiles.length - completed - cancelledCount)} remaining`,
                        percent: results.length ? Math.round(((index + 1) / results.length) * 100) : 100,
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

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function getImageDimensions(file) {
        return new Promise((resolve) => {
            const src = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                const dimensions = { width: image.naturalWidth || 0, height: image.naturalHeight || 0 };
                URL.revokeObjectURL(src);
                resolve(dimensions);
            };
            image.onerror = () => {
                URL.revokeObjectURL(src);
                resolve({ width: 0, height: 0 });
            };
            image.src = src;
        });
    }

    function normalizePdfSelectedFiles(files, allowedExtensions) {
        const allowed = new Set(allowedExtensions);
        return Array.from(files || []).map((file) => ({
            raw: file,
            name: file.name,
            path: file.path || (window.app?.getPathForFile ? window.app.getPathForFile(file) : ''),
            size: file.size || 0,
            type: file.type || ''
        })).filter((file) => {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            return (file.path || file.raw) && allowed.has(ext);
        });
    }

    function getPdfOutputFolder() {
        return pdfOutputFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function getPdfExtractFolder() {
        return pdfExtractFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function getPdfMergeFolder() {
        return pdfMergeFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function updatePdfButtons() {
        if (pdfCompileBtn) {
            pdfCompileBtn.disabled = false;
        }
        if (pdfExtractBtn) {
            pdfExtractBtn.disabled = !selectedPdfFile;
        }
        if (pdfMergeBtn) {
            pdfMergeBtn.disabled = pdfMergeFiles.length < 2;
        }
    }

    function getImageDimensionsFromPath(filePath) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                const dimensions = { width: image.naturalWidth || 0, height: image.naturalHeight || 0 };
                resolve(dimensions);
            };
            image.onerror = () => {
                resolve({ width: 0, height: 0 });
            };
            image.src = `converthub-media://local-file/?path=${encodeURIComponent(filePath)}`;
        });
    }

    function parsePageRangeFilter(paths, rangeStr) {
        const indices = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [startStr, endStr] = trimmed.split('-');
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end)) {
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let i = min; i <= max; i++) {
                        if (i >= 1 && i <= paths.length) {
                            indices.add(i - 1);
                        }
                    }
                }
            } else {
                const index = parseInt(trimmed, 10);
                if (!isNaN(index) && index >= 1 && index <= paths.length) {
                    indices.add(index - 1);
                }
            }
        }
        return Array.from(indices).sort((a, b) => a - b).map(idx => paths[idx]);
    }

    function parsePdfPageSelection(rangeType, rangeInput, totalPages) {
        if (rangeType !== 'CUSTOM') {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = new Set();
        const parts = String(rangeInput || '').split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) {
                continue;
            }

            if (trimmed.includes('-')) {
                const [startStr, endStr] = trimmed.split('-');
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);

                if (Number.isInteger(start) && Number.isInteger(end)) {
                    const min = Math.max(1, Math.min(start, end));
                    const max = Math.min(totalPages, Math.max(start, end));
                    for (let page = min; page <= max; page++) {
                        pages.add(page);
                    }
                }
                continue;
            }

            const page = parseInt(trimmed, 10);
            if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
                pages.add(page);
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    }

    function getPdfStem(fileName) {
        return String(fileName || 'document').replace(/\.pdf$/i, '') || 'document';
    }

    function sanitizeFileStem(value) {
        return String(value || 'document')
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/^_+|_+$/g, '') || 'document';
    }

    function joinOutputPath(directory, childName) {
        const separator = String(directory || '').includes('/') && !String(directory || '').includes('\\') ? '/' : '\\';
        return `${String(directory || '').replace(/[\\/]+$/, '')}${separator}${String(childName || '').replace(/^[\\/]+/, '')}`;
    }

    function getExtractedPageFileName(pattern, stem, pageNumber, totalPages, format) {
        const safeStem = sanitizeFileStem(stem);
        const pageToken = String(pageNumber).padStart(Math.max(3, String(totalPages).length), '0');

        switch (pattern) {
            case 'stem-number':
                return `${safeStem}-${pageToken}.${format}`;
            case 'page_number_stem':
                return `page_${pageToken}_${safeStem}.${format}`;
            case 'stem_page_number':
            default:
                return `${safeStem}_page_${pageToken}.${format}`;
        }
    }

    function getPdfRenderScale(mode, width, dpi, viewport) {
        if (mode === 'DPI') {
            return Math.max(0.1, (parseInt(dpi, 10) || 150) / 72);
        }
        return Math.max(0.1, (parseInt(width, 10) || 1200) / viewport.width);
    }

    async function getPdfDocumentBytes(file) {
        if (file?.raw?.arrayBuffer) {
            return new Uint8Array(await file.raw.arrayBuffer());
        }

        if (file?.path) {
            const sourceUrl = `converthub-media://local-file/?path=${encodeURIComponent(file.path)}`;
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                throw new Error(`Unable to read PDF file (${response.status}).`);
            }
            return new Uint8Array(await response.arrayBuffer());
        }

        throw new Error('Unable to read the selected PDF.');
    }

    function renderPdfImageList() {
        if (!pdfImageGridSection || !pdfThumbnailsGrid || !pdfImgCount) {
            return;
        }

        pdfImgCount.textContent = String(pdfImages.length);
        pdfImageGridSection.classList.toggle('hidden', pdfImages.length === 0);
        pdfThumbnailsGrid.innerHTML = '';

        pdfImages.forEach((item, index) => {
            const card = document.createElement('div');
            const safeName = escapeHtml(item.name);
            const safePreviewUrl = escapeHtml(item.previewUrl);
            card.className = 'pdf-thumb-card no-drag';
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="thumb-preview-wrap"><img src="${safePreviewUrl}" alt="${safeName} preview"></div>
                <div class="thumb-copy">
                    <div class="thumb-title" title="${safeName}">${safeName}</div>
                    <div class="thumb-meta">${formatBytes(item.size)} &bull; ${item.width || '?'} x ${item.height || '?'}</div>
                </div>
                <button class="thumb-act-btn drag-btn" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
                <button class="thumb-act-btn remove-btn" title="Remove image"><i class="fa-solid fa-xmark"></i></button>
            `;

            card.addEventListener('dragstart', () => {
                pdfImageDragId = item.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (pdfImageDragId && pdfImageDragId !== item.id) {
                    card.classList.add('queue-item-drag-over');
                }
            });
            card.addEventListener('dragleave', () => card.classList.remove('queue-item-drag-over'));
            card.addEventListener('drop', (event) => {
                event.preventDefault();
                card.classList.remove('queue-item-drag-over');
                if (!pdfImageDragId || pdfImageDragId === item.id) {
                    return;
                }
                const fromIndex = pdfImages.findIndex((entry) => entry.id === pdfImageDragId);
                const toIndex = index;
                if (fromIndex < 0 || toIndex < 0) {
                    return;
                }
                const [moved] = pdfImages.splice(fromIndex, 1);
                pdfImages.splice(toIndex, 0, moved);
                renderPdfImageList();
            });
            card.addEventListener('dragend', () => {
                pdfImageDragId = null;
                renderPdfImageList();
            });
            card.querySelector('.remove-btn')?.addEventListener('click', () => {
                if (item.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.previewUrl);
                }
                pdfImages = pdfImages.filter((entry) => entry.id !== item.id);
                renderPdfImageList();
                updatePdfButtons();
            });
            pdfThumbnailsGrid.appendChild(card);
        });

        updatePdfButtons();
    }

    async function addPdfImages(files) {
        const allowedExtensions = new Set(['png', 'jpg', 'jpeg', 'webp']);
        const filesArray = Array.from(files || []);
        
        let filesToAdd = [];
        
        for (const file of filesArray) {
            const filePath = file.path || (window.app?.getPathForFile ? window.app.getPathForFile(file) : '');
            if (!filePath) continue;
            
            // Check if it's a directory by running the directory scanner helper
            let isDir = false;
            if (window.app?.readFolderImages) {
                const scanRes = await window.app.readFolderImages(filePath);
                if (scanRes && scanRes.success && scanRes.files && scanRes.files.length > 0) {
                    filesToAdd = filesToAdd.concat(scanRes.files);
                    isDir = true;
                }
            }
            
            if (!isDir) {
                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                if (allowedExtensions.has(ext)) {
                    filesToAdd.push({
                        raw: file,
                        name: file.name,
                        path: filePath,
                        size: file.size || 0
                    });
                }
            }
        }
        
        if (filesToAdd.length === 0) {
            showToast('Select image files or folders containing PNG, JPG, JPEG, or WEBP formats.', 'warning');
            return;
        }

        const prepared = await Promise.all(filesToAdd.map(async (file) => {
            let dimensions = { width: 0, height: 0 };
            let previewUrl = '';
            
            if (file.raw) {
                dimensions = await getImageDimensions(file.raw);
                previewUrl = URL.createObjectURL(file.raw);
            } else {
                previewUrl = `converthub-media://local-file/?path=${encodeURIComponent(file.path)}`;
                dimensions = await getImageDimensionsFromPath(file.path);
            }
            
            return {
                id: `pdf-img-${pdfImageIdCounter++}`,
                name: file.name,
                path: file.path,
                size: file.size,
                width: dimensions.width,
                height: dimensions.height,
                previewUrl
            };
        }));

        pdfImages = [...pdfImages, ...prepared];
        renderPdfImageList();
        showToast(`${prepared.length} image${prepared.length > 1 ? 's' : ''} added`, 'info');
    }

    function clearPdfImages() {
        pdfImages.forEach((item) => {
            if (item.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(item.previewUrl);
            }
        });
        pdfImages = [];
        if (pdfImgInput) {
            pdfImgInput.value = '';
        }
        renderPdfImageList();
        updatePdfButtons();
    }

    function renderPdfMergeList() {
        if (!pdfMergeListSection || !pdfMergeList || !pdfMergeCount) {
            return;
        }

        pdfMergeCount.textContent = String(pdfMergeFiles.length);
        pdfMergeListSection.classList.toggle('hidden', pdfMergeFiles.length === 0);
        pdfMergeList.innerHTML = '';

        pdfMergeFiles.forEach((item, index) => {
            const card = document.createElement('div');
            const safeName = escapeHtml(item.name);
            card.className = 'pdf-thumb-card no-drag';
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="file-type-icon document"><i class="fa-regular fa-file-pdf"></i></div>
                <div class="thumb-copy">
                    <div class="thumb-title" title="${safeName}">${safeName}</div>
                    <div class="thumb-meta">${formatBytes(item.size)} &bull; Position ${index + 1}</div>
                </div>
                <div class="merge-range">
                    <input type="text" class="glass-input pdf-merge-range-input" placeholder="Pages (e.g. 1-3,5)" value="${escapeHtml(item.range || '')}" title="Specify page range for this file. Leave empty to include all pages.">
                </div>
                <button class="thumb-act-btn drag-btn" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
                <button class="thumb-act-btn preview-btn" title="Preview pages"><i class="fa-regular fa-grip"></i></button>
                <button class="thumb-act-btn remove-btn" title="Remove PDF"><i class="fa-solid fa-xmark"></i></button>
            `;

            card.addEventListener('dragstart', () => {
                pdfMergeDragId = item.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (pdfMergeDragId && pdfMergeDragId !== item.id) {
                    card.classList.add('queue-item-drag-over');
                }
            });
            card.addEventListener('dragleave', () => card.classList.remove('queue-item-drag-over'));
            card.addEventListener('drop', (event) => {
                event.preventDefault();
                card.classList.remove('queue-item-drag-over');
                if (!pdfMergeDragId || pdfMergeDragId === item.id) {
                    return;
                }
                const fromIndex = pdfMergeFiles.findIndex((entry) => entry.id === pdfMergeDragId);
                const toIndex = index;
                if (fromIndex < 0 || toIndex < 0) {
                    return;
                }
                const [moved] = pdfMergeFiles.splice(fromIndex, 1);
                pdfMergeFiles.splice(toIndex, 0, moved);
                renderPdfMergeList();
            });
            card.addEventListener('dragend', () => {
                pdfMergeDragId = null;
                card.classList.remove('queue-item-dragging', 'queue-item-drag-over');
            });
            card.querySelector('.remove-btn')?.addEventListener('click', () => {
                pdfMergeFiles = pdfMergeFiles.filter((entry) => entry.id !== item.id);
                renderPdfMergeList();
                updatePdfButtons();
            });

            const rangeInputEl = card.querySelector('.pdf-merge-range-input');
            if (rangeInputEl) {
                rangeInputEl.addEventListener('input', (ev) => {
                    const val = String(ev.target.value || '').trim();
                    const idx = pdfMergeFiles.findIndex((e) => e.id === item.id);
                    if (idx >= 0) {
                        pdfMergeFiles[idx].range = val;
                    }
                });
            }

            pdfMergeList.appendChild(card);
        });

        // Attach preview button handlers for loading page thumbnails
        Array.from(pdfMergeList.querySelectorAll('.thumb-act-btn.preview-btn')).forEach((btn) => {
            btn.addEventListener('click', async (ev) => {
                const parent = btn.closest('.pdf-thumb-card');
                const id = parent?.dataset?.id;
                const entry = pdfMergeFiles.find(e => e.id === id);
                if (!entry) return;
                await loadPdfThumbnailsFor(entry);
            });
        });

        // Update merged pages section visibility
        pdfMergedPagesSection?.classList.toggle('hidden', pdfMergedPages.length === 0);
        renderMergedPagesList();

        updatePdfButtons();
    }

    function clearPdfMergeFiles() {
        pdfMergeFiles = [];
        if (pdfMergeInput) {
            pdfMergeInput.value = '';
        }
        renderPdfMergeList();
        updatePdfButtons();
    }

    async function loadPdfThumbnailsFor(entry) {
        if (!entry || !entry.path) return;
        const pdfSrc = `converthub-media:?path=${encodeURIComponent(entry.path)}`;
        try {
            const loadingTask = window.pdfjsLib.getDocument(pdfSrc);
            const pdf = await loadingTask.promise;
            const total = pdf.numPages;
            const bank = document.createElement('div');
            bank.className = 'pdf-thumb-bank';

            for (let i = 1; i <= total; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const thumb = canvas.toDataURL('image/png');

                const thumbWrap = document.createElement('div');
                thumbWrap.className = 'pdf-bank-thumb';
                thumbWrap.draggable = true;
                const img = document.createElement('img');
                img.src = thumb;
                thumbWrap.appendChild(img);

                // Drag to merged pages
                thumbWrap.addEventListener('dragstart', () => {
                    pdfBankDrag = { path: pdfSrc, pageIndex: i - 1, name: entry.name, thumb };
                });
                thumbWrap.addEventListener('dragend', () => {
                    pdfBankDrag = null;
                });

                bank.appendChild(thumbWrap);
            }

            // Show bank below the selected card (simple placement) — insert after the card element
            const cardEl = pdfMergeList.querySelector(`[data-id="${entry.id}"]`);
            if (cardEl) {
                // remove any existing bank sibling
                const existing = cardEl.nextElementSibling;
                if (existing && existing.classList && existing.classList.contains('pdf-thumb-bank')) existing.remove();
                cardEl.parentNode.insertBefore(bank, cardEl.nextSibling);
            }
        } catch (err) {
            console.error('Failed to load PDF thumbnails:', err);
            showToast('Failed to generate page previews for this PDF.', 'error');
        }
    }

    // Merged pages data structure and rendering
    const pdfMergedPages = [];

    function renderMergedPagesList() {
        if (!pdfMergedPagesList) return;
        pdfMergedPagesList.innerHTML = '';
        pdfMergedPages.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'pdf-page-card no-drag';
            card.draggable = true;
            card.dataset.id = p.id;
            card.innerHTML = `
                <img src="${p.thumb || ''}" alt="page-${p.pageIndex+1}">
                <div class="page-label">${p.name} • ${p.pageIndex + 1}</div>
            `;

            card.addEventListener('dragstart', () => {
                pdfPageDragId = p.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragend', () => {
                pdfPageDragId = null;
                card.classList.remove('queue-item-dragging');
            });

            card.querySelector('img')?.addEventListener('dblclick', () => {
                // open full-size in new window
                const win = window.open('', '_blank');
                if (win) win.document.body.innerHTML = `<img src="${p.thumb || ''}" style="max-width:100%">`;
            });

            pdfMergedPagesList.appendChild(card);
        });
    }

    // Drag target for merged pages
    if (pdfMergedPagesList) {
        pdfMergedPagesList.addEventListener('dragover', (ev) => {
            ev.preventDefault();
        });
        pdfMergedPagesList.addEventListener('drop', (ev) => {
            ev.preventDefault();
            if (pdfBankDrag) {
                const id = `merged-page-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
                pdfMergedPages.push({ id, path: pdfBankDrag.path, pageIndex: pdfBankDrag.pageIndex, name: pdfBankDrag.name, thumb: pdfBankDrag.thumb });
                renderMergedPagesList();
                pdfMergedPagesSection?.classList.remove('hidden');
            }
        });
    }

    // Allow reordering inside merged pages via drop
    pdfMergedPagesList?.addEventListener('drop', (ev) => {
        ev.preventDefault();
        // handled by dragend on cards for now
    });

    // Clear merged pages
    function clearMergedPages() {
        pdfMergedPages.length = 0;
        renderMergedPagesList();
        pdfMergedPagesSection?.classList.add('hidden');
    }

    pdfMergedClearBtn?.addEventListener('click', (ev) => {
        ev.preventDefault();
        clearMergedPages();
    });

    function setPdfMode(mode) {
        const isExtractMode = mode === 'pdf-to-img';
        const isMergeMode = mode === 'merge-pdf';
        const isImageMode = mode === 'img-to-pdf';
        pdfTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
        pdfImgPanel?.classList.toggle('hidden', !isImageMode);
        pdfExtractPanel?.classList.toggle('hidden', !isExtractMode);
        pdfMergePanel?.classList.toggle('hidden', !isMergeMode);
        sidebarImgToPdf?.classList.toggle('hidden', !isImageMode);
        sidebarPdfToImg?.classList.toggle('hidden', !isExtractMode);
        sidebarMergePdf?.classList.toggle('hidden', !isMergeMode);
    }

    async function compilePdfImages() {
        if (pdfImages.length === 0) {
            showToast('Add images before compiling a PDF.', 'error', 6000);
            return;
        }
        const outputFolder = getPdfOutputFolder();
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        const pageRangeInput = document.getElementById('pdf-page-range-input')?.value || '';
        const qualityVal = parseInt(document.getElementById('pdf-quality-slider')?.value || '100', 10);
        const imageLayout = document.getElementById('pdf-image-layout')?.value || 'CENTER';
        const addPageNumbers = document.getElementById('pdf-page-numbers')?.checked || false;
        const metaTitle = document.getElementById('pdf-meta-title')?.value || '';
        const metaAuthor = document.getElementById('pdf-meta-author')?.value || '';
        const pdfPassword = document.getElementById('pdf-password')?.value || '';


        let selectedPaths = pdfImages.map((item) => item.path);
        if (pageRangeInput.trim()) {
            selectedPaths = parsePageRangeFilter(selectedPaths, pageRangeInput.trim());
        }

        if (selectedPaths.length === 0) {
            showToast('Page range resulted in 0 pages to compile.', 'warning');
            return;
        }

        pdfCompileBtn.disabled = true;
        const originalLabel = pdfCompileBtn.innerHTML;
        pdfCompileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling PDF';

        try {
            const result = await window.app?.createPDF?.({
                imagePaths: selectedPaths,
                outputFolder,
                pdfName: pdfOutputName?.value || 'Compiled_Images',
                pageSize: pdfPageSize?.value || 'A4',
                orientation: pdfPageOrientation?.value || 'PORTRAIT',
                marginType: pdfPageMargin?.value || 'NONE',
                quality: qualityVal,
                layout: imageLayout,
                pageNumbers: addPageNumbers,
                title: metaTitle,
                author: metaAuthor,
                password: pdfPassword
            });


            if (result?.success) {
                showToast(`PDF created: ${result.fileName || 'Compiled_Images.pdf'}`, 'success');
                addRecentFile(result.fileName || 'Compiled_Images.pdf', 'pdf', result.outputPath);
                clearPdfImages();
            } else {
                showToast(result?.error || 'Failed to create PDF.', 'error', 6000);
            }
        } catch (error) {
            showToast(error?.message || 'Failed to create PDF.', 'error', 6000);
        } finally {
            pdfCompileBtn.innerHTML = originalLabel;
            updatePdfButtons();
        }
    }

    async function setPdfExtractFile(files) {
        const [file] = normalizePdfSelectedFiles(files, ['pdf']);
        if (!file) {
            showToast('Select a valid PDF file.', 'warning');
            return;
        }

        selectedPdfFile = file;
        if (pdfDetailName) pdfDetailName.textContent = file.name;
        if (pdfDetailMeta) pdfDetailMeta.textContent = `${formatBytes(file.size)} &bull; Ready to extract`;
        pdfFileDropzone?.classList.add('hidden');
        pdfFileDetails?.classList.remove('hidden');
        updatePdfButtons();
    }

    function clearPdfExtractFile() {
        selectedPdfFile = null;
        if (pdfFileInput) {
            pdfFileInput.value = '';
        }
        pdfFileDetails?.classList.add('hidden');
        pdfFileDropzone?.classList.remove('hidden');
        updatePdfButtons();
    }

    function addPdfMergeFiles(files) {
        const selectedFiles = normalizePdfSelectedFiles(files, ['pdf']);
        if (selectedFiles.length === 0) {
            showToast('Select valid PDF files to merge.', 'warning');
            return;
        }

        const existingPaths = new Set(pdfMergeFiles.map((file) => String(file.path || '').toLowerCase()).filter(Boolean));
        const uniqueFiles = selectedFiles.filter((file) => {
            if (!file.path) {
                return false;
            }
            const normalizedPath = file.path.toLowerCase();
            if (existingPaths.has(normalizedPath)) {
                return false;
            }
            existingPaths.add(normalizedPath);
            return true;
        });

        if (uniqueFiles.length === 0) {
            showToast('Those PDFs are already in the merge list.', 'info');
            return;
        }

        const prepared = uniqueFiles.map((file) => ({
            id: `pdf-merge-${pdfMergeIdCounter++}`,
            name: file.name,
            path: file.path,
            size: file.size
            ,
            range: ''
        }));

        pdfMergeFiles = [...pdfMergeFiles, ...prepared];
        renderPdfMergeList();
        showToast(`${prepared.length} PDF${prepared.length > 1 ? 's' : ''} added`, 'info');
    }

    async function mergePdfFiles() {
        if (pdfMergeFiles.length < 2) {
            showToast('Add at least two PDFs before merging.', 'warning');
            return;
        }

        const outputFolder = getPdfMergeFolder();
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        pdfMergeBtn.disabled = true;
        const originalLabel = pdfMergeBtn.innerHTML;
        pdfMergeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Merging PDFs';

        try {
            // If user assembled page-level list, send explicit pageList; otherwise send per-file ranges
            const payload = {
                outputFolder,
                pdfName: pdfMergeOutputName?.value || 'Merged_PDF'
            };
            if (pdfMergedPages.length > 0) {
                payload.pageList = pdfMergedPages.map(p => ({ path: p.path, pageIndex: p.pageIndex }));
            } else {
                payload.pdfPaths = pdfMergeFiles.map((file) => ({ path: file.path, range: file.range }));
            }

            const result = await window.app?.mergePDFs?.(payload);

            if (result?.success) {
                showToast(`Merged ${result.pageCount || ''} pages into ${result.fileName || 'Merged_PDF.pdf'}`, 'success');
                addRecentFile(result.fileName || 'Merged_PDF.pdf', 'pdf', result.outputPath);
                if (appSettings.openFolderOnComplete && result.outputPath) {
                    await window.app?.openFolder?.(getFolderFromPath(result.outputPath));
                }
                clearPdfMergeFiles();
            } else {
                showToast(result?.error || 'Failed to merge PDFs.', 'error', 6000);
            }
        } catch (error) {
            showToast(error?.message || 'Failed to merge PDFs.', 'error', 6000);
        } finally {
            pdfMergeBtn.innerHTML = originalLabel;
            updatePdfButtons();
        }
    }

    async function extractPdfImages() {
        if (!selectedPdfFile) {
            showToast('Add a PDF before extracting images.', 'warning');
            return;
        }

        const format = pdfExtractFormat?.value || 'png';
        const rangeType = pdfExtractRangeType?.value || 'ALL';
        const rangeInput = pdfExtractRangeInput?.value || '';
        const resolutionMode = pdfResolutionMode?.value || 'WIDTH';
        const width = parseInt(pdfWidthSlider?.value || '1200', 10);
        const dpi = parseInt(pdfDpiSelect?.value || '150', 10);
        const jpgQuality = Math.min(100, Math.max(40, parseInt(pdfJpgQualitySlider?.value || '92', 10))) / 100;
        const shouldCreateZip = Boolean(pdfExtractZip?.checked);
        const pdfStem = getPdfStem(selectedPdfFile.name);
        const safePdfStem = sanitizeFileStem(pdfStem);
        const outputFolderRoot = getPdfExtractFolder();

        if (!outputFolderRoot) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        pdfExtractBtn.disabled = true;
        const originalLabel = pdfExtractBtn.innerHTML;
        pdfExtractBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting...';

        let loadingTask = null;
        let pdf = null;
        try {
            const pdfJs = window.pdfjsLib;
            if (!pdfJs?.getDocument) {
                throw new Error('PDF renderer is not available. Restart the app and try again.');
            }

            const pdfBytes = await getPdfDocumentBytes(selectedPdfFile);
            loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const pagesToExtract = parsePdfPageSelection(rangeType, rangeInput, totalPages);

            if (pagesToExtract.length === 0) {
                showToast('No valid pages to extract.', 'warning');
                return;
            }

            const shouldCreateSubfolder = pdfExtractSubfolder?.checked !== false && pagesToExtract.length > 1;
            const outputFolder = shouldCreateSubfolder
                ? joinOutputPath(outputFolderRoot, safePdfStem)
                : outputFolderRoot;
            let successCount = 0;
            const savedImagePaths = [];
            const imageMimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const exportQuality = format === 'jpg' ? jpgQuality : undefined;

            for (let index = 0; index < pagesToExtract.length; index++) {
                const pageNum = pagesToExtract[index];
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1 });
                const scale = getPdfRenderScale(resolutionMode, width, dpi, viewport);
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const outputWidth = Math.max(1, Math.round(scaledViewport.width));
                const outputHeight = Math.max(1, Math.round(scaledViewport.height));
                canvas.width = outputWidth;
                canvas.height = outputHeight;

                if (format === 'jpg') {
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, outputWidth, outputHeight);
                }

                await page.render({
                    canvasContext: context,
                    viewport: scaledViewport,
                    background: format === 'jpg' ? 'white' : undefined
                }).promise;

                const base64Data = canvas.toDataURL(imageMimeType, exportQuality);
                const dataUrlParts = base64Data.split(',');
                const base64String = dataUrlParts.length > 1 ? dataUrlParts[1] : base64Data;

                const fileName = getExtractedPageFileName(
                    pdfFileNaming?.value || 'stem_page_number',
                    pdfStem,
                    pageNum,
                    totalPages,
                    format
                );
                
                const result = await window.app.saveExtractedPage({
                    base64Data: base64String,
                    outputFolder,
                    fileName
                });

                if (result?.success) {
                    successCount++;
                    if (result.outputPath) {
                        savedImagePaths.push(result.outputPath);
                    }
                }

                page.cleanup?.();
                pdfExtractBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Extracting ${index + 1}/${pagesToExtract.length}`;
            }

            if (successCount === 0) {
                showToast('No pages were saved.', 'warning');
                return;
            }

            if (shouldCreateZip && savedImagePaths.length > 0) {
                const zipResult = await window.app.createExtractedImagesZip?.({
                    filePaths: savedImagePaths,
                    outputFolder,
                    zipName: `${safePdfStem}_images`
                });

                if (zipResult?.success) {
                    showToast(`ZIP created: ${zipResult.fileName}`, 'success');
                } else {
                    showToast(zipResult?.error || 'Images were saved, but ZIP creation failed.', 'warning', 6000);
                }
            }

            showToast(`Successfully extracted ${successCount} page${successCount > 1 ? 's' : ''} as ${format.toUpperCase()}`, 'success');
            addRecentFile(`${pdfStem} (${successCount} images)`, format, outputFolder);
            if (appSettings.openFolderOnComplete) {
                await window.app.openFolder(outputFolder);
            }
            clearPdfExtractFile();

        } catch (error) {
            console.error('[renderer] PDF extraction failed:', error);
            showToast(`Extraction failed: ${error.message}`, 'error', 6000);
        } finally {
            if (pdf?.destroy) {
                await pdf.destroy().catch(() => undefined);
            } else if (loadingTask?.destroy) {
                loadingTask.destroy();
            }
            pdfExtractBtn.innerHTML = originalLabel;
            pdfExtractBtn.disabled = false;
        }
    }

    function switchWorkspace(target) {
        if (!launchpadWorkspace || !converterWorkspace || !pdfWorkspace || !headerHomeBtn) {
            return;
        }

        if (target === 'converter') {
            launchpadWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
            converterWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.remove('hidden');
            localStorage.setItem('converthub_last_workspace', 'converter');
        } else if (target === 'pdf') {
            launchpadWorkspace.classList.add('hidden');
            converterWorkspace.classList.add('hidden');
            pdfWorkspace.classList.remove('hidden');
            headerHomeBtn.classList.remove('hidden');
            localStorage.setItem('converthub_last_workspace', 'pdf');
        } else {
            // launchpad
            converterWorkspace.classList.add('hidden');
            pdfWorkspace.classList.add('hidden');
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
        renderPdfImageList();
        renderPdfMergeList();
        clearPdfExtractFile();
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
        if (bypassLaunchpad) {
            switchWorkspace(lastWorkspace);
        } else {
            switchWorkspace('launchpad');
        }


        const missingEngines = Object.entries(engineStatus?.engines || {})
            .filter(([, info]) => !info.available)
            .map(([name]) => name);
        if (missingEngines.length > 0) {
            showToast(`Some converters are unavailable on this ${getPlatformLabel(engineStatus?.platform)} setup: ${missingEngines.join(', ')}`, 'warning', 6000, { skipNotification: true });
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
    }

    themeToggle.addEventListener('click', () => {
        applyTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        saveSettings();
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
        fileQueue = [];
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
            defaultOutputFolder: settingsDefaultOutputFolder.value || ''
        };
        saveSettings();
        syncSettingsForm();
        syncSidebarFromScope();
        renderQueue();
        closeSettings();
        showToast('Settings saved', 'success');
    });

    settingsReset.addEventListener('click', () => {
        appSettings = { ...DEFAULT_SETTINGS, defaultOutputFolder: defaultDownloadsPath };
        saveSettings();
        syncSettingsForm();
        syncSidebarFromScope();
        renderQueue();
        showToast('Settings reset to defaults', 'info');
    });

    convertBtn.addEventListener('click', () => {
        if (isConverting) {
            stopActiveConversion();
            return;
        }
        runBatchConversion();
    });

    clearRecentBtn.addEventListener('click', () => {
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

    // Home Button Event
    headerHomeBtn?.addEventListener('click', () => {
        switchWorkspace('launchpad');
    });

    // Bypass Launchpad Checkbox Event
    bypassLaunchpadCheckbox?.addEventListener('change', (e) => {
        localStorage.setItem('converthub_bypass_launchpad', String(e.target.checked));
    });

    pdfTabs.forEach((tab) => {
        tab.addEventListener('click', () => setPdfMode(tab.dataset.mode || 'img-to-pdf'));
    });

    pdfImgDropzone?.addEventListener('click', () => pdfImgInput?.click());
    pdfImgDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfImgInput?.click();
    });
    pdfImgDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfImgDropzone.classList.add('dragover');
    });
    pdfImgDropzone?.addEventListener('dragleave', () => pdfImgDropzone.classList.remove('dragover'));
    pdfImgDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfImgDropzone.classList.remove('dragover');
        addPdfImages(event.dataTransfer.files);
    });
    pdfImgInput?.addEventListener('change', (event) => {
        addPdfImages(event.target.files);
        event.target.value = '';
    });
    pdfImgClearBtn?.addEventListener('click', clearPdfImages);
    pdfCompileBtn?.addEventListener('click', compilePdfImages);

    pdfPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfOutputFolderInput) {
            pdfOutputFolderInput.value = folder;
        }
    });
    pdfOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfOutputFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    pdfFileDropzone?.addEventListener('click', () => pdfFileInput?.click());
    pdfFileDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfFileInput?.click();
    });
    pdfFileDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfFileDropzone.classList.add('dragover');
    });
    pdfFileDropzone?.addEventListener('dragleave', () => pdfFileDropzone.classList.remove('dragover'));
    pdfFileDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfFileDropzone.classList.remove('dragover');
        setPdfExtractFile(event.dataTransfer.files);
    });
    pdfFileInput?.addEventListener('change', (event) => {
        setPdfExtractFile(event.target.files);
        event.target.value = '';
    });
    pdfRemoveFileBtn?.addEventListener('click', clearPdfExtractFile);
    pdfExtractBtn?.addEventListener('click', extractPdfImages);
    pdfExtractRangeType?.addEventListener('change', () => {
        pdfExtractRangeGroup?.classList.toggle('hidden', pdfExtractRangeType.value !== 'CUSTOM');
    });
    pdfResolutionMode?.addEventListener('change', () => {
        const isDpiMode = pdfResolutionMode.value === 'DPI';
        pdfDpiGroup?.classList.toggle('hidden', !isDpiMode);
        pdfWidthSlider?.closest('.form-group')?.classList.toggle('hidden', isDpiMode);
    });
    pdfExtractFormat?.addEventListener('change', () => {
        pdfJpgQualityGroup?.classList.toggle('hidden', pdfExtractFormat.value !== 'jpg');
    });
    pdfWidthSlider?.addEventListener('input', () => {
        if (pdfWidthVal) {
            pdfWidthVal.textContent = `${pdfWidthSlider.value}px`;
        }
    });
    pdfJpgQualitySlider?.addEventListener('input', () => {
        if (pdfJpgQualityVal) {
            pdfJpgQualityVal.textContent = `${pdfJpgQualitySlider.value}%`;
        }
    });
    pdfExtractPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfExtractFolderInput) {
            pdfExtractFolderInput.value = folder;
        }
    });
    pdfExtractOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfExtractFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    pdfMergeDropzone?.addEventListener('click', () => pdfMergeInput?.click());
    pdfMergeDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfMergeInput?.click();
    });
    pdfMergeDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfMergeDropzone.classList.add('dragover');
    });
    pdfMergeDropzone?.addEventListener('dragleave', () => pdfMergeDropzone.classList.remove('dragover'));
    pdfMergeDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfMergeDropzone.classList.remove('dragover');
        addPdfMergeFiles(event.dataTransfer.files);
    });
    pdfMergeInput?.addEventListener('change', (event) => {
        addPdfMergeFiles(event.target.files);
        event.target.value = '';
    });
    pdfMergeClearBtn?.addEventListener('click', clearPdfMergeFiles);
    pdfMergeBtn?.addEventListener('click', mergePdfFiles);
    pdfMergePickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfMergeFolderInput) {
            pdfMergeFolderInput.value = folder;
        }
    });
    pdfMergeOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfMergeFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    // Sidebar collapsible section toggles
    document.querySelectorAll('.pdf-sidebar-section').forEach((section) => {
        const titleEl = section.querySelector('.pdf-sidebar-title');
        const scrollEl = section.querySelector('.settings-form-scroll');
        if (titleEl && scrollEl) {
            titleEl.addEventListener('click', () => {
                const isCollapsed = scrollEl.classList.toggle('collapsed');
                const chevron = titleEl.querySelector('.fa-chevron-up, .fa-chevron-down');
                if (chevron) {
                    if (isCollapsed) {
                        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    } else {
                        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
                    }
                }
            });
        }
    });

    // Advanced Options Toggler
    const pdfAdvancedToggleBtn = document.getElementById('pdf-advanced-toggle-btn');
    const pdfAdvancedOptionsContent = document.getElementById('pdf-advanced-options-content');
    pdfAdvancedToggleBtn?.addEventListener('click', () => {
        const isHidden = pdfAdvancedOptionsContent.classList.toggle('hidden');
        const chevron = pdfAdvancedToggleBtn.querySelector('i');
        if (chevron) {
            if (isHidden) {
                chevron.className = 'fa-solid fa-chevron-down';
            } else {
                chevron.className = 'fa-solid fa-chevron-up';
            }
        }
    });

    // Image Quality Slider Value Update
    const pdfQualitySlider = document.getElementById('pdf-quality-slider');
    const pdfQualityVal = document.getElementById('pdf-quality-val');
    pdfQualitySlider?.addEventListener('input', () => {
        if (pdfQualityVal) {
            pdfQualityVal.textContent = `${pdfQualitySlider.value}%`;
        }
    });

    init();
}());
