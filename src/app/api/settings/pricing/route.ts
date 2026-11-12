import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const DYNAMIC_PRICING_ROW_ID = '00000000-0000-0000-0000-000000000099';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand') || 'therapick';

    const { data, error } = await supabase
      .from('campaigns')
      .select('discountPercentage, updated_at')
      .eq('brand', `${brand}_pricing_setting`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('[dynamic-pricing-api] Error reading dynamic pricing from Supabase:', error.message);
    }

    const percentage = typeof data?.discountPercentage === 'number' ? data.discountPercentage : 0;

    return NextResponse.json({
      success: true,
      brand,
      percentage,
      updated_at: data?.updated_at || null,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, percentage: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brand = body.brand || 'therapick';
    const rawPct = Number(body.percentage);

    if (isNaN(rawPct) || rawPct < -90 || rawPct > 500) {
      return NextResponse.json(
        { success: false, error: 'Percentage must be a number between -90% and +500%' },
        { status: 400 }
      );
    }

    const percentage = Math.round(rawPct * 100) / 100; // 2 decimal places max
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('campaigns')
      .upsert({
        id: DYNAMIC_PRICING_ROW_ID,
        brand: `${brand}_pricing_setting`,
        title: 'Global Dynamic Pricing Setting',
        label: 'Dynamic Pricing',
        description: 'Global dynamic pricing rate percentage for treatment catalog',
        duration: '1_month',
        discountPercentage: percentage,
        selectedTreatments: [],
        is_published: false,
        updated_at: nowIso,
      })
      .select()
      .single();

    if (error) {
      console.error('[dynamic-pricing-api] Failed to upsert dynamic pricing in Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Attempt cache revalidation
    try {
      revalidatePath('/api/spa-data');
      (revalidateTag as any)('spa-data', { expire: 0 });
      (revalidateTag as any)(`spa-data-${brand}`, { expire: 0 });
    } catch (revalErr) {
      // Revalidation warning only, non-blocking
      console.warn('[dynamic-pricing-api] Revalidation warning:', revalErr);
    }

    return NextResponse.json({
      success: true,
      brand,
      percentage,
      updated_at: nowIso,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

