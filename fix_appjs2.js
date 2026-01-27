// Script to properly fix app.js by removing all content after the enhanced modal
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';

// Read the file
let content = fs.readFileSync(appJsPath, 'utf8');
const lines = content.split('\n');

console.log(`Current total lines: ${lines.length}`);

// The enhanced modal function should end around line 1186
// Everything after that is duplicate
// Let's find the end of the openRoadReviewModal function

let inFunction = false;
let braceCount = 0;
let functionEndLine = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find the start of openRoadReviewModal
    if (line.includes('function openRoadReviewModal')) {
        inFunction = true;
        braceCount = 0;
    }

    if (inFunction) {
        // Count braces
        for (let char of line) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }

        // When braces balance, we've found the end
        if (braceCount === 0 && line.includes('}')) {
            functionEndLine = i;
            console.log(`Found end of openRoadReviewModal at line ${i + 1}`);
            break;
        }
    }
}

if (functionEndLine > 0) {
    // Keep everything up to and including the function end
    const cleanedContent = lines.slice(0, functionEndLine + 1).join('\n');

    // Create backup
    fs.writeFileSync(appJsPath + '.backup2', content, 'utf8');

    // Write cleaned content
    fs.writeFileSync(appJsPath, cleanedContent, 'utf8');

    console.log(`✅ Fixed! Removed duplicate content.`);
    console.log(`New file size: ${functionEndLine + 1} lines`);
} else {
    console.log('❌ Could not find function end');
}
