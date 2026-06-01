const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const PRESETS_FILE = path.join(app.getPath('userData'), 'presets.json');

function getPresets() {
    try {
        if (fs.existsSync(PRESETS_FILE)) {
            const data = fs.readFileSync(PRESETS_FILE, 'utf8');
            return JSON.parse(data || '{}');
        }
    } catch (error) {
        console.error('[presetStore] Error reading presets file:', error);
    }
    return {};
}

function savePreset(type, preset) {
    try {
        const presets = getPresets();
        if (!presets[type]) {
            presets[type] = [];
        }
        
        presets[type] = presets[type].filter(p => p.id !== preset.id && p.label !== preset.label);
        presets[type].push(preset);

        const tempPath = `${PRESETS_FILE}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(presets, null, 2), 'utf8');
        fs.renameSync(tempPath, PRESETS_FILE);
        return true;
    } catch (error) {
        console.error('[presetStore] Error saving preset:', error);
        return false;
    }
}

function deletePreset(type, presetId) {
    try {
        const presets = getPresets();
        if (presets[type]) {
            presets[type] = presets[type].filter(p => p.id !== presetId);
            const tempPath = `${PRESETS_FILE}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(presets, null, 2), 'utf8');
            fs.renameSync(tempPath, PRESETS_FILE);
            return true;
        }
    } catch (error) {
        console.error('[presetStore] Error deleting preset:', error);
    }
    return false;
}

module.exports = {
    getPresets,
    savePreset,
    deletePreset
};
