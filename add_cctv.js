// Script to add CCTV question and color legend
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// 1. Add CCTV question to the review history display
const oldReviewDisplay = `                    \${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> \${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}`;

const newReviewDisplay = `                    \${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> \${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasCCTV !== null && review.hasCCTV !== undefined ? \`<div style="margin-bottom: 5px;"><strong>CCTV Camera:</strong> \${review.hasCCTV ? '✅ Yes' : '❌ No'}</div>\` : ''}`;

content = content.replace(oldReviewDisplay, newReviewDisplay);

// 2. Add CCTV question to the form
const oldFormQuestions = `                    <div class="form-section">
                        <label class="form-label">👥 Does the place have population density?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="population-density-value" name="hasPopulationDensity">
                    </div>
                    
                    <div class="form-section">`;

const newFormQuestions = `                    <div class="form-section">
                        <label class="form-label">👥 Does the place have population density?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="population-density-value" name="hasPopulationDensity">
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">📹 Does the road have CCTV cameras?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="cctv" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="cctv" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="cctv-value" name="hasCCTV">
                    </div>
                    
                    <div class="form-section">`;

content = content.replace(oldFormQuestions, newFormQuestions);

// 3. Update the button handler to include CCTV
const oldButtonHandler = `            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            }`;

const newButtonHandler = `            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            } else if (question === 'cctv') {
                modal.querySelector('#cctv-value').value = value;
            }`;

content = content.replace(oldButtonHandler, newButtonHandler);

// 4. Update form submission to include CCTV
const oldFormSubmit = `        const ratingData = {
            roadId: roadId,
            roadName: roadName,
            rating: overallRating,
            dayRating: dayRating || null,
            nightRating: nightRating || null,
            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            comments: formData.get('comments'),
            timestamp: new Date().toISOString()
        };`;

const newFormSubmit = `        const ratingData = {
            roadId: roadId,
            roadName: roadName,
            rating: overallRating,
            dayRating: dayRating || null,
            nightRating: nightRating || null,
            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            hasCCTV: formData.get('hasCCTV') ? formData.get('hasCCTV') === 'true' : null,
            comments: formData.get('comments'),
            timestamp: new Date().toISOString()
        };`;

content = content.replace(oldFormSubmit, newFormSubmit);

// Write back
fs.writeFileSync(appJsPath, content, 'utf8');

console.log('✅ Added CCTV question to review modal!');
