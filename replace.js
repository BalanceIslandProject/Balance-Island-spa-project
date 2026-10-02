const fs = require('fs');
const content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const replacement = fs.readFileSync('/Users/putuedosantika/.gemini/antigravity-ide/brain/fcf2d144-af54-4e9c-a024-6d1bf8816cb9/scratch/campaign_tab.tsx', 'utf8');

const startMarker = "{/* CAMPAIGN CARD SETUP TAB */}";
const endMarker = "{/* TREATMENT CREATION TAB */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + replacement + '\n                    ' + content.substring(endIndex);
    fs.writeFileSync('src/app/admin/page.tsx', newContent);
    console.log('Replacement successful');
} else {
    console.log('Markers not found');
}
