async function openExtensionPopup() {
    try {
      // Get the current window
      const [currentWindow] = await chrome.windows.getLastFocused();
      if (currentWindow) {
        await chrome.action.openPopup();
        console.log("Popup open requested.");
      } else {
        console.error("Could not get the last focused window.");
      }
    } catch (error) {
      console.error("Error opening popup:", error);
    }
  }

const fetchHtmlPageTitle = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        if (!titleMatch || titleMatch.length < 2) throw new Error('Title not found in abs page');

        // Basic cleaning of title for filename safety
        const rawTitle = titleMatch[1].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
        const safeTitle = rawTitle.replace(/[\/\\?%*:|"<>]/g, '-'); // Replace invalid filename chars
        return safeTitle;
    } catch (error) {
        console.error('Error fetching title from abs page:', error);
        return null;
    }
};

// Parses a raw title string to separate known identifiers (e.g., arXiv)
function parseTitleAndIdentifier(rawTitleString) {
    if (!rawTitleString) {
        return { title: null, identifier: null };
    }
    console.log("Raw title input for parsing:", rawTitleString);

    let title = rawTitleString;
    let identifier = null;

    const arxivIdPattern = /^\[([^\]]+)\]\s*/;
    const arxivMatch = title.match(arxivIdPattern);
    if (arxivMatch) {
        identifier = arxivMatch[1]; // Capture the ID
        title = title.substring(arxivMatch[0].length).trim(); // Remove ID from title
        console.log(`Parsed arXiv identifier: ${identifier}`);
    }

    // Sanitize the remaining title part for filename use
    const safeTitle = title.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();

    // Return null title if it became empty after removing ID and sanitizing
    return {
        title: safeTitle || null,
        identifier: identifier // Return extracted identifier (null if none found)
    };
}

// Constructs filename using parsed title/identifier and a fallback ID
function constructFilename(parsedResult, fallbackId, idType = 'unknown') {
    let saveFilename;
    // Sanitize the fallback ID immediately
    const safeFallbackId = fallbackId ? String(fallbackId).replace(/[\/\\?%*:|"<>]/g, '_') : 'unknown';

    if (parsedResult && parsedResult.title) {
        // Use parsed title. Append identifier: Use parsed identifier if available (arXiv),
        // otherwise use the sanitized fallback ID (DOI for ACM, paperId for arXiv).
        const identifierToAppend = parsedResult.identifier || safeFallbackId;
        // Sanitize the identifier that will be appended
        const safeIdentifierToAppend = identifierToAppend.replace(/[\/\\?%*:|"<>]/g, '_');
        saveFilename = `${parsedResult.title} [${safeIdentifierToAppend}].pdf`;
    } else {
        // Fallback: Use the sanitized fallback ID as the filename base
        console.warn(`Using fallback filename based on ${idType} ID: ${safeFallbackId}`);
        saveFilename = `${safeFallbackId}.pdf`;
    }
    return saveFilename;
}

// --- Helper Function for arXiv Abstract Page ---
async function handleArxivAbstract(url, match) {
    const paperId = match[1];
    const filePdfUrl = `https://arxiv.org/pdf/${paperId}.pdf`;
    const rawTitle = await fetchHtmlPageTitle(url);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier }
    const saveFilename = constructFilename(parsedResult, paperId, 'arXiv');
    return [filePdfUrl, saveFilename];
}

// --- Helper Function for ACM Abstract Page ---
async function handleAcmAbstract(url, match) {
    const doiPart = match[1];
    const filePdfUrl = `https://dl.acm.org/doi/pdf/${doiPart}`;
    const rawTitle = await fetchHtmlPageTitle(url);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null }
    const saveFilename = constructFilename(parsedResult, doiPart, 'DOI');
    return [filePdfUrl, saveFilename];
}

// --- Helper Function for arXiv PDF Page ---
async function handleArxivPdf(url, match) {
    const paperIdWithExt = match[1];
    const paperId = paperIdWithExt.replace(".pdf", "");
    const filePdfUrl = url;
    const absUrl = `https://arxiv.org/abs/${paperId}`;
    const rawTitle = await fetchHtmlPageTitle(absUrl);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier } from abstract page
    const saveFilename = constructFilename(parsedResult, paperId, 'arXiv');
    return [filePdfUrl, saveFilename];
}

// --- Helper Function for ACM PDF Page ---
async function handleAcmPdf(url, match) {
    const doiPart = match[1];
    const filePdfUrl = url;
    let rawTitle = null;
    let parsedResult = null;

    if (doiPart) {
        const landingPageUrl = `https://dl.acm.org/doi/${doiPart}`;
        rawTitle = await fetchHtmlPageTitle(landingPageUrl);
        parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null } from abstract page
    } else {
         console.error("Could not extract DOI part from ACM PDF URL:", url);
         parsedResult = { title: null, identifier: null }; // Ensure parsedResult is not null
    }
    // Pass doiPart as fallback ID, even if title fetching failed
    const saveFilename = constructFilename(parsedResult, doiPart, 'DOI');
    return [filePdfUrl, saveFilename];
}

// Supported websites: arXiv, ACM
const getUrlAndName = async (tab) => {
    const url = String(tab.url);
    // Patterns
    const patternArxivAbst = /https:\/\/arxiv.org\/abs\/(\S+)/;
    const patternArxivPdf = /https:\/\/arxiv.org\/pdf\/(\S+)/;
    const patternAcmAbst = /https:\/\/dl.acm.org\/doi\/(10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)/i;
    const patternAcmPdf = /https:\/\/dl.acm.org\/doi\/pdf\/(10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)/i;

    // Match objects
    const arxivAbsMatch = url.match(patternArxivAbst);
    const arxivPdfMatch = url.match(patternArxivPdf);
    const acmPdfMatch = url.match(patternAcmPdf);
    const acmAbsMatch = !acmPdfMatch ? url.match(patternAcmAbst) : null; // Check only if not PDF URL

    try {
        if (arxivAbsMatch) {
            return await handleArxivAbstract(url, arxivAbsMatch);
        } else if (acmAbsMatch) {
            return await handleAcmAbstract(url, acmAbsMatch);
        } else if (arxivPdfMatch) {
            return await handleArxivPdf(url, arxivPdfMatch);
        } else if (acmPdfMatch) {
            return await handleAcmPdf(url, acmPdfMatch);
        } else {
            console.log("Current page is not a supported arXiv or ACM page.");
            return null; // No supported pattern matched
        }
    } catch (error) {
        console.error("Error in getUrlAndName processing:", error);
        return null; // Return null on unexpected errors in helpers
    }
};


// createRequestObj is no longer used directly in the command listener

const showNotification = (title, message, type) => {
    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: 'images/icon_128.png',
        title: title,
        message: message
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        } else {
            console.log(`Notification ${type}: ${notificationId}`);
        }
    });
};

class GoogleDriveUploader {
    constructor() {
        this.apiUrl = 'https://www.googleapis.com/drive/v3/files';
        this.uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    }

    async uploadFile(file, folderPath) {
        console.log(`Uploading file: ${file.name} to path: ${folderPath}`);

        try {
            const token = await this.authenticateUser();
            if (!token) {
                console.error('Failed to authenticate user');
                throw new Error('Failed to authenticate user');
            }

            const blob = await this.fetchFileBlob(file.path);

            // Get the final parent folder ID using the path 
            const parentFolderId = await this.findOrCreateFolderHierarchy(folderPath, token);
            console.log(`Final parent folder ID: ${parentFolderId} for path: ${folderPath}`);

            const result = await this.putOnDrive({
                blob: blob,
                filename: file.name,
                mimetype: blob.type,
                parent: parentFolderId,
                token: token
            });

            console.log('File uploaded successfully:', result);
            return result;
        } catch (error) {
            console.error(`Error uploading file to path '${folderPath}':`, error);
            throw error;
        }
    }

    async authenticateUser() {
        console.log('Authenticating user...');
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 'interactive': true }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(new Error(`Authentication failed: ${chrome.runtime.lastError.message}`));
                } else {
                    console.log('Authenticated successfully.');
                    resolve(token);
                }
            });
        });
    }

    async fetchFileBlob(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error fetching PDF! status: ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('Error fetching file blob:', error);
            throw error;
        }
    }

    async findOrCreateFolderHierarchy(folderPath, token) {
        const pathComponents = folderPath.split('/').filter(Boolean);
        let parentId = 'root'; 

        console.log(`Resolving path components: ${pathComponents.join('/')}`);

        for (const component of pathComponents) {
            console.log(`Searching for folder '${component}' within parent '${parentId}'...`);
            const query = encodeURIComponent(`name='${component}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`);
            const folderSearchUrl = `${this.apiUrl}?q=${query}&fields=files(id)`; // Only request ID

            try {
                const searchResponse = await fetch(folderSearchUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!searchResponse.ok) {
                    const errorBody = await searchResponse.text();
                    throw new Error(`Google Drive API error searching folder '${component}' (Status: ${searchResponse.status}): ${errorBody}`);
                }

                const searchResult = await searchResponse.json();

                if (searchResult.files && searchResult.files.length > 0) {
                    parentId = searchResult.files[0].id;
                    console.log(`Folder '${component}' found with ID: ${parentId}`);
                } else {
                    console.log(`Folder '${component}' not found. Creating within parent '${parentId}'...`);
                    const createResponse = await fetch(this.apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: component,
                            parents: [parentId],
                            mimeType: 'application/vnd.google-apps.folder'
                        })
                    });

                    if (!createResponse.ok) {
                       const errorBody = await createResponse.text();
                       throw new Error(`Google Drive API error creating folder '${component}' (Status: ${createResponse.status}): ${errorBody}`);
                    }

                    const createResult = await createResponse.json();
                    parentId = createResult.id;
                    console.log(`Folder '${component}' created with ID: ${parentId}`);
                }
            } catch (error) {
                console.error(`Error processing folder component '${component}' in path '${folderPath}':`, error);
                throw new Error(`Failed to find or create folder '${component}': ${error.message}`);
            }
        }
        return parentId;
    }


    async putOnDrive(file) {
        const metadata = {
            name: file.filename,
            parents: [file.parent]
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file.blob);

        console.log(`Uploading '${file.filename}' to parent folder ID: ${file.parent}`);

        try {
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${file.token}`
                },
                body: formData
            });

            if (!response.ok) {
                 const errorBody = await response.text();
                throw new Error(`Google Drive API error uploading file (Status: ${response.status}): ${errorBody}`);
            }
            const result = await response.json();
            console.log('File upload API result:', result);
            return result;
        } catch (error) {
            console.error('Error in putOnDrive:', error);
            throw error; // Re-throw to be handled by uploadFile/command listener
        }
    }
}


let lastDownload = { url: '', time: 0 };
let download_interval = 1000;

chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    if (command === "_execute_action") {
        openExtensionPopup();
        return;
    }

    if (command === "SavePaper") {

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
                console.error("Error getting current tab:", chrome.runtime.lastError || "No active tab found.");
                showNotification('FAILURE', 'Could not get current tab information.', 'failure');
                return;
            }
            let tab = tabs[0];
            const now = Date.now();
            if (lastDownload.url === tab.url && now - lastDownload.time < download_interval) {
                console.log('Skipping duplicate download request for URL:', tab.url);
                showNotification('INFO', 'Please wait before downloading the same paper again.', 'info');
                return;
            }
            lastDownload = { url: tab.url, time: now };
            console.log('Selected tab URL:', tab.url);

            // Retrieve the folder *path* from storage first
            chrome.storage.sync.get(['driveFolderPath'], async (storageResult) => { // Changed key
                if (chrome.runtime.lastError) {
                    console.error("Error retrieving folder path from storage:", chrome.runtime.lastError);
                    showNotification('FAILURE', 'Could not read extension settings.', 'failure');
                    return;
                }

                // Use saved path or default to 'papers'
                const folderPath = storageResult.driveFolderPath || 'papers';
                console.log(`Using Google Drive path: '${folderPath}'`);

                try {
                    const urlResult = await getUrlAndName(tab);
                    if (!urlResult) {
                        showNotification('INFO', 'Current page is not a supported paper page.', 'info');
                        return;
                    }

                    const [filepdf_url, save_filename] = urlResult;
                    // Basic check for valid URL and filename
                    if (!filepdf_url || !save_filename) {
                        throw new Error("Could not determine PDF URL or filename.");
                    }

                    const fileInfo = { path: filepdf_url, name: save_filename };
                    console.log('Attempting to download:', fileInfo);

                    const googleDriveUploader = new GoogleDriveUploader();
                    // Pass the retrieved folderPath to uploadFile
                    await googleDriveUploader.uploadFile(fileInfo, folderPath);

                    showNotification('SUCCESS', `File '${save_filename}' uploaded to path '${folderPath}' successfully.`, 'success');

                } catch (error) {
                    console.error('Error processing command:', error);
                    let displayError = error.message || 'An unknown error occurred during upload.';
                    if (displayError.includes("Authentication failed")) {
                        displayError = "Authentication failed. Please try the command again.";
                    } else if (displayError.includes("HTTP error fetching PDF")) {
                        displayError = "Could not download the paper pdf.";
                    } else if (displayError.includes("Failed to find or create folder")) {
                        displayError = `Error creating Drive folder structure: ${error.message}`;
                    } else if (displayError.includes("Google Drive API error uploading file")) {
                        displayError = `Drive upload failed: ${error.message}`;
                    }
                    showNotification('FAILURE', `Error uploading to '${folderPath}': ${displayError}`, 'failure');
                }
            });
        });
    }
});

console.log('Background script loaded');