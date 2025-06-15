import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import jwt from 'jsonwebtoken';

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

export async function registerRoutes(app: Express): Promise<void> {
  // HTTP a WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

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
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          characters,
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
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const characters = await storage.getCharactersByUserId(user.id);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      characters,
    });
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

  // Seznam všech postav uživatele
  app.get("/api/characters/all", requireAuth, async (req, res) => {
    try {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      console.log(`[API] /api/characters/all - User ${req.user!.id} has ${characters.length} characters`);
      res.json({ characters });
    } catch (error) {
      console.error("Error fetching user characters:", error);
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

  // Endpoint pro seznam všech postav (bez parametrů)
  app.get("/api/characters", requireAuth, async (req, res) => {
    try {
      if (req.user!.role === 'admin') {
        const allCharacters = await storage.getAllCharacters();
        res.json({ characters: allCharacters });
      } else {
        const userCharacters = await storage.getCharactersByUserId(req.user!.id);
        res.json({ characters: userCharacters });
      }
    } catch (error) {
      console.error("Chyba při načítání postav:", error);
      res.status(500).json({ message: "Chyba serveru" });
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

  // Komponenty pro tvorbu hůlek (zatím prázdné)
  app.get("/api/wand-components", requireAuth, async (_req, res) => {
    res.json({ woods: [], cores: [], lengths: [], flexibilities: [] });
  });

  // Chat kategorie (zatím prázdné)
  app.get("/api/chat/categories", requireAuth, async (_req, res) => {
    res.json([]);
  });

  // Chat místnosti (zatím prázdné)
  app.get("/api/chat/rooms", requireAuth, async (_req, res) => {
    res.json([]);
  });

  // Character inventory routes
  app.get("/api/characters/:id/inventory", requireAuth, async (req, res) => {
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

    const inventory = await storage.getCharacterInventory(characterId);
    res.json(inventory);
  });

  app.post("/api/characters/:id/inventory", requireAuth, async (req, res) => {
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
      const inventoryItem = await storage.addInventoryItem({
        characterId,
        ...req.body
      });
      res.status(201).json(inventoryItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

    const character = await storage.getCharacter(item.characterId);
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

    const character = await storage.getCharacter(item.characterId);
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

  // Characters endpoint - hlavní endpoint pro načítání postav uživatele
  app.get("/api/characters", requireAuth, async (req, res) => {
    try {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
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
      
      await storage.setInfluence(newGrindelwaldPoints, newDumbledorePoints, req.user!.id);
      
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
      await storage.setInfluence(resetValues.grindelwald, resetValues.dumbledore, req.user!.id);
      
      res.json({ message: "Influence reset successfully" });
    } catch (error) {
      console.error("Error resetting influence:", error);
      res.status(500).json({ message: "Failed to reset influence" });
    }
  });

  // Owl Post routes
  app.get("/api/owl-post/unread-total", requireAuth, async (req, res) => {
    try {
      // Vrátíme celkový počet pro všechny postavy uživatele (bez parametru characterId)

      let totalCount = 0;

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
        // Spočítáme celkový počet pro všechny postavy uživatele
        const userCharacters = await storage.getCharactersByUserId(req.user!.id);
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
    try {
      // Vrátíme všechny aktivní postavy pro owl post (ne jen uživatelovy)
      const allCharacters = await storage.getAllCharacters();
      const activeCharacters = allCharacters.filter((char: any) => !char.deathDate && !char.isSystem);
      
      // Přidáme fullName pro kompatibilitu s frontendem
      const charactersWithFullName = activeCharacters.map((char: any) => ({
        ...char,
        fullName: `${char.firstName} ${char.middleName ? char.middleName + ' ' : ''}${char.lastName}`
      }));
      
      res.json(charactersWithFullName);
    } catch (error) {
      console.error("Chyba při načítání owl-post characters:", error);
      res.status(500).json({ message: "Server error" });
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
            lastName: recipient.lastName
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
            lastName: recipient.lastName
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

  // Seznam všech uživatelů (pouze pro adminy)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Chyba při načítání uživatelů:", error);
      res.status(500).json({ message: "Chyba serveru" });
    }
  });

  // ... další endpointy (např. /api/user/character-order, /api/user/highlight-words, atd.) ...
  // Všude používej pouze req.user!.id a req.user!.role
  // ŽÁDNÉ req.session, req.cookies, SessionData, debug endpointy na session/cookie!
}