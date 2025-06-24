import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import jwt from 'jsonwebtoken';
import { supabase } from "./supabaseClient";

// JWT payload do req.user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'umbra-magica-jwt-secret-key-fixed-2024';

function generateJwt(user: any) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = auth.slice(7);
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.user = payload;
  console.log("Decoded JWT user:", req.user);
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

// Helper function to validate and filter characters
function validateAndFilterCharacters(characters: any[]): any[] {
  if (!Array.isArray(characters)) {
    console.warn('Characters is not an array:', typeof characters);
    return [];
  }

  return characters.filter(char => {
    const isValid = char && 
                   typeof char === 'object' && 
                   typeof char.id === 'number' && 
                   typeof char.firstName === 'string' && 
                   char.firstName.trim() !== '';

    if (!isValid) {
      console.warn('Invalid character filtered out:', char);
    }

    return isValid;
  });
}

export async function registerRoutes(app: Express): Promise<void> {
  // HTTP a WebSocket server
  const httpServer = createServer(app);

  // Start HTTP server first
  const serverPort = parseInt(process.env.PORT || "5000", 10) || 5000;
  httpServer.listen(serverPort, "0.0.0.0", () => {
    console.log(`Server running on port ${serverPort}`);
  });

  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      try {
        const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          console.log('WebSocket: No token provided');
          return false;
        }

        const payload = verifyJwt(token);
        if (!payload) {
          console.log('WebSocket: Invalid token');
          return false;
        }

        // Store user info for later use
        (info.req as any).user = payload;
        console.log('WebSocket: Authentication successful for user', payload.username);
        return true;
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        return false;
      }
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    const user = (req as any).user;
    console.log(`WebSocket connected: ${user.username}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message);

        if (message.type === 'authenticate') {
          ws.send(JSON.stringify({ type: 'authenticated', success: true }));
        } else if (message.type === 'join_room') {
          ws.send(JSON.stringify({ type: 'room_joined', roomId: message.roomId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket disconnected: ${user.username}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Multer config pro uploady
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    },
  });

  // LOGIN
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.validateUser(username, password);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      const token = generateJwt(user);
      const characters = await storage.getCharactersByUserId(user.id);
      const validCharacters = validateAndFilterCharacters(characters);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          characters: validCharacters,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (!res.headersSent) return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (!res.headersSent) res.status(500).json({ message: "Login failed" });
    }
  });

  // LOGOUT
  app.post("/api/auth/logout", requireAuth, (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // REGISTER
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registrationSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const inviteCode = await storage.getInviteCode(data.inviteCode);
      if (!inviteCode || inviteCode.isUsed) {
        return res.status(400).json({ message: "Invalid or already used invite code" });
      }
      const hashedPassword = await storage.hashPassword(data.password);
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: "user",
      });
      await storage.useInviteCode(data.inviteCode, user.id);
      const character = await storage.createCharacter({
        userId: user.id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        birthDate: data.birthDate,
      });
      const token = generateJwt(user);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          characters: [character],
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // GET USER
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const characters = await storage.getCharactersByUserId(user.id);
      const validCharacters = validateAndFilterCharacters(characters);

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        canNarrate: user.canNarrate,
        characterOrder: user.characterOrder ? JSON.parse(user.characterOrder) : null,
        highlightWords: user.highlightWords,
        highlightColor: user.highlightColor,
        narratorColor: user.narratorColor,
        characters: validCharacters,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Endpoint pro seznam všech postav (HLAVNÍ ENDPOINT)
  app.get("/api/characters", requireAuth, async (req, res) => {
    try {
      let characters;
      if (req.user!.role === 'admin') {
        characters = await storage.getAllCharacters();
      } else {
        characters = await storage.getCharactersByUserId(req.user!.id);
      }

      const validCharacters = validateAndFilterCharacters(characters);
      console.log(`[CHARACTERS] User ${req.user!.username} requested characters, returning ${validCharacters.length} valid characters`);

      // Always return in { characters: [] } format for consistency
      res.json({ characters: validCharacters });
    } catch (error) {
      console.error("Chyba při načítání postav:", error);
      res.status(500).json({ message: "Chyba serveru", error: error?.message });
    }
  });

  // Soví pošta: počet nepřečtených zpráv pro postavu
  app.get("/api/owl-post/unread-count/:characterId", requireAuth, async (req, res) => {
    const characterId = Number(req.params.characterId);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }
    // Ověř, že postava patří uživateli (nebo je admin)
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const count = await storage.getUnreadOwlPostCount(characterId);
    res.json({ count });
  });

  // Soví pošta: inbox pro postavu
  app.get("/api/owl-post/:characterId", requireAuth, async (req, res) => {
    const characterId = Number(req.params.characterId);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const inbox = await storage.getOwlPostInbox(characterId);
    res.json({ messages: inbox });
  });

  // Soví pošta: odeslání nové zprávy
  app.post("/api/owl-post", requireAuth, async (req, res) => {
    const { senderCharacterId, recipientCharacterId, subject, content } = req.body;
    if (!senderCharacterId || !recipientCharacterId || !subject || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // Ověř, že odesílatelská postava patří uživateli (nebo je admin)
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === senderCharacterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    try {
      const msg = await storage.sendOwlPostMessage(senderCharacterId, recipientCharacterId, subject, content);
      res.status(201).json({ message: msg });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to send message" });
    }
  });

  // Soví pošta: označení zprávy jako přečtené
  app.post("/api/owl-post/:messageId/read", requireAuth, async (req, res) => {
    const messageId = Number(req.params.messageId);
    const { characterId } = req.body;
    if (!messageId || isNaN(messageId) || !characterId) {
      return res.status(400).json({ message: "Invalid messageId or characterId" });
    }
    // Ověř, že postava patří uživateli (nebo je admin)
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const ok = await storage.markOwlPostMessageRead(messageId, characterId);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Message not found or not allowed" });
    }
  });

  // Seznam všech postav (pro adminy všechny, pro uživatele jen jejich)
  app.get("/api/characters/all", requireAuth, async (req, res) => {
    try {
      let characters;
      if (req.user!.role === 'admin') {
        characters = await storage.getAllCharacters();
      } else {
        characters = await storage.getCharactersByUserId(req.user!.id);
      }

      const validCharacters = validateAndFilterCharacters(characters);
      res.json(validCharacters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  // Seznam online postav (zatím prázdné)
  app.get("/api/characters/online", requireAuth, async (_req, res) => {
    res.json([]);
  });

  // Hůlka postavy
  app.get("/api/characters/:id/wand", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const wand = await storage.getCharacterWand(characterId);
    if (!wand) return res.status(404).json({ message: "Not Found" });
    res.json(wand);
  });

  // Poslední chat postavy (zatím null)
  app.get("/api/characters/:id/last-chat", requireAuth, async (req, res) => {
    res.json(null);
  });

  // Chat messages endpoint
  app.get("/api/chat/rooms/:roomId/messages", requireAuth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    console.log(`[CHAT][MESSAGES] User ${req.user!.username} requesting messages for room ${roomId}`);

    try {
      const messages = await storage.getChatMessages(roomId);
      console.log(`[CHAT][MESSAGES] Returning ${messages?.length || 0} messages`);
      res.json(messages || []);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send chat message
  app.post("/api/chat/messages", requireAuth, async (req, res) => {
    const { roomId, characterId, content, messageType } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!characterId || characterId === 0) {
      return res.status(400).json({ message: "Character ID is required" });
    }

    try {
      // Verify that the character belongs to the user (unless admin)
      if (req.user!.role !== 'admin') {
        const userCharacters = await storage.getCharactersByUserId(req.user!.id);
        const hasCharacter = userCharacters.some((char: any) => char.id === Number(characterId));
        if (!hasCharacter) {
          return res.status(403).json({ message: "Character does not belong to user" });
        }
      }

      // Use the storage layer for consistency
      const message = await storage.createChatMessage({
        roomId: Number(roomId),
        characterId: Number(characterId),
        userId: req.user!.id,
        content: content.trim(),
        messageType: messageType || 'text'
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Game actions - dice roll
  app.post("/api/game/dice-roll", requireAuth, async (req, res) => {
    const { roomId, characterId } = req.body;

    if (!roomId || !characterId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const result = Math.floor(Math.random() * 10) + 1;
      const character = await storage.getCharacterById(characterId);

      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const message = await storage.createChatMessage({
        roomId: Number(roomId),
        characterId: Number(characterId),
        userId: req.user!.id,
        content: `🎲 ${character.firstName} ${character.lastName} hodil kostkou a padlo: ${result}`,
        messageType: 'dice'
      });

      res.json({ result, message });
    } catch (error) {
      console.error("Error rolling dice:", error);
      res.status(500).json({ message: "Failed to roll dice" });
    }
  });

  // Game actions - coin flip
  app.post("/api/game/coin-flip", requireAuth, async (req, res) => {
    const { roomId, characterId } = req.body;

    if (!roomId || !characterId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const result = Math.random() < 0.5 ? "Panna" : "Orel";
      const character = await storage.getCharacterById(characterId);

      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const message = await storage.createChatMessage({
        roomId: Number(roomId),
        characterId: Number(characterId),
        userId: req.user!.id,
        content: `🪙 ${character.firstName} ${character.lastName} hodil mincí a padl: ${result}`,
        messageType: 'coin'
      });

      res.json({ result, message });
    } catch (error) {
      console.error("Error flipping coin:", error);
      res.status(500).json({ message: "Failed to flip coin" });
    }
  });

  // Character spells endpoint
  app.get("/api/characters/:id/spells", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    try {
      // Check if character belongs to user or is admin
      if (req.user!.role !== 'admin') {
        const character = await storage.getCharacterById(characterId);
        if (!character || character.userId !== req.user!.id) {
          return res.status(403).json({ message: "Character not found or access denied" });
        }
      }

      const spells = await storage.getCharacterSpells(characterId);
      console.log(`Found ${spells.length} spells for character ${characterId}`);
      res.json(spells || []);
    } catch (error) {
      console.error("Error fetching character spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });

  // Initialize default spells for all characters if they don't have any
  app.post("/api/admin/initialize-default-spells", requireAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultSpells();
      res.json({ message: "Default spells initialized successfully" });
    } catch (error) {
      console.error("Error initializing default spells:", error);
      res.status(500).json({ message: "Failed to initialize default spells" });
    }
  });

  // Cast spell endpoint
  app.post("/api/game/cast-spell", requireAuth, async (req, res) => {
    const { roomId, characterId, spellId, message } = req.body;

    if (!roomId || !characterId || !spellId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const character = await storage.getCharacterById(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check if character has a wand
      const wand = await storage.getCharacterWand(characterId);
      if (!wand) {
        return res.status(400).json({ message: "Vaše postava potřebuje hůlku pro sesílání kouzel." });
      }

      // Check if character knows the spell
      const characterSpells = await storage.getCharacterSpells(characterId);
      const knownSpell = characterSpells.find((cs: any) => cs.spell.id === spellId);
      if (!knownSpell) {
        return res.status(400).json({ message: "Character doesn't know this spell" });
      }

      const spell = knownSpell.spell;
      const spellContent = message 
        ? `✨ ${character.firstName} ${character.lastName} seslal kouzlo "${spell.name}": ${message}`
        : `✨ ${character.firstName} ${character.lastName} seslal kouzlo "${spell.name}"`;

      const chatMessage = await storage.createChatMessage({
        roomId: Number(roomId),
        characterId: Number(characterId),
        userId: req.user!.id,
        content: spellContent,
        messageType: 'spell'
      });

      res.json({ spell, message: chatMessage });
    } catch (error) {
      console.error("Error casting spell:", error);
      res.status(500).json({ message: "Failed to cast spell" });
    }
  });

  // Narrator message endpoint
  app.post("/api/chat/narrator-message", requireAuth, async (req, res) => {
    const { roomId, content } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user data to check narrator permissions
    const user = await storage.getUser(req.user!.id);
    if (!user || (user.role !== 'admin' && !user.canNarrate)) {
      return res.status(403).json({ message: "Nemáte oprávnění k vypravování" });
    }

    try {
      // Use the storage layer for consistency
      const message = await storage.createChatMessage({
        roomId: Number(roomId),
        characterId: 0, // Use 0 for narrator messages
        userId: req.user!.id,
        content: content.trim(),
        messageType: 'narrator'
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending narrator message:", error);
      res.status(500).json({ message: "Failed to send narrator message" });
    }
  });

  // Archive messages
  app.post("/api/chat/rooms/:roomId/archive", requireAdmin, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    try {
      const result = await storage.archiveChatMessages(roomId);
      res.json({ message: `Archivováno ${result.count} zpráv` });
    } catch (error) {
      console.error("Error archiving messages:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });

  // Clear messages (admin only)
  app.delete("/api/admin/rooms/:roomId/clear", requireAdmin, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    try {
      const result = await storage.clearChatMessages(roomId);
      res.json({ message: `Smazáno ${result.count} zpráv` });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Room presence
  app.get("/api/chat/rooms/:roomId/presence", requireAuth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    try {
      const presence = await storage.getRoomPresence(roomId);
      res.json(presence || []);
    } catch (error) {
      console.error("Error fetching room presence:", error);
      res.status(500).json({ message: "Failed to fetch presence" });
    }
  });

  // Character routes
  app.get("/api/characters/:id", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Neplatné characterId" });
    }

    const character = await storage.getCharacterById(characterId);
    if (!character) {
      return res.status(404).json({ message: "Postava nenalezena" });
    }

    // Admin může přistupovat ke všem postavám
    if (req.user!.role !== 'admin') {
      // Uživatel může přistupovat pouze ke svým postavám
      if (character.userId !== req.user!.id) {
        return res.status(403).json({ message: "Zakázáno" });
      }
    }

    res.json(character);
  });

  // Editace postavy
  app.put("/api/characters/:id", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Neplatné characterId" });
    }

    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ message: "Postava nenalezena" });
    }

    // Ověř přístup k postavě
    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Zakázáno" });
    }

    try {
      const updatedCharacter = await storage.updateCharacter(characterId, req.body);
      if (!updatedCharacter) {
        return res.status(500).json({ message: "Nepodařilo se aktualizovat postavu" });
      }
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ message: "Chyba při aktualizaci postavy" });
    }
  });

  // Aktualizace historie postavy
  app.put("/api/characters/:id/history", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    const { history, showHistoryToOthers } = req.body;

    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Ověř přístup k postavě
    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedCharacter = await storage.updateCharacter(characterId, {
      characterHistory: history,
      showHistoryToOthers: showHistoryToOthers
    });

    if (!updatedCharacter) {
      return res.status(500).json({ message: "Failed to update character" });
    }

    res.json(updatedCharacter);
  });

  // Komponenty pro tvorbu hůlek
  app.get("/api/wand-components", requireAuth, async (_req, res) => {
    try {
      const components = await storage.getAllWandComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching wand components:", error);
      res.status(500).json({ message: "Failed to fetch wand components" });
    }
  });

  // Chat kategorie (vrací data z databáze)
  app.get("/api/chat/categories", requireAuth, async (req, res) => {
    try {
      const userRole = req.user?.role || 'user';
      console.log(`[CHAT][CATEGORIES] User ${req.user?.username} (${userRole}) requesting categories`);
      const categories = await storage.getChatCategoriesWithChildren(userRole);
      console.log(`[CHAT][CATEGORIES] Returning ${categories.length} categories`);
      res.json(Array.isArray(categories) ? categories : []);
    } catch (error) {
      console.error('[CHAT][CATEGORIES] Error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Chat místnosti (vrací data z databáze)
  app.get("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      const userRole = req.user?.role || 'user';
      console.log(`[CHAT][ROOMS] User ${req.user?.username} (${userRole}) requesting rooms`);
      const rooms = await storage.getAllChatRooms(userRole);
      console.log(`[CHAT][ROOMS] Returning ${rooms.length} rooms`);
      res.json(Array.isArray(rooms) ? rooms : []);
    } catch (error) {
      console.error('[CHAT][ROOMS] Error:', error);
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  });

  // Character inventory routes
  app.get("/api/characters/:id/inventory", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    console.log('[INVENTORY][REQ]', {
      user: req.user,
      characterId,
      params: req.params,
      url: req.originalUrl,
    });
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Check access
    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const { data, error } = await supabase
        .from("character_inventory")
        .select("*")
        .eq("character_id", characterId)
        .order("acquired_at", { ascending: false });

      console.log('[INVENTORY][DB]', { data, error });

      if (error) {
        console.error("[INVENTORY][ERROR] Inventory fetch error:", error);
        return res.status(500).json({ message: "DB error", error: error.message });
      }

      console.log(`[INVENTORY][RESULT] Inventory for character ${characterId}:`, data);
      res.json(data || []);
    } catch (error) {
      console.error("[INVENTORY][ERROR] Inventory fetch error (catch):", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/characters/:id/inventory", requireAuth, async (req, res) => {
    try {
      const character_id = parseInt(req.params.id, 10);
      const {
        item_type,
        item_id,
        price,
        item_name,
        quantity,
        rarity,
        description,
        notes,
        category,
      } = req.body;

      console.log("Inventory POST payload:", req.body);

      // Kontrola povinných polí
      if (!item_type || price === undefined || isNaN(Number(price)) || !category) {
        return res.status(400).json({
          message: 'Missing required fields: item_type, price, or category',
        });
      }

      // Zákaz přidání hůlky ručně
      if (item_type === 'wand') {
        return res.status(403).json({ message: "Nelze přidat hůlku ručně do inventáře." });
      }

      // Vložení do databáze
      const { data, error } = await supabase
        .from("character_inventory")
        .insert({
          character_id,
          item_type,
          item_id: item_id || 1,
          price: Number(price),
          item_name: item_name || null,
          quantity: quantity || 1,
          rarity: rarity || null,
          description: description || null,
          notes: notes || null,
          category: category || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[INVENTORY][POST][ERROR]", error);
        return res.status(500).json({ message: "Database error", error: error.message });
      }

      console.log(`[INVENTORY][POST][SUCCESS] Added item to character ${character_id}:`, data);
      res.status(201).json(data);
    } catch (error) {
      console.error("[INVENTORY][POST][ERROR] Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    const itemId = Number(req.params.id);
    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const item = await storage.getInventoryItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const character = await storage.getCharacter(item.character_id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
    const itemId = Number(req.params.id);
    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const item = await storage.getInventoryItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const character = await storage.getCharacter(item.character_id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await storage.deleteInventoryItem(itemId);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Character journal routes
  app.get("/api/characters/:id/journal", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Check access
    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const journal = await storage.getCharacterJournal(characterId);
    res.json(journal);
  });

  app.post("/api/characters/:id/journal", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const journalEntry = await storage.addJournalEntry({
        characterId,
        ...req.body
      });
      res.status(201).json(journalEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/journal/:id", requireAuth, async (req, res) => {
    const entryId = Number(req.params.id);
    if (!entryId || isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entryId" });
    }

    const entry = await storage.getJournalEntry(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const character = await storage.getCharacter(entry.characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const updatedEntry = await storage.updateJournalEntry(entryId, req.body);
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/journal/:id", requireAuth, async (req, res) => {
    const entryId = Number(req.params.id);
    if (!entryId || isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entryId" });
    }

    const entry = await storage.getJournalEntry(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const character = await storage.getCharacter(entry.characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (req.user!.role !== 'admin' && character.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await storage.deleteJournalEntry(entryId);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  // Get all spells
  app.get("/api/spells", requireAuth, async (req, res) => {
    try {
      const spells = await storage.getAllSpells();
      res.json(spells);
    } catch (error) {
      console.error("Error fetching spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });

  // Add spell to character
  app.post("/api/characters/:id/spells", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    const { spellId } = req.body;

    if (!characterId || !spellId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // Check character ownership
      if (req.user!.role !== 'admin') {
        const character = await storage.getCharacterById(characterId);
        if (!character || character.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const characterSpell = await storage.addSpellToCharacter(characterId, spellId);
      res.json(characterSpell);
    } catch (error) {
      console.error("Error adding spell to character:", error);
      res.status(500).json({ message: "Failed to add spell" });
    }
  });

  // Remove spell from character
  app.delete("/api/characters/:id/spells/:spellId", requireAuth, async (req, res) => {
    const characterId = Number(req.params.id);
    const spellId = Number(req.params.spellId);

    try {
      // Check character ownership
      if (req.user!.role !== 'admin') {
        const character = await storage.getCharacterById(characterId);
        if (!character || character.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const success = await storage.removeSpellFromCharacter(characterId, spellId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Spell not found" });
      }
    } catch (error) {
      console.error("Error removing spell from character:", error);
      res.status(500).json({ message: "Failed to remove spell" });
    }
  });

  // Cemetery - get dead characters
  app.get("/api/cemetery", requireAuth, async (req, res) => {
    try {
      const deadCharacters = await storage.getDeadCharacters();
      res.json(deadCharacters);
    } catch (error) {
      console.error("Error fetching dead characters:", error);
      res.status(500).json({ message: "Failed to fetch cemetery" });
    }
  });

  // Admin: Kill character
  app.post("/api/admin/characters/:id/kill", requireAdmin, async (req, res) => {
    const characterId = Number(req.params.id);
    const { deathReason } = req.body;

    try {
      const character = await storage.killCharacter(characterId, deathReason, req.user!.id);
      if (character) {
        res.json(character);
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    } catch (error) {
      console.error("Error killing character:", error);
      res.status(500).json({ message: "Failed to kill character" });
    }
  });

  // Admin: Revive character
  app.post("/api/admin/characters/:id/revive", requireAdmin, async (req, res) => {
    const characterId = Number(req.params.id);

    try {
      const character = await storage.reviveCharacter(characterId);
      if (character) {
        res.json(character);
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    } catch (error) {
      console.error("Error reviving character:", error);
      res.status(500).json({ message: "Failed to revive character" });
    }
  });

  // Influence system routes - fixed with proper error handling
  app.get("/api/influence-bar", requireAuth, async (req, res) => {
    try {
      const influence = await storage.getInfluenceBar();
      res.json(influence);
    } catch (error) {
      console.error("Error fetching influence bar:", error);
      res.status(500).json({ message: "Failed to fetch influence data" });
    }
  });

  app.get("/api/influence-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getInfluenceHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching influence history:", error);
      res.status(500).json({ message: "Failed to fetch influence history" });
    }
  });

  // Admin influence routes
  app.post("/api/admin/influence-bar/adjust-with-history", requireAdmin, async (req, res) => {
    try {
      const { changeType, points, reason } = req.body;
      if (!changeType || !points || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const currentData = await storage.getInfluenceBar();
      const previousTotal = changeType === 'grindelwald' ? currentData.grindelwaldPoints : currentData.dumbledorePoints;
      const newTotal = Math.max(0, previousTotal + points);

      const newGrindelwaldPoints = changeType === 'grindelwald' ? newTotal : currentData.grindelwaldPoints;
      const newDumbledorePoints = changeType === 'dumbledore' ? newTotal : currentData.dumbledorePoints;

      await storage.setInfluence(newGrindelwaldPoints, newDumbledorePoints, req.user!.id, reason, changeType);

      res.json({ message: "Influence adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting influence:", error);
      res.status(500).json({ message: "Failed to adjust influence" });
    }
  });

  app.post("/api/admin/influence-bar/reset", requireAdmin, async (req, res) => {
    try {
      const { type } = req.body;
      if (!type || (type !== "0:0" && type !== "50:50")) {
        return res.status(400).json({ message: "Reset type must be '0:0' or '50:50'" });
      }

      const resetValues = type === "0:0" ? { grindelwald: 0, dumbledore: 0 } : { grindelwald: 50, dumbledore: 50 };
      await storage.setInfluence(resetValues.grindelwald, resetValues.dumbledore, req.user!.id, "reset", null);

      res.json({ message: "Influence reset successfully" });
    } catch (error) {
      console.error("Error resetting influence:", error);
      res.status(500).json({ message: "Failed to reset influence" });
    }
  });

  // Owl Post routes
  app.get("/api/owl-post/unread-total", requireAuth, async (req, res) => {
    try {
      let totalCount = 0;
      const characterIdParam = req.query.characterId;
      const characterId = characterIdParam ? Number(characterIdParam) : undefined;
      if (characterIdParam && (isNaN(characterId) || characterId <= 0)) {
        return res.status(400).json({ message: "Invalid characterId" });
      }
      if (characterId) {
        // Ověření přístupu k postavě
        if (req.user!.role !== 'admin') {
          const characters = await storage.getCharactersByUserId(req.user!.id);
          if (!characters.some((char: any) => char.id === characterId)) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        totalCount = await storage.getUnreadOwlPostCount(characterId);
      } else {
        const userCharacters = await storage.getCharactersByUserId(req.user!.id);
        if (!userCharacters || userCharacters.length === 0) {
          return res.json({ count: 0 });
        }
        for (const char of userCharacters) {
          totalCount += await storage.getUnreadOwlPostCount(char.id);
        }
      }
      res.json({ count: totalCount });
    } catch (error) {
      console.error("Error fetching unread total:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.get("/api/owl-post/characters", requireAuth, async (req, res) => {
    console.log("GET /api/owl-post/characters called by user", req.user);
    try {
      const allCharacters = await storage.getAllCharacters();
      const safeAllCharacters = Array.isArray(allCharacters) ? allCharacters : [];
      const activeCharacters = safeAllCharacters.filter((char: any) => !char.deathDate && !char.isSystem);
      const charactersWithFullName = activeCharacters.map((char: any) => ({
        ...char,
        fullName: `${char.firstName} ${char.middleName ? char.middleName + ' ' : ''}${char.lastName}`
      }));
      res.json(charactersWithFullName);
    } catch (error) {
      console.error("Chyba při načítání owl-post characters:", error, error?.stack);
      res.json([]); // fallback: nikdy nevracej 400/500, vždy pole
    }
  });

  app.get("/api/owl-post/inbox/:characterId", requireAuth, async (req, res) => {
    const characterId = Number(req.params.characterId);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    // Ověření přístupu k postavě
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    try {
      const messages = await storage.getOwlPostInbox(characterId);

      // Přidáme informace o odesílateli a příjemci
      const messagesWithDetails = await Promise.all(messages.map(async (msg: any) => {
        const sender = await storage.getCharacter(msg.senderCharacterId);
        const recipient = await storage.getCharacter(msg.recipientCharacterId);

        return {
          ...msg,
          sender: sender ? {
            firstName: sender.firstName,
            middleName: sender.middleName,
            lastName: sender.lastName
          } : null,
          recipient: recipient ? {
            firstName: recipient.firstName,
            middleName: recipient.middleName,
            lastName: sender.lastName
          } : null
        };
      }));

      res.json(messagesWithDetails);
    } catch (error) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/owl-post/sent/:characterId", requireAuth, async (req, res) => {
    const characterId = Number(req.params.characterId);
    if (!characterId || isNaN(characterId)) {
      return res.status(400).json({ message: "Invalid characterId" });
    }

    // Ověření přístupu k postavě
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    try {
      const messages = await storage.getOwlPostSent(characterId);

      // Přidáme informace o odesílateli a příjemci
      const messagesWithDetails = await Promise.all(messages.map(async (msg: any) => {
        const sender = await storage.getCharacter(msg.senderCharacterId);
        const recipient = await storage.getCharacter(msg.recipientCharacterId);

        return {
          ...msg,
          sender: sender ? {
            firstName: sender.firstName,
            middleName: sender.middleName,
            lastName: sender.lastName
          } : null,
          recipient: recipient ? {
            firstName: recipient.firstName,
            middleName: recipient.middleName,
            lastName: sender.lastName
          } : null
        };
      }));

      res.json(messagesWithDetails);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      res.status(500).json({ message: "Failed to fetch sent messages" });
    }
  });

  app.post("/api/owl-post/send", requireAuth, async (req, res) => {
    const { senderCharacterId, recipientCharacterId, subject, content } = req.body;

    if (!senderCharacterId || !recipientCharacterId || !subject || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ověření přístupu k odesílající postavě
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === senderCharacterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    try {
      const message = await storage.sendOwlPostMessage(senderCharacterId, recipientCharacterId, subject, content);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  });

  app.post("/api/owl-post/mark-read/:messageId", requireAuth, async (req, res) => {
    const messageId = Number(req.params.messageId);
    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({ message: "Invalid messageId" });
    }

    // Najdeme zprávu a ověříme přístup
    try {
      // Potřebujeme implementovat getOwlPostMessage v storage
      // Zatím jen označíme jako přečtenou
      const success = await storage.markOwlPostMessageRead(messageId, req.user!.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Message not found or access denied" });
      }
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: error.message || "Failed to mark message as read" });
    }
  });

  app.delete("/api/owl-post/message/:messageId", requireAuth, async (req, res) => {
    const messageId = Number(req.params.messageId);
    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({ message: "Invalid messageId" });
    }

    try {
      // Potřebujeme implementovat deleteOwlPostMessage v storage
      // Zatím vrátime success
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: error.message || "Failed to delete message" });
    }
  });

  // Wand components route for admin interface
  app.get("/api/admin/wand-components", requireAdmin, async (req, res) => {
    try {
      const components = await storage.getAllWandComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching wand components:", error);
      res.status(500).json({ message: "Failed to fetch wand components" });
    }
  });

  app.post("/api/admin/wand-components", requireAdmin, async (req, res) => {
    try {
      const { components } = req.body;
      await storage.updateWandComponents(components);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating wand components:", error);
      res.status(500).json({ message: "Failed to update wand components" });
    }
  });

  // Seznam všech uživatelů (pouze pro adminy)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const includeSystem = req.query.includeSystem === "true";
      const users = await storage.getAllUsers(includeSystem);
      res.json(users);
    } catch (error) {
      console.error("Chyba při načítání uživatelů:", error);
      res.status(500).json({ message: "Chyba serveru", error: error?.message || error });
    }
  });

  // --- ADMIN: Vytváření invite kódů ---
  app.post("/api/admin/invite-codes", requireAdmin, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Chybí kód" });
      }
      const newInvite = await storage.createInviteCode({ code });
      res.status(200).json(newInvite);
    } catch (error) {
      console.error("Chyba při vytváření invite kódu:", error);
      res.status(500).json({ message: "Chyba při vytváření invite kódu" });
    }
  });

  // --- ADMIN: Získání všech invite kódů ---
  app.get("/api/admin/invite-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllInviteCodes();
      res.json(codes);
    } catch (error) {
      console.error("Chyba při načítání invite kódů:", error);
      res.status(500).json({ message: "Chyba při načítání invite kódů", error: error?.message || error });
    }
  });

  // Seznam všech uživatelů (pro adminy, pro kompatibilitu s frontendem)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Chyba při načítání uživatelů:", error);
      res.status(500).json({ message: "Chyba serveru", error: error?.message || error });
    }
  });

  // --- ADMIN: Reset hesla uživatele ---
  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    const userId = Number(req.params.id);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    try {
      // Vygeneruj nové náhodné heslo (např. 10 znaků)
      const newPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await storage.hashPassword(newPassword);
      await storage.resetUserPassword(userId, hashedPassword);
      res.json({ newPassword });
    } catch (error) {
      console.error("Chyba při resetu hesla:", error);
      res.status(500).json({ message: "Nepodařilo se resetovat heslo", error: error?.message || error });
    }
  });

  // --- Změna hesla uživatele ---
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Chybí aktuální nebo nové heslo" });
    }
    try {
      // Ověř aktuální heslo
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Uživatel nenalezen" });
      const isValid = await storage.validateUser(user.username, currentPassword);
      if (!isValid) return res.status(401).json({ message: "Aktuální heslo je špatně" });
      // Ulož nové heslo
      const hashedPassword = await storage.hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);
      res.json({ success: true });
    } catch (error) {
      console.error("Chyba při změně hesla:", error);
      res.status(500).json({ message: "Nepodařilo se změnit heslo", error: error?.message || error });
    }
  });

  // --- ADMIN: Uložení komponent hůlek ---
  app.put("/api/admin/wand-components", requireAdmin, async (req, res) => {
    try {
      const { woods, cores, lengths, flexibilities } = req.body;
      await storage.updateWandComponents({ woods, cores, lengths, flexibilities });
      res.json({ success: true });
    } catch (error) {
      console.error("Chyba při ukládání komponent hůlek:", error);
      res.status(500).json({ message: "Nepodařilo se uložit komponenty hůlek", error: error?.message || error });
    }
  });

  // Visit Ollivanders (get random wand)
  app.post('/api/characters/:id/visit-ollivanders', requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if character belongs to user
      ```typescript
      const character = await storage.getCharacterById(characterId);
      if (!character || character.userId !== userId) {
        return res.status(403).json({ error: "Character not found or access denied" });
      }

      // Check if character already has a wand
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ error: "Character already has a wand" });
      }

      const wand = await storage.generateRandomWand(characterId);
      res.json(wand);
    } catch (error: any) {
      console.error('Error visiting Ollivanders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create custom wand
  app.post('/api/characters/:id/create-custom-wand', requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { wood, core, length, flexibility, description } = req.body;

      // Check if character belongs to user
      const character = await storage.getCharacterById(characterId);
      if (!character || character.userId !== userId) {
        return res.status(403).json({ error: "Character not found or access denied" });
      }

      // Check if character already has a wand
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ error: "Character already has a wand" });
      }

      // Validate required fields
      if (!wood || !core || !length || !flexibility) {
        return res.status(400).json({ error: "All wand components are required" });
      }

      const wandData = {
        character_id: characterId,
        wood,
        core,
        length,
        flexibility,
        description: description || `A ${length} wand made of ${wood} wood with a ${core} core, ${flexibility}`,
        acquired_at: new Date().toISOString()
      };

      const wand = await storage.createWand(wandData);
      res.json(wand);
    } catch (error: any) {
      console.error('Error creating custom wand:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get character's wand
  app.get('/api/characters/:id/wand', requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if character belongs to user or is admin
      if (req.user!.role !== 'admin') {
        const character = await storage.getCharacterById(characterId);
        if (!character || character.userId !== userId) {
          return res.status(403).json({ error: "Character not found or access denied" });
        }
      }

      const wand = await storage.getCharacterWand(characterId);
      if (!wand) {
        return res.status(404).json({ error: "Character has no wand" });
      }

      res.json(wand);
    } catch (error: any) {
      console.error('Error fetching character wand:', error);
      res.status(500).json({ error: error.message });
    }
  });
}