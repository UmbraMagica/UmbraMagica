import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema, insertCharacterSchema, insertMessageSchema, chatRooms } from "@shared/schema";
import { db } from "./db";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Simple rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 30, windowMs: number = 60000) => {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting middleware
  app.use('/api/*', (req, res, next) => {
    const identifier = req.ip || 'unknown';
    if (!checkRateLimit(identifier)) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
    next();
  });
  
  // Debug middleware for chat endpoints
  app.use('/api/chat/*', (req, res, next) => {
    console.log(`${req.method} ${req.path} - Query:`, req.query);
    next();
  });
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Generate secure session secret if not provided
  const sessionSecret = process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');
  
  app.use(session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: 'strict', // CSRF protection
      maxAge: sessionTtl,
    },
  }));

  // Middleware to check authentication
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

  // Auth routes
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
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
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      const characters = await storage.getCharactersByUserId(user.id);
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
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

  // User routes
  app.get("/api/users", requireAdmin, async (req, res) => {
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

  app.patch("/api/users/:id/role", requireAdmin, async (req, res) => {
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
      
      // Validate input data using schema
      const validatedData = insertCharacterSchema.parse(req.body);
      
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

  app.get("/api/characters/online", requireAuth, async (req, res) => {
    try {
      // Return all active characters from all users (representing online players)
      const users = await storage.getAllUsers();
      const onlineCharacters = [];
      
      for (const user of users) {
        const characters = await storage.getCharactersByUserId(user.id);
        for (const character of characters) {
          if (character.isActive) {
            onlineCharacters.push({
              id: character.id,
              fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`,
              firstName: character.firstName,
              lastName: character.lastName,
              location: "Hlavní chat",
            });
          }
        }
      }
      
      console.log("Returning all online characters:", onlineCharacters);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(onlineCharacters);
    } catch (error) {
      console.error("Error fetching online characters:", error);
      res.status(500).json({ message: "Failed to fetch online characters" });
    }
  });

  // Admin routes
  app.post("/api/admin/invite-codes", requireAdmin, async (req, res) => {
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
          email: "admin@rpg-realm.cz",
          password: hashedPassword,
          role: "admin",
        });

        await storage.createCharacter({
          userId: adminUser.id,
          firstName: "Správce",
          lastName: "Systému",
          birthDate: "1990-01-01",
        });
      }

      // Create test regular user
      const userExists = await storage.getUserByUsername("TesterUživatel");
      if (!userExists) {
        const hashedPassword = await storage.hashPassword("user123");
        const regularUser = await storage.createUser({
          username: "TesterUživatel",
          email: "user@rpg-realm.cz",
          password: hashedPassword,
          role: "user",
        });

        await storage.createCharacter({
          userId: regularUser.id,
          firstName: "Jan",
          lastName: "Novák",
          birthDate: "1995-05-15",
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
        { name: "Hlavní chat", description: "Hlavní herní místnost pro všechny hráče", sortOrder: 0 },
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
  app.get("/api/chat/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getChatCategoriesWithChildren();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });

  // Chat routes
  app.get("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getAllChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.get("/api/chat/rooms/:roomId/messages", requireAuth, async (req, res) => {
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

  app.get("/api/chat/messages", requireAuth, async (req, res) => {
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

  app.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      console.log("POST /api/chat/messages - Request body:", req.body);
      const { roomId, characterId, content, messageType } = req.body;
      
      if (!roomId || !characterId || !content) {
        console.log("Missing required fields:", { roomId, characterId, content });
        return res.status(400).json({ message: "roomId, characterId, and content are required" });
      }
      
      if (content.length < 1 || content.length > 5000) {
        console.log("Invalid content length:", content.length);
        return res.status(400).json({ message: "Message content must be 1-5000 characters" });
      }
      
      const messageData = {
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
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

  app.post("/api/chat/rooms/:roomId/archive", requireAuth, async (req, res) => {
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

  app.get("/api/chat/rooms/:roomId/export", requireAuth, async (req, res) => {
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

  // Admin endpoint to update room descriptions
  app.patch("/api/admin/chat/rooms/:roomId", requireAuth, async (req, res) => {
    try {
      const user = req.session.userId ? await storage.getUser(req.session.userId) : null;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roomId = parseInt(req.params.roomId);
      const { longDescription } = req.body;

      if (!roomId) {
        return res.status(400).json({ message: "Room ID is required" });
      }

      const updatedRoom = await storage.updateChatRoom(roomId, { longDescription });
      
      if (!updatedRoom) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(updatedRoom);
    } catch (error) {
      console.error("Error updating room description:", error);
      res.status(500).json({ message: "Failed to update room description" });
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

  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections with user info
  const activeConnections = new Map<WebSocket, { userId: number; characterId?: number }>();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            // Verify session and character ownership
            if (!message.sessionId || !message.userId || !message.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing authentication data' }));
              return;
            }
            
            // In production, verify the session ID matches the user
            const user = await storage.getUser(message.userId);
            if (!user) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid user' }));
              return;
            }
            
            const userCharacter = await storage.getCharacter(message.characterId);
            if (!userCharacter || userCharacter.userId !== message.userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Character access denied' }));
              return;
            }
            
            activeConnections.set(ws, { 
              userId: message.userId, 
              characterId: message.characterId 
            });
            ws.send(JSON.stringify({ type: 'authenticated', success: true }));
            break;
            
          case 'chat_message':
            const connectionInfo = activeConnections.get(ws);
            if (!connectionInfo?.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            // Validate message content
            const validatedMessage = insertMessageSchema.parse({
              roomId: message.roomId,
              characterId: connectionInfo.characterId,
              content: message.content,
              messageType: message.messageType || 'message',
            });

            // Save message to database
            console.log("WebSocket saving message:", validatedMessage);
            const savedMessage = await storage.createMessage(validatedMessage);
            console.log("WebSocket message saved:", savedMessage);
            
            // Get character info for broadcast
            const messageCharacter = await storage.getCharacter(connectionInfo.characterId);
            if (!messageCharacter) return;

            // Broadcast to all connected clients
            const broadcastMessage = {
              type: 'new_message',
              message: {
                ...savedMessage,
                character: {
                  firstName: messageCharacter.firstName,
                  middleName: messageCharacter.middleName,
                  lastName: messageCharacter.lastName,
                }
              }
            };

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastMessage));
              }
            });
            break;
            
          case 'dice_roll':
            const diceConnectionInfo = activeConnections.get(ws);
            if (!diceConnectionInfo?.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            // Generate random dice roll (1-10)
            const diceResult = Math.floor(Math.random() * 10) + 1;
            
            // Get character info first for immediate broadcast
            const diceCharacter = await storage.getCharacter(diceConnectionInfo.characterId);
            if (!diceCharacter) return;

            // Create message object for immediate broadcast
            const tempDiceMessage = {
              id: Date.now(), // Temporary ID for immediate display
              roomId: message.roomId,
              characterId: diceConnectionInfo.characterId,
              content: `hodil kostkou: ${diceResult}`,
              messageType: 'dice_roll',
              createdAt: new Date().toISOString(),
              character: {
                firstName: diceCharacter.firstName,
                middleName: diceCharacter.middleName,
                lastName: diceCharacter.lastName,
              }
            };

            // Broadcast immediately for fast response
            const diceBroadcast = {
              type: 'new_message',
              message: tempDiceMessage
            };

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(diceBroadcast));
              }
            });

            // Save to database in background (don't wait)
            storage.createMessage({
              roomId: message.roomId,
              characterId: diceConnectionInfo.characterId,
              content: `hodil kostkou: ${diceResult}`,
              messageType: 'dice_roll',
            }).catch(error => console.error("Error saving dice roll:", error));
            break;
            
          case 'coin_flip':
            const coinConnectionInfo = activeConnections.get(ws);
            if (!coinConnectionInfo?.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            // Generate random coin flip (1 or 2)
            const coinResult = Math.floor(Math.random() * 2) + 1;
            const coinSide = coinResult === 1 ? "panna" : "orel";
            
            // Get character info first for immediate broadcast
            const coinCharacter = await storage.getCharacter(coinConnectionInfo.characterId);
            if (!coinCharacter) return;

            // Create message object for immediate broadcast
            const tempCoinMessage = {
              id: Date.now(), // Temporary ID for immediate display
              roomId: message.roomId,
              characterId: coinConnectionInfo.characterId,
              content: `hodil mincí: ${coinSide}`,
              messageType: 'coin_flip',
              createdAt: new Date().toISOString(),
              character: {
                firstName: coinCharacter.firstName,
                middleName: coinCharacter.middleName,
                lastName: coinCharacter.lastName,
              }
            };

            // Broadcast immediately for fast response
            const coinBroadcast = {
              type: 'new_message',
              message: tempCoinMessage
            };

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinBroadcast));
              }
            });

            // Save to database in background (don't wait)
            storage.createMessage({
              roomId: message.roomId,
              characterId: coinConnectionInfo.characterId,
              content: `hodil mincí: ${coinSide}`,
              messageType: 'coin_flip',
            }).catch(error => console.error("Error saving coin flip:", error));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      activeConnections.delete(ws);
      console.log('WebSocket connection closed');
    });
  });

  // Initialize default chat rooms if they don't exist
  (async () => {
    try {
      const mainRoom = await storage.getChatRoomByName("Hlavní chat");
      if (!mainRoom) {
        await storage.createChatRoom({
          name: "Hlavní chat",
          description: "Hlavní herní místnost pro všechny hráče",
          isPublic: true,
        });
        console.log("Created default chat room: Hlavní chat");
      }

      const testRoom = await storage.getChatRoomByName("Testovací chat");
      if (!testRoom) {
        await storage.createChatRoom({
          name: "Testovací chat",
          description: "Místnost pro testování a experimenty",
          isPublic: true,
        });
        console.log("Created test chat room: Testovací chat");
      }
    } catch (error) {
      console.error("Error initializing chat rooms:", error);
    }
  })();

  return httpServer;
}
