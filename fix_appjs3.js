// Script to properly reconstruct app.js
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
const backupPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js.backup';
const enhancedModalPath = 'c:/Users/chand/Downloads/hackathon one twelve/enhanced_modal.js';

// Read the backup (which has the duplication but all functions)
let backupContent = fs.readFileSync(backupPath, 'utf8');

// Read the enhanced modal
let enhancedModal = fs.readFileSync(enhancedModalPath, 'utf8');
// Remove the comment line
enhancedModal = enhancedModal.split('\n').slice(2).join('\n');

// Find where the old openRoadReviewModal starts and ends in the backup
const oldModalStart = backupContent.indexOf('// Open Road Review Modal (for quick road ratings)');
const oldModalEnd = backupContent.indexOf('\n// Open Rate Safety Modal', oldModalStart);

if (oldModalStart === -1 || oldModalEnd === -1) {
    console.log('ERROR: Could not find modal boundaries');
    process.exit(1);
}

// Construct the new file:
// 1. Everything before the old modal
// 2. The enhanced modal
// 3. Everything after the old modal (but before the duplication)

const before = backupContent.substring(0, oldModalStart);
const after = backupContent.substring(oldModalEnd);

// Find where the duplication starts in 'after'
// The duplication would start with "const API_URL"
const dupStart = after.indexOf('\nconst API_URL');
let cleanAfter = after;
if (dupStart > 0) {
    cleanAfter = after.substring(0, dupStart);
}

const newContent = before + enhancedModal + '\n' + cleanAfter;

// Write the new file
fs.writeFileSync(appJsPath, newContent, 'utf8');

const newLines = newContent.split('\n').length;
console.log(`✅ Successfully reconstructed app.js!`);
console.log(`New file size: ${newLines} lines`);
