'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, Home, Clock, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    { 
      icon: Sparkles,
      title: "Certified Therapists", 
      desc: "Highly trained professionals with years of luxury wellness experience." 
    },
    { 
      icon: Droplets,
      title: "Premium Massage Oils", 
      desc: "100% organic, locally sourced essential oils for deep nourishment." 
    },
    { 
      icon: Home,
      title: "Villa & Hotel Service", 
      desc: "We bring the complete spa setup directly to your private accommodation." 
    },
    { 
      icon: Clock,
      title: "Same-Day Booking", 
      desc: "Flexible scheduling to fit your perfect Bali holiday itinerary." 
    },
    { 
      icon: HeartHandshake,
      title: "Professional Wellness", 
      desc: "Curated therapies focusing on holistic healing and deep relaxation." 
    },
    { 
      icon: ShieldCheck,
      title: "Hygiene Standards", 
      desc: "Impeccable cleanliness and sanitized equipment for every session." 
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.section 
      className="relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      <div className="py-10 px-5 sm:px-8 md:py-16 md:px-12 rounded-[28px] md:rounded-[40px] bg-white/60 backdrop-blur-md border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <motion.div variants={itemVariants} className="text-center mb-10 md:mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2 md:mb-3 block">
            <span className="domain-ubud-only">Elexoir Standard</span>
            <span className="domain-bali-only">Our Standard</span>
            <span className="domain-therapick-only">Therapick Standard</span>
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-primary leading-tight">Why Choose Our Mobile Spa</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reasons.map((item, idx) => (
            <motion.div 
              variants={itemVariants} 
              key={idx} 
              className="flex items-start gap-4 p-5 md:p-6 rounded-[22px] md:rounded-[24px] bg-white/80 backdrop-blur-sm border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-secondary/30 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs md:text-sm text-primary mb-1.5 uppercase tracking-wider">{item.title}</h3>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed font-light">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
