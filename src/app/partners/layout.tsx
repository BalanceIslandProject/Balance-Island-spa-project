import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';
import PartnerNav from './PartnerNav';

export const metadata = {
  title: 'Partner Program | BookTherapick Bali',
  description: 'Join the BookTherapick Affiliate & Referral Program. Earn 15% commission on every completed mobile spa booking.',
};

export default async function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // STRICT DOMAIN ISOLATION:
  // Reject access on any non-BookTherapick host
  if (!isBookTherapickHost(host)) {
    notFound();
  }

  const session = await getPartnerSession();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col selection:bg-amber-800 selection:text-white">
      <PartnerNav session={session} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-[#E8E2D9] bg-white py-8 text-center text-xs sm:text-sm text-[#736B63]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-[#1A1A1A]">BookTherapick Partner Program</span> &bull; Exclusively for Bali Hospitality & Creators
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.booktherapick.com" className="hover:text-amber-900 transition-colors">Return to BookTherapick</a>
            <a href="mailto:partners@booktherapick.com" className="hover:text-amber-900 transition-colors">Partner Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
