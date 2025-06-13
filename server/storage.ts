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

  // Přidávám implementaci chybějící funkce pro admin rozhraní
  getPendingHousingRequests(): Promise<HousingRequest[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase.from('users').insert([{ ...insertUser, updated_at: new Date() }]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ role, updated_at: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return toCamel(data);
  }

  async updateUserNarratorPermission(id: number, canNarrate: boolean): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ can_narrate: canNarrate, updated_at: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getAllUsers(includeSystem = false): Promise<User[]> {
    let query = supabase.from('users').select('*');
    if (!includeSystem) {
      query = query.eq('is_system', false);
    }
    const { data, error } = await query;
    if (error) return [];
    return toCamel(data || []);
  }

  async banUser(id: number, banReason: string): Promise<void> {
    await supabase.from('users').update({ is_banned: true, ban_reason: banReason, banned_at: new Date() }).eq('id', id);
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<void> {
    await supabase.from('users').update({ password: hashedPassword }).eq('id', id);
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await supabase.from('users').update({ password: hashedPassword, updated_at: new Date() }).eq('id', id);
  }

  async updateUserEmail(id: number, email: string): Promise<void> {
    await supabase.from('users').update({ email, updated_at: new Date() }).eq('id', id);
  }

  async updateUserSettings(id: number, settings: { characterOrder?: string; highlightWords?: string; highlightColor?: string; narratorColor?: string }): Promise<void> {
    // Převedu camelCase na snake_case pro klíče
    const snakeSettings: any = {};
    if (settings.characterOrder !== undefined) snakeSettings.character_order = settings.characterOrder;
    if (settings.highlightWords !== undefined) snakeSettings.highlight_words = settings.highlightWords;
    if (settings.highlightColor !== undefined) snakeSettings.highlight_color = settings.highlightColor;
    if (settings.narratorColor !== undefined) snakeSettings.narrator_color = settings.narratorColor;
    snakeSettings.updated_at = new Date();
    await supabase.from('users').update(snakeSettings).eq('id', id);
  }

  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return toCamel(data || []);
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
    const { data, error } = await supabase.from('characters').select('*').eq('first_name', firstName).eq('last_name', lastName).single();
    if (error) return undefined;
    return toCamel(data);
  }

  // Authentication and invite codes remain same...
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const { data, error } = await supabase.from('inviteCodes').select('*').eq('code', code).single();
    if (error) return undefined;
    return data;
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    const { data, error } = await supabase.from('inviteCodes').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return toCamel(data || []);
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
    return toCamel(data);
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    const { data, error } = await supabase.from('chatRooms').select('*').eq('name', name).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const { data, error } = await supabase.from('chatRooms').insert([insertChatRoom]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateChatRoom(id: number, updates: Partial<InsertChatRoom>): Promise<ChatRoom | undefined> {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    const { data, error } = await supabase.from('chatRooms').update({ ...updates, updated_at: new Date() }).eq('id', id).select().single();
    if (error) return undefined;
    return toCamel(data);
  }

  async deleteChatRoom(id: number): Promise<boolean> {
    await supabase.from('messages').delete().eq('room_id', id);
    const { error } = await supabase.from('chatRooms').delete().eq('id', id);
    return !error;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chatRooms').select('*').order('sort_order', { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }

  async getChatRoomsByCategory(categoryId: number): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chatRooms').select('*').eq('category_id', categoryId).order('sort_order', { ascending: true });
    if (error) return [];
    return toCamel(data || []);
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
    return toCamel(data);
  }

  async getChatCategoryByName(name: string): Promise<ChatCategory | undefined> {
    const { data, error } = await supabase.from('chatCategories').select('*').eq('name', name).single();
    if (error) return undefined;
    return toCamel(data);
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
    const { data, error } = await supabase.from('chatCategories').select('*').order('sort_order', { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }

  async getChatCategoriesWithChildren(): Promise<(ChatCategory & { children: ChatCategory[], rooms: ChatRoom[] })[]> {
    const { data: categories, error } = await supabase.from('chatCategories').select('*').order('sort_order', { ascending: true });
    if (error || !categories) return [];
    const { data: rooms } = await supabase.from('chatRooms').select('*');
    const byParent: Record<number, ChatCategory[]> = {};
    for (const cat of categories) {
      if (cat.parent_id) {
        if (!byParent[cat.parent_id]) byParent[cat.parent_id] = [];
        byParent[cat.parent_id].push(cat);
      }
    }
    return toCamel(categories.map(cat => ({
      ...cat,
      children: byParent[cat.id] || [],
      rooms: (rooms || []).filter(r => r.category_id === cat.id)
    })));
  }

  // Message operations (keeping existing)
  async getMessage(id: number): Promise<Message | undefined> {
    const { data, error } = await supabase.from('messages').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getMessagesByRoom(roomId: number, limit: number = 50, offset: number = 0): Promise<(Message & { character: { firstName: string; middleName?: string | null; lastName: string; avatar?: string | null } })[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return toCamel(data || []);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert([insertMessage]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async deleteMessage(id: number): Promise<boolean> {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    return !error;
  }

  async updateMessageCharacter(messageId: number, characterId: number): Promise<void> {
    await supabase.from('messages').update({ character_id: characterId }).eq('id', messageId);
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
    const { data, error, count } = await supabase.from('messages').delete().eq('roomId', roomId).select('*', { count: 'exact' });
    if (error) return 0;
    // count může být undefined, pokud není count: 'exact' podporováno, v tom případě použij délku data
    if (typeof count === 'number') return count;
    if (Array.isArray(data)) return data.length;
    return 0;
  }

  async getArchiveDates(roomId: number): Promise<string[]> {
    const { data, error } = await supabase.from('archivedMessages').select('archivedAt').eq('roomId', roomId).order('archivedAt', { ascending: false });
    if (error || !data) return [];
    // Vrací pole unikátních dat (jen datum, bez času)
    const uniqueDates = Array.from(new Set(data.map(d => d.archivedAt && d.archivedAt.split('T')[0])));
    return uniqueDates;
  }

  async getArchiveDatesWithCounts(roomId: number): Promise<{ date: string; count: number }[]> {
    const { data, error } = await supabase.from('archivedMessages').select('archivedAt').eq('roomId', roomId).order('archivedAt', { ascending: false });
    if (error || !data) return [];
    // Spočítat počet zpráv pro každý unikátní den
    const counts: Record<string, number> = {};
    for (const row of data) {
      const date = row.archivedAt && row.archivedAt.split('T')[0];
      if (date) counts[date] = (counts[date] || 0) + 1;
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  async getArchivedMessagesByDate(roomId: number, archiveDate: string, limit: number = 50, offset: number = 0): Promise<ArchivedMessage[]> {
    const startDate = new Date(archiveDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const { data, error } = await supabase.from('archivedMessages').select('*').eq('roomId', roomId).gte('archivedAt', startDate.toISOString()).lt('archivedAt', endDate.toISOString()).order('originalCreatedAt', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return data || [];
  }

  async getLastMessageByCharacter(characterId: number): Promise<Message | undefined> {
    const { data, error } = await supabase.from('messages').select('*').eq('characterId', characterId).order('createdAt', { ascending: false }).limit(1);
    if (error || !data || data.length === 0) return undefined;
    return data[0];
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
    return toCamel(data);
  }

  async deleteCharacterRequest(requestId: number): Promise<boolean> {
    const { error } = await supabase.from('characterRequests').delete().eq('id', requestId);
    return !error;
  }

  async getAllCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
    const { data: requests, error } = await supabase.from('characterRequests').select('*');
    if (error || !requests) return [];
    const { data: usersData } = await supabase.from('users').select('id,username,email');
    return toCamel(requests.map(r => ({
      ...r,
      user: usersData?.find(u => u.id === r.user_id) || { username: '', email: '' }
    })));
  }

  async getPendingCharacterRequests(): Promise<(CharacterRequest & { user: { username: string; email: string } })[]> {
    const { data: requests, error } = await supabase.from('characterRequests').select('*').eq('status', 'pending');
    if (error || !requests) return [];
    const { data: usersData } = await supabase.from('users').select('id,username,email');
    return toCamel(requests.map(r => ({
      ...r,
      user: usersData?.find(u => u.id === r.user_id) || { username: '', email: '' }
    })));
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
    const { data: logs, error } = await supabase.from('adminActivityLog').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error || !logs) return [];
    const { data: usersData } = await supabase.from('users').select('id,username');
    return toCamel(logs.map(l => ({
      ...l,
      admin: usersData?.find(u => u.id === l.admin_id) || { username: '' },
      targetUser: l.target_user_id ? (usersData?.find(u => u.id === l.target_user_id) || { username: '' }) : undefined
    })));
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
    const { data, error } = await supabase.from('characters').select('*').not('death_date', 'is', null).order('death_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }

  // Spell operations
  async getAllSpells(): Promise<Spell[]> {
    const { data, error } = await supabase.from('spells').select('*').order('category', { ascending: true }).order('name', { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }

  async getSpell(id: number): Promise<Spell | undefined> {
    const { data, error } = await supabase.from('spells').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async getSpellByName(name: string): Promise<Spell | undefined> {
    const { data, error } = await supabase.from('spells').select('*').eq('name', name).single();
    if (error) return undefined;
    return toCamel(data);
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
    const { data: charSpells, error } = await supabase.from('characterSpells').select('*').eq('character_id', characterId);
    if (error || !charSpells) return [];
    const { data: spellsData } = await supabase.from('spells').select('*');
    return toCamel(charSpells.map(cs => ({
      ...cs,
      spell: spellsData?.find(s => s.id === cs.spell_id)
    })));
  }

  async addSpellToCharacter(characterId: number, spellId: number): Promise<CharacterSpell> {
    const { data, error } = await supabase.from('characterSpells').insert([{ character_id: characterId, spell_id: spellId }]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async removeSpellFromCharacter(characterId: number, spellId: number): Promise<boolean> {
    const { error } = await supabase.from('characterSpells').delete().eq('character_id', characterId).eq('spell_id', spellId);
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
      const { data: existingSpells } = await supabase.from('spells').select('*').eq('name', spellData.name);
      let spell;
      if (!existingSpells || existingSpells.length === 0) {
        const { data: inserted, error } = await supabase.from('spells').insert([spellData]).select().single();
        if (error) throw new Error(error.message);
        spell = inserted;
        console.log(`Created spell: ${spell.name}`);
      } else {
        spell = existingSpells[0];
        console.log(`Spell already exists: ${spell.name}`);
      }
      // Add spell to all existing characters who don't have it
      const { data: allCharacters } = await supabase.from('characters').select('*');
      if (!allCharacters) continue;
      for (const character of allCharacters) {
        // Check if character already has this spell
        const { data: existingCharacterSpell } = await supabase
          .from('characterSpells')
          .select('*')
          .eq('characterId', character.id)
          .eq('spellId', spell.id);
        if (!existingCharacterSpell || existingCharacterSpell.length === 0) {
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
  async getCharacterInventory(characterId: number): Promise<InventoryItem[]> {
    const { data, error } = await supabase.from('characterInventory').select('*').eq('character_id', characterId);
    if (error) return [];
    return toCamel(data || []);
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
    const { data, error } = await supabase.from('characterJournal').select('*').eq('character_id', characterId);
    if (error) return [];
    return toCamel(data || []);
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
    const { data, error } = await supabase.from('wands').select('*').eq('character_id', characterId).single();
    if (error) return undefined;
    return toCamel(data);
  }

  async createWand(wand: InsertWand): Promise<Wand> {
    const { data, error } = await supabase.from('wands').insert([wand]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateWand(wandId: number, updates: Partial<InsertWand>): Promise<Wand | undefined> {
    const { data, error } = await supabase.from('wands').update(updates).eq('id', wandId).select().single();
    if (error) return undefined;
    return data;
  }

  async deleteWand(wandId: number): Promise<boolean> {
    const { error } = await supabase.from('wands').delete().eq('id', wandId);
    return !error;
  }

  async generateRandomWand(characterId: number): Promise<Wand> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async getAllWandComponents(): Promise<{
    woods: { name: string; shortDescription: string; longDescription: string }[];
    cores: { name: string; category: string; description: string }[];
    lengths: { name: string; description: string }[];
    flexibilities: { name: string; description: string }[];
  }> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async migrateExistingWandsToInventory(): Promise<number> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async updateWandComponents(components: {
    woods: { name: string; shortDescription: string; longDescription: string }[];
    cores: { name: string; category: string; description: string }[];
    lengths: { name: string; description: string }[];
    flexibilities: { name: string; description: string }[];
  }): Promise<void> {
    // Implementation needed
    throw new Error("Method not implemented");
  }
  
  // Influence operations
  async getInfluenceBar(): Promise<{ grindelwaldPoints: number; dumbledorePoints: number }> {
    // TODO: Implementace podle skutečné logiky/databáze
    return { grindelwaldPoints: 50, dumbledorePoints: 50 };
  }

  async getInfluenceHistory(): Promise<any[]> {
    // TODO: Implementace podle skutečné logiky/databáze
    return [];
  }

  async adjustInfluence(side: 'grindelwald' | 'dumbledore', points: number, userId: number): Promise<void> {
    // TODO: Implementace podle skutečné logiky/databáze
    // Příklad: await supabase.from('influenceBar').update({ [side + 'Points']: ... }).eq(...)
    return;
  }

  async setInfluence(grindelwaldPoints: number, dumbledorePoints: number, userId: number): Promise<void> {
    // TODO: Implementace podle skutečné logiky/databáze
    // Příklad: await supabase.from('influenceBar').update({ grindelwaldPoints, dumbledorePoints }).eq(...)
    return;
  }

  // ... existující kód ...
  async getAllCharacters(includeSystem = false): Promise<Character[]> {
    let query = supabase.from('characters').select('*');
    if (!includeSystem) {
      query = query.eq('is_system', false);
    }
    const { data, error } = await query;
    if (error) return [];
    return toCamel(data || []);
  }
  // ... existující kód ...
  async assignHousingAdminToSystemUser() {
    // Najdi postavu Správa ubytování
    const [character] = await supabase.from('characters').select('*').eq('firstName', 'Správa').eq('lastName', 'ubytování').single();
    if (character) {
      await supabase.from('characters').update({ userId: 6, is_system: true }).eq('id', character.id);
    }
  }

  // Přidávám implementaci chybějící funkce pro admin rozhraní
  async getPendingHousingRequests(): Promise<HousingRequest[]> {
    const { data, error } = await supabase.from('housingRequests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }
}

export const storage = new DatabaseStorage();

// Utilita pro převod snake_case na camelCase
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v)
      ])
    );
  }
  return obj;
}