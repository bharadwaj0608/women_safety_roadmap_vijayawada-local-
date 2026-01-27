// Final script to add CCTV handlers
const fs = require('fs');

const appJsPath = 'c:/Users/chand/Downloads/hackathon one twelve/public/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// 1. Add CCTV to button handler
if (!content.includes("question === 'cctv'")) {
    content = content.replace(
        `            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            }`,
        `            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            } else if (question === 'cctv') {
                modal.querySelector('#cctv-value').value = value;
            }`
    );
    console.log('✅ Added CCTV button handler');
}

// 2. Add CCTV to form submission
if (!content.includes('hasCCTV: formData.get')) {
    content = content.replace(
        `            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            comments: formData.get('comments'),`,
        `            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            hasCCTV: formData.get('hasCCTV') ? formData.get('hasCCTV') === 'true' : null,
            comments: formData.get('comments'),`
    );
    console.log('✅ Added CCTV to form submission');
}

// 3. Add CCTV to review history
if (!content.includes('CCTV Camera:')) {
    content = content.replace(
        `\${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.comments ?`,
        `\${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? \`<div style="margin-bottom: 5px;"><strong>Population Density:</strong> \${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.hasCCTV !== null && review.hasCCTV !== undefined ? \`<div style="margin-bottom: 5px;"><strong>CCTV Camera:</strong> \${review.hasCCTV ? '✅ Yes' : '❌ No'}</div>\` : ''}
                    \${review.comments ?`
    );
    console.log('✅ Added CCTV to review history');
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('\n✅ All CCTV handlers added successfully!');
