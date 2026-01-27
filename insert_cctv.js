// Script to insert CCTV question using line numbers
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');
let lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Find the line with "Comments (Optional)" in the modal
let insertLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Comments (Optional)') && lines[i].includes('form-label')) {
        insertLineIndex = i - 2; // Insert 2 lines before "Comments (Optional)"
        console.log(`Found Comments section at line ${i + 1}`);
        console.log(`Will insert CCTV question at line ${insertLineIndex + 1}`);
        break;
    }
}

if (insertLineIndex > 0) {
    // CCTV question HTML
    const cctvLines = [
        '                    <div class="form-section">',
        '                        <label class="form-label">📹 Does the road have CCTV cameras?</label>',
        '                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">',
        '                            <button type="button" class="yn-btn" data-question="cctv" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>',
        '                            <button type="button" class="yn-btn" data-question="cctv" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>',
        '                        </div>',
        '                        <input type="hidden" id="cctv-value" name="hasCCTV">',
        '                    </div>',
        '                    '
    ];

    // Insert the lines
    lines.splice(insertLineIndex, 0, ...cctvLines);
    console.log('✅ Inserted CCTV question');

    // Write back
    content = lines.join('\n');
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('✅ Saved app.js');
} else {
    console.log('❌ Could not find insertion point');
}
