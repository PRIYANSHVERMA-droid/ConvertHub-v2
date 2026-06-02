const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getHistoryFile() {
    return path.join(app.getPath('userData'), 'history.json');
}

function getHistory() {
    try {
        if (fs.existsSync(getHistoryFile())) {
            const data = fs.readFileSync(getHistoryFile(), 'utf8');
            return JSON.parse(data || '[]');
        }
    } catch (error) {
        console.error('[historyStore] Error reading history file:', error);
    }
    return [];
}

function saveHistory(history) {
    try {
        const tempPath = `${getHistoryFile()}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(history, null, 2), 'utf8');
        fs.renameSync(tempPath, getHistoryFile());
        return true;
    } catch (error) {
        console.error('[historyStore] Error writing history file:', error);
        return false;
    }
}

function appendJob(record) {
    const history = getHistory();
    history.unshift(record);
    saveHistory(history.slice(0, 100));
}

function clearHistory() {
    try {
        if (fs.existsSync(getHistoryFile())) {
            fs.unlinkSync(getHistoryFile());
        }
        return true;
    } catch (error) {
        console.error('[historyStore] Error clearing history:', error);
        return false;
    }
}

module.exports = {
    getHistory,
    appendJob,
    clearHistory
};
