import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/utils/slugify';
import { resolveSeoBrandProfile } from '@/lib/seoDomain';

import { unstable_cache } from 'next/cache';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

// Cache treatment metadata in memory for 300s to avoid hitting Supabase on every route click
const getCachedPublishedTreatments = unstable_cache(
  async () => {
    try {
      const { data: treatments } = await supabase
        .from('treatments')
        .select('*')
        .eq('is_published', true);
      return treatments || [];
    } catch (err) {
      console.error('Error fetching treatment metadata:', err);
      return [];
    }
  },
  ['published-treatments-meta'],
  { revalidate: 300, tags: ['treatments', 'spa-data'] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let host = 'www.booktherapick.com';
  let cookieHeader = '';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    cookieHeader = headersList.get('cookie') || '';
  } catch {}

  const profile = resolveSeoBrandProfile(host, cookieHeader);
  const isTherapick = profile.isTherapick;
  const isBaliDomain = profile.isBaliDomain;
  const brandName = profile.name;
  const baseUrl = profile.baseUrl;

  // Fast in-memory cached lookup by id or slug
  const treatments = await getCachedPublishedTreatments();
  const rawId = (id || '').trim();
  const cleanId = decodeURIComponent(rawId).toLowerCase();
  const treatment = treatments.find(
    (t: any) => t.id === rawId || createSlug(t.title) === cleanId || createSlug(t.title) === rawId || t.id.toLowerCase() === cleanId
  );

  const rawTitle = treatment?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const treatmentDesc = treatment?.desc || `Luxury in-villa ${rawTitle} treatment delivered directly to your private villa or resort by certified 5-star therapists.`;

  const title = isTherapick
    ? `${rawTitle} Bali | Massage Home Service & Outcall In-Villa Spa | Therapick`
    : `${rawTitle} Ubud | In-Villa Massage Home Service | ${brandName}`;

  const description = isTherapick
    ? `Book ${rawTitle} massage home service and outcall in-villa spa across Bali with Therapick. 5-star certified therapists arrive within 45-60 mins in Seminyak, Canggu, Ubud, Uluwatu, and Sanur. Pijat panggilan Bali profesional. ${treatmentDesc}`
    : `Experience 5-star ${rawTitle} massage home service delivered to your private villa or hotel in Ubud, Bali with ${brandName}. ${treatmentDesc}`;

  // Image for WhatsApp / OpenGraph preview: use therapick-favicon.png for crisp square preview
  const ogImage = isTherapick
    ? `${baseUrl}/therapick-favicon.png`
    : (isBaliDomain ? `${baseUrl}/homespa.png` : `${baseUrl}/elexoir.png`);

  const canonicalUrl = `${baseUrl}/rituals/${createSlug(rawTitle)}`;

  const keywords = isTherapick
    ? [
        rawTitle,
        `${rawTitle} Bali`,
        `massage home service ${rawTitle.toLowerCase()}`,
        `outcall massage ${rawTitle.toLowerCase()}`,
        `home massage ${rawTitle.toLowerCase()}`,
        `pijat panggilan ${rawTitle.toLowerCase()}`,
        `${rawTitle} in Villa`,
        `${rawTitle} Seminyak`,
        `${rawTitle} Canggu`,
        `${rawTitle} Ubud`,
        `${rawTitle} Uluwatu`,
        'massage home service bali',
        'outcall massage bali',
        'home massage bali',
        'pijat panggilan bali',
        'pijat panggilan denpasar',
        'In Villa Massage Bali',
        'Mobile Spa Bali',
        'Spa Delivery Bali',
        'Therapick Bali'
      ]
    : [
        rawTitle,
        `${rawTitle} Ubud`,
        `massage home service ubud`,
        `outcall massage ubud`,
        `pijat panggilan ubud`,
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
  let cookieHeader = '';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    cookieHeader = headersList.get('cookie') || '';
  } catch {}

  const profile = resolveSeoBrandProfile(host, cookieHeader);
  const isTherapick = profile.isTherapick;
  const brandName = profile.name;
  const baseUrl = profile.baseUrl;

  const treatments = await getCachedPublishedTreatments();
  const rawId = (id || '').trim();
  const cleanId = decodeURIComponent(rawId).toLowerCase();
  const treatment = treatments.find(
    (t: any) => t.id === rawId || createSlug(t.title) === cleanId || createSlug(t.title) === rawId || t.id.toLowerCase() === cleanId
  );

  const rawTitle = treatment?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const treatmentDesc = treatment?.desc || `Luxury in-villa ${rawTitle} treatment delivered directly to your private villa or resort.`;
  const canonicalUrl = `${baseUrl}/rituals/${createSlug(rawTitle)}`;
  const ogImage = isTherapick ? `${baseUrl}/therapick-favicon.png` : `${baseUrl}${profile.faviconUrl}`;

  // Schema.org Structured Data for Google rich search results & LLM entity resolution
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
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
            name: 'Treatments',
            item: `${baseUrl}/explore`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: rawTitle,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: `${rawTitle} - Massage Home Service & Outcall Spa`,
        serviceType: `${treatment?.category || 'Balinese Massage'} Home Service`,
        description: treatmentDesc,
        provider: {
          '@type': 'HealthAndBeautyBusiness',
          '@id': `${baseUrl}/#business`,
          name: brandName,
          url: baseUrl,
          logo: ogImage,
          telephone: profile.telephone,
          priceRange: '$$',
        },
        areaServed: profile.areasServed.map((area) => ({
          '@type': area.type || 'Place',
          name: area.name,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: area.lat,
            longitude: area.lng,
          },
        })),
        offers: (treatment?.options && treatment.options.length > 0)
          ? treatment.options.map((opt: any) => ({
              '@type': 'Offer',
              price: opt.price,
              priceCurrency: 'IDR',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
              name: `${opt.duration} Minutes ${rawTitle}`,
              description: `${opt.duration} minutes of professional in-villa ${rawTitle} massage home service.`,
            }))
          : (treatment?.price ? [{
              '@type': 'Offer',
              price: treatment.price,
              priceCurrency: 'IDR',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
              name: rawTitle,
              description: treatmentDesc,
            }] : []),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '128',
          bestRating: '5',
          worstRating: '1',
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
