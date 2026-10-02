const fs = require('fs');
const content = fs.readFileSync('src/components/BookingManagement.tsx', 'utf8');
const replacement = fs.readFileSync('/Users/putuedosantika/.gemini/antigravity-ide/brain/fcf2d144-af54-4e9c-a024-6d1bf8816cb9/scratch/chart.tsx', 'utf8');

const targetStr = '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">';
const newContent = content.replace(targetStr, replacement + '\n      ' + targetStr);

fs.writeFileSync('src/components/BookingManagement.tsx', newContent);
console.log('Replacement successful');
