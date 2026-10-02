const fs = require('fs');

const files = [
    {
        path: 'src/app/page.tsx',
        modalClose: 'setIsBookingModalOpen(false);'
    },
    {
        path: 'src/components/LocationClient.tsx',
        modalClose: 'setIsBookingModalOpen(false);'
    },
    {
        path: 'src/app/rituals/[id]/page.tsx',
        modalClose: 'setIsModalOpen(false);'
    }
];

function processFile(fileInfo) {
    let content = fs.readFileSync(fileInfo.path, 'utf-8');

    // 1. Remove the old absolute Trash2 button
    const oldTrashRegex = /<button\s+type="button"\s+onClick=\{[\s\S]*?\}\s+className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors p-1\.5 bg-gray-50 hover:bg-red-50 rounded-lg"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/g;
    
    content = content.replace(oldTrashRegex, '');

    // 2. Add the new red Trash2 button next to the - button
    const guestsRowRegex = /(<div className="flex items-center gap-3">\s*)(<button\s+type="button"\s+onClick=\{\(\) => setCartItems\(cartItems\.map)/g;
    
    const newTrashBtn = `$1<button
            type="button"
            onClick={() => {
                const newCart = cartItems.filter(i => i.id !== item.id);
                setCartItems(newCart);
                if (newCart.length === 0) {
                    ${fileInfo.modalClose}
                    setIsReviewingBooking(false);
                }
            }}
            className="w-8 h-8 rounded-full bg-red-50/80 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
            title="Remove treatment"
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1"></div>
        $2`;

    content = content.replace(guestsRowRegex, newTrashBtn);

    fs.writeFileSync(fileInfo.path, content);
    console.log('Processed bin position for', fileInfo.path);
}

files.forEach(processFile);
