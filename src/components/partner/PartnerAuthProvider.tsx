'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

interface PartnerAuthProviderProps {
  children: React.ReactNode;
  publishableKey?: string;
}

export default function PartnerAuthProvider({
  children,
  publishableKey,
}: PartnerAuthProviderProps) {
  const pk = publishableKey || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isKeyValid = Boolean(pk && (pk.startsWith('pk_test_') || pk.startsWith('pk_live_')));

  if (!isKeyValid) {
    // If Clerk keys are not configured yet, render children smoothly without throwing a runtime error
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={pk}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/partner"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}
