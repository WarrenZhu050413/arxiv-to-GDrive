// update_readme.js - Update README.md with centralized descriptions
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

// Extract README usage section using regex
const extractReadmeUsage = (text) => {
    const regex = /README_USAGE\s*=\s*`([\s\S]*?)`;/;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};

// Update the README.md file
const updateReadme = () => {
    try {
        // Read the README usage section
        const readmeUsage = extractReadmeUsage(descriptionText);
        
        if (!readmeUsage) {
            const errorMsg = 'Failed to extract README_USAGE from descriptions.js';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        // Read the existing README file
        const readmePath = join(__dirname, '..', '..', 'README.md');
        let readmeContent = fs.readFileSync(readmePath, 'utf8');
        
        // Find the USAGE section
        const usageRegex = /(## USAGE\s*)([\s\S]*?)(\s*##|$)/;
        const match = readmeContent.match(usageRegex);
        
        if (match) {
            // Replace only the USAGE section content, keeping the header and anything after
            readmeContent = readmeContent.replace(
                usageRegex,
                (fullMatch, usageHeader, oldContent, nextSection) => {
                    return `${usageHeader}\n${readmeUsage}\n\n${nextSection || ''}`;
                }
            );
            
            // Write the updated README back to disk
            fs.writeFileSync(readmePath, readmeContent, 'utf8');
            console.log('Successfully updated README.md with descriptions');
        } else {
            // If there's no USAGE section, add it at the end
            if (!readmeContent.endsWith('\n\n')) {
                readmeContent += '\n\n';
            }
            readmeContent += `## USAGE\n${readmeUsage}\n`;
            
            // Write the updated README back to disk
            fs.writeFileSync(readmePath, readmeContent, 'utf8');
            console.log('Successfully added USAGE section to README.md');
        }
    } catch (error) {
        console.error('Error updating README.md:', errorHandler.formatErrorMessage(error));
        process.exit(1);
    }
};

// Run the update
updateReadme(); 