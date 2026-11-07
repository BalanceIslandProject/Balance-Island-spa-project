import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const isBaliDomain = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
  const brandName = isTherapick ? 'Therapick' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
  const baseUrl = isTherapick
    ? 'https://www.booktherapick.com'
    : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  const title = `Concierge & Contact | ${brandName} Massage Home Service Bali`;
  const description = `Contact ${brandName} concierge for 5-star massage home service and outcall spa bookings across Bali. Direct WhatsApp concierge, treatment inquiries, and group reservations.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/contact`,
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
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const baseUrl = isTherapick ? 'https://www.booktherapick.com' : 'https://www.homespaubud.com';
  const brandName = isTherapick ? 'Therapick Bali' : 'Home Spa Ubud';

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
          telephone: isTherapick ? '+62 851 7411 9423' : '+62 822 6655 4600',
          email: isTherapick ? 'contact@booktherapick.com' : 'info@homespaubud.com',
          url: baseUrl,
          areaServed: isTherapick ? 'Bali, Indonesia' : 'Ubud, Gianyar, Bali, Indonesia',
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

