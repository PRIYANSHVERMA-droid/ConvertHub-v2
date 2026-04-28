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
            batchStatusTitle.textContent = 'Batch progress';
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
            completedIds: new Set()
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
                <i class="fa-regular fa-circle-check success-icon pulse-anim"></i>
            `;
            if (item.outputPath && window.app && window.app.openFolder) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
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
        return {
            text: 'Ready',
            color: 'var(--text-muted)',
            width: '0%',
            background: 'var(--primary-btn)'
        };
    }

    function canRetryItem(item) {
        return Boolean(item?.detectedType && item?.status === 'error' && item?.file?.path && !isConverting);
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
                <span class="queue-override-badge hidden">Custom</span>
            </div>
            <div class="progress-container">
                <div class="progress-text"></div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
            <div class="queue-actions">
                <button class="no-drag queue-retry-btn hidden" data-id="${item.id}" title="Retry conversion">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button class="no-drag queue-delete-btn" data-id="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

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
        const progressText = el.querySelector('.progress-text');
        const progressBar = el.querySelector('.progress-bar-fill');
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
        retryBtn.classList.toggle('hidden', !retryVisible);
        retryBtn.disabled = !retryVisible;
        deleteBtn.disabled = item.status === 'converting';
        overrideBadge.classList.toggle('hidden', !item.override);
        el.classList.toggle('queue-item-selected', selectedScope.kind === 'file' && selectedScope.fileId === item.id);
        el.classList.toggle('queue-item-disabled', !item.detectedType);
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
        if (isConverting) {
            return;
        }
        const readyCount = fileQueue.filter((item) => item.status === 'ready' && item.detectedType).length;
        convertBtn.innerHTML = readyCount > 1
            ? `<i class="fa-solid fa-layer-group"></i> Convert ${readyCount} Files`
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
        renderQueue();
        syncSidebarFromScope();
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

                if (!item.recordedInRecent) {
                    addRecentFile(item.file.name, result.format || resolved.format, result.outputPath);
                    item.recordedInRecent = true;
                }

                showToast(`${item.file.name} converted successfully`, 'success');

                if (result.outputPath && result.outputPath !== requestedOutputPath) {
                    showToast('Output file was auto-renamed to avoid overwriting an existing file', 'info');
                }

                if (appSettings.openFolderOnComplete && result.outputPath && window.app?.openFolder) {
                    await window.app.openFolder(getFolderFromPath(result.outputPath));
                }
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
            renderQueue();
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
            showToast('No files to convert. Add files first!', 'warning');
            return;
        }

        isConverting = true;
        convertBtn.classList.add('processing');
        convertBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Running Batch...';

        let successCount = 0;
        let errorCount = 0;
        let renamedOutputCount = 0;

        readyFiles.forEach((item) => {
            item.status = 'converting';
            item.progress = 0;
        });

        renderQueue();
        setBatchStatus({
            title: `Preparing batch of ${readyFiles.length}`,
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

                results.forEach((entry, index) => {
                    const item = getFileById(entry.fileId);
                    if (!item) {
                        return;
                    }
                    if (entry.success) {
                        item.status = 'done';
                        item.progress = 100;
                        item.errorMessage = '';
                        successCount += 1;
                        if (entry.outputPath && jobs[index] && entry.outputPath !== jobs[index].outputPath) {
                            renamedOutputCount += 1;
                        }
                        markBatchItemComplete(item.id);
                        if (!item.recordedInRecent) {
                            addRecentFile(item.file.name, entry.format || resolveFileSettings(item).format, entry.outputPath);
                            item.recordedInRecent = true;
                        }
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
                        title: `Processed ${index + 1} of ${results.length}`,
                        meta: `${completed} completed • ${Math.max(0, readyFiles.length - completed)} remaining`,
                        percent: results.length ? Math.round(((index + 1) / results.length) * 100) : 100,
                        completed,
                        completedIds: activeBatch?.completedIds || new Set()
                    });
                });

                if (!result?.success && result?.error && results.length === 0) {
                    showToast(result.error, 'error', 6000);
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
        convertBtn.classList.remove('processing');
        setBatchStatus({
            title: errorCount === 0 ? 'Batch complete' : 'Batch finished with issues',
            meta: `${successCount} completed • ${errorCount} failed`,
            percent: 100,
            completed: successCount + errorCount,
            completedIds: activeBatch?.completedIds || new Set()
        });
        renderQueue();

        if (successCount > 0 && errorCount === 0) {
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

        if (window.app && window.app.getEngineStatus) {
            try {
                engineStatus = await window.app.getEngineStatus();
            } catch {
                engineStatus = null;
            }
        }

        syncSettingsForm();
        ensureGroupSettings('audio');
        syncSidebarFromScope();
        loadRecentFiles();
        renderNotifications();
        updateNotificationBadge();
        renderEngineStatus();
        renderQueue();

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
                        title: `Batch converting ${data.batchIndex + 1} of ${data.totalJobs}`,
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

    convertBtn.addEventListener('click', runBatchConversion);

    clearRecentBtn.addEventListener('click', () => {
        localStorage.removeItem('converthub_recent');
        loadRecentFiles();
        showToast('Recent history cleared', 'info');
    });

    init();
}());
