import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isBookTherapickHost } from '@/lib/domainIsolation';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

    // Normalize host
    const cleanHost = host.toLowerCase().split(':')[0].trim();
    const isPartnersSubdomain = cleanHost.startsWith('partners.') || cleanHost.startsWith('partner.');

    // 1. SUBDOMAIN ROUTING FOR PARTNERS PORTAL (partners.booktherapick.com / partners.localhost)
    if (isPartnersSubdomain) {
        // Allow static assets, Next internals, and API routes to pass through directly
        if (
            path.startsWith('/_next') ||
            path.startsWith('/api') ||
            path.includes('.')
        ) {
            return NextResponse.next();
        }

        // Map root / or any subpath to /partners/...
        // e.g. / -> /partners
        //      /dashboard -> /partners/dashboard
        //      /login -> /partners/login
        //      /register -> /partners/register
        //      /partners/dashboard -> /partners/dashboard (unchanged)
        const targetPath = path.startsWith('/partners') 
            ? path 
            : `/partners${path === '/' ? '' : path}`;

        // Authentication enforcement for protected partner workspace paths
        const publicPartnerPaths = [
            '/partners',
            '/partners/login',
            '/partners/register',
            '/partners/terms',
            '/partners/privacy'
        ];
        const isPublicPath = publicPartnerPaths.some(p => targetPath === p || targetPath.startsWith(p));

        if (!isPublicPath) {
            const hasSession = Boolean(request.cookies.get('partner_session')?.value);
            if (!hasSession) {
                const loginPath = path.startsWith('/partners') ? '/partners/login' : '/login';
                return NextResponse.redirect(new URL(loginPath, request.url));
            }
        }

        // Rewrite path if needed
        if (targetPath !== path) {
            return NextResponse.rewrite(new URL(targetPath, request.url));
        }

        return NextResponse.next();
    }

    // 2. DOMAIN ISOLATION ENFORCEMENT:
    // The affiliate program exists exclusively for www.booktherapick.com and partners.booktherapick.com.
    // Reject any attempt to access /partners or affiliate endpoints on other domains with 404.
    // Note: /api/affiliates/admin/* is used by the authenticated admin dashboard across all brand domains.
    const isPartnerPath = 
        path.startsWith('/partners') || 
        (path.startsWith('/api/affiliates') && !path.startsWith('/api/affiliates/admin'));

    if (isPartnerPath) {
        if (!isBookTherapickHost(host)) {
            return new NextResponse(null, { status: 404, statusText: 'Not Found' });
        }
    }

    // 3. PARTNER PORTAL AUTHENTICATION (when accessed on main domain /partners/...):
    if (path.startsWith('/partners')) {
        const publicPartnerPaths = [
            '/partners',
            '/partners/login',
            '/partners/register',
            '/partners/terms',
            '/partners/privacy'
        ];
        const isPublicPartnerPath = publicPartnerPaths.some(p => path === p || path.startsWith(p));

        if (!isPublicPartnerPath) {
            const hasSession = Boolean(request.cookies.get('partner_session')?.value);
            if (!hasSession) {
                const loginUrl = new URL('/partners/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
        }
    }

    // 4. ADMIN ROUTES & ADMIN AFFILIATE API ROUTES:
    if (path.startsWith('/admin') || path.startsWith('/api/affiliates/admin')) {
        if (path === '/admin/login') {
            return NextResponse.next();
        }

        const authCookie = request.cookies.get('admin_auth');
        if (!authCookie || authCookie.value !== 'authenticated') {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
            }
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Matching Paths
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - static file extensions (.png, .jpg, .svg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
    ],
};


