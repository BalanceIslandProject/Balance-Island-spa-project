const fs = require('fs');

const invoicePath = 'src/app/invoice/[id]/page.tsx';
let invoiceContent = fs.readFileSync(invoicePath, 'utf-8');

// We will remove the large base64 data parameter, and instead use small query params
// Let's replace the useEffect in invoice/[id]/page.tsx

const effectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[params, history, searchParams\]\);/s;
const newEffect = `useEffect(() => {
        if (params?.id) {
            const dataParam = searchParams.get('d');
            if (dataParam) {
                try {
                    // d param is base64 encoded compressed JSON
                    const decoded = JSON.parse(atob(decodeURIComponent(dataParam)));
                    setBooking(decoded);
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed to decode invoice data', e);
                }
            }
            // Fallback to local history
            const found = history.find(h => h.id === params.id);
            if (found) {
                setBooking(found);
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [params, history, searchParams]);`;

invoiceContent = invoiceContent.replace(effectRegex, newEffect);
fs.writeFileSync(invoicePath, invoiceContent);


const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Find the old invoiceDataObj and replace it with a minimized version
    const oldUrlRegex = /const invoiceDataObj = \{[\s\S]*?\};\s*const invoiceUrl = window\.location\.origin \+ '\/invoice\/' \+ bookingIdRef\.current \+ '\?data=' \+ encodeURIComponent\(btoa\(JSON\.stringify\(invoiceDataObj\)\)\);/s;
    
    const newUrlLogic = `
            const minInvoice = {
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems.map(i => ({ title: i.title, duration: i.duration, guests: i.guests, price: i.price })),
                customerDetails: { name: formData.name, date: formData.date, time: formData.time, location: formData.location, room: formData.room || '' },
                totalPrice: typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
            };
            const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current + '?d=' + encodeURIComponent(btoa(JSON.stringify(minInvoice)));
    `;

    content = content.replace(oldUrlRegex, newUrlLogic);
    fs.writeFileSync(filePath, content);
}

files.forEach(processFile);
console.log('Compressed URLs');
