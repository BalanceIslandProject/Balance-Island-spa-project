import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        // Basic check or general revalidation
        if (body.action === 'revalidate' || !body.action) {
            revalidatePath('/', 'layout');
            revalidatePath('/api/spa-data');
            try {
                (revalidateTag as any)('spa-data', { expire: 0 });
                (revalidateTag as any)('spa-data-therapick', { expire: 0 });
                (revalidateTag as any)('spa-data-bali', { expire: 0 });
                (revalidateTag as any)('spa-data-elexoir', { expire: 0 });
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
