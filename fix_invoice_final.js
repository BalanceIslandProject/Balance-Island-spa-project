const fs = require('fs');

// 1. Fix the invoice generation files
const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    const regex = /const invoiceUrl = window\.location\.origin \+ '\/invoice\/' \+ bookingIdRef\.current \+ '\?d=' \+ encodeURIComponent\(btoa\(JSON\.stringify\(minInvoice\)\)\);/g;
    content = content.replace(regex, "const invoiceUrl = window.location.origin + '/invoice/' + bookingIdRef.current;");
    fs.writeFileSync(filePath, content);
});

// 2. Fix the invoice page UI
const invoicePath = 'src/app/invoice/[id]/page.tsx';
let invoiceContent = fs.readFileSync(invoicePath, 'utf-8');

// Fix the INV-INV- issue
invoiceContent = invoiceContent.replace(/INV-\{booking\.id\.toUpperCase\(\)\.substring\(0, 8\)\}/, "{booking.id.toUpperCase().substring(0, 10)}");

// Fix the "Luxury Spa Services" text
invoiceContent = invoiceContent.replace(/<p className="text-center text-xs text-text-muted">\{'Luxury Spa Services'\}<\/p>/, '<p className="text-center text-xs text-text-muted">Elexoir Home Spa Ubud</p>');

// Hide global floating elements if they are present by returning a layout wrapper or adding a class to hide them
// Actually, the invoice is rendered inside `layout.tsx` which probably includes a TopNav or FloatingNav.
// I will just add some global CSS or hide it via context.
// Or I can just hide `.floating-nav` using a style tag on the invoice page!
const styleTag = `
                <style dangerouslySetInnerHTML={{__html: \`
                    footer, .floating-nav, #floating-nav, .mobile-nav { display: none !important; }
                \`}} />
`;
invoiceContent = invoiceContent.replace(/<div className="min-h-\[100dvh\] bg-secondary\/30 pt-20 pb-24 px-4 sm:px-6">/, '<div className="min-h-[100dvh] bg-secondary/30 pt-20 pb-24 px-4 sm:px-6">' + styleTag);

fs.writeFileSync(invoicePath, invoiceContent);

console.log('Fixed everything');
