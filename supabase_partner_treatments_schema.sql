-- =========================================================
-- THERAPICK - PARTNER SPA TREATMENTS SCHEMA & MIGRATION
-- (Run this SQL script in your Supabase SQL Editor)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CREATE PARTNER TREATMENTS TABLE
CREATE TABLE IF NOT EXISTS public.partner_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT DEFAULT 'therapick',
    partner_name TEXT NOT NULL,
    partner_logo_url TEXT,
    partner_slug TEXT,
    partner_location TEXT,
    partner_whatsapp TEXT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Massage',
    "desc" TEXT,
    image_url TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    "order" INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Safe Column Additions (in case table already partially exists)
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'therapick';
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_logo_url TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_slug TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_location TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_whatsapp TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Massage';
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.partner_treatments ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSIVE POLICIES FOR PUBLIC / ANON ACCESS
DROP POLICY IF EXISTS "Public read partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public read partner_treatments" ON public.partner_treatments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public insert partner_treatments" ON public.partner_treatments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public update partner_treatments" ON public.partner_treatments FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public delete partner_treatments" ON public.partner_treatments FOR DELETE USING (true);

-- 4. CREATE INDEXES FOR FAST FILTERING
CREATE INDEX IF NOT EXISTS idx_partner_treatments_brand ON public.partner_treatments(brand);
CREATE INDEX IF NOT EXISTS idx_partner_treatments_published ON public.partner_treatments(is_published);
CREATE INDEX IF NOT EXISTS idx_partner_treatments_order ON public.partner_treatments("order");

