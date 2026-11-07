'use client';
import React from 'react';
import { useSpa } from '@/context/SpaContext';

export default function SeoExpandedContent() {
  const { siteBrandFilter } = useSpa();
  const brandName = siteBrandFilter === 'therapick' ? 'Therapick' : siteBrandFilter === 'bali' ? 'Home Spa Ubud' : 'Elexoir Home Spa';

  return (
    <section className="mb-24 py-12 md:py-20 border-t border-border/30">
      <div className="max-w-3xl mx-auto text-center px-4 md:px-0">
        <h2 className="font-serif text-3xl md:text-5xl text-primary mb-6 leading-tight">
          Massage Home Service & <span className="italic">Outcall Spa</span> in Bali
        </h2>
        <p className="text-sm md:text-base text-text-muted leading-relaxed font-light mb-6">
          Elevate your wellness journey with <span className="font-medium text-primary">{brandName}</span>, Bali's premier on-demand massage home service and outcall in-villa spa platform. Whether you are staying in a private pool villa in Seminyak, Canggu, and Uluwatu, or a serene jungle retreat in Ubud, our certified 5-star therapists arrive at your doorstep within 45 to 60 minutes.
        </p>
        <p className="text-sm md:text-base text-text-muted leading-relaxed font-light mb-6">
          We specialize in authentic Traditional Balinese Massage, firm Deep Tissue muscle recovery, warm aromatherapy, and romantic side-by-side couples massage rituals. Each session includes portable massage tables, crisp sanitized linens, and 100% natural organic oils—delivering a full luxury spa sanctuary to your hotel or villa without the traffic.
        </p>
        <p className="text-xs md:text-sm text-text-muted/80 leading-relaxed font-light">
          Melayani pijat panggilan Bali profesional dan terpercaya untuk area Seminyak, Canggu, Ubud, Uluwatu, Sanur, Jimbaran, Nusa Dua, dan Denpasar. Terapis bersertifikat dengan standar higienis bintang lima.
        </p>
      </div>
    </section>
  );
}
