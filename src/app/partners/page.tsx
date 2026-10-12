import React from 'react';
import Link from 'next/link';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="space-y-16 py-4">
      
      {/* Hero Section */}
      <section className="border-b border-black/10 pb-12 space-y-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-black/50">
          BookTherapick Partner Program
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-black max-w-3xl leading-tight">
          Partner with Bali’s 5-Star Mobile Spa & Earn 15% Commission
        </h1>

        <p className="text-sm sm:text-base text-black/70 max-w-2xl leading-relaxed">
          Provide your guests, clients, and followers with top-rated mobile spa treatments delivered directly to villas and hotels across Bali. Earn passive revenue on every completed booking.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link
            href="/partners/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-colors"
          >
            Apply as a Partner
          </Link>
          <Link
            href="/partners/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-black/20 text-black text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-colors"
          >
            Partner Portal Login
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-black/60 font-medium">
          <div>&bull; Free to join</div>
          <div>&bull; 30-day referral window</div>
          <div>&bull; Verified payouts in IDR</div>
        </div>
      </section>

      {/* Program Details */}
      <section className="space-y-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-black">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Three straightforward steps to start earning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <span className="text-xs font-bold text-black/40">01</span>
            <h3 className="font-serif text-base font-bold text-black">Join</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Complete the application form with your villa or contact details and select your preferred payout method.
            </p>
          </div>

          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <span className="text-xs font-bold text-black/40">02</span>
            <h3 className="font-serif text-base font-bold text-black">Share Link or QR Code</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Display your custom QR code on villa welcome tables or vehicle headrests, or share your link online.
            </p>
          </div>

          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <span className="text-xs font-bold text-black/40">03</span>
            <h3 className="font-serif text-base font-bold text-black">Earn 15% Payouts</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Once guest appointments are completed and verified, commissions are deposited directly into your bank or Wise account.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="space-y-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-black">
            Who Can Partner
          </h2>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Built for hospitality hosts and travel professionals in Bali
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <h3 className="font-serif text-base font-bold text-black">Villas & Hotels</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Offer on-demand mobile massage without the overhead of in-house staff. Keep a table tent QR code in guest suites.
            </p>
          </div>

          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <h3 className="font-serif text-base font-bold text-black">Drivers & Tour Guides</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Recommend Bali's trusted in-villa spa to tourists after day tours with your custom QR code card in the car.
            </p>
          </div>

          <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-2">
            <h3 className="font-serif text-base font-bold text-black">Content Creators</h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Link BookTherapick in your travel guides, social bio, or recommendations with 30-day tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="border border-black/10 p-8 sm:p-12 rounded-2xl text-center space-y-4 bg-white">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-black">
          Ready to Start?
        </h2>
        <p className="text-xs sm:text-sm text-black/60 max-w-md mx-auto">
          Create your account today and access your personal referral link and QR code instantly.
        </p>
        <div className="pt-2">
          <Link
            href="/partners/register"
            className="inline-flex px-6 py-3 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-colors"
          >
            Create Partner Account
          </Link>
        </div>
      </section>

    </div>
  );
}
