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
            ['User', 'Calendar', 'MapPin', 'ArrowRight'].forEach(icon => {
                if (!icons.includes(icon)) icons.push(icon);
            });
            return `import { ${icons.join(', ')} } from 'lucide-react';`;
        }
    );

    // 2. Add detailsModalTreatment state
    if (!content.includes('detailsModalTreatment')) {
        content = content.replace(
            /const \[isReviewingBooking, setIsReviewingBooking\] = useState\(false\);/,
            `const [isReviewingBooking, setIsReviewingBooking] = useState(false);\n    const [detailsModalTreatment, setDetailsModalTreatment] = useState<any>(null);`
        );
    }

    // 3. Change X button logic (in Complete Booking modal)
    content = content.replace(
        /onClick=\{\(\) => \{\s*setIsBookingModalOpen\(false\);\s*setIsReviewingBooking\(false\);\s*(?:setSelectedCampaignModal\(null\);\s*)?\}\}/g,
        `onClick={() => {
                                                if (isReviewingBooking) {
                                                    setIsReviewingBooking(false);
                                                } else {
                                                    setIsBookingModalOpen(false);
                                                    if (typeof setSelectedCampaignModal !== 'undefined') setSelectedCampaignModal(null);
                                                }
                                            }}`
    );
    
    content = content.replace(
        /onClick=\{\(\) => \{\s*setIsModalOpen\(false\);\s*setIsReviewingBooking\(false\);\s*\}\}/g,
        `onClick={() => {
                                                if (isReviewingBooking) {
                                                    setIsReviewingBooking(false);
                                                } else {
                                                    setIsModalOpen(false);
                                                }
                                            }}`
    );

    // 4. Remove the BACK button and capitalize REVIEW BOOKING
    content = content.replace(
        /\{isReviewingBooking && \(\s*<button[\s\S]*?Back\s*<\/button>\s*\)\}/g,
        ''
    );
    content = content.replace(
        /\{isReviewingBooking \? 'Review Booking' : 'Complete Booking'\}/g,
        "{isReviewingBooking ? 'REVIEW BOOKING' : 'Complete Booking'}"
    );

    // 5. Update cart item inline details to "See Details" button
    const inlineDetailsRegex = /\{isReviewingBooking && \(\(\) => \{[\s\S]*?\}\)\(\)\}/g;
    content = content.replace(inlineDetailsRegex, `{isReviewingBooking && (() => {
                                                            const itemTreatment = treatments.find(t => t.id === item.treatmentId || t.title === item.title);
                                                            if (!itemTreatment || !itemTreatment.desc) return null;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDetailsModalTreatment(itemTreatment)}
                                                                    className="mt-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all flex items-center gap-1"
                                                                >
                                                                    See Details <ArrowRight className="w-3 h-3" />
                                                                </button>
                                                            );
                                                        })()}`);

    // 6. Replace Guest Details Grid
    const oldGuestDetails = /<div className="grid grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<div className="mt-8 pt-6 border-t border-border\/50">/g;
    content = content.replace(oldGuestDetails, `<div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Name</span>
                                                        <span className="text-sm text-primary font-medium">{formData.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Calendar className="w-3 h-3"/> Date</span>
                                                        <span className="text-sm text-primary font-medium">{formData.date}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Clock className="w-3 h-3"/> Time</span>
                                                        <span className="text-sm text-primary font-medium">{formData.time}</span>
                                                    </div>
                                                    <div>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><MapPin className="w-3 h-3"/> Location</span>
                                                        <span className="text-sm text-primary font-medium line-clamp-1">{formData.location} {formData.room ? \`(\${formData.room})\` : ''}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 pt-6 border-t border-border/50">`);

    // 7. Add Full Screen Details Modal
    const modalJSX = `
            {/* Treatment Details Modal */}
            <AnimatePresence>
                {detailsModalTreatment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
                                <h3 className="font-serif text-2xl text-primary">{detailsModalTreatment.title}</h3>
                                <button
                                    onClick={() => setDetailsModalTreatment(null)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-primary" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto no-scrollbar">
                                {(() => {
                                    let whatsIncluded = '';
                                    let desc = detailsModalTreatment.desc;
                                    if (desc) {
                                        const parts = desc.split(/What's Included\\s*:?\\s*/i);
                                        if (parts.length > 1) {
                                            desc = parts[0].trim();
                                            whatsIncluded = parts[1].trim();
                                        }
                                    }
                                    return (
                                        <div className="space-y-8">
                                            {desc && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Description</h4>
                                                    <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                                                </div>
                                            )}
                                            {whatsIncluded && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/80">What's Included</h4>
                                                    <div className="border border-border/80 rounded-2xl overflow-hidden">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-gray-50 border-b border-border/80">
                                                                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/70">Treatment</th>
                                                                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/70 w-1/3">Duration</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border/50">
                                                                {whatsIncluded.split('\\n').filter(Boolean).map((line, i) => {
                                                                    const cleanLine = line.replace(/^-\\s*/, '').trim();
                                                                    const durationMatch = cleanLine.match(/^(\\d+\\s*-\\s*[Mm]inutes?)\\s+(.*)/i) || cleanLine.match(/^(.*)\\s+\\((\\d+\\s*[Mm]inutes?)\\)$/i);
                                                                    
                                                                    let treatmentName = cleanLine;
                                                                    let durationStr = '-';
                                                                    
                                                                    if (durationMatch) {
                                                                        if (cleanLine.match(/^(\\d+\\s*-\\s*[Mm]inutes?)\\s+(.*)/i)) {
                                                                            durationStr = durationMatch[1].replace('-', '').trim();
                                                                            treatmentName = durationMatch[2].trim();
                                                                        } else {
                                                                            treatmentName = durationMatch[1].trim();
                                                                            durationStr = durationMatch[2].trim();
                                                                        }
                                                                    }

                                                                    return (
                                                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                                            <td className="py-3 px-4 text-xs font-medium text-primary">{treatmentName}</td>
                                                                            <td className="py-3 px-4 text-xs text-text-muted flex items-center gap-1.5">
                                                                                {durationStr !== '-' && <Clock className="w-3 h-3 opacity-50" />}
                                                                                {durationStr}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
`;
    const lastAnimatePresence = content.lastIndexOf('</AnimatePresence>');
    if (lastAnimatePresence !== -1) {
        content = content.substring(0, lastAnimatePresence + 18) + '\n' + modalJSX + content.substring(lastAnimatePresence + 18);
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Processed', filePath);
}

files.forEach(processFile);
