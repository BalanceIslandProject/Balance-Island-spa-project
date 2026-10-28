-- ==============================================================================
-- THERAPICK PARTNER PORTAL: PRODUCTION ADDITIVE MIGRATION
-- Compatible with BookTherapick (www.booktherapick.com & partners.booktherapick.com)
-- Strictly preserves existing booking data, services, pricing, and schemas
-- ==============================================================================

-- 1. ADDITIVE COLUMNS ON AFFILIATE_PARTNERS
ALTER TABLE public.affiliate_partners ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_partners_clerk_user_id ON public.affiliate_partners(clerk_user_id) WHERE clerk_user_id IS NOT NULL;

ALTER TABLE public.affiliate_partners ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE public.affiliate_partners ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.affiliate_partners ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- 2. 30-DAY ATTRIBUTION WINDOW IN SETTINGS
UPDATE public.affiliate_program_settings
SET cookie_duration_days = 30,
    updated_at = NOW()
WHERE cookie_duration_days <> 30;

ALTER TABLE public.affiliate_program_settings 
ALTER COLUMN cookie_duration_days SET DEFAULT 30;

-- 3. ADDITIVE COLUMNS ON AFFILIATE_COMMISSIONS
ALTER TABLE public.affiliate_commissions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'IDR';
ALTER TABLE public.affiliate_commissions ADD COLUMN IF NOT EXISTS commission_rate_snapshot NUMERIC(5, 2) DEFAULT 15.00;
ALTER TABLE public.affiliate_commissions ADD COLUMN IF NOT EXISTS adjustment_reference TEXT;

-- Backfill commission_rate_snapshot where missing
UPDATE public.affiliate_commissions
SET commission_rate_snapshot = commission_rate_pct
WHERE commission_rate_snapshot IS NULL;

-- 4. ADDITIVE COLUMNS ON AFFILIATE_PAYOUTS
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ;
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.affiliate_payouts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. ADDITIVE COLUMNS ON AFFILIATE_ATTRIBUTIONS
ALTER TABLE public.affiliate_attributions ADD COLUMN IF NOT EXISTS attribution_method VARCHAR(50) DEFAULT 'referral_link';
ALTER TABLE public.affiliate_attributions ADD COLUMN IF NOT EXISTS attribution_status VARCHAR(50) DEFAULT 'active';

-- 6. PARTNER PAYOUT ITEMS TABLE (Records commissions included in each payout to prevent double-payment)
CREATE TABLE IF NOT EXISTS public.partner_payout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES public.affiliate_payouts(id) ON DELETE CASCADE,
    commission_id UUID NOT NULL REFERENCES public.affiliate_commissions(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payout_commission UNIQUE(payout_id, commission_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON public.partner_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_commission_id ON public.partner_payout_items(commission_id);

-- 7. PARTNER AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.partner_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'partner', 'system'
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.partner_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.partner_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.partner_audit_logs(created_at);

-- 8. PARTNER REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.partner_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_id ON public.partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_code ON public.partner_referrals(referral_code);

-- Seed partner_referrals from existing active partners if table is empty
INSERT INTO public.partner_referrals (partner_id, referral_code, is_active, created_at)
SELECT id, partner_code, (status = 'active'), created_at
FROM public.affiliate_partners
WHERE partner_code IS NOT NULL
ON CONFLICT (referral_code) DO NOTHING;

-- 9. COMPATIBILITY VIEWS (Expose canonical names from specification alongside existing physical names)
CREATE OR REPLACE VIEW public.partners AS 
SELECT 
    id,
    clerk_user_id,
    first_name || ' ' || COALESCE(last_name, '') AS full_name,
    first_name,
    last_name,
    email,
    business_name,
    partner_type,
    whatsapp AS whatsapp_number,
    phone,
    business_website,
    status,
    commission_rate_pct AS commission_rate,
    created_at,
    updated_at,
    approved_at,
    approved_by,
    payout_method,
    payout_details,
    notes
FROM public.affiliate_partners;

CREATE OR REPLACE VIEW public.partner_commissions AS
SELECT * FROM public.affiliate_commissions;

CREATE OR REPLACE VIEW public.partner_payouts AS
SELECT * FROM public.affiliate_payouts;

CREATE OR REPLACE VIEW public.booking_attributions AS
SELECT * FROM public.affiliate_attributions;

-- 10. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.partner_payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access payout items" ON public.partner_payout_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access audit logs" ON public.partner_audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access partner referrals" ON public.partner_referrals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public / authenticated policies
CREATE POLICY "Public read partner referrals" ON public.partner_referrals
    FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Anon insert audit logs" ON public.partner_audit_logs
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anon select audit logs" ON public.partner_audit_logs
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon select payout items" ON public.partner_payout_items
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon insert payout items" ON public.partner_payout_items
    FOR INSERT TO anon, authenticated WITH CHECK (true);
