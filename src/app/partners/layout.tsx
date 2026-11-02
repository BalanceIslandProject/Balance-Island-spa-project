import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';
import PartnerNav from './PartnerNav';
import PartnerTopBar from './PartnerTopBar';
import './cirrel.css';

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
    <div id="partner-portal-root" className="cirrel-app min-h-screen selection:bg-[#0a84ff] selection:text-white antialiased relative" data-theme="dark">
      {/* Cirrel Ambient Liquid Mesh Gradient Background */}
      <div className="cirrel-bg" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>

      {/* Cirrel Floating Frosted Glass Sidebar */}
      <PartnerNav session={session} />

      {/* Main View Area */}
      <div className="cirrel-main">
        {session && <PartnerTopBar session={session} />}
        <main className="cirrel-content">
          {children}
        </main>
      </div>
    </div>
  );
}

