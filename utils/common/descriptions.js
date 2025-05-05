// descriptions.js - Central place for app descriptions

// Main extension description
export const EXTENSION_DESCRIPTION = "Chrome extension to download papers into Google Drive. Supports arXiv, ACM, NSDI papers, and saving any webpage as HTML.";

// Keyboard shortcuts descriptions
export const KEYBOARD_SHORTCUTS = {
    savePaper: {
        mac: "CMD+E",
        default: "CTRL+SHIFT+E",
        description: "Save current paper to Google Drive, or save any webpage as HTML."
    },
    saveCustomTitle: {
        mac: "CMD+X",
        default: "CTRL+SHIFT+X",
        description: "Save current paper or webpage with custom title."
    },
    openSettings: {
        mac: "CMD+SHIFT+P",
        default: "CTRL+SHIFT+P",
        description: "Open folder path settings."
    },
    closePopup: {
        mac: "ESC",
        default: "ESC",
        description: "Close the popup."
    }
};

// Helper function to get shortcut descriptions
function getShortcutDescriptions(format = 'text') {
    const shortcuts = [
        { key: 'savePaper', label: 'Save Paper' },
        { key: 'saveCustomTitle', label: 'Save with Custom Title' },
        { key: 'openSettings', label: 'Settings' },
        { key: 'closePopup', label: 'Close Popup' }
    ];
    
    return shortcuts.map(({ key, label }) => {
        const shortcut = KEYBOARD_SHORTCUTS[key];
        if (format === 'html') {
            return `<p>Use <b>[${shortcut.mac}]</b> to ${shortcut.description.toLowerCase().replace(/\.$/, '')}</p>`;
        } else {
            return `- ${label}: Use ${shortcut.mac} (for Mac) or ${shortcut.default} (for others) to ${shortcut.description.toLowerCase().replace(/\.$/, '')}`;
        }
    }).join(format === 'html' ? '\n        ' : '\n');
}

// Usage instructions
export const USAGE_INSTRUCTIONS = `
${getShortcutDescriptions()}
`;

// For README - use hardcoded values since we're reading this as a string in Node.js
export const README_USAGE = `
- Perform interactive authentication the first time.
- **Save Paper:** Use **[CMD+E] (for MAC) or [CTRL+SHIFT+E] (for OTHERS)** on supported paper pages (arXiv abstract/PDF, ACM abstract/PDF, NSDI) to save the paper to your specified Google Drive path.
- **Save Webpage as HTML:** Use the same shortcut **[CMD+E] (for MAC) or [CTRL+SHIFT+E] (for OTHERS)** on any unsupported webpage to save it as HTML to your Google Drive.
- **Save Paper with Custom Title:** Use **[CMD+X]** instead of **[CMD+E]** to save with custom titles.
- **Set Google Drive Path:** Use **[CMD+SHIFT+P] (for MAC) or [CTRL+SHIFT+P] (for OTHERS)** to quickly set the target folder path in Google Drive. This opens a small popup where the input field is automatically focused. Type your desired path (e.g., \`research/papers/nlp\` or leave blank to use the default \`papers\`) and press **Enter** to save and close the popup.
- **Default Path:** If no path is set, papers will be saved to a folder named \`papers\` in the root of your Google Drive.
`;

// Get HTML format of usage instructions for popup.html
export function getHTMLUsageInstructions() {
    return `
        ${getShortcutDescriptions('html')}
    `;
} 