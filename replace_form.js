const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Add lucide icons
    content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'lucide-react';/,
        (match, p1) => {
            const icons = p1.split(',').map(s => s.trim());
            ['User', 'Calendar', 'MapPin', 'Clock', 'Home', 'Tag'].forEach(icon => {
                if (!icons.includes(icon)) icons.push(icon);
            });
            return `import { ${icons.join(', ')} } from 'lucide-react';`;
        }
    );

    // 2. Capitalize Complete Booking
    content = content.replace(
        /\{isReviewingBooking \? 'REVIEW BOOKING' : 'Complete Booking'\}/g,
        "{isReviewingBooking ? 'REVIEW BOOKING' : 'COMPLETE BOOKING'}"
    );

    // 3. Add icons to form labels
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Guest Name<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><User className="w-3.5 h-3.5"/> Guest Name</label>'
    );
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Date<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Calendar className="w-3.5 h-3.5"/> Date</label>'
    );
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Time<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Clock className="w-3.5 h-3.5"/> Time</label>'
    );
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Villa \/ Hotel Name<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><MapPin className="w-3.5 h-3.5"/> Villa / Hotel Name</label>'
    );
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Room Number \(Optional\)<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Home className="w-3.5 h-3.5"/> Room Number (Optional)</label>'
    );
    content = content.replace(
        /<label className="text-\[10px\] font-bold uppercase tracking-widest text-primary\/80 ml-1">Promo Code<\/label>/g,
        '<label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 ml-1"><Tag className="w-3.5 h-3.5"/> Promo Code</label>'
    );

    fs.writeFileSync(filePath, content);
    console.log('Processed', filePath);
}

files.forEach(processFile);
