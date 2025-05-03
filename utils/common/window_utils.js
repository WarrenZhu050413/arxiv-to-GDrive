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
 * Handle Command+Shift+P keyboard shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {boolean} true if the shortcut was handled, false otherwise
 */
export function handleCommandShiftP(event) {
  // Check for both command/ctrl + shift + P (case insensitive)
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && 
      (event.code === 'KeyP' || event.key === 'P' || event.key === 'p')) {
    
    // Log the event but don't take any action
    console.log('Command+Shift+P detected, no action taken');
    
    // Don't prevent default to allow browser to handle the shortcut
    return false;
  }
  return false;
} 