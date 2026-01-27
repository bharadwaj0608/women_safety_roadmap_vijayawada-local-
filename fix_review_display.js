// Script to fix the N/A display in review history
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// Find and replace the problematic lines
const oldCode = `        existingRatings.forEach((review, index) => {
            const date = new Date(review.timestamp).toLocaleDateString();
            const dayStars = review.dayRating ? renderStars(review.dayRating) : 'N/A';
            const nightStars = review.nightRating ? renderStars(review.nightRating) : 'N/A';

            reviewHistoryHTML += \`
                <div class="review-item" style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Review #\${existingRatings.length - index}</strong>
                        <span style="color: #666; font-size: 12px;">\${date}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Day:</strong> \${dayStars} \${review.dayRating ? \`(\${review.dayRating}/5)\` : ''}
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Night:</strong> \${nightStars} \${review.nightRating ? \`(\${review.nightRating}/5)\` : ''}
                    </div>`;

const newCode = `        existingRatings.forEach((review, index) => {
            const date = new Date(review.timestamp).toLocaleDateString();
            
            // Handle both new (day/night) and old (single rating) formats
            let dayDisplay, nightDisplay;
            
            if (review.dayRating || review.nightRating) {
                // New format with separate day/night ratings
                dayDisplay = review.dayRating ? \`\${renderStars(review.dayRating)} (\${review.dayRating}/5)\` : '<span style="color: #999;">Not rated</span>';
                nightDisplay = review.nightRating ? \`\${renderStars(review.nightRating)} (\${review.nightRating}/5)\` : '<span style="color: #999;">Not rated</span>';
            } else if (review.rating) {
                // Old format with single rating - show it for both day and night
                dayDisplay = \`\${renderStars(review.rating)} (\${review.rating}/5) <em style="color: #666; font-size: 11px;">(overall)</em>\`;
                nightDisplay = \`\${renderStars(review.rating)} (\${review.rating}/5) <em style="color: #666; font-size: 11px;">(overall)</em>\`;
            } else {
                dayDisplay = '<span style="color: #999;">Not rated</span>';
                nightDisplay = '<span style="color: #999;">Not rated</span>';
            }

            reviewHistoryHTML += \`
                <div class="review-item" style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Review #\${existingRatings.length - index}</strong>
                        <span style="color: #666; font-size: 12px;">\${date}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Day:</strong> \${dayDisplay}
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Night:</strong> \${nightDisplay}
                    </div>`;

// Replace
content = content.replace(oldCode, newCode);

// Write back
fs.writeFileSync(appJsPath, content, 'utf8');

console.log('✅ Fixed review history display!');
