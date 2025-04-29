const fetchTitleFromAbsPage = async (url) => {
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

const getUrlAndName = async (tab) => {
    const url = String(tab.url);
    const patternAbst = /https:\/\/arxiv.org\/abs\/\S+/;
    const patternPdf = /https:\/\/arxiv.org\/pdf\/\S+/;

    let filePdfUrl, absUrl, title;

    if (patternAbst.test(url)) {
        const [prefix, fileId] = url.split("abs");
        filePdfUrl = `${prefix}pdf${fileId}.pdf`;
        absUrl = url; // Store abs url to fetch title
        title = await fetchTitleFromAbsPage(absUrl);
    } else if (patternPdf.test(url)) {
        filePdfUrl = url;
        const paperId = url.split('/').pop().replace(".pdf", "");
        absUrl = `https://arxiv.org/abs/${paperId}`;
        title = await fetchTitleFromAbsPage(absUrl);
    } else {
        console.log("This extension is valid only in arXiv abstract or pdf pages!!");
        return null;
    }

    if (title) {
        // Ensure title exists and append .pdf
        const saveFilename = `${title || 'arxiv_paper'}.pdf`; // Use default if title fetch failed
        return [filePdfUrl, saveFilename];
    } else {
         console.error("Failed to determine filename.");
        // Attempt to create a fallback name based on URL if title fails
        const fallbackId = url.split('/').pop().replace(".pdf", "").replace("abs/", "");
        const fallbackFilename = `arxiv_${fallbackId || 'unknown'}.pdf`;
        console.log(`Using fallback filename: ${fallbackFilename}`);
        return [filePdfUrl, fallbackFilename];
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


chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
             console.error("Error getting current tab:", chrome.runtime.lastError || "No active tab found.");
             showNotification('FAILURE', 'Could not get current tab information.', 'failure');
             return;
         }
        let tab = tabs[0];
        console.log('Selected tab URL:', tab.url);

        // Retrieve the folder *path* from storage first
        chrome.storage.sync.get(['driveFolderPath'], async (storageResult) => { // Changed key
            if (chrome.runtime.lastError) {
                console.error("Error retrieving folder path from storage:", chrome.runtime.lastError);
                showNotification('FAILURE', 'Could not read extension settings.', 'failure');
                return;
            }

            // Use saved path or default to 'arXiv'
            const folderPath = storageResult.driveFolderPath || 'arXiv';
            console.log(`Using Google Drive path: '${folderPath}'`);

            try {
                const urlResult = await getUrlAndName(tab);
                if (!urlResult) {
                    showNotification('INFO', 'Current page is not a valid arXiv abstract or PDF page.', 'info');
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
                     displayError = "Could not download the PDF from arXiv.";
                 } else if (displayError.includes("Failed to find or create folder")) {
                     displayError = `Error creating Drive folder structure: ${error.message}`;
                 } else if (displayError.includes("Google Drive API error uploading file")) {
                     displayError = `Drive upload failed: ${error.message}`;
                 }
                 showNotification('FAILURE', `Error uploading to '${folderPath}': ${displayError}`, 'failure');
            }
        });
    });
});

console.log('Background script loaded');