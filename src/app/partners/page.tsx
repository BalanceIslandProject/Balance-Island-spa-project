import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, QrCode, Wallet, Users, CheckCircle2 } from 'lucide-react';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-2 sm:py-6">
      
      {/* Hero Section */}
      <section className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-12 shadow-2xs space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
          <Sparkles size={12} className="text-neutral-700" />
          <span>BookTherapick Partner Program</span>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 leading-[1.15]">
            Partner with Bali’s Premier Mobile Spa & Earn 15% Commission
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
            Provide your villa guests, hotel clients, and travelers with top-rated mobile spa rituals delivered directly across Bali. Earn recurring commissions on every completed treatment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link
            href="/partners/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-all shadow-xs active:scale-98"
          >
            <span>Apply as a Partner</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/partners/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs font-semibold tracking-wide hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            Partner Portal Login
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 pt-2 text-xs text-neutral-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Free to join</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>30-day cookie window</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Direct verified IDR payouts</span>
          </span>
        </div>
      </section>

      {/* Program Details: How It Works */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Simple 3-Step Process
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
            How the Partner Program Works
          </h2>
          <p className="text-xs text-neutral-500">
            Seamless attribution with instant QR codes and direct WhatsApp support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-mono font-bold text-neutral-900">
              01
            </div>
            <h3 className="text-sm font-bold text-neutral-950">Join & Receive Code</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Complete the quick registration form with your villa or contact details and choose your preferred payout method.
            </p>
          </div>

          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-mono font-bold text-neutral-900">
              02
            </div>
            <h3 className="text-sm font-bold text-neutral-950">Display QR or Share Link</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Place your custom QR card on villa welcome tables or vehicle headrests, or share your tracked referral link online.
            </p>
          </div>

          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-mono font-bold text-neutral-900">
              03
            </div>
            <h3 className="text-sm font-bold text-neutral-950">Earn 15% on Treatments</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Once guest appointments are completed and verified, commissions are ready for immediate WhatsApp withdrawal without minimum limits.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Hospitality Network
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
            Designed for Bali Travel & Villa Hosts
          </h2>
          <p className="text-xs text-neutral-500">
            Built to enhance guest satisfaction while generating consistent passive revenue
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2.5">
            <h3 className="text-sm font-bold text-neutral-950">Villas & Boutique Hotels</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Offer 5-star mobile massage without employing in-house spa staff. Guests scan your bedside or welcome tent card to book directly.
            </p>
          </div>

          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2.5">
            <h3 className="text-sm font-bold text-neutral-950">Drivers & Tour Guides</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Recommend Bali's trusted in-villa massage to travelers after long day trips with your custom QR sticker or card.
            </p>
          </div>

          <div className="p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2.5">
            <h3 className="text-sm font-bold text-neutral-950">Content Creators & Guides</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Feature BookTherapick in your Bali itinerary guides, links in bio, or travel blogs with automatic 30-day tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border border-neutral-200/80 p-8 sm:p-12 rounded-3xl text-center space-y-4 bg-white shadow-2xs">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
          Ready to Start Partnering?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Create your partner account today to access your custom referral link, printable QR code, and real-time booking tracker.
        </p>
        <div className="pt-2">
          <Link
            href="/partners/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-all shadow-xs active:scale-98"
          >
            <span>Create Partner Account</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

    </div>
  );
}
