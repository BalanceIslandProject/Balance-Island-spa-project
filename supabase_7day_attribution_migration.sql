-- ==============================================================================
-- BOOKTHERAPICK: 7-DAY AFFILIATE ATTRIBUTION SYSTEM MIGRATION
-- Migration to enforce 7-Day Referral Attribution, Idempotency, and Booking Columns
-- ==============================================================================

-- 1. Enforce 7-Day Cookie Duration in Affiliate Settings
UPDATE public.affiliate_program_settings
SET cookie_duration_days = 7,
    updated_at = NOW()
WHERE cookie_duration_days <> 7;

-- Ensure default value is 7 for any new records
ALTER TABLE public.affiliate_program_settings 
ALTER COLUMN cookie_duration_days SET DEFAULT 7;

-- 2. Ensure Bookings Table has Additive Affiliate Attribution Columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliate_partners(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS treatment_status TEXT DEFAULT 'Scheduled';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Direct';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS treatment_status_updated_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status_updated_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Indexes for high-performance referral attribution lookups
CREATE INDEX IF NOT EXISTS idx_bookings_affiliate_id ON public.bookings(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_bookings_affiliate_code ON public.bookings(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_bookings_reference_number ON public.bookings(reference_number);

-- 3. Idempotency Guard: Ensure only ONE commission entry per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_commissions_booking_id_unique 
ON public.affiliate_commissions(booking_id);

-- 4. Verify existing active partners
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_code_status 
ON public.affiliate_partners(partner_code, status);
