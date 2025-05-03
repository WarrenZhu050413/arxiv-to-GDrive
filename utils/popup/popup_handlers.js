// popup_handlers.js - Handles popup UI interactions and state management
import { showStatus } from '../common/notification_utils.js';
import { stateManager } from '../common/storage_utils.js';
import { errorHandler } from '../common/error_utils.js';
import { savePath, loadSettings } from '../common/path_utils.js';
import { showNotification } from '../common/notification_utils.js';
import { 
    CUSTOM_TITLE_TIMEOUT_VALUE,
    ERROR_NOTIFICATION_TIMEOUT,
    SUCCESS_NOTIFICATION_TIMEOUT
} from '../common/constants.js';

// --- Function to handle saving with custom title ---
export async function saveCustomTitle(customTitleInput, saveCustomTitleButton, statusDiv, customTitleStatus) {
    const customTitle = customTitleInput.value.trim();
    if (!customTitle) {
        showStatus(statusDiv, customTitleStatus, 'Please enter a title.', 'red', ERROR_NOTIFICATION_TIMEOUT, true);
        customTitleInput.focus();
        return;
    }

    try {
        // Get the custom title data
        const customTitleData = await stateManager.getCustomTitleData();
        
        if (!customTitleData) {
            console.error("No custom title data found");
            
            // Create a fallback data structure if custom title data is missing
            const activeTab = await new Promise((resolve, reject) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else if (!tabs || tabs.length === 0) {
                        reject(new Error("No active tab found"));
                    } else {
                        resolve(tabs[0]);
                    }
                });
            });
            
            // Try to get URL from active tab
            if (activeTab && activeTab.url) {
                const dataToSend = {
                    customTitle: customTitle,
                    pdfUrl: activeTab.url,
                    saveFilename: `${customTitle}.pdf`
                };
                
                console.log('Creating custom title data from active tab:', dataToSend);
                showStatus(statusDiv, customTitleStatus, 'Saving with fallback data...', 'blue', 0, true);
                await sendCustomTitleRequest(dataToSend, saveCustomTitleButton, customTitleInput, statusDiv, customTitleStatus);
                return;
            }
            
            showStatus(statusDiv, customTitleStatus, 'Error: No custom title data found.', 'red', 0, true);
            return;
        }

        const dataToSend = {
            customTitle: customTitle,
            pdfUrl: customTitleData.pdfUrl,
            saveFilename: `${customTitle} [${customTitleData.identifier || 'unknown'}].pdf`,
            originalData: {
                pdfUrl: customTitleData.pdfUrl,
                identifier: customTitleData.identifier,
                idType: customTitleData.idType
            }
        };

        console.log('Sending message to background:', dataToSend);
        await sendCustomTitleRequest(dataToSend, saveCustomTitleButton, customTitleInput, statusDiv, customTitleStatus);
        
    } catch (error) {
        console.error("Error in saveCustomTitle:", error);
        showStatus(statusDiv, customTitleStatus, 
            errorHandler.formatErrorMessage(error, 'Unknown error processing custom title'), 
            'red', 0, true);
        saveCustomTitleButton.disabled = false;
        customTitleInput.disabled = false;
    }
}

// Helper function to send custom title request to background
async function sendCustomTitleRequest(dataToSend, saveCustomTitleButton, customTitleInput, statusDiv, customTitleStatus) {
    showStatus(statusDiv, customTitleStatus, 'Saving...', 'blue', 0, true);
    showNotification('INFO', 'Saving with title: ' + dataToSend.customTitle, 'info');
    saveCustomTitleButton.disabled = true;
    customTitleInput.disabled = true;
    
    try {
        // Send message to background script
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: 'uploadCustomTitle', data: dataToSend }, 
                (response) => {
                    if (!errorHandler.handleChromeError('sending custom title to background', () => resolve(response))) {
                        reject(chrome.runtime.lastError || new Error("Unknown error sending message"));
                    }
                }
            );
        });

        // Clear custom title data
        await stateManager.setCustomTitleMode(false);

        // Re-enable UI
        saveCustomTitleButton.disabled = false;
        customTitleInput.disabled = false;

        if (response && response.success) {
            console.log("Received success response from background.");
            showStatus(statusDiv, customTitleStatus, 'Saved successfully!', 'green', SUCCESS_NOTIFICATION_TIMEOUT, true);
            
            // Show success message, then switch to default popup
            setTimeout(() => {
                // Find and get references to the needed elements
                const settingsSection = document.getElementById('settingsSection');
                const customTitleSection = document.getElementById('customTitleSection');
                const folderPathInput = document.getElementById('folderPath');
                const pastPathsDatalist = document.getElementById('pastPaths');
                
                // Switch to settings mode
                if (settingsSection && customTitleSection) {
                    customTitleSection.style.display = 'none';
                    settingsSection.style.display = 'block';
                    
                    // Load settings if we have the necessary elements
                    if (folderPathInput && pastPathsDatalist) {
                        loadSettings(folderPathInput, pastPathsDatalist, statusDiv, customTitleStatus);
                    }
                }
            }, CUSTOM_TITLE_TIMEOUT_VALUE);
        } else {
            console.error("Received failure response from background:", response);
            const errorMsg = (response && response.message) ? response.message : 'Upload failed.';
            showStatus(statusDiv, customTitleStatus, errorMsg, 'red', 0, true);
            customTitleInput.focus();
        }
    } catch (error) {
        console.error("Error receiving response from background:", error);
        showStatus(statusDiv, customTitleStatus, 
            errorHandler.formatErrorMessage(error, 'Unknown communication error'), 
            'red', 0, true);
        saveCustomTitleButton.disabled = false;
        customTitleInput.disabled = false;
    }
}

// --- Initialization function for popup ---
export async function initializePopup(
    settingsSection, 
    customTitleSection, 
    customTitleInput, 
    folderPathInput, 
    pastPathsDatalist, 
    statusDiv, 
    customTitleStatus,
    saveButton,
    saveCustomTitleButton
) {
    try {
        // Check if we're in custom title mode
        const customTitleData = await stateManager.getCustomTitleData();
        
        if (customTitleData && customTitleData.isCustomTitleFlow) {
            // Setup for Custom Title Mode
            console.log("Popup opened in custom title flow.", customTitleData);
            settingsSection.style.display = 'none';
            customTitleSection.style.display = 'block';
            customTitleInput.value = customTitleData.originalTitle || '';
            customTitleInput.focus();
            customTitleInput.select();
            
            // Attach custom title listeners
            saveCustomTitleButton.addEventListener('click', () => 
                saveCustomTitle(customTitleInput, saveCustomTitleButton, statusDiv, customTitleStatus));
            
            customTitleInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveCustomTitle(customTitleInput, saveCustomTitleButton, statusDiv, customTitleStatus);
                }
            });
        } else {
            // Setup for Settings Mode
            console.log("Popup opened in standard settings mode.");
            customTitleSection.style.display = 'none';
            settingsSection.style.display = 'block';
            
            // Load settings
            await loadSettings(folderPathInput, pastPathsDatalist, statusDiv, customTitleStatus);
            
            // Attach settings listeners
            saveButton.addEventListener('click', () => 
                savePath(folderPathInput, statusDiv, customTitleStatus));
            
            folderPathInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    savePath(folderPathInput, statusDiv, customTitleStatus);
                }
            });
        }
    } catch (error) {
        console.error("Error initializing popup:", error);
        showStatus(statusDiv, customTitleStatus, 
            errorHandler.formatErrorMessage(error, 'Error initializing popup'), 
            'red', 0, true);
        settingsSection.style.display = 'block';
        customTitleSection.style.display = 'none';
        await loadSettings(folderPathInput, pastPathsDatalist, statusDiv, customTitleStatus);
    }
} 