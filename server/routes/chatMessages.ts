// server/routes/chatMessages.ts
import express from 'express';
import { supabase } from '../supabaseClient';   // <- service-role klient

const router = express.Router();

/**
 * GET /api/chat/rooms/:roomId/messages
 * Vrátí zprávy z view chat_messages_view
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;

  const { data, error } = await supabase
    .from('chat_messages_view')          // VIEW, ne tabulka
    .select('*')
    .eq('room_id', Number(roomId))
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Load messages error:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }

  res.json(data);                        // ⚡ pole zpráv
});

export default router;

