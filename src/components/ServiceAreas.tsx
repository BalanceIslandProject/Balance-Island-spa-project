'use client';
import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';

export default function ServiceAreas({ hideHeader = false }: { hideHeader?: boolean }) {
  const areas = [
    { name: "Ubud", slug: "ubud", desc: "Premium mobile spa in the cultural heart of Bali." },
    { name: "Canggu", slug: "canggu", desc: "Luxury home massage for the vibrant coastal lifestyle." },
    { name: "Seminyak", slug: "seminyak", desc: "Exclusive in-villa spa treatments in Seminyak." },
    { name: "Uluwatu", slug: "uluwatu", desc: "Relaxing cliff-side villa massage experiences." },
    { name: "Sanur", slug: "sanur", desc: "Tranquil mobile wellness brought to your Sanur hotel." },
    { name: "Nusa Dua", slug: "nusa-dua", desc: "5-star spa delivery to Nusa Dua resorts and villas." },
    { name: "Jimbaran", slug: "jimbaran", desc: "Sunset relaxation with our Jimbaran mobile spa." },
    { name: "Kuta", slug: "kuta", desc: "Professional massage therapies delivered to Kuta." }
  ];

  return (
    <section className="relative">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-10">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2 md:mb-3 block">Service Areas</span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-primary leading-tight mb-3 md:mb-4">We Come to Your Sanctuary</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-light domain-ubud-only">
              Elexoir Home Spa provides luxury mobile massage and wellness services directly to private villas, estates, and hotels across Bali's most prestigious locations.
            </p>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-light domain-bali-only">
              We provide luxury mobile massage and wellness services directly to private villas, estates, and hotels across Bali's most prestigious locations.
            </p>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-light domain-therapick-only">
              Therapick delivers 5-star luxury mobile spa and in-villa massage services directly to private villas, estates, and hotels across Ubud, Canggu, Seminyak, Uluwatu, and all of Bali.
            </p>
          </div>
        </div>
      )}

      {/* Responsive Grid Cards (Visible on both Mobile & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 -mx-6 px-6 md:mx-0 md:px-0">
        {areas.map((area, idx) => (
          <Link href={`/explore?location=${encodeURIComponent(area.name)}`} key={idx} className="group block outline-none">
            <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-[16px] md:rounded-3xl p-4 md:p-8 transition-all duration-300 hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] hover:border-primary/30 hover:-translate-y-1 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <h3 className="font-serif text-base sm:text-xl md:text-2xl text-primary font-medium">{area.name}</h3>
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed font-light line-clamp-3 md:line-clamp-none mb-4 md:mb-6">{area.desc}</p>
              </div>
              <div className="mt-auto pt-3 md:pt-4 border-t border-border/40 flex items-center justify-between text-[11px] md:text-xs font-bold text-primary/70 uppercase tracking-wider group-hover:text-primary transition-colors">
                <span>View Treatments</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
