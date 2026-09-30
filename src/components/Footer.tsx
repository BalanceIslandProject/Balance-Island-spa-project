'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-white text-primary pt-12 pb-16 relative border-t border-border/40">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col items-start max-w-2xl">
          
          <div className="mb-12">
            <Link href="/" className="inline-block mb-4 outline-none hover:opacity-80 transition-opacity">
              <span className="font-serif italic text-4xl md:text-5xl text-primary tracking-wide domain-ubud-only">Elexoir Home Spa</span>
              <span className="font-serif italic text-4xl md:text-5xl text-primary tracking-wide domain-bali-only">Home Spa Ubud</span>
              <img src="/therapick-logo.png" alt="Therapick" className="h-12 md:h-16 w-auto object-contain domain-therapick-only" />
            </Link>
            <p className="text-[15px] text-text-muted leading-relaxed font-light md:w-[85%]">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <p className="text-sm md:text-[15px] text-primary font-medium tracking-wide">
              A brand of PT BALANCE ISLAND INDONESIA
            </p>
            
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Privacy Policy</Link>
              <Link href="/terms" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Terms of Service</Link>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
