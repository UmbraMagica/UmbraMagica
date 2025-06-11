import express from 'express';
import cors from 'cors';
import { supabase } from './server/storage';

const app = express();
const port = 3001;

app.use(cors());

// Endpoint to fetch multiple tables
app.get('/api/tables', async (req, res) => {
  try {
    const [wands, flexibilities, lengths, cores, woods] = await Promise.all([
      supabase.from('wands').select('*'),
      supabase.from('wand_flexibilities').select('*'),
      supabase.from('wand_lengths').select('*'),
      supabase.from('wand_cores').select('*'),
      supabase.from('wand_woods').select('*'),
    ]);

    if (wands.error || flexibilities.error || lengths.error || cores.error || woods.error) {
      return res.status(500).json({ error: 'Error fetching data from Supabase' });
    }

    res.json({
      wands: wands.data,
      flexibilities: flexibilities.data,
      lengths: lengths.data,
      cores: cores.data,
      woods: woods.data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
