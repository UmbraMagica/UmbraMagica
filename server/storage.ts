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
} from "../shared/schema";
import bcrypt from "bcrypt";
import { supabase } from './supabaseClient';

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
  getMessagesByRoom(roomId: number, limit?: number, offset?: number): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string; avatar?: string | null } })[]>;
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
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return undefined;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return undefined;
    return data;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase.from('users').insert([{ ...insertUser, updatedAt: new Date() }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ role, updatedAt: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async updateUserNarratorPermission(id: number, canNarrate: boolean): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ canNarrate, updatedAt: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async getAllUsers(includeSystem = false): Promise<User[]> {
    let query = supabase.from('users').select('*');
    if (!includeSystem) {
      query = query.eq('is_system', false);
    }
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  async banUser(id: number, banReason: string): Promise<void> {
    await supabase.from('users').update({ isBanned: true, banReason, bannedAt: new Date() }).eq('id', id);
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<void> {
    await supabase.from('users').update({ password: hashedPassword }).eq('id', id);
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await supabase.from('users').update({ password: hashedPassword, updatedAt: new Date() }).eq('id', id);
  }

  async updateUserEmail(id: number, email: string): Promise<void> {
    await supabase.from('users').update({ email, updatedAt: new Date() }).eq('id', id);
  }

  async updateUserSettings(id: number, settings: { characterOrder?: string; highlightWords?: string; highlightColor?: string; narratorColor?: string }): Promise<void> {
    await supabase.from('users').update({ ...settings, updatedAt: new Date() }).eq('id', id);
  }

  async updateUserNarratorPermissions(id: number, canNarrate: boolean): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ canNarrate, updatedAt: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    const { data, error } = await supabase.from('characters').select('*').eq('userId', userId).order('createdAt', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const { data, error } = await supabase.from('characters').insert([{ ...insertCharacter, updatedAt: new Date() }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined> {
    const { data, error } = await supabase.from('characters').update({ ...updates, updatedAt: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async getCharacterByName(firstName: string, lastName: string): Promise<Character | undefined> {
    const { data, error } = await supabase.from('characters').select('*').eq('firstName', firstName).eq('lastName', lastName).single();
    if (error) return undefined;
    return data;
  }

  // Authentication and invite codes remain same...
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const { data, error } = await supabase.from('inviteCodes').select('*').eq('code', code).single();
    if (error) return undefined;
    return data;
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    const { data, error } = await supabase.from('inviteCodes').select('*').order('createdAt', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async createInviteCode(insertInviteCode: InsertInviteCode): Promise<InviteCode> {
    const { data, error } = await supabase.from('inviteCodes').insert([insertInviteCode]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async useInviteCode(code: string, userId: number): Promise<boolean> {
    const { error } = await supabase.from('inviteCodes').update({ isUsed: true, usedBy: userId, usedAt: new Date() }).eq('code', code);
    return !error;
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
    const { data, error } = await supabase.from('chatRooms').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    const { data, error } = await supabase.from('chatRooms').select('*').eq('name', name).single();
    if (error) return undefined;
    return data;
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const { data, error } = await supabase.from('chatRooms').insert([insertChatRoom]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateChatRoom(id: number, updates: Partial<InsertChatRoom>): Promise<ChatRoom | undefined> {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    const { data, error } = await supabase.from('chatRooms').update({ ...updates, updatedAt: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteChatRoom(id: number): Promise<boolean> {
    // Smažeme nejdřív zprávy v místnosti, pak místnost samotnou
    await supabase.from('messages').delete().eq('roomId', id);
    const { error } = await supabase.from('chatRooms').delete().eq('id', id);
    return !error;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chatRooms').select('*').order('sortOrder', { ascending: true });
    if (error) return [];
    return data || [];
  }

  async getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chatRooms').select('*').eq('categoryId', categoryId).order('sortOrder', { ascending: true });
    if (error) return [];
    return data || [];
  }

  async validateRoomPassword(roomId: number, password: string): Promise<boolean> {
    const room = await this.getChatRoom(roomId);
    if (!room) return false;
    if (!room.password) return true;
    return bcrypt.compare(password, room.password);
  }

  async updateChatCategorySortOrder(id: number, sortOrder: number): Promise<ChatCategory | undefined> {
    const { data, error } = await supabase.from('chatCategories').update({ sortOrder }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async updateChatRoomSortOrder(id: number, sortOrder: number): Promise<ChatRoom | undefined> {
    const { data, error } = await supabase.from('chatRooms').update({ sortOrder }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async getChatCategory(id: number): Promise<ChatCategory | undefined> {
    const { data, error } = await supabase.from('chatCategories').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getChatCategoryByName(name: string): Promise<ChatCategory | undefined> {
    const { data, error } = await supabase.from('chatCategories').select('*').eq('name', name).single();
    if (error) return undefined;
    return data;
  }

  async createChatCategory(insertChatCategory: InsertChatCategory): Promise<ChatCategory> {
    const { data, error } = await supabase.from('chatCategories').insert([insertChatCategory]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateChatCategory(id: number, updates: Partial<InsertChatCategory>): Promise<ChatCategory | undefined> {
    const { data, error } = await supabase.from('chatCategories').update(updates).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteChatCategory(id: number): Promise<boolean> {
    // Zkontrolujeme, jestli má podkategorie nebo místnosti
    const { data: children } = await supabase.from('chatCategories').select('id').eq('parentId', id);
    if (children && children.length > 0) return false;
    const { data: rooms } = await supabase.from('chatRooms').select('id').eq('categoryId', id);
    if (rooms && rooms.length > 0) return false;
    const { error } = await supabase.from('chatCategories').delete().eq('id', id);
    return !error;
  }

  async getAllChatCategories(): Promise<ChatCategory[]> {
    const { data, error } = await supabase.from('chatCategories').select('*').order('sortOrder', { ascending: true });
    if (error) return [];
    return data || [];
  }

  async getChatCategoriesWithChildren(): Promise<(ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[]> {
    // Supabase neumí joiny, takže načteme vše a spojíme v JS
    const { data: categories, error } = await supabase.from('chatCategories').select('*').order('sortOrder', { ascending: true });
    if (error || !categories) return [];
    const { data: rooms } = await supabase.from('chatRooms').select('*');
    const byParent: Record<number, ChatCategory[]> = {};
    for (const cat of categories) {
      if (cat.parentId) {
        if (!byParent[cat.parentId]) byParent[cat.parentId] = [];
        byParent[cat.parentId].push(cat);
      }
    }
    return categories.map(cat => ({
      ...cat,
      children: byParent[cat.id] || [],
      rooms: (rooms || []).filter(r => r.categoryId === cat.id)
    }));
  }

  // Message operations (keeping existing)
  async getMessage(id: number): Promise<Message | undefined> {
    const { data, error } = await supabase.from('messages').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getMessagesByRoom(roomId: number, limit: number = 50, offset: number = 0): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string; avatar?: string | null } })[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('roomId', roomId).order('createdAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return data || [];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert([insertMessage]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    return !error;
  }

  async updateMessageCharacter(messageId: number, characterId: number): Promise<void> {
    await supabase.from('messages').update({ characterId }).eq('id', messageId);
  }

  // Archive operations (keeping existing)
  async archiveMessages(roomId: number, beforeDate?: Date): Promise<number> {
    // Supabase neumí server-side archivaci, takže by to mělo být řešeno jinak (např. přes funkci v backendu)
    // Zde pouze příklad: přesunout zprávy do archivedMessages a smazat je z messages
    const { data: messages, error } = await supabase.from('messages').select('*').eq('roomId', roomId).lt('createdAt', beforeDate ? beforeDate.toISOString() : new Date().toISOString());
    if (error || !messages) return 0;
    for (const msg of messages) {
      await supabase.from('archivedMessages').insert([{
        originalMessageId: msg.id,
        roomId: msg.roomId,
        characterId: msg.characterId,
        characterName: '', // Pokud potřebuješ, doplň jméno postavy
        content: msg.content,
        messageType: msg.messageType,
        originalCreatedAt: msg.createdAt,
        archivedAt: new Date().toISOString(),
      }]);
      await supabase.from('messages').delete().eq('id', msg.id);
    }
    return messages.length;
  }

  async getArchivedMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<ArchivedMessage[]> {
    const { data, error } = await supabase.from('archivedMessages').select('*').eq('roomId', roomId).order('archivedAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return data || [];
  }

  async deleteAllMessages(): Promise<void> {
    await supabase.from('messages').delete();
    await supabase.from('archivedMessages').delete();
  }

  async clearRoomMessages(roomId: number): Promise<number> {
    const deleteResult = await supabase.from('messages').delete().eq('roomId', roomId);
    return deleteResult.rowCount || 0;
  }

  async getArchiveDates(roomId: number): Promise<string[]> {
    const dates = await supabase.from('archivedMessages').selectDistinct({ archivedAt: 'archivedAt' }).eq('roomId', roomId).orderBy('archivedAt', { ascending: false });
    return dates.map(d => d.archivedAt.toISOString().split('T')[0]);
  }

  async getArchiveDatesWithCounts(roomId: number): Promise<{ date: string; count: number }[]> {
    const result = await supabase.from('archivedMessages').select({
      archivedAt: 'archivedAt',
      count: 'count'
    }).eq('roomId', roomId).groupBy('archivedAt').orderBy('archivedAt', { ascending: false });
    return result.map(r => ({
      date: r.archivedAt.toISOString().split('T')[0],
      count: Number(r.count)
    }));
  }

  async getArchivedMessagesByDate(roomId: number, archiveDate: string, limit: number = 50, offset: number = 0): Promise<ArchivedMessage[]> {
    const startDate = new Date(archiveDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return supabase.from('archivedMessages').select('*').eq('roomId', roomId).gte('archivedAt', startDate).lt('archivedAt', endDate).order('originalCreatedAt', { ascending: false }).range(offset, offset + limit - 1);
  }

  async getLastMessageByCharacter(characterId: number): Promise<Message | undefined> {
    const [message] = await supabase.from('messages').select('*').eq('characterId', characterId).orderBy('createdAt', { ascending: false }).limit(1);
    return message;
  }

  // Character request operations
  async createCharacterRequest(request: InsertCharacterRequest): Promise<CharacterRequest> {
    const { data, error } = await supabase.from('characterRequests').insert([request]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getCharacterRequestsByUserId(userId: number): Promise<CharacterRequest[]> {
    const { data, error } = await supabase.from('characterRequests').select('*').eq('userId', userId);
    if (error) return [];
    return data || [];
  }

  async getCharacterRequestById(requestId: number): Promise<CharacterRequest | undefined> {
    const { data, error } = await supabase.from('characterRequests').select('*').eq('id', requestId).single();
    if (error) return undefined;
    return data;
  }

  async deleteCharacterRequest(requestId: number): Promise<boolean> {
    const { error } = await supabase.from('characterRequests').delete().eq('id', requestId);
    return !error;
  }

  async getAllCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
    // Supabase neumí joiny, takže načteme vše a spojíme v JS
    const { data: requests, error } = await supabase.from('characterRequests').select('*');
    if (error || !requests) return [];
    const { data: usersData } = await supabase.from('users').select('id,username,email');
    return requests.map(r => ({
      ...r,
      user: usersData?.find(u => u.id === r.userId) || { username: '', email: '' }
    }));
  }

  async getPendingCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
    const { data: requests, error } = await supabase.from('characterRequests').select('*').eq('status', 'pending');
    if (error || !requests) return [];
    const { data: usersData } = await supabase.from('users').select('id,username,email');
    return requests.map(r => ({
      ...r,
      user: usersData?.find(u => u.id === r.userId) || { username: '', email: '' }
    }));
  }

  async approveCharacterRequest(requestId: number, adminId: number, reviewNote?: string): Promise<Character> {
    // Změníme status requestu a vytvoříme postavu
    const { data: request, error } = await supabase.from('characterRequests').select('*').eq('id', requestId).single();
    if (error || !request) throw new Error('Request not found');
    await supabase.from('characterRequests').update({ status: 'approved', reviewedBy: adminId, reviewedAt: new Date().toISOString(), reviewNote }).eq('id', requestId);
    const { data: character, error: charError } = await supabase.from('characters').insert([{
      userId: request.userId,
      firstName: request.firstName,
      middleName: request.middleName,
      lastName: request.lastName,
      birthDate: request.birthDate,
      school: request.school,
      description: request.description,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]).select().single();
    if (charError) throw new Error(charError.message);
    await this.logAdminActivity({
      adminId,
      action: 'approve_character',
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Approved character request: ${request.firstName} ${request.lastName}`
    });
    return character;
  }

  async rejectCharacterRequest(requestId: number, adminId: number, reviewNote: string): Promise<CharacterRequest> {
    const { data: request, error } = await supabase.from('characterRequests').select('*').eq('id', requestId).single();
    if (error || !request) throw new Error('Request not found');
    await supabase.from('characterRequests').update({ status: 'rejected', reviewedBy: adminId, reviewedAt: new Date().toISOString(), reviewNote }).eq('id', requestId);
    await this.logAdminActivity({
      adminId,
      action: 'reject_character',
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Rejected character request: ${request.firstName} ${request.lastName}`
    });
    return { ...request, status: 'rejected', reviewNote };
  }

  // Admin activity log operations
  async logAdminActivity(activity: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const { data, error } = await supabase.from('adminActivityLog').insert([activity]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getAdminActivityLog(limit: number = 50, offset: number = 0): Promise<(AdminActivityLog & { admin: { username: string }; targetUser?: { username: string } })[]> {
    // Supabase neumí joiny, takže načteme vše a spojíme v JS
    const { data: logs, error } = await supabase.from('adminActivityLog').select('*').order('createdAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error || !logs) return [];
    const { data: usersData } = await supabase.from('users').select('id,username');
    return logs.map(l => ({
      ...l,
      admin: usersData?.find(u => u.id === l.adminId) || { username: '' },
      targetUser: l.targetUserId ? (usersData?.find(u => u.id === l.targetUserId) || { username: '' }) : undefined
    }));
  }

  // Multi-character operations


  // Cemetery operations
  async killCharacter(characterId: number, deathReason: string, adminId: number): Promise<Character | undefined> {
    const character = await this.getCharacter(characterId);
    if (!character) throw new Error('Character not found');
    const { data, error } = await supabase.from('characters').update({ isActive: false, deathDate: new Date().toISOString().split('T')[0], deathReason, updatedAt: new Date().toISOString() }).eq('id', characterId).select().single();
    if (error) return undefined;
    await this.logAdminActivity({
      adminId,
      action: 'kill_character',
      targetUserId: character.userId,
      targetCharacterId: characterId,
      details: `Killed character: ${character.firstName} ${character.lastName}. Reason: ${deathReason}`
    });
    return data;
  }

  async reviveCharacter(characterId: number): Promise<Character | undefined> {
    const { data, error } = await supabase.from('characters').update({ deathDate: null, deathReason: null, updatedAt: new Date().toISOString() }).eq('id', characterId).select().single();
    if (error) return undefined;
    return data;
  }

  async getDeadCharacters(): Promise<Character[]> {
    const { data, error } = await supabase.from('characters').select('*').not('deathDate', 'is', null).order('deathDate', { ascending: false }).order('createdAt', { ascending: false });
    if (error) return [];
    return data || [];
  }

  // Spell operations
  async getAllSpells(): Promise<Spell[]> {
    const { data, error } = await supabase.from('spells').select('*').order('category', { ascending: true }).order('name', { ascending: true });
    if (error) return [];
    return data || [];
  }

  async getSpell(id: number): Promise<Spell | undefined> {
    const { data, error } = await supabase.from('spells').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getSpellByName(name: string): Promise<Spell | undefined> {
    const { data, error } = await supabase.from('spells').select('*').eq('name', name).single();
    if (error) return undefined;
    return data;
  }

  async createSpell(insertSpell: InsertSpell): Promise<Spell> {
    const { data, error } = await supabase.from('spells').insert([insertSpell]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateSpell(id: number, updates: Partial<InsertSpell>): Promise<Spell | undefined> {
    const { data, error } = await supabase.from('spells').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteSpell(id: number): Promise<boolean> {
    await supabase.from('characterSpells').delete().eq('spellId', id);
    const { error } = await supabase.from('spells').delete().eq('id', id);
    return !error;
  }

  // Character spell operations
  async getCharacterSpells(characterId: number): Promise<(CharacterSpell & { spell: Spell })[]> {
    // Supabase neumí joiny, takže načteme vše a spojíme v JS
    const { data: charSpells, error } = await supabase.from('characterSpells').select('*').eq('characterId', characterId);
    if (error || !charSpells) return [];
    const { data: spellsData } = await supabase.from('spells').select('*');
    return charSpells.map(cs => ({
      ...cs,
      spell: spellsData?.find(s => s.id === cs.spellId)
    }));
  }

  async addSpellToCharacter(characterId: number, spellId: number): Promise<CharacterSpell> {
    const { data, error } = await supabase.from('characterSpells').insert([{ characterId, spellId }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async removeSpellFromCharacter(characterId: number, spellId: number): Promise<boolean> {
    const { error } = await supabase.from('characterSpells').delete().eq('characterId', characterId).eq('spellId', spellId);
    return !error;
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
      const existingSpells = await supabase.from('spells').select('*').eq('name', spellData.name);
      
      let spell;
      if (existingSpells.length === 0) {
        // Create new spell
        [spell] = await supabase.from('spells').insert([spellData]).returning();
        console.log(`Created spell: ${spell.name}`);
      } else {
        spell = existingSpells[0];
        console.log(`Spell already exists: ${spell.name}`);
      }

      // Add spell to all existing characters who don't have it
      const allCharacters = await supabase.from('characters').select('*');
      for (const character of allCharacters) {
        // Check if character already has this spell
        const existingCharacterSpell = await supabase
          .from('characterSpells')
          .select()
          .eq('characterId', character.id)
          .eq('spellId', spell.id);

        if (existingCharacterSpell.length === 0) {
          // Add spell to character
          await supabase.from('characterSpells').insert([{
            characterId: character.id,
            spellId: spell.id,
          }]);
          console.log(`Added spell ${spell.name} to character ${character.firstName} ${character.lastName}`);
        }
      }
    }
  }

  // Character inventory operations
  async getCharacterInventory(characterId: number): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Character journal operations
  async getCharacterJournal(characterId: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  addJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;
  
  // Wand operations
  async getCharacterWand(characterId: number): Promise<Wand | undefined>;
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

  // ... existující kód ...
  async getAllCharacters(includeSystem = false): Promise<Character[]> {
    let query = supabase.from('characters').select('*');
    if (!includeSystem) {
      query = query.eq('is_system', false);
    }
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }
  // ... existující kód ...
  async assignHousingAdminToSystemUser() {
    // Najdi postavu Správa ubytování
    const [character] = await supabase.from('characters').select('*').eq('firstName', 'Správa').eq('lastName', 'ubytování').single();
    if (character) {
      await supabase.from('characters').update({ userId: 6, is_system: true }).eq('id', character.id);
    }
  }
}

export const storage = new DatabaseStorage();