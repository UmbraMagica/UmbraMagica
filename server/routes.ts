import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { registrationSchema, loginSchema, insertCharacterSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "rpg-realm-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
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
  app.get("/api/characters/online", requireAuth, async (req, res) => {
    try {
      // For now, return all characters as "online"
      // In a real implementation, you'd track online status
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
              location: "Hlavní chat", // Mock location
            });
          }
        }
      }
      
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

      res.json({ message: "Test data initialized successfully" });
    } catch (error) {
      console.error("Error initializing test data:", error);
      res.status(500).json({ message: "Failed to initialize test data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
