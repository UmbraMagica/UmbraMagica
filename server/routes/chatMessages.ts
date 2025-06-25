
import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

/**
 * GET /api/chat/rooms/:roomId/messages
 * Vrátí zprávy přímo z tabulky messages s načtenými postavami
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;

  try {
    // Načteme zprávy s JOIN na characters tabulku
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        room_id,
        character_id,
        content,
        message_type,
        created_at,
        characters (
          id,
          first_name,
          middle_name,
          last_name,
          user_id
        )
      `)
      .eq('room_id', Number(roomId))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Load messages error:', error);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    // Transformuj data do formátu očekávaného frontendem
    const transformedMessages = data.map(msg => ({
      id: msg.id,
      roomId: msg.room_id,
      characterId: msg.character_id,
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      character: msg.characters ? {
        id: msg.characters.id,
        firstName: msg.characters.first_name,
        middleName: msg.characters.middle_name,
        lastName: msg.characters.last_name,
        userId: msg.characters.user_id
      } : null
    }));

    console.log(`[MESSAGES] Returning ${transformedMessages.length} messages for room ${roomId}`);
    res.json(transformedMessages);

  } catch (error) {
    console.error('Load messages error:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

export default router;
