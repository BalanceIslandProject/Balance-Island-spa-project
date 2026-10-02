const fs = require('fs');

const topNavPath = 'src/components/TopNav.tsx';
let content = fs.readFileSync(topNavPath, 'utf-8');

content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, (match, p1) => {
    return `import { ${p1}, ShoppingBag, FileText, CheckCircle2 } from 'lucide-react';`;
});
content = content.replace(/import Link from 'next\/link';/, `import Link from 'next/link';\nimport { useCart } from '@/context/CartContext';`);
content = content.replace(/const \[isScrolled, setIsScrolled\] = useState\(false\);/, `const [isScrolled, setIsScrolled] = useState(false);\n    const [isCartOpen, setIsCartOpen] = useState(false);\n    const { history, removeHistory } = useCart();`);

const toggleBtnPattern = /\{\/\* Dropdown Toggle Button \(Visible on mobile ALWAYS\) \*\/\}/g;
const cartIconHtml = `
                <div className="flex items-center gap-2 shrink-0 md:hidden">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-primary transition-colors hover:bg-black/5 relative"
                        aria-label="Open Cart"
                    >
                        <ShoppingBag size={18} />
                        {history.length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                    {/* Dropdown Toggle Button (Visible on mobile ALWAYS) */}`;
content = content.replace(toggleBtnPattern, cartIconHtml);

const desktopNavPattern = /<\/nav>/g;
const desktopCartBtn = `</nav>
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-primary transition-colors hover:bg-black/5 relative shrink-0"
                    aria-label="Open Cart"
                >
                    <ShoppingBag size={18} />
                    {history.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </button>`;
content = content.replace(desktopNavPattern, desktopCartBtn);

content = content.replace(/return \(\s*<div/g, 'return (\n        <>\n        <div');

const endOfReturn = /<\/header>\s*<\/div>/g;
const cartSlideOver = `</header>
        </div>

        {/* Cart Slide-over */}
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-5 flex items-center justify-between border-b border-border/50">
                            <h2 className="font-serif text-lg text-primary tracking-wide font-medium">YOUR BOOKINGS</h2>
                            <button 
                                onClick={() => setIsCartOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center text-text-muted mt-10">
                                    <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No bookings yet.</p>
                                </div>
                            ) : (
                                history.map((booking) => (
                                    <div key={booking.id} className="bg-white border border-border/80 rounded-2xl p-4 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                {booking.status === 'confirmed' ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                                                        <CheckCircle2 size={10} /> Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 mb-1 block">
                                                        Draft Booking
                                                    </span>
                                                )}
                                                <div className="text-xs font-semibold text-primary">{booking.customerDetails?.name}</div>
                                                <div className="text-[10px] text-text-muted">{new Date(booking.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-serif font-medium text-primary">IDR {booking.totalPrice?.toLocaleString('en-US')}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                            <button 
                                                onClick={() => removeHistory(booking.id)}
                                                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
                                            
                                            {booking.status === 'confirmed' ? (
                                                <Link 
                                                    href={\`/invoice/\${booking.id}\`}
                                                    onClick={() => setIsCartOpen(false)}
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                                                >
                                                    <FileText size={12} /> View Invoice
                                                </Link>
                                            ) : (
                                                <span className="text-[10px] text-text-muted italic">Incomplete</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>`;

content = content.replace(endOfReturn, cartSlideOver);
fs.writeFileSync(topNavPath, content);
console.log('TopNav updated correctly');
