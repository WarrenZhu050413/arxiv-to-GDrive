// papers-to-GDrive/popup.js

const folderPathInput = document.getElementById('folderPathInput');
const saveButton = document.getElementById('savePathButton');
const statusDiv = document.getElementById('status');
const pastPathsDatalist = document.getElementById('pastPaths');
const MAX_HISTORY = 100; // Max number of paths to remember
const DEFAULT_PATH = 'papers';
const customTitleSection = document.getElementById('customTitleSection');
const settingsSection = document.getElementById('settingsSection');
const customTitleInput = document.getElementById('customTitleInput');
const saveCustomTitleButton = document.getElementById('saveCustomTitleButton');
const customTitleStatus = document.getElementById('customTitleStatus');

// --- Helper Function to Update UI Elements ---
function updateUI(currentPath, history = []) {
    // Set input field value or placeholder
    folderPathInput.value = currentPath || DEFAULT_PATH;
    if (!currentPath) {
        folderPathInput.placeholder = `Default: ${DEFAULT_PATH}`;
    }

    // Update Datalist
    pastPathsDatalist.innerHTML = ''; // Clear existing options
    history.forEach(path => {
        const option = document.createElement('option');
        option.value = path;
        pastPathsDatalist.appendChild(option);
    });
}

// --- Helper Function to Show Status Messages ---
function showStatus(message, color = 'green', duration = 3000, isCustom = false) {
    const targetDiv = isCustom ? customTitleStatus : statusDiv;
    targetDiv.textContent = message;
    targetDiv.style.color = color;
    if (duration > 0) {
        setTimeout(() => { targetDiv.textContent = ''; }, duration);
    }
}

// --- Function to handle saving the path ---
function savePath() {
    const rawInputPath = folderPathInput.value.trim();
    // Use default path if input is empty after trimming, otherwise clean the path
    const currentPathToSave = rawInputPath === '' ? DEFAULT_PATH : rawInputPath.replace(/^\/+|\/+$/g, '');

    // Reset input visually if it was initially empty
    if (rawInputPath === '') {
        folderPathInput.value = DEFAULT_PATH;
    }

    // Get existing history to update it
    chrome.storage.sync.get(['driveFolderPathHistory'], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving history:", chrome.runtime.lastError);
            showStatus('Error saving (could not get history).', 'red', 0); // Show error persistently
            return;
        }

        let history = result.driveFolderPathHistory || [];

        // Update history: remove existing, add to front, trim size
        history = history.filter(p => p !== currentPathToSave);
        history.unshift(currentPathToSave);
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }

        // Save both current path and updated history
        chrome.storage.sync.set({
            driveFolderPath: currentPathToSave,
            driveFolderPathHistory: history
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving settings:", chrome.runtime.lastError);
                showStatus('Error saving settings.', 'red', 0); // Show error persistently
            } else {
                console.log('Settings saved:', { path: currentPathToSave, history });
                // Provide appropriate feedback
                const message = rawInputPath === '' ? `Path reset to default "${DEFAULT_PATH}".` : 'Folder path saved!';
                const color = rawInputPath === '' ? 'orange' : 'green';
                showStatus(message, color, 1500); // Shorter duration before closing
                updateUI(currentPathToSave, history); // Update datalist in UI

                // Close the popup automatically after a short delay
                setTimeout(() => window.close(), 500);
            }
        });
    });
}

// --- Function to handle saving with custom title ---
async function saveCustomTitle(customTitleData) {
    const customTitle = customTitleInput.value.trim();
    if (!customTitle) {
        showStatus('Please enter a title.', 'red', 3000, true);
        customTitleInput.focus();
        return;
    }

    // Construct the filename using the custom title and the stored identifier
    // Re-implementing basic constructFilename logic here for simplicity
    const identifier = customTitleData.identifier || 'unknown';
    const idType = customTitleData.idType || 'unknown';
    const safeFallbackId = String(identifier).replace(/[\\/?%*:|"<>]/g, '_');
    const identifierToUse = identifier || safeFallbackId;
    const safeIdentifierToAppend = String(identifierToUse).replace(/[\\/?%*:|"<>]/g, '_');
    const safeTitle = customTitle.replace(/[\\/?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
    const saveFilename = `${safeTitle} [${safeIdentifierToAppend}].pdf`;

    console.log(`Sending message to background: action='uploadCustomTitle', data={ pdfUrl: ${customTitleData.pdfUrl}, saveFilename: ${saveFilename} }`);

    // Send message to background script to perform the upload
    chrome.runtime.sendMessage({
        action: 'uploadCustomTitle',
        data: {
            pdfUrl: customTitleData.pdfUrl,
            saveFilename: saveFilename
        }
    }, (response) => {
        // Optional: Handle response from background if needed
        if (chrome.runtime.lastError) {
            console.error("Error sending message to background:", chrome.runtime.lastError);
            showStatus('Error initiating save.', 'red', 0, true);
        } else {
             console.log("Message sent to background for custom upload.");
            // No explicit success message here; background script handles notifications.
        }
        // Clear the custom title data from storage regardless of send success/failure
        chrome.storage.local.remove('customTitleData', () => {
            if(chrome.runtime.lastError){
                 console.error("Error clearing custom title data:", chrome.runtime.lastError);
            }
            window.close(); // Close popup after attempting to send message and clear data
        });
    });
}

// --- Initialize popup: Check for custom title flow or load settings ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are in the custom title flow
    chrome.storage.local.get('customTitleData', (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error checking for custom title flow:", chrome.runtime.lastError);
             // Fallback to showing settings
             loadSettings();
            return;
        }

        const customTitleData = result.customTitleData;
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
            loadSettings();
        }
    });
});

// --- Load saved path and history (refactored into its own function) ---
function loadSettings() {
    chrome.storage.sync.get(['driveFolderPath', 'driveFolderPathHistory'], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading settings:", chrome.runtime.lastError);
            showStatus('Error loading settings.', 'red', 0);
        } else {
            updateUI(result.driveFolderPath, result.driveFolderPathHistory);
            // *** UPDATED: Auto-focus and move cursor to end ***
            folderPathInput.focus();
            // Set selection start and end position to the end of the text
            const textLength = folderPathInput.value.length;
            folderPathInput.setSelectionRange(textLength, textLength);
        }
    });
}

// --- Save path on Enter key press in the input field
folderPathInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent potential form submission if wrapped in form
        savePath();
    }
});

// Make sure the default save button listener is only active in settings mode
// (We moved the loading logic, so we need to ensure this listener is added correctly)
if (settingsSection.style.display !== 'none') {
     savePathButton.addEventListener('click', savePath);
}