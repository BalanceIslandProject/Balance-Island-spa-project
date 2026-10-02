import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL.trim(), env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim());

async function check() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data, inserting dummy');
    const { error: e2 } = await supabase.from('bookings').insert([{ booking_date: '2026-10-01' }]);
    const { data: d2 } = await supabase.from('bookings').select('*').limit(1);
    console.log('Columns:', d2 ? Object.keys(d2[0]) : e2);
  }
}
check();
