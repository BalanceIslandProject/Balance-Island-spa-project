'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAffiliateCookie, getAffiliateCookie } from '@/lib/affiliateAttribution';

interface AffiliateTrackerProps {
  brand: string;
}

export default function AffiliateTracker({ brand }: AffiliateTrackerProps) {
  const searchParams = useSearchParams();
  const trackedRef = useRef(false);

  useEffect(() => {
    // STRICT DOMAIN ISOLATION:
    // Only track if active brand is 'therapick'
    if (brand !== 'therapick') return;
    if (trackedRef.current) return;

    const refParam = searchParams?.get('ref');

    // DIRECT VISITS / PAGE REFRESHES:
    // Must preserve any active 7-day affiliate attribution!
    // Do NOT clear or reset the active referral or its original click expiration.
    if (!refParam) {
      // Passively check expiration (will purge only if past 7 days)
      getAffiliateCookie();
      return;
    }

    const cleanCode = refParam.trim().toUpperCase();
    if (!cleanCode) return;

    trackedRef.current = true;

    // Validate partner against Supabase database via server endpoint
    fetch('/api/affiliates/clicks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partnerCode: cleanCode,
        landingPath: window.location.pathname,
        referrer: document.referrer || '',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Only set/replace referral attribution if partner is valid and active in database
        if (data.success && data.partner_id && data.partner_code) {
          // Last-touch model: replaces prior partner and resets 7-day timer from this touch
          setAffiliateCookie(data.partner_code, data.partner_id);
        } else {
          // If the partner is invalid, suspended, or inactive:
          // REJECT it and DO NOT overwrite or delete the existing valid referral!
          console.warn('Rejected invalid or inactive affiliate referral code:', cleanCode);
        }
      })
      .catch((err) => {
        console.error('Affiliate tracking error:', err);
      });
  }, [brand, searchParams]);

  return null;
}
