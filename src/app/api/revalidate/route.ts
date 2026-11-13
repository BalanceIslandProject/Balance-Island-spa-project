import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'revalidate' || !body.action) {
      // Revalidate layout and core pages
      revalidatePath('/', 'layout');
      revalidatePath('/explore');
      revalidatePath('/service-areas');
      revalidatePath('/faq');
      revalidatePath('/contact');
      revalidatePath('/sitemap.xml');
      revalidatePath('/robots.txt');
      revalidatePath('/api/spa-data');

      // Revalidate cache tags for treatment schemas and spa data
      try {
        (revalidateTag as any)('spa-data');
        (revalidateTag as any)('spa-data-therapick');
        (revalidateTag as any)('spa-data-bali');
        (revalidateTag as any)('spa-data-elexoir');
        (revalidateTag as any)('treatments');
        (revalidateTag as any)('published-treatments-meta');
        (revalidateTag as any)('explore-treatments-meta');

        if (body.brand) {
          (revalidateTag as any)(`spa-data-${body.brand}`);
        }
      } catch (tagErr) {
        console.warn('revalidateTag notice:', tagErr);
      }

      return NextResponse.json({ revalidated: true, now: Date.now() });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
