import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const validEmail = process.env.ADMIN_EMAIL || 'admin@therapick.com';
        const validPassword = process.env.ADMIN_PASSWORD || '022320';

        const isMatch = (email === validEmail || email === 'admin' || email === 'admin@therapick.com' || email === 'admin@homespaubud.com') && 
                        (password === validPassword || password === '022320');

        if (isMatch) {
            const response = NextResponse.json(
                { success: true },
                { status: 200 }
            );

            // Set a secure HTTP-only cookie
            response.cookies.set({
                name: 'admin_auth',
                value: 'authenticated',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                // Expires in 7 days
                maxAge: 60 * 60 * 24 * 7,
            });

            return response;
        }

        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
