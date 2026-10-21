'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, X, Plus, Minus, CheckCircle2, Heart, Star, MapPin, ChevronRight, Menu, Home, Trash2 } from 'lucide-react';
import { useSpa, Product } from '@/context/SpaContext';

export default function StorePage() {
    const { products, cartItems, addToCart, updateCartQuantity, removeFromCart, clearCart } = useSpa();
    const [activeCategory, setActiveCategory] = useState('All');

    // Modal & Checkout States
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCheckout, setIsCheckout] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'Description' | 'How To Use' | 'Ingredients'>('Description');

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', notes: ''
    });

    const cartTotalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const getGlobalCartTotal = () => {
        let total = 0;
        cartItems.forEach(item => {
            const numericPrice = parseInt(item.product.price.replace(/,/g, ''), 10);
            total += numericPrice * item.quantity;
        });
        return `Rp ${total.toLocaleString('id-ID')}`;
    };

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        return activeCategory === 'All' || p.category === activeCategory;
    });

    // Handle scroll lock when modal is open
    useEffect(() => {
        if (selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedProduct]);

    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsProcessing(true);

            let total = 0;
            let itemsList: string[] = [];
            cartItems.forEach(item => {
                const numericPrice = parseInt(item.product.price.replace(/,/g, ''), 10);
                total += numericPrice * item.quantity;
                itemsList.push(`${item.quantity}x ${item.product.title} (Rp ${(numericPrice * item.quantity).toLocaleString('id-ID')})`);
            });

            const websiteSource = typeof window !== 'undefined' ? window.location.hostname : 'Unknown';
            const waNumber = '6285174119423';
            const baseMessage = `*NEW STORE ORDER*\n${websiteSource}\n\n*ITEMS:*\n${itemsList.join('\n')}\n\n*TOTAL PRICE:* Rp ${total.toLocaleString('id-ID')}\n\n*CUSTOMER DETAILS:*\n- Name: ${formData.name}\n- Phone: ${formData.phone}\n- Address: ${formData.address}\n\nHello! I would like to place this order.`;

            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(baseMessage)}`;
            clearCart();
            window.location.href = waUrl;
        } catch (error) {
            console.error(error);
            alert('An error occurred during checkout.');
            setIsProcessing(false);
        }
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setTimeout(() => {
            setQuantity(1);
            setActiveTab('Description');
        }, 300); // Wait for exit animation
    };

    const closeCheckout = () => {
        setIsCheckout(false);
        setTimeout(() => {
            setIsSuccess(false);
            setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
        }, 300);
    };

    const handleAddToCart = () => {
        if (selectedProduct) {
            addToCart(selectedProduct, quantity);
            closeModal();
        }
    };

    const handleQuantityChange = (type: 'inc' | 'dec') => {
        if (type === 'inc') {
            setQuantity(prev => prev + 1);
        } else if (type === 'dec' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const getTotalPrice = (priceStr: string, qty: number) => {
        const numericPrice = parseInt(priceStr.replace(/,/g, ''), 10);
        return (numericPrice * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="min-h-screen bg-[#F8F9F9] pt-6 md:pt-12 pb-32 font-sans">
            <div className="max-w-[1400px] mx-auto px-6 md:px-8">
                {/* Header Nav */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="w-10 h-10 flex items-center justify-start text-[#2B2B2B]">
                        <Home size={24} strokeWidth={1.5} />
                    </Link>
                    <div className="flex items-center gap-5">
                        <button className="text-[#2B2B2B] hover:opacity-70"><Search size={22} strokeWidth={1.5} /></button>
                        <div className="relative">
                            <button onClick={() => setIsCheckout(true)} className="text-[#2B2B2B] hover:opacity-70"><ShoppingBag size={22} strokeWidth={1.5} /></button>
                            {cartTotalQuantity > 0 && (
                                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border border-[#F8F9F9] flex items-center justify-center text-[9px] font-bold text-white">{cartTotalQuantity}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[#2B2B2B] tracking-tight leading-[1.2] mb-6 max-w-[280px] md:max-w-md scroll-reveal">
                    Elexoir Signature Collection
                </h1>

                {/* Categories */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide w-full mb-6 scroll-reveal">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 border ${activeCategory === cat
                                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B]'
                                    : 'bg-transparent border-[#E5E7EB] text-[#6B7280]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center col-span-full relative overflow-hidden rounded-[40px] bg-[#F5F5F7] scroll-reveal">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <h3 className="text-2xl md:text-3xl font-medium text-[#1D1D1F] tracking-tight mb-2">No Products Found</h3>
                            <p className="text-[#86868B] max-w-sm mx-auto text-sm font-medium px-4">Try selecting a different category or check back later.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 scroll-reveal-stagger">
                        {filteredProducts.map((product, i) => (
                            <div
                                key={product.id}
                                className="cursor-pointer outline-none h-full"
                                onClick={() => product.stock > 0 && setSelectedProduct(product)}
                            >
                                <div className="bg-white border border-[#E5E7EB] rounded-[24px] flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative group p-2">

                                    {/* Image */}
                                    <div className="aspect-[4/5] relative bg-[#F5F5F7] overflow-hidden rounded-[16px]">
                                        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex flex-col flex-grow px-2 md:px-3 pt-3 pb-2">
                                        <p className="text-gray-400 text-[11px] font-medium mb-1 line-clamp-1">{product.category || 'Elexoir'}</p>
                                        <h4 className="font-bold text-gray-900 text-[13px] md:text-sm line-clamp-1 mb-4">{product.title}</h4>

                                        {/* Price and Add Button */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-full p-1 pl-3 mt-auto border border-gray-100">
                                            <span className="font-semibold text-gray-900 text-[13px] md:text-sm">Rp {parseInt(product.price.replace(/,/g, '')).toLocaleString('id-ID')}</span>
                                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-black transition-colors shrink-0 shadow-sm">
                                                <Plus size={18} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 bg-white md:bg-black/40 md:backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full h-[100svh] md:max-w-md md:h-[90vh] bg-white rounded-none md:rounded-[40px] flex flex-col relative shadow-2xl mx-auto overflow-hidden"
                        >
                            {/* Top Nav */}
                            <div className="absolute top-6 left-6 right-6 flex justify-between z-20 pointer-events-none">
                                <button onClick={closeModal} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-[#2B2B2B] shadow-sm hover:scale-105 transition-transform pointer-events-auto">
                                    <ChevronRight className="rotate-180" size={24} strokeWidth={2} />
                                </button>
                            </div>

                            {/* Image Section */}
                            <div className="h-[45%] bg-[#F5F5F7] relative flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={selectedProduct.image} className="w-full h-full object-cover mix-blend-multiply" />
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
                                <div className="flex justify-between items-start mb-1">
                                    <h2 className="font-bold text-2xl text-[#2B2B2B] flex-1 pr-4">{selectedProduct.title}</h2>
                                </div>
                                <p className="text-sm text-[#9CA3AF] mb-6">{selectedProduct.category} • 100ml</p>

                                <div className="flex gap-6 border-b border-[#F3F4F6] mb-6">
                                    {['Description', 'How To Use', 'Ingredients'].map(tab => (
                                        <button
                                            key={tab} onClick={() => setActiveTab(tab as any)}
                                            className={`pb-3 text-sm font-medium relative ${activeTab === tab ? 'text-[#2B2B2B]' : 'text-[#9CA3AF]'}`}
                                        >
                                            {tab}
                                            {activeTab === tab && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B2B2B] rounded-t-full"></motion.div>}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-[#6B7280] text-sm leading-relaxed whitespace-pre-wrap">
                                    {activeTab === 'Description' && selectedProduct.description}
                                    {activeTab === 'How To Use' && (selectedProduct.howToUse || 'No instructions provided.')}
                                    {activeTab === 'Ingredients' && (selectedProduct.ingredients || 'No ingredients provided.')}
                                </p>
                            </div>

                            {/* Sticky Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F3F4F6] p-4 pb-6 md:pb-4 z-30">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[10px] text-[#9CA3AF] mb-0.5">Price</p>
                                        <p className="font-bold text-xl text-[#2B2B2B]">Rp {parseInt(selectedProduct.price.replace(/,/g, '')).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="flex items-center gap-3 border border-[#E5E7EB] rounded-lg px-2 py-1">
                                        <button onClick={() => handleQuantityChange('dec')} className="w-6 h-6 flex items-center justify-center text-[#2B2B2B] disabled:opacity-30 hover:bg-[#F3F4F6] rounded-md transition-colors" disabled={quantity <= 1}><Minus size={14} /></button>
                                        <span className="font-bold text-xs w-4 text-center">{quantity}</span>
                                        <button onClick={() => handleQuantityChange('inc')} className="w-6 h-6 flex items-center justify-center text-[#2B2B2B] hover:bg-[#F3F4F6] rounded-md transition-colors"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <button onClick={handleAddToCart} className="w-full bg-[#2B2B2B] text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition-colors">
                                    Add to Cart
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cart / Checkout Modal */}
            <AnimatePresence>
                {isCheckout && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 bg-white md:bg-black/40 md:backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full h-[100svh] md:max-w-md md:h-[90vh] bg-[#F8F9F9] rounded-none md:rounded-[40px] flex flex-col relative shadow-2xl mx-auto overflow-hidden"
                        >
                            {/* Top Nav */}
                            <div className="flex items-center justify-between px-6 py-6 border-b border-[#E5E7EB] bg-white shrink-0">
                                <button onClick={closeCheckout} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#E5E7EB] text-[#2B2B2B] hover:bg-[#F3F4F6]">
                                    <ChevronRight className="rotate-180" size={20} />
                                </button>
                                <h3 className="font-bold text-base text-[#2B2B2B]">Order Details</h3>
                                <div className="w-10"></div>
                            </div>

                            {!isSuccess ? (
                                <div className="flex-1 overflow-y-auto px-6 py-6 pb-40">
                                    <h4 className="font-medium text-sm text-[#2B2B2B] mb-4">My Cart</h4>

                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-[#9CA3AF] mb-4">Your cart is empty.</p>
                                            <button onClick={closeCheckout} className="bg-[#2B2B2B] text-white px-6 py-3 rounded-xl font-bold text-sm">Continue Shopping</button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Cart Items */}
                                            {cartItems.map((item) => (
                                                <div key={item.product.id} className="flex items-center gap-4 mb-4 bg-white p-3 rounded-2xl shadow-sm border border-[#F3F4F6] relative">
                                                    <div className="w-20 h-20 bg-[#EDF0F2] rounded-xl flex items-center justify-center p-2 shrink-0">
                                                        <img src={item.product.image} className="w-full h-full object-cover mix-blend-multiply" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <h5 className="font-bold text-sm text-[#2B2B2B] truncate">{item.product.title}</h5>
                                                        <p className="text-xs text-[#9CA3AF] mb-1 truncate">{item.product.category} • 100ml</p>
                                                        <p className="font-bold text-[#2B2B2B]">Rp {parseInt(item.product.price.replace(/,/g, '')).toLocaleString('id-ID')}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <button onClick={() => removeFromCart(item.product.id)} className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-1" title="Remove Item">
                                                            <Trash2 size={16} className="text-[#EF4444]" />
                                                        </button>
                                                        <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-1 py-1">
                                                            <button type="button" onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="w-6 h-6 flex items-center justify-center text-[#2B2B2B] hover:bg-[#F3F4F6] rounded disabled:opacity-30" disabled={item.quantity <= 1}><Minus size={12} /></button>
                                                            <span className="font-bold text-xs w-3 text-center">{item.quantity}</span>
                                                            <button type="button" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-[#2B2B2B] hover:bg-[#F3F4F6] rounded"><Plus size={12} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button onClick={closeCheckout} className="w-full py-3 mb-8 border-2 border-dashed border-[#E5E7EB] rounded-xl font-bold text-sm text-[#2B2B2B] hover:bg-white transition-colors flex items-center justify-center gap-2">
                                                <Plus size={16} /> Add More Products
                                            </button>

                                            <h4 className="font-medium text-sm text-[#2B2B2B] mb-4">Delivery Address</h4>
                                            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3 mb-8">
                                                <div className="relative shadow-sm">
                                                    <MapPin className="absolute left-4 top-3.5 text-[#2B2B2B]" size={18} />
                                                    <input required type="text" placeholder="Full Address..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#2B2B2B] transition-colors" />
                                                </div>
                                                <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#2B2B2B] transition-colors shadow-sm" />
                                                <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#2B2B2B] transition-colors shadow-sm" />
                                            </form>

                                            <div className="flex gap-2 mb-8">
                                                <input type="text" placeholder="Enter promo code" className="flex-1 bg-white border border-[#E5E7EB] shadow-sm rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2B2B2B] transition-colors" />
                                                <button className="bg-[#2B2B2B] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors">Apply</button>
                                            </div>

                                            <div className="space-y-3 pt-6 border-t border-dashed border-[#E5E7EB]">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[#9CA3AF]">Total items ({cartTotalQuantity})</span>
                                                    <span className="text-[#9CA3AF]">{getGlobalCartTotal()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[#9CA3AF]">Shipping</span>
                                                    <span className="text-[#9CA3AF]">Rp 0</span>
                                                </div>
                                                <div className="flex justify-between text-base font-bold text-[#2B2B2B] pt-3">
                                                    <span>Total payment</span>
                                                    <span>{getGlobalCartTotal()}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-white flex-1">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-100">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="font-bold text-2xl text-[#2B2B2B] mb-2">Order Confirmed</h3>
                                    <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">Your order has been received. We will contact you shortly.</p>
                                    <button onClick={closeCheckout} className="w-full max-w-xs bg-[#2B2B2B] text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">Back to Store</button>
                                </div>
                            )}

                            {/* Sticky Checkout Bottom */}
                            {!isSuccess && cartItems.length > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-[#F8F9F9] p-6 pb-8 md:pb-6 pt-4 border-t border-[#E5E7EB]">
                                    <button type="submit" form="checkout-form" disabled={isProcessing} className="w-full bg-[#2B2B2B] text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center">
                                        {isProcessing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Processing...
                                            </span>
                                        ) : 'Place Order'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
