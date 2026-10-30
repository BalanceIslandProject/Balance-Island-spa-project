import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Building2, 
  Compass, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  QrCode,
  Wallet,
  Clock
} from 'lucide-react';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 sm:space-y-12 py-2 sm:py-6 px-2 sm:px-4">
      
      {/* ========================================================
          1. HERO SECTION: Professional Vercel Light Aesthetics
         ======================================================== */}
      <section className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-10 md:p-12 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] space-y-6">
        
        {/* Program Status Badge */}
        <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.071em] text-[#666666] bg-[#fafafa] px-3 py-1 rounded-[6px] border border-[#ebebeb]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]" />
          <span>Partner Program • Bali</span>
        </div>

        {/* Title & Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal text-[#171717] tracking-[-0.04em] leading-[1.1]">
            Island Relaxation, Delivered.
          </h1>

          <p className="text-xs sm:text-sm text-[#4d4d4d] leading-relaxed max-w-2xl font-normal">
            Provide your villa guests, hotel clients, and travelers with top-rated mobile wellness rituals delivered directly to their accommodations across Bali. Track bookings in real time with transparent attribution and automated payouts.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link
            href="/partners/register"
            className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-[6px] bg-[#171717] text-white font-mono text-xs uppercase tracking-[0.071em] hover:bg-black active:scale-[0.99] transition-all shadow-xs"
          >
            <span>Apply as a Partner</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/partners/login"
            className="inline-flex items-center justify-center px-6 h-11 rounded-[6px] border border-[#ebebeb] bg-white text-[#171717] font-mono text-xs uppercase tracking-[0.071em] hover:bg-[#fafafa] active:scale-[0.99] transition-all"
          >
            Partner Portal Login
          </Link>
        </div>

        {/* Key Metrics Hairline Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-6 border-t border-[#ebebeb]">
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-0.5">
            <span className="font-mono text-lg sm:text-xl font-medium text-[#171717] block">15%</span>
            <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.05em] block">Commission Rate</span>
          </div>
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-0.5">
            <span className="font-mono text-lg sm:text-xl font-medium text-[#171717] block">24h</span>
            <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.05em] block">Fast Review</span>
          </div>
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-0.5">
            <span className="font-mono text-lg sm:text-xl font-medium text-[#171717] block">7-Day</span>
            <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.05em] block">Attribution Cookie</span>
          </div>
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-0.5">
            <span className="font-mono text-lg sm:text-xl font-medium text-[#171717] block">100%</span>
            <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.05em] block">In-Villa Service</span>
          </div>
        </div>

      </section>

      {/* ========================================================
          2. HOW IT WORKS: 3 Clear Steps
         ======================================================== */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] block">
            How It Works
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-[#171717] tracking-[-0.03em]">
            Seamless Guest Experience & Attribution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-[4px] bg-[#fafafa] border border-[#ebebeb] font-mono text-xs text-[#171717] font-medium flex items-center justify-center">
                01
              </span>
              <span className="font-mono text-[10px] text-[#297a3a] bg-[#297a3a]/10 px-1.5 py-0.5 rounded-[4px]">
                Instant
              </span>
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Quick Application</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Complete your partner profile with your contact and property details. Zero setup cost, and bank payout details are saved securely post-approval.
            </p>
          </div>

          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-[4px] bg-[#fafafa] border border-[#ebebeb] font-mono text-xs text-[#171717] font-medium flex items-center justify-center">
                02
              </span>
              <QrCode size={14} className="text-[#666666]" />
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Display QR & Share Link</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Place custom QR tent cards on villa welcome desks or vehicle headrests, or send your tracked referral link to guests directly via WhatsApp.
            </p>
          </div>

          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-[4px] bg-[#297a3a]/10 border border-[#297a3a]/25 font-mono text-xs text-[#297a3a] font-medium flex items-center justify-center">
                03
              </span>
              <Wallet size={14} className="text-[#297a3a]" />
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Automated Commissions</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Receive 15% on completed and verified rituals. Track earnings transparently with weekly disbursements via direct bank transfer or Wise.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. WHO WE PARTNER WITH
         ======================================================== */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] block">
            Who Can Partner
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-[#171717] tracking-[-0.03em]">
            Built for Bali Travel & Villa Hosts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717]">
              <Building2 size={16} />
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Villas & Boutique Hotels</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Offer in-villa spa rituals without hiring full-time therapists. Guests scan bedside or living room tent cards to book directly.
            </p>
          </div>

          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717]">
              <Compass size={16} />
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Tour Drivers & Guides</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Recommend luxury in-villa massages to travelers after day tours and volcano hikes using your vehicle QR cards.
            </p>
          </div>

          <div className="p-5 sm:p-6 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717]">
              <Globe size={16} />
            </div>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Concierges & Creators</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Feature verified Therapick wellness experiences in Bali itinerary guides, links in bio, and personalized travel recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. PROGRAM ADVANTAGES: Clean Hairline Value Matrix
         ======================================================== */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] block">
            Quality & Standards
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-[#171717] tracking-[-0.03em]">
            Zero Overhead. Five-Star Execution.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#297a3a]" />
              <h3 className="text-xs sm:text-sm font-medium text-[#171717]">Certified Balinese Therapists</h3>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed pl-6">
              Experienced, insured, and thoroughly vetted practitioners providing authentic Balinese massage and deep tissue therapy.
            </p>
          </div>

          <div className="p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#297a3a]" />
              <h3 className="text-xs sm:text-sm font-medium text-[#171717]">Luxury Mobile Setup</h3>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed pl-6">
              We provide professional massage tables, organic botanical oils, sanitized linens, and calming ambient soundscapes.
            </p>
          </div>

          <div className="p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#297a3a]" />
              <h3 className="text-xs sm:text-sm font-medium text-[#171717]">Real-Time Portal Tracking</h3>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed pl-6">
              Live transparency for incoming inquiries, confirmed reservations, and commission balances on desktop and mobile.
            </p>
          </div>

          <div className="p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#297a3a]" />
              <h3 className="text-xs sm:text-sm font-medium text-[#171717]">Priority WhatsApp Concierge</h3>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed pl-6">
              Direct operations support for VIP guest scheduling, custom requests, and immediate partner assistance.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. CALL TO ACTION BANNER
         ======================================================== */}
      <section className="border border-[#ebebeb] p-6 sm:p-10 rounded-[6px] text-center space-y-4 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        <div className="flex justify-center mb-1">
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-6 sm:h-7 w-auto object-contain"
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-normal text-[#171717] tracking-[-0.04em]">
            Ready to Partner with Therapick?
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto leading-relaxed">
            Create your partner account today to access your custom referral link, printable QR assets, and real-time booking tracker.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/partners/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-10 rounded-[6px] bg-[#171717] text-white font-mono text-xs uppercase tracking-[0.071em] hover:bg-black active:scale-[0.99] transition-all shadow-xs"
          >
            <span>Create Partner Account</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/partners/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 h-10 rounded-[6px] border border-[#ebebeb] bg-white text-[#171717] font-mono text-xs uppercase tracking-[0.071em] hover:bg-[#fafafa] active:scale-[0.99] transition-all"
          >
            Partner Login
          </Link>
        </div>
      </section>

    </div>
  );
}
