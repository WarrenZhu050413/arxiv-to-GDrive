// error_utils.js - Utilities for consistent error handling

import { showNotification } from './notification_utils.js';

/**
 * Error handler utility for consistent error handling
 */
export const errorHandler = {
  /**
   * Handle Chrome runtime errors
   * @param {string} operation - Description of the operation that failed
   * @param {Function} callback - Optional callback to execute if no error
   * @returns {boolean} - true if no error, false if there was an error
   */
  handleChromeError(operation, callback = null) {
    if (chrome.runtime.lastError) {
      console.error(`Error during ${operation}:`, chrome.runtime.lastError);
      showNotification(
        'FAILURE', 
        `Error: ${chrome.runtime.lastError.message || 'Unknown error'}`, 
        'failure'
      );
      return false;
    }
    
    if (callback) callback();
    return true;
  },

  /**
   * Format error messages for user display
   * @param {Error|string} error - The error or error message
   * @param {string} fallback - Fallback message if error is empty
   * @returns {string} User-friendly error message
   */
  formatErrorMessage(error, fallback = 'An unknown error occurred') {
    const message = error instanceof Error ? error.message : error;
    
    if (!message) return fallback;
    
    // Make specific error messages more user-friendly
    if (message.includes("Authentication failed")) {
      return "Authentication failed. Please try the command again.";
    } else if (message.includes("HTTP error fetching PDF")) {
      return "Could not download the paper pdf.";
    } else if (message.includes("Failed to find or create folder")) {
      return "Error creating Drive folder structure.";
    } else if (message.includes("Google Drive API error uploading file")) {
      return "Drive upload failed.";
    } else if (message.includes("Could not find an active browser window")) {
      return "Could not find an active browser window.";
    }
    
    return message;
  }
}; 