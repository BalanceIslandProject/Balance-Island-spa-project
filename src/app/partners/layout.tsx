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
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col md:flex-row font-sans selection:bg-neutral-900 selection:text-white antialiased">
      <PartnerNav session={session} />
      <main className="flex-1 min-w-0 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 pb-24 md:pb-12 overflow-y-auto">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

