// window_utils.js - Utilities for managing popup windows and other UI elements

/**
 * Opens the extension popup
 * This is an improved version that removes unnecessary checks and handles errors properly
 * @returns {Promise<boolean>} true if popup opened successfully, false otherwise
 */
export async function openExtensionPopup() {
  try {
    await chrome.action.openPopup();
    console.log("Popup open requested successfully");
    return true;
  } catch (error) {
    console.error("Error opening popup:", error);
    return false;
  }
}

/**
 * Force closes the popup using multiple methods to ensure it closes properly
 * @param {boolean} notifyBackground - Whether to notify background script about closing
 */
export function forceClosePopup(notifyBackground = true) {
  console.log('Force closing popup with multiple methods');
  try {
    // First, notify background script that we're closing so it can track this action
    if (notifyBackground) {
      chrome.runtime.sendMessage({ 
        action: 'forceClosePopup',
        source: 'popup_shortcut'
      });
    }
    
    // Method 1: Standard window.close()
    window.close();
    
    // Method 2: Force document unload
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    
    // Method 3: Self-destruct via reload
    setTimeout(() => {
      if (window) {
        try {
          window.location.reload();
        } catch (e) {
          console.error('Failed final close attempt:', e);
        }
      }
    }, 50);
  } catch (e) {
    console.error('Error force closing popup:', e);
  }
}

/**
 * Handle Command+Shift+P keyboard shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {boolean} true if the shortcut was handled, false otherwise
 */
export function handleCommandShiftP(event) {
  // Check for both command/ctrl + shift + P (case insensitive)
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && 
      (event.code === 'KeyP' || event.key === 'P' || event.key === 'p')) {
    console.log('Command+Shift+P detected, preventing default and force closing popup...');
    event.preventDefault();
    event.stopPropagation();
    forceClosePopup();
    return true;
  }
  return false;
}

/**
 * Function to close the popup from background script
 * This is used when we want the background script to close an open popup
 */
export async function closePopupFromBackground() {
  try {
    // 1. Set empty popup to force any open popup to close
    await chrome.action.setPopup({ popup: '' });
    // 2. Reset the popup back to default
    setTimeout(async () => {
      await chrome.action.setPopup({ popup: 'popup.html' });
    }, 100);
    return true;
  } catch (error) {
    console.error("Error closing popup from background:", error);
    return false;
  }
} 