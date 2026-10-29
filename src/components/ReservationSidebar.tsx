import React from 'react';
import { Trash2, X, ChevronRight, Plus, Minus, Calendar, Clock, MapPin, User, Home } from 'lucide-react';
import { formatPrice, SERVICES } from '@/lib/constants';
import LocationAutocomplete from './LocationAutocomplete';
import { motion } from 'framer-motion';

interface CartItem {
    id: string;
    serviceId: string;
    name: string;
    duration: string;
    priceStr: string;
    numericPrice: number;
    guests: number;
}

interface Props {
    cart: CartItem[];
    bookingDetails: any;
    setBookingDetails: any;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, delta: number) => void;
    total: number;
    onCheckout: () => void;
    onClose?: () => void;
    className?: string;
}

const ReservationSidebar: React.FC<Props> = ({ 
    cart, 
    bookingDetails, 
    setBookingDetails, 
    onRemove, 
    onUpdateQuantity, 
    total, 
    onCheckout, 
    onClose, 
    className = "" 
}) => {

    // Helper to get image for cart item
    const getServiceImage = (serviceId: string) => {
        const service = SERVICES.find(s => s.id === serviceId);
        return service ? service.image : '';
    };

    return (
        <div className={`bg-background/95 backdrop-blur-xl h-full flex flex-col relative border-l border-border/80 ${className} font-sans`}>

            {/* Header */}
            <div className="px-8 pt-10 pb-6 shrink-0 flex justify-between items-end bg-background border-b border-border/60 z-10 relative">
                <div>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-accent mb-2.5 block">My Sanctuary</span>
                    <h2 className="font-serif font-normal text-4xl text-primary leading-tight">Your Rituals</h2>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose} 
                        className="p-2.5 rounded-full border border-border/80 text-text-muted hover:text-primary hover:border-primary/50 hover:bg-surface/50 transition-all duration-300"
                        aria-label="Close drawer"
                    >
                        <X size={18} strokeWidth={1.5} />
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-8 bg-[#FAF9F5]/40">

                {/* Cart Items Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Curated Selections</span>
                        <div className="h-[1px] bg-border/60 flex-grow"></div>
                    </div>

                    {cart.length === 0 ? (
                        <div className="py-16 px-4 bg-surface/30 border border-dashed border-border/60 flex flex-col items-center justify-center text-center rounded-xl">
                            <div className="w-12 h-12 border border-border/80 flex items-center justify-center mb-4 text-accent/80 rounded-full bg-background">
                                <Clock size={18} strokeWidth={1.5} />
                            </div>
                            <p className="font-serif text-xl text-primary mb-1">Empty Ritual</p>
                            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-muted">Select a treatment to begin your journey</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    className="bg-background/80 border border-border/60 p-4 flex gap-4 rounded-xl shadow-soft group relative"
                                >
                                    {/* Thumbnail Portrait */}
                                    <div className="w-16 aspect-[4/5] shrink-0 overflow-hidden relative bg-surface border border-border/40 rounded-md">
                                        <img
                                            src={getServiceImage(item.serviceId)}
                                            alt={item.name}
                                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between relative min-w-0 py-0.5">
                                        <div className="pr-6">
                                            <h4 className="font-sans font-semibold text-xs text-primary leading-snug tracking-wide truncate">{item.name}</h4>
                                            <p className="text-text-muted text-[10px] font-medium tracking-wide mt-1.5 flex items-center gap-1.5">
                                                <Clock size={11} className="text-accent" />
                                                {item.duration}
                                            </p>
                                        </div>

                                        {/* Price and Quantity Row */}
                                        <div className="flex justify-between items-end mt-3">
                                            <span className="text-[10px] font-bold tracking-wide text-primary bg-surface/80 px-2 py-1 border border-border/40 rounded-sm">
                                                {item.priceStr.replace('IDR', '').trim()} IDR
                                            </span>

                                            {/* Minimal Quantity Control */}
                                            <div className="flex items-center gap-3.5 bg-surface/50 border border-border/50 px-2.5 py-1 rounded-full">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, -1)}
                                                    disabled={item.guests <= 1}
                                                    className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                                    aria-label="Decrease guests"
                                                >
                                                    <Minus size={11} strokeWidth={2} />
                                                </button>
                                                <span className="font-sans font-bold text-[11px] text-primary w-4 text-center">{item.guests}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, 1)}
                                                    className="text-text-muted hover:text-primary transition-colors p-0.5"
                                                    aria-label="Increase guests"
                                                >
                                                    <Plus size={11} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            className="absolute top-0 right-0 bg-transparent text-text-muted/40 hover:text-red-500/80 transition-colors p-1.5 rounded-full hover:bg-red-50/50"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={13} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Add Another Treatment Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full mt-4 py-3 border border-border/80 text-primary font-sans text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:border-primary/50 hover:bg-background transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Plus size={12} strokeWidth={2} className="text-accent" /> Add Treatment
                        </button>
                    )}
                </section>

                {/* Details Form */}
                <section className="space-y-5 pb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Sacred Journey Logistics</span>
                        <div className="h-[1px] bg-border/60 flex-grow"></div>
                    </div>

                    <div className="bg-background/85 border border-border/60 p-6 rounded-2xl shadow-soft space-y-5">
                        
                        {/* Name */}
                        <div className="group">
                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <User size={12} strokeWidth={2} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={bookingDetails.name}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })}
                                placeholder="What should we call you?"
                                className="w-full bg-surface/50 border border-border/80 px-4 py-3 rounded-lg text-sm text-primary placeholder-text-muted/40 outline-none focus:border-accent focus:bg-background transition-all duration-300"
                            />
                        </div>

                        {/* Date/Time Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group">
                                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                    <Calendar size={12} strokeWidth={2} />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={bookingDetails.date}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                                    className="w-full bg-surface/50 border border-border/80 px-4 py-3 rounded-lg text-sm text-primary outline-none focus:border-accent focus:bg-background transition-all duration-300"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                    <Clock size={12} strokeWidth={2} />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={bookingDetails.time}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })}
                                    className="w-full bg-surface/50 border border-border/80 px-4 py-3 rounded-lg text-sm text-primary outline-none focus:border-accent focus:bg-background transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="group">
                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <MapPin size={12} strokeWidth={2} />
                                Sanctuary Location
                            </label>
                            <LocationAutocomplete
                                value={bookingDetails.location}
                                onChange={(val) => setBookingDetails({ ...bookingDetails, location: val })}
                                placeholder="Villa Name, Hotel or Ubud Area"
                                className="w-full bg-surface/50 border border-border/80 px-4 py-3 rounded-lg text-sm text-primary placeholder-text-muted/40 outline-none focus:border-accent focus:bg-background transition-all duration-300"
                            />
                        </div>

                        {/* Room Number */}
                        <div className="group">
                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <Home size={12} strokeWidth={2} />
                                Room / Villa No. <span className="text-text-muted/50 font-normal italic">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={bookingDetails.roomNumber || ''}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, roomNumber: e.target.value })}
                                placeholder="e.g. Suite 305 or Villa A"
                                className="w-full bg-surface/50 border border-border/80 px-4 py-3 rounded-lg text-sm text-primary placeholder-text-muted/40 outline-none focus:border-accent focus:bg-background transition-all duration-300"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 lg:p-8 bg-background shrink-0 z-20 border-t border-border/60 shadow-soft-lg">
                <div className="flex justify-between items-end mb-5">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent block mb-1">Estimated Total</span>
                        <div className="flex items-baseline gap-2">
                            <div className="font-serif text-3xl font-normal text-primary">{formatPrice(total).replace('IDR', '').trim()}</div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">IDR</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full bg-primary hover:bg-secondary text-white h-15 uppercase tracking-[0.22em] text-[10px] font-bold hover:shadow-soft transition-all duration-300 disabled:opacity-40 disabled:hover:bg-primary disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl"
                >
                    <span>Confirm Reservation</span>
                    <ChevronRight size={15} strokeWidth={2} />
                </button>
                <p className="text-center text-[9px] font-medium tracking-[0.08em] text-text-muted/70 mt-3.5">
                    Your request will open in WhatsApp to align with our concierge.
                </p>
            </div>
        </div>
    );
};

export default ReservationSidebar;
