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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-[#171717] antialiased">
      <div className="bg-white rounded-2xl p-6 sm:p-10 text-center max-w-md w-full border border-[#E5E5E5] shadow-xs space-y-6">
        
        {/* Brand Identification */}
        <div className="flex justify-center items-center pb-2">
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Calm Apple-inspired Status Indicator */}
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 size={28} strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-medium tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Payment Verified</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-black font-medium tracking-tight">
            Payment Successful
          </h1>
          
          <p className="text-xs sm:text-[13px] text-[#737373] leading-relaxed max-w-sm mx-auto">
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
              className="inline-flex items-center justify-center gap-2 w-full bg-black text-white hover:bg-[#262626] h-12 rounded-xl text-xs sm:text-[13px] font-semibold tracking-wide transition-colors"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              <span>Confirm on WhatsApp</span>
              <ArrowRight size={14} />
            </a>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5] h-12 rounded-xl text-xs sm:text-[13px] font-semibold tracking-wide transition-colors"
          >
            <Home size={15} className="text-[#737373]" />
            <span>Return to Therapick</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A3A3]">
            Therapick • Bali Luxury Mobile Spa
          </span>
        </div>

      </div>
    </div>
  );
}
