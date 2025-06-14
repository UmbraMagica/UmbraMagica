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
    const characters = await storage.getCharactersByUserId(req.user!.id);
    res.json({ characters });
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

  // Seznam všech postav uživatele (pro kompatibilitu)
  app.get("/api/characters", requireAuth, async (req, res) => {
    const characters = await storage.getCharactersByUserId(req.user!.id);
    res.json({ characters });
  });
  app.get("/api/characters/", requireAuth, async (req, res) => {
    const characters = await storage.getCharactersByUserId(req.user!.id);
    res.json({ characters });
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
import { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import jwt from "jsonwebtoken";

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

function generateJwt(user: { id: number; username: string; role: string }) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
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

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
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

      return res.json({
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

  // další endpointy ...
}
app.post("/api/auth/logout", requireAuth, (req, res) => {
  return res.json({ message: "Logged out successfully" });
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

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters: [character],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (!res.headersSent)
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
// Soví pošta: odeslání nové zprávy
app.post("/api/owl-post", requireAuth, async (req, res) => {
  const { senderCharacterId, recipientCharacterId, subject, content } = req.body;
  if (!senderCharacterId || !recipientCharacterId || !subject || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    // Ověř, že odesílatelská postava patří uživateli (nebo je admin)
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === senderCharacterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const msg = await storage.sendOwlPostMessage(senderCharacterId, recipientCharacterId, subject, content);
    return res.status(201).json({ message: msg });
  } catch (e: any) {
    console.error("Send owl post error:", e);
    if (!res.headersSent) return res.status(500).json({ message: e.message || "Failed to send message" });
  }
});

// Soví pošta: označení zprávy jako přečtené
app.post("/api/owl-post/:messageId/read", requireAuth, async (req, res) => {
  const messageId = Number(req.params.messageId);
  const { characterId } = req.body;
  if (!messageId || isNaN(messageId) || !characterId) {
    return res.status(400).json({ message: "Invalid messageId or characterId" });
  }
  try {
    // Ověř, že postava patří uživateli (nebo je admin)
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const ok = await storage.markOwlPostMessageRead(messageId, characterId);
    if (ok) {
      return res.json({ success: true });
    } else {
      return res.status(404).json({ message: "Message not found or not allowed" });
    }
  } catch (e: any) {
    console.error("Mark message read error:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to mark message as read" });
  }
});

// Seznam všech postav uživatele
app.get("/api/characters/all", requireAuth, async (req, res) => {
  try {
    const characters = await storage.getCharactersByUserId(req.user!.id);
    return res.json({ characters });
  } catch (e) {
    console.error("Get all characters error:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to get characters" });
  }
});

// Seznam online postav (zatím prázdné)
app.get("/api/characters/online", requireAuth, async (_req, res) => {
  return res.json([]);
});

// Hůlka postavy
app.get("/api/characters/:id/wand", requireAuth, async (req, res) => {
  const characterId = Number(req.params.id);
  if (!characterId || isNaN(characterId)) {
    return res.status(400).json({ message: "Invalid characterId" });
  }
  try {
    if (req.user!.role !== 'admin') {
      const characters = await storage.getCharactersByUserId(req.user!.id);
      if (!characters.some((char: any) => char.id === characterId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const wand = await storage.getCharacterWand(characterId);
    if (!wand) return res.status(404).json({ message: "Not Found" });
    return res.json(wand);
  } catch (e) {
    console.error("Get wand error:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to get wand" });
  }
});

// Poslední chat postavy (zatím null)
app.get("/api/characters/:id/last-chat", requireAuth, async (_req, res) => {
  return res.json(null);
});

// Seznam všech postav uživatele (pro kompatibilitu)
app.get("/api/characters", requireAuth, async (req, res) => {
  try {
    const characters = await storage.getCharactersByUserId(req.user!.id);
    return res.json({ characters });
  } catch (e) {
    console.error("Get characters error:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to get characters" });
  }
});
app.get("/api/characters/", requireAuth, async (req, res) => {
  try {
    const characters = await storage.getCharactersByUserId(req.user!.id);
    return res.json({ characters });
  } catch (e) {
    console.error("Get characters error:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to get characters" });
  }
});

// Komponenty pro tvorbu hůlek (zatím prázdné)
app.get("/api/wand-components", requireAuth, async (_req, res) => {
  return res.json({ woods: [], cores: [], lengths: [], flexibilities: [] });
});

// Chat kategorie (zatím prázdné)
app.get("/api/chat/categories", requireAuth, async (_req, res) => {
  return res.json([]);
});

// Chat místnosti (zatím prázdné)
app.get("/api/chat/rooms", requireAuth, async (_req, res) => {
  return res.json([]);
});
// Chat místnosti (zatím prázdné)
app.get("/api/chat/rooms", requireAuth, async (_req, res) => {
  return res.json([]);
});

// Influence bar (mock)
app.get("/api/influence-bar", requireAuth, async (_req, res) => {
  console.log("HIT /api/influence-bar");
  return res.json({ grindelwaldPoints: 50, dumbledorePoints: 50 });
});

app.get("/api/influence-bar/", requireAuth, async (_req, res) => {
  console.log("HIT /api/influence-bar/");
  return res.json({ grindelwaldPoints: 50, dumbledorePoints: 50 });
});

// Influence history (mock)
app.get("/api/influence-history", requireAuth, async (_req, res) => {
  console.log("HIT /api/influence-history");
  return res.json([]);
});

app.get("/api/influence-history/", requireAuth, async (_req, res) => {
  console.log("HIT /api/influence-history/");
  return res.json([]);
});

// Seznam postav pro poštu (zatím prázdné)
app.get("/api/owl-post/characters", requireAuth, async (_req, res) => {
  return res.json([]);
});
app.get("/api/owl-post/characters/", requireAuth, async (_req, res) => {
  return res.json([]);
});

// Celkový počet nepřečtených zpráv (zatím 0)
app.get("/api/owl-post/unread-total", requireAuth, async (_req, res) => {
  return res.json({ count: 0 });
});
app.get("/api/owl-post/unread-total/", requireAuth, async (_req, res) => {
  return res.json({ count: 0 });
});

// ... další endpointy (např. /api/user/character-order, /api/user/highlight-words, atd.) ...
// Vždy používej pouze req.user!.id a req.user!.role
// Nepoužívej req.session, req.cookies, SessionData, debug endpointy na session/cookie!
