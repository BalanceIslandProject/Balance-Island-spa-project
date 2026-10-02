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
    <span className="text-[#3c4043] font-bold text-lg tracking-tight font-sans">Reviews</span>
  </div>
);

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-white text-primary pt-12 pb-16 relative border-t border-border/40">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col items-start max-w-2xl">
          
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-serif text-primary tracking-wide mb-6">
              A brand of PT BALANCE ISLAND INDONESIA
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed font-light md:w-[85%] mb-8">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>

            <div className="flex flex-col gap-3">
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
          </div>

          <div className="flex flex-col gap-4 w-full border-t border-border/40 pt-8 mt-4">
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
