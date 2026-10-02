import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL.trim(), env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim());

async function check() {
  const { data, error } = await supabase.from('bookings').select('*');
  console.log('Error:', error);
  console.log('Bookings count:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Latest 3 bookings:', data.slice(-3).map(b => ({ id: b.id, booking_date: b.booking_date, reference: b.reference_number })));
  }
}
check();
