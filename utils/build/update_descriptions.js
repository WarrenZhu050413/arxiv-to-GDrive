// update_descriptions.js - Run all description update scripts
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler } from '../common/error_utils.js';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    console.log('Updating manifest.json with descriptions...');
    execSync('node ' + join(__dirname, 'update_manifest.js'), { stdio: 'inherit' });
    
    console.log('Updating README.md with descriptions...');
    execSync('node ' + join(__dirname, 'update_readme.js'), { stdio: 'inherit' });
    
    console.log('All description updates completed successfully!');
} catch (error) {
    console.error('Error updating descriptions:', errorHandler.formatErrorMessage(error, 'Unknown error in update process'));
    process.exit(1);
} 