import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isBookTherapickHost } from '@/lib/domainIsolation';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const host = request.headers.get('host') || '';

    // 1. DOMAIN ISOLATION ENFORCEMENT:
    // The affiliate program exists exclusively for www.booktherapick.com.
    // Reject any attempt to access /partners or affiliate endpoints on other domains with 404.
    const isPartnerPath = path.startsWith('/partners') || path.startsWith('/api/affiliates');
    if (isPartnerPath) {
        if (!isBookTherapickHost(host)) {
            return new NextResponse(null, { status: 404, statusText: 'Not Found' });
        }
    }

    // 2. PARTNER PORTAL AUTHENTICATION:
    // Protect authenticated partner pages (/partners/dashboard, /partners/referrals, etc.)
    if (path.startsWith('/partners')) {
        const publicPartnerPaths = ['/partners', '/partners/login', '/partners/register'];
        const isPublicPartnerPath = publicPartnerPaths.includes(path);

        if (!isPublicPartnerPath) {
            const partnerCookie = request.cookies.get('partner_session');
            if (!partnerCookie || !partnerCookie.value) {
                const loginUrl = new URL('/partners/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
        }
    }

    // 3. ADMIN ROUTES:
    if (path.startsWith('/admin')) {
        // Allow access to the login page itself
        if (path === '/admin/login') {
            return NextResponse.next();
        }

        const authCookie = request.cookies.get('admin_auth');
        if (!authCookie || authCookie.value !== 'authenticated') {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Matching Paths
export const config = {
    matcher: ['/admin/:path*', '/partners/:path*', '/api/affiliates/:path*'],
};

