const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Import useCart and uuid (or just generate random ID)
    if (!content.includes('useCart')) {
        content = content.replace(/import \{ SpaProvider \}/, "import { useCart } from '@/context/CartContext';\nimport { SpaProvider }");
        // fallback if SpaProvider is not there
        if (!content.includes('useCart')) {
            content = content.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport { useCart } from '@/context/CartContext';");
        }
    }

    // 2. Inject useCart inside the component
    if (!content.includes('const { saveDraft, confirmBooking } = useCart();')) {
        // Find the main component function declaration
        const compRegex = /(export default function [A-Za-z0-9_]+\([^)]*\)\s*\{|const LocationClient = \([^)]*\) =>\s*\{)/;
        content = content.replace(compRegex, `$1\n    const { saveDraft, confirmBooking } = useCart();\n    const bookingIdRef = React.useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));\n`);
    }

    // 3. Inject logic when WhatsApp is confirmed
    // The WhatsApp message is built and sent in handleWhatsAppClick or similar
    const whatsappRegex = /const waUrl = \`https:\/\/wa\.me\/\$\{siteBrand\.phone\.replace\(\/\[\^0-9\]\/g, ''\)\}\?text=\$\{encodeURIComponent\(text\)\}\`;/g;
    
    // We need to add the invoice link to the text
    const newWaLogic = `const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current;
            text += '\\n\\n🧾 *View Your Invoice:* ' + invoiceUrl;
            
            // Save to confirmed cart
            saveDraft({
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: total
            });
            
            const waUrl = \`https://wa.me/\${siteBrand.phone.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent(text)}\`;`;
    content = content.replace(whatsappRegex, newWaLogic);

    // 4. Handle modal closing (draft)
    // There are several setIsBookingModalOpen(false) or setIsModalOpen(false)
    // We can hook into the X button click on the modal.
    // The X button on the modal is: <button onClick={() => setIsBookingModalOpen(false)}
    const closeBtnRegex = /<button\s+onClick=\{\(\) => (setIsBookingModalOpen\(false\)|setIsModalOpen\(false\))\}/g;
    const newCloseBtn = `<button 
                                onClick={() => {
                                    if (cartItems.length > 0) {
                                        saveDraft({
                                            id: bookingIdRef.current,
                                            date: new Date().toISOString(),
                                            status: 'draft',
                                            items: cartItems,
                                            customerDetails: formData,
                                            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
                                        });
                                    }
                                    $1;
                                }}`;
    content = content.replace(closeBtnRegex, newCloseBtn);

    fs.writeFileSync(filePath, content);
    console.log('Processed cart logic for', filePath);
}

files.forEach(processFile);
