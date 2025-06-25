// server/routes/chatMessages.ts
import { FastifyInstance } from 'express';
import { supabaseAdmin } from '../supabase';          // už tam máte supabase.js

const router = express.Router();

  /**
   * GET /api/chat/rooms/:roomId/messages
   * Vrátí zprávy z view chat_messages_view
   */
  app.get('/api/chat/rooms/:roomId/messages', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };

    const { data, error } = await supabaseAdmin
      .from('chat_messages_view')                     // ⬅️ view, ne tabulka
      .select('*')
      .eq('room_id', Number(roomId))
      .order('created_at', { ascending: true });

    if (error) {
      req.log.error(error);
      return reply.code(500).send({ error: 'Failed to load messages' });
    }

    return reply.send(data);
  });
}
