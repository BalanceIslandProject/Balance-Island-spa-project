const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the random ID generator
    // Previous: const bookingIdRef = React.useRef<string>('INV-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    // New: const bookingIdRef = React.useRef<string>('INV-' + Math.floor(100 + Math.random() * 900).toString() + Math.random().toString(36).substring(2, 5).toUpperCase());
    
    const regex = /const bookingIdRef = React\.useRef<string>\('INV-' \+ Math\.random\(\)\.toString\(36\)\.substring\(2, 8\)\.toUpperCase\(\)\);/g;
    const newCode = "const bookingIdRef = React.useRef<string>('INV-' + Math.floor(100 + Math.random() * 900).toString() + Math.random().toString(36).substring(2, 5).replace(/[0-9]/g, 'A').toUpperCase());";
    // wait, if we want a mix, it's better to just do 3 numbers and 3 letters.
    // e.g. 'INV-' + Math.floor(100 + Math.random() * 900).toString() + 'ABC'
    
    const betterNewCode = "const bookingIdRef = React.useRef<string>('INV-' + Math.floor(100 + Math.random() * 900).toString() + String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26)));";
    
    content = content.replace(regex, betterNewCode);
    fs.writeFileSync(filePath, content);
});

console.log('Fixed invoice ID generation');
