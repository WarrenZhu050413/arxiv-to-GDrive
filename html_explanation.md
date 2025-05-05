# HTML Fetching and Saving in Paper-to-GDrive Extension

This document explains how the Paper-to-GDrive extension captures and saves HTML content from webpages.

## Overview

The extension supports saving research papers from specific websites (arXiv, ACM, NSDI) as PDFs. When a user visits a non-supported website, the extension can still save the webpage as HTML to Google Drive using the same command shortcuts.

## Webpage Detection Process

1. When the user triggers the save command (CMD+E on Mac or CTRL+SHIFT+E on other platforms), the extension first checks if the current page matches any supported paper website patterns.
2. If no match is found, the extension processes the page as a generic webpage and saves it as HTML.

## HTML Content Capture Process

The HTML content is captured through these key steps:

### 1. Title Extraction

```javascript
// Try to fetch the title from the HTML content
let title;
try {
    const fetchedTitle = await fetchHtmlPageTitle(url);
    title = fetchedTitle || tab.title || 'Webpage';
} catch (error) {
    console.error('Error fetching title from HTML:', error);
    title = tab.title || 'Webpage';
}
```

The extension attempts to extract the title using the `fetchHtmlPageTitle` function, which makes a fetch request to the webpage URL and extracts the title from the HTML content:

```javascript
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
```

If this extraction fails, the extension falls back to using the browser tab's title or a default value of 'Webpage'.

### 2. HTML Content Capture

The extension uses Chrome's scripting API to execute a script in the current tab that captures the full HTML content:

```javascript
// Execute script in the tab to get the HTML content
const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
        return {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title
        };
    }
});
```

This captures the complete HTML structure of the page including all elements and styles.

### 3. Blob Creation

The captured HTML content is then converted to a Blob object with the appropriate MIME type:

```javascript
// Create a blob from the HTML content
const blob = new Blob([htmlContent], { type: 'text/html' });
```

## Saving Process

### Standard Save Flow

1. The extension gets the HTML content as described above
2. A filename is created based on the extracted title
3. The HTML content is saved as a blob
4. The Google Drive uploader receives this blob directly
5. The uploader creates the specified folder structure in Google Drive if needed
6. The HTML file is uploaded to Google Drive using the Drive API

### Custom Title Save Flow

For custom title saving (CMD+X on Mac or CTRL+SHIFT+X on other platforms):

1. The HTML content is captured as described above
2. A popup appears asking for a custom title
3. After the user enters a title and clicks save:
   - The extension creates a filename using the custom title
   - The HTML content blob is uploaded to Google Drive
   - The Google Drive folder structure is created if needed

## Google Drive Upload

The upload process handles the HTML content blob directly:

```javascript
async uploadFile(file, folderPath) {
    // ... authentication ...
    
    // Get the blob - either directly from content or by fetching it
    let blob;
    if (file.content && file.content instanceof Blob) {
        console.log('Using provided blob content directly');
        blob = file.content;
    } else if (file.path) {
        blob = await this.fetchFileBlob(file.path);
    } else {
        throw new Error('No content or path provided for upload');
    }
    
    // ... folder creation ...
    
    // Upload to Google Drive
    const result = await this.putOnDrive({
        blob: blob,
        filename: file.name,
        mimetype: blob.type,
        parent: parentFolderId,
        token: token
    });
}
```

## Implementation Notes

1. The HTML saving feature uses Manifest V3's scripting API to capture page content
2. Direct blob handling is used instead of blob URLs since service workers in Manifest V3 don't support `URL.createObjectURL`
3. The extension uses the original title from the HTML page, with basic cleaning for invalid filename characters
4. The same command shortcuts work for both paper saving and HTML saving, providing a consistent user experience
