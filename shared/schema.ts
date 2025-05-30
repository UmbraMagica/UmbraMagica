import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"), // user, admin
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"),
  bannedAt: timestamp("banned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Characters table
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  birthDate: date("birth_date").notNull(),
  school: varchar("school", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isMainCharacter: boolean("is_main_character").default(false).notNull(), // označuje hlavní postavu uživatele
  deathDate: date("death_date"), // datum smrti postavy
  deathReason: text("death_reason"), // důvod smrti
  avatar: text("avatar"), // base64 encoded avatar image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invite codes table
export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedBy: integer("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

// Chat categories table
export const chatCategories = pgTable("chat_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat rooms table
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  longDescription: text("long_description"),
  categoryId: integer("category_id").references(() => chatCategories.id),
  isPublic: boolean("is_public").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  characterId: integer("character_id").references(() => characters.id), // nullable for admin messages
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("message").notNull(), // message, action, system, dice_roll, coin_flip
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Archived messages table (for backup/archival)
export const archivedMessages = pgTable("archived_messages", {
  id: serial("id").primaryKey(),
  originalMessageId: integer("original_message_id").notNull(),
  roomId: integer("room_id").notNull(),
  characterId: integer("character_id"), // nullable for admin messages
  characterName: varchar("character_name", { length: 150 }), // nullable for admin messages
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull(),
  originalCreatedAt: timestamp("original_created_at").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});

// Character requests table - žádosti o nové postavy
export const characterRequests = pgTable("character_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  birthDate: date("birth_date").notNull(),
  school: varchar("school", { length: 100 }),
  description: text("description"),
  reason: text("reason"), // důvod pro vytvoření postavy
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"), // poznámka administrátora
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin activity log - log aktivit administrátorů
export const adminActivityLog = pgTable("admin_activity_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // approve_character, reject_character, etc.
  targetUserId: integer("target_user_id").references(() => users.id),
  targetCharacterId: integer("target_character_id").references(() => characters.id),
  targetRequestId: integer("target_request_id").references(() => characterRequests.id),
  details: text("details"), // dodatečné informace o akci
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  characterRequests: many(characterRequests),
  adminActions: many(adminActivityLog),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  messages: many(messages),
  characterSpells: many(characterSpells),
}));

export const chatCategoriesRelations = relations(chatCategories, ({ one, many }) => ({
  parent: one(chatCategories, {
    fields: [chatCategories.parentId],
    references: [chatCategories.id],
  }),
  children: many(chatCategories),
  rooms: many(chatRooms),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  category: one(chatCategories, {
    fields: [chatRooms.categoryId],
    references: [chatCategories.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  character: one(characters, {
    fields: [messages.characterId],
    references: [characters.id],
  }),
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
}));

export const characterRequestsRelations = relations(characterRequests, ({ one }) => ({
  user: one(users, {
    fields: [characterRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [characterRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLog.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [adminActivityLog.targetUserId],
    references: [users.id],
  }),
  targetCharacter: one(characters, {
    fields: [adminActivityLog.targetCharacterId],
    references: [characters.id],
  }),
  targetRequest: one(characterRequests, {
    fields: [adminActivityLog.targetRequestId],
    references: [characterRequests.id],
  }),
}));

// Spells table
export const spells = pgTable("spells", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  effect: text("effect").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "Kouzelné formule", "Bojová kouzla", atd.
  type: varchar("type", { length: 50 }).notNull(), // "Základní", "Pokročilé", "Mistrské"
  targetType: varchar("target_type", { length: 20 }).default("self").notNull(), // "self", "other", "object", "both"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Character spells (many-to-many relationship)
export const characterSpells = pgTable("character_spells", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  spellId: serial("spell_id").references(() => spells.id).notNull(),
  learnedAt: timestamp("learned_at").defaultNow().notNull(),
});

// Wands table
export const wands = pgTable("wands", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).unique(), // One wand per character
  wood: varchar("wood", { length: 50 }).notNull(),
  core: varchar("core", { length: 100 }).notNull(),
  length: varchar("length", { length: 20 }).notNull(),
  flexibility: varchar("flexibility", { length: 50 }).notNull(),
  description: text("description"),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// Spell relations
export const spellsRelations = relations(spells, ({ many }) => ({
  characterSpells: many(characterSpells),
}));

export const characterSpellsRelations = relations(characterSpells, ({ one }) => ({
  character: one(characters, {
    fields: [characterSpells.characterId],
    references: [characters.id],
  }),
  spell: one(spells, {
    fields: [characterSpells.spellId],
    references: [spells.id],
  }),
}));

// Wand relations
export const wandsRelations = relations(wands, ({ one }) => ({
  character: one(characters, {
    fields: [wands.characterId],
    references: [characters.id],
  }),
}));

// Character Inventory table
export const characterInventory = pgTable("character_inventory", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  itemName: varchar("item_name", { length: 100 }).notNull(),
  itemDescription: text("item_description"),
  quantity: integer("quantity").default(1).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "Wand", "Potion", "Book", "Clothes", "Other"
  rarity: varchar("rarity", { length: 20 }).default("Common").notNull(), // "Common", "Uncommon", "Rare", "Epic", "Legendary"
  value: integer("value").default(0), // Value in galleons/sickles/knuts
  isEquipped: boolean("is_equipped").default(false).notNull(),
  notes: text("notes"), // Additional notes about the item
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Character Journal/Diary table
export const characterJournal = pgTable("character_journal", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  entryDate: date("entry_date").notNull(), // Game date (1926)
  isPrivate: boolean("is_private").default(true).notNull(), // Whether only character owner can see it
  mood: varchar("mood", { length: 20 }), // "Happy", "Sad", "Excited", "Worried", etc.
  location: varchar("location", { length: 100 }), // Where the entry was written
  tags: text("tags").array(), // Tags for categorizing entries
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory relations
export const characterInventoryRelations = relations(characterInventory, ({ one }) => ({
  character: one(characters, {
    fields: [characterInventory.characterId],
    references: [characters.id],
  }),
}));

// Journal relations
export const characterJournalRelations = relations(characterJournal, ({ one }) => ({
  character: one(characters, {
    fields: [characterJournal.characterId],
    references: [characters.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertCharacterSchema = createInsertSchema(characters).pick({
  firstName: true,
  middleName: true,
  lastName: true,
  birthDate: true,
  school: true,
  description: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  characterId: true,
  content: true,
  messageType: true,
});

export const insertChatCategorySchema = createInsertSchema(chatCategories).pick({
  name: true,
  description: true,
  parentId: true,
  sortOrder: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  longDescription: true,
  categoryId: true,
  isPublic: true,
  sortOrder: true,
});

export const insertCharacterRequestSchema = createInsertSchema(characterRequests).pick({
  firstName: true,
  middleName: true,
  lastName: true,
  birthDate: true,
  school: true,
  description: true,
  reason: true,
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog).pick({
  action: true,
  targetUserId: true,
  targetCharacterId: true,
  targetRequestId: true,
  details: true,
});

export const registrationSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  passwordConfirm: z.string().min(6),
  inviteCode: z.string().min(1),
  firstName: z.string().min(1).max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1).max(50),
  birthDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const characterEditSchema = z.object({
  school: z.string().optional(),
  description: z.string().optional(),
});

export const characterAdminEditSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  school: z.string().optional(),
  description: z.string().optional(),
});

export const characterRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  birthDate: z.string().refine(date => {
    const d = new Date(date);
    const year = d.getFullYear();
    return !isNaN(d.getTime()) && year >= 1860 && year <= 1910;
  }, {
    message: "Birth date must be between 1860-1910"
  }),
  school: z.string().max(100).optional(),
  description: z.string().optional(),
  reason: z.string().min(10, "Please provide a reason for creating this character").max(500),
});

export const insertSpellSchema = createInsertSchema(spells).pick({
  name: true,
  effect: true,
  category: true,
  type: true,
  targetType: true,
});

export const insertCharacterSpellSchema = createInsertSchema(characterSpells).pick({
  characterId: true,
  spellId: true,
});

export const spellSchema = z.object({
  name: z.string().min(1, "Název kouzla je povinný").max(100),
  effect: z.string().min(1, "Popis efektu je povinný"),
  category: z.string().min(1, "Kategorie je povinná").max(50),
  type: z.string().min(1, "Typ je povinný").max(50),
  targetType: z.enum(["self", "other", "object", "both"]).default("self"),
});

export const insertWandSchema = createInsertSchema(wands).pick({
  characterId: true,
  wood: true,
  core: true,
  length: true,
  flexibility: true,
  description: true,
});

export const wandSchema = z.object({
  wood: z.string().min(1, "Dřevo hůlky je povinné").max(50),
  core: z.string().min(1, "Jádro hůlky je povinné").max(100),
  length: z.string().min(1, "Délka hůlky je povinná").max(20),
  flexibility: z.string().min(1, "Ohebnost hůlky je povinná").max(50),
  description: z.string().optional(),
});

export const insertInventoryItemSchema = createInsertSchema(characterInventory).pick({
  characterId: true,
  itemName: true,
  itemDescription: true,
  quantity: true,
  category: true,
  rarity: true,
  value: true,
  isEquipped: true,
  notes: true,
});

export const inventoryItemSchema = z.object({
  itemName: z.string().min(1, "Název předmětu je povinný").max(100),
  itemDescription: z.string().optional(),
  quantity: z.number().min(1, "Množství musí být alespoň 1").default(1),
  category: z.enum(["Wand", "Potion", "Book", "Clothes", "Jewelry", "Tool", "Other"]),
  rarity: z.enum(["Common", "Uncommon", "Rare", "Epic", "Legendary"]).default("Common"),
  value: z.number().min(0, "Hodnota nemůže být záporná").default(0),
  isEquipped: z.boolean().default(false),
  notes: z.string().optional(),
});

export const insertJournalEntrySchema = createInsertSchema(characterJournal).pick({
  characterId: true,
  title: true,
  content: true,
  entryDate: true,
  isPrivate: true,
  mood: true,
  location: true,
  tags: true,
});

export const journalEntrySchema = z.object({
  title: z.string().min(1, "Název záznamu je povinný").max(200),
  content: z.string().min(1, "Obsah záznamu je povinný"),
  entryDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Neplatný formát data"
  }),
  isPrivate: z.boolean().default(true),
  mood: z.enum(["Happy", "Sad", "Excited", "Worried", "Angry", "Peaceful", "Confused", "Determined"]).optional(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;
export type ChatCategory = typeof chatCategories.$inferSelect;
export type InsertChatCategory = typeof chatCategories.$inferInsert;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type ArchivedMessage = typeof archivedMessages.$inferSelect;
export type CharacterRequest = typeof characterRequests.$inferSelect;
export type InsertCharacterRequest = typeof characterRequests.$inferInsert;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLog.$inferInsert;
export type Spell = typeof spells.$inferSelect;
export type InsertSpell = typeof spells.$inferInsert;
export type CharacterSpell = typeof characterSpells.$inferSelect;
export type InsertCharacterSpell = typeof characterSpells.$inferInsert;
export type InventoryItem = typeof characterInventory.$inferSelect;
export type InsertInventoryItem = typeof characterInventory.$inferInsert;
export type JournalEntry = typeof characterJournal.$inferSelect;
export type InsertJournalEntry = typeof characterJournal.$inferInsert;
export type Wand = typeof wands.$inferSelect;
export type InsertWand = typeof wands.$inferInsert;
