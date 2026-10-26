import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="space-y-10 sm:space-y-14 py-2 sm:py-6 max-w-4xl mx-auto">
      
      {/* Hero Section */}
      <section className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-10 shadow-2xs space-y-6">
        
        {/* Program Badge */}
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span>Partner Program • Bali</span>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-neutral-950 font-normal sm:font-medium tracking-tight leading-[1.18]">
            <span className="inline-flex flex-wrap items-center gap-x-3.5 sm:gap-x-5 gap-y-2">
              <span className="whitespace-nowrap">Partner with</span>
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-[38px] sm:h-[58px] md:h-[72px] lg:h-[84px] xl:h-[92px] w-auto object-contain align-middle"
              />
            </span>
            <span className="block text-xl sm:text-3xl lg:text-4xl text-neutral-600 font-light italic mt-1.5 sm:mt-2.5">
              Island Relaxation, Delivered.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
            Provide your villa guests, hotel clients, and travelers with top-rated mobile wellness rituals delivered directly to their accommodations across Bali. Track bookings in real time with transparent attribution and automated payouts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
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

        {/* Professional Value Matrix (Replaces generic AI checkmark pills) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-neutral-100">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-bold text-neutral-900 uppercase tracking-wide block">
              Zero Overhead
            </span>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              We provide certified therapists, luxury organic products, and mobile treatment beds.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-bold text-neutral-900 uppercase tracking-wide block">
              7-Day Attribution
            </span>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Custom QR tent cards and smart referral links automatically attribute guest bookings.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-bold text-neutral-900 uppercase tracking-wide block">
              Direct Disbursements
            </span>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Transparent commission payouts via Indonesian Bank Transfer, Wise, or PayPal.
            </p>
          </div>
        </div>
      </section>

      {/* Program Details: 3 Simple Steps */}
      <section className="space-y-4 sm:space-y-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            How It Works
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-neutral-950 tracking-tight">
            Seamless Guest Experience & Attribution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2">
            <span className="text-xs font-mono font-bold text-neutral-400">01</span>
            <h3 className="text-sm font-bold text-neutral-950">Join & Receive Code</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Complete the quick application form with your villa or contact details and choose your preferred payout method.
            </p>
          </div>

          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2">
            <span className="text-xs font-mono font-bold text-neutral-400">02</span>
            <h3 className="text-sm font-bold text-neutral-950">Display QR or Share Link</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Place your custom QR code on villa welcome tables or vehicle headrests, or share your tracked referral link online.
            </p>
          </div>

          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2">
            <span className="text-xs font-mono font-bold text-neutral-400">03</span>
            <h3 className="text-sm font-bold text-neutral-950">Earn on Completed Treatments</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Once guest appointments are completed and verified, commissions are ready for immediate withdrawal without minimum thresholds.
            </p>
          </div>
        </div>
      </section>

      {/* Hospitality Network Audience */}
      <section className="space-y-4 sm:space-y-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Who Can Partner
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-neutral-950 tracking-tight">
            Built for Bali Travel & Villa Hosts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-neutral-950">Villas & Boutique Hotels</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Offer on-demand mobile massage without the overhead of in-house staff. Guests scan your bedside or welcome tent card to reserve.
            </p>
          </div>

          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-neutral-950">Drivers & Tour Guides</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Recommend Bali's trusted in-villa massage to travelers after long day trips with your custom QR card in the car.
            </p>
          </div>

          <div className="p-5 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-neutral-950">Content Creators & Guides</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Feature Therapick in your Bali itinerary guides, links in bio, or travel recommendations with automatic 7-day tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border border-neutral-200/80 p-6 sm:p-10 rounded-3xl text-center space-y-3.5 bg-white shadow-2xs">
        <div className="flex justify-center mb-1">
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-6 sm:h-7 w-auto object-contain mix-blend-multiply opacity-80"
          />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-neutral-950 tracking-tight">
          Ready to Partner with Therapick?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Create your partner account today to access your custom referral link, printable QR code, and real-time booking tracker.
        </p>
        <div className="pt-1.5">
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
