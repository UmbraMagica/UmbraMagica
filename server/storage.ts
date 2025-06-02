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
  configuration,

  housingRequests,
  owlPostMessages,
  wandWoods,
  wandCores,
  wandLengths,
  wandFlexibilities,
  influenceBar,
  influenceHistory,
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

  type HousingRequest,
  type InsertHousingRequest,
  type OwlPostMessage,
  type InsertOwlPostMessage,
  type WandWood,
  type InsertWandWood,
  type WandCore,
  type InsertWandCore,
  type WandLength,
  type InsertWandLength,
  type WandFlexibility,
  type InsertWandFlexibility,
  wands,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gte, count, isNotNull, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserNarratorPermission(id: number, canNarrate: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  banUser(id: number, banReason: string): Promise<void>;
  resetUserPassword(id: number, hashedPassword: string): Promise<void>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  updateUserEmail(id: number, email: string): Promise<void>;
  updateUserSettings(id: number, settings: { characterOrder?: string; highlightWords?: string; highlightColor?: string; narratorColor?: string }): Promise<void>;
  
  // Character operations
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUserId(userId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined>;

  
  // Invite code operations
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  getAllInviteCodes(): Promise<InviteCode[]>;
  createInviteCode(code: InsertInviteCode): Promise<InviteCode>;
  useInviteCode(code: string, userId: number): Promise<boolean>;
  
  // Authentication
  validateUser(username: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  
  // Chat category operations
  getChatCategory(id: number): Promise<ChatCategory | undefined>;
  getChatCategoryByName(name: string): Promise<ChatCategory | undefined>;
  createChatCategory(category: InsertChatCategory): Promise<ChatCategory>;
  updateChatCategory(id: number, updates: Partial<InsertChatCategory>): Promise<ChatCategory | undefined>;
  deleteChatCategory(id: number): Promise<boolean>;
  getAllChatCategories(): Promise<ChatCategory[]>;
  getChatCategoriesWithChildren(): Promise<(ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[]>;
  
  // Chat operations
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByName(name: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: number, updates: Partial<InsertChatRoom>): Promise<ChatRoom | undefined>;
  deleteChatRoom(id: number): Promise<boolean>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]>;
  validateRoomPassword(roomId: number, password: string): Promise<boolean>;
  
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
  getLastMessageByCharacter(characterId: number): Promise<Message | undefined>;
  
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
    woods: { name: string; shortDescription: string; longDescription: string }[];
    cores: { name: string; category: string; description: string }[];
    lengths: { name: string; description: string }[];
    flexibilities: { name: string; description: string }[];
  }>;
  migrateExistingWandsToInventory(): Promise<number>;
  updateWandComponents(components: {
    woods: { name: string; shortDescription: string; longDescription: string }[];
    cores: { name: string; category: string; description: string }[];
    lengths: { name: string; description: string }[];
    flexibilities: { name: string; description: string }[];
  }): Promise<void>;
  
  // Influence operations
  getInfluenceBar(): Promise<{ grindelwaldPoints: number; dumbledorePoints: number }>;
  getInfluenceHistory(): Promise<any[]>;
  adjustInfluence(side: 'grindelwald' | 'dumbledore', points: number, userId: number): Promise<void>;
  setInfluence(grindelwaldPoints: number, dumbledorePoints: number, userId: number): Promise<void>;

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

  async updateUserNarratorPermission(id: number, canNarrate: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ canNarrate, updatedAt: new Date() })
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

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserEmail(id: number, email: string): Promise<void> {
    await db.update(users)
      .set({ email: email, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserSettings(id: number, settings: { characterOrder?: string; highlightWords?: string; highlightColor?: string; narratorColor?: string }): Promise<void> {
    await db.update(users)
      .set({ 
        ...settings,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserNarratorPermissions(id: number, canNarrate: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ canNarrate, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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



  async getCharacterByName(firstName: string, lastName: string): Promise<Character | undefined> {
    const [character] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.firstName, firstName), eq(characters.lastName, lastName)));
    return character;
  }

  // Authentication and invite codes remain same...
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return inviteCode;
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
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
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    
    const [room] = await db
      .update(chatRooms)
      .set(updates)
      .where(eq(chatRooms.id, id))
      .returning();
    return room;
  }

  async deleteChatRoom(id: number): Promise<boolean> {
    try {
      // First delete all messages in the room
      await db.delete(messages).where(eq(messages.roomId, id));
      
      // Then delete the room
      await db.delete(chatRooms).where(eq(chatRooms.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting chat room:', error);
      return false;
    }
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).orderBy(chatRooms.sortOrder);
  }

  async getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).where(eq(chatRooms.categoryId, categoryId)).orderBy(chatRooms.sortOrder);
  }

  async validateRoomPassword(roomId: number, password: string): Promise<boolean> {
    const room = await this.getChatRoom(roomId);
    if (!room) return false;
    if (!room.password) return true; // No password required
    
    return bcrypt.compare(password, room.password);
  }

  async updateChatCategorySortOrder(id: number, sortOrder: number): Promise<ChatCategory | undefined> {
    try {
      const [updated] = await db
        .update(chatCategories)
        .set({ sortOrder })
        .where(eq(chatCategories.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating chat category sort order:', error);
      return undefined;
    }
  }

  async updateChatRoomSortOrder(id: number, sortOrder: number): Promise<ChatRoom | undefined> {
    try {
      const [updated] = await db
        .update(chatRooms)
        .set({ sortOrder })
        .where(eq(chatRooms.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating chat room sort order:', error);
      return undefined;
    }
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

  async updateChatCategory(id: number, updates: Partial<InsertChatCategory>): Promise<ChatCategory | undefined> {
    const [category] = await db.update(chatCategories)
      .set(updates)
      .where(eq(chatCategories.id, id))
      .returning();
    return category;
  }

  async deleteChatCategory(id: number): Promise<boolean> {
    try {
      // First check if there are any child categories
      const children = await db.select().from(chatCategories).where(eq(chatCategories.parentId, id));
      if (children.length > 0) {
        throw new Error("Cannot delete category with child categories");
      }

      // Check if there are any rooms in this category
      const rooms = await db.select().from(chatRooms).where(eq(chatRooms.categoryId, id));
      if (rooms.length > 0) {
        throw new Error("Cannot delete category with chat rooms");
      }

      const result = await db.delete(chatCategories).where(eq(chatCategories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting chat category:', error);
      return false;
    }
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
    const result = await db
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
      .leftJoin(characters, eq(messages.characterId, characters.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Handle narrator messages (characterId = null)
    return result.map(row => ({
      ...row,
      character: row.character && row.character.firstName ? row.character : {
        firstName: 'Vypravěč',
        middleName: null,
        lastName: '',
        avatar: null
      }
    }));
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

  async getLastMessageByCharacter(characterId: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.characterId, characterId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    
    return message;
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
        firstName: request.firstName,
        middleName: request.middleName,
        lastName: request.lastName,
        birthDate: request.birthDate,
        school: request.school,
        description: request.description,
        isActive: true
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
    // Get components from the database with availability settings
    const allComponents = await this.getAllWandComponents();
    
    // Filter components that are available for random selection
    const availableWoods = allComponents.woods.filter(wood => wood.availableForRandom === true);
    const availableCores = allComponents.cores.filter(core => core.availableForRandom === true);
    const availableLengths = allComponents.lengths.filter(length => length.availableForRandom === true);
    const availableFlexibilities = allComponents.flexibilities.filter(flex => flex.availableForRandom === true);
    
    // Ensure we have available components for random selection
    if (availableWoods.length === 0 || availableCores.length === 0 || 
        availableLengths.length === 0 || availableFlexibilities.length === 0) {
      throw new Error("Insufficient components available for random wand generation");
    }
    
    // Generate random selections from available components only
    const randomWood = availableWoods[Math.floor(Math.random() * availableWoods.length)];
    const randomCore = availableCores[Math.floor(Math.random() * availableCores.length)];
    const randomLength = availableLengths[Math.floor(Math.random() * availableLengths.length)];
    const randomFlexibility = availableFlexibilities[Math.floor(Math.random() * availableFlexibilities.length)];

    const description = `Hůlka z ${randomWood.name.toLowerCase()}, ${randomLength.name} dlouhá, ${randomFlexibility.name.toLowerCase()}, s jádrem ${randomCore.name.toLowerCase()}. Vybrána Ollivanderem osobně pro svého nového majitele.`;

    const wandData: InsertWand = {
      characterId,
      wood: randomWood.name,
      core: randomCore.name,
      length: randomLength.name,
      flexibility: randomFlexibility.name,
      description
    };

    return this.createWand(wandData);
  }

  async getAllWandComponents(): Promise<{
    woods: { name: string; shortDescription: string; longDescription: string; availableForRandom?: boolean }[];
    cores: { name: string; category: string; description: string; availableForRandom?: boolean }[];
    lengths: { name: string; description: string; availableForRandom?: boolean }[];
    flexibilities: { name: string; description: string; availableForRandom?: boolean }[];
  }> {
    try {
      // Load all component data from database tables with consistent ordering
      const [woods, cores, lengths, flexibilities] = await Promise.all([
        db.select().from(wandWoods).orderBy(wandWoods.name),
        db.select().from(wandCores).orderBy(wandCores.categorySortOrder, wandCores.name), 
        db.select().from(wandLengths).orderBy(wandLengths.sortOrder),
        db.select().from(wandFlexibilities).orderBy(wandFlexibilities.name)
      ]);

      return {
        woods: woods.map(w => ({
          name: w.name,
          shortDescription: w.shortDescription,
          longDescription: w.longDescription,
          availableForRandom: w.availableForRandom
        })),
        cores: cores.map(c => ({
          name: c.name,
          category: c.category,
          description: c.description,
          availableForRandom: c.availableForRandom
        })),
        lengths: lengths.map(l => ({
          name: l.name,
          description: l.description,
          availableForRandom: l.availableForRandom
        })),
        flexibilities: flexibilities.map(f => ({
          name: f.name,
          description: f.description,
          availableForRandom: f.availableForRandom
        }))
      };
    } catch (error) {
      console.error("Error loading wand components from database:", error);
      // Return empty arrays if database fails
      return {
        woods: [],
        cores: [],
        lengths: [],
        flexibilities: []
      };
    }
  }

  private getDefaultWandComponents(): {
    woods: { name: string; shortDescription: string; longDescription: string; availableForRandom?: boolean }[];
    cores: { name: string; category: string; description: string; availableForRandom?: boolean }[];
    lengths: { name: string; description: string; availableForRandom?: boolean }[];
    flexibilities: { name: string; description: string; availableForRandom?: boolean }[];
  } {
    const woods = [
      { 
        name: "Akácie", 
        shortDescription: "Velmi neobvyklé hůlkové dřevo, z něhož, jak se mi zdá, pochází hůlky tak trochu lstivé a úskočné",
        longDescription: "Velmi neobvyklé hůlkové dřevo, z něhož, jak se mi zdá, pochází hůlky tak trochu lstivé a úskočné, které často odmítnou spolupracovat s kýmkoliv jiným než se svým majitelem a které jsou nejlepší a nejúčinnější v rukou těh nejnadanějších. Tato citlivost je činí obtížně přiřaditelnými, a proto jich mám ve skladu pouze málo pro ty čarodějky a kouzelníky, kteří jsou dostatečně jemní; pro akát se nehodí to, čemu se říká ,bum-a-puf' magie. Pokud najde dobrého majitele, akáciová hůlka může poskytnout hodně energie, avšak nebývá takto často využívána kvůli zvláštnosti jejího temperamentu."
      },
      { 
        name: "Anglický dub", 
        shortDescription: "Silné, věrné dřevo pro odvážné a intuitivní jedince spojené s přírodní magií",
        longDescription: "To jsou hůlky vhodné v časech dobrých i zlých, a jsou věrnými přáteli kouzelníků, kteří si je zaslouží. Hůlky z anglického dubu požadují po svých partnerech sílu, odvahu a věrnost. Méně známý je fakt, že majitelé těchto hůlek mívají silnou intuici a často jsou přitahováni přírodní magií obklopující tvory i rostliny, jež jsou pro kouzelníky nezbytné jak na jejich kouzla, tak pro potěšení. Dub je nazýván králem lesa vládnoucím od zimního do letního slunovratu, a tudíž by jeho dřevo mělo být získáváno pouze v této době (královnou v čase, kdy den začíná znovu ubývat, je cesmína, takže ta by zase měla být sbírána pouze s koncem roku. Z toho možná plyne ona stará pověra: \"když jeho hůlka z dubu a její z cesmíny, vzít se by byl omyl nesmírný\", kteréžto pořekadlo mi osobně připadá jako nesmysl). Říká se, že Merlinova hůlka byla z anglického dubu (ale ježto se jeho hrob nikdy nenašel, nejsou pro to žádné důkazy)."
      },
      { 
        name: "Borovice", 
        shortDescription: "Tiché a nezávislé hůlky pro výjimečně samostatné kouzelníky",
        longDescription: "Hůlka vyrobená z rovnovláknitého dřeva borovice si vždy vybírá ty, kdož jsou nezávislí a samostatní, a bývají považováni za osamělé, zvláštní a možná i tajemné. Borovicové hůlky chtějí být používány kreativně, a na rozdíl od mnohých se bez protestů podvolí novým metodám a zaklínadlům. Mnoho hůlkařů tvrdí, že borovicové hůlky vyhledávají a také odvádějí nejlepší práci majitelům, kteří jsou předurčeni se dožít vysokého věku, a já mohu potvrdit, že jsem ještě nikdy neznal kouzelníka s borovicovou hůlkou, který by zemřel mladý. Borovicová hůlka také patří k těm, které jsou nejvíce vnímavé vůči non-verbálním kouzlům."
      },
      { 
        name: "Buk", 
        shortDescription: "Elegantní a vzácné dřevo pro moudré a tolerantní čaroděje",
        longDescription: "Správný protějšek bukové hůlky bude, pokud mladý, tak na svůj věk moudřejší, pokud dospělý, pak bohatý v porozumění a zkušenostech. Bukové hůlky velmi málo slouží omezeným a netolerantním. Takoví čarodějové a čarodějky, obdržíce bukovou hůlku bez řádného vybrání (prahnouce po této nejvíce žádané, nádherně barevné a velmi drahé hůlce) se poté často objevují na prazích domů zkušených hůlkařů – včetně toho mého – chtíce vědět, proč jejich úžasná hůlka nefunguje pořádně. Pokud však buková hůlka najde toho správného majitele, je schopná jemnosti a umění, které lze velmi zřídka nalézt u jakéhokoliv jiného dřeva, a proto má tak dobrou pověst."
      },
      { 
        name: "Cedr", 
        shortDescription: "Silná a loajální hůlka pro důvtipné a bystré osobnosti s pevným morálním kompasem",
        longDescription: "Kdykoliv se setkám s někým, kdo u sebe nosí hůlku z cedru, najdu u něho silnou osobnost a neobvyklou loajalitu. Můj otec, Žervé Ollivander, vždycky říkával \"Nikdy neoklameš majitele cedrové hůlky.\" A já souhlasím: cedrová hůlka najde dokonalý domov právě tam, kde je důvtip a postřeh. Avšak já bych šel v tomto tvrzení ještě dál než můj otec a dodal bych, že jsem nikdy nepotkal nositele cedrové hůlky, kterého by bylo radno rozzuřit, obzvláště pokud je ublíženo jeho blízkým. Čarodějka nebo čaroděj, kteří byli vybráni hůlkou z cedru, v sobě mají potenciál být nebezpečnými protivníky, což často bývá nepříjemným překvapením pro ty, kteří je lehkomyslně vyzvali k souboji."
      },
      { 
        name: "Cesmína", 
        shortDescription: "Ochranářské dřevo pro vznětlivé osobnosti procházející nebezpečnými duchovními hledáními",
        longDescription: "Cesmína je jedním z vzácnějších hůlkových dřev; jakožto odjakživa považována za ochranářskou, cesmínová hůlka nejraději pracuje s těmi, co bývají vznětliví a mohou potřebovat pomoc při přemáhání hněvu. Zároveň si však vybírají i ty, kteří jsou namočeni v nějakém nebezpečném a často duchovním hledání. Cesmínové dřevo je z těch, jejichž schopnosti se velmi liší v závislosti na jádru hůlky, a je všeobecně velmi těžké skloubit s pařezem fénixe, neboť jejich spojení je neobvyklé a musí se velmi přesně sladit. Když se to ale podaří, se s ničím nevyrovná. Cesmína je jedním z tradičních materiálů používaných při výrobě hůlek a také jedním z nejsvátečnějších. Majitelé: Harry Potter."
      },

      { 
        name: "Cypřiš", 
        shortDescription: "Šlechetná hůlka pro statečné a obětavé duše, které se nebojí čelit temnotě – často spojená s hrdinskou smrtí.",
        longDescription: "Cypřišové hůlky jsou spojovány s urozeností. Hůlky z cypřiše nalézají své partnery v statečných, troufalých a sebeobětavých – v těch, kdo se nebojí čelit stínům v myslích svých i ostatních."
      },
      { 
        name: "Černý bez", 
        shortDescription: "Tajuplná a mimořádně mocná hůlka určená pouze výjimečným kouzelníkům s osudovým posláním – odmítá sloužit komukoliv slabšímu.",
        longDescription: "Je to snad nejneobvyklejší hůlkové dřevo, navíc se o něm říká, že přináší smůlu, a hůlky z něho vyrobené lze velmi těžko ovládnout. Má v sobě velmi silnou magii, ale odmítá zůstat s kýmkoliv, kdo není ve své společnosti nadřazený. Pouze pozoruhodní a výjimeční čarodějové si dokáží bezovou hůlku udržet po delší dobu."
      },
      { 
        name: "Černý ořech", 
        shortDescription: "Velmi vnímavé dřevo, které vyžaduje čaroděje s čistým svědomím a silnou intuicí. Ztrácí sílu, pokud je jeho vlastník neupřímný sám k sobě.",
        longDescription: "Hůlky vyrobené z černého ořechu hledají pána s dobrými instinkty a velkým porozuměním. Má jednu vyslovenou výstřednost, a to že je neobvykle vnímavé vůči vnitřnímu konfliktu, přičemž velmi poklesne jeho síla, pokud se jeho vlastník pokusí o jakýkoliv sebeklam. Nalezne-li upřímného, sebevědomého majitele, stane se z ní jedna z nejvěrnějších a nejpůsobivějších hůlek."
      },
      { 
        name: "Červený dub", 
        shortDescription: "Hůlka rychlých reakcí a bystré mysli, ideální pro kouzelníky se sklony k soubojům a originalitě. Vyžaduje hbitého a přizpůsobivého majitele.",
        longDescription: "O červeném dubu často uslyšíte laickou povídačku, že je spolehlivou známkou horké povahy svého majitele. Ve skutečnosti je ideálním partnerem pro hůlku z červeného dubu ten, kdož oplývá neobvykle rychlými reakcemi, což z ní činí perfektní hůlku pro kouzelnické souboje. Mistr hůlky z červeného dubu má rychlé pohyby, je bystrý a přizpůsobivý."
      },
      { 
        name: "Dřín", 
        shortDescription: "Zlomyslné a hravé dřevo, vhodné pro čaroděje se smyslem pro humor a důvtip. Odmítá neverbální kouzla a je velmi hlučné.",
        longDescription: "Dřín je jeden z mých osobních favoritů, navíc jsem zjistil, že vybírání vlastníka hůlkou z dřínu je vždy velmi zábavné. Dřínové hůlky jsou nepředvídatelné a zlomyslné; mají hravou povahu a hledají partnery, kteří mají smysl pro humor a vzrušení. Zajímavou vlastností hůlek z dřínu je, že odmítají provádět neverbální kouzla a jsou často spíše hlučné."
      },
      { 
        name: "Eben", 
        shortDescription: "Temné a mocné dřevo pro silné individuality, které se drží svých přesvědčení. Výborné pro přeměňování a bojovou magii.",
        longDescription: "Toto temně černé dřevo má působivý vzhled i reputaci, neb se velmi hodí ke všem typům bojové magie a také k přeměňování. Eben nalézá zalíbení v těch, kdo mají odvahu být sami sebou. Nejlepším protějškem ebenové hůlky je ten, kdo se pevně drží svých přesvědčení nehledě na okolní tlak, a kdo se jen tak neodkloní od svých záměrů."
      },
      { 
        name: "Habr", 
        shortDescription: "Věrná hůlka pro čaroděje s jedinou vášní nebo vizí, které se zcela oddají. Rychle přebírá morálku i styl svého majitele.",
        longDescription: "Habrové hůlky si za své životní partnery vybírají talentované čarodějky a čaroděje s jedinou, čirou vášní, kterou by někteří mohli nazvat obsesí (ačkoliv já dávám přednost označení 'vize'), která bude v podstatě vždy naplněna. Habrové hůlky se rychleji než většina ostatních hůlek sžije s majitelovým stylem kouzlení a získá tak vlastní osobnost."
      },
      { 
        name: "Hloh", 
        shortDescription: "Silné a rozporuplné dřevo, vhodné jak pro léčení, tak pro kletby. Vyžaduje zkušeného čaroděje, jinak může být nebezpečné.",
        longDescription: "Hůlky z hlohu bývají velmi vhodné na léčivou magii, ale také jsou vynikající na kletby, a většinou jsem zpozoroval, že si rády vybírají čarodějky a čaroděje složité povahy nebo alespoň ty procházející obdobím vnitřního zmatku. Je složité stát se mistrem hlohové hůlky, a vždycky bych si pořádně rozmyslel, zda ji dát do rukou čarodějce či kouzelníkovi s prokázaným nadáním."
      },
      { 
        name: "Hrušeň", 
        shortDescription: "Zlatavé dřevo pro šlechetné a přívětivé duše, které si zachovává svou krásu a sílu po dlouhá léta. Nikdy nebyla spojena s černou magií.",
        longDescription: "Z tohoto do zlatova zbarveného dřeva se vyrábí hůlky se skvělými magickými schopnostmi, které ze sebe vydají to nejlepší, jsou-li v rukách přívětivých, šlechetných a moudrých čarodějek a kouzelníků. Majitelé hůlek z hrušně jsou, alespoň jak jsem doposud zažil, obvykle velmi oblíbení a respektovaní. Nevím o jediném případě, kdy by byla hrušňová hůlka nalezena ve vlastnictví čarodějky či čaroděje, kteří se dali na cestu černé magie."
      },
      { 
        name: "Jabloň", 
        shortDescription: "Mocné dřevo vhodné pro ty s vysokými cíli a ideály, špatně se hodí pro černou magii. Často umožňuje mluvit s magickými tvory jejich přirozenými jazyky.",
        longDescription: "Jabloňových hůlek se nevyrábí mnoho. Jsou mocné a nejvhodnější pro majitele s vysokými cíli a ideály, proto se toto dřevo špatně používá na černou magii. Tvrdí se, že držitele hůlky z jabloně čeká dlouhý a šťastný život a já jsem si všiml, že zákazníci s velkým osobním kouzlem najdou skvělý protějšek právě v jabloňové hůlce."
      },
      { 
        name: "Jasan", 
        shortDescription: "Hůlky z jasanu pevně přilnou ke svému majiteli a ztrácejí sílu při předání jinému. Vhodné pro tvrdohlavé, statečné, ale ne arogantní kouzelníky.",
        longDescription: "Hůlky vyrobené z jasanu přilnou ke svému pravému mistru a neměli by se tedy darovávat nebo předávat od jejich původního majitele, protože pak ztratí svou sílu a schopnosti. Ty čarodějky a čarodějové, kteří byli vybráni jasanovou hůlkou, většinou nejsou, pokud vím, snadno odklonitelní od svých domněnek a záměrů."
      },
      { 
        name: "Javor", 
        shortDescription: "Vyhledávají je dobrodruzi a cestovatelé, kteří potřebují časté výzvy a změny prostředí. Hůlka s nimi roste a zvyšuje svou sílu.",
        longDescription: "Již mnohokrát jsem zpozoroval, že ti, které si vybrala hůlka z javoru, jsou dobrodruzi a cestovateli od přírody. Javorové hůlky nerady zůstávají doma a mají raději trochu té ambice ve své čarodějce či kouzelníkovi, jinak jejich kouzla težknou a ztrácejí na výraznosti. Čerstvé výzvy a častá změna prostředí tuto hůlku doslova rozzařují."
      },
      { 
        name: "Jedle", 
        shortDescription: "Odolné dřevo, vyžaduje cílevědomé a rozhodné majitele. V rukou nerozhodných se stává slabou.",
        longDescription: "Můj vznešený dědeček, Gerbold Ollivander, vždycky říkal hůlkám z tohoto dřeva \"hůlka přeživších,\" neboť je kdysi prodal třem kouzelníkům, kteří posléze prošli smrtelným nebezpečím bez zkřiveného vlásku. Jedlové hůlky se obzvláště hodí na přeměňování a rády si vybírají vlastníky s cílevědomým, rozhodným, a někdy i poněkud zastrašujícím chováním."
      },
      { 
        name: "Jeřáb", 
        shortDescription: "Výborné pro ochranná kouzla a jasnou mysl, odmítá temnou magii. Hodí se pro čaroděje se šlechetným srdcem.",
        longDescription: "Dřevo z jeřábu bylo vždy pro výrobu hůlek velmi oblíbené, neboť má pověst dřeva mnohem více ochranného než kterékoliv jiné. Ze svých zkušeností vím, že toto dřevo je schopno učinit všechny druhy ochranných kouzel obzvláště silnými a špatně prolomitelnými. Říká se, že žádná čarodějka či kouzelník, kteří se dali na černou magii, nikdy neměli hůlku z jeřábu."
      },
      { 
        name: "Jilm", 
        shortDescription: "Preferuje kouzelníky s důstojností a obratností, dělá málo chyb a vytváří krásná kouzla. Často volí mudlovské rodiny.",
        longDescription: "Nejlepšími partnery jilmových hůlek jsou kouzelníci z mudlovských rodin. Pravdou je, že jilmové hůlky upřednostňují kouzelníky s jistým vzezřením, obratností v magii a určitou přirozenou důstojností. Ze svých zkušeností znám jilm jako dřevo, jež dělá nejméně chyb a hloupých omylů a vyčarovává ta nejkrásnější kouzla a zaříkadla."
      },
      { 
        name: "Kaštan", 
        shortDescription: "Mění charakter podle jádra, hodí se pro bylinkáře, krotitele tvorů a letce. Kombinace s jádrem z jednorožce přitahuje ty, kdo se věnují právu.",
        longDescription: "Toto je nejzajímavější, mnohotvářné dřevo, jehož charakter velmi závisí na jádru hůlky. Hůlky z kaštanu jsou nejvíce přitahovány čarodějkami a čaroději, kteří jsou dobří krotitelé magických zvířat, těmi, kteří jsou zběhlí v bylinkářství, a těmi kdož jsou letci od přírody. Tři nejúspěšnější hlavy Starostolce vlastnily kaštanovou hůlku s jádrem z jednorožce."
      },
      { 
        name: "Lípa stříbřitá", 
        shortDescription: "Atraktivní dřevo oblíbené u jasnovidců a zručných nitrozpytníků, dodává prestiž.",
        longDescription: "Toto neobvyklé a velmi atraktivní dřevo bylo ve středověku velmi oblíbené u jasnovidců a zručných nitrozpytníků, z toho důvodu, že to byla hůlka prestiže. Kde je lípa stříbřitá, tam je i čest. Výjimečné je, že většina majitelů stříbrných lip velmi rychle vyvinula schopnost jasnovidectví."
      },
      { 
        name: "Líska", 
        shortDescription: "Citlivá hůlka, která reaguje na emoce majitele, může ale také absorbovat negativní energii. Má schopnost hledat podzemní vodu.",
        longDescription: "Lísková hůlka je tak citlivá na emoce svého majitele, že často vadne, pokud je někdo předat jiné osobě, i když jen na krátkou dobu. Má také unikátní schopnost absorbovat negativní energii a může být použita k detekci podzemní vody. Líska je obzvláště dobrá na překonávání vlastní povahy majitele."
      },
      { 
        name: "Modřín", 
        shortDescription: "Pevné a odolné dřevo, které vyžaduje odvážného a věrného majitele; hůlky z modřínu často odhalí skryté schopnosti svého držitele.",
        longDescription: "Modřín je jedním z nejpevnějších hůlkových dřev. Vyžaduje odvážného a věrného majitele, který není snadno odrazitelný od svých cílů. Hůlky z modřínu mají pověst, že dokáží odhalit a rozvinout skryté magické schopnosti svého držitele, které ani sám netuší, že má."
      },
      { 
        name: "Olše", 
        shortDescription: "Nepoddajné dřevo, ideální pro nápomocné a ohleduplné kouzelníky; vyniká v non-verbální magii na nejvyšší úrovni.",
        longDescription: "Olše je velmi nepoddajné dřevo, které si vybírá kouzelníky s přirozenou sklony pomáhat ostatním. Je ideální pro nápomocné a ohleduplné čaroděje, kteří si získají jejich respekt nejen svými schopnostmi, ale i charakterem. Vyniká především v non-verbální magii na nejvyšší úrovni."
      },
      { 
        name: "Osika", 
        shortDescription: "Bílé a jemné dřevo, které nejlépe sluší sebevědomým duelantům a bojovým mágům; symbolem odvahy a výzev.",
        longDescription: "Osika je bílé a jemné dřevo, které však v sobě skrývá nečekanou sílu. Nejlépe sluší sebevědomým duelantům a bojovým mágům, kteří se nebojí výzev. Je symbolem odvahy a připravenosti čelit nebezpečí. Hůlky z osiky mají pověst, že povzbuzují svého majitele k odvážným činům."
      },
      { 
        name: "Sekvoj", 
        shortDescription: "Vzácné a štěstí nepřinášející, ale přitahující kouzelníky s neotřelým úsudkem a schopností obrátit neštěstí ve svůj prospěch.",
        longDescription: "Sekvoj je vzácné dřevo, o kterém se říká, že nepřináší štěstí. Přesto přitahuje kouzelníky s neotřelým úsudkem a výjimečnou schopností obrátit zdánlivé neštěstí ve svůj prospěch. Majitelé sekvoje jsou často schopni najít příležitosti tam, kde jiní vidí pouze problémy."
      },
      { 
        name: "Smrk", 
        shortDescription: "Vyžaduje pevnou ruku a smysl pro humor; hůlky ze smrku jsou věrné a skvělé pro okázalou magii, ale nemají rády nervózní povahy.",
        longDescription: "Smrk vyžaduje pevnou ruku a smysl pro humor. Hůlky ze smrku jsou věrné svému majiteli a skvělé pro okázalou magii, ale nemají rády nervózní nebo úzkostlivé povahy. Nejlépe pracují s klidnými a sebejistými kouzelníky, kteří dokáží ocenit jak sílu, tak krásu magie."
      },
      { 
        name: "Sykomora", 
        shortDescription: "Zvědavé a dobrodružné dřevo, které nesnáší nudu; hůlky ze sykomory vzplanou, pokud se jejich majitel nudí.",
        longDescription: "Sykomora je zvědavé a dobrodružné dřevo, které nade vše nesnáší nudu. Hůlky ze sykomory mají pověst, že doslova vzplanou, pokud se jejich majitel nudí nebo se nechá unášet rutinou. Vyhledává aktivní a zvědavé kouzelníky, kteří hledají neustále nové výzvy a dobrodružství."
      },
      { 
        name: "Tis", 
        shortDescription: "Temné a vzácné dřevo, spojující se s mocí nad životem a smrtí; nevybírá bojácné majitele a často se pojí s osudy hrdinů i zlosynů.",
        longDescription: "Tis je temné a vzácné dřevo, které se tradičně spojuje s mocí nad životem a smrtí. Nevybírá si bojácné majitele a často se pojí s osudy významných postav – jak hrdinů, tak zlosynů. Majitelé tisových hůlek jsou obvykle jedinci s výjimečným osudem a silnou vůlí."
      },
      { 
        name: "Topol", 
        shortDescription: "Dřevo spolehlivé a zásadové, pro kouzelníky s jasnou morální vizí; ideální pro ty, kdo věří v pevné hodnoty.",
        longDescription: "Topol je dřevo spolehlivé a zásadové, které si vybírá kouzelníky s jasnou morální vizí a pevnými zásadami. Je ideální pro ty, kdo věří v nezměnné hodnoty a jsou ochotni za ně bojovat. Hůlky z topolu jsou známé svou stálostí a věrností svým přesvědčením."
      },
      { 
        name: "Trnka", 
        shortDescription: "Pevné dřevo pro válečníky a odolné jedince; hůlky z trnky potřebují majitele, kteří prošli těžkostmi, aby se skutečně spojili.",
        longDescription: "Trnka je pevné dřevo určené pro válečníky a odolné jedince. Hůlky z trnky potřebují majitele, kteří prošli životními těžkostmi a prokázali svou sílu v nepřízni osudu, aby se s nimi skutečně spojili. Teprve po takovém spojení odhalí svou plnou moc."
      },
      { 
        name: "Třešeň", 
        shortDescription: "Vzácné a smrtící dřevo, vyhledávané v japonské magii; vyžaduje majitele s pevnou sebekontrolou a silnou myslí.",
        longDescription: "Třešeň je vzácné a potenciálně smrtící dřevo, které je obzvláště vyhledávané v japonské magické tradici. Vyžaduje majitele s mimořádně pevnou sebekontrolou a silnou myslí, protože nezvládnutí jeho síly může mít fatální následky. V rukách zkušeného mága je však nesmírně mocné."
      },
      { 
        name: "Vavřín", 
        shortDescription: "Nezná lenost; věrná hůlka, která dokáže sama sebe bránit a ztrestat zloděje nečekaným bleskem.",
        longDescription: "Vavřín je dřevo, které nezná lenost ani pasivitu. Je to věrná hůlka, která dokáže sama sebe bránit a je schopna ztrestat zloděje nebo nehodného majitele nečekaným bleskem. Vybírá si aktivní a cílevědomé kouzelníky, kteří sdílejí jeho odpor k nečinnosti a lenosti."
      },
      { 
        name: "Vinná réva", 
        shortDescription: "Vinné hůlky si vybírají majitele s hlubokou vnitřní podstatou a představivostí. Jsou citlivé a reagují už při prvním kontaktu – ideální pro ty, kdo hledají smysl a tajemství v magii.",
        longDescription: "Vinné hůlky si vybírají majitele s hlubokou vnitřní podstatou a bohatou představivostí. Jsou mimořádně citlivé a reagují na svého budoucího majitele už při prvním kontaktu. Ideální jsou pro ty kouzelníky, kdo hledají hlubší smysl a tajemství v magii. Věrné jsou pouze těm, kteří nejsou povrchní a dokáží ocenit složitost magického umění."
      },
      { 
        name: "Vlašský ořech", 
        shortDescription: "Ořechové hůlky jsou výzvou i darem pro chytré a inovativní kouzelníky. Požadují inteligenci a odhodlání, ale v rukou správného majitele jsou všestranné a smrtící.",
        longDescription: "Ořechové hůlky představují jak výzvu, tak dar pro chytré a inovativní kouzelníky. Požadují značnou inteligenci a neochvějné odhodlání od svého majitele, ale v rukou správného čaroděje jsou mimořádně všestranné a potenciálně smrtící. Jejich věrnost musí být tvrdě získána, ale jakmile se vytvoří spojení, je nezlomná."
      },
      { 
        name: "Vrba", 
        shortDescription: "Vrba volí nejisté, ale nadějné kouzelníky, kteří se nebojí růstu. Její hůlky vynikají v léčivých a neverbálních kouzlech, reagují na skryté potenciály a podněcují rychlost.",
        longDescription: "Vrba si často vybírá nejisté, ale nadějné kouzelníky, kteří se nebojí osobního růstu a změny. Její hůlky vynikají v léčivých a neverbálních kouzlech, mají schopnost reagovat na skryté potenciály svého majitele a dokáží podnítit rychlost reakcí i v nejtěžších chvílích. Vrba podporuje ty, kdo jsou ochotni se učit a vyvíjet."
      }
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

    const lengths = [
      { name: "7\"", description: "Kratší hůlka, obvykle vybírá čaroděje s menším vzrůstem nebo ty, kdo preferují diskrétní magii." },
      { name: "8\"", description: "Kompaktní délka ideální pro rychlé reakce a městskou magii. Snadno se skrývá a manipuluje." },
      { name: "9\"", description: "Vyvážená kratší délka vhodná pro jemné a přesné kouzla. Oblíbená u mladších čarodějů." },
      { name: "10\"", description: "Klasická délka poskytující dobrý poměr mezi kontrolou a silou. Vhodná pro většinu čarodějů." },
      { name: "11\"", description: "Vyvážená hůlka s výbornou univerzálností. Populární volba pro studenty i zkušené mistry." },
      { name: "12\"", description: "Standardní délka nabízející stabilitu a spolehlivost. Ideální pro formální magii a výuku." },
      { name: "13\"", description: "Pro ty, kteří mají neobyčejný potenciál nebo extrémní specializaci." },
      { name: "14\"", description: "Dlouhá hůlka, vhodná pro formální, velkolepou nebo rituální magii." },
      { name: "15\"", description: "Rarita – vyžaduje silné zaměření, ale odmění velkým dosahem a účinkem." },
      { name: "16\"+", description: "Neobvyklá až výstřední délka. Obvykle jen u obrů, divotvůrců nebo výjimečných osobností." }
    ];

    const flexibilities = [
      { name: "Nezlomná", description: "Extrémně pevná a nepoddajná hůlka. Vhodná pro čaroděje s velmi silnou vůlí a nekompromisní povahou." },
      { name: "Velmi nepoddajná", description: "Tvrdá hůlka vyžadující rozhodného majitele. Ideální pro ty, kdo preferují přímočaré a silné kouzla." },
      { name: "Nepoddajná", description: "Pevná hůlka pro stabilní a spolehlivé čaroděje. Dobře drží tvar kouzel a odolává změnám." },
      { name: "Mírně nepoddajná", description: "Lehce tužší hůlka nabízející dobrou kontrolu. Vhodná pro přesné a metodické čaroděje." },
      { name: "Pevná", description: "Vyvážená ohebnost poskytující jak stabilitu, tak flexibilitu. Univerzální volba pro většinu kouzelníků." },
      { name: "Tvrdá", description: "Poměrně pevná hůlka s dobrou odezvou. Ideální pro tradiční a formální magii." },
      { name: "Ohebná", description: "Flexibilní hůlka přizpůsobující se stylu majitele. Vhodná pro kreativní a adaptabilní čaroděje." },
      { name: "Pružná", description: "Velmi ohebná hůlka podporující inovativní kouzla. Preferuje experimentální a originální přístupy." },
      { name: "Velmi pružná", description: "Extrémně flexibilní hůlka pro čaroděje s proměnlivou povahou. Vynikající pro improvisaci." },
      { name: "Výjimečně poddajná", description: "Mimořádně ohebná hůlka pro ty nejvíce přizpůsobivé kouzelníky. Reaguje na nejjemnější pohyby." },
      { name: "Vrbovitá", description: "Nejvíce poddajná možná ohebnost. Hůlka se téměř ohýbá s myšlenkami majitele, vyžaduje delikatní přístup." }
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
            value: 7, // 7 galleons for a wand
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

  private storedWandComponents: {
    woods: { name: string; shortDescription: string; longDescription: string }[];
    cores: { name: string; category: string; description: string }[];
    lengths: { name: string; description: string }[];
    flexibilities: { name: string; description: string }[];
  } | null = null;

  async updateWandComponents(components: {
    woods: { name: string; shortDescription: string; longDescription: string; availableForRandom?: boolean }[];
    cores: { name: string; category: string; description: string; availableForRandom?: boolean }[];
    lengths: { name: string; description: string; availableForRandom?: boolean }[];
    flexibilities: { name: string; description: string; availableForRandom?: boolean }[];
  }): Promise<void> {
    try {
      // Update each component type in their respective database tables
      
      // Update woods
      for (const wood of components.woods) {
        await db.update(wandWoods)
          .set({
            shortDescription: wood.shortDescription,
            longDescription: wood.longDescription,
            availableForRandom: wood.availableForRandom !== false
          })
          .where(eq(wandWoods.name, wood.name));
      }

      // Update cores
      for (const core of components.cores) {
        await db.update(wandCores)
          .set({
            category: core.category,
            description: core.description,
            availableForRandom: core.availableForRandom !== false
          })
          .where(eq(wandCores.name, core.name));
      }

      // Update lengths
      for (const length of components.lengths) {
        await db.update(wandLengths)
          .set({
            description: length.description,
            availableForRandom: length.availableForRandom !== false
          })
          .where(eq(wandLengths.name, length.name));
      }

      // Update flexibilities
      for (const flexibility of components.flexibilities) {
        await db.update(wandFlexibilities)
          .set({
            description: flexibility.description,
            availableForRandom: flexibility.availableForRandom !== false
          })
          .where(eq(wandFlexibilities.name, flexibility.name));
      }

      console.log("Wand components updated in database tables successfully");
    } catch (error) {
      console.error("Error updating wand components in database:", error);
      throw error;
    }
  }

  // Housing request operations
  async createHousingRequest(request: InsertHousingRequest): Promise<HousingRequest> {
    const [newRequest] = await db
      .insert(housingRequests)
      .values({
        ...request,
        status: 'pending',
        createdAt: new Date()
      })
      .returning();
    return newRequest;
  }

  async getHousingRequestsByUserId(userId: number): Promise<HousingRequest[]> {
    return db
      .select({
        id: housingRequests.id,
        userId: housingRequests.userId,
        characterId: housingRequests.characterId,
        requestType: housingRequests.requestType,
        size: housingRequests.size,
        location: housingRequests.location,
        customLocation: housingRequests.customLocation,
        selectedArea: housingRequests.selectedArea,
        description: housingRequests.description,
        housingName: housingRequests.housingName,
        housingPassword: housingRequests.housingPassword,
        status: housingRequests.status,
        assignedAddress: housingRequests.assignedAddress,
        reviewNote: housingRequests.reviewNote,
        createdAt: housingRequests.createdAt,
        reviewedAt: housingRequests.reviewedAt,
        reviewedBy: housingRequests.reviewedBy,
        character: {
          firstName: characters.firstName,
          lastName: characters.lastName,
        },
      })
      .from(housingRequests)
      .innerJoin(characters, eq(housingRequests.characterId, characters.id))
      .where(eq(housingRequests.userId, userId))
      .orderBy(desc(housingRequests.createdAt));
  }

  async getHousingRequestById(requestId: number): Promise<HousingRequest | undefined> {
    const [request] = await db
      .select()
      .from(housingRequests)
      .where(eq(housingRequests.id, requestId));
    return request;
  }

  async deleteHousingRequest(requestId: number): Promise<boolean> {
    const result = await db
      .delete(housingRequests)
      .where(eq(housingRequests.id, requestId));
    return (result.rowCount ?? 0) > 0;
  }

  async getPendingHousingRequests(): Promise<(HousingRequest & { 
    user: { username: string; email: string }; 
    character: { firstName: string; middleName?: string | null; lastName: string } 
  })[]> {
    return db
      .select({
        id: housingRequests.id,
        userId: housingRequests.userId,
        characterId: housingRequests.characterId,
        requestType: housingRequests.requestType,
        size: housingRequests.size,
        location: housingRequests.location,
        customLocation: housingRequests.customLocation,
        selectedArea: housingRequests.selectedArea,
        description: housingRequests.description,
        housingName: housingRequests.housingName,
        housingPassword: housingRequests.housingPassword,
        status: housingRequests.status,
        assignedAddress: housingRequests.assignedAddress,
        reviewNote: housingRequests.reviewNote,
        createdAt: housingRequests.createdAt,
        reviewedAt: housingRequests.reviewedAt,
        reviewedBy: housingRequests.reviewedBy,
        user: {
          username: users.username,
          email: users.email,
        },
        character: {
          firstName: characters.firstName,
          middleName: characters.middleName,
          lastName: characters.lastName,
        },
      })
      .from(housingRequests)
      .innerJoin(users, eq(housingRequests.userId, users.id))
      .innerJoin(characters, eq(housingRequests.characterId, characters.id))
      .where(eq(housingRequests.status, 'pending'))
      .orderBy(desc(housingRequests.createdAt));
  }

  async approveHousingRequest(requestId: number, adminId: number, assignedAddress: string, reviewNote?: string): Promise<HousingRequest> {
    // First, get the housing request to access character information
    const [request] = await db
      .select()
      .from(housingRequests)
      .where(eq(housingRequests.id, requestId));

    if (!request) {
      throw new Error('Housing request not found');
    }

    // Get character information for the chat room
    const character = await this.getCharacter(request.characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Update the housing request to approved status
    const [updatedRequest] = await db
      .update(housingRequests)
      .set({
        status: 'approved',
        assignedAddress,
        reviewNote,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      })
      .where(eq(housingRequests.id, requestId))
      .returning();

    // Update the character's residence field
    await db
      .update(characters)
      .set({
        residence: assignedAddress,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, request.characterId));

    // Create chat room for the housing if it has a name and password
    if (request.housingName && request.housingPassword) {
      let targetCategory;
      
      // If selectedArea is specified, try to find that category first
      if (request.selectedArea) {
        targetCategory = await this.getChatCategoryByName(request.selectedArea);
      }
      
      // If no area was selected or area category not found, use default "Bydlení" category
      if (!targetCategory) {
        targetCategory = await this.getChatCategoryByName("Bydlení");
        
        // If no housing category exists, create one
        if (!targetCategory) {
          targetCategory = await this.createChatCategory({
            name: "Bydlení",
            description: "Soukromá bydlení a sídla",
            sortOrder: 100
          });
        }
      }

      // Create proper description based on housing type and size
      let roomDescription = `${this.getHousingTypeDescription(request.requestType)}`;
      if (request.size) {
        roomDescription += ` ${request.size}`;
      }
      roomDescription += ` - ${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`;
      
      let longDescription = `**INFORMACE O BYDLENÍ**\n\n`;
      longDescription += `📍 **Adresa:** ${assignedAddress}\n`;
      longDescription += `🏠 **Typ:** ${this.getHousingTypeDescription(request.requestType)}\n`;
      if (request.size) {
        longDescription += `📏 **Velikost:** ${request.size}\n`;
      }
      longDescription += `👥 **Vlastník:** ${character.firstName} ${character.middleName ? character.middleName + ' ' : ''}${character.lastName}\n`;
      longDescription += `📅 **Přiděleno:** ${new Date().toLocaleDateString('cs-CZ')}\n\n`;
      longDescription += `**POPIS:**\n${request.description}`;

      await this.createChatRoom({
        name: request.housingName,
        description: roomDescription,
        longDescription: longDescription,
        categoryId: targetCategory.id,
        password: request.housingPassword,
        isPublic: false, // Housing rooms require password for entry
        sortOrder: 0
      });
    }

    // Send automatic message from "Ubytovací správa" (character ID 11)
    const housingAdminCharacterId = 11;
    let approvalMessage = `Vážený/á ${character.firstName} ${character.lastName},\n\n`;
    approvalMessage += `Vaše žádost o bydlení byla schválena!\n\n`;
    approvalMessage += `📍 **Přidělená adresa:** ${assignedAddress}\n`;
    approvalMessage += `🏠 **Typ bydlení:** ${this.getHousingTypeDescription(request.requestType)}\n`;
    if (request.size) {
      approvalMessage += `📏 **Velikost:** ${request.size}\n`;
    }
    if (request.housingName) {
      approvalMessage += `🏡 **Název:** ${request.housingName}\n`;
      approvalMessage += `🔑 **Vytvořena chat místnost** pro vaše bydlení\n`;
    }
    approvalMessage += `\nAdresa byla přidána do vašeho profilu postavy.\n\n`;
    if (reviewNote) {
      approvalMessage += `**Poznámka správy:** ${reviewNote}\n\n`;
    }
    approvalMessage += `S přátelskými pozdravy,\nUbytovací správa`;

    // Create owl post message
    await db.insert(owlPostMessages).values({
      senderCharacterId: housingAdminCharacterId,
      recipientCharacterId: request.characterId,
      subject: "Schválení žádosti o bydlení",
      content: approvalMessage,
      isRead: false,
    });

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "approve_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Approved housing request for ${request.requestType} at ${assignedAddress}. ${reviewNote ? `Note: ${reviewNote}` : ''}${request.housingName ? ` Created chat room: ${request.housingName}` : ''}`,
    });

    return updatedRequest;
  }

  private getHousingTypeDescription(requestType: string): string {
    switch (requestType) {
      case 'apartment': return 'Byt';
      case 'house': return 'Dům';
      case 'mansion': return 'Sídlo/Vila';
      case 'dormitory': return 'Pokoj na ubytovně';
      case 'shared': return 'Sdílené bydlení';
      default: return requestType;
    }
  }

  async rejectHousingRequest(requestId: number, adminId: number, reviewNote: string): Promise<HousingRequest> {
    // First, get the housing request to access user information
    const [request] = await db
      .select()
      .from(housingRequests)
      .where(eq(housingRequests.id, requestId));

    if (!request) {
      throw new Error('Housing request not found');
    }

    // Update the housing request to rejected status
    const [updatedRequest] = await db
      .update(housingRequests)
      .set({
        status: 'rejected',
        reviewNote,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      })
      .where(eq(housingRequests.id, requestId))
      .returning();

    // Get character information for the message
    const character = await this.getCharacter(request.characterId);
    if (character) {
      // Send automatic message from "Ubytovací správa" (character ID 11)
      const housingAdminCharacterId = 11;
      let rejectionMessage = `Vážený/á ${character.firstName} ${character.lastName},\n\n`;
      rejectionMessage += `Bohužel musíme zamítnout vaši žádost o bydlení.\n\n`;
      rejectionMessage += `🏠 **Typ žádosti:** ${this.getHousingTypeDescription(request.requestType)}\n`;
      if (request.size) {
        rejectionMessage += `📏 **Velikost:** ${request.size}\n`;
      }
      rejectionMessage += `📍 **Lokace:** ${request.location}\n\n`;
      rejectionMessage += `**Důvod zamítnutí:** ${reviewNote}\n\n`;
      rejectionMessage += `Můžete podat novou žádost s upravenými požadavky.\n\n`;
      rejectionMessage += `S přátelskými pozdravy,\nUbytovací správa`;

      // Create owl post message
      await db.insert(owlPostMessages).values({
        senderCharacterId: housingAdminCharacterId,
        recipientCharacterId: request.characterId,
        subject: "Zamítnutí žádosti o bydlení",
        content: rejectionMessage,
        isRead: false,
      });
    }

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "reject_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Rejected housing request for ${request.requestType}. Reason: ${reviewNote}`,
    });

    return updatedRequest;
  }

  async returnHousingRequest(requestId: number, adminId: number, reviewNote: string): Promise<HousingRequest> {
    // First, get the housing request to access user information
    const [request] = await db
      .select()
      .from(housingRequests)
      .where(eq(housingRequests.id, requestId));

    if (!request) {
      throw new Error('Housing request not found');
    }

    // Update the housing request to returned status (pending for revision)
    const [updatedRequest] = await db
      .update(housingRequests)
      .set({
        status: 'returned',
        reviewNote,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      })
      .where(eq(housingRequests.id, requestId))
      .returning();

    // Log admin activity
    await this.logAdminActivity({
      adminId,
      action: "return_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Returned housing request for ${request.requestType} for revision. Note: ${reviewNote}`,
    });

    return updatedRequest;
  }

  // Owl Post Messages operations
  async sendOwlPostMessage(message: InsertOwlPostMessage): Promise<OwlPostMessage> {
    const [newMessage] = await db.insert(owlPostMessages).values(message).returning();
    return newMessage;
  }

  async getOwlPostInbox(characterId: number, limit: number = 50, offset: number = 0): Promise<(OwlPostMessage & { sender: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    return db
      .select({
        id: owlPostMessages.id,
        senderCharacterId: owlPostMessages.senderCharacterId,
        recipientCharacterId: owlPostMessages.recipientCharacterId,
        subject: owlPostMessages.subject,
        content: owlPostMessages.content,
        isRead: owlPostMessages.isRead,
        sentAt: owlPostMessages.sentAt,
        readAt: owlPostMessages.readAt,
        sender: {
          firstName: characters.firstName,
          middleName: characters.middleName,
          lastName: characters.lastName,
        },
      })
      .from(owlPostMessages)
      .innerJoin(characters, eq(owlPostMessages.senderCharacterId, characters.id))
      .where(eq(owlPostMessages.recipientCharacterId, characterId))
      .orderBy(desc(owlPostMessages.sentAt))
      .limit(limit)
      .offset(offset);
  }

  async getOwlPostSent(characterId: number, limit: number = 50, offset: number = 0): Promise<(OwlPostMessage & { recipient: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    return db
      .select({
        id: owlPostMessages.id,
        senderCharacterId: owlPostMessages.senderCharacterId,
        recipientCharacterId: owlPostMessages.recipientCharacterId,
        subject: owlPostMessages.subject,
        content: owlPostMessages.content,
        isRead: owlPostMessages.isRead,
        sentAt: owlPostMessages.sentAt,
        readAt: owlPostMessages.readAt,
        recipient: {
          firstName: characters.firstName,
          middleName: characters.middleName,
          lastName: characters.lastName,
        },
      })
      .from(owlPostMessages)
      .innerJoin(characters, eq(owlPostMessages.recipientCharacterId, characters.id))
      .where(eq(owlPostMessages.senderCharacterId, characterId))
      .orderBy(desc(owlPostMessages.sentAt))
      .limit(limit)
      .offset(offset);
  }

  async getOwlPostMessage(messageId: number): Promise<OwlPostMessage | undefined> {
    const [message] = await db
      .select()
      .from(owlPostMessages)
      .where(eq(owlPostMessages.id, messageId));
    return message;
  }

  async deleteOwlPostMessage(messageId: number): Promise<boolean> {
    const result = await db
      .delete(owlPostMessages)
      .where(eq(owlPostMessages.id, messageId));
    return (result.rowCount || 0) > 0;
  }

  async markOwlPostAsRead(messageId: number): Promise<void> {
    await db
      .update(owlPostMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(owlPostMessages.id, messageId));
  }

  async getUnreadOwlPostCount(characterId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(owlPostMessages)
      .where(and(
        eq(owlPostMessages.recipientCharacterId, characterId),
        eq(owlPostMessages.isRead, false)
      ));
    return result.count;
  }

  async getAllCharactersForOwlPost(): Promise<Character[]> {
    return db
      .select()
      .from(characters)
      .where(eq(characters.isActive, true))
      .orderBy(characters.firstName, characters.lastName);
  }

  // Influence operations
  async getInfluenceBar(): Promise<{ grindelwaldPoints: number; dumbledorePoints: number }> {
    const [result] = await db.select().from(influenceBar).limit(1);
    return {
      grindelwaldPoints: result?.grindelwaldPoints || 50,
      dumbledorePoints: result?.dumbledorePoints || 50
    };
  }

  async getInfluenceHistory(): Promise<any[]> {
    try {
      // Use raw query since table structure doesn't match schema
      const result = await db.execute({
        sql: `SELECT id, change_type, points_changed, previous_total, new_total, reason, admin_id, created_at
              FROM influence_history 
              ORDER BY created_at DESC 
              LIMIT 50`,
        args: []
      });
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching influence history:', error);
      return [];
    }
  }

  async adjustInfluence(side: 'grindelwald' | 'dumbledore', points: number, userId: number): Promise<void> {
    const currentData = await this.getInfluenceBar();
    const newGrindelwaldPoints = side === 'grindelwald' 
      ? Math.max(0, currentData.grindelwaldPoints + points)
      : currentData.grindelwaldPoints;
    const newDumbledorePoints = side === 'dumbledore'
      ? Math.max(0, currentData.dumbledorePoints + points)
      : currentData.dumbledorePoints;

    await this.setInfluence(newGrindelwaldPoints, newDumbledorePoints, userId);
  }

  async setInfluence(grindelwaldPoints: number, dumbledorePoints: number, userId: number): Promise<void> {
    // Update influence bar
    await db
      .update(influenceBar)
      .set({
        grindelwaldPoints,
        dumbledorePoints,
        lastUpdated: new Date(),
        updatedBy: userId
      })
      .where(eq(influenceBar.id, 1));

    // Log the change in history
    await db.insert(influenceHistory).values({
      grindelwaldPoints,
      dumbledorePoints,
      changeBy: userId,
      reason: 'Admin adjustment'
    });
  }
}

export const storage = new DatabaseStorage();