import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';
import PartnerNav from './PartnerNav';

export const metadata = {
  title: 'Partner Program | BookTherapick Bali',
  description: 'Join the BookTherapick Partner Program. Earn 15% commission on every completed mobile spa booking.',
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
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white antialiased">
      <PartnerNav session={session} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}

