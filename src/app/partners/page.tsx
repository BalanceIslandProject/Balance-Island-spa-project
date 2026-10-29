import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="space-y-10 sm:space-y-12 py-2 sm:py-6 max-w-4xl mx-auto">
      
      {/* Hero Section */}
      <section className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-10 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] space-y-6">
        
        {/* Program Badge */}
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] bg-[#fafafa] px-3 py-1 rounded-[6px] border border-[#ebebeb]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]" />
          <span>Partner Program • Bali</span>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-[56px] text-[#171717] font-normal tracking-[-0.05em] leading-[1.05]">
            <span className="inline-flex flex-wrap items-center gap-x-3.5 sm:gap-x-5 gap-y-2">
              <span className="whitespace-nowrap">Partner with</span>
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-[36px] sm:h-[52px] md:h-[64px] w-auto object-contain align-middle"
              />
            </span>
            <span className="block text-xl sm:text-2xl lg:text-3xl text-[#666666] font-normal tracking-[-0.03em] mt-2">
              Island Relaxation, Delivered.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#4d4d4d] leading-relaxed max-w-2xl font-normal">
            Provide your villa guests, hotel clients, and travelers with top-rated mobile wellness rituals delivered directly to their accommodations across Bali. Track bookings in real time with transparent attribution and automated payouts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <Link
            href="/partners/register"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#171717] text-white font-mono text-[11px] uppercase tracking-[0.071em] hover:bg-black transition-colors"
          >
            <span>Apply as a Partner</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/partners/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-[6px] border border-[#ebebeb] bg-white text-[#171717] font-mono text-[11px] uppercase tracking-[0.071em] hover:bg-[#fafafa] transition-colors"
          >
            Partner Portal Login
          </Link>
        </div>

        {/* Professional Value Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#ebebeb]">
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-1">
            <span className="font-mono text-[11px] text-[#171717] uppercase tracking-[0.071em] block font-medium">
              Zero Overhead
            </span>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              We provide certified therapists, luxury organic products, and mobile treatment beds.
            </p>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-1">
            <span className="font-mono text-[11px] text-[#171717] uppercase tracking-[0.071em] block font-medium">
              7-Day Attribution
            </span>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              Custom QR tent cards and smart referral links automatically attribute guest bookings.
            </p>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-1">
            <span className="font-mono text-[11px] text-[#171717] uppercase tracking-[0.071em] block font-medium">
              Direct Disbursements
            </span>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              Transparent commission payouts via Indonesian Bank Transfer, Wise, or PayPal.
            </p>
          </div>
        </div>
      </section>

      {/* Program Details: 3 Simple Steps */}
      <section className="space-y-4 sm:space-y-5">
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] block">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-[30px] font-normal text-[#171717] tracking-[-0.05em] leading-tight">
            Seamless Guest Experience & Attribution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-mono text-xs text-[#8f8f8f] block">01</span>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Join & Receive Code</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Complete the quick application form with your villa or contact details and choose your preferred payout method.
            </p>
          </div>

          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-mono text-xs text-[#8f8f8f] block">02</span>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Display QR or Share Link</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Place your custom QR code on villa welcome tables or vehicle headrests, or share your tracked referral link online.
            </p>
          </div>

          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-mono text-xs text-[#8f8f8f] block">03</span>
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Earn on Completed Treatments</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Once guest appointments are completed and verified, commissions are ready for immediate withdrawal without minimum thresholds.
            </p>
          </div>
        </div>
      </section>

      {/* Hospitality Network Audience */}
      <section className="space-y-4 sm:space-y-5">
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] block">
            Who Can Partner
          </span>
          <h2 className="text-2xl sm:text-[30px] font-normal text-[#171717] tracking-[-0.05em] leading-tight">
            Built for Bali Travel & Villa Hosts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-1.5">
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Villas & Boutique Hotels</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Offer on-demand mobile massage without the overhead of in-house staff. Guests scan your bedside or welcome tent card to reserve.
            </p>
          </div>

          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-1.5">
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Drivers & Tour Guides</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Recommend Bali's trusted in-villa massage to travelers after long day trips with your custom QR card in the car.
            </p>
          </div>

          <div className="p-5 border border-[#ebebeb] rounded-[6px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] space-y-1.5">
            <h3 className="text-sm font-medium text-[#171717] tracking-[-0.02em]">Content Creators & Guides</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Feature Therapick in your Bali itinerary guides, links in bio, or travel recommendations with automatic 7-day tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border border-[#ebebeb] p-6 sm:p-10 rounded-[6px] text-center space-y-3.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="flex justify-center mb-1">
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-6 sm:h-7 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl sm:text-[30px] font-normal text-[#171717] tracking-[-0.05em] leading-tight">
          Ready to Partner with Therapick?
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto leading-relaxed">
          Create your partner account today to access your custom referral link, printable QR code, and real-time booking tracker.
        </p>
        <div className="pt-1.5">
          <Link
            href="/partners/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#171717] text-white font-mono text-[11px] uppercase tracking-[0.071em] hover:bg-black transition-colors"
          >
            <span>Create Partner Account</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

    </div>
  );
}
