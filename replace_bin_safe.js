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

    // Remove the old absolute Trash button
    // It looks like:
    /*
    <button
        type="button"
        onClick={() => {
            const newCart = cartItems.filter(i => i.id !== item.id);
            setCartItems(newCart);
            if (newCart.length === 0) {
                ...
                setIsReviewingBooking(false);
            }
        }}
        className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors p-1.5 bg-gray-50 hover:bg-red-50 rounded-lg"
    >
        <Trash2 className="w-3.5 h-3.5" />
    </button>
    */
    const oldTrashPattern = /<button\s+type="button"\s+onClick=\{\(\) => \{\s+const newCart = cartItems\.filter\(i => i\.id !== item\.id\);\s+setCartItems\(newCart\);\s+if \(newCart\.length === 0\) \{\s+.*?\s+setIsReviewingBooking\(false\);\s+\}\s+\}\}\s+className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors p-1\.5 bg-gray-50 hover:bg-red-50 rounded-lg"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/g;
    
    let oldTrashMatch = content.match(oldTrashPattern);
    if (!oldTrashMatch) {
        console.error('Could not find old trash button in', fileInfo.path);
        // Let's try a looser regex for the old trash button
        const looseOldTrash = /<button\s+type="button"\s+onClick=\{[\s\S]*?\}\s+className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors p-1\.5 bg-gray-50 hover:bg-red-50 rounded-lg"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/g;
        content = content.replace(looseOldTrash, '');
    } else {
        content = content.replace(oldTrashPattern, '');
    }

    // Now inject the new one next to the Plus/Minus buttons.
    // In the guest row, it starts with:
    // <div className="flex items-center gap-3">
    // <button
    // type="button"
    // onClick={() => setCartItems(cartItems.map(i => {
    // We only want to inject it before this specific button that is for the guest counter.
    const guestCounterStartPattern = /(<span className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80">Guests<\/span>\s*<div className="flex items-center gap-3">)/g;
    
    const newTrashBtn = `$1
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newCart = cartItems.filter(i => i.id !== item.id);
                                                                    setCartItems(newCart);
                                                                    if (newCart.length === 0) {
                                                                        ${fileInfo.modalClose}
                                                                        setIsReviewingBooking(false);
                                                                    }
                                                                }}
                                                                className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                                                                title="Remove treatment"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-px h-5 bg-border mx-1"></div>`;

    let replaced = content.replace(guestCounterStartPattern, newTrashBtn);
    if (replaced === content) {
        console.error('Failed to inject new trash button in', fileInfo.path);
    }
    
    fs.writeFileSync(fileInfo.path, replaced);
    console.log('Processed safe bin position for', fileInfo.path);
}

files.forEach(processFile);
