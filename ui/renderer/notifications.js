import { state, saveNotifications } from './state.js';

export function formatNotificationTime(timestamp) {
    const elapsed = Date.now() - timestamp;
    if (elapsed < 60000) return 'Just now';
    const mins = Math.floor(elapsed / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

export function getNotificationIcon(type) {
    if (type === 'success') return 'fa-circle-check';
    if (type === 'error') return 'fa-circle-xmark';
    if (type === 'warning') return 'fa-triangle-exclamation';
    return 'fa-circle-info';
}

export function updateNotificationBadge() {
    const notificationBadge = document.getElementById('notification-badge');
    if (!notificationBadge) return;
    const unread = state.notifications.filter(n => !n.read).length;
    if (unread > 0) {
        notificationBadge.textContent = unread > 99 ? '99+' : unread;
        notificationBadge.classList.remove('hidden');
    } else {
        notificationBadge.classList.add('hidden');
    }
}

export function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    const notificationsEmpty = document.getElementById('notifications-empty');
    if (!notificationsList) return;

    notificationsList.innerHTML = '';
    if (state.notifications.length === 0) {
        notificationsEmpty?.classList.remove('hidden');
        return;
    }
    notificationsEmpty?.classList.add('hidden');

    state.notifications.forEach(item => {
        const div = document.createElement('div');
        div.className = `notification-item ${item.read ? 'read' : 'unread'}`;
        div.innerHTML = `
            <div class="notification-item-icon ${item.type}">
                <i class="fa-solid ${getNotificationIcon(item.type)}"></i>
            </div>
            <div class="notification-item-content">
                <div class="notification-item-title">${item.title}</div>
                <div class="notification-item-desc">${item.message}</div>
                <div class="notification-item-time">${formatNotificationTime(item.timestamp)}</div>
            </div>
        `;
        notificationsList.appendChild(div);
    });
}

export function persistAndRenderNotifications() {
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
}

export function addNotification(title, message, type = 'info') {
    const overlay = document.getElementById('notifications-overlay');
    state.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title,
        message,
        type,
        read: overlay && !overlay.classList.contains('hidden'),
        timestamp: Date.now()
    });
    state.notifications = state.notifications.slice(0, 50);
    persistAndRenderNotifications();
}

export function showToast(message, type = 'info', duration = 4000, options = {}) {
    if (!options.skipNotification) {
        addNotification(
            type === 'success' ? 'Success' : type === 'error' ? 'Issue detected' : type === 'warning' ? 'Attention needed' : 'Update',
            message,
            type
        );
    }

    if (!state.appSettings.showToasts && type !== 'error') {
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
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
    }
    const dismiss = () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 400);
    };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
}

// Make globally available as video-toolkit or other parts expect it on window
window.showToast = showToast;

export function openNotifications() {
    const notificationsOverlay = document.getElementById('notifications-overlay');
    const settingsOverlay = document.getElementById('settings-overlay');
    if (!notificationsOverlay) return;

    if (!notificationsOverlay.classList.contains('hidden')) {
        closeNotifications();
        return;
    }

    if (settingsOverlay) {
        settingsOverlay.classList.add('hidden');
    }

    state.notifications = state.notifications.map((item) => ({ ...item, read: true }));
    persistAndRenderNotifications();
    notificationsOverlay.classList.remove('hidden');
    document.body.classList.add('settings-open');
}

export function closeNotifications() {
    const notificationsOverlay = document.getElementById('notifications-overlay');
    const settingsOverlay = document.getElementById('settings-overlay');
    if (!notificationsOverlay) return;

    notificationsOverlay.classList.add('hidden');
    if (!settingsOverlay || settingsOverlay.classList.contains('hidden')) {
        document.body.classList.remove('settings-open');
    }
}

export function initNotifications() {
    const notificationsToggle = document.getElementById('notifications-toggle');
    const notificationsClose = document.getElementById('notifications-close');
    const notificationsMarkRead = document.getElementById('notifications-mark-read');
    const notificationsClear = document.getElementById('notifications-clear');

    notificationsToggle?.addEventListener('click', openNotifications);
    notificationsClose?.addEventListener('click', closeNotifications);

    notificationsMarkRead?.addEventListener('click', () => {
        state.notifications = state.notifications.map(item => ({ ...item, read: true }));
        persistAndRenderNotifications();
    });

    notificationsClear?.addEventListener('click', () => {
        state.notifications = [];
        persistAndRenderNotifications();
    });
    
    // Expose functions globally for other modules to access
    window.renderNotifications = renderNotifications;
    window.updateNotificationBadge = updateNotificationBadge;
    window.closeNotifications = closeNotifications;
}

