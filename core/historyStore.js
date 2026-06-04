const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getHistoryFile() {
    return path.join(app.getPath('userData'), 'history.json');
}

async function getHistory() {
    try {
        const filePath = getHistoryFile();
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
        } catch {
            return [];
        }
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('[historyStore] Error reading history file:', error);
        return [];
    }
}

async function saveHistory(history) {
    try {
        const filePath = getHistoryFile();
        const tempPath = `${filePath}.tmp`;
        await fs.promises.writeFile(tempPath, JSON.stringify(history, null, 2), 'utf8');
        await fs.promises.rename(tempPath, filePath);
        return true;
    } catch (error) {
        console.error('[historyStore] Error writing history file:', error);
        return false;
    }
}

async function appendJob(record) {
    const history = await getHistory();
    history.unshift(record);
    await saveHistory(history.slice(0, 100));
}

async function clearHistory() {
    try {
        const filePath = getHistoryFile();
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            await fs.promises.unlink(filePath);
        } catch {
            // file didn't exist, that's fine
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
