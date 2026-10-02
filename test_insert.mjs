import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL.trim(), env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim());

async function check() {
  const payload = {
    reference_number: 'A1LQ82_test',
    guest_name: 'Edo Usrok',
    booking_date: '2026-10-03',
    time: '19:05',
    location: 'Alaya',
    room_number: '109',
    total_price: 675000,
    revenue: 675000,
    treatment_name: 'REJUVENATION PACKAGE',
    pax: 1,
    therapists_count: 1,
    therapist_fee_total: 0,
    net_profit: 675000,
    status: 'Pending',
    items: [],
    brand: 'elexoir'
  };

  const { error } = await supabase.from('bookings').insert([payload]);
  console.log('Insert Error:', error);
}
check();
