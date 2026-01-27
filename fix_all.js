// Script to add CCTV question and fix colors
const fs = require('fs');

// 1. Fix app.js - Add CCTV question
const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
let appContent = fs.readFileSync(appJsPath, 'utf8');

// Find the location to insert CCTV question (after population density, before comments)
const insertPoint = `                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Comments (Optional)</label>`;

const cctvQuestion = `                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">📹 Does the road have CCTV cameras?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="cctv" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="cctv" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="cctv-value" name="hasCCTV">
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Comments (Optional)</label>`;

if (appContent.includes(insertPoint) && !appContent.includes('hasCCTV')) {
    appContent = appContent.replace(insertPoint, cctvQuestion);
    console.log('✅ Added CCTV question to modal');
} else if (appContent.includes('hasCCTV')) {
    console.log('⚠️  CCTV question already exists');
} else {
    console.log('❌ Could not find insertion point');
}

// Add CCTV to button handler
const oldHandler = `            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            }`;

const newHandler = `            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            } else if (question === 'cctv') {
                modal.querySelector('#cctv-value').value = value;
            }`;

if (appContent.includes(oldHandler)) {
    appContent = appContent.replace(oldHandler, newHandler);
    console.log('✅ Updated button handler for CCTV');
}

// Add CCTV to form submission
const oldSubmit = `            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            comments: formData.get('comments'),`;

const newSubmit = `            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            hasCCTV: formData.get('hasCCTV') ? formData.get('hasCCTV') === 'true' : null,
            comments: formData.get('comments'),`;

if (appContent.includes(oldSubmit)) {
    appContent = appContent.replace(oldSubmit, newSubmit);
    console.log('✅ Updated form submission for CCTV');
}

// Add CCTV to review history display
const oldHistory = `                    \${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> \${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.comments ? \`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-style: italic; color: #555;">"\${review.comments}"</div>\` : ''}`;

const newHistory = `                    \${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> \${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasCCTV !== null && review.hasCCTV !== undefined ? \`<div style="margin-bottom: 5px;"><strong>CCTV Camera:</strong> \${review.hasCCTV ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.comments ? \`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-style: italic; color: #555;">"\${review.comments}"</div>\` : ''}`;

if (appContent.includes(oldHistory)) {
    appContent = appContent.replace(oldHistory, newHistory);
    console.log('✅ Updated review history display for CCTV');
}

fs.writeFileSync(appJsPath, appContent, 'utf8');

// 2. Fix index.html - Change gray to blue
const htmlPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

htmlContent = htmlContent.replace(
    'background-color: #6b7280;',
    'background-color: #3b82f6;'
);

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('✅ Changed no-rating color from gray to blue');

console.log('\n✅ All fixes applied successfully!');
