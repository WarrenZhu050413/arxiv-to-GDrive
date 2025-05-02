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
function constructFilename(title, identifier, fallbackId, idType = 'unknown') {
    let saveFilename;
    // Sanitize the fallback ID immediately if it exists, otherwise use 'unknown'
    const safeFallbackId = fallbackId ? String(fallbackId).replace(/[\/?%*:|\"<>]/g, '_') : 'unknown';
    // Determine the identifier to use: parsed identifier if available, otherwise the sanitized fallback ID.
    const identifierToUse = identifier || safeFallbackId;
    // Sanitize the identifier that will be appended
    const safeIdentifierToAppend = String(identifierToUse).replace(/[\/?%*:|\"<>]/g, '_');

    // Sanitize the provided title for filename use
    const safeTitle = title ? title.replace(/[\/?%*:|\"<>]/g, '-').replace(/\s+/g, ' ').trim() : null;

    if (safeTitle) {
        saveFilename = `${safeTitle} [${safeIdentifierToAppend}].pdf`;
    } else {
        // Fallback: Use the sanitized identifier as the filename base
        console.warn(`Using fallback filename based on ${idType} ID: ${safeIdentifierToAppend}`);
        saveFilename = `${safeIdentifierToAppend}.pdf`;
    }
    return saveFilename;
}

// --- Helper Function for Usenix PDF Page ---
async function handleUsenixPdf(url, match) {
    const conferencePart = match[1]; // e.g., "osdi23"
    const authorPart = match[2]; // e.g., "lastname"
    const filePdfUrl = url;
    const presentationUrl = `https://www.usenix.org/conference/${conferencePart}/presentation/${authorPart}`;
    const rawTitle = await fetchHtmlPageTitle(presentationUrl);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null }
    const usenixIdentifier = `${conferencePart}_${authorPart}`; // Construct the identifier
    // Always return the structured data: [pdfUrl, title, identifier, type]
    return [filePdfUrl, parsedResult.title, usenixIdentifier, 'Usenix'];
}

// --- Helper Function for Usenix Presentation Page ---
async function handleUsenixPresentation(url, match) {
    const conferencePart = match[1]; // e.g., "osdi23"
    const authorPart = match[2]; // e.g., "lastname"
    const filePdfUrl = `https://www.usenix.org/system/files/${conferencePart}-${authorPart}.pdf`;
    const rawTitle = await fetchHtmlPageTitle(url); // Title from the presentation page itself
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null }
    const usenixIdentifier = `${conferencePart}_${authorPart}`; // Construct the identifier
     // Always return the structured data: [pdfUrl, title, identifier, type]
    return [filePdfUrl, parsedResult.title, usenixIdentifier, 'Usenix'];
}

// --- Helper Function for arXiv Abstract Page ---
async function handleArxivAbstract(url, match) {
    const paperId = match[1];
    const filePdfUrl = `https://arxiv.org/pdf/${paperId}.pdf`;
    const rawTitle = await fetchHtmlPageTitle(url);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier }
    // Return structured data: [pdfUrl, title, identifier, type]
    // Use parsedResult.identifier if found, otherwise paperId as fallback identifier
    return [filePdfUrl, parsedResult.title, parsedResult.identifier || paperId, 'arXiv'];
}

// --- Helper Function for ACM Abstract Page ---
async function handleAcmAbstract(url, match) {
    const doiPart = match[1];
    const filePdfUrl = `https://dl.acm.org/doi/pdf/${doiPart}`;
    const rawTitle = await fetchHtmlPageTitle(url);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null }
     // Return structured data: [pdfUrl, title, identifier, type]
     // Use doiPart as the identifier
    return [filePdfUrl, parsedResult.title, doiPart, 'DOI'];
}

// --- Helper Function for arXiv PDF Page ---
async function handleArxivPdf(url, match) {
    const paperIdWithExt = match[1];
    const paperId = paperIdWithExt.replace(".pdf", "");
    const filePdfUrl = url;
    const absUrl = `https://arxiv.org/abs/${paperId}`;
    const rawTitle = await fetchHtmlPageTitle(absUrl);
    const parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier } from abstract page
    // Return structured data: [pdfUrl, title, identifier, type]
    // Use parsedResult.identifier if found, otherwise paperId as fallback identifier
    return [filePdfUrl, parsedResult.title, parsedResult.identifier || paperId, 'arXiv'];
}

// --- Helper Function for ACM PDF Page ---
async function handleAcmPdf(url, match) {
    const doiPart = match[1];
    const filePdfUrl = url;
    let rawTitle = null;
    let parsedResult = { title: null, identifier: null }; // Default structure

    if (doiPart) {
        const landingPageUrl = `https://dl.acm.org/doi/${doiPart}`;
        try {
            rawTitle = await fetchHtmlPageTitle(landingPageUrl);
            parsedResult = parseTitleAndIdentifier(rawTitle); // { title, identifier: null } from abstract page
        } catch (error) {
            console.error("Error fetching title for ACM PDF, proceeding without title:", error);
             // Keep parsedResult as { title: null, identifier: null }
        }
    } else {
         console.error("Could not extract DOI part from ACM PDF URL:", url);
    }
    // Return structured data: [pdfUrl, title, identifier, type]
    // Use doiPart as the identifier, even if title fetching failed
    return [filePdfUrl, parsedResult.title, doiPart, 'DOI'];
}

// Supported websites: arXiv, ACM, Usenix
// Returns [filePdfUrl, title, identifier, idType] or null
const getUrlAndName = async (tab) => {
    const url = String(tab.url);
    // Patterns
    const patternArxivAbst = /https:\/\/arxiv.org\/abs\/(\S+)/;
    const patternArxivPdf = /https:\/\/arxiv.org\/pdf\/(\S+)/;
    const patternAcmAbst = /https:\/\/dl.acm.org\/doi\/(10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)/i;
    const patternAcmPdf = /https:\/\/dl.acm.org\/doi\/pdf\/(10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)/i;
    const patternUsenixPdf = /https:\/\/www.usenix.org\/system\/files\/([\w\d]+)-([\w\d]+)\.pdf/i; // Groups: 1=conf+year, 2=author
    const patternUsenixPres = /https:\/\/www.usenix.org\/conference\/([\w\d]+)\/presentation\/([\w\d]+)/i; // Groups: 1=conf+year, 2=author

    // Match objects
    const arxivAbsMatch = url.match(patternArxivAbst);
    const arxivPdfMatch = url.match(patternArxivPdf);
    const acmPdfMatch = url.match(patternAcmPdf);
    const acmAbsMatch = !acmPdfMatch ? url.match(patternAcmAbst) : null; // Check only if not PDF URL
    const usenixPdfMatch = url.match(patternUsenixPdf);
    const usenixPresMatch = url.match(patternUsenixPres);

    try {
        if (arxivAbsMatch) {
            return await handleArxivAbstract(url, arxivAbsMatch);
        } else if (acmAbsMatch) {
            return await handleAcmAbstract(url, acmAbsMatch);
        } else if (arxivPdfMatch) {
            return await handleArxivPdf(url, arxivPdfMatch);
        } else if (acmPdfMatch) {
            return await handleAcmPdf(url, acmPdfMatch);
        } else if (usenixPdfMatch) {
            return await handleUsenixPdf(url, usenixPdfMatch);
        } else if (usenixPresMatch) {
            return await handleUsenixPresentation(url, usenixPresMatch);
        } else {
            console.log("Current page is not a supported arXiv, ACM, or Usenix page.");
            return null; // No supported pattern matched
        }
    } catch (error) {
        console.error("Error in getUrlAndName processing:", error);
        return null; // Return null on unexpected errors in helpers
    }
};

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

// Generic upload function
async function uploadToDrive(fileInfo, folderPath, token = null) {
    console.log(`Initiating upload for: ${fileInfo.name} to path: ${folderPath}`);
    try {
        const googleDriveUploader = new GoogleDriveUploader();
        // If token is provided (e.g., from popup flow), use it. Otherwise, authenticate.
        // Note: For simplicity, we might always re-authenticate here unless token management is added.
        // Let's stick to re-authenticating within uploadFile for now.
        await googleDriveUploader.uploadFile(fileInfo, folderPath);
        showNotification('SUCCESS', `File '${fileInfo.name}' uploaded to path '${folderPath}' successfully.`, 'success');
    } catch (error) {
        console.error(`Error uploading '${fileInfo.name}' to '${folderPath}':`, error);
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
}

chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    if (command === "set_folder_path") {
        openExtensionPopup();
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            console.error("Error getting current tab:", chrome.runtime.lastError || "No active tab found.");
            showNotification('FAILURE', 'Could not get current tab information.', 'failure');
            return;
        }
        let tab = tabs[0];
        const now = Date.now();

        // Debounce check
        if (lastDownload.url === tab.url && now - lastDownload.time < download_interval && (command === "SavePaper" || command === "SavePaperWithCustomTitle")) {
             console.log('Skipping duplicate download request for URL:', tab.url);
             showNotification('INFO', 'Skipping duplicate download request for URL: ' + tab.url, 'info');
             return;
        }
         lastDownload = { url: tab.url, time: now }; // Update last download attempt info

        console.log('Selected tab URL:', tab.url);

        try {
            const urlResult = await getUrlAndName(tab);
            if (!urlResult) {
                showNotification('INFO', 'Current page is not a supported paper page.', 'info');
                return;
            }

            const [filepdf_url, title, identifier, idType] = urlResult;

            if (!filepdf_url || !identifier) { // Title can be null, but need URL and identifier
                 throw new Error("Could not determine PDF URL or identifier.");
            }

            if (command === "SavePaper") {
                // Construct filename automatically
                 const save_filename = constructFilename(title, identifier, identifier, idType); // Use identifier as fallback
                const fileInfo = { path: filepdf_url, name: save_filename };
                console.log('Attempting standard download:', fileInfo);
                showNotification('INFO', 'Saving: ' + fileInfo.name, 'info');

                // Retrieve folder path and upload
                chrome.storage.sync.get(['driveFolderPath'], async (storageResult) => {
                    if (chrome.runtime.lastError) {
                         console.error("Error retrieving folder path from storage:", chrome.runtime.lastError);
                         showNotification('FAILURE', 'Could not read extension settings.', 'failure');
                         return;
                    }
                    const folderPath = storageResult.driveFolderPath || 'papers';
                    console.log(`Using Google Drive path: '${folderPath}'`);
                    await uploadToDrive(fileInfo, folderPath); // Use the generic upload function
                });

            } else if (command === "SavePaperWithCustomTitle") {
                console.log("Initiating custom title flow...");
                // Store necessary info for the popup
                const customTitleData = {
                    isCustomTitleFlow: true,
                    pdfUrl: filepdf_url,
                    originalTitle: title, // Send the original title
                    identifier: identifier,
                    idType: idType
                };
                chrome.storage.local.set({ customTitleData: customTitleData }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving custom title data to local storage:", chrome.runtime.lastError);
                         showNotification('FAILURE', 'Failed to initiate custom title save.', 'failure');
                    } else {
                        console.log("Custom title data stored, opening popup.");
                        openExtensionPopup(); // Open the popup
                    }
                });
            }

        } catch (error) {
             console.error('Error processing command:', error);
             showNotification('FAILURE', `Error processing command: ${error.message || 'Unknown error'}`, 'failure');
        }
    });
});

// Listener for messages from the popup (e.g., to trigger upload with custom title)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'uploadCustomTitle') {
        console.log('Received upload request from popup with custom title:', message.data);
        const { pdfUrl, saveFilename } = message.data;

        if (!pdfUrl || !saveFilename) {
             console.error("Invalid data received for custom upload:", message.data);
             showNotification('FAILURE', 'Failed to save with custom title due to missing data.', 'failure');
             return; // Indicate async response is not needed or failure
        }

        const fileInfo = { path: pdfUrl, name: saveFilename };

        // Retrieve folder path and trigger upload
        chrome.storage.sync.get(['driveFolderPath'], async (storageResult) => {
            if (chrome.runtime.lastError) {
                 console.error("Error retrieving folder path from storage:", chrome.runtime.lastError);
                 showNotification('FAILURE', 'Could not read extension settings for custom save.', 'failure');
                 // Optionally sendResponse({success: false, error: ...})
                 return;
            }
            const folderPath = storageResult.driveFolderPath || 'papers';
            console.log(`Uploading custom title file to path: '${folderPath}'`);
            await uploadToDrive(fileInfo, folderPath); // Use the generic upload function
             // Optionally sendResponse({success: true}) after uploadToDrive completes if needed
        });

        // Return true to indicate you wish to send a response asynchronously
        // (although in this case, we handle notifications directly)
        return true;
    }
     // Handle other potential messages if needed
});

console.log('Background script loaded');