const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace(/\\.aspect-\\[4\\\\\/5\\]/g, '.aspect-\\\\[4\\\\/5\\\\]');
css = css.replace(/\\.bg-\\\\\\[\\\\#1D1D1F\\\\\\]/g, '.bg-\\\\[\\\\#1D1D1F\\\\]');
fs.writeFileSync('src/app/globals.css', css);
