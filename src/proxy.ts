import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Only protect /admin routes
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

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/admin/:path*',
};
