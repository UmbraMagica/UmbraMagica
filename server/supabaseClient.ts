import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('[SUPABASE] Initializing client with:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('[SUPABASE] Client created successfully');