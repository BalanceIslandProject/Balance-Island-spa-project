import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';
import PartnerNav from './PartnerNav';
import PartnerTopBar from './PartnerTopBar';

export const metadata = {
  title: 'Partner Program | BookTherapick Bali',
  description: 'Join the BookTherapick Partner Program. Earn commission on every completed mobile spa booking.',
  icons: {
    icon: [
      { url: '/therapick-favicon.png', type: 'image/png' },
      { url: '/therapick-favicon.png?v=3', type: 'image/png' },
    ],
    shortcut: [{ url: '/therapick-favicon.png', type: 'image/png' }],
    apple: [
      { url: '/therapick-favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

  // STRICT DOMAIN ISOLATION
  if (!isBookTherapickHost(host)) {
    notFound();
  }

  const session = await getPartnerSession();

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f9fafb] text-[#111827] flex flex-col md:flex-row font-sans selection:bg-[#111827] selection:text-white antialiased relative">
      <PartnerNav session={session} />
      <div className="flex-1 flex flex-col min-w-0 w-full h-full md:h-screen md:overflow-hidden">
        {session && <PartnerTopBar session={session} />}
        <main className="flex-1 min-w-0 w-full h-full md:overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-12 overscroll-contain">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
