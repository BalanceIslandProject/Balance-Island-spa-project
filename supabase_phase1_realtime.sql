-- ==============================================================================
-- BOOKTHERAPICK - PHASE 1 REALTIME OPTIMIZATION MIGRATION
-- Project Reference: esioxxiawkawtpphexzf
-- Target: Zero-latency Realtime synchronization for Partner Portal
-- ==============================================================================

-- 1. Enable REPLICA IDENTITY FULL on core tables
-- This ensures PostgreSQL WAL sends complete row data on UPDATE events,
-- allowing Supabase Realtime to broadcast all updated fields without truncation.
ALTER TABLE IF EXISTS public.bookings REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.affiliate_commissions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.affiliate_payouts REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.affiliate_partners REPLICA IDENTITY FULL;

-- 2. Ensure tables are registered in the supabase_realtime publication
DO $$
BEGIN
  -- bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;

  -- affiliate_commissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'affiliate_commissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;
  END IF;

  -- affiliate_payouts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'affiliate_payouts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_payouts;
  END IF;

  -- affiliate_partners
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'affiliate_partners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_partners;
  END IF;
END $$;

-- 3. Optimization Indexes for High-Frequency Realtime Reconciliation
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_booking_id 
  ON public.affiliate_commissions(booking_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_partner_status 
  ON public.affiliate_commissions(partner_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_ref_status 
  ON public.bookings(reference_number, status, treatment_status);

