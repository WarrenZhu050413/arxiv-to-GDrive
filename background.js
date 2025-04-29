const fetchTitleFromAbsPage = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        if (!titleMatch || titleMatch.length < 2) throw new Error('Title not found in abs page');

        const title = titleMatch[1].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
        return title;
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
        title = await fetchTitleFromAbsPage(url);
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
        const saveFilename = `${title}.pdf`;
        return [filePdfUrl, saveFilename];
    } else {
        return null;
    }
};

const createRequestObj = (name, tab) => {
    const file = {
        name: name,
        path: tab.url
    };
    return {
        file: file,
        action: 'putFileOnGoogleDrive',
        tab: tab.id
    };
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

    // Specify the folder name to upload the file to
    async uploadFile(file, folderName) { 
        console.log(`Uploading file: ${file.name} to folder: ${folderName}`); // <<< Log folder name

        try {
            const token = await this.authenticateUser();
            if (!token) {
                console.error('Failed to authenticate user');
                throw new Error('Failed to authenticate user');
            }

            const blob = await this.fetchFileBlob(file.path);
            // Use the provided folderName instead of hardcoded 'arXiv'
            const parentFolder = await this.createFolder(folderName, token); // <<< Use folderName parameter
            console.log('Folder created or found:', parentFolder);

            const result = await this.putOnDrive({
                blob: blob,
                filename: file.name,
                mimetype: blob.type,
                parent: parentFolder.id,
                token: token
            });

            console.log('File uploaded successfully:', result);
            return result;
        } catch (error) {
            console.error(`Error uploading file to folder '${folderName}':`, error); // <<< Add folder context to error
            throw error; // Re-throw to be caught by the command listener
        }
    }

    async authenticateUser() {
        console.log('Authenticating user...');
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 'interactive': true }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log('Authenticated, token:', token);
                    resolve(token);
                }
            });
        });
    }

    async fetchFileBlob(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    }

    async createFolder(folderName, token) {
        console.log('Creating folder:', folderName);

        const query = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder'`);
        const folderSearchUrl = `${this.apiUrl}?q=${query}`;

        try {
            const searchResponse = await fetch(folderSearchUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!searchResponse.ok) {
                // ---> Error Differentiation Logic <---
                const status = searchResponse.status;
                let errorType = 'Unknown API Error';
                let errorMessage = `Google Drive API error! Status: ${status}`;

                if (status === 401) {
                    errorType = 'Authentication Error';
                    errorMessage = 'Authentication failed. Please try logging in again.';
                     // Consider triggering re-authentication if possible/needed
                } else if (status === 403) {
                    errorType = 'Authorization/Permission Error';
                    errorMessage = 'Permission denied. Ensure the extension has Drive access or check rate limits.';
                } else if (status === 400) {
                    errorType = 'Invalid Query Error';
                    errorMessage = 'The request sent to Google Drive was malformed.';
                } else if (status >= 500 && status < 600) {
                    errorType = 'Server Error';
                    errorMessage = 'Google Drive server issue. Please try again later.';
                }

                try {
                    const errorBody = await searchResponse.json(); // Or .text()
                    console.error('Drive API error body:', errorBody);
                    if (errorBody && errorBody.error && errorBody.error.message) {
                        errorMessage += ` Details: ${errorBody.error.message}`;
                    }
                } catch (parseError) {
                    console.error('Could not parse error response body:', parseError);
                }

                console.error(`${errorType}: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const searchResult = await searchResponse.json();
            console.log('Folder search result:', searchResult);

            if (searchResult.files.length > 0) {
                return { id: searchResult.files[0].id };
            }

            // If not found, create it
            console.log(`Folder '${folderName}' not found. Creating...`);
            const createResponse = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: folderName,
                    parents: ['root'],
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            if (!createResponse.ok) {
                throw new Error(`HTTP error! status: ${createResponse.status}`);
            }
            const createResult = await createResponse.json();
            console.log('Folder created:', createResult);
            return { id: createResult.id };
        } catch (error) {
            // Catch fetch-level errors (e.g., network issues) or re-thrown errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                 // This often indicates a network error or CORS issue (less likely here with Drive API)
                 console.error('Network Error:', error);
                 throw new Error('Network error. Please check your connection.');
            } else {
                // Handle errors thrown from the !response.ok block or other issues
                console.error('Error creating/searching folder:', error);
                // Re-throw the potentially more descriptive error
                throw error;
            }
        }
    }

    async putOnDrive(file) {
        const metadata = {
            name: file.filename,
            parents: [file.parent]
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file.blob);

        try {
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${file.token}`
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('File upload result:', result);
            return result;
        } catch (error) {
            console.error('Error uploading file to drive:', error);
            throw error;
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
        console.log('Selected tab:', tab);

        // Retrieve the folder name from storage first
        chrome.storage.sync.get(['driveFolderName'], async (storageResult) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving folder name from storage:", chrome.runtime.lastError);
                showNotification('FAILURE', 'Could not read extension settings.', 'failure');
                return;
            }

            // Use saved name or default to 'arXiv'
            const folderName = storageResult.driveFolderName || 'arXiv';
            console.log(`Using Google Drive folder: '${folderName}'`);

            try {
                const urlResult = await getUrlAndName(tab);
                if (!urlResult) {
                    // getUrlAndName logs its own message if URL is invalid
                    showNotification('INFO', 'Current page is not a valid arXiv abstract or PDF page.', 'info');
                    return; // Exit gracefully
                }

                const [filepdf_url, save_filename] = urlResult;
                const fileInfo = { path: filepdf_url, name: save_filename }; // Use a file info object
                console.log('File URL and name:', filepdf_url, save_filename);

                const googleDriveUploader = new GoogleDriveUploader();
                // Pass the retrieved folderName to uploadFile
                await googleDriveUploader.uploadFile(fileInfo, folderName); // <<< Pass folderName here

                showNotification('SUCCESS', `File '${save_filename}' uploaded to folder '${folderName}' successfully.`, 'success');

            } catch (error) {
                console.error('Error processing command:', error);
                // Provide more context in the error notification
                showNotification('FAILURE', `Error uploading to '${folderName}': ${error.message}`, 'failure');
            }
        });
    });
});

console.log('Background script loaded');
