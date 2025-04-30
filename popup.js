// papers-to-GDrive/popup.js

const folderPathInput = document.getElementById('folderPathInput');
const saveButton = document.getElementById('savePathButton');
const statusDiv = document.getElementById('status');
const pastPathsDatalist = document.getElementById('pastPaths');
const MAX_HISTORY = 10; // Max number of paths to remember
const DEFAULT_PATH = 'papers';

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
function showStatus(message, color = 'green', duration = 3000) {
    statusDiv.textContent = message;
    statusDiv.style.color = color;
    if (duration > 0) {
        setTimeout(() => { statusDiv.textContent = ''; }, duration);
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


// --- Load saved path and history when popup opens ---
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['driveFolderPath', 'driveFolderPathHistory'], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading settings:", chrome.runtime.lastError);
            showStatus('Error loading settings.', 'red', 0);
        } else {
            updateUI(result.driveFolderPath, result.driveFolderPathHistory);
            // Auto-focus the input field
            folderPathInput.focus();
            folderPathInput.select(); // Select existing text for easy replacement
        }
    });
});

// --- Save path on button click ---
saveButton.addEventListener('click', savePath);

// Save path on Enter key press in the input field
folderPathInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent potential form submission if wrapped in form
        savePath();
    }
});