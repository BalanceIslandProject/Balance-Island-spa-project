const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Add Trash2 to import
    content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'lucide-react';/,
        (match, p1) => {
            const icons = p1.split(',').map(s => s.trim());
            if (!icons.includes('Trash2')) icons.push('Trash2');
            return `import { ${icons.join(', ')} } from 'lucide-react';`;
        }
    );

    // Determine which modal setter to use
    let modalSetter = '';
    if (content.includes('setIsBookingModalOpen')) {
        modalSetter = 'setIsBookingModalOpen(false);';
    } else if (content.includes('setIsModalOpen')) {
        modalSetter = 'setIsModalOpen(false);';
    }

    const regex = /\{cartItems\.length > 1 && \(\s*<button[\s\S]*?<\/button>\s*\)\}/g;
    
    const replacement = `<button
        type="button"
        onClick={() => {
            const newCart = cartItems.filter(i => i.id !== item.id);
            setCartItems(newCart);
            if (newCart.length === 0) {
                ${modalSetter}
                setIsReviewingBooking(false);
            }
        }}
        className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors p-1.5 bg-gray-50 hover:bg-red-50 rounded-lg"
    >
        <Trash2 className="w-3.5 h-3.5" />
    </button>`;

    content = content.replace(regex, replacement);

    fs.writeFileSync(filePath, content);
    console.log('Processed bin icon for', filePath);
}

files.forEach(processFile);
