'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function PhilosophyPage() {
    const [showStory, setShowStory] = useState(false);

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 font-sans px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-center">
                <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4 block">Our Philosophy</span>
                    <h3 className="font-serif text-4xl md:text-5xl text-primary font-medium mb-6 leading-tight domain-ubud-only">
                        Sanctuary for the Soul
                    </h3>
                    <h3 className="font-serif text-4xl md:text-5xl text-primary font-medium mb-6 leading-tight domain-bali-only">
                        Bespoke Tranquility at <span className="italic">Your Doorstep</span>
                    </h3>
                    <p className="text-text-muted leading-relaxed mb-8 font-light domain-ubud-only">
                        Born from the ancient healing traditions of Bali, Elexoir Home Spa was created with a singular vision: to bring unparalleled luxury and profound relaxation directly to your sanctuary. We believe that true wellness requires an environment where you feel completely at ease—your own home or villa.
                    </p>
                    <p className="text-text-muted leading-relaxed mb-8 font-light domain-bali-only">
                        Born from the ancient healing traditions of Bali, Home Spa Ubud was created with a singular vision: to bring unparalleled luxury and profound relaxation directly to your sanctuary. We believe that true wellness requires an environment where you feel completely at ease—your own home or villa.
                    </p>
                    <AnimatePresence>
                        {showStory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-6 mb-8"
                            >
                                <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">
                                    The Ultimate <span className="italic">Luxury Home Spa</span> in Bali
                                </h4>
                                <div className="domain-ubud-only">
                                    <p className="text-text-muted leading-relaxed font-light mb-6">
                                        Elevate your wellness journey with Elexoir Home Spa, Bali's premier mobile spa and in-villa massage service. Whether you are staying in the lush jungles of Ubud, the vibrant coasts of Canggu and Seminyak, or the breathtaking cliffs of Uluwatu, our certified professional therapists bring the ultimate 5-star spa experience directly to your doorstep.
                                    </p>
                                </div>
                                <div className="domain-bali-only">
                                    <p className="text-text-muted leading-relaxed font-light mb-6">
                                        Elevate your wellness journey with Home Spa Ubud, Bali's premier mobile spa and in-villa massage service. Whether you are staying in the lush jungles of Ubud, the vibrant coasts of Canggu and Seminyak, or the breathtaking cliffs of Uluwatu, our certified professional therapists bring the ultimate 5-star spa experience directly to your doorstep.
                                    </p>
                                </div>
                                <p className="text-text-muted leading-relaxed font-light mb-6">
                                    We specialize in traditional Balinese Massage, Deep Tissue therapies, and exclusive Couples Massage packages designed for absolute relaxation. Using only premium, organic massage oils and authentic holistic healing techniques, our bespoke spa treatments in Bali transform your private villa or hotel room into a tranquil sanctuary of rejuvenation.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showStory && (
                        <button 
                            onClick={() => setShowStory(true)}
                            className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                            Discover Our Story <ArrowRight size={16} />
                        </button>
                    )}
                </div>
                <div className="flex-1 w-full relative">
                    <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-gradient-to-br from-highlight/60 to-surface border border-white shadow-soft relative flex items-center justify-center p-8 text-center">
                        <div>
                            <h4 className="font-serif text-2xl text-primary mb-2">Our Promise</h4>
                            <p className="text-text-muted font-light leading-relaxed">To transform any space into a temple of healing and deep relaxation.</p>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-secondary/30 rounded-full blur-2xl"></div>
                </div>
            </div>
        </div>
    );
}
