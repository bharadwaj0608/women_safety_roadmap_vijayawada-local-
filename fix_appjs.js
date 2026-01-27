// Script to fix the corrupted app.js file
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
const backupPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js.backup';

// Read the file
let content = fs.readFileSync(appJsPath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// The file should be around 1500 lines, not 2500
// It looks like the content was duplicated
// Let's find where the duplication starts

// Check if the file is roughly double the expected size
if (lines.length > 2000) {
    console.log('File appears to be duplicated. Attempting to fix...');

    // Create backup
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log('✅ Backup created at app.js.backup');

    // The file is likely duplicated in the middle
    // Let's take only the first half and check if it's complete
    const halfPoint = Math.floor(lines.length / 2);
    const firstHalf = lines.slice(0, halfPoint).join('\n');

    // Check if first half ends properly
    if (firstHalf.includes('document.head.appendChild(style)')) {
        fs.writeFileSync(appJsPath, firstHalf, 'utf8');
        console.log('✅ Fixed! Removed duplicated content.');
        console.log(`New file size: ${firstHalf.split('\n').length} lines`);
    } else {
        console.log('❌ Cannot automatically fix. Manual intervention needed.');
    }
} else {
    console.log('File size looks normal. No fix needed.');
}
