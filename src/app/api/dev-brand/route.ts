import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const brand = request.nextUrl.searchParams.get('brand') || 'therapick';
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('dev_brand', brand, { path: '/', maxAge: 60 * 60 * 24 });
    return response;
}
