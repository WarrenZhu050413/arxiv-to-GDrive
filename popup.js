// papers-to-GDrive/popup.js
import { forceClosePopup, handleCommandShiftP } from './utils/common/window_utils.js';
import { stateManager } from './utils/common/storage_utils.js';
import { showStatus, updateUI } from './utils/common/notification_utils.js';
import { errorHandler } from './utils/common/error_utils.js';

const folderPathInput = document.getElementById('folderPathInput');
const savePathButton = document.getElementById('savePathButton');
const statusDiv = document.getElementById('status');
const pastPathsDatalist = document.getElementById('pastPaths');
const MAX_HISTORY = 100; // Max number of paths to remember
const DEFAULT_PATH = 'papers';
const customTitleSection = document.getElementById('customTitleSection');
const settingsSection = document.getElementById('settingsSection');
const customTitleInput = document.getElementById('customTitleInput');
const saveCustomTitleButton = document.getElementById('saveCustomTitleButton');
const customTitleStatus = document.getElementById('customTitleStatus');

// --- Function to handle saving the path ---
async function savePath() {
    const rawInputPath = folderPathInput.value.trim();
    // Use default path if input is empty after trimming, otherwise clean the path
    const currentPathToSave = rawInputPath === '' ? DEFAULT_PATH : rawInputPath.replace(/^\/+|\/+$/g, '');

    // Reset input visually if it was initially empty
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
        showStatus(statusDiv, customTitleStatus, message, color, 1500, false);
        
        // Update UI
        updateUI(folderPathInput, pastPathsDatalist, currentPathToSave, newHistory, DEFAULT_PATH);
        
        // Close popup after success
        setTimeout(() => window.close(), 500);
    } catch (error) {
        console.error("Error saving settings:", error);
        showStatus(statusDiv, customTitleStatus, 'Error saving settings.', 'red', 0, false);
    }
}

// --- Function to handle saving with custom title ---
async function saveCustomTitle(customTitleData) {
    const customTitle = customTitleInput.value.trim();
    if (!customTitle) {
        showStatus(statusDiv, customTitleStatus, 'Please enter a title.', 'red', 3000, true);
        customTitleInput.focus();
        return;
    }

    // Construct the filename using the custom title and the stored identifier
    const identifier = customTitleData.identifier || 'unknown';
    const safeFallbackId = String(identifier).replace(/[\\/?%*:|"<>]/g, '_');
    const identifierToUse = identifier || safeFallbackId;
    const safeIdentifierToAppend = String(identifierToUse).replace(/[\\/?%*:|"<>]/g, '_');
    const safeTitle = customTitle.replace(/[\\/?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
    const saveFilename = `${safeTitle} [${safeIdentifierToAppend}].pdf`;

    console.log(`Sending message to background: action='uploadCustomTitle', data={ pdfUrl: ${customTitleData.pdfUrl}, saveFilename: ${saveFilename} }`);

    // Show saving status
    showStatus(statusDiv, customTitleStatus, 'Saving...', 'blue', 0, true);
    
    try {
        // Send message to background script to perform the upload
        await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'uploadCustomTitle',
                data: {
                    pdfUrl: customTitleData.pdfUrl,
                    saveFilename: saveFilename
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        // Clear the custom title data
        await stateManager.setCustomTitleMode(false);
        
        // Show success before closing
        showStatus(statusDiv, customTitleStatus, 'Upload initiated!', 'green', 1500, true);
        
        // Close popup after sending message
        setTimeout(() => window.close(), 1000);
    } catch (error) {
        console.error("Error sending message to background:", error);
        showStatus(statusDiv, customTitleStatus, `Error: ${error.message || 'Unknown error'}`, 'red', 0, true);
    }
}

// --- Load saved path and history ---
async function loadSettings() {
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

// --- Initialize popup: Check for custom title flow or load settings ---
document.addEventListener('DOMContentLoaded', async () => {
    // Add keyboard shortcut handler for Command+Shift+P
    document.addEventListener('keydown', handleCommandShiftP);
    
    try {
        // Check if we are in the custom title flow
        const customTitleData = await stateManager.getCustomTitleData();
        
        if (customTitleData && customTitleData.isCustomTitleFlow) {
            console.log("Popup opened in custom title flow.", customTitleData);
            // Show custom title section, hide settings section
            settingsSection.style.display = 'none';
            customTitleSection.style.display = 'block';
            customTitleInput.value = customTitleData.originalTitle || ''; // Populate with original title
            customTitleInput.focus();
            customTitleInput.select(); // Select the text for easy editing

            // Add listener for the custom save button
            saveCustomTitleButton.addEventListener('click', () => saveCustomTitle(customTitleData));
            // Add listener for Enter key in custom title input
            customTitleInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveCustomTitle(customTitleData);
                }
            });
        } else {
            console.log("Popup opened in standard settings mode.");
            // Show settings section, hide custom title section
            customTitleSection.style.display = 'none';
            settingsSection.style.display = 'block';
            // Load standard settings
            await loadSettings();
            
            // Add save path listeners
            savePathButton.addEventListener('click', savePath);
            folderPathInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevent potential form submission
                    savePath();
                }
            });
        }
    } catch (error) {
        console.error("Error initializing popup:", error);
        showStatus(statusDiv, customTitleStatus, `Error initializing: ${error.message}`, 'red', 0, false);
    }
});