import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isProd = process.env.NODE_ENV === 'production';
  const isTherapickDomain = host.includes('booktherapick.com');

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('partner_session', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    domain: isProd && isTherapickDomain ? '.booktherapick.com' : undefined,
  });
  return response;
}
