
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
    // Načteme všechny zprávy v místnosti (včetně vypravěče)
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        room_id,
        character_id,
        content,
        message_type,
        created_at
      `)
      .eq('room_id', Number(roomId))
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Load messages error:', messagesError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    if (!allMessages || allMessages.length === 0) {
      console.log(`[MESSAGES] No messages found for room ${roomId}`);
      return res.json([]);
    }

    // Najdeme všechny unikátní character_id (kromě 0 = vypravěč)
    const characterIds = [...new Set(
      allMessages
        .map(msg => msg.character_id)
        .filter(id => id && id !== 0)
    )];

    // Načteme data postav
    let characterMap = new Map();
    if (characterIds.length > 0) {
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select(`
          id,
          first_name,
          middle_name,
          last_name,
          user_id
        `)
        .in('id', characterIds);

      if (charError) {
        console.error('Load characters error:', charError);
      } else if (characters) {
        characters.forEach(char => {
          characterMap.set(char.id, {
            id: char.id,
            firstName: char.first_name,
            middleName: char.middle_name,
            lastName: char.last_name,
            userId: char.user_id
          });
        });
      }
    }

    // Transformuj zprávy s připojenými postavami
    const transformedMessages = allMessages.map(msg => ({
      id: msg.id,
      roomId: msg.room_id,
      characterId: msg.character_id,
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      character: msg.character_id === 0 || msg.message_type === 'narrator' 
        ? null 
        : characterMap.get(msg.character_id) || null
    }));

    console.log(`[MESSAGES] Returning ${transformedMessages.length} messages for room ${roomId}`);
    res.json(transformedMessages);

  } catch (error) {
    console.error('Load messages error:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

export default router;
