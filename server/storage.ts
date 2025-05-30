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
  spells,
  characterSpells,
  characterInventory,
  characterJournal,
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
  type Spell,
  type InsertSpell,
  type CharacterSpell,
  type InsertCharacterSpell,
  type InventoryItem,
  type InsertInventoryItem,
  type JournalEntry,
  type InsertJournalEntry,
  type Wand,
  type InsertWand,
  wands,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gte, count, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  banUser(id: number, banReason: string): Promise<void>;
  resetUserPassword(id: number, hashedPassword: string): Promise<void>;
  
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
  updateMessageCharacter(messageId: number, characterId: number): Promise<void>;
  
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
  getAllCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]>;
  getPendingCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]>;
  approveCharacterRequest(requestId: number, adminId: number, reviewNote?: string): Promise<Character>;
  rejectCharacterRequest(requestId: number, adminId: number, reviewNote: string): Promise<CharacterRequest>;
  
  // Admin activity log operations
  logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAdminActivityLog(limit?: number, offset?: number): Promise<(AdminActivityLog & { admin: { username: string }; targetUser?: { username: string } })[]>;
  
  // Multi-character operations
  setMainCharacter(userId: number, characterId: number): Promise<void>;
  getMainCharacter(userId: number): Promise<Character | undefined>;
  
  // Cemetery operations
  killCharacter(characterId: number, deathReason: string, adminId: number): Promise<Character | undefined>;
  reviveCharacter(characterId: number): Promise<Character | undefined>;
  getDeadCharacters(): Promise<Character[]>;
  
  // Spell operations
  getAllSpells(): Promise<Spell[]>;
  getSpell(id: number): Promise<Spell | undefined>;
  getSpellByName(name: string): Promise<Spell | undefined>;
  createSpell(spell: InsertSpell): Promise<Spell>;
  updateSpell(id: number, updates: Partial<InsertSpell>): Promise<Spell | undefined>;
  deleteSpell(id: number): Promise<boolean>;
  
  // Character spell operations
  getCharacterSpells(characterId: number): Promise<(CharacterSpell & { spell: Spell })[]>;
  addSpellToCharacter(characterId: number, spellId: number): Promise<CharacterSpell>;
  removeSpellFromCharacter(characterId: number, spellId: number): Promise<boolean>;
  
  // Character inventory operations
  getCharacterInventory(characterId: number): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Character journal operations
  getCharacterJournal(characterId: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  addJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;
  
  // Wand operations
  getCharacterWand(characterId: number): Promise<Wand | undefined>;
  createWand(wand: InsertWand): Promise<Wand>;
  updateWand(wandId: number, updates: Partial<InsertWand>): Promise<Wand | undefined>;
  deleteWand(wandId: number): Promise<boolean>;
  generateRandomWand(characterId: number): Promise<Wand>;
  getAllWandComponents(): Promise<{
    woods: string[];
    cores: { name: string; category: string; description: string }[];
    lengths: string[];
    flexibilities: string[];
  }>;
  migrateExistingWandsToInventory(): Promise<number>;
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

  async banUser(id: number, banReason: string): Promise<void> {
    await db.update(users)
      .set({ 
        isBanned: true,
        banReason: banReason,
        bannedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
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

  async getMessagesByRoom(roomId: number, limit: number = 50, offset: number = 0): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string; avatar?: string | null } })[]> {
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
          avatar: characters.avatar,
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

  async updateMessageCharacter(messageId: number, characterId: number): Promise<void> {
    await db
      .update(messages)
      .set({ characterId })
      .where(eq(messages.id, messageId));
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

  async getCharacterRequestById(requestId: number): Promise<CharacterRequest | undefined> {
    const [request] = await db
      .select()
      .from(characterRequests)
      .where(eq(characterRequests.id, requestId));
    return request;
  }

  async deleteCharacterRequest(requestId: number): Promise<boolean> {
    const result = await db
      .delete(characterRequests)
      .where(eq(characterRequests.id, requestId));
    return (result.rowCount || 0) > 0;
  }

  async getAllCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
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
      .orderBy(desc(characterRequests.createdAt));
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

    // Check if user has any existing characters and if they have a main character
    const existingCharacters = await db
      .select()
      .from(characters)
      .where(and(eq(characters.userId, request.userId), eq(characters.isActive, true)));

    const hasMainCharacter = existingCharacters.some(char => char.isMainCharacter);

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

    // Create the character - only set as main if it's the user's first character OR if they don't have a main character yet
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
        isMainCharacter: existingCharacters.length === 0 || !hasMainCharacter, // Only if first character OR no main character exists
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

  // Cemetery operations
  async killCharacter(characterId: number, deathReason: string, adminId: number): Promise<Character | undefined> {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    // Get all user's active characters
    const userCharacters = await db
      .select()
      .from(characters)
      .where(and(eq(characters.userId, character.userId), eq(characters.isActive, true)));

    // Kill the character
    const [killedCharacter] = await db
      .update(characters)
      .set({
        isActive: false,
        deathDate: new Date().toISOString().split('T')[0], // Current date
        deathReason,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId))
      .returning();

    // Handle main character reassignment
    if (character.isMainCharacter) {
      const remainingActiveCharacters = userCharacters.filter(
        c => c.id !== characterId && c.isActive
      );

      if (remainingActiveCharacters.length > 0) {
        // If there are remaining active characters, make the oldest one main
        const oldestCharacter = remainingActiveCharacters.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];

        await db
          .update(characters)
          .set({ 
            isMainCharacter: true,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, oldestCharacter.id));

        // Remove main character flag from the killed character
        await db
          .update(characters)
          .set({ 
            isMainCharacter: false,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, characterId));
      }
      // If no remaining characters, keep the dead character as main
    }

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "kill_character",
      targetUserId: character.userId,
      targetCharacterId: characterId,
      details: `Killed character: ${character.firstName} ${character.lastName}. Reason: ${deathReason}`,
    });

    return killedCharacter;
  }

  async reviveCharacter(characterId: number): Promise<Character | undefined> {
    const [updatedCharacter] = await db
      .update(characters)
      .set({ 
        deathDate: null,
        deathReason: null,
        updatedAt: new Date()
      })
      .where(eq(characters.id, characterId))
      .returning();

    return updatedCharacter;
  }

  async getDeadCharacters(): Promise<Character[]> {
    return db
      .select()
      .from(characters)
      .where(and(
        isNotNull(characters.deathDate)
      ))
      .orderBy(desc(characters.deathDate), desc(characters.createdAt));
  }

  // Spell operations
  async getAllSpells(): Promise<Spell[]> {
    return db
      .select()
      .from(spells)
      .orderBy(spells.category, spells.name);
  }

  async getSpell(id: number): Promise<Spell | undefined> {
    const [spell] = await db.select().from(spells).where(eq(spells.id, id));
    return spell;
  }

  async getSpellByName(name: string): Promise<Spell | undefined> {
    const [spell] = await db.select().from(spells).where(eq(spells.name, name));
    return spell;
  }

  async createSpell(insertSpell: InsertSpell): Promise<Spell> {
    const [spell] = await db
      .insert(spells)
      .values(insertSpell)
      .returning();
    return spell;
  }

  async updateSpell(id: number, updates: Partial<InsertSpell>): Promise<Spell | undefined> {
    const [spell] = await db
      .update(spells)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(spells.id, id))
      .returning();
    return spell;
  }

  async deleteSpell(id: number): Promise<boolean> {
    // First remove spell from all characters
    await db.delete(characterSpells).where(eq(characterSpells.spellId, id));
    
    // Then delete the spell
    const result = await db.delete(spells).where(eq(spells.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Character spell operations
  async getCharacterSpells(characterId: number): Promise<(CharacterSpell & { spell: Spell })[]> {
    return db
      .select({
        id: characterSpells.id,
        characterId: characterSpells.characterId,
        spellId: characterSpells.spellId,
        learnedAt: characterSpells.learnedAt,
        spell: spells,
      })
      .from(characterSpells)
      .innerJoin(spells, eq(characterSpells.spellId, spells.id))
      .where(eq(characterSpells.characterId, characterId))
      .orderBy(spells.category, spells.name);
  }

  async addSpellToCharacter(characterId: number, spellId: number): Promise<CharacterSpell> {
    const [characterSpell] = await db
      .insert(characterSpells)
      .values({ characterId, spellId })
      .returning();
    return characterSpell;
  }

  async removeSpellFromCharacter(characterId: number, spellId: number): Promise<boolean> {
    const result = await db
      .delete(characterSpells)
      .where(and(
        eq(characterSpells.characterId, characterId),
        eq(characterSpells.spellId, spellId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Initialize default spells and add them to all existing characters
  async initializeDefaultSpells(): Promise<void> {
    const defaultSpells = [
      {
        name: "Carpe Retractum",
        description: "Vytvoří světelné lano, které slouží k přitažení předmětu k sesílateli",
        effect: "Vytvoří světelné lano, které slouží k přitažení předmětu k sesílateli, pokud je použito na pevně ukotvený předmět, může se naopak přitáhnout sesílatel.",
        category: "Kouzelné formule",
        type: "Základní",
        targetType: "object" as const,
      },
      {
        name: "Lumos",
        description: "Rozsvítí konec hůlky jako svítilnu",
        effect: "Rozsvítí konec hůlky jako svítilnu.",
        category: "Kouzelné formule", 
        type: "Základní",
        targetType: "self" as const,
      },
      {
        name: "Nox",
        description: "Zhasne světlo vyvolané kouzlem Lumos",
        effect: "Zhasne světlo vyvolané kouzlem Lumos.",
        category: "Kouzelné formule",
        type: "Základní",
        targetType: "self" as const,
      }
    ];

    // Create spells if they don't exist
    for (const spellData of defaultSpells) {
      // Check if spell already exists
      const existingSpells = await db.select().from(spells).where(eq(spells.name, spellData.name));
      
      let spell;
      if (existingSpells.length === 0) {
        // Create new spell
        [spell] = await db.insert(spells).values(spellData).returning();
        console.log(`Created spell: ${spell.name}`);
      } else {
        spell = existingSpells[0];
        console.log(`Spell already exists: ${spell.name}`);
      }

      // Add spell to all existing characters who don't have it
      const allCharacters = await db.select().from(characters);
      for (const character of allCharacters) {
        // Check if character already has this spell
        const existingCharacterSpell = await db
          .select()
          .from(characterSpells)
          .where(and(
            eq(characterSpells.characterId, character.id),
            eq(characterSpells.spellId, spell.id)
          ));

        if (existingCharacterSpell.length === 0) {
          // Add spell to character
          await db.insert(characterSpells).values({
            characterId: character.id,
            spellId: spell.id,
          });
          console.log(`Added spell ${spell.name} to character ${character.firstName} ${character.lastName}`);
        }
      }
    }
  }

  // Character inventory operations
  async getCharacterInventory(characterId: number): Promise<InventoryItem[]> {
    return db
      .select()
      .from(characterInventory)
      .where(eq(characterInventory.characterId, characterId))
      .orderBy(characterInventory.category, characterInventory.itemName);
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(characterInventory)
      .where(eq(characterInventory.id, id));
    return item;
  }

  async addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [inventoryItem] = await db
      .insert(characterInventory)
      .values(item)
      .returning();
    return inventoryItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(characterInventory)
      .set(updates)
      .where(eq(characterInventory.id, id))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db
      .delete(characterInventory)
      .where(eq(characterInventory.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Character journal operations
  async getCharacterJournal(characterId: number): Promise<JournalEntry[]> {
    return db
      .select()
      .from(characterJournal)
      .where(eq(characterJournal.characterId, characterId))
      .orderBy(desc(characterJournal.entryDate), desc(characterJournal.createdAt));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(characterJournal)
      .where(eq(characterJournal.id, id));
    return entry;
  }

  async addJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [journalEntry] = await db
      .insert(characterJournal)
      .values(entry)
      .returning();
    return journalEntry;
  }

  async updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .update(characterJournal)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(characterJournal.id, id))
      .returning();
    return entry;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(characterJournal)
      .where(eq(characterJournal.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Wand operations
  async getCharacterWand(characterId: number): Promise<Wand | undefined> {
    const [wand] = await db
      .select()
      .from(wands)
      .where(eq(wands.characterId, characterId));
    return wand;
  }

  async createWand(insertWand: InsertWand): Promise<Wand> {
    const [wand] = await db
      .insert(wands)
      .values(insertWand)
      .returning();
    return wand;
  }

  async updateWand(id: number, updates: Partial<InsertWand>): Promise<Wand | undefined> {
    const [wand] = await db
      .update(wands)
      .set(updates)
      .where(eq(wands.id, id))
      .returning();
    return wand;
  }

  async deleteWand(id: number): Promise<boolean> {
    const result = await db
      .delete(wands)
      .where(eq(wands.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async generateRandomWand(characterId: number): Promise<Wand> {
    // Define wand components - Basic cores (most common)
    const basicCores = [
      "🐉 Blána z dračího srdce",
      "🦄 Vlas z hřívy jednorožce", 
      "🔥 Pero fénixe"
    ];

    // Rare cores from magical plants
    const plantCores = [
      "🌱 Kořen mandragory (sušený, očarovaný)",
      "🌸 Květ Asfodelu (uchovaný v kouzelnické pryskyřici)",
      "🍃 List měsíční kapradiny"
    ];

    // Very rare cores from magical creatures
    const creatureCores = [
      "🐺 Zub vlkodlaka",
      "🕷️ Jed z akromantule (zakonzervovaný v vláknu)",
      "🐍 Hadí jazyk (vzácný exemplář)",
      "🦉 Opeření z noční můry (stínového hippogryfa)"
    ];

    // Elemental and mineral cores
    const elementalCores = [
      "🪨 Dračí kámen (Bloodstone)",
      "🖤 Obsidián s runovým leptem",
      "🔮 Měsíční kámen",
      "⚡ Rudý jantar s duší hmyzího krále"
    ];

    // Less noble cores
    const lesserCores = [
      "🧝‍♀️ Vlas víly",
      "🦴 Nehet ďasovce"
    ];

    // Weight the selection toward basic cores (80% chance)
    const randomChance = Math.random();
    let selectedCores;
    
    if (randomChance < 0.8) {
      selectedCores = basicCores;
    } else if (randomChance < 0.9) {
      selectedCores = plantCores;
    } else if (randomChance < 0.95) {
      selectedCores = elementalCores;
    } else if (randomChance < 0.98) {
      selectedCores = creatureCores;
    } else {
      selectedCores = lesserCores;
    }

    const cores = selectedCores;

    const woods = [
      "Akácie", "Anglický dub", "Borovice", "Buk", "Cedr", "Cesmína", "Cypřiš", 
      "Černý bez", "Černý ořech", "Červený dub", "Dřín", "Eben", "Habr", "Hloh", 
      "Hrušeň", "Jabloň", "Jasan", "Javor", "Jedle", "Jeřáb", "Jilm", "Kaštan", 
      "Lípa stříbřitá", "Líska", "Modřín", "Ořech", "Růže", "Smrk", "Tis", 
      "Topol", "Třešeň", "Vrba", "Vinná réva"
    ];

    const lengths = [
      '7"', '8"', '9"', '10"', '11"', '12"', '13"', '14"', '15"', '16"'
    ];

    const flexibilities = [
      "Nezlomná", "Velmi nepoddajná", "Nepoddajná", "Mírně nepoddajná",
      "Pevná", "Tvrdá", "Ohebná", "Pružná", "Velmi pružná", 
      "Výjimečně poddajná", "Vrbovitá"
    ];

    // Generate random selections
    const randomCore = cores[Math.floor(Math.random() * cores.length)];
    const randomWood = woods[Math.floor(Math.random() * woods.length)];
    const randomLength = lengths[Math.floor(Math.random() * lengths.length)];
    const randomFlexibility = flexibilities[Math.floor(Math.random() * flexibilities.length)];

    const description = `Hůlka z ${randomWood.toLowerCase()}, ${randomLength} dlouhá, ${randomFlexibility.toLowerCase()}, s jádrem ${randomCore.toLowerCase()}. Vybrána Ollivanderem osobně pro svého nového majitele.`;

    const wandData: InsertWand = {
      characterId,
      wood: randomWood,
      core: randomCore,
      length: randomLength,
      flexibility: randomFlexibility,
      description
    };

    return this.createWand(wandData);
  }

  async getAllWandComponents(): Promise<{
    woods: string[];
    cores: { name: string; category: string; description: string }[];
    lengths: string[];
    flexibilities: string[];
  }> {
    const woods = [
      "Akácie", "Anglický dub", "Borovice", "Buk", "Cedr", "Cesmína", "Cypřiš", 
      "Černý bez", "Černý ořech", "Červený dub", "Dřín", "Eben", "Habr", "Hloh", 
      "Hrušeň", "Jabloň", "Jasan", "Javor", "Jedle", "Jeřáb", "Jilm", "Kaštan", 
      "Lípa stříbřitá", "Líska", "Modřín", "Ořech", "Růže", "Smrk", "Tis", 
      "Topol", "Třešeň", "Vrba", "Vinná réva"
    ];

    const cores = [
      // Basic cores
      { name: "🐉 Blána z dračího srdce", category: "Základní", description: "Nejsilnější jádro, ideální pro bojová kouzla" },
      { name: "🦄 Vlas z hřívy jednorožce", category: "Základní", description: "Nejvěrnější jádro, vhodné pro léčivá kouzla" },
      { name: "🔥 Pero fénixe", category: "Základní", description: "Nejřídší jádro, schopné největších kouzel" },
      
      // Plant cores
      { name: "🌱 Kořen mandragory (sušený, očarovaný)", category: "Rostlinné", description: "Silné spojení se zemí a životní silou. Nestabilní při destruktivních kouzlech." },
      { name: "🌸 Květ Asfodelu (uchovaný v kouzelnické pryskyřici)", category: "Rostlinné", description: "Vztah ke smrti a přechodu mezi světy. Emočně náročné – vytahuje potlačené vzpomínky." },
      { name: "🍃 List měsíční kapradiny", category: "Rostlinné", description: "Posiluje iluze, neviditelnost, astrální projekci. Méně vhodné pro přímý souboj." },
      
      // Creature cores
      { name: "🐺 Zub vlkodlaka", category: "Tvorové", description: "Posiluje útočná kouzla, proměny a zvyšuje magickou agresi. Může negativně ovlivnit psychiku." },
      { name: "🕷️ Jed z akromantule (zakonzervovaný v vláknu)", category: "Tvorové", description: "Výborné pro subtilní, jedovatou magii. Vytváří neklid v rukou čistých mágů." },
      { name: "🐍 Hadí jazyk (vzácný exemplář)", category: "Tvorové", description: "Vhodné pro hadomluvy, šepoty, temná zaklínadla. Extrémně vzácné a nestabilní." },
      { name: "🦉 Opeření z noční můry (stínového hippogryfa)", category: "Tvorové", description: "Posiluje kouzla spánku, vizí, nočních přeludů. Citlivé na světlo." },
      
      // Elemental cores
      { name: "🪨 Dračí kámen (Bloodstone)", category: "Elementární", description: "Vztah k oběti a krvi. Odebírá uživateli část energie při silných kouzlech." },
      { name: "🖤 Obsidián s runovým leptem", category: "Elementární", description: "Skvělý pro magii štítů, run, ochranných kleteb. Těžkopádný při spontánní magii." },
      { name: "🔮 Měsíční kámen", category: "Elementární", description: "Posiluje ženskou magii, věštění, vodní a lunární kouzla. Méně stabilní při černé magii." },
      { name: "⚡ Rudý jantar s duší hmyzího krále", category: "Elementární", description: "Podporuje experimentální magii a alchymii. Občas vykazuje nezávislé chování." },
      
      // Lesser cores
      { name: "🧝‍♀️ Vlas víly", category: "Méně ušlechtilé", description: "Krásné a třpytivé, ale nestálé a nevyzpytatelné. Rychle ztrácí moc a náchylné k selháním." },
      { name: "🦴 Nehet ďasovce", category: "Méně ušlechtilé", description: "Brutální a primitivní magie založená na síle a agresi. Oblíbené u černokněžníků." }
    ];

    const lengths = ['7"', '8"', '9"', '10"', '11"', '12"', '13"', '14"', '15"', '16"'];

    const flexibilities = [
      "Nezlomná", "Velmi nepoddajná", "Nepoddajná", "Mírně nepoddajná",
      "Pevná", "Tvrdá", "Ohebná", "Pružná", "Velmi pružná", 
      "Výjimečně poddajná", "Vrbovitá"
    ];

    return { woods, cores, lengths, flexibilities };
  }

  async migrateExistingWandsToInventory(): Promise<number> {
    try {
      // Get all existing wands
      const existingWands = await db.select().from(wands);
      
      let migratedCount = 0;
      
      for (const wand of existingWands) {
        // Check if this wand already exists in inventory
        const existingInventoryItem = await db
          .select()
          .from(characterInventory)
          .where(
            and(
              eq(characterInventory.characterId, wand.characterId),
              eq(characterInventory.category, "Wand")
            )
          );
        
        // If not already in inventory, add it
        if (existingInventoryItem.length === 0) {
          await db.insert(characterInventory).values({
            characterId: wand.characterId,
            itemName: `Hůlka (${wand.wood})`,
            itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
            quantity: 1,
            category: "Wand",
            rarity: "Epic",
            value: 700, // 7 galleons for a wand
            isEquipped: true,
            notes: "Migrace existující hůlky do inventáře"
          });
          
          migratedCount++;
        }
      }
      
      return migratedCount;
    } catch (error) {
      console.error("Error migrating wands to inventory:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();