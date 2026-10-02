const fs = require('fs');
let content = fs.readFileSync('src/components/TopNav.tsx', 'utf-8');

// The missing </div> is right before {/* Dropdown Menu (Mobile Only) */}
content = content.replace(/\{\/\* Dropdown Menu \(Mobile Only\) \*\/\}/, '</div>\n\n                {/* Dropdown Menu (Mobile Only) */}');

fs.writeFileSync('src/components/TopNav.tsx', content);
