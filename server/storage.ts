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
    const { data, error } = await supabase.from('characterInventory').select('*').eq('characterId', characterId);
    if (error) return [];
    return data || [];
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const { data, error } = await supabase.from('characterInventory').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const { data, error } = await supabase.from('characterInventory').insert([item]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const { data, error } = await supabase.from('characterInventory').update(updates).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const { error } = await supabase.from('characterInventory').delete().eq('id', id);
    return !error;
  }

  // Character journal operations
  async getCharacterJournal(characterId: number): Promise<JournalEntry[]> {
    const { data, error } = await supabase.from('characterJournal').select('*').eq('characterId', characterId);
    if (error) return [];
    return data || [];
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const { data, error } = await supabase.from('characterJournal').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async addJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const { data, error } = await supabase.from('characterJournal').insert([entry]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const { data, error } = await supabase.from('characterJournal').update(updates).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const { error } = await supabase.from('characterJournal').delete().eq('id', id);
    return !error;
  }

  // Wand operations
  async getCharacterWand(characterId: number): Promise<Wand | undefined> {
    const { data, error } = await supabase.from('wands').select('*').eq('characterId', characterId).single();
    if (error) return undefined;
    return data;
  }

  async createWand(insertWand: InsertWand): Promise<Wand> {
    const { data, error } = await supabase.from('wands').insert([insertWand]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateWand(id: number, updates: Partial<InsertWand>): Promise<Wand | undefined> {
    const { data, error } = await supabase.from('wands').update(updates).eq('id', id).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteWand(id: number): Promise<boolean> {
    const { error } = await supabase.from('wands').delete().eq('id', id);
    return !error;
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
    const { data, error } = await supabase.from('housingRequests').insert([request]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getHousingRequestsByUserId(userId: number): Promise<HousingRequest[]> {
    const { data, error } = await supabase.from('housingRequests').select('*').eq('userId', userId);
    if (error) return [];
    return data || [];
  }

  async getHousingRequestById(requestId: number): Promise<HousingRequest | undefined> {
    const { data, error } = await supabase.from('housingRequests').select('*').eq('id', requestId).single();
    if (error) return undefined;
    return data;
  }

  async deleteHousingRequest(requestId: number): Promise<boolean> {
    const { error } = await supabase.from('housingRequests').delete().eq('id', requestId);
    return !error;
  }

  async getPendingHousingRequests(): Promise<(HousingRequest & { user: { username: string; email: string }; character: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    const { data: requests, error } = await supabase.from('housingRequests').select('*').eq('status', 'pending');
    if (error || !requests) return [];
    const { data: usersData } = await supabase.from('users').select('id,username,email');
    const { data: charactersData } = await supabase.from('characters').select('id,firstName,middleName,lastName');
    return requests.map(r => ({
      ...r,
      user: usersData?.find(u => u.id === r.userId) || { username: '', email: '' },
      character: charactersData?.find(c => c.id === r.characterId) || { firstName: '', lastName: '' }
    }));
  }

  async approveHousingRequest(requestId: number, adminId: number, assignedAddress: string, reviewNote?: string): Promise<HousingRequest> {
    const { data: request, error } = await supabase.from('housingRequests').select('*').eq('id', requestId).single();
    if (error || !request) throw new Error('Request not found');
    await supabase.from('housingRequests').update({ status: 'approved', reviewedBy: adminId, reviewedAt: new Date().toISOString(), assignedAddress, reviewNote }).eq('id', requestId);
    return { ...request, status: 'approved', assignedAddress, reviewNote };
  }

  async rejectHousingRequest(requestId: number, adminId: number, reviewNote: string): Promise<HousingRequest> {
    const { data: request, error } = await supabase.from('housingRequests').select('*').eq('id', requestId).single();
    if (error || !request) throw new Error('Request not found');
    await supabase.from('housingRequests').update({ status: 'rejected', reviewedBy: adminId, reviewedAt: new Date().toISOString(), reviewNote }).eq('id', requestId);
    return { ...request, status: 'rejected', reviewNote };
  }

  // Owl post (soví pošta)
  async sendOwlPostMessage(message: InsertOwlPostMessage): Promise<OwlPostMessage> {
    const { data, error } = await supabase.from('owlPostMessages').insert([message]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOwlPostInbox(characterId: number, limit: number = 50, offset: number = 0): Promise<(OwlPostMessage & { sender: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    const { data, error } = await supabase.from('owlPostMessages').select('*').eq('recipientId', characterId).order('createdAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error || !data) return [];
    const { data: charactersData } = await supabase.from('characters').select('id,firstName,middleName,lastName');
    return data.map(msg => ({
      ...msg,
      sender: charactersData?.find(c => c.id === msg.senderId) || { firstName: '', lastName: '' }
    }));
  }

  async getOwlPostSent(characterId: number, limit: number = 50, offset: number = 0): Promise<(OwlPostMessage & { recipient: { firstName: string; middleName?: string | null; lastName: string } })[]> {
    const { data, error } = await supabase.from('owlPostMessages').select('*').eq('senderId', characterId).order('createdAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error || !data) return [];
    const { data: charactersData } = await supabase.from('characters').select('id,firstName,middleName,lastName');
    return data.map(msg => ({
      ...msg,
      recipient: charactersData?.find(c => c.id === msg.recipientId) || { firstName: '', lastName: '' }
    }));
  }

  async getOwlPostMessage(messageId: number): Promise<OwlPostMessage | undefined> {
    const { data, error } = await supabase.from('owlPostMessages').select('*').eq('id', messageId).single();
    if (error) return undefined;
    return data;
  }

  async deleteOwlPostMessage(messageId: number): Promise<boolean> {
    const { error } = await supabase.from('owlPostMessages').delete().eq('id', messageId);
    return !error;
  }

  async markOwlPostAsRead(messageId: number): Promise<void> {
    await supabase.from('owlPostMessages').update({ isRead: true }).eq('id', messageId);
  }

  async getUnreadOwlPostCount(characterId: number): Promise<number> {
    const { data, error } = await supabase.from('owlPostMessages').select('*').eq('recipientId', characterId).eq('isRead', false);
    if (error || !data) return 0;
    return data.length;
  }

  async getAllCharactersForOwlPost(): Promise<Character[]> {
    const { data, error } = await supabase.from('characters').select('*');
    if (error) return [];
    return data || [];
  }

  // getAllCharacters
  async getAllCharacters(includeSystem = false): Promise<Character[]> {
    let query = supabase.from('characters').select('*');
    if (!includeSystem) {
      query = query.eq('isSystem', false);
    }
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  // Influence operations
  async getInfluenceBar(): Promise<{ grindelwaldPoints: number; dumbledorePoints: number }> {
    const { data, error } = await supabase.from('influenceBar').select('*').single();
    if (error || !data) return { grindelwaldPoints: 0, dumbledorePoints: 0 };
    return data;
  }

  async getInfluenceHistory(): Promise<any[]> {
    const { data, error } = await supabase.from('influenceHistory').select('*').order('createdAt', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async adjustInfluence(side: 'grindelwald' | 'dumbledore', points: number, userId: number): Promise<void> {
    const { data, error } = await supabase.from('influenceBar').select('*').single();
    if (error || !data) throw new Error('Influence bar not found');
    const newPoints = (side === 'grindelwald' ? data.grindelwaldPoints : data.dumbledorePoints) + points;
    await supabase.from('influenceBar').update({ [`${side}Points`]: newPoints }).eq('id', data.id);
    await supabase.from('influenceHistory').insert([{ side, points, userId, createdAt: new Date().toISOString() }]);
  }

  async setInfluence(grindelwaldPoints: number, dumbledorePoints: number, userId: number): Promise<void> {
    const { data, error } = await supabase.from('influenceBar').select('*').single();
    if (error || !data) throw new Error('Influence bar not found');
    await supabase.from('influenceBar').update({ grindelwaldPoints, dumbledorePoints }).eq('id', data.id);
    await supabase.from('influenceHistory').insert([{ side: 'reset', points: 0, userId, createdAt: new Date().toISOString() }]);
  }

  async assignHousingAdminToSystemUser() {
    // Najdi postavu Správa ubytování
    const [character] = await db.select().from(characters).where(and(eq(characters.firstName, 'Správa'), eq(characters.lastName, 'ubytování')));
    if (character) {
      await db.update(characters)
        .set({ userId: 6, isSystem: true })
        .where(eq(characters.id, character.id));
    }
  }
}

export const storage = new DatabaseStorage();