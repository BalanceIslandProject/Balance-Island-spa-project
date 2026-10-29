import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, ArrowRight, Wind, Activity, Zap, Moon, Droplets, Heart, Flower2, Waves, Feather } from 'lucide-react';
import { ServiceItem } from '@/lib/types';
import { parseServiceOptions } from '@/lib/constants';

interface Props {
    service: ServiceItem | null;
    onClose: () => void;
    onAdd: (service: ServiceItem, duration: string, price: string, numericPrice: number) => void;
}

const ServiceDetailModal: React.FC<Props> = ({ service, onClose, onAdd }) => {
    const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

    // Lock Body Scroll when modal is open
    useEffect(() => {
        if (service) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [service]);

    if (!service) return null;

    const parts = service.description.split(/Benefits:/i);
    const mainDescription = parts[0].trim();
    const benefitsList = parts[1]
        ? parts[1].split(/,|;/).map(b => {
            let text = b.trim().replace(/\.$/, '');
            if (text.toLowerCase().startsWith('and ')) {
                text = text.substring(4).trim();
            }
            return text.charAt(0).toUpperCase() + text.slice(1);
        }).filter(b => b.length > 0)
        : [];

    const options = parseServiceOptions(service);
    const currentOption = options[selectedOptionIdx] || options[0];

    const handleAdd = () => {
        onAdd(service, currentOption.duration, currentOption.price, currentOption.numericValue);
        onClose();
    };

    // Helper to map text to modern icons
    const getBenefitIcon = (text: string) => {
        const t = text.toLowerCase();
        const iconProps = { size: 18, strokeWidth: 1.5 };

        if (t.includes('sleep') || t.includes('insomnia') || t.includes('dream') || t.includes('night') || t.includes('rest')) {
            return <Moon {...iconProps} className="text-accent" />;
        }
        if (t.includes('energy') || t.includes('boost') || t.includes('revitalize') || t.includes('awaken') || t.includes('fatigue')) {
            return <Zap {...iconProps} className="text-accent" />;
        }
        if (t.includes('detox') || t.includes('lymph') || t.includes('drainage') || t.includes('circulation') || t.includes('blood') || t.includes('toxin') || t.includes('flush')) {
            return <Droplets {...iconProps} className="text-accent" />;
        }
        if (t.includes('muscle') || t.includes('pain') || t.includes('tension') || t.includes('stiff') || t.includes('sport') || t.includes('tissue') || t.includes('knot') || t.includes('relief')) {
            return <Activity {...iconProps} className="text-accent" />;
        }
        if (t.includes('emotion') || t.includes('anxiety') || t.includes('stress') || t.includes('love') || t.includes('connection') || t.includes('calm') || t.includes('mood') || t.includes('nervous')) {
            return <Heart {...iconProps} className="text-accent" />;
        }
        if (t.includes('skin') || t.includes('face') || t.includes('beauty') || t.includes('glow') || t.includes('anti-aging') || t.includes('youth') || t.includes('rejuvenat')) {
            return <Flower2 {...iconProps} className="text-accent" />;
        }
        if (t.includes('flexibility') || t.includes('mobility') || t.includes('flow') || t.includes('stretch') || t.includes('yoga') || t.includes('posture')) {
            return <Waves {...iconProps} className="text-accent" />;
        }
        if (t.includes('gentle') || t.includes('soothing') || t.includes('soft') || t.includes('light') || t.includes('sensitive')) {
            return <Feather {...iconProps} className="text-accent" />;
        }
        if (t.includes('balance') || t.includes('spirit') || t.includes('clarity') || t.includes('mind') || t.includes('focus') || t.includes('headache')) {
            return <Wind {...iconProps} className="text-accent" />;
        }
        return <Flower2 {...iconProps} className="text-accent" />;
    };

    return (
        <AnimatePresence>
            {service && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-primary/45 backdrop-blur-md z-[60]"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className="fixed inset-0 z-[100] bg-background overflow-y-auto custom-scrollbar font-sans"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="fixed top-6 right-6 z-[110] p-2.5 bg-background/90 backdrop-blur-md rounded-full text-text-muted hover:text-primary hover:bg-surface border border-border/80 transition-all shadow-soft"
                            aria-label="Close modal"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>

                        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 pb-32 lg:pb-16 lg:py-16">
                            {/* Header */}
                            <div className="mb-8 pt-4 lg:pt-0">
                                <span className="uppercase tracking-[0.25em] font-sans font-bold text-[9px] text-accent bg-surface/80 border border-border/40 px-3.5 py-1.5 rounded-full inline-block mb-4">
                                    {service.category}
                                </span>
                                <h2 className="font-serif text-5xl lg:text-7xl font-normal text-primary mb-5 tracking-tight leading-none">
                                    {service.name}
                                </h2>
                                <div className="flex items-center gap-2.5 text-xs font-medium text-text-muted">
                                    <div className="flex items-center gap-1">
                                        <Star size={13} className="text-accent" fill="currentColor" />
                                        <span className="font-sans font-bold text-primary">5.0</span>
                                    </div>
                                    <span className="text-border">•</span>
                                    <span>Professional mobile spa treatment</span>
                                </div>
                            </div>

                            {/* Image Grid */}
                            <div className="w-full h-[40vh] lg:h-[55vh] overflow-hidden mb-12 relative group rounded-2xl shadow-soft">
                                <img 
                                    src={service.image} 
                                    alt={`${service.name} - Luxury Spa Ritual`} 
                                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-103" 
                                />
                                <div className="absolute inset-0 bg-primary/10"></div>
                            </div>

                            {/* Content & Booking Split */}
                            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 relative">
                                {/* Left Content */}
                                <div className="w-full lg:w-[60%]">
                                    <div className="pb-8 border-b border-border/60">
                                        <p className="font-sans text-text-muted text-base leading-relaxed font-light whitespace-pre-line first-letter:text-5xl first-letter:font-serif first-letter:text-primary first-letter:float-left first-letter:mr-3.5 first-letter:mt-1">
                                            {mainDescription}
                                        </p>
                                    </div>

                                    {/* Highlights */}
                                    {benefitsList.length > 0 && (
                                        <div className="py-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <h3 className="font-serif text-2xl font-normal text-primary">Sacred Benefits</h3>
                                                <div className="h-[1px] bg-border/60 flex-1"></div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {benefitsList.map((benefit, i) => (
                                                    <div key={i} className="flex items-start gap-4 group p-3 bg-surface/35 border border-border/40 rounded-xl hover:border-accent/40 transition-colors duration-300">
                                                        <div className="shrink-0 mt-0.5">
                                                            {getBenefitIcon(benefit)}
                                                        </div>
                                                        <span className="font-sans text-text-muted font-normal text-xs leading-relaxed block">
                                                            {benefit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Booking Card */}
                                <div className="w-full lg:w-[40%] pb-12 lg:pb-0">
                                    <div className="sticky top-8 bg-surface/40 border border-border/60 rounded-2xl p-6 lg:p-8 shadow-soft relative overflow-hidden">
                                        <div className="mb-8">
                                            <label className="block text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-5 flex items-center gap-2">
                                                <Clock size={12} className="text-accent" />
                                                Select Duration
                                            </label>
                                            <div className="flex flex-col gap-3">
                                                {options.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedOptionIdx(i)}
                                                        className={`w-full flex justify-between items-center px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${
                                                            selectedOptionIdx === i
                                                                ? 'bg-background text-primary border-accent/80 shadow-soft ring-1 ring-accent/10'
                                                                : 'bg-background/40 text-text-muted/65 border-border/50 hover:border-border hover:bg-background'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2.5">
                                                            <div className={`w-3 h-3 rounded-full transition-all border ${
                                                                selectedOptionIdx === i 
                                                                    ? 'bg-primary border-primary scale-110' 
                                                                    : 'bg-transparent border-border group-hover:border-accent'
                                                            }`}></div>
                                                            {opt.duration}
                                                        </span>
                                                        <span className={`font-serif font-normal text-base normal-case tracking-normal ${
                                                            selectedOptionIdx === i ? 'text-primary' : 'text-text-muted/60'
                                                        }`}>
                                                            {opt.price.replace(/IDR/i, '').trim()}k IDR
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1.5 mb-6 pt-6 border-t border-border/60">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">Total Investment</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="font-serif text-4xl font-normal text-primary">
                                                    {currentOption.price.replace(/IDR/i, '').trim()}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">IDR</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAdd}
                                            className="w-full h-14 bg-primary hover:bg-secondary text-white rounded-xl font-sans font-bold text-[10px] uppercase tracking-[0.22em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-soft"
                                        >
                                            <span>Add to Ritual</span>
                                            <ArrowRight size={14} strokeWidth={2} />
                                        </button>

                                        <p className="text-center text-[9px] font-medium tracking-[0.1em] text-text-muted/60 mt-4 uppercase">
                                            Professional In-Villa Sanctuary Setup
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Fixed Bottom Bar */}
                        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/60 p-4 pb-6 lg:hidden z-[120] shadow-soft-lg">
                            <div className="max-w-md mx-auto">
                                <div className="flex gap-2 mb-3.5 overflow-x-auto custom-scrollbar pb-1">
                                    {options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedOptionIdx(i)}
                                            className={`whitespace-nowrap flex-1 py-2.5 px-4 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-300 border ${
                                                selectedOptionIdx === i
                                                    ? 'bg-primary text-white border-primary shadow-soft'
                                                    : 'bg-background text-text-muted/65 border-border/80'
                                            }`}
                                        >
                                            {opt.duration}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-serif text-3xl font-normal text-primary">
                                            {currentOption.price.replace(/IDR/i, '').trim()}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">IDR</span>
                                    </div>
                                    <button
                                        onClick={handleAdd}
                                        className="flex-1 max-w-[150px] py-3.5 bg-primary text-white rounded-xl font-sans font-bold text-[9px] uppercase tracking-[0.2em] hover:bg-secondary transition-all flex items-center justify-center shadow-soft"
                                    >
                                        Reserve Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ServiceDetailModal;
