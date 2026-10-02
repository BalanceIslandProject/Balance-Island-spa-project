const fs = require('fs');

function modifyFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add isReviewingBooking state
    if (!content.includes('const [isReviewingBooking')) {
        content = content.replace(
            /const \[isBookingModalOpen,\s*setIsBookingModalOpen\]\s*=\s*useState\(false\);/,
            'const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);\n    const [isReviewingBooking, setIsReviewingBooking] = useState(false);'
        );
    }

    // 2. Modify form submit button and add review section rendering
    // Looking for the form button:
    // <button
    //     type="button"
    //     onClick={(e) => handleCampaignBooking(e)}
    //     disabled={isProcessing}
    
    // We will conditionally render the form vs the review section.
    // Instead of completely changing the JSX structure, let's wrap the form contents.
    
    // Find the complete booking title section
    const completeBookingTitleRegex = /<h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">Complete Booking<\/h2>/;
    
    if (content.match(completeBookingTitleRegex) && !content.includes('isReviewingBooking ? (' )) {
        content = content.replace(
            /<h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">Complete Booking<\/h2>/,
            `{isReviewingBooking && (
                <button 
                    onClick={() => setIsReviewingBooking(false)}
                    className="absolute top-5 left-5 text-text-muted hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg z-10"
                >
                    <ArrowRight className="w-3 h-3 rotate-180" /> Back
                </button>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl text-primary font-medium tracking-tight mb-1">{isReviewingBooking ? 'Review Booking' : 'Complete Booking'}</h2>`
        );
        
        // Wrap the form and add the review block
        const formStartRegex = /<form className="space-y-5 pb-8 sm:pb-0">/;
        content = content.replace(
            formStartRegex,
            `{!isReviewingBooking ? (
                                        <form className="space-y-5 pb-8 sm:pb-0">`
        );
        
        const formEndRegex = /<\/form>/;
        const reviewBlock = `</form>
                                        ) : (
                                        <div className="space-y-5 pb-8 sm:pb-0 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="bg-gray-50 border border-border/80 rounded-xl p-5 space-y-4">
                                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/80 border-b border-border/50 pb-2 mb-2">Guest Details</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="block text-[9px] font-bold uppercase tracking-widest text-text-muted">Name</span>
                                                        <span className="text-sm text-primary font-medium">{formData.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[9px] font-bold uppercase tracking-widest text-text-muted">Date & Time</span>
                                                        <span className="text-sm text-primary font-medium">{formData.date} at {formData.time}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-[9px] font-bold uppercase tracking-widest text-text-muted">Location</span>
                                                        <span className="text-sm text-primary font-medium">{formData.location} {formData.room ? \`(Room: \${formData.room})\` : ''}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 pt-6 border-t border-border/50">
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCampaignBooking(e)}
                                                        disabled={isProcessing}
                                                        className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest disabled:opacity-70"
                                                    >
                                                        {isProcessing ? 'PROCESSING...' : 'CONFIRM ON WHATSAPP'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        )}`;
        content = content.replace(formEndRegex, reviewBlock);
        
        // Change the button in the form from CONFIRM ON WHATSAPP to REVIEW BOOKING
        const originalButtonRegex = /<button[\s\S]*?onClick=\{\(e\) => handleCampaignBooking\(e\)\}[\s\S]*?disabled=\{isProcessing\}[\s\S]*?className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary\/90 hover:scale-\[1.02\] transition-all duration-300 shadow-\[0_8px_24px_rgb\(0,0,0,0.15\)\] uppercase tracking-widest disabled:opacity-70"[\s\S]*?>[\s\S]*?\{isProcessing \? 'PROCESSING\.\.\.' : 'CONFIRM ON WHATSAPP'\}[\s\S]*?<\/button>/;
        
        content = content.replace(originalButtonRegex, `<button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!formData.name || !formData.date || !formData.time || !formData.location) {
                                                                alert('Please fill in all required fields (Name, Date, Time, Location).');
                                                                return;
                                                            }
                                                            setIsReviewingBooking(true);
                                                        }}
                                                        className="w-full bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_24px_rgb(0,0,0,0.15)] uppercase tracking-widest"
                                                    >
                                                        REVIEW BOOKING
                                                    </button>`);
                                                    
        // Make sure closing modal resets state
        content = content.replace(/setIsBookingModalOpen\(false\);/g, 'setIsBookingModalOpen(false);\n                                                setIsReviewingBooking(false);');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

modifyFile('src/app/page.tsx');
modifyFile('src/components/LocationClient.tsx');
console.log('Modified both files.');
