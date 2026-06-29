document.addEventListener('DOMContentLoaded', async () => {
    const getAPI = () => window.electronAPI || window.app || {};

    // Synchronize theme with host application
    try {
        const theme = await getAPI().getSystemTheme?.();
        if (theme) {
            document.body.setAttribute('data-theme', theme);
        }
        getAPI().onSystemThemeUpdated?.((newTheme) => {
            document.body.setAttribute('data-theme', newTheme);
        });
    } catch (_) {}

    // Version retrieval
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
        try {
            const getVer = getAPI().getAppVersion;
            const version = await getVer?.();
            if (version) {
                versionEl.textContent = `v${version}`;
            } else {
                versionEl.textContent = 'v2.1';
            }
        } catch (_) {
            versionEl.textContent = 'v2.1';
        }
    }

    // External link handlers
    const linkMap = {
        'link-privacy': 'https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/blob/main/PRIVACY.md',
        'link-terms': 'https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/blob/main/TERMS.md',
        'link-licenses': 'https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/blob/main/THIRD_PARTY_LICENSES.md'
    };

    Object.entries(linkMap).forEach(([id, url]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const openExt = getAPI().openExternal;
                if (openExt) {
                    openExt(url);
                }
            });
        }
    });

    // Close button handler
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.close();
        });
    }
});
