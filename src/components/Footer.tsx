import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#1C1F1D] to-[#121413] text-white pt-20 pb-16 mt-16 rounded-t-[40px] md:rounded-t-[60px] relative overflow-hidden shadow-2xl">
      {/* Cinematic subtle glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-white/[0.02] blur-[80px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col items-start max-w-2xl">
          
          <div className="mb-16">
            <Link href="/" className="inline-block mb-5 outline-none hover:opacity-80 transition-opacity">
              <span className="font-serif italic text-4xl md:text-5xl text-white/95 tracking-wide drop-shadow-sm domain-ubud-only">Elexoir Home Spa</span>
              <span className="font-serif italic text-4xl md:text-5xl text-white/95 tracking-wide drop-shadow-sm domain-bali-only">Home Spa Ubud</span>
            </Link>
            <p className="text-[15px] text-white/60 leading-relaxed font-light md:w-[85%]">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>
          </div>

          <div className="flex flex-col gap-5 w-full">
            <p className="text-sm md:text-[15px] text-white/60 font-light tracking-wide">
              A brand of PT BALANCE ISLAND INDONESIA
            </p>
            
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm md:text-[15px] text-white/50 hover:text-white transition-colors duration-300">Privacy Policy</Link>
              <Link href="/terms" className="text-sm md:text-[15px] text-white/50 hover:text-white transition-colors duration-300">Terms of Service</Link>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
