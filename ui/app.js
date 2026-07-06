import { state, getSavedSettings, getSavedNotifications } from './renderer/state.js';
import { initWindowControls } from './renderer/windowControls.js';
import { initializeLegalTerms, hideStartupSplash } from './renderer/splash.js';
import { initNotifications, renderNotifications, updateNotificationBadge } from './renderer/notifications.js';
import { initPresets, loadCustomPresets } from './renderer/presetsUI.js';
import { initHistory, loadRecentFiles } from './renderer/historyUI.js';
import { initPDFToolkit } from './renderer/pdfToolkitUI.js';
import { initConversion } from './renderer/conversionUI.js';

console.log('[renderer] app.js loaded');

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize state values
    state.appSettings = getSavedSettings();
    state.notifications = getSavedNotifications();

    if (window.app && window.app.getFormats) {
        try {
            const formats = await window.app.getFormats();
            if (formats && typeof formats === 'object') {
                state.FORMAT_MAP = formats;
            }
        } catch (_) {}
    }

    if (window.app && window.app.getDefaultOutput) {
        try {
            state.defaultDownloadsPath = await window.app.getDefaultOutput();
        } catch (_) {
            state.defaultDownloadsPath = '';
        }
    }

    // Hard timeout fallback for splash screen: force remove it if it hangs for 8s
    setTimeout(() => {
        const splash = document.getElementById('app-splash');
        if (splash && !splash.classList.contains('splash-hide')) {
            console.error('[renderer] Splash screen fallback triggered — forcing splash removal.');
            splash.classList.add('splash-hide');
            setTimeout(() => splash.classList.add('splash-remove'), 520);
        }
    }, 8000);

    // 2. Initialize feature components with try/catch wrapping to isolate exceptions
    try {
        initConversion();
    } catch (err) {
        console.error('[renderer] Failed to initialize conversion workspace:', err);
    }

    try {
        initPDFToolkit();
    } catch (err) {
        console.error('[renderer] Failed to initialize PDF toolkit:', err);
    }

    try {
        initWindowControls();
    } catch (err) {
        console.error('[renderer] Failed to initialize window controls:', err);
    }

    try {
        initializeLegalTerms();
    } catch (err) {
        console.error('[renderer] Failed to initialize legal terms:', err);
    }

    hideStartupSplash(700);

    try {
        initNotifications();
    } catch (err) {
        console.error('[renderer] Failed to initialize notifications:', err);
    }

    try {
        initPresets({
            getSelectedType: () => window.getSelectedType(),
            getScopeSettings: () => window.getScopeSettings(),
            syncSidebarFromScope: () => window.syncSidebarFromScope()
        });
    } catch (err) {
        console.error('[renderer] Failed to initialize presets:', err);
    }

    try {
        initHistory();
    } catch (err) {
        console.error('[renderer] Failed to initialize history:', err);
    }

    // 3. Load presets
    try {
        await loadCustomPresets();
    } catch (err) {
        console.error('[renderer] Failed to load custom presets:', err);
    }

    // 4. Initial rendering
    try {
        // Sync local variables in conversionUI to shared state
        window.syncState?.();

        window.syncSidebarFromScope?.();
        loadRecentFiles();
        renderNotifications();
        updateNotificationBadge();
    } catch (err) {
        console.error('[renderer] Failed during initial rendering pass:', err);
    }
});
