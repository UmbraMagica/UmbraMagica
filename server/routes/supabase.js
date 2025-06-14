import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

// GET /api/users
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router; 