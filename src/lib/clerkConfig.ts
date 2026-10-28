/**
 * Clerk Configuration & Environment Detection for Therapick Partner Portal
 */

export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const secretKey = process.env.CLERK_SECRET_KEY || '';
  
  // Verify publishable key starts with pk_test_ or pk_live_
  const hasValidPub = Boolean(publishableKey && (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')));
  const hasValidSec = Boolean(secretKey && (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')));

  return hasValidPub && hasValidSec;
}

export function getClerkPublishableKey(): string {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
}
