// storage_utils.js - Utilities for managing storage and state

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
      const result = await chrome.storage.local.get(['customTitleData']);
      return result.customTitleData || null;
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
    const data = await this.getCustomTitleData();
    return !!(data && data.isCustomTitleFlow);
  },

  /**
   * Set custom title mode status
   * @param {boolean} isActive - Whether to activate or deactivate custom title mode
   * @param {Object} data - Additional data to store if activating custom title mode
   * @returns {Promise<boolean>} true if operation succeeded, false otherwise
   */
  async setCustomTitleMode(isActive, data = {}) {
    try {
      if (isActive) {
        await chrome.storage.local.set({
          customTitleData: {
            isCustomTitleFlow: true,
            ...data
          }
        });
      } else {
        await chrome.storage.local.remove('customTitleData');
      }
      return true;
    } catch (error) {
      console.error(`Error ${isActive ? 'setting' : 'removing'} custom title mode:`, error);
      return false;
    }
  },

  /**
   * Get folder path setting
   * @returns {Promise<string>} The folder path or default path
   */
  async getFolderPath() {
    try {
      const result = await chrome.storage.sync.get(['driveFolderPath']);
      return result.driveFolderPath || 'papers';
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
      const result = await chrome.storage.sync.get(['driveFolderPathHistory']);
      return result.driveFolderPathHistory || [];
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
    try {
      await chrome.storage.sync.set({ driveFolderPath: path });
      return true;
    } catch (error) {
      console.error("Error saving folder path:", error);
      return false;
    }
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
      
      await chrome.storage.sync.set({ driveFolderPathHistory: newHistory });
      return newHistory;
    } catch (error) {
      console.error("Error updating path history:", error);
      return [];
    }
  }
}; 