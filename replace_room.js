const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/components/LocationClient.tsx',
    'src/app/rituals/[id]/page.tsx'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    const oldLocationSpan = /<span className="text-sm text-primary font-medium line-clamp-1">\{formData\.location\} \{formData\.room \? \`\(\$\{formData\.room\}\)\` : ''\}<\/span>\s*<\/div>/g;
    
    const newLocationSpan = `<span className="text-sm text-primary font-medium line-clamp-1">{formData.location}</span>
                                                    </div>
                                                    {formData.room && (
                                                        <div className="col-span-2 pt-1 mt-1">
                                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><DoorOpen className="w-3 h-3"/> Room Number</span>
                                                            <span className="text-sm text-primary font-medium">{formData.room}</span>
                                                        </div>
                                                    )}`;

    const replaced = content.replace(oldLocationSpan, newLocationSpan);
    if (replaced === content) {
        console.error('Failed to match regex in', filePath);
    }
    fs.writeFileSync(filePath, replaced);
    console.log('Processed room for', filePath);
}

files.forEach(processFile);
