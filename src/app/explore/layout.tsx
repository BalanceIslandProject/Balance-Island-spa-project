import { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/utils/slugify';
import { resolveSeoBrandProfile } from '@/lib/seoDomain';
import { unstable_cache } from 'next/cache';

type Props = {
  children: React.ReactNode;
};

// Cache treatment metadata in memory for 300s
const getCachedBrandTreatments = unstable_cache(
  async (brand: string) => {
    try {
      let { data: treatments } = await supabase
        .from('treatments')
        .select('id, title, desc, price, options, category')
        .eq('is_published', true)
        .eq('brand', brand);

      if ((!treatments || treatments.length === 0) && brand === 'bali') {
        const fallback = await supabase
          .from('treatments')
          .select('id, title, desc, price, options, category')
          .eq('is_published', true)
          .eq('brand', 'elexoir');
        treatments = fallback.data || [];
      }
      return treatments || [];
    } catch (err) {
      console.error('Error fetching explore treatments schema:', err);
      return [];
    }
  },
  ['explore-treatments-meta'],
  { revalidate: 300, tags: ['treatments', 'spa-data'] }
);

export async function generateMetadata(): Promise<Metadata> {
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
  const iconUrl = profile.iconUrl;

  const title = isTherapick
    ? 'In-Villa Massage & Spa Treatment Menu Bali | Therapick'
    : `Spa Treatments & In-Villa Massage Menu Ubud | ${brandName}`;

  const description = isTherapick
    ? 'Explore luxury mobile spa treatments and in-villa massage packages across Bali with Therapick. Traditional Balinese, deep tissue, hot stone, and bespoke couples sanctuary rituals delivered to your villa in 45-60 mins.'
    : `Explore 5-star luxury mobile spa treatments and in-villa massage packages in Ubud, Bali. Authentic Balinese therapies, deep tissue recovery, and couples rituals delivered to your private villa in Ubud by ${brandName}.`;

  const keywords = isTherapick
    ? [
        'Spa Treatments Bali',
        'In Villa Massage Packages Bali',
        'Bali Spa Menu',
        'Balinese Massage Bali',
        'Deep Tissue Massage Bali',
        'Couples Massage Bali',
        'Hot Stone Massage Bali',
        'Book Massage Bali',
        'Therapick Treatments',
        'Mobile Spa Menu Bali',
      ]
    : [
        'Ubud Spa Menu',
        'In Villa Massage Ubud Packages',
        'Ubud Massage Treatments',
        'Balinese Massage Ubud',
        'Ubud Deep Tissue Massage',
        'Couples Massage Ubud Menu',
        `${brandName} Treatments`,
      ];

  return {
    title: title,
    description: description,
    keywords: keywords,
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
          icon: [{ url: `${profile.faviconUrl}?v=2`, type: 'image/png' }],
          shortcut: [{ url: `${profile.faviconUrl}?v=2`, type: 'image/png' }],
          apple: [{ url: `${profile.faviconUrl}?v=2`, sizes: '180x180', type: 'image/png' }],
        },
    openGraph: {
      title: title,
      description: description,
      url: `${baseUrl}/explore`,
      siteName: brandName,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: iconUrl,
          width: 800,
          height: 800,
          alt: `${brandName} Treatments`,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}/explore`,
    },
    other: {
      'geo.region': profile.geoRegion,
      'geo.placename': profile.geoPlacename,
      'geo.position': `${profile.geoCoordinates.lat};${profile.geoCoordinates.lng}`,
      'ICBM': profile.icbm,
    },
  };
}

export default async function ExploreLayout({ children }: Props) {
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
  const treatments = await getCachedBrandTreatments(profile.brand);

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/explore#breadcrumb`,
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
            name: 'Treatments & Menu',
            item: `${baseUrl}/explore`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/explore#webpage`,
        url: `${baseUrl}/explore`,
        name: isTherapick
          ? 'In-Villa Massage & Spa Treatment Menu Bali'
          : `In-Villa Massage & Spa Treatment Menu Ubud - ${brandName}`,
        description: profile.description,
        provider: {
          '@type': 'HealthAndBeautyBusiness',
          name: brandName,
          url: baseUrl,
          telephone: profile.telephone,
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: treatments.length,
          itemListElement: treatments.slice(0, 25).map((t: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${baseUrl}/rituals/${createSlug(t.title)}`,
            name: t.title,
            description: t.desc || `${t.title} mobile in-villa massage home service.`,
          })),
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
