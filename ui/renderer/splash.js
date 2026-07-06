import { PRIVACY_POLICY_HTML, TERMS_OF_USE_HTML } from './legalContent.js';
import { desktopBridge } from './state.js';

export function hideStartupSplash(delay = 700) {
    const splash = document.getElementById('app-splash');
    if (!splash) return;
    setTimeout(() => {
        try {
            splash.classList.add('splash-hide');
            // remove from DOM after animation completes
            setTimeout(() => splash.classList.add('splash-remove'), 520);
        } catch (e) {
            // ignore
        }
    }, delay);
}

export function initializeLegalTerms() {
    const hasAccepted = localStorage.getItem('converthub_accepted_legal') === 'true';
    const overlay = document.getElementById('terms-overlay');
    if (!overlay) return;

    if (hasAccepted) {
        overlay.classList.add('hidden');
        return;
    }

    // Show overlay
    overlay.classList.remove('hidden');

    const checkbox = document.getElementById('terms-checkbox');
    const acceptBtn = document.getElementById('terms-accept-btn');
    const declineBtn = document.getElementById('terms-decline-btn');
    const viewPrivacyBtn = document.getElementById('terms-view-privacy');
    const viewTermsBtn = document.getElementById('terms-view-terms');

    const mainCard = overlay.querySelector('.terms-card:not(#legal-viewer)');
    const viewerCard = document.getElementById('legal-viewer');
    const viewerIcon = document.getElementById('legal-viewer-icon');
    const viewerTitle = document.getElementById('legal-viewer-title');
    const viewerSubtitle = document.getElementById('legal-viewer-subtitle');
    const viewerBody = document.getElementById('legal-viewer-body');
    const viewerBackBtn = document.getElementById('legal-viewer-back-btn');

    if (checkbox && acceptBtn) {
        checkbox.addEventListener('change', (e) => {
            acceptBtn.disabled = !e.target.checked;
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            if (desktopBridge && typeof desktopBridge.close === 'function') {
                desktopBridge.close();
            } else {
                window.close();
            }
        });
    }

    if (acceptBtn && overlay) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('converthub_accepted_legal', 'true');
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 300);
        });
    }

    if (viewPrivacyBtn && mainCard && viewerCard && viewerBody) {
        viewPrivacyBtn.addEventListener('click', () => {
            viewerTitle.textContent = "Privacy Policy";
            viewerSubtitle.textContent = "Last updated: June 30, 2026";
            viewerIcon.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
            viewerBody.innerHTML = PRIVACY_POLICY_HTML;
            mainCard.classList.add('hidden');
            viewerCard.classList.remove('hidden');
            viewerBody.scrollTop = 0;
        });
    }

    if (viewTermsBtn && mainCard && viewerCard && viewerBody) {
        viewTermsBtn.addEventListener('click', () => {
            viewerTitle.textContent = "Terms of Use";
            viewerSubtitle.textContent = "Last updated: June 30, 2026";
            viewerIcon.innerHTML = '<i class="fa-solid fa-file-contract"></i>';
            viewerBody.innerHTML = TERMS_OF_USE_HTML;
            mainCard.classList.add('hidden');
            viewerCard.classList.remove('hidden');
            viewerBody.scrollTop = 0;
        });
    }

    if (viewerBackBtn && mainCard && viewerCard) {
        viewerBackBtn.addEventListener('click', () => {
            viewerCard.classList.add('hidden');
            mainCard.classList.remove('hidden');
        });
    }
}
