// Script to replace the openRoadReviewModal function
const fs = require('fs');

// Read the main app.js file
const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
const enhancedModalPath = 'c:/Users/chand/Downloads/hackathon one twelve/enhanced_modal.js';

let appContent = fs.readFileSync(appJsPath, 'utf8');
const enhancedContent = fs.readFileSync(enhancedModalPath, 'utf8');

// Extract just the function from enhanced_modal.js (skip the first comment line)
const functionContent = enhancedContent.split('\n').slice(2).join('\n');

// Find the start and end of the old function
const functionStart = appContent.indexOf('// Open Road Review Modal (for quick road ratings)');
const functionEnd = appContent.indexOf('\n}\n', functionStart) + 3; // +3 for '\n}\n'

if (functionStart === -1) {
    console.log('ERROR: Could not find the function to replace');
    process.exit(1);
}

// Replace the old function with the new one
const before = appContent.substring(0, functionStart);
const after = appContent.substring(functionEnd);
const newContent = before + functionContent + after;

// Write back to file
fs.writeFileSync(appJsPath, newContent, 'utf8');

console.log('✅ Successfully replaced openRoadReviewModal function!');
console.log(`Function was at position ${functionStart} to ${functionEnd}`);
