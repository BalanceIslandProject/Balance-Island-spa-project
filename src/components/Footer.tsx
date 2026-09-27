import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1C1F1D] text-white py-10 mt-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-start gap-4">
          
          <div className="mb-6">
            <Link href="/" className="inline-block mb-4 outline-none">
              <span className="font-serif italic text-3xl md:text-4xl text-white tracking-wide domain-ubud-only">Elexoir Home Spa</span>
              <span className="font-serif italic text-3xl md:text-4xl text-white tracking-wide domain-bali-only">Home Spa Ubud</span>
            </Link>
            <p className="text-sm md:text-base text-white/60 leading-relaxed font-light max-w-md">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>
          </div>

          <p className="text-sm text-white/60 font-light tracking-wide mt-4">
            A brand of PT BALANCE ISLAND INDONESIA
          </p>
          
          <div className="flex gap-6 mt-1">
            <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
