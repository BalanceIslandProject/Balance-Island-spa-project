const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    const regex = /const baseMessage = \`\(\.\*\?\)Hello! I would like to confirm this booking.\`;\s*const waUrl = \`https:\/\/wa\.me\/\$\{waNumber\}\?text=\$\{encodeURIComponent\(baseMessage\)\}\`;/s;
    
    // Some components might have let baseMessage instead of const baseMessage already, or different waNumber.
    // Let's use a simpler string replace

    const targetStr1 = 'const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(baseMessage)}`;';
    const targetStr2 = 'const waUrl = `https://wa.me/${siteBrand.phone.replace(/[^0-9]/g, \'\')}?text=${encodeURIComponent(baseMessage)}`;';

    const insertBlock = `
            const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current;
            const finalMessage = baseMessage + '\\n\\n🧾 *View Your Invoice:* ' + invoiceUrl;
            
            saveDraft({
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
            });
    `;

    if (content.includes(targetStr1)) {
        content = content.replace(targetStr1, insertBlock + '\n            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(finalMessage)}`;');
    } else if (content.includes(targetStr2)) {
        content = content.replace(targetStr2, insertBlock + '\n            const waUrl = `https://wa.me/${siteBrand.phone.replace(/[^0-9]/g, \'\')}?text=${encodeURIComponent(finalMessage)}`;');
    }

    // Now fix the close button to save as draft
    // But wait, the previous script DID inject something into the close button:
    // <button onClick={() => { if (cartItems.length > 0) { saveDraft({...}) } setIsBookingModalOpen(false); }}
    // Let's verify if the previous script ran properly for the close button.

    fs.writeFileSync(filePath, content);
    console.log('Fixed WhatsApp injection for', filePath);
}

files.forEach(processFile);
