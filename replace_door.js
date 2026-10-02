const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Add DoorOpen to import if missing
    content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'lucide-react';/,
        (match, p1) => {
            const icons = p1.split(',').map(s => s.trim());
            if (!icons.includes('DoorOpen')) icons.push('DoorOpen');
            return `import { ${icons.join(', ')} } from 'lucide-react';`;
        }
    );

    // Replace MapPin with DoorOpen for Room Number
    content = content.replace(
        /<MapPin className="w-3\.5 h-3\.5"\/> Room Number \(Optional\)/g,
        '<DoorOpen className="w-3.5 h-3.5"/> Room Number (Optional)'
    );

    fs.writeFileSync(filePath, content);
    console.log('Processed door fix for', filePath);
}

files.forEach(processFile);
