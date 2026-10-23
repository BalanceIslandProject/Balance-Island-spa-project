import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';
import PartnerNav from './PartnerNav';

export const metadata = {
  title: 'Partner Program | BookTherapick Bali',
  description: 'Join the BookTherapick Partner Program. Earn commission on every completed mobile spa booking.',
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
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#F8FAFC] text-neutral-900 flex flex-col md:flex-row font-sans selection:bg-neutral-900 selection:text-white antialiased relative">
      {/* Apple Liquid Glass Ambient Light Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-emerald-100/35 via-teal-100/15 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/30 via-indigo-100/15 to-transparent blur-3xl opacity-70" />
        <div className="absolute -bottom-[20%] left-[25%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-rose-100/25 via-amber-100/15 to-transparent blur-3xl opacity-60" />
      </div>

      <PartnerNav session={session} />
      <main className="flex-1 min-w-0 w-full h-full md:h-screen md:overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 pb-24 md:pb-12 overscroll-contain">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

