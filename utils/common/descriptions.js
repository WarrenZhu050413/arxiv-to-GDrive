// descriptions.js - Central place for app descriptions

// Main extension description
export const EXTENSION_DESCRIPTION = "Chrome extension to download papers into Google Drive. Currently supports arXiv, ACM, and NSDI papers.";

// Keyboard shortcuts descriptions
export const KEYBOARD_SHORTCUTS = {
    savePaper: {
        mac: "CMD+E",
        default: "CTRL+SHIFT+E",
        description: "Save current paper to Google Drive."
    },
    saveCustomTitle: {
        mac: "CMD+X",
        default: "CTRL+SHIFT+X",
        description: "Save current paper to Google Drive with custom title."
    },
    openSettings: {
        mac: "CMD+SHIFT+P",
        default: "CTRL+SHIFT+P",
        description: "Open folder path settings."
    }
};

// Usage instructions
export const USAGE_INSTRUCTIONS = `
- Save Paper: Use ${KEYBOARD_SHORTCUTS.savePaper.mac} (for Mac) or ${KEYBOARD_SHORTCUTS.savePaper.default} (for others) to save paper to Google Drive.
- Save with Custom Title: Use ${KEYBOARD_SHORTCUTS.saveCustomTitle.mac} (for Mac) or ${KEYBOARD_SHORTCUTS.saveCustomTitle.default} (for others) to save with a custom filename.
- Settings: Use ${KEYBOARD_SHORTCUTS.openSettings.mac} (for Mac) or ${KEYBOARD_SHORTCUTS.openSettings.default} (for others) to open settings.
`;

// For README - use hardcoded values since we're reading this as a string in Node.js
export const README_USAGE = `
- Perform interactive authentication the first time.
- **Save Paper:** Use **[CMD+E] (for MAC) or [CTRL+SHIFT+E] (for OTHERS)** on supported paper pages (arXiv abstract/PDF, ACM abstract/PDF, NSDI) to save the paper to your specified Google Drive path.
- **Save Paper with Custom Title:** Use **[CMD+X]** instead of **[CMD+E]** to save with custom titles.
- **Set Google Drive Path:** Use **[CMD+SHIFT+P] (for MAC) or [CTRL+SHIFT+P] (for OTHERS)** to quickly set the target folder path in Google Drive. This opens a small popup where the input field is automatically focused. Type your desired path (e.g., \`research/papers/nlp\` or leave blank to use the default \`papers\`) and press **Enter** to save and close the popup.
- **Default Path:** If no path is set, papers will be saved to a folder named \`papers\` in the root of your Google Drive.
`;

// Get HTML format of usage instructions for popup.html
export function getHTMLUsageInstructions() {
    return `
        <p>Use <b>[${KEYBOARD_SHORTCUTS.savePaper.mac}]</b> to save paper.</p>
        <p>Use <b>[${KEYBOARD_SHORTCUTS.saveCustomTitle.mac}]</b> to add custom file name.</p>
        <p>Use <b>[${KEYBOARD_SHORTCUTS.openSettings.mac}]</b> to open settings.</p>
    `;
} 