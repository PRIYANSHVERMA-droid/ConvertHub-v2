import { state, escapeHtml, truncateName, getIconForFormat, getFolderFromPath } from './state.js';
import { showToast } from './notifications.js';

export function refreshRecentFiles() {
    loadRecentFiles();
}

export async function loadRecentFiles() {
    const recentList = document.getElementById('recent-list');
    if (!recentList) return;
    if (!window.app?.getHistory) return;
    try {
        const recents = await window.app.getHistory();
        recentList.innerHTML = '';
        if (!recents || recents.length === 0) {
            recentList.innerHTML = '<p class="no-recents">No recent conversions</p>';
            return;
        }
        // Show 10 most recent
        recents.slice(0, 10).forEach((item) => {
            const format = (item.outputFormat || 'unk').toLowerCase();
            const iconInfo = getIconForFormat(format);
            const div = document.createElement('div');
            div.className = 'recent-item slide-in';
            const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = `
                <div class="recent-icon ${iconInfo.class}"><i class="fa-regular ${iconInfo.icon}"></i></div>
                <div class="recent-info">
                    <span class="recent-name" title="${escapeHtml(item.inputFiles[0]?.name || 'File')}">${escapeHtml(truncateName(item.inputFiles[0]?.name || 'File', 22))}</span>
                    <span class="recent-meta">→ ${escapeHtml(item.outputFormat || '').toUpperCase()} • ${timeStr}</span>
                </div>
                <div class="recent-actions">
                    <button class="recent-action-btn rerun-btn" title="Re-run conversion"><i class="fa-solid fa-rotate-right"></i></button>
                    <button class="recent-action-btn open-file-btn" title="Open file"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
                    <button class="recent-action-btn open-folder-btn" title="Show in folder"><i class="fa-regular fa-folder-open"></i></button>
                </div>
                <i class="fa-regular fa-circle-check success-icon pulse-anim"></i>
            `;
            
            if (item.outputPath && window.app) {
                div.querySelector('.rerun-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // Check if files exist
                    const validFiles = [];
                    for (const f of item.inputFiles) {
                        const exists = await window.app.pathExists({ path: f.path });
                        if (exists) validFiles.push({ name: f.name, path: f.path, size: f.size });
                    }

                    if (validFiles.length === 0) {
                        showToast('Original files not found on disk.', 'warning');
                        return;
                    }

                    // Switch to converter and add to queue
                    window.switchWorkspace('converter');
                    window.addFilesToQueue(validFiles);
                    
                    // Apply settings with a small delay to let DOM settle
                    setTimeout(() => {
                        const type = item.conversionType || window.detectTypeFromFileName(validFiles[0]);
                        if (type) {
                            const newScope = { kind: 'group', type };
                            if (typeof window.setSelectedScope === 'function') {
                                window.setSelectedScope(newScope);
                            } else {
                                state.selectedScope = newScope;
                            }
                            const group = window.ensureGroupSettings(type);
                            group.format = item.outputFormat;
                            group.quality = item.quality;
                            group.outputFolder = getFolderFromPath(item.outputPath);
                            window.syncSidebarFromScope();
                        }
                        showToast('Job restored to queue.', 'success');
                    }, 50);
                });
                div.querySelector('.open-file-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.app.openPath(item.outputPath);
                });
                div.querySelector('.open-folder-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.app.openFolder(getFolderFromPath(item.outputPath));
                });
            }
            recentList.appendChild(div);
        });
    } catch (err) {
        console.error('[renderer] Failed to load history:', err);
        recentList.innerHTML = '<p class="no-recents">Failed to load history</p>';
    }
}

export function initHistory() {
    const clearRecentBtn = document.getElementById('clear-recent-btn');
    clearRecentBtn?.addEventListener('click', async () => {
        try {
            const success = await window.app.clearHistory();
            if (success) {
                loadRecentFiles();
                showToast('History cleared.', 'info');
            }
        } catch (err) {
            console.error('[renderer] Failed to clear history:', err);
            showToast('Failed to clear history.', 'error');
        }
    });

    if (window.app?.onHistoryUpdated) {
        window.app.onHistoryUpdated(() => {
            loadRecentFiles();
        });
    }
}
