
import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

/**
 * GET /api/chat/rooms/:roomId/messages
 * Vrátí zprávy přímo z tabulky messages s načtenými postavami
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;

  console.log(`\n=== MESSAGES DEBUG START for room ${roomId} ===`);

  try {
    // Načteme všechny zprávy v místnosti (včetně vypravěče)
    console.log(`[MESSAGES] Fetching messages for room ${roomId}`);
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

    console.log(`[MESSAGES] Raw messages query result:`, {
      error: messagesError,
      dataExists: !!allMessages,
      messageCount: allMessages?.length || 0,
      firstMessage: allMessages?.[0] || 'none',
      lastMessage: allMessages?.[allMessages.length - 1] || 'none'
    });

    if (messagesError) {
      console.error('[MESSAGES] ERROR fetching messages:', messagesError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    if (!allMessages || allMessages.length === 0) {
      console.log(`[MESSAGES] No messages found for room ${roomId}`);
      return res.json([]);
    }

    // Detailní debug každé zprávy
    console.log(`[MESSAGES] Raw messages detail:`);
    allMessages.forEach((msg, index) => {
      console.log(`  Message ${index}:`, {
        id: msg.id,
        room_id: msg.room_id,
        character_id: msg.character_id,
        content: msg.content?.substring(0, 50) + '...',
        message_type: msg.message_type,
        created_at: msg.created_at
      });
    });

    // Najdeme všechny unikátní character_id (kromě 0 = vypravěč)
    const characterIds = [...new Set(
      allMessages
        .map(msg => msg.character_id)
        .filter(id => id && id !== 0)
    )];

    console.log(`[MESSAGES] Unique character IDs found:`, characterIds);

    // Načteme data postav
    let characterMap = new Map();
    if (characterIds.length > 0) {
      console.log(`[MESSAGES] Fetching character data for IDs:`, characterIds);
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

      console.log(`[MESSAGES] Characters query result:`, {
        error: charError,
        charactersFound: characters?.length || 0,
        characters: characters || []
      });

      if (charError) {
        console.error('[MESSAGES] ERROR fetching characters:', charError);
      } else if (characters) {
        console.log(`[MESSAGES] Processing ${characters.length} characters:`);
        characters.forEach(char => {
          console.log(`  Character ${char.id}:`, {
            first_name: char.first_name,
            middle_name: char.middle_name,
            last_name: char.last_name,
            user_id: char.user_id
          });
          
          characterMap.set(char.id, {
            id: char.id,
            firstName: char.first_name,
            middleName: char.middle_name,
            lastName: char.last_name,
            userId: char.user_id
          });
        });
        console.log(`[MESSAGES] Character map created with ${characterMap.size} entries`);
      }
    } else {
      console.log(`[MESSAGES] No character IDs to fetch (all messages are narrator)`);
    }

    // Transformuj zprávy s připojenými postavami
    console.log(`[MESSAGES] Transforming ${allMessages.length} messages:`);
    const transformedMessages = allMessages.map((msg, index) => {
      const isNarrator = msg.character_id === 0 || msg.message_type === 'narrator';
      const character = isNarrator ? null : characterMap.get(msg.character_id) || null;
      
      console.log(`  Transforming message ${index}:`, {
        id: msg.id,
        character_id: msg.character_id,
        isNarrator,
        hasCharacterData: !!character,
        character: character
      });

      return {
        id: msg.id,
        roomId: msg.room_id,
        characterId: msg.character_id,
        content: msg.content,
        messageType: msg.message_type,
        createdAt: msg.created_at,
        character: character
      };
    });

    console.log(`[MESSAGES] Final transformed messages count: ${transformedMessages.length}`);
    console.log(`[MESSAGES] Sample transformed messages:`, 
      transformedMessages.slice(0, 3).map(msg => ({
        id: msg.id,
        characterId: msg.characterId,
        hasCharacter: !!msg.character,
        characterName: msg.character ? `${msg.character.firstName} ${msg.character.lastName}` : 'none',
        content: msg.content?.substring(0, 30) + '...'
      }))
    );

    console.log(`=== MESSAGES DEBUG END ===\n`);
    res.json(transformedMessages);

  } catch (error) {
    console.error('Load messages error:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

export default router;
