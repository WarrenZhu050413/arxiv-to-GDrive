// popup_handlers.js - Handles popup UI interactions and state management
import { showStatus } from '../common/notification_utils.js';
import { stateManager } from '../common/storage_utils.js';
import { errorHandler } from '../common/error_utils.js';
import { savePath, loadSettings } from '../common/path_utils.js';
import { showNotification } from '../common/notification_utils.js';
import { 
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
                    saveFilename: `${customTitle}.pdf`,
                    type: 'paper'
                };
                
                console.log('Creating custom title data from active tab:', dataToSend);
                showStatus(statusDiv, customTitleStatus, 'Saving with fallback data...', 'blue', 0, true);
                await sendCustomTitleRequest(dataToSend, saveCustomTitleButton, customTitleInput, statusDiv, customTitleStatus);
                return;
            }
            
            showStatus(statusDiv, customTitleStatus, 'Error: No custom title data found.', 'red', 0, true);
            return;
        }

        // Check what type of content we're dealing with
        const isHtml = customTitleData.type === 'html';
        const fileExtension = isHtml ? '.html' : '.pdf';
        
        // Construct the data to send based on content type
        let dataToSend;
        
        if (isHtml) {
            // For HTML webpage content
            dataToSend = {
                customTitle: customTitle,
                saveFilename: `${customTitle}${fileExtension}`,
                content: customTitleData.content,
                type: 'html'
            };
        } else {
            // For paper PDF content (original behavior)
            dataToSend = {
                customTitle: customTitle,
                pdfUrl: customTitleData.pdfUrl,
                saveFilename: `${customTitle} [${customTitleData.identifier || 'unknown'}]${fileExtension}`,
                type: 'paper',
                originalData: {
                    pdfUrl: customTitleData.pdfUrl,
                    identifier: customTitleData.identifier,
                    idType: customTitleData.idType
                }
            };
        }

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
    console.log("[Popup] Sending custom title request to background:", dataToSend);
    
    // Send the message - no need to await the full background process
    chrome.runtime.sendMessage(
        { action: 'uploadCustomTitle', data: dataToSend },
        (response) => {
            // This callback might run if the popup stays open briefly,
            // but we no longer rely on it for critical state management.
            if (chrome.runtime.lastError) {
                console.error("[Popup] Error sending message:", chrome.runtime.lastError.message);
                showStatus(statusDiv, customTitleStatus,
                    errorHandler.formatErrorMessage(chrome.runtime.lastError, 'Failed to send request'),
                    'red', 0, true);
                // Re-enable UI on send error
                saveCustomTitleButton.disabled = false;
                customTitleInput.disabled = false;
                customTitleInput.focus();
                // Keep popup open on immediate send error
            } else if (response) {
                console.log("[Popup] Response received from background:", response);
                if (response.success) {
                    showStatus(statusDiv, customTitleStatus, 'Saved successfully!', 'green', SUCCESS_NOTIFICATION_TIMEOUT, true);
                    // Close the popup after showing the success message
                    setTimeout(() => window.close(), SUCCESS_NOTIFICATION_TIMEOUT);
                } else {
                    console.error("[Popup] Error response from background:", response);
                    const errorMsg = response.message || 'Upload failed.';
                    showStatus(statusDiv, customTitleStatus, errorMsg, 'red', 0, true);
                    // Re-enable UI on error
                    saveCustomTitleButton.disabled = false;
                    customTitleInput.disabled = false;
                    customTitleInput.focus();
                }
            }
        }
    );
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
            
            // Display content type information
            const contentTypeDisplay = document.getElementById('contentTypeDisplay');
            if (contentTypeDisplay) {
                const isHtml = customTitleData.type === 'html';
                contentTypeDisplay.textContent = isHtml
                    ? 'Saving webpage as HTML file'
                    : 'Saving research paper as PDF file';
                contentTypeDisplay.style.color = isHtml ? '#0066cc' : '#006600';
            }
            
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