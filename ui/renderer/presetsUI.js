import { state, desktopBridge } from './state.js';
import { showToast } from './notifications.js';

export function typeUsesQuality(type) {
    return type === 'audio' || type === 'video' || type === 'image';
}

export async function loadCustomPresets() {
    try {
        state.customPresets = await desktopBridge.getPresets();
    } catch (e) {
        console.error('Failed to load custom presets:', e);
    }
}

export function getPresetsForType(type) {
    const standard = state.PRESET_CATALOG[type] || [];
    const custom = state.customPresets[type] || [];
    return [...standard, ...custom];
}

export function getDefaultPreset(type) {
    return getPresetsForType(type).find(p => p.isDefault) || getPresetsForType(type)[0];
}

export function getPresetById(type, presetId) {
    return getPresetsForType(type).find(p => p.id === presetId);
}

export function getMatchingPreset(type, format, quality) {
    return getPresetsForType(type).find(p => {
        if (p.format !== format) return false;
        if (typeUsesQuality(type) && p.quality !== quality) return false;
        return true;
    });
}

export function initPresets({ getSelectedType, getScopeSettings, syncSidebarFromScope }) {
    const savePresetBtn = document.getElementById('save-preset-btn');
    const confirmSavePresetBtn = document.getElementById('confirm-save-preset');
    const cancelSavePresetBtn = document.getElementById('cancel-save-preset');
    const deletePresetBtn = document.getElementById('delete-preset-btn');
    const presetSaveInputGroup = document.getElementById('preset-save-input-group');
    const newPresetNameInput = document.getElementById('new-preset-name');
    const presetSelect = document.getElementById('preset-select');

    savePresetBtn?.addEventListener('click', () => {
        presetSaveInputGroup?.classList.remove('hidden');
        newPresetNameInput?.focus();
    });

    cancelSavePresetBtn?.addEventListener('click', () => {
        presetSaveInputGroup?.classList.add('hidden');
        if (newPresetNameInput) newPresetNameInput.value = '';
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
            const success = await desktopBridge.savePreset(type, preset);
            if (success) {
                await loadCustomPresets();
                presetSaveInputGroup?.classList.add('hidden');
                if (newPresetNameInput) newPresetNameInput.value = '';
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
        if (!presetSelect) return;
        const presetId = presetSelect.value;
        const preset = getPresetById(type, presetId);
        
        if (!preset || !preset.isCustom) return;

        if (confirm(`Are you sure you want to delete the preset "${preset.label}"?`)) {
            try {
                const success = await desktopBridge.deletePreset(type, presetId);
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
}
