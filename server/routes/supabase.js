import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = 'https://mzwbvzrkyjooegttklcq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'TVŮJ_ANON_PUBLIC_KEY'; // nastav správný klíč v env proměnných
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/users
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router; 