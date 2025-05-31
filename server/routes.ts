import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema, insertCharacterSchema, insertMessageSchema, characterEditSchema, characterAdminEditSchema, characterRequestSchema, chatRooms, spellSchema, insertSpellSchema, insertCharacterSpellSchema } from "@shared/schema";
import { db } from "./db";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import multer from "multer";
import sharp from "sharp";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
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
      req.session.userRole = user.role;
      
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
      
      // Use different validation based on user role
      let validatedData;
      if (requestingUser.role === "admin") {
        // Admin can update all fields
        validatedData = characterAdminEditSchema.parse(req.body);
      } else {
        // Regular users can only update school and description
        validatedData = characterEditSchema.parse(req.body);
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

  app.get("/api/characters/online", requireAuth, async (req, res) => {
    try {
      // Only return characters that are currently connected via WebSocket
      const onlineCharacters: any[] = [];
      
      // Get characters from active WebSocket connections
      const promises = Array.from(activeConnections.entries()).map(async ([ws, connInfo]) => {
        if (ws.readyState === WebSocket.OPEN && connInfo.characterId) {
          const character = await storage.getCharacter(connInfo.characterId);
          if (character && character.isActive) {
            // Get the room name for location
            let location = "Lobby";
            if (connInfo.roomId) {
              const room = await storage.getChatRoom(connInfo.roomId);
              location = room ? room.name : "Neznámá lokace";
            }
            
            return {
              id: character.id,
              fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`,
              firstName: character.firstName,
              lastName: character.lastName,
              location: location,
              avatar: character.avatar,
            };
          }
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      onlineCharacters.push(...results.filter(char => char !== null));
      
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

  // Update existing characters to use game year dates
  app.post("/api/admin/update-character-dates", requireAdmin, async (req, res) => {
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
          email: "admin@rpg-realm.cz",
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
          email: "user@rpg-realm.cz",
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

  // Admin endpoint to update room details
  app.patch("/api/admin/chat/rooms/:roomId", requireAuth, async (req, res) => {
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
  app.get("/api/chat/rooms/:roomId/presence", requireAuth, async (req, res) => {
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
  app.get("/api/characters/all", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allCharacters = [];

      for (const user of users) {
        const characters = await storage.getCharactersByUserId(user.id);
        for (const character of characters) {
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

  // Get user's main character (must be before :id route)
  app.get("/api/characters/main", requireAuth, async (req, res) => {
    try {
      const mainCharacter = await storage.getMainCharacter(req.session.userId!);
      res.json(mainCharacter || null);
    } catch (error) {
      console.error("Error fetching main character:", error);
      res.status(500).json({ message: "Failed to fetch main character" });
    }
  });

  // Get specific character with user info
  app.get("/api/characters/:id", requireAuth, async (req, res) => {
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

  // Spell management endpoints
  
  // Get all spells (for admin)
  app.get("/api/admin/spells", requireAuth, requireAdmin, async (req, res) => {
    try {
      const spells = await storage.getAllSpells();
      res.json(spells);
    } catch (error) {
      console.error("Error fetching spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });

  // Create new spell (admin only)
  app.post("/api/admin/spells", requireAuth, requireAdmin, async (req, res) => {
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
  app.put("/api/admin/spells/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.delete("/api/admin/spells/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/spells/initialize", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultSpells();
      res.json({ message: "Default spells initialized and added to all characters" });
    } catch (error) {
      console.error("Error initializing default spells:", error);
      res.status(500).json({ message: "Failed to initialize default spells" });
    }
  });

  // Bulk import spells (admin only)
  app.post("/api/admin/spells/bulk-import", requireAuth, requireAdmin, async (req, res) => {
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
      const wand = await storage.getCharacterWand(characterId);
      res.json(wand);
    } catch (error) {
      console.error("Error fetching character wand:", error);
      res.status(500).json({ message: "Failed to fetch character wand" });
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
  app.put("/api/admin/wand-components", requireAuth, async (req, res) => {
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
  app.post("/api/admin/migrate-wands-to-inventory", requireAuth, async (req, res) => {
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

  // Influence bar API endpoints
  app.get("/api/influence-bar", requireAuth, async (req, res) => {
    try {
      const influenceBar = await storage.getInfluenceBar();
      
      // If no influence bar exists, create default one
      if (!influenceBar) {
        const defaultBar = await storage.updateInfluenceBar(50, 50, req.session.userId!);
        return res.json(defaultBar);
      }
      
      res.json(influenceBar);
    } catch (error) {
      console.error("Error getting influence bar:", error);
      res.status(500).json({ message: "Failed to get influence bar" });
    }
  });

  app.post("/api/admin/influence-bar/adjust", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { side, points } = req.body;
      
      if (!side || !points || !['grindelwald', 'dumbledore'].includes(side)) {
        return res.status(400).json({ message: "Valid side (grindelwald/dumbledore) and points are required" });
      }

      const parsedPoints = parseInt(points);
      if (isNaN(parsedPoints)) {
        return res.status(400).json({ message: "Points must be a valid number" });
      }

      const updatedBar = await storage.adjustInfluence(side, parsedPoints, req.session.userId!);
      
      // Log admin activity
      await storage.logAdminActivity({
        adminId: req.session.userId!,
        action: "influence_adjustment",
        details: `Adjusted ${side} influence by ${parsedPoints} points`
      });
      
      res.json(updatedBar);
    } catch (error) {
      console.error("Error adjusting influence:", error);
      res.status(500).json({ message: "Failed to adjust influence" });
    }
  });

  app.post("/api/admin/influence-bar/set", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { grindelwaldPoints, dumbledorePoints } = req.body;
      
      if (grindelwaldPoints === undefined || dumbledorePoints === undefined) {
        return res.status(400).json({ message: "Both grindelwaldPoints and dumbledorePoints are required" });
      }

      const parsedGrindelwald = parseInt(grindelwaldPoints);
      const parsedDumbledore = parseInt(dumbledorePoints);
      
      if (isNaN(parsedGrindelwald) || isNaN(parsedDumbledore)) {
        return res.status(400).json({ message: "Points must be valid numbers" });
      }

      const updatedBar = await storage.updateInfluenceBar(parsedGrindelwald, parsedDumbledore, req.session.userId!);
      
      // Log admin activity
      await storage.logAdminActivity({
        adminId: req.session.userId!,
        action: "influence_reset",
        details: `Set influence to Grindelwald: ${parsedGrindelwald}, Dumbledore: ${parsedDumbledore}`
      });
      
      res.json(updatedBar);
    } catch (error) {
      console.error("Error setting influence:", error);
      res.status(500).json({ message: "Failed to set influence" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections with user info
  const activeConnections = new Map<WebSocket, { userId: number; characterId?: number; roomId?: number }>();
  
  // Store room presence - which characters are in which rooms
  const roomPresence = new Map<number, Set<number>>();

  // Function to broadcast message to all clients in a specific room
  function broadcastToRoom(roomId: number, message: any) {
    activeConnections.forEach((connInfo, ws) => {
      if (connInfo.roomId === roomId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

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
            
          case 'join_room':
            const connInfo = activeConnections.get(ws);
            if (!connInfo?.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }
            
            const roomId = parseInt(message.roomId);
            if (!roomId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid room ID' }));
              return;
            }
            
            // Remove character from previous room
            if (connInfo.roomId) {
              const oldRoomCharacters = roomPresence.get(connInfo.roomId);
              if (oldRoomCharacters) {
                oldRoomCharacters.delete(connInfo.characterId);
                if (oldRoomCharacters.size === 0) {
                  roomPresence.delete(connInfo.roomId);
                }
                // Notify old room about character leaving
                broadcastToRoom(connInfo.roomId, {
                  type: 'presence_update',
                  characters: Array.from(oldRoomCharacters)
                });
              }
            }
            
            // Add character to new room
            if (!roomPresence.has(roomId)) {
              roomPresence.set(roomId, new Set());
            }
            roomPresence.get(roomId)!.add(connInfo.characterId);
            connInfo.roomId = roomId;
            
            // Get character details for presence update
            const characterIds = Array.from(roomPresence.get(roomId)!);
            const characters = await Promise.all(
              characterIds.map(async (characterId) => {
                const character = await storage.getCharacter(characterId);
                return character ? {
                  id: character.id,
                  firstName: character.firstName,
                  middleName: character.middleName,
                  lastName: character.lastName,
                  fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`
                } : null;
              })
            );
            const validCharacters = characters.filter(Boolean);
            
            // Notify new room about character joining
            broadcastToRoom(roomId, {
              type: 'presence_update',
              characters: validCharacters
            });
            
            ws.send(JSON.stringify({ 
              type: 'room_joined', 
              roomId,
              characters: validCharacters
            }));
            break;
            
          case 'chat_message':
            const connectionInfo = activeConnections.get(ws);
            if (!connectionInfo?.characterId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            // Check if character is alive (not in cemetery)
            const messageCharacterCheck = await storage.getCharacter(connectionInfo.characterId);
            if (!messageCharacterCheck || messageCharacterCheck.deathDate) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Zemřelé postavy nemohou psát zprávy. Navštivte hřbitov pro více informací.' 
              }));
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
            
            // Get character info and check if alive
            const diceCharacter = await storage.getCharacter(diceConnectionInfo.characterId);
            if (!diceCharacter || diceCharacter.deathDate) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Zemřelé postavy nemohou házet kostkou. Navštivte hřbitov pro více informací.' 
              }));
              return;
            }

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
            
            // Get character info and check if alive
            const coinCharacter = await storage.getCharacter(coinConnectionInfo.characterId);
            if (!coinCharacter || coinCharacter.deathDate) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Zemřelé postavy nemohou házet mincí. Navštivte hřbitov pro více informací.' 
              }));
              return;
            }

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
      console.log('WebSocket connection closed');
      const connInfo = activeConnections.get(ws);
      if (connInfo?.characterId && connInfo?.roomId) {
        // Remove character from room presence
        const roomCharacters = roomPresence.get(connInfo.roomId);
        if (roomCharacters) {
          roomCharacters.delete(connInfo.characterId);
          if (roomCharacters.size === 0) {
            roomPresence.delete(connInfo.roomId);
          } else {
            // Notify room about character leaving
            broadcastToRoom(connInfo.roomId, {
              type: 'presence_update',
              characters: Array.from(roomCharacters)
            });
          }
        }
      }
      activeConnections.delete(ws);
    });
  });

  // Initialize default chat rooms if they don't exist
  (async () => {
    try {
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

  // Admin: Delete ALL messages from database (complete cleanup)
  app.delete("/api/admin/messages/all", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Delete all messages and archived messages
      await storage.deleteAllMessages();
      res.json({ message: "All messages deleted successfully" });
    } catch (error) {
      console.error("Error deleting all messages:", error);
      res.status(500).json({ message: "Failed to delete messages" });
    }
  });

  // Admin: Archive messages (move to archived_messages and delete from messages)
  app.post("/api/admin/rooms/:roomId/archive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archivedCount = await storage.archiveMessages(roomId);
      res.json({ message: `${archivedCount} messages archived successfully` });
    } catch (error) {
      console.error("Error archiving messages:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });

  // Admin: Clear chat (delete only from messages, keep archived)
  app.delete("/api/admin/rooms/:roomId/clear", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const deletedCount = await storage.clearRoomMessages(roomId);
      res.json({ message: `${deletedCount} messages cleared from chat` });
    } catch (error) {
      console.error("Error clearing room messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Download chat content (for users and admins)
  app.get("/api/rooms/:roomId/download", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Get both current messages and archived messages
      const currentMessages = await storage.getMessagesByRoom(roomId, 1000);
      const archivedMessages = await storage.getArchivedMessages(roomId, 1000);
      
      // Combine and sort all messages by timestamp
      const allMessages = [
        ...currentMessages.map(msg => ({
          content: msg.content,
          characterName: `${msg.character.firstName}${msg.character.middleName ? ` ${msg.character.middleName}` : ''} ${msg.character.lastName}`,
          createdAt: msg.createdAt,
          messageType: msg.messageType
        })),
        ...archivedMessages.map(msg => ({
          content: msg.content,
          characterName: msg.characterName,
          createdAt: msg.originalCreatedAt,
          messageType: msg.messageType
        }))
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Format messages for download
      const chatContent = allMessages.map(msg => {
        const timestamp = new Date(msg.createdAt).toLocaleString('cs-CZ');
        return `[${timestamp}] ${msg.characterName}: ${msg.content}`;
      }).join('\n');

      const filename = `chat_${room.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(chatContent);
    } catch (error) {
      console.error("Error downloading chat:", error);
      res.status(500).json({ message: "Failed to download chat" });
    }
  });

  // Admin: Get archived messages
  app.get("/api/admin/rooms/:roomId/archived", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const archivedMessages = await storage.getArchivedMessages(roomId, limit, offset);
      res.json(archivedMessages);
    } catch (error) {
      console.error("Error fetching archived messages:", error);
      res.status(500).json({ message: "Failed to fetch archived messages" });
    }
  });

  // Admin: Get archive dates for a room with message counts
  app.get("/api/admin/rooms/:roomId/archive-dates", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archiveDatesWithCounts = await storage.getArchiveDatesWithCounts(roomId);
      res.json(archiveDatesWithCounts);
    } catch (error) {
      console.error("Error fetching archive dates:", error);
      res.status(500).json({ message: "Failed to fetch archive dates" });
    }
  });

  // Admin: Get archived messages by date
  app.get("/api/admin/rooms/:roomId/archived/:date", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archiveDate = req.params.date;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const archivedMessages = await storage.getArchivedMessagesByDate(roomId, archiveDate, limit, offset);
      res.json(archivedMessages);
    } catch (error) {
      console.error("Error fetching archived messages by date:", error);
      res.status(500).json({ message: "Failed to fetch archived messages" });
    }
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

  // Admin: Get all character requests
  app.get("/api/admin/character-requests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });

  // Admin: Get pending character requests
  app.get("/api/admin/character-requests/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending character requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Admin: Approve character request
  app.post("/api/admin/character-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      
      const character = await storage.approveCharacterRequest(requestId, req.session.userId!, reviewNote);
      res.json({ message: "Character request approved", character });
    } catch (error) {
      console.error("Error approving character request:", error);
      res.status(500).json({ message: "Failed to approve character request" });
    }
  });

  // Admin: Reject character request
  app.post("/api/admin/character-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      
      if (!reviewNote || reviewNote.trim().length < 10) {
        return res.status(400).json({ message: "Review note is required and must be at least 10 characters long" });
      }
      
      const request = await storage.rejectCharacterRequest(requestId, req.session.userId!, reviewNote);
      res.json({ message: "Character request rejected", request });
    } catch (error) {
      console.error("Error rejecting character request:", error);
      res.status(500).json({ message: "Failed to reject character request" });
    }
  });

  // Multi-character operations
  
  // Set main character
  app.post("/api/characters/:id/set-main", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      
      // Verify character belongs to user
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId!) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.setMainCharacter(req.session.userId!, characterId);
      res.json({ message: "Main character updated" });
    } catch (error) {
      console.error("Error setting main character:", error);
      res.status(500).json({ message: "Failed to set main character" });
    }
  });

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
  app.get("/api/admin/activity-log", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/characters/:id/kill", requireAuth, requireAdmin, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { deathReason } = req.body;
      const adminId = req.session.userId!;
      
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
  app.post("/api/characters/:id/revive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const adminId = req.session.userId!;
      
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
  app.post("/api/admin/users/:id/ban", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banReason } = req.body;
      const adminId = req.session.userId!;
      
      if (!banReason || banReason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
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
  app.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = req.session.userId!;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await storage.hashPassword(tempPassword);
      
      // Update user password
      await storage.resetUserPassword(userId, hashedPassword);
      
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

  return httpServer;
}
