import {
  users,
  characters,
  inviteCodes,
  chatCategories,
  chatRooms,
  messages,
  archivedMessages,
  characterRequests,
  adminActivityLog,
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type InviteCode,
  type InsertInviteCode,
  type ChatCategory,
  type InsertChatCategory,
  type ChatRoom,
  type InsertChatRoom,
  type Message,
  type InsertMessage,
  type ArchivedMessage,
  type CharacterRequest,
  type InsertCharacterRequest,
  type AdminActivityLog,
  type InsertAdminActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gte, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Character operations
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUserId(userId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined>;
  
  // Invite code operations
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  createInviteCode(code: InsertInviteCode): Promise<InviteCode>;
  useInviteCode(code: string, userId: number): Promise<boolean>;
  
  // Authentication
  validateUser(username: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  
  // Chat category operations
  getChatCategory(id: number): Promise<ChatCategory | undefined>;
  getChatCategoryByName(name: string): Promise<ChatCategory | undefined>;
  createChatCategory(category: InsertChatCategory): Promise<ChatCategory>;
  getAllChatCategories(): Promise<ChatCategory[]>;
  getChatCategoriesWithChildren(): Promise<(ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[]>;
  
  // Chat operations
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByName(name: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: number, updates: Partial<InsertChatRoom>): Promise<ChatRoom | undefined>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByRoom(roomId: number, limit?: number, offset?: number): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string } })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Archive operations
  archiveMessages(roomId: number, beforeDate?: Date): Promise<number>;
  getArchivedMessages(roomId: number, limit?: number, offset?: number): Promise<ArchivedMessage[]>;
  
  // Additional message operations
  deleteAllMessages(): Promise<void>;
  clearRoomMessages(roomId: number): Promise<number>;
  getArchiveDates(roomId: number): Promise<string[]>;
  getArchiveDatesWithCounts(roomId: number): Promise<{ date: string; count: number }[]>;
  getArchivedMessagesByDate(roomId: number, archiveDate: string, limit?: number, offset?: number): Promise<ArchivedMessage[]>;
  
  // Character request operations
  createCharacterRequest(request: InsertCharacterRequest): Promise<CharacterRequest>;
  getCharacterRequestsByUserId(userId: number): Promise<CharacterRequest[]>;
  getCharacterRequestById(requestId: number): Promise<CharacterRequest | undefined>;
  deleteCharacterRequest(requestId: number): Promise<boolean>;
  getPendingCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]>;
  approveCharacterRequest(requestId: number, adminId: number, reviewNote?: string): Promise<Character>;
  rejectCharacterRequest(requestId: number, adminId: number, reviewNote: string): Promise<CharacterRequest>;
  
  // Admin activity log operations
  logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAdminActivityLog(limit?: number, offset?: number): Promise<(AdminActivityLog & { admin: { username: string }; targetUser?: { username: string } })[]>;
  
  // Multi-character operations
  setMainCharacter(userId: number, characterId: number): Promise<void>;
  getMainCharacter(userId: number): Promise<Character | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.createdAt));
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values({
        ...insertCharacter,
        updatedAt: new Date(),
      })
      .returning();
    return character;
  }

  async updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return character;
  }

  // Authentication and invite codes remain same...
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return inviteCode;
  }

  async createInviteCode(insertInviteCode: InsertInviteCode): Promise<InviteCode> {
    const [inviteCode] = await db.insert(inviteCodes).values(insertInviteCode).returning();
    return inviteCode;
  }

  async useInviteCode(code: string, userId: number): Promise<boolean> {
    try {
      await db
        .update(inviteCodes)
        .set({ isUsed: true, usedBy: userId, usedAt: new Date() })
        .where(eq(inviteCodes.code, code));
      return true;
    } catch {
      return false;
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Chat operations (keeping existing implementation)
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, name));
    return room;
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db.insert(chatRooms).values(insertChatRoom).returning();
    return room;
  }

  async updateChatRoom(id: number, updates: Partial<InsertChatRoom>): Promise<ChatRoom | undefined> {
    const [room] = await db
      .update(chatRooms)
      .set(updates)
      .where(eq(chatRooms.id, id))
      .returning();
    return room;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).orderBy(chatRooms.sortOrder);
  }

  async getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).where(eq(chatRooms.categoryId, categoryId)).orderBy(chatRooms.sortOrder);
  }

  async getChatCategory(id: number): Promise<ChatCategory | undefined> {
    const [category] = await db.select().from(chatCategories).where(eq(chatCategories.id, id));
    return category;
  }

  async getChatCategoryByName(name: string): Promise<ChatCategory | undefined> {
    const [category] = await db.select().from(chatCategories).where(eq(chatCategories.name, name));
    return category;
  }

  async createChatCategory(insertChatCategory: InsertChatCategory): Promise<ChatCategory> {
    const [category] = await db.insert(chatCategories).values(insertChatCategory).returning();
    return category;
  }

  async getAllChatCategories(): Promise<ChatCategory[]> {
    return db.select().from(chatCategories).orderBy(chatCategories.sortOrder);
  }

  async getChatCategoriesWithChildren(): Promise<(ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[]> {
    const categories = await db.select().from(chatCategories).orderBy(chatCategories.sortOrder);
    const rooms = await db.select().from(chatRooms).orderBy(chatRooms.sortOrder);

    const categoryMap = new Map<number, ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] }>();
    
    // Initialize all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [], rooms: [] });
    });

    // Add rooms to categories
    rooms.forEach(room => {
      if (room.categoryId) {
        const category = categoryMap.get(room.categoryId);
        if (category) {
          category.rooms.push(room);
        }
      }
    });

    // Build hierarchy
    const rootCategories: (ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[] = [];
    
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  // Message operations (keeping existing)
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByRoom(roomId: number, limit: number = 50, offset: number = 0): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    return db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        characterId: messages.characterId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        character: {
          firstName: characters.firstName,
          middleName: characters.middleName,
          lastName: characters.lastName,
        },
      })
      .from(messages)
      .innerJoin(characters, eq(messages.characterId, characters.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async deleteMessage(id: number): Promise<boolean> {
    try {
      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch {
      return false;
    }
  }

  // Archive operations (keeping existing)
  async archiveMessages(roomId: number, beforeDate?: Date): Promise<number> {
    const whereCondition = beforeDate 
      ? and(eq(messages.roomId, roomId), lt(messages.createdAt, beforeDate))
      : eq(messages.roomId, roomId);

    const messagesToArchive = await db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        characterId: messages.characterId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        characterName: characters.firstName,
        characterLastName: characters.lastName,
        characterMiddleName: characters.middleName,
      })
      .from(messages)
      .innerJoin(characters, eq(messages.characterId, characters.id))
      .where(whereCondition);

    if (messagesToArchive.length === 0) {
      return 0;
    }

    const archiveData = messagesToArchive.map(msg => ({
      originalMessageId: msg.id,
      roomId: msg.roomId,
      characterId: msg.characterId,
      characterName: `${msg.characterName}${msg.characterMiddleName ? ' ' + msg.characterMiddleName : ''} ${msg.characterLastName}`,
      content: msg.content,
      messageType: msg.messageType,
      originalCreatedAt: msg.createdAt,
    }));

    await db.insert(archivedMessages).values(archiveData);
    const deleteResult = await db.delete(messages).where(whereCondition);
    
    return deleteResult.rowCount || 0;
  }

  async getArchivedMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<ArchivedMessage[]> {
    return db
      .select()
      .from(archivedMessages)
      .where(eq(archivedMessages.roomId, roomId))
      .orderBy(desc(archivedMessages.originalCreatedAt))
      .limit(limit)
      .offset(offset);
  }

  async deleteAllMessages(): Promise<void> {
    await db.delete(messages);
    await db.delete(archivedMessages);
  }

  async clearRoomMessages(roomId: number): Promise<number> {
    const deleteResult = await db.delete(messages).where(eq(messages.roomId, roomId));
    return deleteResult.rowCount || 0;
  }

  async getArchiveDates(roomId: number): Promise<string[]> {
    const dates = await db
      .selectDistinct({ archivedAt: archivedMessages.archivedAt })
      .from(archivedMessages)
      .where(eq(archivedMessages.roomId, roomId))
      .orderBy(desc(archivedMessages.archivedAt));
    
    return dates.map(d => d.archivedAt.toISOString().split('T')[0]);
  }

  async getArchiveDatesWithCounts(roomId: number): Promise<{ date: string; count: number }[]> {
    const result = await db
      .select({
        archivedAt: archivedMessages.archivedAt,
        count: count()
      })
      .from(archivedMessages)
      .where(eq(archivedMessages.roomId, roomId))
      .groupBy(archivedMessages.archivedAt)
      .orderBy(desc(archivedMessages.archivedAt));
    
    return result.map(r => ({
      date: r.archivedAt.toISOString().split('T')[0],
      count: Number(r.count)
    }));
  }

  async getArchivedMessagesByDate(roomId: number, archiveDate: string, limit: number = 50, offset: number = 0): Promise<ArchivedMessage[]> {
    const startDate = new Date(archiveDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return db
      .select()
      .from(archivedMessages)
      .where(
        and(
          eq(archivedMessages.roomId, roomId),
          gte(archivedMessages.archivedAt, startDate),
          lt(archivedMessages.archivedAt, endDate)
        )
      )
      .orderBy(desc(archivedMessages.originalCreatedAt))
      .limit(limit)
      .offset(offset);
  }

  // Character request operations
  async createCharacterRequest(request: InsertCharacterRequest): Promise<CharacterRequest> {
    const [characterRequest] = await db.insert(characterRequests).values(request).returning();
    return characterRequest;
  }

  async getCharacterRequestsByUserId(userId: number): Promise<CharacterRequest[]> {
    return db.select().from(characterRequests).where(eq(characterRequests.userId, userId)).orderBy(desc(characterRequests.createdAt));
  }

  async getPendingCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
    return db
      .select({
        id: characterRequests.id,
        userId: characterRequests.userId,
        firstName: characterRequests.firstName,
        middleName: characterRequests.middleName,
        lastName: characterRequests.lastName,
        birthDate: characterRequests.birthDate,
        school: characterRequests.school,
        description: characterRequests.description,
        reason: characterRequests.reason,
        status: characterRequests.status,
        reviewedBy: characterRequests.reviewedBy,
        reviewedAt: characterRequests.reviewedAt,
        reviewNote: characterRequests.reviewNote,
        createdAt: characterRequests.createdAt,
        user: {
          username: users.username,
          email: users.email,
        },
      })
      .from(characterRequests)
      .innerJoin(users, eq(characterRequests.userId, users.id))
      .where(eq(characterRequests.status, "pending"))
      .orderBy(desc(characterRequests.createdAt));
  }

  async approveCharacterRequest(requestId: number, adminId: number, reviewNote?: string): Promise<Character> {
    const [request] = await db.select().from(characterRequests).where(eq(characterRequests.id, requestId));
    if (!request) {
      throw new Error("Character request not found");
    }

    // Update request status
    await db
      .update(characterRequests)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote,
      })
      .where(eq(characterRequests.id, requestId));

    // Create the character
    const [character] = await db
      .insert(characters)
      .values({
        userId: request.userId,
        firstName: request.firstName,
        middleName: request.middleName,
        lastName: request.lastName,
        birthDate: request.birthDate,
        school: request.school,
        description: request.description,
        isActive: true,
        isMainCharacter: false,
      })
      .returning();

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "approve_character",
      targetUserId: request.userId,
      targetCharacterId: character.id,
      targetRequestId: requestId,
      details: `Approved character: ${request.firstName} ${request.lastName}`,
    });

    return character;
  }

  async rejectCharacterRequest(requestId: number, adminId: number, reviewNote: string): Promise<CharacterRequest> {
    const [request] = await db
      .update(characterRequests)
      .set({
        status: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote,
      })
      .where(eq(characterRequests.id, requestId))
      .returning();

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "reject_character",
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Rejected character request: ${request.firstName} ${request.lastName}`,
    });

    return request;
  }

  // Admin activity log operations
  async logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const [log] = await db.insert(adminActivityLog).values(activity).returning();
    return log;
  }

  async getAdminActivityLog(limit: number = 50, offset: number = 0): Promise<(AdminActivityLog & { admin: { username: string }; targetUser?: { username: string } })[]> {
    return db
      .select({
        id: adminActivityLog.id,
        adminId: adminActivityLog.adminId,
        action: adminActivityLog.action,
        targetUserId: adminActivityLog.targetUserId,
        targetCharacterId: adminActivityLog.targetCharacterId,
        targetRequestId: adminActivityLog.targetRequestId,
        details: adminActivityLog.details,
        createdAt: adminActivityLog.createdAt,
        admin: {
          username: users.username,
        },
        targetUser: {
          username: users.username,
        },
      })
      .from(adminActivityLog)
      .innerJoin(users, eq(adminActivityLog.adminId, users.id))
      .orderBy(desc(adminActivityLog.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Multi-character operations
  async setMainCharacter(userId: number, characterId: number): Promise<void> {
    // First, unset all main characters for this user
    await db
      .update(characters)
      .set({ isMainCharacter: false })
      .where(eq(characters.userId, userId));

    // Set the new main character
    await db
      .update(characters)
      .set({ isMainCharacter: true })
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)));
  }

  async getMainCharacter(userId: number): Promise<Character | undefined> {
    const [character] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.userId, userId), eq(characters.isMainCharacter, true)));
    return character;
  }
}

export const storage = new DatabaseStorage();