// notification_utils.js - Utilities for notifications and UI updates

/**
 * Show a notification using Chrome's notification API
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type: 'success', 'failure', 'info'
 */
export function showNotification(title, message, type = 'info') {
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'images/icon_128.png',
    title: title,
    message: message
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError.message);
    } else {
      console.log(`Notification ${type}: ${notificationId}`);
    }
  });
}

/**
 * Show a status message in the popup UI
 * @param {HTMLElement} statusDiv - The standard status div element
 * @param {HTMLElement} customTitleStatus - The custom title status div element
 * @param {string} message - The message to display
 * @param {string} color - The text color
 * @param {number} duration - Duration to show message (0 for persistent)
 * @param {boolean} isCustom - Whether to show in custom title status div
 */
export function showStatus(statusDiv, customTitleStatus, message, color = 'green', duration = 3000, isCustom = false) {
  const targetDiv = isCustom ? customTitleStatus : statusDiv;
  if (!targetDiv) return;
  
  targetDiv.textContent = message;
  targetDiv.style.color = color;
  
  if (duration > 0) {
    setTimeout(() => { 
      targetDiv.textContent = ''; 
    }, duration);
  }
}

/**
 * Update UI elements with current settings
 * @param {HTMLInputElement} folderPathInput - The folder path input element
 * @param {HTMLElement} pastPathsDatalist - The datalist for path history
 * @param {string} currentPath - The current folder path
 * @param {Array<string>} history - The path history
 * @param {string} defaultPath - The default path to use
 */
export function updateUI(folderPathInput, pastPathsDatalist, currentPath, history = [], defaultPath = 'papers') {
  if (!folderPathInput || !pastPathsDatalist) return;
  
  // Set input field value or placeholder
  folderPathInput.value = currentPath || defaultPath;
  if (!currentPath) {
    folderPathInput.placeholder = `Default: ${defaultPath}`;
  }

  // Update Datalist
  pastPathsDatalist.innerHTML = ''; // Clear existing options
  history.forEach(path => {
    const option = document.createElement('option');
    option.value = path;
    pastPathsDatalist.appendChild(option);
  });
} 