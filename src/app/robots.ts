import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('host') || host;
  } catch {
    // fallback to default
  }

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const isBali = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
  const baseUrl = isTherapick 
    ? 'https://www.booktherapick.com' 
    : (isBali ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
