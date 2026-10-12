import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Percent, 
  QrCode, 
  ShieldCheck, 
  Building, 
  Compass, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Wallet,
  Star
} from 'lucide-react';

export default function PartnerProgramOverviewPage() {
  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#1F1C18] via-[#2A2520] to-[#141210] text-white p-8 sm:p-14 lg:p-20 shadow-2xl overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/20 text-amber-300 text-xs sm:text-sm font-medium tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-300" />
            BookTherapick Official Partner Program
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.15] text-white">
            Partner with Bali’s 5-Star Mobile Spa & Earn <span className="italic font-light text-amber-300">15% Commission</span>
          </h1>

          <p className="text-[#D1C9BE] text-base sm:text-lg lg:text-xl font-light leading-relaxed">
            Offer your guests, clients, and followers Bali’s premier luxury in-villa massages and wellness rituals. Generate reliable passive income on every completed treatment.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              href="/partners/register"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-amber-300 text-[#1A1A1A] font-semibold text-base shadow-lg hover:bg-amber-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Apply as a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partners/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-base border border-white/15 transition-colors"
            >
              Partner Portal Login
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10 text-xs sm:text-sm text-[#B8AF9F]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to join
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 30-day cookie window
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified payouts in IDR
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
            Why Bali Hospitality Leaders Choose Us
          </h2>
          <p className="text-sm sm:text-base text-[#6B645C]">
            A seamless experience for your guests and a dependable revenue stream for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">15% Base Commission</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Earn a generous 15% net commission on every eligible treatment booked through your custom link or QR code. No caps on earnings.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Printable QR Code & Links</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Display your custom QR code on villa welcome booklets, hotel desks, or vehicle seatbacks for immediate on-demand guest bookings.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">5-Star Certified Therapists</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Rest assured your guests receive Bali’s highest standard of massage therapy with certified therapists, organic oils, and pristine equipment.
            </p>
          </div>
        </div>
      </section>

      {/* Ideal For Sections */}
      <section className="rounded-3xl bg-[#F4EFE6] p-8 sm:p-12 lg:p-16 border border-[#E4DCD0] space-y-8">
        <div className="max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Who We Work With</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
            Tailored For Bali Hospitality & Creators
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E0D7CA] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] text-[#1A1A1A] flex items-center justify-center">
              <Building className="w-5 h-5 text-amber-800" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Villas, Hotels & Concierges</h3>
            <p className="text-xs sm:text-sm text-[#6B645C] leading-relaxed">
              Provide your villa guests with premium spa services without hiring in-house staff. Keep a table display QR code in every bedroom.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E0D7CA] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] text-[#1A1A1A] flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-800" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Tour Drivers & Local Guides</h3>
            <p className="text-xs sm:text-sm text-[#6B645C] leading-relaxed">
              Tourists constantly ask for the best massage in Bali after day trips. Hand them your card or let them scan your car QR code.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E0D7CA] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] text-[#1A1A1A] flex items-center justify-center">
              <Camera className="w-5 h-5 text-amber-800" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Influencers & Travel Bloggers</h3>
            <p className="text-xs sm:text-sm text-[#6B645C] leading-relaxed">
              Monetize your Bali travel guides, reels, and stories with high-converting referral links and a 30-day tracking cookie.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
            How the Partner Program Works
          </h2>
          <p className="text-sm sm:text-base text-[#6B645C]">
            Three simple steps to start earning with BookTherapick
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-white p-8 rounded-2xl border border-[#E8E2D9] relative space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Sign Up in Minutes</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Complete the quick application form with your preferred referral code and payout method (Indonesian Bank, Wise, or PayPal).
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E8E2D9] relative space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Share Link or QR Code</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Access your personal dashboard to download high-resolution QR codes and track link clicks with our 30-day cookie window.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E8E2D9] relative space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Receive Payouts</h3>
            <p className="text-sm text-[#6B645C] leading-relaxed">
              Once guest bookings are confirmed and completed, commissions are approved and paid directly to your chosen account.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="rounded-3xl bg-[#1A1A1A] text-white p-10 sm:p-14 text-center space-y-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
          Ready to Grow Your Income with BookTherapick?
        </h2>
        <p className="text-[#C2BAAF] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Join leading Bali villa hosts, guides, and creators today. Registration takes less than 2 minutes.
        </p>
        <div className="pt-2">
          <Link
            href="/partners/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-300 text-[#1A1A1A] font-semibold text-base hover:bg-amber-200 transition-all shadow-lg"
          >
            Create Your Partner Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
