import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema, insertCharacterSchema, insertMessageSchema, characterEditSchema, characterAdminEditSchema, characterRequestSchema, spellSchema, insertChatCategorySchema, insertChatRoomSchema, insertHousingRequestSchema, insertOwlPostMessageSchema } from "../shared/schema";
import { z } from "zod";
import session from "express-session";
import multer from "multer";
import sharp from "sharp";
import pgSession from "connect-pg-simple";
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { supabase } from './storage';
import type { Request } from "express";

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://umbramagica-1.onrender.com',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: process.env.CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
    }
  }
}

// Game date utility function
const GAME_YEAR = 1926;

function getCurrentGameDate(): string {
  const currentDate = new Date();
  return `${currentDate.getDate()}. ${currentDate.toLocaleDateString('cs-CZ', { month: 'long' })} ${GAME_YEAR}`;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Simple rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 100, windowMs: number = 60000) => {
  const now = Date.now();
  const userLimit = rateLimiter.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
};

const JWT_SECRET = process.env.JWT_SECRET || 'umbra-magica-jwt-secret-key-fixed-2024';

function generateJwt(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function requireAuthJWT(req, res, next) {
  const auth = req.headers.authorization;
  console.log('Authorization header:', auth);
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = auth.slice(7);
  const payload = verifyJwt(token);
  console.log('JWT payload:', payload);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.user = payload;
  next();
}

function requireAdminJWT(req, res, next) {
  requireAuthJWT(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

// Přidám nový middleware:
function requireAuthFlexible(req, res, next) {
  // Pokud je session, pokračuj
  if (req.session && req.session.userId) return next();
  // Pokud je JWT, pokračuj
  const auth = req.headers.authorization;
  console.log('Authorization header:', auth);
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyJwt(token);
    console.log('JWT payload:', payload);
    if (payload) {
      req.user = payload;
      return next();
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server with specific path to avoid Vite HMR conflict
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection tracking
  const activeConnections = new Map<WebSocket, { userId?: number; characterId?: number; roomId?: number }>();
  const roomPresence = new Map<number, Set<number>>();

  // Broadcast function for WebSocket
  const broadcastToRoom = (roomId: number, data: any) => {
    for (const [ws, connInfo] of activeConnections.entries()) {
      if (ws.readyState === WebSocket.OPEN && connInfo.roomId === roomId) {
        ws.send(JSON.stringify(data));
      }
    }
  };

  // WebSocket connection handler
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    activeConnections.set(ws, {});

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString('utf-8'));
        const connInfo = activeConnections.get(ws);
        if (!connInfo) return;

        if (data.type === 'join_room') {
          connInfo.roomId = data.roomId;
          connInfo.characterId = data.characterId;
          connInfo.userId = data.userId;
          
          // Add to room presence
          if (!roomPresence.has(data.roomId)) {
            roomPresence.set(data.roomId, new Set());
          }
          if (data.characterId) {
            roomPresence.get(data.roomId)!.add(data.characterId);
          }
        } else if (data.type === 'leave_room') {
          if (connInfo.roomId && connInfo.characterId) {
            const roomChars = roomPresence.get(connInfo.roomId);
            if (roomChars) {
              roomChars.delete(connInfo.characterId);
            }
          }
          connInfo.roomId = undefined;
          connInfo.characterId = undefined;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      const connInfo = activeConnections.get(ws);
      if (connInfo && connInfo.roomId && connInfo.characterId) {
        const roomChars = roomPresence.get(connInfo.roomId);
        if (roomChars) {
          roomChars.delete(connInfo.characterId);
        }
      }
      activeConnections.delete(ws);
    });
  });

  // Rate limiting middleware
  app.use((req, res, next) => {
    const identifier = req.ip;
    if (!checkRateLimit(identifier, 100, 60000)) {
      return res.status(429).json({ message: "Too many requests" });
    }
    next();
  });

  // Chat endpoints
  app.get('/api/chat/rooms', requireAuthFlexible, async (req, res) => {
    try {
      const rooms = await storage.getAllChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      res.status(500).json({ message: 'Error fetching chat rooms' });
    }
  });

  app.get('/api/chat/rooms/:roomId/messages', requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      if (!roomId) {
        return res.status(400).json({ message: 'Invalid room ID' });
      }
      
      const messages = await storage.getMessagesByRoom(roomId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  app.get('/api/chat/rooms/:roomId/presence', requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      if (!roomId) {
        return res.status(400).json({ message: 'Invalid room ID' });
      }
      
      const characters = await storage.getCharactersInRoom(roomId);
      res.json(characters);
    } catch (error) {
      console.error('Error fetching room presence:', error);
      res.status(500).json({ message: 'Error fetching room presence' });
    }
  });

  app.post('/api/chat/messages', requireAuthFlexible, async (req, res) => {
    try {
      const { roomId, characterId, content, messageType } = req.body;
      if (!roomId || !characterId || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const message = await storage.createMessage({
        roomId,
        characterId,
        content,
        messageType: messageType || 'text'
      });

      // Broadcast message to WebSocket
      broadcastToRoom(roomId, {
        type: 'new-message',
        message
      });

      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Error creating message' });
    }
  });

  // Chat categories endpoints
  app.get('/api/admin/chat-categories', requireAdminJWT, async (req, res) => {
    try {
      const categories = await storage.getAllChatCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching chat categories:', error);
      res.status(500).json({ message: 'Error fetching chat categories' });
    }
  });

  app.post('/api/admin/chat-categories', requireAdminJWT, async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = await storage.createChatCategory({
        name,
        description
      });
      res.json(category);
    } catch (error) {
      console.error('Error creating chat category:', error);
      res.status(500).json({ message: 'Error creating chat category' });
    }
  });

  app.put('/api/admin/chat-categories/:categoryId', requireAdminJWT, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const { name, description } = req.body;
      const category = await storage.updateChatCategory(categoryId, {
        name,
        description
      });
      res.json(category);
    } catch (error) {
      console.error('Error updating chat category:', error);
      res.status(500).json({ message: 'Error updating chat category' });
    }
  });

  app.delete('/api/admin/chat-categories/:categoryId', requireAdminJWT, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const success = await storage.deleteChatCategory(categoryId);
      if (success) {
        res.json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      console.error('Error deleting chat category:', error);
      res.status(500).json({ message: 'Error deleting chat category' });
    }
  });

  // Debug middleware for chat endpoints
  app.use('/api/chat/*', (req, res, next) => {
    console.log(`${req.method} ${req.path} - Query:`, req.query);
    next();
  });

  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionSecret = process.env.SESSION_SECRET || 'umbra-magica-session-secret-key-fixed-2024';

  app.use(session({
    store: new (pgSession(session))({
      conString: process.env.DATABASE_URL
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.onrender.com', // důležité pro cross-domain cookies na Renderu
      maxAge: sessionTtl,
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  };

  // Multer configuration for avatar uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Check username availability
  app.get("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Auth routes
  app.get("/api/auth/user", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.slice(7);
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await storage.getUser(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const characters = await storage.getCharactersByUserId(user.id);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      characters,
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
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
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registrationSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Validate invite code
      const inviteCode = await storage.getInviteCode(data.inviteCode);
      if (!inviteCode || inviteCode.isUsed) {
        return res.status(400).json({ message: "Invalid or already used invite code" });
      }

      // Hash password
      const hashedPassword = await storage.hashPassword(data.password);

      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: "user",
      });

      // Use invite code
      await storage.useInviteCode(data.inviteCode, user.id);

      // Create character
      const character = await storage.createCharacter({
        userId: user.id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        birthDate: data.birthDate,
      });

      // Log user in
      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters: [character],
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User settings endpoints
  app.post("/api/user/character-order", requireAuth, async (req: any, res) => {
    try {
      const { characterOrder } = req.body;

      if (!Array.isArray(characterOrder)) {
        return res.status(400).json({ message: "Character order must be an array" });
      }

      await storage.updateUserSettings(req.session.userId, {
        characterOrder: JSON.stringify(characterOrder)
      });

      res.json({ message: "Character order updated successfully" });
    } catch (error) {
      console.error("Error updating character order:", error);
      res.status(500).json({ message: "Failed to update character order" });
    }
  });

  app.post("/api/user/highlight-words", requireAuth, async (req: any, res) => {
    try {
      const { highlightWords, highlightColor } = req.body;

      if (typeof highlightWords !== 'string') {
        return res.status(400).json({ message: "Invalid highlight words format" });
      }

      const updateData: any = {
        highlightWords: highlightWords
      };

      if (highlightColor && typeof highlightColor === 'string') {
        updateData.highlightColor = highlightColor;
      }

      await storage.updateUserSettings(req.session.userId, updateData);

      res.json({ message: "Highlight words updated successfully" });
    } catch (error) {
      console.error("Error updating highlight words:", error);
      res.status(500).json({ message: "Failed to update highlight words" });
    }
  });

  app.post("/api/user/narrator-color", requireAuth, async (req: any, res) => {
    try {
      const { narratorColor } = req.body;

      if (!narratorColor || typeof narratorColor !== 'string') {
        return res.status(400).json({ message: "Narrator color is required" });
      }

      const validColors = ['yellow', 'red', 'blue', 'green', 'pink', 'purple'];
      if (!validColors.includes(narratorColor)) {
        return res.status(400).json({ message: "Invalid narrator color" });
      }

      await storage.updateUserSettings(req.session.userId, {
        narratorColor: narratorColor
      });

      res.json({ message: "Narrator color updated successfully" });
    } catch (error) {
      console.error("Error updating narrator color:", error);
      res.status(500).json({ message: "Failed to update narrator color" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Současné heslo a nové heslo jsou povinné" });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Nové heslo musí obsahovat alespoň 8 znaků" });
      }
      if (!/(?=.*[a-z])/.test(newPassword)) {
        return res.status(400).json({ message: "Nové heslo musí obsahovat alespoň jedno malé písmeno" });
      }
      if (!/(?=.*[A-Z])/.test(newPassword)) {
        return res.status(400).json({ message: "Nové heslo musí obsahovat alespoň jedno velké písmeno" });
      }
      if (!/(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ message: "Nové heslo musí obsahovat alespoň jednu číslici" });
      }

      // Get current user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Uživatel nebyl nalezen" });
      }

      // Validate current password
      const isCurrentPasswordValid = await storage.validateUser(user.username, currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Současné heslo je nesprávné" });
      }

      // Hash new password and update
      const hashedNewPassword = await storage.hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({ message: "Heslo bylo úspěšně změněno" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Nepodařilo se změnit heslo" });
    }
  });

  app.post("/api/auth/change-email", requireAuth, async (req: any, res) => {
    try {
      const { newEmail, confirmPassword } = req.body;

      if (!newEmail || !confirmPassword) {
        return res.status(400).json({ message: "Nový email a potvrzení hesla jsou povinné" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: "Neplatný formát emailu" });
      }

      // Get current user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Uživatel nebyl nalezen" });
      }

      // Validate password
      const isPasswordValid = await storage.validateUser(user.username, confirmPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Heslo je nesprávné" });
      }

      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: "Tento email je již používán" });
      }

      // Update email
      await storage.updateUserEmail(user.id, newEmail);

      res.json({ message: "Email byl úspěšně změněn" });
    } catch (error) {
      console.error("Error changing email:", error);
      res.status(500).json({ message: "Nepodařilo se změnit email" });
    }
  });

  // User routes
  app.get("/api/users", requireAdminJWT, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithCharacters = await Promise.all(
        users.map(async (user) => {
          const characters = await storage.getCharactersByUserId(user.id);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            canNarrate: user.canNarrate || false,
            characters,
          };
        })
      );
      res.json(usersWithCharacters);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", requireAdminJWT, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(parseInt(id), role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Role updated successfully", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdminJWT, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(parseInt(id), role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log admin activity
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "user_role_change",
        details: `Changed role of user ${user.username} to ${role}`
      });

      res.json({ message: "Role updated successfully", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/admin/users/:id/narrator", requireAdminJWT, async (req, res) => {
    try {
      const { id } = req.params;
      const { canNarrate, reason } = req.body;
      
      if (typeof canNarrate !== 'boolean') {
        return res.status(400).json({ message: "canNarrate must be a boolean" });
      }

      const user = await storage.updateUserNarratorPermission(parseInt(id), canNarrate);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log admin activity with reason if provided
      const details = canNarrate 
        ? `Granted narrator permission for user ${user.username}`
        : `Revoked narrator permission for user ${user.username}${reason ? ` - Reason: ${reason}` : ''}`;
        
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "narrator_permission_change",
        details
      });

      res.json({ message: "Narrator permission updated successfully", user });
    } catch (error) {
      console.error("Error updating narrator permission:", error);
      res.status(500).json({ message: "Failed to update narrator permission" });
    }
  });

  // Character avatar upload
  app.post("/api/characters/:id/avatar", requireAuth, upload.single('avatar'), async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Check if the character belongs to the authenticated user
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      if (character.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this character" });
      }
      
      // Process the image with Sharp
      const processedImage = await sharp(req.file.buffer)
        .resize(150, 150, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Convert to base64
      const base64Avatar = `data:image/jpeg;base64,${processedImage.toString('base64')}`;
      
      // Update character with new avatar
      const updatedCharacter = await storage.updateCharacter(characterId, { avatar: base64Avatar });
      
      res.json({ 
        message: "Avatar uploaded successfully", 
        avatar: base64Avatar,
        character: updatedCharacter 
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Remove character avatar
  app.delete("/api/characters/:id/avatar", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if the character belongs to the authenticated user
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      if (character.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this character" });
      }
      
      // Remove avatar
      const updatedCharacter = await storage.updateCharacter(characterId, { avatar: null });
      
      res.json({ 
        message: "Avatar removed successfully",
        character: updatedCharacter 
      });
    } catch (error) {
      console.error("Error removing avatar:", error);
      res.status(500).json({ message: "Failed to remove avatar" });
    }
  });

  // Character routes
  app.patch("/api/characters/:id", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if the character belongs to the authenticated user or if user is admin
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const requestingUser = await storage.getUser(userId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Allow access if user owns the character OR is an admin
      if (character.userId !== userId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only character owner or admin can edit." });
      }
      
      // Use different validation based on what fields are being sent
      let validatedData;
      const bodyKeys = Object.keys(req.body);
      const isFullEdit = bodyKeys.includes('firstName') || bodyKeys.includes('lastName') || bodyKeys.includes('birthDate');
      
      if (isFullEdit && requestingUser.role === "admin") {
        // Admin can update all fields when full data is provided
        validatedData = characterAdminEditSchema.parse(req.body);
      } else {
        // Regular users can only update school and description, or admin doing limited edit
        validatedData = characterEditSchema.parse(req.body);
      }

      // Special handling for height - can only be set once
      if (validatedData.height !== undefined) {
        if (character.heightSetAt && requestingUser.role !== "admin") {
          return res.status(400).json({ message: "Výška může být nastavena pouze jednou" });
        }
        // Add heightSetAt to the update data if not already set
        if (!character.heightSetAt) {
          (validatedData as any).heightSetAt = new Date();
        }
      }

      // Special handling for school - can only be set once (unless admin)
      if (validatedData.school !== undefined) {
        if (character.schoolSetAt && requestingUser.role !== "admin") {
          return res.status(400).json({ message: "Škola může být nastavena pouze jednou" });
        }
        // Add schoolSetAt to the update data if not already set
        if (!character.schoolSetAt) {
          (validatedData as any).schoolSetAt = new Date();
        }
      }
      
      const updatedCharacter = await storage.updateCharacter(characterId, validatedData);
      
      if (!updatedCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ message: "Failed to update character" });
    }
  });

  // Update character history
  app.put("/api/characters/:id/history", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { history, showHistoryToOthers } = req.body;
      const userId = req.session.userId!;
      
      // Check if the character belongs to the authenticated user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Postava nebyla nalezena" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Uživatel nenalezen" });
      }
      
      if (character.userId !== userId && user.role !== 'admin') {
        return res.status(403).json({ message: "Nemáte oprávnění upravovat tuto postavu" });
      }
      
      // Update character with history data
      const updatedCharacter = await storage.updateCharacter(characterId, {
        characterHistory: history,
        showHistoryToOthers: showHistoryToOthers,
        updatedAt: new Date()
      });
      
      if (!updatedCharacter) {
        return res.status(500).json({ message: "Nepodařilo se aktualizovat historii postavy" });
      }
      
      res.json({ 
        message: "Historie postavy byla úspěšně aktualizována",
        character: updatedCharacter 
      });
    } catch (error) {
      console.error("Error updating character history:", error);
      res.status(500).json({ message: "Nepodařilo se aktualizovat historii postavy" });
    }
  });

  app.get("/api/characters/online", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/characters/online", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const onlineCharacters = await storage.getOnlineCharacters();
      res.json(onlineCharacters);
    } catch (error) {
      console.error("Error fetching online characters:", error);
      res.status(500).json({ message: "Failed to fetch online characters" });
    }
  });

  // Admin endpoint for online users count (including users without active WebSocket characters)
  app.get("/api/admin/online-users", requireAdminJWT, async (req, res) => {
    try {
      // Get unique user IDs from active WebSocket connections
      const connectedUserIds = new Set<number>();
      
      for (const [ws, connInfo] of activeConnections.entries()) {
        if (ws.readyState === WebSocket.OPEN && connInfo.userId) {
          // Check if user is not a system user
          const user = await storage.getUser(connInfo.userId);
          if (user && !user.isSystem) {
            connectedUserIds.add(connInfo.userId);
          }
        }
      }
      
      // Add current admin user as online (since they're making this request)
      const currentUserId = req.user.id;
      if (currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (currentUser && !currentUser.isSystem) {
          connectedUserIds.add(currentUserId);
        }
      }
      
      const onlineUsersCount = connectedUserIds.size;
      
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ count: onlineUsersCount });
    } catch (error) {
      console.error("Error fetching online users count:", error);
      res.status(500).json({ message: "Failed to fetch online users count" });
    }
  });

  // Admin routes
  app.get("/api/admin/invite-codes", requireAdminJWT, async (req, res) => {
    try {
      const inviteCodes = await storage.getAllInviteCodes();
      res.json(inviteCodes);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });

  app.post("/api/admin/invite-codes", requireAdminJWT, async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || code.length < 6) {
        return res.status(400).json({ message: "Invite code must be at least 6 characters long" });
      }

      const existingCode = await storage.getInviteCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Invite code already exists" });
      }

      const inviteCode = await storage.createInviteCode({ code });
      res.json(inviteCode);
    } catch (error) {
      console.error("Error creating invite code:", error);
      res.status(500).json({ message: "Failed to create invite code" });
    }
  });

  // Update existing characters to use game year dates
  app.post("/api/admin/update-character-dates", requireAdminJWT, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      let updatedCount = 0;

      for (const user of users) {
        const characters = await storage.getCharactersByUserId(user.id);
        for (const character of characters) {
          // Only update characters with modern birth dates (after 1926)
          const birthYear = new Date(character.birthDate).getFullYear();
          if (birthYear > 1926) {
            // Convert to appropriate game year (1880-1910 range)
            const gameAge = Math.max(16, Math.min(46, birthYear - 1970)); // Reasonable age range
            const gameBirthYear = 1926 - gameAge;
            const originalDate = new Date(character.birthDate);
            const newBirthDate = new Date(gameBirthYear, originalDate.getMonth(), originalDate.getDate());
            
            await storage.updateCharacter(character.id, {
              birthDate: newBirthDate.toISOString().split('T')[0]
            });
            updatedCount++;
          }
        }
      }

      res.json({ 
        message: `Updated birth dates for ${updatedCount} characters to match game year 1926`,
        updatedCount 
      });
    } catch (error) {
      console.error("Error updating character dates:", error);
      res.status(500).json({ message: "Failed to update character dates" });
    }
  });

  // Initialize test data
  app.post("/api/admin/init-test-data", async (req, res) => {
    try {
      // Create test invite codes
      const testCodes = ["WELCOME2024", "ADMIN_INVITE", "USER_INVITE"];
      for (const code of testCodes) {
        const existing = await storage.getInviteCode(code);
        if (!existing) {
          await storage.createInviteCode({ code });
        }
      }

      // Create test admin user
      const adminExists = await storage.getUserByUsername("TesterAdmin");
      if (!adminExists) {
        const hashedPassword = await storage.hashPassword("admin123");
        const adminUser = await storage.createUser({
          username: "TesterAdmin",
          email: "admin@umbra-magica.cz",
          password: hashedPassword,
          role: "admin",
        });

        await storage.createCharacter({
          userId: adminUser.id,
          firstName: "Gandalf",
          middleName: "the",
          lastName: "Grey",
          birthDate: "1880-01-15", // Born in 1880, age 46 in 1926
          isActive: true
        });
      }

      // Create test regular user
      const userExists = await storage.getUserByUsername("TesterUživatel");
      if (!userExists) {
        const hashedPassword = await storage.hashPassword("user123");
        const regularUser = await storage.createUser({
          username: "TesterUživatel",
          email: "user@umbra-magica.cz",
          password: hashedPassword,
          role: "user",
        });

        await storage.createCharacter({
          userId: regularUser.id,
          firstName: "Aragorn",
          lastName: "Ranger",
          birthDate: "1895-03-20", // Born in 1895, age 31 in 1926
          isActive: true
        });

        await storage.createCharacter({
          userId: regularUser.id,
          firstName: "Frodo",
          lastName: "Pytlík",
          birthDate: "1902-09-22", // Born in 1902, age 24 in 1926
          isActive: true
        });
      }

      // Create chat categories and rooms for Wizarding London
      
      // 1. Main category: Kouzelnický Londýn
      let wizardingLondon = await storage.getChatCategoryByName("Kouzelnický Londýn");
      if (!wizardingLondon) {
        wizardingLondon = await storage.createChatCategory({
          name: "Kouzelnický Londýn",
          description: "Hlavní oblast kouzelného Londýna",
          sortOrder: 1,
        });
      }

      // 2. Subcategory: Příčná ulice
      let diagonAlley = await storage.getChatCategoryByName("Příčná ulice");
      if (!diagonAlley) {
        diagonAlley = await storage.createChatCategory({
          name: "Příčná ulice",
          description: "Hlavní nákupní ulice kouzelného světa",
          parentId: wizardingLondon.id,
          sortOrder: 1,
        });
      }

      // 3. Subcategory: Obrtlá ulice
      let knockturnAlley = await storage.getChatCategoryByName("Obrtlá ulice");
      if (!knockturnAlley) {
        knockturnAlley = await storage.createChatCategory({
          name: "Obrtlá ulice",
          description: "Temná ulička s podezřelými obchody",
          parentId: wizardingLondon.id,
          sortOrder: 2,
        });
      }

      // 4. Chat rooms in Příčná ulice
      const diagonAlleyRooms = [
        { name: "Ulice", description: "Hlavní ulice Příčné ulice", sortOrder: 1 },
        { name: "Gringottovi", description: "Banka pro čaroděje a kouzelníky", sortOrder: 2 },
        { name: "Děravý kotel", description: "Slavný hostinec a vstup do kouzelného světa", sortOrder: 3 },
        { name: "Černá vrána", description: "Pohřební služba pro kouzelný svět", sortOrder: 4 },
        { name: "Čarokáva", description: "Kavárna pro čaroděje", sortOrder: 5 },
      ];

      for (const roomData of diagonAlleyRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            categoryId: diagonAlley.id,
            isPublic: true,
            sortOrder: roomData.sortOrder,
          });
        }
      }

      // 5. Chat rooms in Obrtlá ulice
      const knockturnAlleyRooms = [
        { name: "Pošmourná ulička", description: "Temné zákoutí Obrtlé ulice", sortOrder: 1 },
        { name: "Zlomená hůlka", description: "Obchod s podezřelými kouzelnými předměty", sortOrder: 2 },
      ];

      for (const roomData of knockturnAlleyRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            categoryId: knockturnAlley.id,
            isPublic: true,
            sortOrder: roomData.sortOrder,
          });
        }
      }

      // 6. Additional subcategories under Kouzelnický Londýn
      const additionalCategories = [
        { name: "Ministerstvo kouzel", description: "Úřad kouzelné vlády", sortOrder: 3 },
        { name: "Nemocnice u sv. Munga", description: "Nemocnice pro kouzelné nemoci a úrazy", sortOrder: 4 },
        { name: "Katakomby", description: "Podzemní bludiště pod Londýnem", sortOrder: 5 },
      ];

      for (const categoryData of additionalCategories) {
        let category = await storage.getChatCategoryByName(categoryData.name);
        if (!category) {
          category = await storage.createChatCategory({
            name: categoryData.name,
            description: categoryData.description,
            parentId: wizardingLondon.id,
            sortOrder: categoryData.sortOrder,
          });
        }

        // Create a main room with the same name as the category
        const existingRoom = await storage.getChatRoomByName(categoryData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: categoryData.name,
            description: categoryData.description,
            categoryId: category.id,
            isPublic: true,
            sortOrder: 1,
          });
        }
      }

      // 7. Keep original rooms for compatibility
      const originalRooms = [
        { name: "Testovací chat", description: "Místnost pro testování a experimenty", sortOrder: 0 },
      ];

      for (const roomData of originalRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            isPublic: true,
            sortOrder: roomData.sortOrder,
          });
        }
      }

      res.json({ message: "Test data initialized successfully" });
    } catch (error) {
      console.error("Error initializing test data:", error);
      res.status(500).json({ message: "Failed to initialize test data" });
    }
  });

  // Chat category routes
  app.get("/api/chat/categories", requireAuthFlexible, async (req, res) => {
    try {
      const categories = await storage.getChatCategoriesWithChildren();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });

  // Chat routes
  app.get("/api/chat/rooms", requireAuthFlexible, async (req, res) => {
    try {
      const rooms = await storage.getAllChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.get("/api/chat/rooms/:roomId/messages", requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      console.log("GET /api/chat/rooms/:roomId/messages - roomId:", roomId);
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const messages = await storage.getMessagesByRoom(roomId, limit, offset);
      console.log("Fetched messages:", messages.length, "messages");
      if (messages.length > 0) {
        console.log("First message (should be newest):", messages[0].id, messages[0].content);
        console.log("Last message (should be oldest):", messages[messages.length-1].id, messages[messages.length-1].content);
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/chat/messages", requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.query.roomId as string);
      console.log("GET /api/chat/messages - roomId:", roomId);
      
      if (!roomId) {
        console.log("Missing roomId parameter");
        return res.status(400).json({ message: "roomId is required" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const messages = await storage.getMessagesByRoom(roomId, limit, offset);
      console.log("Fetched messages:", messages.length, "messages");
      console.log("Sample message:", messages[0]);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/messages", requireAuthFlexible, async (req, res) => {
    try {
      console.log("POST /api/chat/messages - Request body:", req.body);
      const { roomId, characterId, content, messageType } = req.body;
      const user = req.session.userId ? await storage.getUser(req.session.userId) : null;
      
      // For admins, characterId is optional
      if (!roomId || !content || (user?.role !== 'admin' && !characterId)) {
        console.log("Missing required fields:", { roomId, characterId, content, isAdmin: user?.role === 'admin' });
        return res.status(400).json({ message: "roomId and content are required" });
      }
      
      if (content.length < 1 || content.length > 5000) {
        console.log("Invalid content length:", content.length);
        return res.status(400).json({ message: "Message content must be 1-5000 characters" });
      }
      
      const messageData = {
        roomId: parseInt(roomId),
        characterId: characterId ? parseInt(characterId) : null,
        content: content.trim(),
        messageType: messageType || "text"
      };
      
      console.log("Creating message with data:", messageData);
      const message = await storage.createMessage(messageData);
      console.log("Message created successfully:", message);
      
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.post("/api/chat/rooms/:roomId/archive", requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const beforeDate = req.body.beforeDate ? new Date(req.body.beforeDate) : undefined;
      
      const archivedCount = await storage.archiveMessages(roomId, beforeDate);
      res.json({ message: `Archived ${archivedCount} messages`, count: archivedCount });
    } catch (error) {
      console.error("Error archiving messages:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });

  app.get("/api/chat/rooms/:roomId/export", requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessagesByRoom(roomId, 1000, 0);
      
      const exportData = messages.map(msg => ({
        timestamp: msg.createdAt,
        character: `${msg.character.firstName}${msg.character.middleName ? ` ${msg.character.middleName}` : ''} ${msg.character.lastName}`,
        message: msg.content,
        type: msg.messageType,
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="chat-export-${roomId}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting chat:", error);
      res.status(500).json({ message: "Failed to export chat" });
    }
  });

  // Admin endpoint to update room details
  app.patch("/api/admin/chat/rooms/:roomId", requireAdminJWT, async (req, res) => {
    try {
      const user = req.session.userId ? await storage.getUser(req.session.userId) : null;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roomId = parseInt(req.params.roomId);
      const { name, description, longDescription, isPublic } = req.body;

      if (!roomId) {
        return res.status(400).json({ message: "Room ID is required" });
      }

      const updatedRoom = await storage.updateChatRoom(roomId, { 
        name, 
        description, 
        longDescription, 
        isPublic 
      });
      
      if (!updatedRoom) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(updatedRoom);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  // Get characters present in a room
  app.get("/api/chat/rooms/:roomId/presence", requireAuthFlexible, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const characterIds = Array.from(roomPresence.get(roomId) || []);
      
      if (characterIds.length === 0) {
        return res.json([]);
      }

      // Fetch character details
      const characters = await Promise.all(
        characterIds.map(async (characterId) => {
          const character = await storage.getCharacter(characterId);
          return character ? {
            id: character.id,
            firstName: character.firstName,
            middleName: character.middleName,
            lastName: character.lastName,
            fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`,
            avatar: character.avatar
          } : null;
        })
      );

      res.json(characters.filter(Boolean));
    } catch (error) {
      console.error("Error fetching room presence:", error);
      res.status(500).json({ message: "Failed to fetch room presence" });
    }
  });

  // Verify room password
  app.post("/api/chat/rooms/:roomId/verify-password", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { password } = req.body;

      const room = await storage.getChatRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.isPublic) {
        return res.json({ success: true });
      }

      if (room.password === password) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false });
      }
    } catch (error) {
      console.error("Error verifying room password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  // Get user's own characters
  app.get("/api/characters", requireAuth, async (req, res) => {
    try {
      const characters = await storage.getCharactersByUserId(req.session.userId!);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  // Get all characters with user info (for admin/public use)
  app.get("/api/characters/all", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/characters/all", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const users = await storage.getAllUsers();
      const allCharacters = [];
      // Rozpoznání admina i při JWT autentizaci
      const isAdmin = req.user.role === 'admin';

      for (const user of users) {
        // Skip system users unless requesting user is admin
        if (user.isSystem && !isAdmin) {
          continue;
        }
        
        const characters = await storage.getCharactersByUserId(user.id);
        for (const character of characters) {
          // Skip system characters unless requesting user is admin
          if (character.isSystem && !isAdmin) {
            continue;
          }
          
          allCharacters.push({
            ...character,
            user: {
              username: user.username,
              email: user.email
            }
          });
        }
      }

      res.json(allCharacters);
    } catch (error) {
      console.error("Error fetching all characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  // Upravený endpoint pro získání postav včetně jejich hůlek
  app.get('/api/characters/all', async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();

      // Načteme hůlky pro všechny postavy
      const charactersWithWands = await Promise.all(
        characters.map(async (character) => {
          const wand = await storage.getCharacterWand(character.id);
          return {
            ...character,
            wand,
          };
        })
      );

      res.json(charactersWithWands);
    } catch (error) {
      console.error('Chyba při načítání postav s hůlkami:', error);
      res.status(500).json({ message: 'Nepodařilo se načíst postavy' });
    }
  });

  // Get characters with dormitory housing for room description
  app.get("/api/characters/dormitory-residents", requireAuthFlexible, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const dormitoryCharacters = [];
      const isAdmin = req.user.role === 'admin';
      for (const user of users) {
        if (user.isSystem && !isAdmin) {
          continue;
        }
        const characters = await storage.getCharactersByUserId(user.id);
        for (const character of characters) {
          if (character.isSystem && !isAdmin) {
            continue;
          }
          if (character.residence && character.residence.includes("Ubytovna U starého Šeptáka")) {
            dormitoryCharacters.push({
              id: character.id,
              firstName: character.firstName,
              middleName: character.middleName,
              lastName: character.lastName,
              residence: character.residence
            });
          }
        }
      }
      res.json(dormitoryCharacters);
    } catch (error) {
      console.error("Error fetching dormitory residents:", error);
      res.status(500).json({ message: "Failed to fetch dormitory residents" });
    }
  });




  // Get specific character with user info
  app.get("/api/characters/:id", requireAuthFlexible, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const user = await storage.getUser(character.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        ...character,
        user: {
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  // RPG Game mechanics - Dice and coin endpoints
  app.post("/api/game/dice-roll", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId } = req.body;
      
      if (!roomId || !characterId) {
        return res.status(400).json({ message: "roomId and characterId are required" });
      }

      // Generate random dice roll (1-10)
      const diceResult = Math.floor(Math.random() * 10) + 1;
      
      // Create message with dice roll result
      const diceMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: `hodil kostkou: ${diceResult}`,
        messageType: 'dice_roll',
      });

      res.json({ 
        result: diceResult, 
        message: diceMessage,
        success: true 
      });
    } catch (error) {
      console.error("Error rolling dice:", error);
      res.status(500).json({ message: "Failed to roll dice" });
    }
  });

  app.post("/api/game/coin-flip", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId } = req.body;
      
      if (!roomId || !characterId) {
        return res.status(400).json({ message: "roomId and characterId are required" });
      }

      // Generate random coin flip (1 or 2, representing heads/tails)
      const coinResult = Math.floor(Math.random() * 2) + 1;
      const coinSide = coinResult === 1 ? "panna" : "orel";
      
      // Create message with coin flip result
      const coinMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: `hodil mincí: ${coinSide}`,
        messageType: 'coin_flip',
      });

      res.json({ 
        result: coinResult,
        side: coinSide,
        message: coinMessage,
        success: true 
      });
    } catch (error) {
      console.error("Error flipping coin:", error);
      res.status(500).json({ message: "Failed to flip coin" });
    }
  });

  // Narrator message endpoint
  app.post("/api/chat/narrator-message", requireAuth, async (req, res) => {
    try {
      const { roomId, content } = req.body;
      const userId = req.session.userId!;
      
      if (!roomId || !content || !content.trim()) {
        return res.status(400).json({ message: "roomId and content are required" });
      }

      // Check if user has narrator permissions
      const user = await storage.getUser(userId);
      if (!user || !user.canNarrate) {
        return res.status(403).json({ message: "Narrator permissions required" });
      }

      // Create narrator message with null character ID for narrator messages
      const narratorMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: null, // null for narrator messages
        content: content.trim(),
        messageType: 'narrator',
      });

      // Broadcast to all clients in the room
      broadcastToRoom(parseInt(roomId), {
        type: 'new_message',
        message: {
          ...narratorMessage,
          character: {
            firstName: 'Vypravěč',
            middleName: null,
            lastName: '',
            avatar: null
          }
        }
      });

      res.json({ 
        message: narratorMessage,
        success: true 
      });
    } catch (error) {
      console.error("Error sending narrator message:", error);
      res.status(500).json({ message: "Failed to send narrator message" });
    }
  });

  // Spell management endpoints
  
  // Get all spells (for admin)
  app.get("/api/admin/spells", requireAdminJWT, async (req, res) => {
    try {
      const spells = await storage.getAllSpells();
      res.json(spells);
    } catch (error) {
      console.error("Error fetching spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });

  // Create new spell (admin only)
  app.post("/api/admin/spells", requireAdminJWT, async (req, res) => {
    try {
      const validatedData = spellSchema.parse(req.body);
      const spell = await storage.createSpell(validatedData);
      res.json(spell);
    } catch (error) {
      console.error("Error creating spell:", error);
      res.status(500).json({ message: "Failed to create spell" });
    }
  });

  // Update spell (admin only)
  app.put("/api/admin/spells/:id", requireAdminJWT, async (req, res) => {
    try {
      const spellId = parseInt(req.params.id);
      const validatedData = spellSchema.parse(req.body);
      const spell = await storage.updateSpell(spellId, validatedData);
      
      if (!spell) {
        return res.status(404).json({ message: "Spell not found" });
      }
      
      res.json(spell);
    } catch (error) {
      console.error("Error updating spell:", error);
      res.status(500).json({ message: "Failed to update spell" });
    }
  });

  // Delete spell (admin only)
  app.delete("/api/admin/spells/:id", requireAdminJWT, async (req, res) => {
    try {
      const spellId = parseInt(req.params.id);
      const success = await storage.deleteSpell(spellId);
      
      if (!success) {
        return res.status(404).json({ message: "Spell not found" });
      }
      
      res.json({ message: "Spell deleted successfully" });
    } catch (error) {
      console.error("Error deleting spell:", error);
      res.status(500).json({ message: "Failed to delete spell" });
    }
  });

  // Get character's spells
  app.get("/api/characters/:id/spells", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const spells = await storage.getCharacterSpells(characterId);
      res.json(spells);
    } catch (error) {
      console.error("Error fetching character spells:", error);
      res.status(500).json({ message: "Failed to fetch character spells" });
    }
  });

  // Initialize default spells (admin only)
  app.post("/api/admin/spells/initialize", requireAdminJWT, async (req, res) => {
    try {
      await storage.initializeDefaultSpells();
      res.json({ message: "Default spells initialized and added to all characters" });
    } catch (error) {
      console.error("Error initializing default spells:", error);
      res.status(500).json({ message: "Failed to initialize default spells" });
    }
  });

  // Bulk import spells (admin only)
  app.post("/api/admin/spells/bulk-import", requireAdminJWT, async (req, res) => {
    try {
      const { spells } = req.body;
      
      if (!Array.isArray(spells) || spells.length === 0) {
        return res.status(400).json({ message: "Spells array is required" });
      }

      let imported = 0;
      let skipped = 0;

      for (const spellData of spells) {
        try {
          // Validate spell data
          const validatedData = spellSchema.parse(spellData);
          
          // Check if spell already exists
          const existingSpell = await storage.getSpellByName(validatedData.name);
          if (existingSpell) {
            skipped++;
            continue;
          }

          // Create the spell
          await storage.createSpell(validatedData);
          imported++;
        } catch (error) {
          console.error(`Error importing spell ${spellData.name}:`, error);
          skipped++;
        }
      }

      res.json({ 
        message: `Import completed: ${imported} spells imported, ${skipped} skipped`,
        imported,
        skipped
      });
    } catch (error) {
      console.error("Error bulk importing spells:", error);
      res.status(500).json({ message: "Failed to bulk import spells" });
    }
  });

  // Get character's wand
  app.get("/api/characters/:id/wand", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const wand = await storage.getCharacterWand(characterId);
      res.json(wand || null);
    } catch (error) {
      console.error("Error fetching character's wand:", error);
      res.status(500).json({ message: "Failed to fetch character's wand" });
    }
  });

  // Get wand components for selection
  app.get("/api/wand-components", requireAuth, async (req, res) => {
    try {
      const components = await storage.getAllWandComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching wand components:", error);
      res.status(500).json({ message: "Failed to fetch wand components" });
    }
  });

  // Update wand components (admin only)
  app.put("/api/admin/wand-components", requireAdminJWT, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { woods, cores, lengths, flexibilities } = req.body;
      
      if (!woods || !cores || !lengths || !flexibilities) {
        return res.status(400).json({ message: "All component arrays are required" });
      }

      await storage.updateWandComponents({ woods, cores, lengths, flexibilities });
      res.json({ message: "Wand components updated successfully" });
    } catch (error) {
      console.error("Error updating wand components:", error);
      res.status(500).json({ message: "Failed to update wand components" });
    }
  });

  // Migrate existing wands to inventory (admin only)
  app.post("/api/admin/migrate-wands-to-inventory", requireAdminJWT, async (req, res) => {
    try {
      if (req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const migratedCount = await storage.migrateExistingWandsToInventory();
      res.json({ 
        message: `Successfully migrated ${migratedCount} wands to inventory`,
        migratedCount 
      });
    } catch (error) {
      console.error("Error migrating wands to inventory:", error);
      res.status(500).json({ message: "Failed to migrate wands to inventory" });
    }
  });

  // Visit Ollivanders to get a wand (random)
  app.post("/api/characters/:id/visit-ollivanders", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if character already has a wand
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ message: "Character already has a wand" });
      }

      // Generate a random wand for the character
      const wand = await storage.generateRandomWand(characterId);
      
      // Add wand to character's inventory
      await storage.addInventoryItem({
        characterId,
        itemName: `Hůlka (${wand.wood})`,
        itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
        quantity: 1,
        category: "Wand",
        rarity: "Epic",
        value: 7, // 7 galleons for a wand
        isEquipped: true,
        notes: "Hlavní hůlka postavy pro sesílání kouzel"
      });
      
      res.json(wand);
    } catch (error) {
      console.error("Error visiting Ollivanders:", error);
      res.status(500).json({ message: "Failed to visit Ollivanders" });
    }
  });

  // Create custom wand (manual selection)
  app.post("/api/characters/:id/create-custom-wand", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { wood, core, length, flexibility, description } = req.body;
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if character already has a wand
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ message: "Character already has a wand" });
      }

      // Validate inputs
      if (!wood || !core || !length || !flexibility) {
        return res.status(400).json({ message: "All wand components are required" });
      }

      // Create custom wand
      const wandData = {
        characterId,
        wood,
        core,
        length,
        flexibility,
        description: description || `Hůlka z ${wood.toLowerCase()}, ${length} dlouhá, ${flexibility.toLowerCase()}, s jádrem ${core.toLowerCase()}. Pečlivě vybrána podle přání svého majitele.`
      };

      const wand = await storage.createWand(wandData);
      
      // Add wand to character's inventory
      await storage.addInventoryItem({
        characterId,
        itemName: `Hůlka (${wand.wood})`,
        itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
        quantity: 1,
        category: "Wand",
        rarity: "Epic",
        value: 7, // 7 galleons for a wand
        isEquipped: true,
        notes: "Vlastní hůlka vybraná u Ollivandera"
      });
      
      res.json(wand);
    } catch (error) {
      console.error("Error creating custom wand:", error);
      res.status(500).json({ message: "Failed to create custom wand" });
    }
  });

  // Cast spell in chat
  app.post("/api/game/cast-spell", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId, spellId, message } = req.body;
      
      if (!roomId || !characterId || !spellId) {
        return res.status(400).json({ message: "roomId, characterId and spellId are required" });
      }

      // Check if character has a wand
      const wand = await storage.getCharacterWand(parseInt(characterId));
      if (!wand) {
        return res.status(400).json({ message: "Vaše postava potřebuje hůlku pro sesílání kouzel. Navštivte nejprve Ollivandera!" });
      }

      // Check if character has the spell
      const characterSpells = await storage.getCharacterSpells(parseInt(characterId));
      const hasSpell = characterSpells.some(cs => cs.spell.id === parseInt(spellId));
      
      if (!hasSpell) {
        return res.status(403).json({ message: "Character doesn't know this spell" });
      }

      // Get spell details
      const spell = await storage.getSpell(parseInt(spellId));
      if (!spell) {
        return res.status(404).json({ message: "Spell not found" });
      }

      // Roll for success (1d10)
      const successRoll = Math.floor(Math.random() * 10) + 1;
      const isSuccess = successRoll >= 5; // 60% success rate
      
      // Combine user message with spell casting result
      const spellResult = `[Seslal kouzlo ${spell.name} (${successRoll}/10) - ${isSuccess ? 'Úspěch' : 'Neúspěch'}] ${spell.effect}`;
      const combinedContent = message ? 
        `${message.trim()}\n${spellResult}` :
        spellResult;
      
      // Create spell cast message
      const spellMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: combinedContent,
        messageType: 'spell_cast',
      });

      res.json({ 
        spell: spell,
        successRoll: successRoll,
        isSuccess: isSuccess,
        message: spellMessage,
        success: true 
      });
    } catch (error) {
      console.error("Error casting spell:", error);
      res.status(500).json({ message: "Failed to cast spell" });
    }
  });

  // Character Inventory API endpoints
  app.get("/api/characters/:characterId/inventory", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const inventory = await storage.getCharacterInventory(characterId);
      res.json(inventory);
    } catch (error) {
      console.error("Error getting inventory:", error);
      res.status(500).json({ message: "Failed to get inventory" });
    }
  });

  app.post("/api/characters/:characterId/inventory", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const item = await storage.addInventoryItem({
        characterId,
        ...req.body
      });
      res.json(item);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(500).json({ message: "Failed to add inventory item" });
    }
  });

  app.patch("/api/inventory/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      // Verify item belongs to user's character or user is admin
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const character = await storage.getCharacter(item.characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      // Verify item belongs to user's character or user is admin
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const character = await storage.getCharacter(item.characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteInventoryItem(itemId);
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Character Journal API endpoints
  app.get("/api/characters/:characterId/journal", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const journal = await storage.getCharacterJournal(characterId);
      res.json(journal);
    } catch (error) {
      console.error("Error getting journal:", error);
      res.status(500).json({ message: "Failed to get journal" });
    }
  });

  app.post("/api/characters/:characterId/journal", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify character belongs to user or user is admin
      const character = await storage.getCharacter(characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const entry = await storage.addJournalEntry({
        characterId,
        ...req.body
      });
      res.json(entry);
    } catch (error) {
      console.error("Error adding journal entry:", error);
      res.status(500).json({ message: "Failed to add journal entry" });
    }
  });

  app.patch("/api/journal/:entryId", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      
      // Verify entry belongs to user's character or user is admin
      const entry = await storage.getJournalEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      const character = await storage.getCharacter(entry.characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedEntry = await storage.updateJournalEntry(entryId, req.body);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal/:entryId", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      
      // Verify entry belongs to user's character or user is admin
      const entry = await storage.getJournalEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      const character = await storage.getCharacter(entry.characterId);
      if (!character || (character.userId !== req.session.userId! && req.session.userRole !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteJournalEntry(entryId);
      if (!success) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      res.json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Influence Bar endpoints
  app.get("/api/influence-bar", requireAuthFlexible, (req, res, next) => {
    console.log("HIT /api/influence-bar", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
  }, async (req, res) => {
    try {
      const influenceData = await storage.getInfluenceBar();
      res.json(influenceData);
    } catch (error) {
      console.error("Error fetching influence bar:", error);
      res.status(500).json({ message: "Failed to fetch influence bar" });
    }
  });

  app.get("/api/influence-history", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/influence-history", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const history = await storage.getInfluenceHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching influence history:", error);
      res.status(500).json({ message: "Failed to fetch influence history" });
    }
  });

  app.post("/api/admin/influence-bar/adjust", requireAdminJWT, async (req, res) => {
    try {
      const { side, points } = req.body;
      
      if (!side || typeof points !== 'number') {
        return res.status(400).json({ message: "Side and points are required" });
      }
      
      await storage.adjustInfluence(side, points, req.user.id);
      res.json({ message: "Influence adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting influence:", error);
      res.status(500).json({ message: "Failed to adjust influence" });
    }
  });

  app.post("/api/admin/influence-bar/set", requireAdminJWT, async (req, res) => {
    try {
      const { grindelwaldPoints, dumbledorePoints } = req.body;
      
      if (typeof grindelwaldPoints !== 'number' || typeof dumbledorePoints !== 'number') {
        return res.status(400).json({ message: "Both point values are required" });
      }
      
      await storage.setInfluence(grindelwaldPoints, dumbledorePoints, req.user.id);
      res.json({ message: "Influence set successfully" });
    } catch (error) {
      console.error("Error setting influence:", error);
      res.status(500).json({ message: "Failed to set influence" });
    }
  });

  app.post("/api/admin/influence-bar/adjust-with-history", requireAdminJWT, async (req, res) => {
    try {
      const { changeType, points, reason } = req.body;
      
      if (!changeType || typeof points !== 'number' || !reason) {
        return res.status(400).json({ message: "Change type, points and reason are required" });
      }
      
      const currentData = await storage.getInfluenceBar();
      const previousTotal = changeType === 'grindelwald' ? currentData.grindelwaldPoints : currentData.dumbledorePoints;
      
      // Calculate new total with proper bounds (0 minimum)
      const newTotal = Math.max(0, previousTotal + points);
      
      // Update the influence bar with the calculated new total
      const newGrindelwaldPoints = changeType === 'grindelwald' ? newTotal : currentData.grindelwaldPoints;
      const newDumbledorePoints = changeType === 'dumbledore' ? newTotal : currentData.dumbledorePoints;
      
      await storage.setInfluence(newGrindelwaldPoints, newDumbledorePoints, req.user.id);
      
      // Record the change in history using parameterized query
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "influence_change",
        details: `Changed influence for ${changeType} by ${points} points. Reason: ${reason}`
      });
      
      res.json({ message: "Influence adjusted with history successfully" });
    } catch (error) {
      console.error("Error adjusting influence with history:", error);
      res.status(500).json({ message: "Failed to adjust influence with history" });
    }
  });

  app.post("/api/admin/influence-bar/reset", requireAdminJWT, async (req, res) => {
    try {
      const { type } = req.body;
      
      if (!type || (type !== '0:0' && type !== '50:50')) {
        return res.status(400).json({ message: "Reset type must be '0:0' or '50:50'" });
      }
      
      const currentData = await storage.getInfluenceBar();
      const resetValues = type === '0:0' ? { grindelwald: 0, dumbledore: 0 } : { grindelwald: 50, dumbledore: 50 };
      
      // Set the new values
      await storage.setInfluence(resetValues.grindelwald, resetValues.dumbledore, req.user.id);
      
      // Record both changes in history
      const grindelwaldChange = resetValues.grindelwald - currentData.grindelwaldPoints;
      const dumbledoreChange = resetValues.dumbledore - currentData.dumbledorePoints;
      
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'influence_reset',
        details: `Influence reset to ${type}. Grindelwald changed by ${grindelwaldChange}, Dumbledore changed by ${dumbledoreChange}`
      });
      
      res.json({ message: "Influence reset successfully" });
    } catch (error) {
      console.error("Error resetting influence:", error);
      res.status(500).json({ message: "Failed to reset influence" });
    }
  });






  // Housing request endpoints
  app.post("/api/housing-requests", requireAuth, async (req, res) => {
    try {
      const requestData = insertHousingRequestSchema.parse(req.body);
      
      // Implementace automatického schvalování pro ubytovny
      if (requestData.requestType === 'dormitory') {
        // Automaticky schválit ubytovnu s předem stanovenou adresou
        const autoApprovedRequest = await storage.createHousingRequest({
          ...requestData,
          userId: req.session.userId!
        });
        
        // Okamžitě schválit a přidělit adresu
        const approvedRequest = await storage.approveHousingRequest(
          autoApprovedRequest.id,
          req.session.userId!, // Automatické schválení systémem
          "Londýn - Ubytovna U starého Šeptáka",
          "Automaticky schváleno - ubytovna"
        );
        
        // Vytvořit systémovou postavu "Správa ubytování" pokud neexistuje
        let housingAdminCharacter = await storage.getCharacterByName("Správa", "ubytování");
        
        if (!housingAdminCharacter) {
          // Vytvořit systémovou postavu
          housingAdminCharacter = await storage.createCharacter({
            userId: req.session.userId!, // Dočasně přiřadit k current user
            firstName: "Správa",
            lastName: "ubytování",
            birthDate: "1900-01-01",
            description: "Systémová postava pro správu ubytování",
            school: "",
            residence: "Londýn - Ministerstvo kouzel"
          });
        }
        
        // Zaslat automatickou zprávu do soví pošty
        await storage.sendOwlPostMessage({
          senderCharacterId: housingAdminCharacter!.id,
          recipientCharacterId: requestData.characterId,
          subject: "Přidělení pokoje na ubytovně",
          content: `Vážená čarodějko/Vážený čaroději,

s potěšením Vám oznamujeme, že Vaše žádost o pokoj na ubytovně byla schválena.

PODROBNOSTI UBYTOVÁNÍ:
📍 Adresa: ${approvedRequest.assignedAddress}
🏠 Typ: Pokoj na ubytovně
📅 Datum přidělení: ${getCurrentGameDate()}

Váš pokoj je nyní připraven k nastěhování. Klíče si můžete vyzvednout u správce ubytovny.

DŮLEŽITÉ INFORMACE:
• Pokoj je určen pro jednu osobu
• Dodržujte prosím domácí řád ubytovny
• V případě jakýchkoliv problémů se obraťte na správu ubytování

Přejeme Vám příjemné bydlení!

S pozdravem,
Správa ubytování`
        });
        
        res.json(approvedRequest);
      } else {
        // Normální proces pro ostatní typy bydlení
        const request = await storage.createHousingRequest({
          ...requestData,
          userId: req.session.userId!
        });
        res.json(request);
      }
    } catch (error) {
      console.error("Error creating housing request:", error);
      res.status(500).json({ message: "Failed to create housing request" });
    }
  });

  app.get("/api/housing-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getHousingRequestsByUserId(req.session.userId!);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching housing requests:", error);
      res.status(500).json({ message: "Failed to fetch housing requests" });
    }
  });

  app.delete("/api/housing-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getHousingRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Only pending requests can be withdrawn" });
      }
      
      const success = await storage.deleteHousingRequest(requestId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete request" });
      }
      
      res.json({ message: "Housing request withdrawn successfully" });
    } catch (error) {
      console.error("Error deleting housing request:", error);
      res.status(500).json({ message: "Failed to delete housing request" });
    }
  });

  app.get("/api/admin/housing-requests", requireAdminJWT, async (req, res) => {
    try {
      const requests = await storage.getPendingHousingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending housing requests:", error);
      res.status(500).json({ message: "Failed to fetch pending housing requests" });
    }
  });


  const characterRequestSchema = z.object({
    firstName: z.string(),
    middleName: z.string().optional(),
    lastName: z.string(),
    birthDate: z.string(),
    description: z.string(),
  });

  // Character request endpoints
  
  // Create character request
  app.post("/api/character-requests", requireAuth, async (req, res) => {
    try {
      const validatedData = characterRequestSchema.parse(req.body);
      const characterRequest = await storage.createCharacterRequest({
        ...validatedData,
        userId: req.session.userId!,
      });
      res.json(characterRequest);
    } catch (error) {
      console.error("Error creating character request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create character request" });
    }
  });

  // Get user's character requests
  app.get("/api/character-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getCharacterRequestsByUserId(req.session.userId!);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });

  // Delete user's pending character request
  app.delete("/api/character-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getCharacterRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Can only delete pending requests" });
      }
      
      await storage.deleteCharacterRequest(requestId);
      res.json({ message: "Request deleted successfully" });
    } catch (error) {
      console.error("Error deleting character request:", error);
      res.status(500).json({ message: "Failed to delete character request" });
    }
  });

  // Admin: Get pending character requests
  app.get("/api/admin/character-requests", requireAdminJWT, async (req, res) => {
    try {
      const requests = await storage.getPendingCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });

  // Admin: Approve character request
  app.post("/api/admin/character-requests/:id/approve", requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      
      const character = await storage.approveCharacterRequest(requestId, req.user.id, reviewNote);
      res.json({ message: "Character request approved", character });
    } catch (error) {
      console.error("Error approving character request:", error);
      res.status(500).json({ message: "Failed to approve character request" });
    }
  });

  // Admin: Reject character request
  app.post("/api/admin/character-requests/:id/reject", requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      
      if (!reviewNote || reviewNote.trim().length < 10) {
        return res.status(400).json({ message: "Review note is required and must be at least 10 characters long" });
      }
      
      const request = await storage.rejectCharacterRequest(requestId, req.user.id, reviewNote);
      res.json({ message: "Character request rejected", request });
    } catch (error) {
      console.error("Error rejecting character request:", error);
      res.status(500).json({ message: "Failed to reject character request" });
    }
  });  // Multi-character operations
  

  // Change character for a message (within 5 minutes)
  app.patch("/api/chat/messages/:id/character", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { characterId } = req.body;
      
      if (!characterId) {
        return res.status(400).json({ message: "Character ID is required" });
      }
      
      // Get the message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if message is within 5 minutes
      const messageTime = new Date(message.createdAt);
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
      
      if (timeDiffMinutes > 5) {
        return res.status(403).json({ message: "Message can only be reassigned within 5 minutes of posting" });
      }
      
      // Verify the original character belongs to the user
      if (!message.characterId) {
        return res.status(400).json({ message: "Message has no character assigned" });
      }
      
      const originalCharacter = await storage.getCharacter(message.characterId);
      if (!originalCharacter || originalCharacter.userId !== req.session.userId!) {
        return res.status(403).json({ message: "You can only reassign your own messages" });
      }
      
      // Verify the new character belongs to the user
      const newCharacter = await storage.getCharacter(characterId);
      if (!newCharacter || newCharacter.userId !== req.session.userId!) {
        return res.status(403).json({ message: "You can only reassign to your own characters" });
      }
      
      // Update the message
      await storage.updateMessageCharacter(messageId, characterId);
      
      res.json({ message: "Message character updated successfully" });
    } catch (error) {
      console.error("Error updating message character:", error);
      res.status(500).json({ message: "Failed to update message character" });
    }
  });

  // Admin activity log
  app.get("/api/admin/activity-log", requireAdminJWT, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const activityLog = await storage.getAdminActivityLog(limit, offset);
      res.json(activityLog);
    } catch (error) {
      console.error("Error fetching admin activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // Cemetery routes
  app.post("/api/admin/characters/:id/kill", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { deathReason } = req.body;
      const adminId = req.user.id;
      
      if (!deathReason || deathReason.trim().length === 0) {
        return res.status(400).json({ message: "Death reason is required" });
      }
      
      const killedCharacter = await storage.killCharacter(characterId, deathReason.trim(), adminId);
      
      if (!killedCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Log admin activity
      await storage.logAdminActivity({
        adminId,
        action: 'character_death',
        targetUserId: killedCharacter.userId,
        details: `Postava ${killedCharacter.firstName} ${killedCharacter.lastName} byla označena jako mrtvá. Důvod: ${deathReason.trim()}`
      });
      
      res.json({ message: "Character killed successfully", character: killedCharacter });
    } catch (error) {
      console.error("Error killing character:", error);
      res.status(500).json({ message: "Failed to kill character" });
    }
  });

  app.get("/api/cemetery", async (req, res) => {
    try {
      const deadCharacters = await storage.getDeadCharacters();
      res.json(deadCharacters);
    } catch (error) {
      console.error("Error fetching dead characters:", error);
      res.status(500).json({ message: "Failed to fetch cemetery data" });
    }
  });

  // Revive character (admin only)
  app.post("/api/characters/:id/revive", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const adminId = req.user.id;
      
      const revivedCharacter = await storage.reviveCharacter(characterId);
      
      if (!revivedCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Log admin activity
      await storage.logAdminActivity({
        adminId,
        action: 'character_revive',
        targetUserId: revivedCharacter.userId,
        details: `Postava ${revivedCharacter.firstName} ${revivedCharacter.lastName} byla oživena`
      });
      
      res.json({ message: "Character revived successfully", character: revivedCharacter });
    } catch (error) {
      console.error("Error reviving character:", error);
      res.status(500).json({ message: "Failed to revive character" });
    }
  });

  // Admin: Ban user
  app.post("/api/admin/users/:id/ban", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banReason } = req.body;
      const adminId = req.user.id;
      
      if (!banReason || banReason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
      }
      
      if (typeof userId !== 'number' || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role === 'admin') {
        return res.status(400).json({ message: "Cannot ban admin users" });
      }
      
      // Update user status to banned
      await storage.banUser(userId, banReason.trim());
      
      // Log admin activity
      await storage.logAdminActivity({
        adminId,
        action: 'user_ban',
        targetUserId: userId,
        details: `Uživatel ${user.username} byl zabanován. Důvod: ${banReason.trim()}`
      });
      
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Admin: Reset user password
  app.post("/api/admin/users/:id/reset-password", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = req.user.id;
      
      if (typeof userId !== 'number' || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Update password using Supabase Auth API
      const { data, error } = await supabase.auth.admin.updateUserById(userId.toString(), {
        password: tempPassword,
        email_confirm: true
      });

      if (error) {
        console.error('Error resetting password with Supabase Auth:', error);
        return res.status(500).json({ message: 'Failed to reset password' });
      }

      // Log admin activity
      await storage.logAdminActivity({
        adminId,
        action: 'password_reset',
        targetUserId: userId,
        details: `Heslo pro uživatele ${user.username} bylo resetováno`
      });
      
      res.json({ 
        message: "Password reset successfully", 
        newPassword: tempPassword 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Admin: Update user narrator permissions
  app.patch("/api/admin/users/:id/narrator", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { canNarrate, reason } = req.body;
      const adminId = req.user.id;
      
      if (typeof userId !== 'number' || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update narrator permissions
      await storage.updateUserNarratorPermissions(userId, canNarrate);
      
      // Log admin activity
      await storage.logAdminActivity({
        adminId,
        action: 'narrator_permission_change',
        targetUserId: userId,
        details: `Vypravěčská oprávnění pro uživatele ${user.username} ${canNarrate ? 'udělena' : 'odebrána'}${reason ? `. Důvod: ${reason}` : ''}`
      });
      
      res.json({ message: "Narrator permissions updated successfully" });
    } catch (error) {
      console.error("Error updating narrator permissions:", error);
      res.status(500).json({ message: "Failed to update narrator permissions" });
    }
  });

  // Admin chat management endpoints
  app.get('/api/admin/chat-categories', requireAdminJWT, async (req, res) => {
    try {
      // Return flat list of all categories for admin management
      const categories = await storage.getAllChatCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching chat categories:', error);
      res.status(500).json({ message: 'Failed to fetch chat categories' });
    }
  });

  app.post('/api/admin/chat-categories', requireAdminJWT, async (req, res) => {
    try {
      const categoryData = insertChatCategorySchema.parse(req.body);
      const category = await storage.createChatCategory(categoryData);
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_category_create',
        details: `Vytvořena kategorie "${category.name}"`,
      });
      res.json(category);
    } catch (error) {
      console.error('Error creating chat category:', error);
      res.status(500).json({ message: 'Failed to create chat category' });
    }
  });

  app.put('/api/admin/chat-categories/:id', requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatCategorySchema.partial().parse(req.body);
      const category = await storage.updateChatCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: 'Chat category not found' });
      }
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_category_update',
        details: `Upravena kategorie "${category.name}"`,
      });
      res.json(category);
    } catch (error) {
      console.error('Error updating chat category:', error);
      res.status(500).json({ message: 'Failed to update chat category' });
    }
  });

  app.delete('/api/admin/chat-categories/:id', requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getChatCategory(id);
      if (!category) {
        return res.status(404).json({ message: 'Chat category not found' });
      }
      
      const success = await storage.deleteChatCategory(id);
      if (!success) {
        return res.status(400).json({ message: 'Cannot delete category with child categories or rooms' });
      }
      
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_category_delete',
        details: `Smazána kategorie "${category.name}"`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chat category:', error);
      res.status(500).json({ message: 'Failed to delete chat category' });
    }
  });

  app.post('/api/admin/chat-rooms', requireAdminJWT, async (req, res) => {
    try {
      const roomData = insertChatRoomSchema.parse(req.body);
      // Hash password if provided
      if (roomData.password) {
        roomData.password = await storage.hashPassword(roomData.password);
      }
      const room = await storage.createChatRoom(roomData);
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_room_create',
        details: `Vytvořena místnost "${room.name}"`,
      });
      res.json(room);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ message: 'Failed to create chat room' });
    }
  });

  app.put('/api/admin/chat-rooms/:id', requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatRoomSchema.partial().parse(req.body);
      const room = await storage.updateChatRoom(id, updates);
      if (!room) {
        return res.status(404).json({ message: 'Chat room not found' });
      }
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_room_update',
        details: `Upravena místnost "${room.name}"`,
      });
      res.json(room);
    } catch (error) {
      console.error('Error updating chat room:', error);
      res.status(500).json({ message: 'Failed to update chat room' });
    }
  });

  app.delete('/api/admin/chat-rooms/:id', requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getChatRoom(id);
      if (!room) {
        return res.status(404).json({ message: 'Chat room not found' });
      }
      
      const success = await storage.deleteChatRoom(id);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete chat room' });
      }
      
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: 'chat_room_delete',
        details: `Smazána místnost "${room.name}"`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chat room:', error);
      res.status(500).json({ message: 'Failed to delete chat room' });
    }
  });

  // Owl Post API endpoints
  
  // Legacy endpoints without character ID - get first alive character
  app.get("/api/owl-post/inbox", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId!);
      const firstAliveCharacter = userCharacters.find(char => !char.deathDate);
      
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      
      const messages = await storage.getOwlPostInbox(firstAliveCharacter.id, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get("/api/owl-post/sent", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId!);
      const firstAliveCharacter = userCharacters.find(char => !char.deathDate);
      
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      
      const messages = await storage.getOwlPostSent(firstAliveCharacter.id, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get("/api/owl-post/unread-count", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId!);
      const firstAliveCharacter = userCharacters.find(char => !char.deathDate);
      
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      
      const count = await storage.getUnreadOwlPostCount(firstAliveCharacter.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Failed to fetch unread count' });
    }
  });

  app.post("/api/owl-post/send", requireAuth, async (req, res) => {
    try {
      const messageData = insertOwlPostMessageSchema.parse(req.body);
      
      // Verify the sender character belongs to the authenticated user
      const senderCharacter = await storage.getCharacter(messageData.senderCharacterId);
      if (!senderCharacter || senderCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to send from this character" });
      }
      
      // Verify recipient character exists and is active
      const recipientCharacter = await storage.getCharacter(messageData.recipientCharacterId);
      if (!recipientCharacter || !recipientCharacter.isActive) {
        return res.status(400).json({ message: "Recipient character not found or inactive" });
      }
      
      const message = await storage.sendOwlPostMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error('Error sending owl post message:', error);
      res.status(400).json({ message: 'Failed to send message' });
    }
  });

  app.get("/api/owl-post/inbox/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify the character belongs to the authenticated user
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to access this character's messages" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      
      const messages = await storage.getOwlPostInbox(characterId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching inbox:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get("/api/owl-post/sent/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify the character belongs to the authenticated user
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to access this character's messages" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      
      const messages = await storage.getOwlPostSent(characterId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post("/api/owl-post/mark-read/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      
      // Get the message to verify ownership
      const message = await storage.getOwlPostMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Get recipient character to verify user ownership
      const recipientCharacter = await storage.getCharacter(message.recipientCharacterId);
      
      // User can mark message as read if they own the recipient character
      if (!recipientCharacter || recipientCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to mark this message as read" });
      }
      
      await storage.markOwlPostAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  });

  app.get("/api/owl-post/unread-count/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      
      // Verify the character belongs to the authenticated user
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const count = await storage.getUnreadOwlPostCount(characterId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Failed to fetch unread count' });
    }
  });

  app.delete("/api/owl-post/message/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      
      // Get the message to verify ownership
      const message = await storage.getOwlPostMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Get sender and recipient characters to verify user ownership
      const senderCharacter = await storage.getCharacter(message.senderCharacterId);
      const recipientCharacter = await storage.getCharacter(message.recipientCharacterId);
      
      // User can delete message if they own either sender or recipient character
      const canDelete = (senderCharacter && senderCharacter.userId === req.session.userId) ||
                       (recipientCharacter && recipientCharacter.userId === req.session.userId);
      
      if (!canDelete) {
        return res.status(403).json({ message: "Unauthorized to delete this message" });
      }
      
      const deleted = await storage.deleteOwlPostMessage(messageId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete message" });
      }
      
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error('Error deleting owl post message:', error);
      res.status(500).json({ message: 'Failed to delete message' });
    }
  });

  app.get("/api/owl-post/characters", requireAuth, async (req, res) => {
    try {
      const characters = await storage.getAllCharactersForOwlPost();
      // Filter out sensitive info and return only what's needed for the dropdown
      const characterList = characters.map(char => ({
        id: char.id,
        firstName: char.firstName,
        middleName: char.middleName,
        lastName: char.lastName,
        fullName: `${char.firstName} ${char.middleName ? char.middleName + ' ' : ''}${char.lastName}`
      }));
      
      res.json(characterList.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (error) {
      console.error('Error fetching characters for owl post:', error);
      res.status(500).json({ message: 'Failed to fetch characters' });
    }
  });

  // Get total unread owl post count for all user characters
  app.get("/api/owl-post/unread-total", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/owl-post/unread-total", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const userCharacters = await storage.getCharactersByUserId((req.session && req.session.userId) || (req.user && req.user.id));
      const aliveCharacters = userCharacters.filter(char => !char.deathDate);
      
      let totalUnread = 0;
      for (const character of aliveCharacters) {
        const count = await storage.getUnreadOwlPostCount(character.id);
        totalUnread += count;
      }
      
      res.json({ count: totalUnread });
    } catch (error) {
      console.error('Error fetching total unread count:', error);
      res.status(500).json({ message: 'Failed to fetch total unread count' });
    }
  });

  // Admin housing request endpoints
  app.post("/api/admin/housing-requests/:requestId/approve", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { assignedAddress, reviewNote } = req.body;
      
      if (!assignedAddress) {
        return res.status(400).json({ message: "Assigned address is required" });
      }
      
      const approvedRequest = await storage.approveHousingRequest(
        requestId,
        req.user.id,
        assignedAddress,
        reviewNote
      );
      
      res.json(approvedRequest);
    } catch (error) {
      console.error("Error approving housing request:", error);
      res.status(500).json({ message: "Failed to approve housing request" });
    }
  });

  app.post("/api/admin/housing-requests/:requestId/reject", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for rejection" });
      }
      
      const rejectedRequest = await storage.rejectHousingRequest(
        requestId,
        req.user.id,
        reviewNote
      );
      
      res.json(rejectedRequest);
    } catch (error) {
      console.error("Error rejecting housing request:", error);
      res.status(500).json({ message: "Failed to reject housing request" });
    }
  });

  app.post("/api/admin/housing-requests/:requestId/return", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for returning request" });
      }
      
      // Return request uses rejection but with different message
      const request = await storage.rejectHousingRequest(
        requestId,
        req.user.id,
        reviewNote
      );
      
      res.json(request);
    } catch (error) {
      console.error("Error returning housing request:", error);
      res.status(500).json({ message: "Failed to return housing request" });
    }
  });

  // Update category sort order
  app.put('/api/admin/chat-categories/:id/sort-order', requireAdminJWT, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { sortOrder } = req.body;
      
      if (typeof sortOrder !== 'number') {
        return res.status(400).json({ message: 'Sort order must be a number' });
      }
      
      const category = await storage.updateChatCategorySortOrder(categoryId, sortOrder);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error updating category sort order:', error);
      res.status(500).json({ message: 'Failed to update category sort order' });
    }
  });

  app.put('/api/admin/chat-rooms/:id/sort-order', requireAdminJWT, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { sortOrder } = req.body;
      
      if (typeof sortOrder !== 'number') {
        return res.status(400).json({ message: 'Sort order must be a number' });
      }
      
      const room = await storage.updateChatRoomSortOrder(roomId, sortOrder);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error updating room sort order:', error);
      res.status(500).json({ message: 'Failed to update room sort order' });
    }
  });

  // TESTOVACÍ ENDPOINT PRO OVĚŘENÍ PŘIPOJENÍ K DATABÁZI
  app.get('/api/test-db', async (req, res) => {
    try {
      const { data, error, status, statusText } = await supabase.from('users').select('*');
      res.json({
        ok: !error,
        error,
        status,
        statusText,
        usersCount: data ? data.length : 0,
        data,
        env: {
          SUPABASE_URL: process.env.SUPABASE_URL || 'hardcoded',
          SUPABASE_KEY: process.env.SUPABASE_KEY ? 'set' : 'not set',
          NODE_ENV: process.env.NODE_ENV || 'undefined',
        }
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Přidávám testovací endpoint
  app.get('/api/debug', (req, res) => {
    res.json({ ok: true, user: req.user || null, session: req.session || null });
  });

  return httpServer;
}