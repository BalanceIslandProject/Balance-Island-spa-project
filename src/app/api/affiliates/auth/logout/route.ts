import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('partner_session', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });
  return response;
}
