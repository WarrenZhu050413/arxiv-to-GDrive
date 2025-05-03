// papers-to-GDrive/popup.js - Main popup script
import { handleCommandShiftP } from './utils/common/window_utils.js';
import { initializePopup } from './utils/popup/popup_handlers.js';
import { getHTMLUsageInstructions } from './utils/common/descriptions.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    const settingsSection = document.getElementById('settingsSection');
    const customTitleSection = document.getElementById('customTitleSection');
    const customTitleInput = document.getElementById('customTitleInput');
    const folderPathInput = document.getElementById('folderPathInput');
    const pastPathsDatalist = document.getElementById('pastPaths');
    const statusDiv = document.getElementById('status');
    const customTitleStatus = document.getElementById('customTitleStatus');
    const savePathButton = document.getElementById('savePathButton');
    const saveCustomTitleButton = document.getElementById('saveCustomTitleButton');
    
    // Update usage instructions with dynamic content from descriptions.js
    const instructionsContainer = document.getElementById('usageInstructions');
    if (instructionsContainer) {
        instructionsContainer.innerHTML = getHTMLUsageInstructions();
    }
    
    // Initialize the popup with all required elements
    await initializePopup(
        settingsSection,
        customTitleSection,
        customTitleInput,
        folderPathInput,
        pastPathsDatalist,
        statusDiv,
        customTitleStatus,
        savePathButton,
        saveCustomTitleButton
    );
});