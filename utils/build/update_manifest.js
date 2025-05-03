// update_manifest.js - Update manifest.json with centralized descriptions
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler } from '../common/error_utils.js';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the descriptions (need to read file directly since we're in a Node.js context)
const descriptionText = fs.readFileSync(
    join(__dirname, '..', 'common', 'descriptions.js'),
    'utf8'
);

// Extract extension description using regex
const extractExtensionDescription = (text) => {
    const match = text.match(/EXTENSION_DESCRIPTION\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
};

// Extract keyboard shortcuts descriptions using regex
const extractKeyboardShortcuts = (text) => {
    // This is a simplified approach - in a real implementation, you'd use a proper JS parser
    const keyboardShortcutsSection = text.match(/KEYBOARD_SHORTCUTS\s*=\s*\{([\s\S]*?)\};/);
    
    if (!keyboardShortcutsSection) return null;
    
    // Extract the different shortcut sections
    const savePaperDesc = keyboardShortcutsSection[1].match(/savePaper:[\s\S]*?description:\s*"([^"]+)"/);
    const saveCustomTitleDesc = keyboardShortcutsSection[1].match(/saveCustomTitle:[\s\S]*?description:\s*"([^"]+)"/);
    const openSettingsDesc = keyboardShortcutsSection[1].match(/openSettings:[\s\S]*?description:\s*"([^"]+)"/);
    
    return {
        savePaper: savePaperDesc ? savePaperDesc[1] : null,
        saveCustomTitle: saveCustomTitleDesc ? saveCustomTitleDesc[1] : null,
        openSettings: openSettingsDesc ? openSettingsDesc[1] : null
    };
};

// Update the manifest.json file
const updateManifest = () => {
    try {
        // Read the descriptions
        const description = extractExtensionDescription(descriptionText);
        const shortcuts = extractKeyboardShortcuts(descriptionText);
        
        if (!description || !shortcuts) {
            const errorMsg = 'Failed to extract descriptions from descriptions.js';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        // Read the manifest file
        const manifestPath = join(__dirname, '..', '..', 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Update the description
        manifest.description = description;
        
        // Update the commands descriptions
        if (manifest.commands && shortcuts) {
            if (manifest.commands.SavePaper && shortcuts.savePaper) {
                manifest.commands.SavePaper.description = shortcuts.savePaper;
            }
            
            if (manifest.commands.SavePaperWithCustomTitle && shortcuts.saveCustomTitle) {
                manifest.commands.SavePaperWithCustomTitle.description = shortcuts.saveCustomTitle;
            }
            
            if (manifest.commands.set_folder_path && shortcuts.openSettings) {
                manifest.commands.set_folder_path.description = shortcuts.openSettings;
            }
        }
        
        // Write the updated manifest back to disk
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4), 'utf8');
        console.log('Successfully updated manifest.json with descriptions');
    } catch (error) {
        console.error('Error updating manifest.json:', errorHandler.formatErrorMessage(error));
        process.exit(1);
    }
};

// Run the update
updateManifest(); 