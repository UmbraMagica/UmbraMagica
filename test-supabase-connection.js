import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzwbvzrkyjooegttklcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16d2J2enJreWpvb2VndHRrbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI4NTUsImV4cCI6MjA2NTAyODg1NX0.oRY1m83jybuB583GQBpHb_ulicbMsaAnyZ4WPrz2o0M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Chyba při připojení k Supabase:', error.message);
    process.exit(1);
  }
  console.log('Připojení k Supabase OK, první uživatel:', data);
  process.exit(0);
}

testConnection(); 