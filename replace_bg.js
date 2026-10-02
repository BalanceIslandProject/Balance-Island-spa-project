const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Change modal background
    content = content.replace(/bg-\[#F8F9FA\]/g, 'bg-white');

    // 2. Change Guest details bg-gray-50 to bg-white
    content = content.replace(
        /<div className="bg-gray-50 border border-border\/80 rounded-xl p-5 space-y-4">/g,
        '<div className="bg-white border border-border/80 rounded-xl p-5 space-y-4">'
    );

    // 3. Optional: check for bg-gray-50 in other places and replace if it makes sense.
    // The user said "change the bg of the website, make sure is all using white bg on every section."
    // Let's replace bg-highlight and bg-gray-50 globally if it's acting as a section background.
    // In src/app/page.tsx:
    // <section className="py-24 bg-highlight relative overflow-hidden">
    content = content.replace(/bg-highlight/g, 'bg-white');
    content = content.replace(/bg-gray-50/g, 'bg-white'); // just replace all bg-gray-50 with bg-white to be safe

    fs.writeFileSync(filePath, content);
    console.log('Processed bg for', filePath);
}

files.forEach(processFile);
