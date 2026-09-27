'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function ContactPage() {
    const [isBali, setIsBali] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.hostname;
            setIsBali((host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir'));
        }
    }, []);

    const email = isBali ? "info@homespaubud.com" : "info@elexoirhomespa.com";

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Mobile Header */}
            <div className="pt-28 pb-4 px-6 bg-white sticky top-0 z-30">
                <h1 className="font-serif text-4xl text-primary">Concierge</h1>
            </div>

            <div className="px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <p className="text-sm font-light text-text-muted leading-relaxed">
                        Our dedicated concierge is available to assist you with inquiries, bespoke rituals, and special arrangements for your in-villa wellness experience.
                    </p>
                </motion.div>

                <div className="space-y-4 mb-10">
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="flex items-center gap-4 bg-surface p-5 rounded-2xl border border-border/80 active:scale-95 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Phone size={18} className="text-white" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">WhatsApp</span>
                            <span className="font-sans font-medium text-sm text-primary">+62 851 7411 9423</span>
                        </div>
                    </a>

                    <a href={`mailto:${email}`} className="flex items-center gap-4 bg-surface p-5 rounded-2xl border border-border/80 active:scale-95 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                            <Mail size={18} className="text-primary" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Email</span>
                            <span className="font-sans font-medium text-sm text-primary">{email}</span>
                        </div>
                    </a>

                    <div className="flex items-center gap-4 bg-surface p-5 rounded-2xl border border-border/80">
                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-primary" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Service Area</span>
                            <span className="font-sans font-medium text-sm text-primary">Ubud & Surrounding Areas</span>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-primary text-white p-8 rounded-3xl text-center"
                >
                    <h3 className="font-serif text-2xl mb-2">Have Questions?</h3>
                    <p className="text-xs font-light text-white/80 mb-6 max-w-[250px] mx-auto">
                        Speak directly with our wellness advisors for personalized recommendations.
                    </p>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="inline-flex h-12 px-8 bg-white text-primary rounded-xl items-center justify-center gap-2 active:bg-surface transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Chat Now</span>
                        <ArrowRight size={14} strokeWidth={2.5} />
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
