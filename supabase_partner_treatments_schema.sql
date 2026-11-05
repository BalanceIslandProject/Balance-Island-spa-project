-- =========================================================
-- THERAPICK - PARTNER SPAS & TREATMENTS SCHEMA & MIGRATION
-- (Run this SQL script in your Supabase SQL Editor)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- 1. CREATE SPA PARTNERS TABLE (Partner Profiles)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spa_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT DEFAULT 'therapick',
    name TEXT NOT NULL,
    slug TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    location TEXT,
    address TEXT,
    whatsapp TEXT,
    email TEXT,
    discount_percentage NUMERIC DEFAULT 0,
    tax_percentage NUMERIC DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Safe Column Additions for spa_partners
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'therapick';
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 0;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1;
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.spa_partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ─────────────────────────────────────────────────────────
-- 2. CREATE PARTNER TREATMENTS TABLE (Treatments under Partners)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT DEFAULT 'therapick',
    partner_id UUID REFERENCES public.spa_partners(id) ON DELETE CASCADE,
    partner_name TEXT,
    partner_logo_url TEXT,
    partner_slug TEXT,
    partner_location TEXT,
    partner_whatsapp TEXT,
    partner_discount_percentage NUMERIC DEFAULT 0,
    partner_tax_percentage NUMERIC DEFAULT 0,
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

-- Safe Column Additions for partner_treatments
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'therapick';
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_logo_url TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_slug TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_location TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_whatsapp TEXT;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE public.partner_treatments ADD COLUMN IF NOT EXISTS partner_tax_percentage NUMERIC DEFAULT 0;
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

-- ─────────────────────────────────────────────────────────
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.spa_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_treatments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for spa_partners
DROP POLICY IF EXISTS "Public read spa_partners" ON public.spa_partners;
CREATE POLICY "Public read spa_partners" ON public.spa_partners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert spa_partners" ON public.spa_partners;
CREATE POLICY "Public insert spa_partners" ON public.spa_partners FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update spa_partners" ON public.spa_partners;
CREATE POLICY "Public update spa_partners" ON public.spa_partners FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete spa_partners" ON public.spa_partners;
CREATE POLICY "Public delete spa_partners" ON public.spa_partners FOR DELETE USING (true);

-- Permissive policies for partner_treatments
DROP POLICY IF EXISTS "Public read partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public read partner_treatments" ON public.partner_treatments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public insert partner_treatments" ON public.partner_treatments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public update partner_treatments" ON public.partner_treatments FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete partner_treatments" ON public.partner_treatments;
CREATE POLICY "Public delete partner_treatments" ON public.partner_treatments FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────
-- 4. CREATE INDEXES FOR FAST FILTERING
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_spa_partners_brand ON public.spa_partners(brand);
CREATE INDEX IF NOT EXISTS idx_spa_partners_active ON public.spa_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_spa_partners_order ON public.spa_partners("order");

CREATE INDEX IF NOT EXISTS idx_partner_treatments_brand ON public.partner_treatments(brand);
CREATE INDEX IF NOT EXISTS idx_partner_treatments_partner_id ON public.partner_treatments(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_treatments_published ON public.partner_treatments(is_published);
CREATE INDEX IF NOT EXISTS idx_partner_treatments_order ON public.partner_treatments("order");
