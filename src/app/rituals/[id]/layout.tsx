import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/utils/slugify';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const cleanHost = host.toLowerCase().split(':')[0].trim();
  const isPartnersSubdomain = cleanHost.startsWith('partners.');
  const isTherapick = cleanHost.includes('booktherapick') || cleanHost.includes('therapick') || isPartnersSubdomain;
  const isBaliDomain = (cleanHost.includes('homespaubud') || cleanHost.includes('ubudhomespa')) && !cleanHost.includes('elexoir');

  const brandName = isTherapick ? 'Therapick Bali' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
  const baseUrl = isTherapick
    ? 'https://www.booktherapick.com'
    : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  // Fetch treatments from Supabase to match by id or slug
  let treatment: any = null;
  try {
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .eq('is_published', true);

    if (treatments && treatments.length > 0) {
      treatment = treatments.find(
        (t: any) => t.id === id || createSlug(t.title) === id
      );
    }
  } catch (err) {
    console.error('Error fetching treatment metadata:', err);
  }

  const rawTitle = treatment?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const treatmentDesc = treatment?.desc || `Luxury in-villa ${rawTitle} treatment delivered directly to your private villa or resort by certified 5-star therapists.`;

  const title = isTherapick
    ? `${rawTitle} in Bali | In-Villa Spa Treatment | Therapick`
    : `${rawTitle} in Ubud | Luxury In-Villa Massage | ${brandName}`;

  const description = isTherapick
    ? `Book ${rawTitle} delivered directly to your private villa or hotel across Bali with Therapick. 5-star certified therapists arrive within 45-60 mins in Seminyak, Canggu, Ubud, Uluwatu, and Sanur. ${treatmentDesc}`
    : `Experience 5-star ${rawTitle} delivered to your private villa or hotel in Ubud, Bali with ${brandName}. ${treatmentDesc}`;

  // Image for WhatsApp / OpenGraph preview: use therapick-favicon.png for crisp square preview
  const ogImage = isTherapick
    ? `${baseUrl}/therapick-favicon.png`
    : (isBaliDomain ? `${baseUrl}/homespa.png` : `${baseUrl}/elexoir.png`);

  const canonicalUrl = `${baseUrl}/rituals/${createSlug(rawTitle)}`;

  const keywords = isTherapick
    ? [
        rawTitle,
        `${rawTitle} Bali`,
        `${rawTitle} in Villa`,
        `${rawTitle} Seminyak`,
        `${rawTitle} Canggu`,
        `${rawTitle} Ubud`,
        `${rawTitle} Uluwatu`,
        'In Villa Massage Bali',
        'Mobile Spa Bali',
        'Spa Delivery Bali',
        'Therapick Bali',
        'BookTherapick'
      ]
    : [
        rawTitle,
        `${rawTitle} Ubud`,
        `${rawTitle} in Villa Ubud`,
        'Home Spa Ubud',
        'Mobile Spa Ubud',
        'In Villa Massage Ubud'
      ];

  return {
    title: title,
    description: description,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    icons: isTherapick
      ? {
          icon: [
            { url: '/therapick-favicon.png', type: 'image/png' },
            { url: '/therapick-favicon.png?v=3', type: 'image/png' },
          ],
          shortcut: [{ url: '/therapick-favicon.png', type: 'image/png' }],
          apple: [{ url: '/therapick-favicon.png', sizes: '180x180', type: 'image/png' }],
        }
      : {
          icon: [{ url: isBaliDomain ? '/homespa.png' : '/elexoir.png', type: 'image/png' }],
          shortcut: [{ url: isBaliDomain ? '/homespa.png' : '/elexoir.png', type: 'image/png' }],
          apple: [{ url: isBaliDomain ? '/homespa.png' : '/elexoir.png', sizes: '180x180', type: 'image/png' }],
        },
    openGraph: {
      title: title,
      description: description,
      url: canonicalUrl,
      siteName: brandName,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: `${rawTitle} - ${brandName}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: title,
      description: description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'geo.region': 'ID-BA',
      'geo.placename': isTherapick ? 'Bali, Indonesia' : 'Ubud, Gianyar, Bali, Indonesia',
      'DC.title': title,
      'DC.description': description,
    },
  };
}

export default async function RitualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const cleanHost = host.toLowerCase().split(':')[0].trim();
  const isTherapick = cleanHost.includes('booktherapick') || cleanHost.includes('therapick');
  const brandName = isTherapick ? 'Therapick Bali' : 'Home Spa Ubud';
  const baseUrl = isTherapick ? 'https://www.booktherapick.com' : 'https://www.homespaubud.com';

  let treatment: any = null;
  try {
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .eq('is_published', true);

    if (treatments && treatments.length > 0) {
      treatment = treatments.find(
        (t: any) => t.id === id || createSlug(t.title) === id
      );
    }
  } catch {}

  const rawTitle = treatment?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const treatmentDesc = treatment?.desc || `Luxury in-villa ${rawTitle} treatment delivered directly to your private villa or resort.`;
  const canonicalUrl = `${baseUrl}/rituals/${createSlug(rawTitle)}`;
  const ogImage = isTherapick ? `${baseUrl}/therapick-favicon.png` : `${baseUrl}/homespa.png`;

  // Schema.org Structured Data for Google rich search results
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonicalUrl}#service`,
    name: rawTitle,
    serviceType: treatment?.category || 'In-Villa Massage & Spa',
    description: treatmentDesc,
    provider: {
      '@type': 'HealthAndBeautyBusiness',
      name: brandName,
      url: baseUrl,
      logo: ogImage,
      telephone: '+6282266554600',
      priceRange: '$$',
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: isTherapick ? 'Bali Province' : 'Ubud, Gianyar, Bali',
    },
    offers: (treatment?.options || []).map((opt: any) => ({
      '@type': 'Offer',
      price: opt.price,
      priceCurrency: 'IDR',
      name: `${opt.duration} Minutes ${rawTitle}`,
      description: `${opt.duration} minutes of professional in-villa ${rawTitle} therapy.`,
    })),
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
