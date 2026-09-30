const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                            <span className="domain-therapick-only">
                                Premium Bali Massage, <br />
                                <span className="italic opacity-80">At Your Door.</span>
                            </span>`;

content = content.replace(target, '');
fs.writeFileSync(file, content, 'utf8');
