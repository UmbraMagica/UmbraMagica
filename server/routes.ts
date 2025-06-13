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

  // ... další endpointy (např. /api/user/character-order, /api/user/highlight-words, atd.) ...
  // Všude používej pouze req.user!.id a req.user!.role
  // ŽÁDNÉ req.session, req.cookies, SessionData, debug endpointy na session/cookie!
}