import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {
    // fallback to default
  }

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const isBali = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
  const baseUrl = isTherapick 
    ? 'https://www.booktherapick.com' 
    : (isBali ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  const now = new Date();

  // Core pages
  const coreRoutes = [
    { path: '', priority: 1.0, freq: 'daily' as const },
    { path: '/explore', priority: 0.9, freq: 'daily' as const },
    { path: '/store', priority: 0.8, freq: 'weekly' as const },
    { path: '/contact', priority: 0.8, freq: 'monthly' as const },
    { path: '/philosophy', priority: 0.7, freq: 'monthly' as const },
    { path: '/service-areas', priority: 0.8, freq: 'weekly' as const },
    { path: '/why-choose-us', priority: 0.7, freq: 'monthly' as const },
    { path: '/faq', priority: 0.7, freq: 'monthly' as const },
    ...(isTherapick ? [{ path: '/partners', priority: 0.8, freq: 'weekly' as const }] : []),
  ].map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: now,
    changeFrequency: item.freq,
    priority: item.priority,
  }));

  // Location landing pages - STRICT DOMAIN ISOLATION
  // For Therapick: Comprehensive Bali coverage (Ubud, Canggu, Seminyak, Uluwatu, Sanur, Nusa Dua, Jimbaran, Kuta)
  // For Elexoir & Home Spa: Strictly Ubud only
  const targetLocations = isTherapick
    ? [
        'ubud',
        'canggu',
        'seminyak',
        'uluwatu',
        'sanur',
        'nusa-dua',
        'jimbaran',
        'kuta',
      ]
    : ['ubud'];

  const locations = targetLocations.map((location) => ({
    url: `${baseUrl}/locations/${location}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: location === 'ubud' ? 1.0 : 0.95,
  }));

  return [...coreRoutes, ...locations];
}
