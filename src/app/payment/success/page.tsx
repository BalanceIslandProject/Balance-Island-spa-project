'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Home, MessageCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [waUrl, setWaUrl] = useState<string | null>(null);

  useEffect(() => {
    const pendingMessage = localStorage.getItem('pendingBookingMessage');
    if (pendingMessage) {
      const finalMessage = pendingMessage;
      const url = `https://wa.me/6285174119423?text=${encodeURIComponent(finalMessage)}`;
      setWaUrl(url);

      // Clean up so it doesn't trigger again on refresh
      localStorage.removeItem('pendingBookingMessage');

      // Automatic redirect after a short delay
      const redirectTimer = setTimeout(() => {
        window.location.href = url;
      }, 2500);

      return () => clearTimeout(redirectTimer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-[#171717] antialiased">
      <div className="bg-white rounded-[6px] p-6 sm:p-10 text-center max-w-md w-full border border-[#ebebeb] shadow-[0_0_0_1px_rgba(0,0,0,0.04)] space-y-6">
        
        {/* Brand Identification */}
        <div className="flex justify-center items-center pb-2">
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Status Indicator */}
        <div className="w-12 h-12 bg-[#fafafa] text-[#297a3a] rounded-[6px] flex items-center justify-center mx-auto border border-[#ebebeb]">
          <CheckCircle2 size={24} strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[#ebebeb] bg-[#fafafa] text-[#297a3a] text-[11px] font-mono uppercase tracking-[0.071em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]" />
            <span>Payment Verified</span>
          </div>

          <h1 className="font-sans text-xl sm:text-2xl text-[#171717] font-medium tracking-tight">
            Payment Successful
          </h1>
          
          <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed max-w-sm mx-auto">
            {waUrl
              ? 'Thank you for your booking. Redirecting you to WhatsApp to receive your therapist confirmation and dispatch details...'
              : 'Thank you for your purchase. We have received your payment and our concierge team will reach out promptly.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 pt-2">
          {waUrl && (
            <a
              href={waUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-[#171717] text-white hover:bg-black h-10 rounded-[6px] text-xs font-mono uppercase tracking-[0.071em] transition-colors shadow-xs"
            >
              <MessageCircle size={15} className="text-emerald-400" />
              <span>Confirm on WhatsApp</span>
              <ArrowRight size={14} />
            </a>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] h-10 rounded-[6px] text-xs font-mono uppercase tracking-[0.071em] transition-colors"
          >
            <Home size={14} className="text-[#666666]" />
            <span>Return to Therapick</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-[#ebebeb]">
          <span className="text-[10px] font-mono uppercase tracking-[0.071em] text-[#888888]">
            Therapick • Bali Luxury Mobile Spa
          </span>
        </div>

      </div>
    </div>
  );
}
