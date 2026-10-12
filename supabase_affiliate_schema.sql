-- ==============================================================================
-- BOOKTHERAPICK AFFILIATE & REFERRAL PROGRAM SCHEMA (ADDITIVE MIGRATION)
-- Exclusively for www.booktherapick.com
-- ==============================================================================

-- 1. AFFILIATE PROGRAM SETTINGS
CREATE TABLE IF NOT EXISTS public.affiliate_program_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    default_commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    cookie_duration_days INTEGER NOT NULL DEFAULT 30,
    attribution_model VARCHAR(50) NOT NULL DEFAULT 'last_touch', -- 'last_touch' | 'first_touch'
    auto_approve_partners BOOLEAN NOT NULL DEFAULT FALSE,
    is_program_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings if table is empty
INSERT INTO public.affiliate_program_settings (id, default_commission_rate_pct, cookie_duration_days, attribution_model, auto_approve_partners, is_program_active)
SELECT gen_random_uuid(), 15.00, 30, 'last_touch', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_program_settings);

-- 2. AFFILIATE PARTNERS
CREATE TABLE IF NOT EXISTS public.affiliate_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    partner_type VARCHAR(50) NOT NULL DEFAULT 'content_creator', -- 'hotel_villa', 'tour_driver', 'content_creator', 'wellness_influencer', 'local_business', 'other'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'suspended'
    commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    password_hash VARCHAR(255) NOT NULL,
    payout_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer', -- 'bank_transfer', 'wise', 'paypal', 'cash'
    payout_details JSONB NOT NULL DEFAULT '{}'::jsonb, -- bank name, account number, account holder name, swift/iban, wise email, etc.
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partners_code ON public.affiliate_partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_email ON public.affiliate_partners(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_status ON public.affiliate_partners(status);

-- 3. AFFILIATE CLICKS (TRAFFIC & REFERRAL TRACKING)
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
    partner_code VARCHAR(50) NOT NULL,
    visitor_ip_hash VARCHAR(128),
    user_agent TEXT,
    referrer_url TEXT,
    landing_path VARCHAR(255) DEFAULT '/',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_partner_id ON public.affiliate_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_partner_code ON public.affiliate_clicks(partner_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);

-- 4. AFFILIATE ATTRIBUTIONS (BOOKING LINKAGE)
CREATE TABLE IF NOT EXISTS public.affiliate_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
    partner_code VARCHAR(50) NOT NULL,
    booking_id VARCHAR(100) NOT NULL, -- references public.bookings(id) or booking id string
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(100),
    first_touch_at TIMESTAMPTZ,
    last_touch_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_partner_id ON public.affiliate_attributions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_booking_id ON public.affiliate_attributions(booking_id);

-- 5. AFFILIATE COMMISSIONS
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
    partner_code VARCHAR(50) NOT NULL,
    booking_id VARCHAR(100) NOT NULL,
    booking_amount_gross NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    eligible_treatment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tip_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'paid', 'cancelled'
    payment_verified BOOLEAN NOT NULL DEFAULT FALSE,
    service_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payout_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_partner_id ON public.affiliate_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_booking_id ON public.affiliate_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

-- 6. AFFILIATE PAYOUTS
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
    partner_code VARCHAR(50) NOT NULL,
    payout_reference VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    payout_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    proof_document_url TEXT,
    notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_partner_id ON public.affiliate_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.affiliate_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Anonymous public read / insert policies where appropriate for public affiliate tracking & applications
-- 1) Program settings can be read publicly
CREATE POLICY "Public read affiliate settings" ON public.affiliate_program_settings
    FOR SELECT TO anon, authenticated USING (true);

-- 2) Public can register as partner (insert only)
CREATE POLICY "Public insert affiliate partners" ON public.affiliate_partners
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3) Public can record referral clicks
CREATE POLICY "Public insert affiliate clicks" ON public.affiliate_clicks
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4) Public can record booking attributions
CREATE POLICY "Public insert affiliate attributions" ON public.affiliate_attributions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Service role has full access to all tables
CREATE POLICY "Service role full access settings" ON public.affiliate_program_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access partners" ON public.affiliate_partners
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access clicks" ON public.affiliate_clicks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access attributions" ON public.affiliate_attributions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access commissions" ON public.affiliate_commissions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access payouts" ON public.affiliate_payouts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also allow anon read on affiliate_partners for authenticated API service or direct token validation if using anon key with custom filter
CREATE POLICY "Anon select affiliate partners" ON public.affiliate_partners
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon update affiliate partners" ON public.affiliate_partners
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon select affiliate commissions" ON public.affiliate_commissions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon insert affiliate commissions" ON public.affiliate_commissions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anon update affiliate commissions" ON public.affiliate_commissions
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon select affiliate payouts" ON public.affiliate_payouts
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon insert affiliate payouts" ON public.affiliate_payouts
    FOR INSERT TO anon, authenticated WITH CHECK (true);
