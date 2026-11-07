import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import ServiceAreas from '@/components/ServiceAreas';

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

  const title = `Service Areas | Massage Home Service & Outcall Spa Across Bali | ${brandName}`;
  const description = `Explore ${brandName}'s 5-star massage home service and outcall spa coverage across Bali: Seminyak, Canggu, Ubud, Uluwatu, Sanur, Nusa Dua, Jimbaran, and Kuta. Arriving in 45-60 mins.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/service-areas`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/service-areas`,
      siteName: brandName,
      type: 'website',
    },
  };
}

export default async function ServiceAreasPage() {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const baseUrl = isTherapick ? 'https://www.booktherapick.com' : 'https://www.homespaubud.com';

  const areas = [
    { name: 'Seminyak', slug: 'seminyak', desc: 'Petitenget, Oberoi, Batu Belig, Double Six' },
    { name: 'Canggu', slug: 'canggu', desc: 'Batu Bolong, Echo Beach, Berawa, Pererenan' },
    { name: 'Ubud', slug: 'ubud', desc: 'Ubud Center, Sayan, Penestanan, Kedewatan, Tegallalang' },
    { name: 'Uluwatu', slug: 'uluwatu', desc: 'Padang Padang, Bingin, Dreamland, Pecatu' },
    { name: 'Sanur', slug: 'sanur', desc: 'Beachfront villas, Danau Tamblingan, Bypass' },
    { name: 'Nusa Dua', slug: 'nusa-dua', desc: 'ITDC Luxury Resorts, Sawangan, Tanjung Benoa' },
    { name: 'Jimbaran', slug: 'jimbaran', desc: 'Jimbaran Bay, Bukit, Ayana enclave' },
    { name: 'Kuta', slug: 'kuta', desc: 'Central hotels, Legian beachfront suites' },
  ];

  const targetAreas = isTherapick ? areas : [areas[2]]; // Ubud only for Home Spa Ubud

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/service-areas#breadcrumb`,
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
            name: 'Service Areas',
            item: `${baseUrl}/service-areas`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}/service-areas#itemlist`,
        name: 'Bali Massage Home Service & Outcall Spa Coverage Areas',
        itemListElement: targetAreas.map((area, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${area.name} Massage Home Service & Outcall Spa`,
          url: `${baseUrl}/locations/${area.slug}`,
          description: `5-star in-villa massage delivery across ${area.desc}. Arrives in 45-60 minutes.`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="min-h-screen bg-white pt-32 pb-24 font-sans px-6">
        <div className="max-w-7xl mx-auto">
          <ServiceAreas />
        </div>
      </div>
    </>
  );
}
