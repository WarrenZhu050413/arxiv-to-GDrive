// constants.js - Centralized location for all global constants

// Path Constants
export const DEFAULT_PATH = 'papers';
export const MAX_HISTORY = 100;

// Timeout Values
export const POPUP_CLOSE_TIMEOUT = 500;
export const SUCCESS_NOTIFICATION_TIMEOUT = 1500;
export const ERROR_NOTIFICATION_TIMEOUT = 3000;

// API Constants
export const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

// Storage Keys
export const STORAGE_KEYS = {
    FOLDER_PATH: 'folderPath',
    PATH_HISTORY: 'pathHistory',
    CUSTOM_TITLE_DATA: 'customTitleData',
    AUTH_TOKEN: 'authToken'
};

// Paper Types
export const PAPER_TYPES = {
    ARXIV: 'arxiv',
    ACM: 'acm',
    NSDI: 'nsdi'
}; 