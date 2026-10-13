'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GoogleReviewsLogo = () => (
  <div className="flex items-center gap-1.5">
    <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
    <span className="text-[#3c4043] font-bold text-[15px] sm:text-base md:text-lg tracking-tight font-sans">Reviews</span>
  </div>
);

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/partners')) {
    return null;
  }

  return (
    <footer className="bg-white text-primary pt-12 pb-16 relative border-t border-border/40">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col items-start max-w-2xl">
          
          <div className="mb-8">
            <h2 className="text-sm sm:text-base md:text-lg font-serif text-primary tracking-wide mb-6 whitespace-nowrap">
              A brand of PT BALANCE ISLAND INDONESIA
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed font-light md:w-[85%] mb-8">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>

            <div className="flex flex-row items-start gap-6 sm:gap-12 md:gap-20">
              <div className="flex flex-col gap-3 shrink-0">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Find us on</span>
                
                <a href="https://share.google/7evzKgW2VdC2C9QWY" target="_blank" rel="noopener noreferrer" className="domain-ubud-only inline-flex hover:opacity-80 transition-opacity">
                  <GoogleReviewsLogo />
                </a>
                
                <a href="https://share.google/mA7g8NkNuB37g8WHs" target="_blank" rel="noopener noreferrer" className="domain-bali-only inline-flex hover:opacity-80 transition-opacity">
                  <GoogleReviewsLogo />
                </a>
                
                <a href="https://share.google/LRhEtZHpMLBAg9ySs" target="_blank" rel="noopener noreferrer" className="domain-therapick-only inline-flex hover:opacity-80 transition-opacity">
                  <GoogleReviewsLogo />
                </a>
              </div>

              <div className="flex flex-col gap-3 min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted truncate">Book a Tour</span>
                <a 
                  href="https://www.balanceisland.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <span className="text-[#3c4043] font-bold text-[15px] sm:text-base md:text-lg tracking-tight font-sans truncate">balanceisland.com</span>
                  <div className="w-[22px] h-[22px] rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7v6M17 7h-6" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full border-t border-border/40 pt-8 mt-4">
            {/* Prominent Partner Callout strictly visible on BookTherapick */}
            <div className="domain-therapick-only w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded-full inline-block mb-1">
                  Hospitality & Drivers & Creators
                </span>
                <h4 className="font-serif text-base sm:text-lg font-bold text-primary">
                  Partner with BookTherapick &bull; Earn 15% Commission
                </h4>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  Offer 5-star mobile spa to your villa guests or followers. Get custom QR codes and verified IDR payouts.
                </p>
              </div>
              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-black/80 transition-all shrink-0 shadow-sm"
              >
                <span>Partner Portal</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 items-center">
              <Link href="/privacy" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Privacy Policy</Link>
              <Link href="/terms" className="text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300">Terms of Service</Link>
              {/* Strictly shown ONLY on BookTherapick domain via CSS isolation rule */}
              <Link href="/partners" className="domain-therapick-only text-sm md:text-[15px] text-text-muted hover:text-primary transition-colors duration-300 font-medium">Partner Program</Link>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
