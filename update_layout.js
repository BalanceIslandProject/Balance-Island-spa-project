const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace the Guest Details grid
    const oldGridRegex = /<div className="grid grid-cols-2 gap-5">[\s\S]*?(?:<DoorOpen className="w-3 h-3"\/> Room Number<\/span>\s*<span className="text-sm text-primary font-medium">\{formData\.room\}<\/span>\s*<\/div>\s*\)\}\s*<\/div>|<\/span>\s*<\/div>\s*<\/div>)/g;
    
    const newGrid = `<div className="grid grid-cols-3 gap-3 sm:gap-5 items-center">
                                                    <div className="flex flex-col gap-5">
                                                        <div>
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Name</span>
                                                            <span className="text-sm text-primary font-medium">{formData.name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Calendar className="w-3 h-3"/> Date</span>
                                                            <span className="text-sm text-primary font-medium">{formData.date}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-center justify-center text-center border-x border-border/50 px-2 h-full py-2">
                                                        <span className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2"><Clock className="w-3 h-3"/> Time</span>
                                                        <span className="text-xl sm:text-2xl text-primary font-serif font-medium">{formData.time}</span>
                                                    </div>

                                                    <div className="flex flex-col gap-5">
                                                        <div>
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><MapPin className="w-3 h-3"/> Location</span>
                                                            <span className="text-sm text-primary font-medium line-clamp-2 leading-tight">{formData.location}</span>
                                                        </div>
                                                        {formData.room && (
                                                            <div>
                                                                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><DoorOpen className="w-3 h-3"/> Room</span>
                                                                <span className="text-sm text-primary font-medium line-clamp-1">{formData.room}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>`;

    let replaced = content.replace(oldGridRegex, newGrid);
    if (replaced === content) {
        console.error('Failed to match regex in', filePath);
    }
    fs.writeFileSync(filePath, replaced);
    console.log('Processed layout for', filePath);
}

files.forEach(processFile);
