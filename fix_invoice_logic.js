const fs = require('fs');

// 1. Fix invoice pricing logic in src/app/invoice/[id]/page.tsx
const invoicePath = 'src/app/invoice/[id]/page.tsx';
let invoiceContent = fs.readFileSync(invoicePath, 'utf-8');

// Parse query params in InvoicePage
const routerImportRegex = /import \{ useParams, useRouter \} from 'next\/navigation';/;
invoiceContent = invoiceContent.replace(routerImportRegex, "import { useParams, useRouter, useSearchParams } from 'next/navigation';");

const paramsRegex = /const params = useParams\(\);/;
invoiceContent = invoiceContent.replace(paramsRegex, "const params = useParams();\n    const searchParams = useSearchParams();");

const effectRegex = /useEffect\(\(\) => \{\n\s*if \(params\?\.id\) \{\n\s*const found = history\.find\(h => h\.id === params\.id\);\n\s*if \(found\) \{\n\s*setBooking\(found\);\n\s*\}\n\s*\}\n\s*\}, \[params, history\]\);/;
const newEffect = `useEffect(() => {
        if (params?.id) {
            // First check URL for encoded data (for shareable links)
            const dataParam = searchParams.get('data');
            if (dataParam) {
                try {
                    const decoded = JSON.parse(atob(decodeURIComponent(dataParam)));
                    setBooking(decoded);
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
        }
    }, [params, history, searchParams]);`;
invoiceContent = invoiceContent.replace(effectRegex, newEffect);

// Fix the pricing for couples/honeymoon
const priceRegex = /\{Math\.round\(item\.price \* item\.guests\)\.toLocaleString\('en-US'\)\}/g; // Oh wait, I didn't use Math.round. 
const actualPriceRegex = /\{\(item\.price \* item\.guests\)\.toLocaleString\('en-US'\)\}/g;
const newPriceLogic = `{(() => {
                                            const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                                            const multiplier = isCouple ? (item.guests / 2) : item.guests;
                                            return (item.price * multiplier).toLocaleString('en-US');
                                        })()}`;
invoiceContent = invoiceContent.replace(actualPriceRegex, newPriceLogic);

fs.writeFileSync(invoicePath, invoiceContent);
console.log('Fixed invoice logic');

// 2. Fix the link generation in page.tsx, LocationClient.tsx, rituals/[id]/page.tsx
const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Make bookingIdRef generate a nice ID instead of UUID
    // Find: const bookingIdRef = React.useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));
    const uuidRegex = /const bookingIdRef = React\.useRef<string>\(.*?\);/g;
    content = content.replace(uuidRegex, "const bookingIdRef = React.useRef<string>('INV-' + Math.random().toString(36).substring(2, 8).toUpperCase());");

    // Replace the URL generator
    // Find: const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current;
    // Replace with: const invoiceData = encodeURIComponent(btoa(JSON.stringify({...}))); const invoiceUrl = ... + '?data=' + invoiceData;

    const invoiceUrlRegex = /const invoiceUrl = window\.location\.origin \+ '\/invoice\/' \+ bookingIdRef\.current;/g;
    const newInvoiceUrl = `
            const invoiceDataObj = {
                id: bookingIdRef.current,
                date: new Date().toISOString(),
                status: 'confirmed',
                items: cartItems,
                customerDetails: formData,
                totalPrice: typeof totalPrice !== 'undefined' ? totalPrice : cartItems.reduce((sum, item) => sum + (item.price * item.guests), 0)
            };
            const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current + '?data=' + encodeURIComponent(btoa(JSON.stringify(invoiceDataObj)));
    `;
    content = content.replace(invoiceUrlRegex, newInvoiceUrl);

    // Because I need to keep the UI clean, I don't want a massive link inside the WhatsApp text if possible.
    // Actually, whatsapp link shortening is hard. We will use the long link.

    fs.writeFileSync(filePath, content);
    console.log('Fixed link generation in', filePath);
}

files.forEach(processFile);
