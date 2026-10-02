const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove Home from import
    content = content.replace(/,\s*Home\s*,/g, ',');
    content = content.replace(/,\s*Home\s*\}/g, '}');
    content = content.replace(/\{\s*Home\s*,/g, '{');

    // Replace <Home with <MapPin
    content = content.replace(/<Home className/g, '<MapPin className');

    fs.writeFileSync(filePath, content);
    console.log('Processed home fix for', filePath);
}

files.forEach(processFile);
