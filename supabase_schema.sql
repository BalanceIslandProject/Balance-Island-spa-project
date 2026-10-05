-- =========================================================
-- ELEXOIR HOME SPA - SUPABASE SCHEMA & MIGRATION SCRIPT
-- (Safe to run on existing tables, supports UUID & Text PKs)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAMPAIGNS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1_month';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "discountPercentage" NUMERIC DEFAULT 20;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "startDate" TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "endDate" TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "selectedTreatments" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "tripOffer" TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "tripImage" TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS trip_image_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "campaignType" TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'elexoir';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read campaigns" ON public.campaigns;
CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert campaigns" ON public.campaigns;
CREATE POLICY "Public insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update campaigns" ON public.campaigns;
CREATE POLICY "Public update campaigns" ON public.campaigns FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete campaigns" ON public.campaigns;
CREATE POLICY "Public delete campaigns" ON public.campaigns FOR DELETE USING (true);


-- 2. TREATMENTS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS "bgPattern" TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS pinned_image TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'elexoir';
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read treatments" ON public.treatments;
CREATE POLICY "Public read treatments" ON public.treatments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert treatments" ON public.treatments;
CREATE POLICY "Public insert treatments" ON public.treatments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update treatments" ON public.treatments;
CREATE POLICY "Public update treatments" ON public.treatments FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete treatments" ON public.treatments;
CREATE POLICY "Public delete treatments" ON public.treatments FOR DELETE USING (true);


-- 3. THERAPIST FEES TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.therapist_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS treatment_id TEXT;
ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS fee TEXT;
ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'elexoir';
ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.therapist_fees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.therapist_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read therapist_fees" ON public.therapist_fees;
CREATE POLICY "Public read therapist_fees" ON public.therapist_fees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert therapist_fees" ON public.therapist_fees;
CREATE POLICY "Public insert therapist_fees" ON public.therapist_fees FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update therapist_fees" ON public.therapist_fees;
CREATE POLICY "Public update therapist_fees" ON public.therapist_fees FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete therapist_fees" ON public.therapist_fees;
CREATE POLICY "Public delete therapist_fees" ON public.therapist_fees FOR DELETE USING (true);


-- 4. BOOKINGS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_whatsapp TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_time TIME;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_therapist_fee NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS net_profit NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS therapist_names TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS treatment_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pax INTEGER DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS therapists_count INTEGER DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS therapist_fee_total NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Confirmed';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'elexoir';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update bookings" ON public.bookings;
CREATE POLICY "Public update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete bookings" ON public.bookings;
CREATE POLICY "Public delete bookings" ON public.bookings FOR DELETE USING (true);


-- 5. PROMO CODES TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 0;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'elexoir';
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read promo_codes" ON public.promo_codes;
CREATE POLICY "Public read promo_codes" ON public.promo_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert promo_codes" ON public.promo_codes;
CREATE POLICY "Public insert promo_codes" ON public.promo_codes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update promo_codes" ON public.promo_codes;
CREATE POLICY "Public update promo_codes" ON public.promo_codes FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete promo_codes" ON public.promo_codes;
CREATE POLICY "Public delete promo_codes" ON public.promo_codes FOR DELETE USING (true);


-- =========================================================
-- SEED DATA (Clean, valid standard UUIDs)
-- =========================================================

INSERT INTO public.campaigns (
    id,
    title,
    label,
    description,
    image,
    duration,
    "discountPercentage",
    "selectedTreatments",
    "tripOffer",
    "order",
    is_published,
    brand
) VALUES 
(
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Summer Retreat',
    'EXCLUSIVE OFFER',
    'Indulge in holistic relaxation with private therapist villa service, organic botanical aromatherapy, and revitalizing body treatments.',
    NULL,
    '1_month',
    20,
    '[]'::jsonb,
    'Complimentary Botanical Scrub & Luxury Villa Setup',
    1,
    true,
    'elexoir'
),
(
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'Bali Day Trip & Spa Combo',
    'EXCLUSIVE TRIP DEAL',
    'Book any signature in-villa massage below and claim an exclusive 25% discount voucher for private Bali Day Trips, Waterfall Tours & Temple excursions.',
    NULL,
    '1_month',
    0,
    '[]'::jsonb,
    '25% OFF Private Bali Day Trip & Waterfalls',
    2,
    true,
    'elexoir'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    image = EXCLUDED.image,
    "discountPercentage" = EXCLUDED."discountPercentage",
    "tripOffer" = EXCLUDED."tripOffer",
    "order" = EXCLUDED."order",
    is_published = EXCLUDED.is_published,
    brand = EXCLUDED.brand;
