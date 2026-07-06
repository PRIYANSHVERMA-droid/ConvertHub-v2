import { desktopBridge } from './state.js';

export function initWindowControls() {
    const winMinButton = document.getElementById('win-min');
    const winMaxButton = document.getElementById('win-max');
    const winCloseButton = document.getElementById('win-close');

    if (!desktopBridge) {
        console.warn('window.app is undefined. Frameless window controls are unavailable.');
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
}
