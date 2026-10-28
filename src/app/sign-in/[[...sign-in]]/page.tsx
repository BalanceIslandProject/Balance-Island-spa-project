'use client';

import React from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import PartnerAuthProvider from '@/components/partner/PartnerAuthProvider';

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const isClerkAvailable = Boolean(publishableKey && (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')));

  return (
    <PartnerAuthProvider>
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-neutral-900">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Link href="/partners" className="inline-block">
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-10 sm:h-12 w-auto mx-auto object-contain"
              />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950">
              Partner Portal Login
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Access your referral stats, real-time bookings, and commission payouts
            </p>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs p-6 sm:p-8 flex justify-center">
            {isClerkAvailable ? (
              <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/partner"
              />
            ) : (
              <div className="w-full space-y-5 text-center">
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left space-y-1.5 text-xs text-amber-800">
                  <span className="font-semibold block">Partner Portal Authentication</span>
                  <p>
                    Please log in with your verified partner credentials below or continue via the dedicated portal login.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <Link
                    href="/partners/login"
                    className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-colors shadow-xs"
                  >
                    Continue to Partner Login
                  </Link>
                  <Link
                    href="/partners/register"
                    className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs font-semibold tracking-wide hover:bg-neutral-50 transition-colors"
                  >
                    Apply for New Partner Account
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-neutral-400">
            <span>Therapick Bali • Home Wellness & Massage Partner Network</span>
          </div>
        </div>
      </div>
    </PartnerAuthProvider>
  );
}
