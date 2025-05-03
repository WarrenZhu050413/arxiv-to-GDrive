import { showStatus, updateUI } from './notification_utils.js';
import { stateManager } from './storage_utils.js';
import { 
    DEFAULT_PATH, 
    MAX_HISTORY, 
    POPUP_CLOSE_TIMEOUT,
    SUCCESS_NOTIFICATION_TIMEOUT 
} from './constants.js';

// --- Function to handle saving the path ---
export async function savePath(folderPathInput, statusDiv, customTitleStatus) {
    const rawInputPath = folderPathInput.value.trim();
    const currentPathToSave = rawInputPath === '' ? DEFAULT_PATH : rawInputPath.replace(/^\/+|\/+$/g, '');

    if (rawInputPath === '') {
        folderPathInput.value = DEFAULT_PATH;
    }

    try {
        // Save the path
        await stateManager.saveFolderPath(currentPathToSave);
        
        // Add to history
        const newHistory = await stateManager.addToPathHistory(currentPathToSave, MAX_HISTORY);
        
        // Show success message
        const message = rawInputPath === '' ? `Path reset to default "${DEFAULT_PATH}".` : 'Folder path saved!';
        const color = rawInputPath === '' ? 'orange' : 'green';
        showStatus(statusDiv, customTitleStatus, message, color, SUCCESS_NOTIFICATION_TIMEOUT, false);
        
        // Update UI
        updateUI(folderPathInput, document.getElementById('pastPaths'), currentPathToSave, newHistory, DEFAULT_PATH);
        
        // Close popup after success
        setTimeout(() => window.close(), POPUP_CLOSE_TIMEOUT);
    } catch (error) {
        console.error("Error saving settings:", error);
        showStatus(statusDiv, customTitleStatus, 'Error saving settings.', 'red', 0, false);
    }
}

// --- Load saved path and history ---
export async function loadSettings(folderPathInput, pastPathsDatalist, statusDiv, customTitleStatus) {
    try {
        const folderPath = await stateManager.getFolderPath();
        const history = await stateManager.getPathHistory();
        
        updateUI(folderPathInput, pastPathsDatalist, folderPath, history, DEFAULT_PATH);
        folderPathInput.focus();
        const textLength = folderPathInput.value.length;
        folderPathInput.setSelectionRange(textLength, textLength);
    } catch (error) {
        console.error("Error loading settings:", error);
        showStatus(statusDiv, customTitleStatus, 'Error loading settings.', 'red', 0, false);
    }
} 