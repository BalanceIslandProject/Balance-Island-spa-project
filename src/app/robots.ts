import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveSeoBrandProfile } from '@/lib/seoDomain';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let host = 'www.booktherapick.com';
  let cookieHeader = '';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    cookieHeader = headersList.get('cookie') || '';
  } catch {
    // fallback to default
  }

  const profile = resolveSeoBrandProfile(host, cookieHeader);
  const baseUrl = profile.baseUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Explicitly allow leading Generative Engine Optimization (GEO) & AI search agents
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'Amazonbot',
          'cohere-ai',
          'Meta-ExternalAgent',
          'Bytespider',
        ],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
