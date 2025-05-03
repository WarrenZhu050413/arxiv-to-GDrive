// storage_utils.js - Utilities for managing storage and state
import { errorHandler } from './error_utils.js';

/**
 * State manager for handling all storage operations
 */
export const stateManager = {
  /**
   * Get custom title mode status
   * @returns {Promise<Object|null>} The custom title data or null if not in custom title mode
   */
  async getCustomTitleData() {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(['customTitleData'], (result) => {
          if (!errorHandler.handleChromeError('retrieving custom title data', () => resolve(result.customTitleData || null))) {
            reject(chrome.runtime.lastError || new Error("Failed to retrieve custom title data"));
          }
        });
      });
    } catch (error) {
      console.error("Error retrieving custom title data:", error);
      return null;
    }
  },

  /**
   * Check if currently in custom title mode
   * @returns {Promise<boolean>} true if in custom title mode, false otherwise
   */
  async isInCustomTitleMode() {
    try {
      const data = await this.getCustomTitleData();
      return !!(data && data.isCustomTitleFlow);
    } catch (error) {
      console.error("Error checking custom title mode:", error);
      return false;
    }
  },

  /**
   * Set custom title mode status
   * @param {boolean} isActive - Whether to activate or deactivate custom title mode
   * @param {Object} data - Additional data to store if activating custom title mode
   * @returns {Promise<boolean>} true if operation succeeded, false otherwise
   */
  async setCustomTitleMode(isActive, data = {}) {
    return new Promise((resolve) => {
      try {
        if (isActive) {
          const customTitleData = {
            isCustomTitleFlow: true,
            timestamp: Date.now(),
            ...data
          };
          
          chrome.storage.local.set({ customTitleData }, () => {
            errorHandler.handleChromeError('setting custom title mode', () => {
              console.log("Custom title mode activated with data:", customTitleData);
              resolve(true);
            });
          });
        } else {
          chrome.storage.local.remove('customTitleData', () => {
            errorHandler.handleChromeError('removing custom title mode', () => {
              console.log("Custom title mode deactivated");
              resolve(true);
            });
          });
        }
      } catch (error) {
        console.error(`Error ${isActive ? 'setting' : 'removing'} custom title mode:`, error);
        resolve(false);
      }
    });
  },

  /**
   * Get folder path setting
   * @returns {Promise<string>} The folder path or default path
   */
  async getFolderPath() {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['driveFolderPath'], (result) => {
          if (!errorHandler.handleChromeError('retrieving folder path', () => resolve(result.driveFolderPath || 'papers'))) {
            reject(chrome.runtime.lastError || new Error("Failed to retrieve folder path"));
          }
        });
      });
    } catch (error) {
      console.error("Error retrieving folder path:", error);
      return 'papers';
    }
  },

  /**
   * Get path history
   * @returns {Promise<Array<string>>} The path history
   */
  async getPathHistory() {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['driveFolderPathHistory'], (result) => {
          if (!errorHandler.handleChromeError('retrieving path history', () => resolve(result.driveFolderPathHistory || []))) {
            reject(chrome.runtime.lastError || new Error("Failed to retrieve path history"));
          }
        });
      });
    } catch (error) {
      console.error("Error retrieving path history:", error);
      return [];
    }
  },

  /**
   * Save folder path setting
   * @param {string} path - The path to save
   * @returns {Promise<boolean>} true if operation succeeded, false otherwise
   */
  async saveFolderPath(path) {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.set({ driveFolderPath: path }, () => {
          errorHandler.handleChromeError('saving folder path', () => {
            console.log(`Folder path saved: ${path}`);
            resolve(true);
          });
        });
      } catch (error) {
        console.error("Error saving folder path:", error);
        resolve(false);
      }
    });
  },

  /**
   * Add path to history
   * @param {string} path - The path to add to history
   * @param {number} maxHistory - Maximum number of history items to keep
   * @returns {Promise<Array<string>>} The updated history
   */
  async addToPathHistory(path, maxHistory = 100) {
    try {
      const history = await this.getPathHistory();
      
      // Update history: remove existing, add to front, trim size
      const newHistory = [
        path,
        ...history.filter(p => p !== path)
      ].slice(0, maxHistory);
      
      return new Promise((resolve) => {
        chrome.storage.sync.set({ driveFolderPathHistory: newHistory }, () => {
          errorHandler.handleChromeError('updating path history', () => {
            console.log(`Path history updated with: ${path}`);
            resolve(newHistory);
          });
        });
      });
    } catch (error) {
      console.error("Error updating path history:", error);
      return [];
    }
  }
}; 