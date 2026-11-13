import { Metadata } from 'next';
import { headers } from 'next/headers';
import { resolveSeoBrandProfile } from '@/lib/seoDomain';

export async function generateMetadata(): Promise<Metadata> {
  let host = 'www.booktherapick.com';
  let cookieHeader = '';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    cookieHeader = headersList.get('cookie') || '';
  } catch {}

  const profile = resolveSeoBrandProfile(host, cookieHeader);
  const brandName = profile.name;
  const baseUrl = profile.baseUrl;

  const title = `Concierge & Contact | ${brandName} Massage Home Service Bali`;
  const description = `Contact ${brandName} concierge for 5-star massage home service and outcall spa bookings across Bali. Direct WhatsApp concierge, treatment inquiries, and group reservations.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/contact`,
    },
    icons: profile.isTherapick
      ? {
          icon: [
            { url: '/therapick-favicon.png', type: 'image/png' },
            { url: '/therapick-favicon.png?v=3', type: 'image/png' },
          ],
          shortcut: [{ url: '/therapick-favicon.png', type: 'image/png' }],
          apple: [{ url: '/therapick-favicon.png', sizes: '180x180', type: 'image/png' }],
        }
      : {
          icon: [{ url: `${profile.faviconUrl}?v=2`, type: 'image/png' }],
          shortcut: [{ url: `${profile.faviconUrl}?v=2`, type: 'image/png' }],
          apple: [{ url: `${profile.faviconUrl}?v=2`, sizes: '180x180', type: 'image/png' }],
        },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/contact`,
      siteName: brandName,
      type: 'website',
    },
  };
}

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  let host = 'www.booktherapick.com';
  let cookieHeader = '';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    cookieHeader = headersList.get('cookie') || '';
  } catch {}

  const profile = resolveSeoBrandProfile(host, cookieHeader);
  const brandName = profile.name;
  const baseUrl = profile.baseUrl;

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/contact#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Contact & Concierge',
            item: `${baseUrl}/contact`,
          },
        ],
      },
      {
        '@type': 'ContactPage',
        '@id': `${baseUrl}/contact#webpage`,
        name: `Contact ${brandName} Concierge`,
        description: `Get in touch with ${brandName} for on-demand massage home service and outcall in-villa spa bookings across Bali.`,
        mainEntity: {
          '@type': 'HealthAndBeautyBusiness',
          name: brandName,
          telephone: profile.telephone,
          email: profile.email,
          url: baseUrl,
          areaServed: profile.isTherapick ? 'Bali, Indonesia' : 'Ubud, Gianyar, Bali, Indonesia',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {children}
    </>
  );
}
