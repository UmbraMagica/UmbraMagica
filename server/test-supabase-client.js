import { createClient } from '@supabase/supabase-js';

// Zadej své údaje:
const supabaseUrl = 'https://mzwbvzrkyjooegttklcq.supabase.co;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16d2J2enJreWpvb2VndHRrbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI4NTUsImV4cCI6MjA2NTAyODg1NX0.oRY1m83jybuB583GQBpHb_ulicbMsaAnyZ4WPrz2o0M; // zkopíruj z nastavení Supabase'

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Příklad: načti všechna data z tabulky "users"
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Chyba:', error);
  } else {
    console.log('Data:', data);
  }
}

test();