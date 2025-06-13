var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminActivityLog: () => adminActivityLog,
  adminActivityLogRelations: () => adminActivityLogRelations,
  archivedMessages: () => archivedMessages,
  characterAdminEditSchema: () => characterAdminEditSchema,
  characterEditSchema: () => characterEditSchema,
  characterInventory: () => characterInventory,
  characterInventoryRelations: () => characterInventoryRelations,
  characterJournal: () => characterJournal,
  characterJournalRelations: () => characterJournalRelations,
  characterRequestSchema: () => characterRequestSchema,
  characterRequests: () => characterRequests,
  characterRequestsRelations: () => characterRequestsRelations,
  characterSpells: () => characterSpells,
  characterSpellsRelations: () => characterSpellsRelations,
  characters: () => characters,
  charactersRelations: () => charactersRelations,
  chatCategories: () => chatCategories,
  chatCategoriesRelations: () => chatCategoriesRelations,
  chatRooms: () => chatRooms,
  chatRoomsRelations: () => chatRoomsRelations,
  configuration: () => configuration,
  housingRequests: () => housingRequests,
  housingRequestsRelations: () => housingRequestsRelations,
  influenceBar: () => influenceBar,
  influenceHistory: () => influenceHistory,
  insertAdminActivityLogSchema: () => insertAdminActivityLogSchema,
  insertCharacterRequestSchema: () => insertCharacterRequestSchema,
  insertCharacterSchema: () => insertCharacterSchema,
  insertCharacterSpellSchema: () => insertCharacterSpellSchema,
  insertChatCategorySchema: () => insertChatCategorySchema,
  insertChatRoomSchema: () => insertChatRoomSchema,
  insertHousingRequestSchema: () => insertHousingRequestSchema,
  insertInventoryItemSchema: () => insertInventoryItemSchema,
  insertJournalEntrySchema: () => insertJournalEntrySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOwlPostMessageSchema: () => insertOwlPostMessageSchema,
  insertSpellSchema: () => insertSpellSchema,
  insertUserSchema: () => insertUserSchema,
  insertWandCoreSchema: () => insertWandCoreSchema,
  insertWandFlexibilitySchema: () => insertWandFlexibilitySchema,
  insertWandLengthSchema: () => insertWandLengthSchema,
  insertWandSchema: () => insertWandSchema,
  insertWandWoodSchema: () => insertWandWoodSchema,
  inventoryItemSchema: () => inventoryItemSchema,
  inviteCodes: () => inviteCodes,
  journalEntrySchema: () => journalEntrySchema,
  loginSchema: () => loginSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  owlPostMessageRelations: () => owlPostMessageRelations,
  owlPostMessages: () => owlPostMessages,
  registrationSchema: () => registrationSchema,
  sessions: () => sessions,
  spellSchema: () => spellSchema,
  spells: () => spells,
  spellsRelations: () => spellsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  wandCores: () => wandCores,
  wandFlexibilities: () => wandFlexibilities,
  wandLengths: () => wandLengths,
  wandSchema: () => wandSchema,
  wandWoods: () => wandWoods,
  wands: () => wands,
  wandsRelations: () => wandsRelations
});
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
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  // user, admin, system
  isBanned: boolean("is_banned").default(false).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  // systémový uživatel
  banReason: text("ban_reason"),
  bannedAt: timestamp("banned_at"),
  characterOrder: text("character_order"),
  // JSON array of character IDs in preferred order
  highlightWords: text("highlight_words"),
  // comma-separated words to highlight
  highlightColor: varchar("highlight_color", { length: 20 }).default("yellow"),
  // color for highlighting
  canNarrate: boolean("can_narrate").default(false).notNull(),
  // může používat vypravěče
  narratorColor: varchar("narrator_color", { length: 20 }).default("yellow"),
  // barva textu vypravěče
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  birthDate: date("birth_date").notNull(),
  school: varchar("school", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  // systémová postava
  deathDate: date("death_date"),
  // datum smrti postavy
  deathReason: text("death_reason"),
  // důvod smrti
  avatar: text("avatar"),
  // base64 encoded avatar image
  height: integer("height"),
  // výška v cm
  weight: integer("weight"),
  // váha v kg
  heightSetAt: timestamp("height_set_at"),
  // kdy byla výška nastavena (pro jednoráz editaci)
  schoolSetAt: timestamp("school_set_at"),
  // kdy byla škola nastavena (pro jednoráz editaci)
  residence: text("residence"),
  // bydliště postavy
  characterHistory: text("character_history"),
  // historie postavy
  showHistoryToOthers: boolean("show_history_to_others").default(true).notNull(),
  // viditelnost historie ostatním
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedBy: integer("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at")
});
var chatCategories = pgTable("chat_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  longDescription: text("long_description"),
  categoryId: integer("category_id").references(() => chatCategories.id),
  isPublic: boolean("is_public").default(true).notNull(),
  password: varchar("password", { length: 255 }),
  // Hashed password for protected rooms
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  characterId: integer("character_id").references(() => characters.id),
  // nullable for admin messages
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("message").notNull(),
  // message, action, system, dice_roll, coin_flip, narrator
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var archivedMessages = pgTable("archived_messages", {
  id: serial("id").primaryKey(),
  originalMessageId: integer("original_message_id").notNull(),
  roomId: integer("room_id").notNull(),
  characterId: integer("character_id"),
  // nullable for admin messages
  characterName: varchar("character_name", { length: 150 }),
  // nullable for admin messages
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull(),
  originalCreatedAt: timestamp("original_created_at").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull()
});
var characterRequests = pgTable("character_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  birthDate: date("birth_date").notNull(),
  school: varchar("school", { length: 100 }),
  description: text("description"),
  reason: text("reason"),
  // důvod pro vytvoření postavy
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"),
  // poznámka administrátora
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var adminActivityLog = pgTable("admin_activity_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  // approve_character, reject_character, etc.
  targetUserId: integer("target_user_id").references(() => users.id),
  targetCharacterId: integer("target_character_id").references(() => characters.id),
  targetRequestId: integer("target_request_id").references(() => characterRequests.id),
  details: text("details"),
  // dodatečné informace o akci
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  characterRequests: many(characterRequests),
  adminActions: many(adminActivityLog)
}));
var charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id]
  }),
  messages: many(messages),
  characterSpells: many(characterSpells)
}));
var chatCategoriesRelations = relations(chatCategories, ({ one, many }) => ({
  parent: one(chatCategories, {
    fields: [chatCategories.parentId],
    references: [chatCategories.id]
  }),
  children: many(chatCategories),
  rooms: many(chatRooms)
}));
var chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  category: one(chatCategories, {
    fields: [chatRooms.categoryId],
    references: [chatCategories.id]
  }),
  messages: many(messages)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  character: one(characters, {
    fields: [messages.characterId],
    references: [characters.id]
  }),
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id]
  })
}));
var characterRequestsRelations = relations(characterRequests, ({ one }) => ({
  user: one(users, {
    fields: [characterRequests.userId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [characterRequests.reviewedBy],
    references: [users.id]
  })
}));
var adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLog.adminId],
    references: [users.id]
  }),
  targetUser: one(users, {
    fields: [adminActivityLog.targetUserId],
    references: [users.id]
  }),
  targetCharacter: one(characters, {
    fields: [adminActivityLog.targetCharacterId],
    references: [characters.id]
  }),
  targetRequest: one(characterRequests, {
    fields: [adminActivityLog.targetRequestId],
    references: [characterRequests.id]
  })
}));
var spells = pgTable("spells", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  effect: text("effect").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  // "Kouzelné formule", "Bojová kouzla", atd.
  type: varchar("type", { length: 50 }).notNull(),
  // "Základní", "Pokročilé", "Mistrské"
  targetType: varchar("target_type", { length: 20 }).default("self").notNull(),
  // "self", "other", "object", "both"
  isDefault: boolean("is_default").default(false).notNull(),
  // Automatically assigned to new characters
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var characterSpells = pgTable("character_spells", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  spellId: serial("spell_id").references(() => spells.id).notNull(),
  learnedAt: timestamp("learned_at").defaultNow().notNull()
});
var wands = pgTable("wands", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).unique(),
  // One wand per character
  wood: varchar("wood", { length: 50 }).notNull(),
  core: varchar("core", { length: 100 }).notNull(),
  length: varchar("length", { length: 20 }).notNull(),
  flexibility: varchar("flexibility", { length: 50 }).notNull(),
  description: text("description"),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull()
});
var spellsRelations = relations(spells, ({ many }) => ({
  characterSpells: many(characterSpells)
}));
var characterSpellsRelations = relations(characterSpells, ({ one }) => ({
  character: one(characters, {
    fields: [characterSpells.characterId],
    references: [characters.id]
  }),
  spell: one(spells, {
    fields: [characterSpells.spellId],
    references: [spells.id]
  })
}));
var wandsRelations = relations(wands, ({ one }) => ({
  character: one(characters, {
    fields: [wands.characterId],
    references: [characters.id]
  })
}));
var characterInventory = pgTable("character_inventory", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  itemName: varchar("item_name", { length: 100 }).notNull(),
  itemDescription: text("item_description"),
  quantity: integer("quantity").default(1).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  // "Wand", "Potion", "Book", "Clothes", "Other"
  rarity: varchar("rarity", { length: 20 }).default("Common").notNull(),
  // "Common", "Uncommon", "Rare", "Epic", "Legendary"
  value: integer("value").default(0),
  // Value in galleons/sickles/knuts
  isEquipped: boolean("is_equipped").default(false).notNull(),
  notes: text("notes"),
  // Additional notes about the item
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var characterJournal = pgTable("character_journal", {
  id: serial("id").primaryKey(),
  characterId: serial("character_id").references(() => characters.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  entryDate: date("entry_date").notNull(),
  // Game date (1926)
  isPrivate: boolean("is_private").default(true).notNull(),
  // Whether only character owner can see it
  mood: varchar("mood", { length: 20 }),
  // "Happy", "Sad", "Excited", "Worried", etc.
  location: varchar("location", { length: 100 }),
  // Where the entry was written
  tags: text("tags").array(),
  // Tags for categorizing entries
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var configuration = pgTable("configuration", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var housingRequests = pgTable("housing_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  characterId: integer("character_id").references(() => characters.id).notNull(),
  requestType: varchar("request_type", { length: 20 }).notNull(),
  // "apartment", "house", "dormitory", "mansion", "shared"
  size: varchar("size", { length: 50 }),
  // velikost bytu/domu
  location: varchar("location", { length: 100 }).notNull(),
  // "area", "custom", nebo "dormitory"
  customLocation: text("custom_location"),
  // vlastní adresa při volbě "custom"
  selectedArea: varchar("selected_area", { length: 100 }),
  // vybraná oblast při volbě "area"
  description: text("description").notNull(),
  // popis žádosti
  housingName: varchar("housing_name", { length: 100 }),
  // název bydlení
  housingPassword: varchar("housing_password", { length: 100 }),
  // heslo pro vstup
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // "pending", "approved", "rejected"
  assignedAddress: text("assigned_address"),
  // přidělená adresa po schválení
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var characterInventoryRelations = relations(characterInventory, ({ one }) => ({
  character: one(characters, {
    fields: [characterInventory.characterId],
    references: [characters.id]
  })
}));
var characterJournalRelations = relations(characterJournal, ({ one }) => ({
  character: one(characters, {
    fields: [characterJournal.characterId],
    references: [characters.id]
  })
}));
var housingRequestsRelations = relations(housingRequests, ({ one }) => ({
  user: one(users, {
    fields: [housingRequests.userId],
    references: [users.id]
  }),
  character: one(characters, {
    fields: [housingRequests.characterId],
    references: [characters.id]
  }),
  reviewedBy: one(users, {
    fields: [housingRequests.reviewedBy],
    references: [users.id]
  })
}));
var wandWoods = pgTable("wand_woods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description").notNull(),
  availableForRandom: boolean("available_for_random").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var wandCores = pgTable("wand_cores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description").notNull(),
  availableForRandom: boolean("available_for_random").default(true).notNull(),
  categorySortOrder: integer("category_sort_order"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var wandLengths = pgTable("wand_lengths", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  availableForRandom: boolean("available_for_random").default(true).notNull(),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var wandFlexibilities = pgTable("wand_flexibilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  availableForRandom: boolean("available_for_random").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var owlPostMessages = pgTable("owl_post_messages", {
  id: serial("id").primaryKey(),
  senderCharacterId: serial("sender_character_id").references(() => characters.id).notNull(),
  recipientCharacterId: serial("recipient_character_id").references(() => characters.id).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at")
});
var owlPostMessageRelations = relations(owlPostMessages, ({ one }) => ({
  sender: one(characters, {
    fields: [owlPostMessages.senderCharacterId],
    references: [characters.id]
  }),
  recipient: one(characters, {
    fields: [owlPostMessages.recipientCharacterId],
    references: [characters.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true
});
var insertCharacterSchema = createInsertSchema(characters).pick({
  firstName: true,
  middleName: true,
  lastName: true,
  birthDate: true,
  school: true,
  description: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  characterId: true,
  content: true,
  messageType: true
});
var insertChatCategorySchema = createInsertSchema(chatCategories).pick({
  name: true,
  description: true,
  parentId: true,
  sortOrder: true
});
var insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  longDescription: true,
  categoryId: true,
  isPublic: true,
  password: true,
  sortOrder: true
});
var insertCharacterRequestSchema = createInsertSchema(characterRequests).pick({
  firstName: true,
  middleName: true,
  lastName: true,
  birthDate: true,
  school: true,
  description: true,
  reason: true
});
var insertAdminActivityLogSchema = createInsertSchema(adminActivityLog).pick({
  action: true,
  targetUserId: true,
  targetCharacterId: true,
  targetRequestId: true,
  details: true
});
var insertHousingRequestSchema = createInsertSchema(housingRequests).pick({
  characterId: true,
  requestType: true,
  size: true,
  location: true,
  customLocation: true,
  selectedArea: true,
  description: true,
  housingName: true,
  housingPassword: true
});
var insertOwlPostMessageSchema = createInsertSchema(owlPostMessages).pick({
  senderCharacterId: true,
  recipientCharacterId: true,
  subject: true,
  content: true
});
var insertWandWoodSchema = createInsertSchema(wandWoods).pick({
  name: true,
  shortDescription: true,
  longDescription: true,
  availableForRandom: true
});
var insertWandCoreSchema = createInsertSchema(wandCores).pick({
  name: true,
  category: true,
  description: true,
  availableForRandom: true
});
var insertWandLengthSchema = createInsertSchema(wandLengths).pick({
  name: true,
  description: true,
  availableForRandom: true
});
var insertWandFlexibilitySchema = createInsertSchema(wandFlexibilities).pick({
  name: true,
  description: true,
  availableForRandom: true
});
var registrationSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  passwordConfirm: z.string().min(6),
  inviteCode: z.string().min(1),
  firstName: z.string().min(1).max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1).max(50),
  birthDate: z.string().refine((date2) => !isNaN(Date.parse(date2)), {
    message: "Invalid date format"
  })
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"]
});
var loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
var characterEditSchema = z.object({
  school: z.string().optional(),
  description: z.string().optional(),
  height: z.number().min(120, "V\xFD\u0161ka mus\xED b\xFDt alespo\u0148 120 cm").max(250, "V\xFD\u0161ka nesm\xED p\u0159ekro\u010Dit 250 cm").optional(),
  weight: z.number().min(30, "V\xE1ha mus\xED b\xFDt alespo\u0148 30 kg").max(300, "V\xE1ha nesm\xED p\u0159ekro\u010Dit 300 kg").optional()
});
var characterAdminEditSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  school: z.string().optional(),
  description: z.string().optional(),
  height: z.number().min(120, "V\xFD\u0161ka mus\xED b\xFDt alespo\u0148 120 cm").max(250, "V\xFD\u0161ka nesm\xED p\u0159ekro\u010Dit 250 cm").optional(),
  weight: z.number().min(30, "V\xE1ha mus\xED b\xFDt alespo\u0148 30 kg").max(300, "V\xE1ha nesm\xED p\u0159ekro\u010Dit 300 kg").optional()
});
var characterRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  birthDate: z.string().refine((date2) => {
    const d = new Date(date2);
    const year = d.getFullYear();
    return !isNaN(d.getTime()) && year >= 1860 && year <= 1910;
  }, {
    message: "Birth date must be between 1860-1910"
  }),
  school: z.string().max(100).optional(),
  description: z.string().optional(),
  reason: z.string().min(10, "Please provide a reason for creating this character").max(500)
});
var insertSpellSchema = createInsertSchema(spells).pick({
  name: true,
  effect: true,
  category: true,
  type: true,
  targetType: true,
  isDefault: true
});
var insertCharacterSpellSchema = createInsertSchema(characterSpells).pick({
  characterId: true,
  spellId: true
});
var spellSchema = z.object({
  name: z.string().min(1, "N\xE1zev kouzla je povinn\xFD").max(100),
  effect: z.string().min(1, "Popis efektu je povinn\xFD"),
  category: z.string().min(1, "Kategorie je povinn\xE1").max(50),
  type: z.string().min(1, "Typ je povinn\xFD").max(50),
  targetType: z.enum(["self", "other", "object", "both"]).default("self"),
  isDefault: z.boolean().default(false)
});
var insertWandSchema = createInsertSchema(wands).pick({
  characterId: true,
  wood: true,
  core: true,
  length: true,
  flexibility: true,
  description: true
});
var wandSchema = z.object({
  wood: z.string().min(1, "D\u0159evo h\u016Flky je povinn\xE9").max(50),
  core: z.string().min(1, "J\xE1dro h\u016Flky je povinn\xE9").max(100),
  length: z.string().min(1, "D\xE9lka h\u016Flky je povinn\xE1").max(20),
  flexibility: z.string().min(1, "Ohebnost h\u016Flky je povinn\xE1").max(50),
  description: z.string().optional()
});
var insertInventoryItemSchema = createInsertSchema(characterInventory).pick({
  characterId: true,
  itemName: true,
  itemDescription: true,
  quantity: true,
  category: true,
  rarity: true,
  value: true,
  isEquipped: true,
  notes: true
});
var inventoryItemSchema = z.object({
  itemName: z.string().min(1, "N\xE1zev p\u0159edm\u011Btu je povinn\xFD").max(100),
  itemDescription: z.string().optional(),
  quantity: z.number().min(1, "Mno\u017Estv\xED mus\xED b\xFDt alespo\u0148 1").default(1),
  category: z.enum(["Wand", "Potion", "Book", "Clothes", "Jewelry", "Tool", "Other"]),
  rarity: z.enum(["Common", "Uncommon", "Rare", "Epic", "Legendary"]).default("Common"),
  value: z.number().min(0, "Hodnota nem\u016F\u017Ee b\xFDt z\xE1porn\xE1").default(0),
  isEquipped: z.boolean().default(false),
  notes: z.string().optional()
});
var insertJournalEntrySchema = createInsertSchema(characterJournal).pick({
  characterId: true,
  title: true,
  content: true,
  entryDate: true,
  isPrivate: true,
  mood: true,
  location: true,
  tags: true
});
var journalEntrySchema = z.object({
  title: z.string().min(1, "N\xE1zev z\xE1znamu je povinn\xFD").max(200),
  content: z.string().min(1, "Obsah z\xE1znamu je povinn\xFD"),
  entryDate: z.string().refine((date2) => !isNaN(Date.parse(date2)), {
    message: "Neplatn\xFD form\xE1t data"
  }),
  isPrivate: z.boolean().default(true),
  mood: z.enum(["Happy", "Sad", "Excited", "Worried", "Angry", "Peaceful", "Confused", "Determined"]).optional(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).default([])
});
var influenceBar = pgTable("influence_bar", {
  id: serial("id").primaryKey(),
  grindelwaldPoints: integer("grindelwald_points").default(50).notNull(),
  dumbledorePoints: integer("dumbledore_points").default(50).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});
var influenceHistory = pgTable("influence_history", {
  id: serial("id").primaryKey(),
  grindelwaldPoints: integer("grindelwald_points").notNull(),
  dumbledorePoints: integer("dumbledore_points").notNull(),
  changeBy: integer("change_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, lt, gte, count, isNotNull, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({
      ...insertUser,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return user;
  }
  async updateUserRole(id, role) {
    const [user] = await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserNarratorPermission(id, canNarrate) {
    const [user] = await db.update(users).set({ canNarrate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async banUser(id, banReason) {
    await db.update(users).set({
      isBanned: true,
      banReason,
      bannedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id));
  }
  async resetUserPassword(id, hashedPassword) {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }
  async updateUserPassword(id, hashedPassword) {
    await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async updateUserEmail(id, email) {
    await db.update(users).set({ email, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async updateUserSettings(id, settings) {
    await db.update(users).set({
      ...settings,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id));
  }
  async updateUserNarratorPermissions(id, canNarrate) {
    const [user] = await db.update(users).set({ canNarrate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  // Character operations
  async getCharacter(id) {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }
  async getCharactersByUserId(userId) {
    return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.createdAt));
  }
  async createCharacter(insertCharacter) {
    const [character] = await db.insert(characters).values({
      ...insertCharacter,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return character;
  }
  async updateCharacter(id, updates) {
    const [character] = await db.update(characters).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(characters.id, id)).returning();
    return character;
  }
  async getCharacterByName(firstName, lastName) {
    const [character] = await db.select().from(characters).where(and(eq(characters.firstName, firstName), eq(characters.lastName, lastName)));
    return character;
  }
  // Authentication and invite codes remain same...
  async getInviteCode(code) {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return inviteCode;
  }
  async getAllInviteCodes() {
    return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }
  async createInviteCode(insertInviteCode) {
    const [inviteCode] = await db.insert(inviteCodes).values(insertInviteCode).returning();
    return inviteCode;
  }
  async useInviteCode(code, userId) {
    try {
      await db.update(inviteCodes).set({ isUsed: true, usedBy: userId, usedAt: /* @__PURE__ */ new Date() }).where(eq(inviteCodes.code, code));
      return true;
    } catch {
      return false;
    }
  }
  async validateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  // Chat operations (keeping existing implementation)
  async getChatRoom(id) {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }
  async getChatRoomByName(name) {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, name));
    return room;
  }
  async createChatRoom(insertChatRoom) {
    const [room] = await db.insert(chatRooms).values(insertChatRoom).returning();
    return room;
  }
  async updateChatRoom(id, updates) {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    const [room] = await db.update(chatRooms).set(updates).where(eq(chatRooms.id, id)).returning();
    return room;
  }
  async deleteChatRoom(id) {
    try {
      await db.delete(messages).where(eq(messages.roomId, id));
      await db.delete(chatRooms).where(eq(chatRooms.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting chat room:", error);
      return false;
    }
  }
  async getAllChatRooms() {
    return db.select().from(chatRooms).orderBy(chatRooms.sortOrder);
  }
  async getChatRoomsByCategory(categoryId) {
    return db.select().from(chatRooms).where(eq(chatRooms.categoryId, categoryId)).orderBy(chatRooms.sortOrder);
  }
  async validateRoomPassword(roomId, password) {
    const room = await this.getChatRoom(roomId);
    if (!room) return false;
    if (!room.password) return true;
    return bcrypt.compare(password, room.password);
  }
  async updateChatCategorySortOrder(id, sortOrder) {
    try {
      const [updated] = await db.update(chatCategories).set({ sortOrder }).where(eq(chatCategories.id, id)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating chat category sort order:", error);
      return void 0;
    }
  }
  async updateChatRoomSortOrder(id, sortOrder) {
    try {
      const [updated] = await db.update(chatRooms).set({ sortOrder }).where(eq(chatRooms.id, id)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating chat room sort order:", error);
      return void 0;
    }
  }
  async getChatCategory(id) {
    const [category] = await db.select().from(chatCategories).where(eq(chatCategories.id, id));
    return category;
  }
  async getChatCategoryByName(name) {
    const [category] = await db.select().from(chatCategories).where(eq(chatCategories.name, name));
    return category;
  }
  async createChatCategory(insertChatCategory) {
    const [category] = await db.insert(chatCategories).values(insertChatCategory).returning();
    return category;
  }
  async updateChatCategory(id, updates) {
    const [category] = await db.update(chatCategories).set(updates).where(eq(chatCategories.id, id)).returning();
    return category;
  }
  async deleteChatCategory(id) {
    try {
      const children = await db.select().from(chatCategories).where(eq(chatCategories.parentId, id));
      if (children.length > 0) {
        throw new Error("Cannot delete category with child categories");
      }
      const rooms = await db.select().from(chatRooms).where(eq(chatRooms.categoryId, id));
      if (rooms.length > 0) {
        throw new Error("Cannot delete category with chat rooms");
      }
      const result = await db.delete(chatCategories).where(eq(chatCategories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting chat category:", error);
      return false;
    }
  }
  async getAllChatCategories() {
    return db.select().from(chatCategories).orderBy(chatCategories.sortOrder);
  }
  async getChatCategoriesWithChildren() {
    const categories = await db.select().from(chatCategories).orderBy(chatCategories.sortOrder);
    const rooms = await db.select().from(chatRooms).orderBy(chatRooms.sortOrder);
    const categoryMap = /* @__PURE__ */ new Map();
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [], rooms: [] });
    });
    rooms.forEach((room) => {
      if (room.categoryId) {
        const category = categoryMap.get(room.categoryId);
        if (category) {
          category.rooms.push(room);
        }
      }
    });
    const rootCategories = [];
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id);
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
  async getMessage(id) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  async getMessagesByRoom(roomId, limit = 50, offset = 0) {
    const result = await db.select({
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
        avatar: characters.avatar
      }
    }).from(messages).leftJoin(characters, eq(messages.characterId, characters.id)).where(eq(messages.roomId, roomId)).orderBy(desc(messages.createdAt)).limit(limit).offset(offset);
    return result.map((row) => ({
      ...row,
      character: row.character && row.character.firstName ? row.character : {
        firstName: "Vyprav\u011B\u010D",
        middleName: null,
        lastName: "",
        avatar: null
      }
    }));
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async deleteMessage(id) {
    try {
      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch {
      return false;
    }
  }
  async updateMessageCharacter(messageId, characterId) {
    await db.update(messages).set({ characterId }).where(eq(messages.id, messageId));
  }
  // Archive operations (keeping existing)
  async archiveMessages(roomId, beforeDate) {
    const whereCondition = beforeDate ? and(eq(messages.roomId, roomId), lt(messages.createdAt, beforeDate)) : eq(messages.roomId, roomId);
    const messagesToArchive = await db.select({
      id: messages.id,
      roomId: messages.roomId,
      characterId: messages.characterId,
      content: messages.content,
      messageType: messages.messageType,
      createdAt: messages.createdAt,
      characterName: characters.firstName,
      characterLastName: characters.lastName,
      characterMiddleName: characters.middleName
    }).from(messages).innerJoin(characters, eq(messages.characterId, characters.id)).where(whereCondition);
    if (messagesToArchive.length === 0) {
      return 0;
    }
    const archiveData = messagesToArchive.map((msg) => ({
      originalMessageId: msg.id,
      roomId: msg.roomId,
      characterId: msg.characterId,
      characterName: `${msg.characterName}${msg.characterMiddleName ? " " + msg.characterMiddleName : ""} ${msg.characterLastName}`,
      content: msg.content,
      messageType: msg.messageType,
      originalCreatedAt: msg.createdAt
    }));
    await db.insert(archivedMessages).values(archiveData);
    const deleteResult = await db.delete(messages).where(whereCondition);
    return deleteResult.rowCount || 0;
  }
  async getArchivedMessages(roomId, limit = 50, offset = 0) {
    return db.select().from(archivedMessages).where(eq(archivedMessages.roomId, roomId)).orderBy(desc(archivedMessages.originalCreatedAt)).limit(limit).offset(offset);
  }
  async deleteAllMessages() {
    await db.delete(messages);
    await db.delete(archivedMessages);
  }
  async clearRoomMessages(roomId) {
    const deleteResult = await db.delete(messages).where(eq(messages.roomId, roomId));
    return deleteResult.rowCount || 0;
  }
  async getArchiveDates(roomId) {
    const dates = await db.selectDistinct({ archivedAt: archivedMessages.archivedAt }).from(archivedMessages).where(eq(archivedMessages.roomId, roomId)).orderBy(desc(archivedMessages.archivedAt));
    return dates.map((d) => d.archivedAt.toISOString().split("T")[0]);
  }
  async getArchiveDatesWithCounts(roomId) {
    const result = await db.select({
      archivedAt: archivedMessages.archivedAt,
      count: count()
    }).from(archivedMessages).where(eq(archivedMessages.roomId, roomId)).groupBy(archivedMessages.archivedAt).orderBy(desc(archivedMessages.archivedAt));
    return result.map((r) => ({
      date: r.archivedAt.toISOString().split("T")[0],
      count: Number(r.count)
    }));
  }
  async getArchivedMessagesByDate(roomId, archiveDate, limit = 50, offset = 0) {
    const startDate = new Date(archiveDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    return db.select().from(archivedMessages).where(
      and(
        eq(archivedMessages.roomId, roomId),
        gte(archivedMessages.archivedAt, startDate),
        lt(archivedMessages.archivedAt, endDate)
      )
    ).orderBy(desc(archivedMessages.originalCreatedAt)).limit(limit).offset(offset);
  }
  async getLastMessageByCharacter(characterId) {
    const [message] = await db.select().from(messages).where(eq(messages.characterId, characterId)).orderBy(desc(messages.createdAt)).limit(1);
    return message;
  }
  // Character request operations
  async createCharacterRequest(request) {
    const [characterRequest] = await db.insert(characterRequests).values(request).returning();
    return characterRequest;
  }
  async getCharacterRequestsByUserId(userId) {
    return db.select().from(characterRequests).where(eq(characterRequests.userId, userId)).orderBy(desc(characterRequests.createdAt));
  }
  async getCharacterRequestById(requestId) {
    const [request] = await db.select().from(characterRequests).where(eq(characterRequests.id, requestId));
    return request;
  }
  async deleteCharacterRequest(requestId) {
    const result = await db.delete(characterRequests).where(eq(characterRequests.id, requestId));
    return (result.rowCount || 0) > 0;
  }
  async getAllCharacterRequests() {
    return db.select({
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
        email: users.email
      }
    }).from(characterRequests).innerJoin(users, eq(characterRequests.userId, users.id)).orderBy(desc(characterRequests.createdAt));
  }
  async getPendingCharacterRequests() {
    return db.select({
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
        email: users.email
      }
    }).from(characterRequests).innerJoin(users, eq(characterRequests.userId, users.id)).where(eq(characterRequests.status, "pending")).orderBy(desc(characterRequests.createdAt));
  }
  async approveCharacterRequest(requestId, adminId, reviewNote) {
    const [request] = await db.select().from(characterRequests).where(eq(characterRequests.id, requestId));
    if (!request) {
      throw new Error("Character request not found");
    }
    const existingCharacters = await db.select().from(characters).where(and(eq(characters.userId, request.userId), eq(characters.isActive, true)));
    await db.update(characterRequests).set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewNote
    }).where(eq(characterRequests.id, requestId));
    const [character] = await db.insert(characters).values({
      firstName: request.firstName,
      middleName: request.middleName,
      lastName: request.lastName,
      birthDate: request.birthDate,
      school: request.school,
      description: request.description,
      isActive: true
    }).returning();
    await this.logAdminActivity({
      adminId,
      action: "approve_character",
      targetUserId: request.userId,
      targetCharacterId: character.id,
      targetRequestId: requestId,
      details: `Approved character: ${request.firstName} ${request.lastName}`
    });
    return character;
  }
  async rejectCharacterRequest(requestId, adminId, reviewNote) {
    const [request] = await db.update(characterRequests).set({
      status: "rejected",
      reviewedBy: adminId,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewNote
    }).where(eq(characterRequests.id, requestId)).returning();
    await this.logAdminActivity({
      adminId,
      action: "reject_character",
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Rejected character request: ${request.firstName} ${request.lastName}`
    });
    return request;
  }
  // Admin activity log operations
  async logAdminActivity(activity) {
    const [log2] = await db.insert(adminActivityLog).values(activity).returning();
    return log2;
  }
  async getAdminActivityLog(limit = 50, offset = 0) {
    return db.select({
      id: adminActivityLog.id,
      adminId: adminActivityLog.adminId,
      action: adminActivityLog.action,
      targetUserId: adminActivityLog.targetUserId,
      targetCharacterId: adminActivityLog.targetCharacterId,
      targetRequestId: adminActivityLog.targetRequestId,
      details: adminActivityLog.details,
      createdAt: adminActivityLog.createdAt,
      admin: {
        username: users.username
      },
      targetUser: {
        username: users.username
      }
    }).from(adminActivityLog).innerJoin(users, eq(adminActivityLog.adminId, users.id)).orderBy(desc(adminActivityLog.createdAt)).limit(limit).offset(offset);
  }
  // Multi-character operations
  // Cemetery operations
  async killCharacter(characterId, deathReason, adminId) {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    const userCharacters = await db.select().from(characters).where(and(eq(characters.userId, character.userId), eq(characters.isActive, true)));
    const [killedCharacter] = await db.update(characters).set({
      isActive: false,
      deathDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // Current date
      deathReason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(characters.id, characterId)).returning();
    await this.logAdminActivity({
      adminId,
      action: "kill_character",
      targetUserId: character.userId,
      targetCharacterId: characterId,
      details: `Killed character: ${character.firstName} ${character.lastName}. Reason: ${deathReason}`
    });
    return killedCharacter;
  }
  async reviveCharacter(characterId) {
    const [updatedCharacter] = await db.update(characters).set({
      deathDate: null,
      deathReason: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(characters.id, characterId)).returning();
    return updatedCharacter;
  }
  async getDeadCharacters() {
    return db.select().from(characters).where(and(
      isNotNull(characters.deathDate)
    )).orderBy(desc(characters.deathDate), desc(characters.createdAt));
  }
  // Spell operations
  async getAllSpells() {
    return db.select().from(spells).orderBy(spells.category, spells.name);
  }
  async getSpell(id) {
    const [spell] = await db.select().from(spells).where(eq(spells.id, id));
    return spell;
  }
  async getSpellByName(name) {
    const [spell] = await db.select().from(spells).where(eq(spells.name, name));
    return spell;
  }
  async createSpell(insertSpell) {
    const [spell] = await db.insert(spells).values(insertSpell).returning();
    return spell;
  }
  async updateSpell(id, updates) {
    const [spell] = await db.update(spells).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(spells.id, id)).returning();
    return spell;
  }
  async deleteSpell(id) {
    await db.delete(characterSpells).where(eq(characterSpells.spellId, id));
    const result = await db.delete(spells).where(eq(spells.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Character spell operations
  async getCharacterSpells(characterId) {
    return db.select({
      id: characterSpells.id,
      characterId: characterSpells.characterId,
      spellId: characterSpells.spellId,
      learnedAt: characterSpells.learnedAt,
      spell: spells
    }).from(characterSpells).innerJoin(spells, eq(characterSpells.spellId, spells.id)).where(eq(characterSpells.characterId, characterId)).orderBy(spells.category, spells.name);
  }
  async addSpellToCharacter(characterId, spellId) {
    const [characterSpell] = await db.insert(characterSpells).values({ characterId, spellId }).returning();
    return characterSpell;
  }
  async removeSpellFromCharacter(characterId, spellId) {
    const result = await db.delete(characterSpells).where(and(
      eq(characterSpells.characterId, characterId),
      eq(characterSpells.spellId, spellId)
    ));
    return (result.rowCount ?? 0) > 0;
  }
  // Initialize default spells and add them to all existing characters
  async initializeDefaultSpells() {
    const defaultSpells = [
      {
        name: "Carpe Retractum",
        description: "Vytvo\u0159\xED sv\u011Bteln\xE9 lano, kter\xE9 slou\u017E\xED k p\u0159ita\u017Een\xED p\u0159edm\u011Btu k ses\xEDlateli",
        effect: "Vytvo\u0159\xED sv\u011Bteln\xE9 lano, kter\xE9 slou\u017E\xED k p\u0159ita\u017Een\xED p\u0159edm\u011Btu k ses\xEDlateli, pokud je pou\u017Eito na pevn\u011B ukotven\xFD p\u0159edm\u011Bt, m\u016F\u017Ee se naopak p\u0159it\xE1hnout ses\xEDlatel.",
        category: "Kouzeln\xE9 formule",
        type: "Z\xE1kladn\xED",
        targetType: "object"
      },
      {
        name: "Lumos",
        description: "Rozsv\xEDt\xED konec h\u016Flky jako sv\xEDtilnu",
        effect: "Rozsv\xEDt\xED konec h\u016Flky jako sv\xEDtilnu.",
        category: "Kouzeln\xE9 formule",
        type: "Z\xE1kladn\xED",
        targetType: "self"
      },
      {
        name: "Nox",
        description: "Zhasne sv\u011Btlo vyvolan\xE9 kouzlem Lumos",
        effect: "Zhasne sv\u011Btlo vyvolan\xE9 kouzlem Lumos.",
        category: "Kouzeln\xE9 formule",
        type: "Z\xE1kladn\xED",
        targetType: "self"
      }
    ];
    for (const spellData of defaultSpells) {
      const existingSpells = await db.select().from(spells).where(eq(spells.name, spellData.name));
      let spell;
      if (existingSpells.length === 0) {
        [spell] = await db.insert(spells).values(spellData).returning();
        console.log(`Created spell: ${spell.name}`);
      } else {
        spell = existingSpells[0];
        console.log(`Spell already exists: ${spell.name}`);
      }
      const allCharacters = await db.select().from(characters);
      for (const character of allCharacters) {
        const existingCharacterSpell = await db.select().from(characterSpells).where(and(
          eq(characterSpells.characterId, character.id),
          eq(characterSpells.spellId, spell.id)
        ));
        if (existingCharacterSpell.length === 0) {
          await db.insert(characterSpells).values({
            characterId: character.id,
            spellId: spell.id
          });
          console.log(`Added spell ${spell.name} to character ${character.firstName} ${character.lastName}`);
        }
      }
    }
  }
  // Character inventory operations
  async getCharacterInventory(characterId) {
    return db.select().from(characterInventory).where(eq(characterInventory.characterId, characterId)).orderBy(characterInventory.category, characterInventory.itemName);
  }
  async getInventoryItem(id) {
    const [item] = await db.select().from(characterInventory).where(eq(characterInventory.id, id));
    return item;
  }
  async addInventoryItem(item) {
    const [inventoryItem] = await db.insert(characterInventory).values(item).returning();
    return inventoryItem;
  }
  async updateInventoryItem(id, updates) {
    const [item] = await db.update(characterInventory).set(updates).where(eq(characterInventory.id, id)).returning();
    return item;
  }
  async deleteInventoryItem(id) {
    const result = await db.delete(characterInventory).where(eq(characterInventory.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Character journal operations
  async getCharacterJournal(characterId) {
    return db.select().from(characterJournal).where(eq(characterJournal.characterId, characterId)).orderBy(desc(characterJournal.entryDate), desc(characterJournal.createdAt));
  }
  async getJournalEntry(id) {
    const [entry] = await db.select().from(characterJournal).where(eq(characterJournal.id, id));
    return entry;
  }
  async addJournalEntry(entry) {
    const [journalEntry] = await db.insert(characterJournal).values(entry).returning();
    return journalEntry;
  }
  async updateJournalEntry(id, updates) {
    const [entry] = await db.update(characterJournal).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(characterJournal.id, id)).returning();
    return entry;
  }
  async deleteJournalEntry(id) {
    const result = await db.delete(characterJournal).where(eq(characterJournal.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Wand operations
  async getCharacterWand(characterId) {
    const [wand] = await db.select().from(wands).where(eq(wands.characterId, characterId));
    return wand;
  }
  async createWand(insertWand) {
    const [wand] = await db.insert(wands).values(insertWand).returning();
    return wand;
  }
  async updateWand(id, updates) {
    const [wand] = await db.update(wands).set(updates).where(eq(wands.id, id)).returning();
    return wand;
  }
  async deleteWand(id) {
    const result = await db.delete(wands).where(eq(wands.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async generateRandomWand(characterId) {
    const allComponents = await this.getAllWandComponents();
    const availableWoods = allComponents.woods.filter((wood) => wood.availableForRandom === true);
    const availableCores = allComponents.cores.filter((core) => core.availableForRandom === true);
    const availableLengths = allComponents.lengths.filter((length) => length.availableForRandom === true);
    const availableFlexibilities = allComponents.flexibilities.filter((flex) => flex.availableForRandom === true);
    if (availableWoods.length === 0 || availableCores.length === 0 || availableLengths.length === 0 || availableFlexibilities.length === 0) {
      throw new Error("Insufficient components available for random wand generation");
    }
    const randomWood = availableWoods[Math.floor(Math.random() * availableWoods.length)];
    const randomCore = availableCores[Math.floor(Math.random() * availableCores.length)];
    const randomLength = availableLengths[Math.floor(Math.random() * availableLengths.length)];
    const randomFlexibility = availableFlexibilities[Math.floor(Math.random() * availableFlexibilities.length)];
    const description = `H\u016Flka z ${randomWood.name.toLowerCase()}, ${randomLength.name} dlouh\xE1, ${randomFlexibility.name.toLowerCase()}, s j\xE1drem ${randomCore.name.toLowerCase()}. Vybr\xE1na Ollivanderem osobn\u011B pro sv\xE9ho nov\xE9ho majitele.`;
    const wandData = {
      characterId,
      wood: randomWood.name,
      core: randomCore.name,
      length: randomLength.name,
      flexibility: randomFlexibility.name,
      description
    };
    return this.createWand(wandData);
  }
  async getAllWandComponents() {
    try {
      const [woods, cores, lengths, flexibilities] = await Promise.all([
        db.select().from(wandWoods).orderBy(wandWoods.name),
        db.select().from(wandCores).orderBy(wandCores.categorySortOrder, wandCores.name),
        db.select().from(wandLengths).orderBy(wandLengths.sortOrder),
        db.select().from(wandFlexibilities).orderBy(wandFlexibilities.name)
      ]);
      return {
        woods: woods.map((w) => ({
          name: w.name,
          shortDescription: w.shortDescription,
          longDescription: w.longDescription,
          availableForRandom: w.availableForRandom
        })),
        cores: cores.map((c) => ({
          name: c.name,
          category: c.category,
          description: c.description,
          availableForRandom: c.availableForRandom
        })),
        lengths: lengths.map((l) => ({
          name: l.name,
          description: l.description,
          availableForRandom: l.availableForRandom
        })),
        flexibilities: flexibilities.map((f) => ({
          name: f.name,
          description: f.description,
          availableForRandom: f.availableForRandom
        }))
      };
    } catch (error) {
      console.error("Error loading wand components from database:", error);
      return {
        woods: [],
        cores: [],
        lengths: [],
        flexibilities: []
      };
    }
  }
  getDefaultWandComponents() {
    const woods = [
      {
        name: "Ak\xE1cie",
        shortDescription: "Velmi neobvykl\xE9 h\u016Flkov\xE9 d\u0159evo, z n\u011Bho\u017E, jak se mi zd\xE1, poch\xE1z\xED h\u016Flky tak trochu lstiv\xE9 a \xFAsko\u010Dn\xE9",
        longDescription: "Velmi neobvykl\xE9 h\u016Flkov\xE9 d\u0159evo, z n\u011Bho\u017E, jak se mi zd\xE1, poch\xE1z\xED h\u016Flky tak trochu lstiv\xE9 a \xFAsko\u010Dn\xE9, kter\xE9 \u010Dasto odm\xEDtnou spolupracovat s k\xFDmkoliv jin\xFDm ne\u017E se sv\xFDm majitelem a kter\xE9 jsou nejlep\u0161\xED a nej\xFA\u010Dinn\u011Bj\u0161\xED v rukou t\u011Bh nejnadan\u011Bj\u0161\xEDch. Tato citlivost je \u010Din\xED obt\xED\u017En\u011B p\u0159i\u0159aditeln\xFDmi, a proto jich m\xE1m ve skladu pouze m\xE1lo pro ty \u010Darod\u011Bjky a kouzeln\xEDky, kte\u0159\xED jsou dostate\u010Dn\u011B jemn\xED; pro ak\xE1t se nehod\xED to, \u010Demu se \u0159\xEDk\xE1 ,bum-a-puf' magie. Pokud najde dobr\xE9ho majitele, ak\xE1ciov\xE1 h\u016Flka m\u016F\u017Ee poskytnout hodn\u011B energie, av\u0161ak neb\xFDv\xE1 takto \u010Dasto vyu\u017E\xEDv\xE1na kv\u016Fli zvl\xE1\u0161tnosti jej\xEDho temperamentu."
      },
      {
        name: "Anglick\xFD dub",
        shortDescription: "Siln\xE9, v\u011Brn\xE9 d\u0159evo pro odv\xE1\u017En\xE9 a intuitivn\xED jedince spojen\xE9 s p\u0159\xEDrodn\xED magi\xED",
        longDescription: 'To jsou h\u016Flky vhodn\xE9 v \u010Dasech dobr\xFDch i zl\xFDch, a jsou v\u011Brn\xFDmi p\u0159\xE1teli kouzeln\xEDk\u016F, kte\u0159\xED si je zaslou\u017E\xED. H\u016Flky z anglick\xE9ho dubu po\u017Eaduj\xED po sv\xFDch partnerech s\xEDlu, odvahu a v\u011Brnost. M\xE9n\u011B zn\xE1m\xFD je fakt, \u017Ee majitel\xE9 t\u011Bchto h\u016Flek m\xEDvaj\xED silnou intuici a \u010Dasto jsou p\u0159itahov\xE1ni p\u0159\xEDrodn\xED magi\xED obklopuj\xEDc\xED tvory i rostliny, je\u017E jsou pro kouzeln\xEDky nezbytn\xE9 jak na jejich kouzla, tak pro pot\u011B\u0161en\xED. Dub je naz\xFDv\xE1n kr\xE1lem lesa vl\xE1dnouc\xEDm od zimn\xEDho do letn\xEDho slunovratu, a tud\xED\u017E by jeho d\u0159evo m\u011Blo b\xFDt z\xEDsk\xE1v\xE1no pouze v t\xE9to dob\u011B (kr\xE1lovnou v \u010Dase, kdy den za\u010D\xEDn\xE1 znovu ub\xFDvat, je cesm\xEDna, tak\u017Ee ta by zase m\u011Bla b\xFDt sb\xEDr\xE1na pouze s koncem roku. Z toho mo\u017En\xE1 plyne ona star\xE1 pov\u011Bra: "kdy\u017E jeho h\u016Flka z dubu a jej\xED z cesm\xEDny, vz\xEDt se by byl omyl nesm\xEDrn\xFD", kter\xE9\u017Eto po\u0159ekadlo mi osobn\u011B p\u0159ipad\xE1 jako nesmysl). \u0158\xEDk\xE1 se, \u017Ee Merlinova h\u016Flka byla z anglick\xE9ho dubu (ale je\u017Eto se jeho hrob nikdy nena\u0161el, nejsou pro to \u017E\xE1dn\xE9 d\u016Fkazy).'
      },
      {
        name: "Borovice",
        shortDescription: "Tich\xE9 a nez\xE1visl\xE9 h\u016Flky pro v\xFDjime\u010Dn\u011B samostatn\xE9 kouzeln\xEDky",
        longDescription: "H\u016Flka vyroben\xE1 z rovnovl\xE1knit\xE9ho d\u0159eva borovice si v\u017Edy vyb\xEDr\xE1 ty, kdo\u017E jsou nez\xE1visl\xED a samostatn\xED, a b\xFDvaj\xED pova\u017Eov\xE1ni za osam\u011Bl\xE9, zvl\xE1\u0161tn\xED a mo\u017En\xE1 i tajemn\xE9. Borovicov\xE9 h\u016Flky cht\u011Bj\xED b\xFDt pou\u017E\xEDv\xE1ny kreativn\u011B, a na rozd\xEDl od mnoh\xFDch se bez protest\u016F podvol\xED nov\xFDm metod\xE1m a zakl\xEDnadl\u016Fm. Mnoho h\u016Flka\u0159\u016F tvrd\xED, \u017Ee borovicov\xE9 h\u016Flky vyhled\xE1vaj\xED a tak\xE9 odv\xE1d\u011Bj\xED nejlep\u0161\xED pr\xE1ci majitel\u016Fm, kte\u0159\xED jsou p\u0159edur\u010Deni se do\u017E\xEDt vysok\xE9ho v\u011Bku, a j\xE1 mohu potvrdit, \u017Ee jsem je\u0161t\u011B nikdy neznal kouzeln\xEDka s borovicovou h\u016Flkou, kter\xFD by zem\u0159el mlad\xFD. Borovicov\xE1 h\u016Flka tak\xE9 pat\u0159\xED k t\u011Bm, kter\xE9 jsou nejv\xEDce vn\xEDmav\xE9 v\u016F\u010Di non-verb\xE1ln\xEDm kouzl\u016Fm."
      },
      {
        name: "Buk",
        shortDescription: "Elegantn\xED a vz\xE1cn\xE9 d\u0159evo pro moudr\xE9 a tolerantn\xED \u010Darod\u011Bje",
        longDescription: "Spr\xE1vn\xFD prot\u011Bj\u0161ek bukov\xE9 h\u016Flky bude, pokud mlad\xFD, tak na sv\u016Fj v\u011Bk moud\u0159ej\u0161\xED, pokud dosp\u011Bl\xFD, pak bohat\xFD v porozum\u011Bn\xED a zku\u0161enostech. Bukov\xE9 h\u016Flky velmi m\xE1lo slou\u017E\xED omezen\xFDm a netolerantn\xEDm. Takov\xED \u010Darod\u011Bjov\xE9 a \u010Darod\u011Bjky, obdr\u017E\xEDce bukovou h\u016Flku bez \u0159\xE1dn\xE9ho vybr\xE1n\xED (prahnouce po t\xE9to nejv\xEDce \u017E\xE1dan\xE9, n\xE1dhern\u011B barevn\xE9 a velmi drah\xE9 h\u016Flce) se pot\xE9 \u010Dasto objevuj\xED na praz\xEDch dom\u016F zku\u0161en\xFDch h\u016Flka\u0159\u016F \u2013 v\u010Detn\u011B toho m\xE9ho \u2013 cht\xEDce v\u011Bd\u011Bt, pro\u010D jejich \xFA\u017Easn\xE1 h\u016Flka nefunguje po\u0159\xE1dn\u011B. Pokud v\u0161ak bukov\xE1 h\u016Flka najde toho spr\xE1vn\xE9ho majitele, je schopn\xE1 jemnosti a um\u011Bn\xED, kter\xE9 lze velmi z\u0159\xEDdka nal\xE9zt u jak\xE9hokoliv jin\xE9ho d\u0159eva, a proto m\xE1 tak dobrou pov\u011Bst."
      },
      {
        name: "Cedr",
        shortDescription: "Siln\xE1 a loaj\xE1ln\xED h\u016Flka pro d\u016Fvtipn\xE9 a bystr\xE9 osobnosti s pevn\xFDm mor\xE1ln\xEDm kompasem",
        longDescription: 'Kdykoliv se setk\xE1m s n\u011Bk\xFDm, kdo u sebe nos\xED h\u016Flku z cedru, najdu u n\u011Bho silnou osobnost a neobvyklou loajalitu. M\u016Fj otec, \u017Derv\xE9 Ollivander, v\u017Edycky \u0159\xEDk\xE1val "Nikdy neoklame\u0161 majitele cedrov\xE9 h\u016Flky." A j\xE1 souhlas\xEDm: cedrov\xE1 h\u016Flka najde dokonal\xFD domov pr\xE1v\u011B tam, kde je d\u016Fvtip a post\u0159eh. Av\u0161ak j\xE1 bych \u0161el v tomto tvrzen\xED je\u0161t\u011B d\xE1l ne\u017E m\u016Fj otec a dodal bych, \u017Ee jsem nikdy nepotkal nositele cedrov\xE9 h\u016Flky, kter\xE9ho by bylo radno rozzu\u0159it, obzvl\xE1\u0161t\u011B pokud je ubl\xED\u017Eeno jeho bl\xEDzk\xFDm. \u010Carod\u011Bjka nebo \u010Darod\u011Bj, kte\u0159\xED byli vybr\xE1ni h\u016Flkou z cedru, v sob\u011B maj\xED potenci\xE1l b\xFDt nebezpe\u010Dn\xFDmi protivn\xEDky, co\u017E \u010Dasto b\xFDv\xE1 nep\u0159\xEDjemn\xFDm p\u0159ekvapen\xEDm pro ty, kte\u0159\xED je lehkomysln\u011B vyzvali k souboji.'
      },
      {
        name: "Cesm\xEDna",
        shortDescription: "Ochran\xE1\u0159sk\xE9 d\u0159evo pro vzn\u011Btliv\xE9 osobnosti proch\xE1zej\xEDc\xED nebezpe\u010Dn\xFDmi duchovn\xEDmi hled\xE1n\xEDmi",
        longDescription: "Cesm\xEDna je jedn\xEDm z vz\xE1cn\u011Bj\u0161\xEDch h\u016Flkov\xFDch d\u0159ev; jako\u017Eto odjak\u017Eiva pova\u017Eov\xE1na za ochran\xE1\u0159skou, cesm\xEDnov\xE1 h\u016Flka nejrad\u011Bji pracuje s t\u011Bmi, co b\xFDvaj\xED vzn\u011Btliv\xED a mohou pot\u0159ebovat pomoc p\u0159i p\u0159em\xE1h\xE1n\xED hn\u011Bvu. Z\xE1rove\u0148 si v\u0161ak vyb\xEDraj\xED i ty, kte\u0159\xED jsou namo\u010Deni v n\u011Bjak\xE9m nebezpe\u010Dn\xE9m a \u010Dasto duchovn\xEDm hled\xE1n\xED. Cesm\xEDnov\xE9 d\u0159evo je z t\u011Bch, jejich\u017E schopnosti se velmi li\u0161\xED v z\xE1vislosti na j\xE1dru h\u016Flky, a je v\u0161eobecn\u011B velmi t\u011B\u017Ek\xE9 skloubit s pa\u0159ezem f\xE9nixe, nebo\u0165 jejich spojen\xED je neobvykl\xE9 a mus\xED se velmi p\u0159esn\u011B sladit. Kdy\u017E se to ale poda\u0159\xED, se s ni\u010D\xEDm nevyrovn\xE1. Cesm\xEDna je jedn\xEDm z tradi\u010Dn\xEDch materi\xE1l\u016F pou\u017E\xEDvan\xFDch p\u0159i v\xFDrob\u011B h\u016Flek a tak\xE9 jedn\xEDm z nejsv\xE1te\u010Dn\u011Bj\u0161\xEDch. Majitel\xE9: Harry Potter."
      },
      {
        name: "Cyp\u0159i\u0161",
        shortDescription: "\u0160lechetn\xE1 h\u016Flka pro state\u010Dn\xE9 a ob\u011Btav\xE9 du\u0161e, kter\xE9 se neboj\xED \u010Delit temnot\u011B \u2013 \u010Dasto spojen\xE1 s hrdinskou smrt\xED.",
        longDescription: "Cyp\u0159i\u0161ov\xE9 h\u016Flky jsou spojov\xE1ny s urozenost\xED. H\u016Flky z cyp\u0159i\u0161e nal\xE9zaj\xED sv\xE9 partnery v state\u010Dn\xFDch, troufal\xFDch a sebeob\u011Btav\xFDch \u2013 v t\u011Bch, kdo se neboj\xED \u010Delit st\xEDn\u016Fm v mysl\xEDch sv\xFDch i ostatn\xEDch."
      },
      {
        name: "\u010Cern\xFD bez",
        shortDescription: "Tajupln\xE1 a mimo\u0159\xE1dn\u011B mocn\xE1 h\u016Flka ur\u010Den\xE1 pouze v\xFDjime\u010Dn\xFDm kouzeln\xEDk\u016Fm s osudov\xFDm posl\xE1n\xEDm \u2013 odm\xEDt\xE1 slou\u017Eit komukoliv slab\u0161\xEDmu.",
        longDescription: "Je to snad nejneobvyklej\u0161\xED h\u016Flkov\xE9 d\u0159evo, nav\xEDc se o n\u011Bm \u0159\xEDk\xE1, \u017Ee p\u0159in\xE1\u0161\xED sm\u016Flu, a h\u016Flky z n\u011Bho vyroben\xE9 lze velmi t\u011B\u017Eko ovl\xE1dnout. M\xE1 v sob\u011B velmi silnou magii, ale odm\xEDt\xE1 z\u016Fstat s k\xFDmkoliv, kdo nen\xED ve sv\xE9 spole\u010Dnosti nad\u0159azen\xFD. Pouze pozoruhodn\xED a v\xFDjime\u010Dn\xED \u010Darod\u011Bjov\xE9 si dok\xE1\u017E\xED bezovou h\u016Flku udr\u017Eet po del\u0161\xED dobu."
      },
      {
        name: "\u010Cern\xFD o\u0159ech",
        shortDescription: "Velmi vn\xEDmav\xE9 d\u0159evo, kter\xE9 vy\u017Eaduje \u010Darod\u011Bje s \u010Dist\xFDm sv\u011Bdom\xEDm a silnou intuic\xED. Ztr\xE1c\xED s\xEDlu, pokud je jeho vlastn\xEDk neup\u0159\xEDmn\xFD s\xE1m k sob\u011B.",
        longDescription: "H\u016Flky vyroben\xE9 z \u010Dern\xE9ho o\u0159echu hledaj\xED p\xE1na s dobr\xFDmi instinkty a velk\xFDm porozum\u011Bn\xEDm. M\xE1 jednu vyslovenou v\xFDst\u0159ednost, a to \u017Ee je neobvykle vn\xEDmav\xE9 v\u016F\u010Di vnit\u0159n\xEDmu konfliktu, p\u0159i\u010Dem\u017E velmi poklesne jeho s\xEDla, pokud se jeho vlastn\xEDk pokus\xED o jak\xFDkoliv sebeklam. Nalezne-li up\u0159\xEDmn\xE9ho, sebev\u011Bdom\xE9ho majitele, stane se z n\xED jedna z nejv\u011Brn\u011Bj\u0161\xEDch a nejp\u016Fsobiv\u011Bj\u0161\xEDch h\u016Flek."
      },
      {
        name: "\u010Cerven\xFD dub",
        shortDescription: "H\u016Flka rychl\xFDch reakc\xED a bystr\xE9 mysli, ide\xE1ln\xED pro kouzeln\xEDky se sklony k souboj\u016Fm a originalit\u011B. Vy\u017Eaduje hbit\xE9ho a p\u0159izp\u016Fsobiv\xE9ho majitele.",
        longDescription: "O \u010Derven\xE9m dubu \u010Dasto usly\u0161\xEDte laickou pov\xEDda\u010Dku, \u017Ee je spolehlivou zn\xE1mkou hork\xE9 povahy sv\xE9ho majitele. Ve skute\u010Dnosti je ide\xE1ln\xEDm partnerem pro h\u016Flku z \u010Derven\xE9ho dubu ten, kdo\u017E opl\xFDv\xE1 neobvykle rychl\xFDmi reakcemi, co\u017E z n\xED \u010Din\xED perfektn\xED h\u016Flku pro kouzelnick\xE9 souboje. Mistr h\u016Flky z \u010Derven\xE9ho dubu m\xE1 rychl\xE9 pohyby, je bystr\xFD a p\u0159izp\u016Fsobiv\xFD."
      },
      {
        name: "D\u0159\xEDn",
        shortDescription: "Zlomysln\xE9 a hrav\xE9 d\u0159evo, vhodn\xE9 pro \u010Darod\u011Bje se smyslem pro humor a d\u016Fvtip. Odm\xEDt\xE1 neverb\xE1ln\xED kouzla a je velmi hlu\u010Dn\xE9.",
        longDescription: "D\u0159\xEDn je jeden z m\xFDch osobn\xEDch favorit\u016F, nav\xEDc jsem zjistil, \u017Ee vyb\xEDr\xE1n\xED vlastn\xEDka h\u016Flkou z d\u0159\xEDnu je v\u017Edy velmi z\xE1bavn\xE9. D\u0159\xEDnov\xE9 h\u016Flky jsou nep\u0159edv\xEDdateln\xE9 a zlomysln\xE9; maj\xED hravou povahu a hledaj\xED partnery, kte\u0159\xED maj\xED smysl pro humor a vzru\u0161en\xED. Zaj\xEDmavou vlastnost\xED h\u016Flek z d\u0159\xEDnu je, \u017Ee odm\xEDtaj\xED prov\xE1d\u011Bt neverb\xE1ln\xED kouzla a jsou \u010Dasto sp\xED\u0161e hlu\u010Dn\xE9."
      },
      {
        name: "Eben",
        shortDescription: "Temn\xE9 a mocn\xE9 d\u0159evo pro siln\xE9 individuality, kter\xE9 se dr\u017E\xED sv\xFDch p\u0159esv\u011Bd\u010Den\xED. V\xFDborn\xE9 pro p\u0159em\u011B\u0148ov\xE1n\xED a bojovou magii.",
        longDescription: "Toto temn\u011B \u010Dern\xE9 d\u0159evo m\xE1 p\u016Fsobiv\xFD vzhled i reputaci, neb se velmi hod\xED ke v\u0161em typ\u016Fm bojov\xE9 magie a tak\xE9 k p\u0159em\u011B\u0148ov\xE1n\xED. Eben nal\xE9z\xE1 zal\xEDben\xED v t\u011Bch, kdo maj\xED odvahu b\xFDt sami sebou. Nejlep\u0161\xEDm prot\u011Bj\u0161kem ebenov\xE9 h\u016Flky je ten, kdo se pevn\u011B dr\u017E\xED sv\xFDch p\u0159esv\u011Bd\u010Den\xED nehled\u011B na okoln\xED tlak, a kdo se jen tak neodklon\xED od sv\xFDch z\xE1m\u011Br\u016F."
      },
      {
        name: "Habr",
        shortDescription: "V\u011Brn\xE1 h\u016Flka pro \u010Darod\u011Bje s jedinou v\xE1\u0161n\xED nebo viz\xED, kter\xE9 se zcela oddaj\xED. Rychle p\u0159eb\xEDr\xE1 mor\xE1lku i styl sv\xE9ho majitele.",
        longDescription: "Habrov\xE9 h\u016Flky si za sv\xE9 \u017Eivotn\xED partnery vyb\xEDraj\xED talentovan\xE9 \u010Darod\u011Bjky a \u010Darod\u011Bje s jedinou, \u010Dirou v\xE1\u0161n\xED, kterou by n\u011Bkte\u0159\xED mohli nazvat obses\xED (a\u010Dkoliv j\xE1 d\xE1v\xE1m p\u0159ednost ozna\u010Den\xED 'vize'), kter\xE1 bude v podstat\u011B v\u017Edy napln\u011Bna. Habrov\xE9 h\u016Flky se rychleji ne\u017E v\u011Bt\u0161ina ostatn\xEDch h\u016Flek s\u017Eije s majitelov\xFDm stylem kouzlen\xED a z\xEDsk\xE1 tak vlastn\xED osobnost."
      },
      {
        name: "Hloh",
        shortDescription: "Siln\xE9 a rozporupln\xE9 d\u0159evo, vhodn\xE9 jak pro l\xE9\u010Den\xED, tak pro kletby. Vy\u017Eaduje zku\u0161en\xE9ho \u010Darod\u011Bje, jinak m\u016F\u017Ee b\xFDt nebezpe\u010Dn\xE9.",
        longDescription: "H\u016Flky z hlohu b\xFDvaj\xED velmi vhodn\xE9 na l\xE9\u010Divou magii, ale tak\xE9 jsou vynikaj\xEDc\xED na kletby, a v\u011Bt\u0161inou jsem zpozoroval, \u017Ee si r\xE1dy vyb\xEDraj\xED \u010Darod\u011Bjky a \u010Darod\u011Bje slo\u017Eit\xE9 povahy nebo alespo\u0148 ty proch\xE1zej\xEDc\xED obdob\xEDm vnit\u0159n\xEDho zmatku. Je slo\u017Eit\xE9 st\xE1t se mistrem hlohov\xE9 h\u016Flky, a v\u017Edycky bych si po\u0159\xE1dn\u011B rozmyslel, zda ji d\xE1t do rukou \u010Darod\u011Bjce \u010Di kouzeln\xEDkovi s prok\xE1zan\xFDm nad\xE1n\xEDm."
      },
      {
        name: "Hru\u0161e\u0148",
        shortDescription: "Zlatav\xE9 d\u0159evo pro \u0161lechetn\xE9 a p\u0159\xEDv\u011Btiv\xE9 du\u0161e, kter\xE9 si zachov\xE1v\xE1 svou kr\xE1su a s\xEDlu po dlouh\xE1 l\xE9ta. Nikdy nebyla spojena s \u010Dernou magi\xED.",
        longDescription: "Z tohoto do zlatova zbarven\xE9ho d\u0159eva se vyr\xE1b\xED h\u016Flky se skv\u011Bl\xFDmi magick\xFDmi schopnostmi, kter\xE9 ze sebe vydaj\xED to nejlep\u0161\xED, jsou-li v ruk\xE1ch p\u0159\xEDv\u011Btiv\xFDch, \u0161lechetn\xFDch a moudr\xFDch \u010Darod\u011Bjek a kouzeln\xEDk\u016F. Majitel\xE9 h\u016Flek z hru\u0161n\u011B jsou, alespo\u0148 jak jsem doposud za\u017Eil, obvykle velmi obl\xEDben\xED a respektovan\xED. Nev\xEDm o jedin\xE9m p\u0159\xEDpad\u011B, kdy by byla hru\u0161\u0148ov\xE1 h\u016Flka nalezena ve vlastnictv\xED \u010Darod\u011Bjky \u010Di \u010Darod\u011Bje, kte\u0159\xED se dali na cestu \u010Dern\xE9 magie."
      },
      {
        name: "Jablo\u0148",
        shortDescription: "Mocn\xE9 d\u0159evo vhodn\xE9 pro ty s vysok\xFDmi c\xEDli a ide\xE1ly, \u0161patn\u011B se hod\xED pro \u010Dernou magii. \u010Casto umo\u017E\u0148uje mluvit s magick\xFDmi tvory jejich p\u0159irozen\xFDmi jazyky.",
        longDescription: "Jablo\u0148ov\xFDch h\u016Flek se nevyr\xE1b\xED mnoho. Jsou mocn\xE9 a nejvhodn\u011Bj\u0161\xED pro majitele s vysok\xFDmi c\xEDli a ide\xE1ly, proto se toto d\u0159evo \u0161patn\u011B pou\u017E\xEDv\xE1 na \u010Dernou magii. Tvrd\xED se, \u017Ee dr\u017Eitele h\u016Flky z jablon\u011B \u010Dek\xE1 dlouh\xFD a \u0161\u0165astn\xFD \u017Eivot a j\xE1 jsem si v\u0161iml, \u017Ee z\xE1kazn\xEDci s velk\xFDm osobn\xEDm kouzlem najdou skv\u011Bl\xFD prot\u011Bj\u0161ek pr\xE1v\u011B v jablo\u0148ov\xE9 h\u016Flce."
      },
      {
        name: "Jasan",
        shortDescription: "H\u016Flky z jasanu pevn\u011B p\u0159ilnou ke sv\xE9mu majiteli a ztr\xE1cej\xED s\xEDlu p\u0159i p\u0159ed\xE1n\xED jin\xE9mu. Vhodn\xE9 pro tvrdohlav\xE9, state\u010Dn\xE9, ale ne arogantn\xED kouzeln\xEDky.",
        longDescription: "H\u016Flky vyroben\xE9 z jasanu p\u0159ilnou ke sv\xE9mu prav\xE9mu mistru a nem\u011Bli by se tedy darov\xE1vat nebo p\u0159ed\xE1vat od jejich p\u016Fvodn\xEDho majitele, proto\u017Ee pak ztrat\xED svou s\xEDlu a schopnosti. Ty \u010Darod\u011Bjky a \u010Darod\u011Bjov\xE9, kte\u0159\xED byli vybr\xE1ni jasanovou h\u016Flkou, v\u011Bt\u0161inou nejsou, pokud v\xEDm, snadno odkloniteln\xED od sv\xFDch domn\u011Bnek a z\xE1m\u011Br\u016F."
      },
      {
        name: "Javor",
        shortDescription: "Vyhled\xE1vaj\xED je dobrodruzi a cestovatel\xE9, kte\u0159\xED pot\u0159ebuj\xED \u010Dast\xE9 v\xFDzvy a zm\u011Bny prost\u0159ed\xED. H\u016Flka s nimi roste a zvy\u0161uje svou s\xEDlu.",
        longDescription: "Ji\u017E mnohokr\xE1t jsem zpozoroval, \u017Ee ti, kter\xE9 si vybrala h\u016Flka z javoru, jsou dobrodruzi a cestovateli od p\u0159\xEDrody. Javorov\xE9 h\u016Flky nerady z\u016Fst\xE1vaj\xED doma a maj\xED rad\u011Bji trochu t\xE9 ambice ve sv\xE9 \u010Darod\u011Bjce \u010Di kouzeln\xEDkovi, jinak jejich kouzla te\u017Eknou a ztr\xE1cej\xED na v\xFDraznosti. \u010Cerstv\xE9 v\xFDzvy a \u010Dast\xE1 zm\u011Bna prost\u0159ed\xED tuto h\u016Flku doslova rozza\u0159uj\xED."
      },
      {
        name: "Jedle",
        shortDescription: "Odoln\xE9 d\u0159evo, vy\u017Eaduje c\xEDlev\u011Bdom\xE9 a rozhodn\xE9 majitele. V rukou nerozhodn\xFDch se st\xE1v\xE1 slabou.",
        longDescription: 'M\u016Fj vzne\u0161en\xFD d\u011Bde\u010Dek, Gerbold Ollivander, v\u017Edycky \u0159\xEDkal h\u016Flk\xE1m z tohoto d\u0159eva "h\u016Flka p\u0159e\u017Eiv\u0161\xEDch," nebo\u0165 je kdysi prodal t\u0159em kouzeln\xEDk\u016Fm, kte\u0159\xED posl\xE9ze pro\u0161li smrteln\xFDm nebezpe\u010D\xEDm bez zk\u0159iven\xE9ho vl\xE1sku. Jedlov\xE9 h\u016Flky se obzvl\xE1\u0161t\u011B hod\xED na p\u0159em\u011B\u0148ov\xE1n\xED a r\xE1dy si vyb\xEDraj\xED vlastn\xEDky s c\xEDlev\u011Bdom\xFDm, rozhodn\xFDm, a n\u011Bkdy i pon\u011Bkud zastra\u0161uj\xEDc\xEDm chov\xE1n\xEDm.'
      },
      {
        name: "Je\u0159\xE1b",
        shortDescription: "V\xFDborn\xE9 pro ochrann\xE1 kouzla a jasnou mysl, odm\xEDt\xE1 temnou magii. Hod\xED se pro \u010Darod\u011Bje se \u0161lechetn\xFDm srdcem.",
        longDescription: "D\u0159evo z je\u0159\xE1bu bylo v\u017Edy pro v\xFDrobu h\u016Flek velmi obl\xEDben\xE9, nebo\u0165 m\xE1 pov\u011Bst d\u0159eva mnohem v\xEDce ochrann\xE9ho ne\u017E kter\xE9koliv jin\xE9. Ze sv\xFDch zku\u0161enost\xED v\xEDm, \u017Ee toto d\u0159evo je schopno u\u010Dinit v\u0161echny druhy ochrann\xFDch kouzel obzvl\xE1\u0161t\u011B siln\xFDmi a \u0161patn\u011B prolomiteln\xFDmi. \u0158\xEDk\xE1 se, \u017Ee \u017E\xE1dn\xE1 \u010Darod\u011Bjka \u010Di kouzeln\xEDk, kte\u0159\xED se dali na \u010Dernou magii, nikdy nem\u011Bli h\u016Flku z je\u0159\xE1bu."
      },
      {
        name: "Jilm",
        shortDescription: "Preferuje kouzeln\xEDky s d\u016Fstojnost\xED a obratnost\xED, d\u011Bl\xE1 m\xE1lo chyb a vytv\xE1\u0159\xED kr\xE1sn\xE1 kouzla. \u010Casto vol\xED mudlovsk\xE9 rodiny.",
        longDescription: "Nejlep\u0161\xEDmi partnery jilmov\xFDch h\u016Flek jsou kouzeln\xEDci z mudlovsk\xFDch rodin. Pravdou je, \u017Ee jilmov\xE9 h\u016Flky up\u0159ednost\u0148uj\xED kouzeln\xEDky s jist\xFDm vzez\u0159en\xEDm, obratnost\xED v magii a ur\u010Ditou p\u0159irozenou d\u016Fstojnost\xED. Ze sv\xFDch zku\u0161enost\xED zn\xE1m jilm jako d\u0159evo, je\u017E d\u011Bl\xE1 nejm\xE9n\u011B chyb a hloup\xFDch omyl\u016F a vy\u010Darov\xE1v\xE1 ta nejkr\xE1sn\u011Bj\u0161\xED kouzla a za\u0159\xEDkadla."
      },
      {
        name: "Ka\u0161tan",
        shortDescription: "M\u011Bn\xED charakter podle j\xE1dra, hod\xED se pro bylink\xE1\u0159e, krotitele tvor\u016F a letce. Kombinace s j\xE1drem z jednoro\u017Ece p\u0159itahuje ty, kdo se v\u011Bnuj\xED pr\xE1vu.",
        longDescription: "Toto je nejzaj\xEDmav\u011Bj\u0161\xED, mnohotv\xE1\u0159n\xE9 d\u0159evo, jeho\u017E charakter velmi z\xE1vis\xED na j\xE1dru h\u016Flky. H\u016Flky z ka\u0161tanu jsou nejv\xEDce p\u0159itahov\xE1ny \u010Darod\u011Bjkami a \u010Darod\u011Bji, kte\u0159\xED jsou dob\u0159\xED krotitel\xE9 magick\xFDch zv\xED\u0159at, t\u011Bmi, kte\u0159\xED jsou zb\u011Bhl\xED v bylink\xE1\u0159stv\xED, a t\u011Bmi kdo\u017E jsou letci od p\u0159\xEDrody. T\u0159i nej\xFAsp\u011B\u0161n\u011Bj\u0161\xED hlavy Starostolce vlastnily ka\u0161tanovou h\u016Flku s j\xE1drem z jednoro\u017Ece."
      },
      {
        name: "L\xEDpa st\u0159\xEDb\u0159it\xE1",
        shortDescription: "Atraktivn\xED d\u0159evo obl\xEDben\xE9 u jasnovidc\u016F a zru\u010Dn\xFDch nitrozpytn\xEDk\u016F, dod\xE1v\xE1 presti\u017E.",
        longDescription: "Toto neobvykl\xE9 a velmi atraktivn\xED d\u0159evo bylo ve st\u0159edov\u011Bku velmi obl\xEDben\xE9 u jasnovidc\u016F a zru\u010Dn\xFDch nitrozpytn\xEDk\u016F, z toho d\u016Fvodu, \u017Ee to byla h\u016Flka presti\u017Ee. Kde je l\xEDpa st\u0159\xEDb\u0159it\xE1, tam je i \u010Dest. V\xFDjime\u010Dn\xE9 je, \u017Ee v\u011Bt\u0161ina majitel\u016F st\u0159\xEDbrn\xFDch lip velmi rychle vyvinula schopnost jasnovidectv\xED."
      },
      {
        name: "L\xEDska",
        shortDescription: "Citliv\xE1 h\u016Flka, kter\xE1 reaguje na emoce majitele, m\u016F\u017Ee ale tak\xE9 absorbovat negativn\xED energii. M\xE1 schopnost hledat podzemn\xED vodu.",
        longDescription: "L\xEDskov\xE1 h\u016Flka je tak citliv\xE1 na emoce sv\xE9ho majitele, \u017Ee \u010Dasto vadne, pokud je n\u011Bkdo p\u0159edat jin\xE9 osob\u011B, i kdy\u017E jen na kr\xE1tkou dobu. M\xE1 tak\xE9 unik\xE1tn\xED schopnost absorbovat negativn\xED energii a m\u016F\u017Ee b\xFDt pou\u017Eita k detekci podzemn\xED vody. L\xEDska je obzvl\xE1\u0161t\u011B dobr\xE1 na p\u0159ekon\xE1v\xE1n\xED vlastn\xED povahy majitele."
      },
      {
        name: "Mod\u0159\xEDn",
        shortDescription: "Pevn\xE9 a odoln\xE9 d\u0159evo, kter\xE9 vy\u017Eaduje odv\xE1\u017En\xE9ho a v\u011Brn\xE9ho majitele; h\u016Flky z mod\u0159\xEDnu \u010Dasto odhal\xED skryt\xE9 schopnosti sv\xE9ho dr\u017Eitele.",
        longDescription: "Mod\u0159\xEDn je jedn\xEDm z nejpevn\u011Bj\u0161\xEDch h\u016Flkov\xFDch d\u0159ev. Vy\u017Eaduje odv\xE1\u017En\xE9ho a v\u011Brn\xE9ho majitele, kter\xFD nen\xED snadno odraziteln\xFD od sv\xFDch c\xEDl\u016F. H\u016Flky z mod\u0159\xEDnu maj\xED pov\u011Bst, \u017Ee dok\xE1\u017E\xED odhalit a rozvinout skryt\xE9 magick\xE9 schopnosti sv\xE9ho dr\u017Eitele, kter\xE9 ani s\xE1m netu\u0161\xED, \u017Ee m\xE1."
      },
      {
        name: "Ol\u0161e",
        shortDescription: "Nepoddajn\xE9 d\u0159evo, ide\xE1ln\xED pro n\xE1pomocn\xE9 a ohledupln\xE9 kouzeln\xEDky; vynik\xE1 v non-verb\xE1ln\xED magii na nejvy\u0161\u0161\xED \xFArovni.",
        longDescription: "Ol\u0161e je velmi nepoddajn\xE9 d\u0159evo, kter\xE9 si vyb\xEDr\xE1 kouzeln\xEDky s p\u0159irozenou sklony pom\xE1hat ostatn\xEDm. Je ide\xE1ln\xED pro n\xE1pomocn\xE9 a ohledupln\xE9 \u010Darod\u011Bje, kte\u0159\xED si z\xEDskaj\xED jejich respekt nejen sv\xFDmi schopnostmi, ale i charakterem. Vynik\xE1 p\u0159edev\u0161\xEDm v non-verb\xE1ln\xED magii na nejvy\u0161\u0161\xED \xFArovni."
      },
      {
        name: "Osika",
        shortDescription: "B\xEDl\xE9 a jemn\xE9 d\u0159evo, kter\xE9 nejl\xE9pe slu\u0161\xED sebev\u011Bdom\xFDm duelant\u016Fm a bojov\xFDm m\xE1g\u016Fm; symbolem odvahy a v\xFDzev.",
        longDescription: "Osika je b\xEDl\xE9 a jemn\xE9 d\u0159evo, kter\xE9 v\u0161ak v sob\u011B skr\xFDv\xE1 ne\u010Dekanou s\xEDlu. Nejl\xE9pe slu\u0161\xED sebev\u011Bdom\xFDm duelant\u016Fm a bojov\xFDm m\xE1g\u016Fm, kte\u0159\xED se neboj\xED v\xFDzev. Je symbolem odvahy a p\u0159ipravenosti \u010Delit nebezpe\u010D\xED. H\u016Flky z osiky maj\xED pov\u011Bst, \u017Ee povzbuzuj\xED sv\xE9ho majitele k odv\xE1\u017En\xFDm \u010Din\u016Fm."
      },
      {
        name: "Sekvoj",
        shortDescription: "Vz\xE1cn\xE9 a \u0161t\u011Bst\xED nep\u0159in\xE1\u0161ej\xEDc\xED, ale p\u0159itahuj\xEDc\xED kouzeln\xEDky s neot\u0159el\xFDm \xFAsudkem a schopnost\xED obr\xE1tit ne\u0161t\u011Bst\xED ve sv\u016Fj prosp\u011Bch.",
        longDescription: "Sekvoj je vz\xE1cn\xE9 d\u0159evo, o kter\xE9m se \u0159\xEDk\xE1, \u017Ee nep\u0159in\xE1\u0161\xED \u0161t\u011Bst\xED. P\u0159esto p\u0159itahuje kouzeln\xEDky s neot\u0159el\xFDm \xFAsudkem a v\xFDjime\u010Dnou schopnost\xED obr\xE1tit zd\xE1nliv\xE9 ne\u0161t\u011Bst\xED ve sv\u016Fj prosp\u011Bch. Majitel\xE9 sekvoje jsou \u010Dasto schopni naj\xEDt p\u0159\xEDle\u017Eitosti tam, kde jin\xED vid\xED pouze probl\xE9my."
      },
      {
        name: "Smrk",
        shortDescription: "Vy\u017Eaduje pevnou ruku a smysl pro humor; h\u016Flky ze smrku jsou v\u011Brn\xE9 a skv\u011Bl\xE9 pro ok\xE1zalou magii, ale nemaj\xED r\xE1dy nerv\xF3zn\xED povahy.",
        longDescription: "Smrk vy\u017Eaduje pevnou ruku a smysl pro humor. H\u016Flky ze smrku jsou v\u011Brn\xE9 sv\xE9mu majiteli a skv\u011Bl\xE9 pro ok\xE1zalou magii, ale nemaj\xED r\xE1dy nerv\xF3zn\xED nebo \xFAzkostliv\xE9 povahy. Nejl\xE9pe pracuj\xED s klidn\xFDmi a sebejist\xFDmi kouzeln\xEDky, kte\u0159\xED dok\xE1\u017E\xED ocenit jak s\xEDlu, tak kr\xE1su magie."
      },
      {
        name: "Sykomora",
        shortDescription: "Zv\u011Bdav\xE9 a dobrodru\u017En\xE9 d\u0159evo, kter\xE9 nesn\xE1\u0161\xED nudu; h\u016Flky ze sykomory vzplanou, pokud se jejich majitel nud\xED.",
        longDescription: "Sykomora je zv\u011Bdav\xE9 a dobrodru\u017En\xE9 d\u0159evo, kter\xE9 nade v\u0161e nesn\xE1\u0161\xED nudu. H\u016Flky ze sykomory maj\xED pov\u011Bst, \u017Ee doslova vzplanou, pokud se jejich majitel nud\xED nebo se nech\xE1 un\xE1\u0161et rutinou. Vyhled\xE1v\xE1 aktivn\xED a zv\u011Bdav\xE9 kouzeln\xEDky, kte\u0159\xED hledaj\xED neust\xE1le nov\xE9 v\xFDzvy a dobrodru\u017Estv\xED."
      },
      {
        name: "Tis",
        shortDescription: "Temn\xE9 a vz\xE1cn\xE9 d\u0159evo, spojuj\xEDc\xED se s moc\xED nad \u017Eivotem a smrt\xED; nevyb\xEDr\xE1 boj\xE1cn\xE9 majitele a \u010Dasto se poj\xED s osudy hrdin\u016F i zlosyn\u016F.",
        longDescription: "Tis je temn\xE9 a vz\xE1cn\xE9 d\u0159evo, kter\xE9 se tradi\u010Dn\u011B spojuje s moc\xED nad \u017Eivotem a smrt\xED. Nevyb\xEDr\xE1 si boj\xE1cn\xE9 majitele a \u010Dasto se poj\xED s osudy v\xFDznamn\xFDch postav \u2013 jak hrdin\u016F, tak zlosyn\u016F. Majitel\xE9 tisov\xFDch h\u016Flek jsou obvykle jedinci s v\xFDjime\u010Dn\xFDm osudem a silnou v\u016Fl\xED."
      },
      {
        name: "Topol",
        shortDescription: "D\u0159evo spolehliv\xE9 a z\xE1sadov\xE9, pro kouzeln\xEDky s jasnou mor\xE1ln\xED viz\xED; ide\xE1ln\xED pro ty, kdo v\u011B\u0159\xED v pevn\xE9 hodnoty.",
        longDescription: "Topol je d\u0159evo spolehliv\xE9 a z\xE1sadov\xE9, kter\xE9 si vyb\xEDr\xE1 kouzeln\xEDky s jasnou mor\xE1ln\xED viz\xED a pevn\xFDmi z\xE1sadami. Je ide\xE1ln\xED pro ty, kdo v\u011B\u0159\xED v nezm\u011Bnn\xE9 hodnoty a jsou ochotni za n\u011B bojovat. H\u016Flky z topolu jsou zn\xE1m\xE9 svou st\xE1lost\xED a v\u011Brnost\xED sv\xFDm p\u0159esv\u011Bd\u010Den\xEDm."
      },
      {
        name: "Trnka",
        shortDescription: "Pevn\xE9 d\u0159evo pro v\xE1le\u010Dn\xEDky a odoln\xE9 jedince; h\u016Flky z trnky pot\u0159ebuj\xED majitele, kte\u0159\xED pro\u0161li t\u011B\u017Ekostmi, aby se skute\u010Dn\u011B spojili.",
        longDescription: "Trnka je pevn\xE9 d\u0159evo ur\u010Den\xE9 pro v\xE1le\u010Dn\xEDky a odoln\xE9 jedince. H\u016Flky z trnky pot\u0159ebuj\xED majitele, kte\u0159\xED pro\u0161li \u017Eivotn\xEDmi t\u011B\u017Ekostmi a prok\xE1zali svou s\xEDlu v nep\u0159\xEDzni osudu, aby se s nimi skute\u010Dn\u011B spojili. Teprve po takov\xE9m spojen\xED odhal\xED svou plnou moc."
      },
      {
        name: "T\u0159e\u0161e\u0148",
        shortDescription: "Vz\xE1cn\xE9 a smrt\xEDc\xED d\u0159evo, vyhled\xE1van\xE9 v japonsk\xE9 magii; vy\u017Eaduje majitele s pevnou sebekontrolou a silnou mysl\xED.",
        longDescription: "T\u0159e\u0161e\u0148 je vz\xE1cn\xE9 a potenci\xE1ln\u011B smrt\xEDc\xED d\u0159evo, kter\xE9 je obzvl\xE1\u0161t\u011B vyhled\xE1van\xE9 v japonsk\xE9 magick\xE9 tradici. Vy\u017Eaduje majitele s mimo\u0159\xE1dn\u011B pevnou sebekontrolou a silnou mysl\xED, proto\u017Ee nezvl\xE1dnut\xED jeho s\xEDly m\u016F\u017Ee m\xEDt fat\xE1ln\xED n\xE1sledky. V ruk\xE1ch zku\u0161en\xE9ho m\xE1ga je v\u0161ak nesm\xEDrn\u011B mocn\xE9."
      },
      {
        name: "Vav\u0159\xEDn",
        shortDescription: "Nezn\xE1 lenost; v\u011Brn\xE1 h\u016Flka, kter\xE1 dok\xE1\u017Ee sama sebe br\xE1nit a ztrestat zlod\u011Bje ne\u010Dekan\xFDm bleskem.",
        longDescription: "Vav\u0159\xEDn je d\u0159evo, kter\xE9 nezn\xE1 lenost ani pasivitu. Je to v\u011Brn\xE1 h\u016Flka, kter\xE1 dok\xE1\u017Ee sama sebe br\xE1nit a je schopna ztrestat zlod\u011Bje nebo nehodn\xE9ho majitele ne\u010Dekan\xFDm bleskem. Vyb\xEDr\xE1 si aktivn\xED a c\xEDlev\u011Bdom\xE9 kouzeln\xEDky, kte\u0159\xED sd\xEDlej\xED jeho odpor k ne\u010Dinnosti a lenosti."
      },
      {
        name: "Vinn\xE1 r\xE9va",
        shortDescription: "Vinn\xE9 h\u016Flky si vyb\xEDraj\xED majitele s hlubokou vnit\u0159n\xED podstatou a p\u0159edstavivost\xED. Jsou citliv\xE9 a reaguj\xED u\u017E p\u0159i prvn\xEDm kontaktu \u2013 ide\xE1ln\xED pro ty, kdo hledaj\xED smysl a tajemstv\xED v magii.",
        longDescription: "Vinn\xE9 h\u016Flky si vyb\xEDraj\xED majitele s hlubokou vnit\u0159n\xED podstatou a bohatou p\u0159edstavivost\xED. Jsou mimo\u0159\xE1dn\u011B citliv\xE9 a reaguj\xED na sv\xE9ho budouc\xEDho majitele u\u017E p\u0159i prvn\xEDm kontaktu. Ide\xE1ln\xED jsou pro ty kouzeln\xEDky, kdo hledaj\xED hlub\u0161\xED smysl a tajemstv\xED v magii. V\u011Brn\xE9 jsou pouze t\u011Bm, kte\u0159\xED nejsou povrchn\xED a dok\xE1\u017E\xED ocenit slo\u017Eitost magick\xE9ho um\u011Bn\xED."
      },
      {
        name: "Vla\u0161sk\xFD o\u0159ech",
        shortDescription: "O\u0159echov\xE9 h\u016Flky jsou v\xFDzvou i darem pro chytr\xE9 a inovativn\xED kouzeln\xEDky. Po\u017Eaduj\xED inteligenci a odhodl\xE1n\xED, ale v rukou spr\xE1vn\xE9ho majitele jsou v\u0161estrann\xE9 a smrt\xEDc\xED.",
        longDescription: "O\u0159echov\xE9 h\u016Flky p\u0159edstavuj\xED jak v\xFDzvu, tak dar pro chytr\xE9 a inovativn\xED kouzeln\xEDky. Po\u017Eaduj\xED zna\u010Dnou inteligenci a neochv\u011Bjn\xE9 odhodl\xE1n\xED od sv\xE9ho majitele, ale v rukou spr\xE1vn\xE9ho \u010Darod\u011Bje jsou mimo\u0159\xE1dn\u011B v\u0161estrann\xE9 a potenci\xE1ln\u011B smrt\xEDc\xED. Jejich v\u011Brnost mus\xED b\xFDt tvrd\u011B z\xEDsk\xE1na, ale jakmile se vytvo\u0159\xED spojen\xED, je nezlomn\xE1."
      },
      {
        name: "Vrba",
        shortDescription: "Vrba vol\xED nejist\xE9, ale nad\u011Bjn\xE9 kouzeln\xEDky, kte\u0159\xED se neboj\xED r\u016Fstu. Jej\xED h\u016Flky vynikaj\xED v l\xE9\u010Div\xFDch a neverb\xE1ln\xEDch kouzlech, reaguj\xED na skryt\xE9 potenci\xE1ly a podn\u011Bcuj\xED rychlost.",
        longDescription: "Vrba si \u010Dasto vyb\xEDr\xE1 nejist\xE9, ale nad\u011Bjn\xE9 kouzeln\xEDky, kte\u0159\xED se neboj\xED osobn\xEDho r\u016Fstu a zm\u011Bny. Jej\xED h\u016Flky vynikaj\xED v l\xE9\u010Div\xFDch a neverb\xE1ln\xEDch kouzlech, maj\xED schopnost reagovat na skryt\xE9 potenci\xE1ly sv\xE9ho majitele a dok\xE1\u017E\xED podn\xEDtit rychlost reakc\xED i v nejt\u011B\u017E\u0161\xEDch chv\xEDl\xEDch. Vrba podporuje ty, kdo jsou ochotni se u\u010Dit a vyv\xEDjet."
      }
    ];
    const cores = [
      // Basic cores
      { name: "\u{1F409} Bl\xE1na z dra\u010D\xEDho srdce", category: "Z\xE1kladn\xED", description: "Nejsiln\u011Bj\u0161\xED j\xE1dro, ide\xE1ln\xED pro bojov\xE1 kouzla" },
      { name: "\u{1F984} Vlas z h\u0159\xEDvy jednoro\u017Ece", category: "Z\xE1kladn\xED", description: "Nejv\u011Brn\u011Bj\u0161\xED j\xE1dro, vhodn\xE9 pro l\xE9\u010Div\xE1 kouzla" },
      { name: "\u{1F525} Pero f\xE9nixe", category: "Z\xE1kladn\xED", description: "Nej\u0159\xEDd\u0161\xED j\xE1dro, schopn\xE9 nejv\u011Bt\u0161\xEDch kouzel" },
      // Plant cores
      { name: "\u{1F331} Ko\u0159en mandragory (su\u0161en\xFD, o\u010Darovan\xFD)", category: "Rostlinn\xE9", description: "Siln\xE9 spojen\xED se zem\xED a \u017Eivotn\xED silou. Nestabiln\xED p\u0159i destruktivn\xEDch kouzlech." },
      { name: "\u{1F338} Kv\u011Bt Asfodelu (uchovan\xFD v kouzelnick\xE9 prysky\u0159ici)", category: "Rostlinn\xE9", description: "Vztah ke smrti a p\u0159echodu mezi sv\u011Bty. Emo\u010Dn\u011B n\xE1ro\u010Dn\xE9 \u2013 vytahuje potla\u010Den\xE9 vzpom\xEDnky." },
      { name: "\u{1F343} List m\u011Bs\xED\u010Dn\xED kapradiny", category: "Rostlinn\xE9", description: "Posiluje iluze, neviditelnost, astr\xE1ln\xED projekci. M\xE9n\u011B vhodn\xE9 pro p\u0159\xEDm\xFD souboj." },
      // Creature cores
      { name: "\u{1F43A} Zub vlkodlaka", category: "Tvorov\xE9", description: "Posiluje \xFAto\u010Dn\xE1 kouzla, prom\u011Bny a zvy\u0161uje magickou agresi. M\u016F\u017Ee negativn\u011B ovlivnit psychiku." },
      { name: "\u{1F577}\uFE0F Jed z akromantule (zakonzervovan\xFD v vl\xE1knu)", category: "Tvorov\xE9", description: "V\xFDborn\xE9 pro subtiln\xED, jedovatou magii. Vytv\xE1\u0159\xED neklid v rukou \u010Dist\xFDch m\xE1g\u016F." },
      { name: "\u{1F40D} Had\xED jazyk (vz\xE1cn\xFD exempl\xE1\u0159)", category: "Tvorov\xE9", description: "Vhodn\xE9 pro hadomluvy, \u0161epoty, temn\xE1 zakl\xEDnadla. Extr\xE9mn\u011B vz\xE1cn\xE9 a nestabiln\xED." },
      { name: "\u{1F989} Ope\u0159en\xED z no\u010Dn\xED m\u016Fry (st\xEDnov\xE9ho hippogryfa)", category: "Tvorov\xE9", description: "Posiluje kouzla sp\xE1nku, viz\xED, no\u010Dn\xEDch p\u0159elud\u016F. Citliv\xE9 na sv\u011Btlo." },
      // Elemental cores
      { name: "\u{1FAA8} Dra\u010D\xED k\xE1men (Bloodstone)", category: "Element\xE1rn\xED", description: "Vztah k ob\u011Bti a krvi. Odeb\xEDr\xE1 u\u017Eivateli \u010D\xE1st energie p\u0159i siln\xFDch kouzlech." },
      { name: "\u{1F5A4} Obsidi\xE1n s runov\xFDm leptem", category: "Element\xE1rn\xED", description: "Skv\u011Bl\xFD pro magii \u0161t\xEDt\u016F, run, ochrann\xFDch kleteb. T\u011B\u017Ekop\xE1dn\xFD p\u0159i spont\xE1nn\xED magii." },
      { name: "\u{1F52E} M\u011Bs\xED\u010Dn\xED k\xE1men", category: "Element\xE1rn\xED", description: "Posiluje \u017Eenskou magii, v\u011B\u0161t\u011Bn\xED, vodn\xED a lun\xE1rn\xED kouzla. M\xE9n\u011B stabiln\xED p\u0159i \u010Dern\xE9 magii." },
      { name: "\u26A1 Rud\xFD jantar s du\u0161\xED hmyz\xEDho kr\xE1le", category: "Element\xE1rn\xED", description: "Podporuje experiment\xE1ln\xED magii a alchymii. Ob\u010Das vykazuje nez\xE1visl\xE9 chov\xE1n\xED." },
      // Lesser cores
      { name: "\u{1F9DD}\u200D\u2640\uFE0F Vlas v\xEDly", category: "M\xE9n\u011B u\u0161lechtil\xE9", description: "Kr\xE1sn\xE9 a t\u0159pytiv\xE9, ale nest\xE1l\xE9 a nevyzpytateln\xE9. Rychle ztr\xE1c\xED moc a n\xE1chyln\xE9 k selh\xE1n\xEDm." },
      { name: "\u{1F9B4} Nehet \u010Fasovce", category: "M\xE9n\u011B u\u0161lechtil\xE9", description: "Brut\xE1ln\xED a primitivn\xED magie zalo\u017Een\xE1 na s\xEDle a agresi. Obl\xEDben\xE9 u \u010Dernokn\u011B\u017En\xEDk\u016F." }
    ];
    const lengths = [
      { name: '7"', description: "Krat\u0161\xED h\u016Flka, obvykle vyb\xEDr\xE1 \u010Darod\u011Bje s men\u0161\xEDm vzr\u016Fstem nebo ty, kdo preferuj\xED diskr\xE9tn\xED magii." },
      { name: '8"', description: "Kompaktn\xED d\xE9lka ide\xE1ln\xED pro rychl\xE9 reakce a m\u011Bstskou magii. Snadno se skr\xFDv\xE1 a manipuluje." },
      { name: '9"', description: "Vyv\xE1\u017Een\xE1 krat\u0161\xED d\xE9lka vhodn\xE1 pro jemn\xE9 a p\u0159esn\xE9 kouzla. Obl\xEDben\xE1 u mlad\u0161\xEDch \u010Darod\u011Bj\u016F." },
      { name: '10"', description: "Klasick\xE1 d\xE9lka poskytuj\xEDc\xED dobr\xFD pom\u011Br mezi kontrolou a silou. Vhodn\xE1 pro v\u011Bt\u0161inu \u010Darod\u011Bj\u016F." },
      { name: '11"', description: "Vyv\xE1\u017Een\xE1 h\u016Flka s v\xFDbornou univerz\xE1lnost\xED. Popul\xE1rn\xED volba pro studenty i zku\u0161en\xE9 mistry." },
      { name: '12"', description: "Standardn\xED d\xE9lka nab\xEDzej\xEDc\xED stabilitu a spolehlivost. Ide\xE1ln\xED pro form\xE1ln\xED magii a v\xFDuku." },
      { name: '13"', description: "Pro ty, kte\u0159\xED maj\xED neoby\u010Dejn\xFD potenci\xE1l nebo extr\xE9mn\xED specializaci." },
      { name: '14"', description: "Dlouh\xE1 h\u016Flka, vhodn\xE1 pro form\xE1ln\xED, velkolepou nebo ritu\xE1ln\xED magii." },
      { name: '15"', description: "Rarita \u2013 vy\u017Eaduje siln\xE9 zam\u011B\u0159en\xED, ale odm\u011Bn\xED velk\xFDm dosahem a \xFA\u010Dinkem." },
      { name: '16"+', description: "Neobvykl\xE1 a\u017E v\xFDst\u0159edn\xED d\xE9lka. Obvykle jen u obr\u016F, divotv\u016Frc\u016F nebo v\xFDjime\u010Dn\xFDch osobnost\xED." }
    ];
    const flexibilities = [
      { name: "Nezlomn\xE1", description: "Extr\xE9mn\u011B pevn\xE1 a nepoddajn\xE1 h\u016Flka. Vhodn\xE1 pro \u010Darod\u011Bje s velmi silnou v\u016Fl\xED a nekompromisn\xED povahou." },
      { name: "Velmi nepoddajn\xE1", description: "Tvrd\xE1 h\u016Flka vy\u017Eaduj\xEDc\xED rozhodn\xE9ho majitele. Ide\xE1ln\xED pro ty, kdo preferuj\xED p\u0159\xEDmo\u010Dar\xE9 a siln\xE9 kouzla." },
      { name: "Nepoddajn\xE1", description: "Pevn\xE1 h\u016Flka pro stabiln\xED a spolehliv\xE9 \u010Darod\u011Bje. Dob\u0159e dr\u017E\xED tvar kouzel a odol\xE1v\xE1 zm\u011Bn\xE1m." },
      { name: "M\xEDrn\u011B nepoddajn\xE1", description: "Lehce tu\u017E\u0161\xED h\u016Flka nab\xEDzej\xEDc\xED dobrou kontrolu. Vhodn\xE1 pro p\u0159esn\xE9 a metodick\xE9 \u010Darod\u011Bje." },
      { name: "Pevn\xE1", description: "Vyv\xE1\u017Een\xE1 ohebnost poskytuj\xEDc\xED jak stabilitu, tak flexibilitu. Univerz\xE1ln\xED volba pro v\u011Bt\u0161inu kouzeln\xEDk\u016F." },
      { name: "Tvrd\xE1", description: "Pom\u011Brn\u011B pevn\xE1 h\u016Flka s dobrou odezvou. Ide\xE1ln\xED pro tradi\u010Dn\xED a form\xE1ln\xED magii." },
      { name: "Ohebn\xE1", description: "Flexibiln\xED h\u016Flka p\u0159izp\u016Fsobuj\xEDc\xED se stylu majitele. Vhodn\xE1 pro kreativn\xED a adaptabiln\xED \u010Darod\u011Bje." },
      { name: "Pru\u017En\xE1", description: "Velmi ohebn\xE1 h\u016Flka podporuj\xEDc\xED inovativn\xED kouzla. Preferuje experiment\xE1ln\xED a origin\xE1ln\xED p\u0159\xEDstupy." },
      { name: "Velmi pru\u017En\xE1", description: "Extr\xE9mn\u011B flexibiln\xED h\u016Flka pro \u010Darod\u011Bje s prom\u011Bnlivou povahou. Vynikaj\xEDc\xED pro improvisaci." },
      { name: "V\xFDjime\u010Dn\u011B poddajn\xE1", description: "Mimo\u0159\xE1dn\u011B ohebn\xE1 h\u016Flka pro ty nejv\xEDce p\u0159izp\u016Fsobiv\xE9 kouzeln\xEDky. Reaguje na nejjemn\u011Bj\u0161\xED pohyby." },
      { name: "Vrbovit\xE1", description: "Nejv\xEDce poddajn\xE1 mo\u017En\xE1 ohebnost. H\u016Flka se t\xE9m\u011B\u0159 oh\xFDb\xE1 s my\u0161lenkami majitele, vy\u017Eaduje delikatn\xED p\u0159\xEDstup." }
    ];
    return { woods, cores, lengths, flexibilities };
  }
  async migrateExistingWandsToInventory() {
    try {
      const existingWands = await db.select().from(wands);
      let migratedCount = 0;
      for (const wand of existingWands) {
        const existingInventoryItem = await db.select().from(characterInventory).where(
          and(
            eq(characterInventory.characterId, wand.characterId),
            eq(characterInventory.category, "Wand")
          )
        );
        if (existingInventoryItem.length === 0) {
          await db.insert(characterInventory).values({
            characterId: wand.characterId,
            itemName: `H\u016Flka (${wand.wood})`,
            itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
            quantity: 1,
            category: "Wand",
            rarity: "Epic",
            value: 7,
            // 7 galleons for a wand
            isEquipped: true,
            notes: "Migrace existuj\xEDc\xED h\u016Flky do invent\xE1\u0159e"
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
  storedWandComponents = null;
  async updateWandComponents(components) {
    try {
      for (const wood of components.woods) {
        await db.update(wandWoods).set({
          shortDescription: wood.shortDescription,
          longDescription: wood.longDescription,
          availableForRandom: wood.availableForRandom !== false
        }).where(eq(wandWoods.name, wood.name));
      }
      for (const core of components.cores) {
        await db.update(wandCores).set({
          category: core.category,
          description: core.description,
          availableForRandom: core.availableForRandom !== false
        }).where(eq(wandCores.name, core.name));
      }
      for (const length of components.lengths) {
        await db.update(wandLengths).set({
          description: length.description,
          availableForRandom: length.availableForRandom !== false
        }).where(eq(wandLengths.name, length.name));
      }
      for (const flexibility of components.flexibilities) {
        await db.update(wandFlexibilities).set({
          description: flexibility.description,
          availableForRandom: flexibility.availableForRandom !== false
        }).where(eq(wandFlexibilities.name, flexibility.name));
      }
      console.log("Wand components updated in database tables successfully");
    } catch (error) {
      console.error("Error updating wand components in database:", error);
      throw error;
    }
  }
  // Housing request operations
  async createHousingRequest(request) {
    const [newRequest] = await db.insert(housingRequests).values({
      ...request,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newRequest;
  }
  async getHousingRequestsByUserId(userId) {
    return db.select({
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
        lastName: characters.lastName
      }
    }).from(housingRequests).innerJoin(characters, eq(housingRequests.characterId, characters.id)).where(eq(housingRequests.userId, userId)).orderBy(desc(housingRequests.createdAt));
  }
  async getHousingRequestById(requestId) {
    const [request] = await db.select().from(housingRequests).where(eq(housingRequests.id, requestId));
    return request;
  }
  async deleteHousingRequest(requestId) {
    const result = await db.delete(housingRequests).where(eq(housingRequests.id, requestId));
    return (result.rowCount ?? 0) > 0;
  }
  async getPendingHousingRequests() {
    return db.select({
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
        email: users.email
      },
      character: {
        firstName: characters.firstName,
        middleName: characters.middleName,
        lastName: characters.lastName
      }
    }).from(housingRequests).innerJoin(users, eq(housingRequests.userId, users.id)).innerJoin(characters, eq(housingRequests.characterId, characters.id)).where(eq(housingRequests.status, "pending")).orderBy(desc(housingRequests.createdAt));
  }
  async approveHousingRequest(requestId, adminId, assignedAddress, reviewNote) {
    const [request] = await db.select().from(housingRequests).where(eq(housingRequests.id, requestId));
    if (!request) {
      throw new Error("Housing request not found");
    }
    const character = await this.getCharacter(request.characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    const [updatedRequest] = await db.update(housingRequests).set({
      status: "approved",
      assignedAddress,
      reviewNote,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewedBy: adminId
    }).where(eq(housingRequests.id, requestId)).returning();
    await db.update(characters).set({
      residence: assignedAddress,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(characters.id, request.characterId));
    if (request.housingName && request.housingPassword) {
      let targetCategory;
      if (request.selectedArea) {
        targetCategory = await this.getChatCategoryByName(request.selectedArea);
      }
      if (!targetCategory) {
        targetCategory = await this.getChatCategoryByName("Bydlen\xED");
        if (!targetCategory) {
          targetCategory = await this.createChatCategory({
            name: "Bydlen\xED",
            description: "Soukrom\xE1 bydlen\xED a s\xEDdla",
            sortOrder: 100
          });
        }
      }
      let roomDescription = `${this.getHousingTypeDescription(request.requestType)}`;
      if (request.size) {
        roomDescription += ` ${request.size}`;
      }
      roomDescription += ` - ${character.firstName}${character.middleName ? ` ${character.middleName}` : ""} ${character.lastName}`;
      let longDescription = `**INFORMACE O BYDLEN\xCD**

`;
      longDescription += `\u{1F4CD} **Adresa:** ${assignedAddress}
`;
      longDescription += `\u{1F3E0} **Typ:** ${this.getHousingTypeDescription(request.requestType)}
`;
      if (request.size) {
        longDescription += `\u{1F4CF} **Velikost:** ${request.size}
`;
      }
      longDescription += `\u{1F465} **Vlastn\xEDk:** ${character.firstName} ${character.middleName ? character.middleName + " " : ""}${character.lastName}
`;
      longDescription += `\u{1F4C5} **P\u0159id\u011Bleno:** ${(/* @__PURE__ */ new Date()).toLocaleDateString("cs-CZ")}

`;
      longDescription += `**POPIS:**
${request.description}`;
      await this.createChatRoom({
        name: request.housingName,
        description: roomDescription,
        longDescription,
        categoryId: targetCategory.id,
        password: request.housingPassword,
        isPublic: false,
        // Housing rooms require password for entry
        sortOrder: 0
      });
    }
    const housingAdminCharacterId = 11;
    let approvalMessage = `V\xE1\u017Een\xFD/\xE1 ${character.firstName} ${character.lastName},

`;
    approvalMessage += `Va\u0161e \u017E\xE1dost o bydlen\xED byla schv\xE1lena!

`;
    approvalMessage += `\u{1F4CD} **P\u0159id\u011Blen\xE1 adresa:** ${assignedAddress}
`;
    approvalMessage += `\u{1F3E0} **Typ bydlen\xED:** ${this.getHousingTypeDescription(request.requestType)}
`;
    if (request.size) {
      approvalMessage += `\u{1F4CF} **Velikost:** ${request.size}
`;
    }
    if (request.housingName) {
      approvalMessage += `\u{1F3E1} **N\xE1zev:** ${request.housingName}
`;
      approvalMessage += `\u{1F511} **Vytvo\u0159ena chat m\xEDstnost** pro va\u0161e bydlen\xED
`;
    }
    approvalMessage += `
Adresa byla p\u0159id\xE1na do va\u0161eho profilu postavy.

`;
    if (reviewNote) {
      approvalMessage += `**Pozn\xE1mka spr\xE1vy:** ${reviewNote}

`;
    }
    approvalMessage += `S p\u0159\xE1telsk\xFDmi pozdravy,
Ubytovac\xED spr\xE1va`;
    await db.insert(owlPostMessages).values({
      senderCharacterId: housingAdminCharacterId,
      recipientCharacterId: request.characterId,
      subject: "Schv\xE1len\xED \u017E\xE1dosti o bydlen\xED",
      content: approvalMessage,
      isRead: false
    });
    await this.logAdminActivity({
      adminId,
      action: "approve_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Approved housing request for ${request.requestType} at ${assignedAddress}. ${reviewNote ? `Note: ${reviewNote}` : ""}${request.housingName ? ` Created chat room: ${request.housingName}` : ""}`
    });
    return updatedRequest;
  }
  getHousingTypeDescription(requestType) {
    switch (requestType) {
      case "apartment":
        return "Byt";
      case "house":
        return "D\u016Fm";
      case "mansion":
        return "S\xEDdlo/Vila";
      case "dormitory":
        return "Pokoj na ubytovn\u011B";
      case "shared":
        return "Sd\xEDlen\xE9 bydlen\xED";
      default:
        return requestType;
    }
  }
  async rejectHousingRequest(requestId, adminId, reviewNote) {
    const [request] = await db.select().from(housingRequests).where(eq(housingRequests.id, requestId));
    if (!request) {
      throw new Error("Housing request not found");
    }
    const [updatedRequest] = await db.update(housingRequests).set({
      status: "rejected",
      reviewNote,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewedBy: adminId
    }).where(eq(housingRequests.id, requestId)).returning();
    const character = await this.getCharacter(request.characterId);
    if (character) {
      const housingAdminCharacterId = 11;
      let rejectionMessage = `V\xE1\u017Een\xFD/\xE1 ${character.firstName} ${character.lastName},

`;
      rejectionMessage += `Bohu\u017Eel mus\xEDme zam\xEDtnout va\u0161i \u017E\xE1dost o bydlen\xED.

`;
      rejectionMessage += `\u{1F3E0} **Typ \u017E\xE1dosti:** ${this.getHousingTypeDescription(request.requestType)}
`;
      if (request.size) {
        rejectionMessage += `\u{1F4CF} **Velikost:** ${request.size}
`;
      }
      rejectionMessage += `\u{1F4CD} **Lokace:** ${request.location}

`;
      rejectionMessage += `**D\u016Fvod zam\xEDtnut\xED:** ${reviewNote}

`;
      rejectionMessage += `M\u016F\u017Eete podat novou \u017E\xE1dost s upraven\xFDmi po\u017Eadavky.

`;
      rejectionMessage += `S p\u0159\xE1telsk\xFDmi pozdravy,
Ubytovac\xED spr\xE1va`;
      await db.insert(owlPostMessages).values({
        senderCharacterId: housingAdminCharacterId,
        recipientCharacterId: request.characterId,
        subject: "Zam\xEDtnut\xED \u017E\xE1dosti o bydlen\xED",
        content: rejectionMessage,
        isRead: false
      });
    }
    await this.logAdminActivity({
      adminId,
      action: "reject_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Rejected housing request for ${request.requestType}. Reason: ${reviewNote}`
    });
    return updatedRequest;
  }
  async returnHousingRequest(requestId, adminId, reviewNote) {
    const [request] = await db.select().from(housingRequests).where(eq(housingRequests.id, requestId));
    if (!request) {
      throw new Error("Housing request not found");
    }
    const [updatedRequest] = await db.update(housingRequests).set({
      status: "returned",
      reviewNote,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewedBy: adminId
    }).where(eq(housingRequests.id, requestId)).returning();
    await this.logAdminActivity({
      adminId,
      action: "return_housing_request",
      targetUserId: request.userId,
      targetCharacterId: request.characterId,
      details: `Returned housing request for ${request.requestType} for revision. Note: ${reviewNote}`
    });
    return updatedRequest;
  }
  // Owl Post Messages operations
  async sendOwlPostMessage(message) {
    const [newMessage] = await db.insert(owlPostMessages).values(message).returning();
    return newMessage;
  }
  async getOwlPostInbox(characterId, limit = 50, offset = 0) {
    return db.select({
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
        lastName: characters.lastName
      }
    }).from(owlPostMessages).innerJoin(characters, eq(owlPostMessages.senderCharacterId, characters.id)).where(eq(owlPostMessages.recipientCharacterId, characterId)).orderBy(desc(owlPostMessages.sentAt)).limit(limit).offset(offset);
  }
  async getOwlPostSent(characterId, limit = 50, offset = 0) {
    return db.select({
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
        lastName: characters.lastName
      }
    }).from(owlPostMessages).innerJoin(characters, eq(owlPostMessages.recipientCharacterId, characters.id)).where(eq(owlPostMessages.senderCharacterId, characterId)).orderBy(desc(owlPostMessages.sentAt)).limit(limit).offset(offset);
  }
  async getOwlPostMessage(messageId) {
    const [message] = await db.select().from(owlPostMessages).where(eq(owlPostMessages.id, messageId));
    return message;
  }
  async deleteOwlPostMessage(messageId) {
    const result = await db.delete(owlPostMessages).where(eq(owlPostMessages.id, messageId));
    return (result.rowCount || 0) > 0;
  }
  async markOwlPostAsRead(messageId) {
    await db.update(owlPostMessages).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(owlPostMessages.id, messageId));
  }
  async getUnreadOwlPostCount(characterId) {
    const [result] = await db.select({ count: count() }).from(owlPostMessages).where(and(
      eq(owlPostMessages.recipientCharacterId, characterId),
      eq(owlPostMessages.isRead, false)
    ));
    return result.count;
  }
  async getAllCharactersForOwlPost() {
    return db.select().from(characters).where(eq(characters.isActive, true)).orderBy(characters.firstName, characters.lastName);
  }
  // Influence operations
  async getInfluenceBar() {
    const [result] = await db.select().from(influenceBar).orderBy(desc(influenceBar.id)).limit(1);
    return {
      grindelwaldPoints: result?.grindelwaldPoints ?? 50,
      dumbledorePoints: result?.dumbledorePoints ?? 50
    };
  }
  async getInfluenceHistory() {
    try {
      const result = await db.execute(sql.raw(`
        SELECT id, change_type, points_changed, previous_total, new_total, reason, admin_id, created_at
        FROM influence_history 
        ORDER BY created_at DESC 
        LIMIT 50
      `));
      return result.rows.map((row) => ({
        id: row.id,
        changeType: row.change_type,
        pointsChanged: row.points_changed,
        previousTotal: row.previous_total,
        newTotal: row.new_total,
        reason: row.reason,
        adminId: row.admin_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("Error fetching influence history:", error);
      return [];
    }
  }
  async adjustInfluence(side, points, userId) {
    const currentData = await this.getInfluenceBar();
    const newGrindelwaldPoints = side === "grindelwald" ? Math.max(0, currentData.grindelwaldPoints + points) : currentData.grindelwaldPoints;
    const newDumbledorePoints = side === "dumbledore" ? Math.max(0, currentData.dumbledorePoints + points) : currentData.dumbledorePoints;
    await this.setInfluence(newGrindelwaldPoints, newDumbledorePoints, userId);
  }
  async setInfluence(grindelwaldPoints, dumbledorePoints, userId) {
    const [currentRecord] = await db.select().from(influenceBar).orderBy(desc(influenceBar.id)).limit(1);
    if (currentRecord) {
      await db.update(influenceBar).set({
        grindelwaldPoints,
        dumbledorePoints,
        lastUpdated: /* @__PURE__ */ new Date(),
        updatedBy: userId
      }).where(eq(influenceBar.id, currentRecord.id));
    } else {
      await db.insert(influenceBar).values({
        grindelwaldPoints,
        dumbledorePoints,
        lastUpdated: /* @__PURE__ */ new Date(),
        updatedBy: userId
      });
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { sql as sql2 } from "drizzle-orm";
import { z as z2 } from "zod";
import session from "express-session";
import multer from "multer";
import sharp from "sharp";
var GAME_YEAR = 1926;
function getCurrentGameDate() {
  const currentDate = /* @__PURE__ */ new Date();
  return `${currentDate.getDate()}. ${currentDate.toLocaleDateString("cs-CZ", { month: "long" })} ${GAME_YEAR}`;
}
var rateLimiter = /* @__PURE__ */ new Map();
var checkRateLimit = (identifier, maxRequests = 100, windowMs = 6e4) => {
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
async function registerRoutes(app2) {
  app2.use("/api/*", (req, res, next) => {
    const identifier = req.ip || "unknown";
    if (!checkRateLimit(identifier)) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
    next();
  });
  app2.use("/api/chat/*", (req, res, next) => {
    console.log(`${req.method} ${req.path} - Query:`, req.query);
    next();
  });
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const sessionSecret = process.env.SESSION_SECRET || "rpg-realm-session-secret-key-fixed-2024";
  app2.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "connect.sid",
    cookie: {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: sessionTtl
    }
  }));
  app2.use((req, res, next) => {
    if (req.url.includes("/api/auth") || req.url.includes("/api/wand-components")) {
      console.log("Request URL:", req.url);
      console.log("Session ID:", req.sessionID);
      console.log("Session data:", req.session);
      console.log("Cookies:", req.headers.cookie);
    }
    next();
  });
  const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  const requireAdmin = async (req, res, next) => {
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
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024
      // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.get("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Username is required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });
  app2.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const characters2 = await storage.getCharactersByUserId(user.id);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters: characters2,
        characterOrder: user.characterOrder ? (() => {
          try {
            return JSON.parse(user.characterOrder);
          } catch (e) {
            console.error("Invalid characterOrder JSON:", user.characterOrder);
            return null;
          }
        })() : null,
        highlightWords: user.highlightWords || "",
        highlightColor: user.highlightColor || "yellow",
        canNarrate: user.canNarrate || false,
        narratorColor: user.narratorColor || "yellow"
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    console.log("=== LOGIN REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Session ID before:", req.sessionID);
    console.log("Session data before:", req.session);
    try {
      const { username, password } = loginSchema.parse(req.body);
      console.log("Parsed credentials - username:", username);
      const user = await storage.validateUser(username, password);
      console.log("User validation result:", user ? `User found: ${user.id}` : "No user found");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      console.log("Session after setting data:", req.session);
      console.log("Session ID after:", req.sessionID);
      const characters2 = await storage.getCharactersByUserId(user.id);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters: characters2
      });
      console.log("Login response sent successfully");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.post("/api/user/character-order", requireAuth, async (req, res) => {
    try {
      const { characterOrder } = req.body;
      if (!Array.isArray(characterOrder)) {
        return res.status(400).json({ message: "Character order must be an array" });
      }
      await storage.updateUserSettings(req.session.userId, {
        characterOrder: JSON.stringify(characterOrder)
      });
      res.json({ message: "Character order updated successfully" });
    } catch (error) {
      console.error("Error updating character order:", error);
      res.status(500).json({ message: "Failed to update character order" });
    }
  });
  app2.post("/api/user/highlight-words", requireAuth, async (req, res) => {
    try {
      const { highlightWords, highlightColor } = req.body;
      console.log("Highlight words update request:", { highlightWords, highlightColor, userId: req.session.userId });
      if (typeof highlightWords !== "string") {
        return res.status(400).json({ message: "Invalid highlight words format" });
      }
      const updateData = {
        highlightWords
      };
      if (highlightColor && typeof highlightColor === "string") {
        updateData.highlightColor = highlightColor;
      }
      console.log("Update data being saved:", updateData);
      await storage.updateUserSettings(req.session.userId, updateData);
      res.json({ message: "Highlight words updated successfully" });
    } catch (error) {
      console.error("Error updating highlight words:", error);
      res.status(500).json({ message: "Failed to update highlight words" });
    }
  });
  app2.post("/api/user/narrator-color", requireAuth, async (req, res) => {
    try {
      const { narratorColor } = req.body;
      if (!narratorColor || typeof narratorColor !== "string") {
        return res.status(400).json({ message: "Narrator color is required" });
      }
      const validColors = ["yellow", "red", "blue", "green", "pink", "purple"];
      if (!validColors.includes(narratorColor)) {
        return res.status(400).json({ message: "Invalid narrator color" });
      }
      await storage.updateUserSettings(req.session.userId, {
        narratorColor
      });
      res.json({ message: "Narrator color updated successfully" });
    } catch (error) {
      console.error("Error updating narrator color:", error);
      res.status(500).json({ message: "Failed to update narrator color" });
    }
  });
  app2.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Sou\u010Dasn\xE9 heslo a nov\xE9 heslo jsou povinn\xE9" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Nov\xE9 heslo mus\xED m\xEDt alespo\u0148 8 znak\u016F" });
      }
      if (!/(?=.*[a-z])/.test(newPassword)) {
        return res.status(400).json({ message: "Nov\xE9 heslo mus\xED obsahovat alespo\u0148 jedno mal\xE9 p\xEDsmeno" });
      }
      if (!/(?=.*[A-Z])/.test(newPassword)) {
        return res.status(400).json({ message: "Nov\xE9 heslo mus\xED obsahovat alespo\u0148 jedno velk\xE9 p\xEDsmeno" });
      }
      if (!/(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ message: "Nov\xE9 heslo mus\xED obsahovat alespo\u0148 jednu \u010D\xEDslici" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "U\u017Eivatel nebyl nalezen" });
      }
      const isCurrentPasswordValid = await storage.validateUser(user.username, currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Sou\u010Dasn\xE9 heslo je nespr\xE1vn\xE9" });
      }
      const hashedNewPassword = await storage.hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNewPassword);
      res.json({ message: "Heslo bylo \xFAsp\u011B\u0161n\u011B zm\u011Bn\u011Bno" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Nepoda\u0159ilo se zm\u011Bnit heslo" });
    }
  });
  app2.post("/api/auth/change-email", requireAuth, async (req, res) => {
    try {
      const { newEmail, confirmPassword } = req.body;
      if (!newEmail || !confirmPassword) {
        return res.status(400).json({ message: "Nov\xFD email a potvrzen\xED hesla jsou povinn\xE9" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: "Neplatn\xFD form\xE1t emailu" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "U\u017Eivatel nebyl nalezen" });
      }
      const isPasswordValid = await storage.validateUser(user.username, confirmPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Heslo je nespr\xE1vn\xE9" });
      }
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: "Tento email je ji\u017E pou\u017E\xEDv\xE1n" });
      }
      await storage.updateUserEmail(user.id, newEmail);
      res.json({ message: "Email byl \xFAsp\u011B\u0161n\u011B zm\u011Bn\u011Bn" });
    } catch (error) {
      console.error("Error changing email:", error);
      res.status(500).json({ message: "Nepoda\u0159ilo se zm\u011Bnit email" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const data = registrationSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const inviteCode = await storage.getInviteCode(data.inviteCode);
      if (!inviteCode || inviteCode.isUsed) {
        return res.status(400).json({ message: "Invalid or already used invite code" });
      }
      const hashedPassword = await storage.hashPassword(data.password);
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: "user"
      });
      await storage.useInviteCode(data.inviteCode, user.id);
      const character = await storage.createCharacter({
        userId: user.id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        birthDate: data.birthDate
      });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        characters: [character]
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithCharacters = await Promise.all(
        users2.map(async (user) => {
          const characters2 = await storage.getCharactersByUserId(user.id);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            canNarrate: user.canNarrate || false,
            characters: characters2
          };
        })
      );
      res.json(usersWithCharacters);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/users/:id/role", requireAdmin, async (req, res) => {
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
  app2.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
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
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "user_role_change",
        details: `Changed role of user ${user.username} to ${role}`
      });
      res.json({ message: "Role updated successfully", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.patch("/api/admin/users/:id/narrator", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { canNarrate, reason } = req.body;
      if (typeof canNarrate !== "boolean") {
        return res.status(400).json({ message: "canNarrate must be a boolean" });
      }
      const user = await storage.updateUserNarratorPermission(parseInt(id), canNarrate);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const details = canNarrate ? `Granted narrator permission for user ${user.username}` : `Revoked narrator permission for user ${user.username}${reason ? ` - Reason: ${reason}` : ""}`;
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "narrator_permission_change",
        details
      });
      res.json({ message: "Narrator permission updated successfully", user });
    } catch (error) {
      console.error("Error updating narrator permission:", error);
      res.status(500).json({ message: "Failed to update narrator permission" });
    }
  });
  app2.post("/api/characters/:id/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      if (character.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this character" });
      }
      const processedImage = await sharp(req.file.buffer).resize(150, 150, {
        fit: "cover",
        position: "center"
      }).jpeg({ quality: 80 }).toBuffer();
      const base64Avatar = `data:image/jpeg;base64,${processedImage.toString("base64")}`;
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
  app2.delete("/api/characters/:id/avatar", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId;
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      if (character.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this character" });
      }
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
  app2.patch("/api/characters/:id", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId;
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      const requestingUser = await storage.getUser(userId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      if (character.userId !== userId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only character owner or admin can edit." });
      }
      let validatedData;
      const bodyKeys = Object.keys(req.body);
      const isFullEdit = bodyKeys.includes("firstName") || bodyKeys.includes("lastName") || bodyKeys.includes("birthDate");
      if (isFullEdit && requestingUser.role === "admin") {
        validatedData = characterAdminEditSchema.parse(req.body);
      } else {
        validatedData = characterEditSchema.parse(req.body);
      }
      if (validatedData.height !== void 0) {
        if (character.heightSetAt && requestingUser.role !== "admin") {
          return res.status(400).json({ message: "V\xFD\u0161ka m\u016F\u017Ee b\xFDt nastavena pouze jednou" });
        }
        if (!character.heightSetAt) {
          validatedData.heightSetAt = /* @__PURE__ */ new Date();
        }
      }
      if (validatedData.school !== void 0) {
        if (character.schoolSetAt && requestingUser.role !== "admin") {
          return res.status(400).json({ message: "\u0160kola m\u016F\u017Ee b\xFDt nastavena pouze jednou" });
        }
        if (!character.schoolSetAt) {
          validatedData.schoolSetAt = /* @__PURE__ */ new Date();
        }
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
  app2.put("/api/characters/:id/history", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { history, showHistoryToOthers } = req.body;
      const userId = req.session.userId;
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Postava nebyla nalezena" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "U\u017Eivatel nenalezen" });
      }
      if (character.userId !== userId && user.role !== "admin") {
        return res.status(403).json({ message: "Nem\xE1te opr\xE1vn\u011Bn\xED upravovat tuto postavu" });
      }
      const updatedCharacter = await storage.updateCharacter(characterId, {
        characterHistory: history,
        showHistoryToOthers,
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (!updatedCharacter) {
        return res.status(500).json({ message: "Nepoda\u0159ilo se aktualizovat historii postavy" });
      }
      res.json({
        message: "Historie postavy byla \xFAsp\u011B\u0161n\u011B aktualizov\xE1na",
        character: updatedCharacter
      });
    } catch (error) {
      console.error("Error updating character history:", error);
      res.status(500).json({ message: "Nepoda\u0159ilo se aktualizovat historii postavy" });
    }
  });
  app2.get("/api/characters/online", requireAuth, async (req, res) => {
    try {
      const onlineCharacters = [];
      const promises = Array.from(activeConnections.entries()).map(async ([ws2, connInfo]) => {
        if (ws2.readyState === WebSocket.OPEN && connInfo.characterId) {
          const character = await storage.getCharacter(connInfo.characterId);
          if (character && character.isActive && !character.isSystem) {
            let location = "Lobby";
            if (connInfo.roomId) {
              const room = await storage.getChatRoom(connInfo.roomId);
              location = room ? room.name : "Nezn\xE1m\xE1 lokace";
            }
            return {
              id: character.id,
              fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ""} ${character.lastName}`,
              firstName: character.firstName,
              lastName: character.lastName,
              location,
              roomId: connInfo.roomId,
              avatar: character.avatar
            };
          }
        }
        return null;
      });
      const results = await Promise.all(promises);
      onlineCharacters.push(...results.filter((char) => char !== null));
      console.log("Returning all online characters:", onlineCharacters);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(onlineCharacters);
    } catch (error) {
      console.error("Error fetching online characters:", error);
      res.status(500).json({ message: "Failed to fetch online characters" });
    }
  });
  app2.get("/api/admin/online-users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const connectedUserIds = /* @__PURE__ */ new Set();
      for (const [ws2, connInfo] of activeConnections.entries()) {
        if (ws2.readyState === WebSocket.OPEN && connInfo.userId) {
          const user = await storage.getUser(connInfo.userId);
          if (user && !user.isSystem) {
            connectedUserIds.add(connInfo.userId);
          }
        }
      }
      const currentUserId = req.session.userId;
      if (currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (currentUser && !currentUser.isSystem) {
          connectedUserIds.add(currentUserId);
        }
      }
      const onlineUsersCount = connectedUserIds.size;
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ count: onlineUsersCount });
    } catch (error) {
      console.error("Error fetching online users count:", error);
      res.status(500).json({ message: "Failed to fetch online users count" });
    }
  });
  app2.get("/api/admin/invite-codes", requireAdmin, async (req, res) => {
    try {
      const inviteCodes2 = await storage.getAllInviteCodes();
      res.json(inviteCodes2);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });
  app2.post("/api/admin/invite-codes", requireAdmin, async (req, res) => {
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
  app2.post("/api/admin/update-character-dates", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      let updatedCount = 0;
      for (const user of users2) {
        const characters2 = await storage.getCharactersByUserId(user.id);
        for (const character of characters2) {
          const birthYear = new Date(character.birthDate).getFullYear();
          if (birthYear > 1926) {
            const gameAge = Math.max(16, Math.min(46, birthYear - 1970));
            const gameBirthYear = 1926 - gameAge;
            const originalDate = new Date(character.birthDate);
            const newBirthDate = new Date(gameBirthYear, originalDate.getMonth(), originalDate.getDate());
            await storage.updateCharacter(character.id, {
              birthDate: newBirthDate.toISOString().split("T")[0]
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
  app2.post("/api/admin/init-test-data", async (req, res) => {
    try {
      const testCodes = ["WELCOME2024", "ADMIN_INVITE", "USER_INVITE"];
      for (const code of testCodes) {
        const existing = await storage.getInviteCode(code);
        if (!existing) {
          await storage.createInviteCode({ code });
        }
      }
      const adminExists = await storage.getUserByUsername("TesterAdmin");
      if (!adminExists) {
        const hashedPassword = await storage.hashPassword("admin123");
        const adminUser = await storage.createUser({
          username: "TesterAdmin",
          email: "admin@rpg-realm.cz",
          password: hashedPassword,
          role: "admin"
        });
        await storage.createCharacter({
          userId: adminUser.id,
          firstName: "Gandalf",
          middleName: "the",
          lastName: "Grey",
          birthDate: "1880-01-15",
          // Born in 1880, age 46 in 1926
          isActive: true
        });
      }
      const userExists = await storage.getUserByUsername("TesterU\u017Eivatel");
      if (!userExists) {
        const hashedPassword = await storage.hashPassword("user123");
        const regularUser = await storage.createUser({
          username: "TesterU\u017Eivatel",
          email: "user@rpg-realm.cz",
          password: hashedPassword,
          role: "user"
        });
        await storage.createCharacter({
          userId: regularUser.id,
          firstName: "Aragorn",
          lastName: "Ranger",
          birthDate: "1895-03-20",
          // Born in 1895, age 31 in 1926
          isActive: true
        });
        await storage.createCharacter({
          userId: regularUser.id,
          firstName: "Frodo",
          lastName: "Pytl\xEDk",
          birthDate: "1902-09-22",
          // Born in 1902, age 24 in 1926
          isActive: true
        });
      }
      let wizardingLondon = await storage.getChatCategoryByName("Kouzelnick\xFD Lond\xFDn");
      if (!wizardingLondon) {
        wizardingLondon = await storage.createChatCategory({
          name: "Kouzelnick\xFD Lond\xFDn",
          description: "Hlavn\xED oblast kouzeln\xE9ho Lond\xFDna",
          sortOrder: 1
        });
      }
      let diagonAlley = await storage.getChatCategoryByName("P\u0159\xED\u010Dn\xE1 ulice");
      if (!diagonAlley) {
        diagonAlley = await storage.createChatCategory({
          name: "P\u0159\xED\u010Dn\xE1 ulice",
          description: "Hlavn\xED n\xE1kupn\xED ulice kouzeln\xE9ho sv\u011Bta",
          parentId: wizardingLondon.id,
          sortOrder: 1
        });
      }
      let knockturnAlley = await storage.getChatCategoryByName("Obrtl\xE1 ulice");
      if (!knockturnAlley) {
        knockturnAlley = await storage.createChatCategory({
          name: "Obrtl\xE1 ulice",
          description: "Temn\xE1 uli\u010Dka s podez\u0159el\xFDmi obchody",
          parentId: wizardingLondon.id,
          sortOrder: 2
        });
      }
      const diagonAlleyRooms = [
        { name: "Ulice", description: "Hlavn\xED ulice P\u0159\xED\u010Dn\xE9 ulice", sortOrder: 1 },
        { name: "Gringottovi", description: "Banka pro \u010Darod\u011Bje a kouzeln\xEDky", sortOrder: 2 },
        { name: "D\u011Brav\xFD kotel", description: "Slavn\xFD hostinec a vstup do kouzeln\xE9ho sv\u011Bta", sortOrder: 3 },
        { name: "\u010Cern\xE1 vr\xE1na", description: "Poh\u0159ebn\xED slu\u017Eba pro kouzeln\xFD sv\u011Bt", sortOrder: 4 },
        { name: "\u010Carok\xE1va", description: "Kav\xE1rna pro \u010Darod\u011Bje", sortOrder: 5 }
      ];
      for (const roomData of diagonAlleyRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            categoryId: diagonAlley.id,
            isPublic: true,
            sortOrder: roomData.sortOrder
          });
        }
      }
      const knockturnAlleyRooms = [
        { name: "Po\u0161mourn\xE1 uli\u010Dka", description: "Temn\xE9 z\xE1kout\xED Obrtl\xE9 ulice", sortOrder: 1 },
        { name: "Zlomen\xE1 h\u016Flka", description: "Obchod s podez\u0159el\xFDmi kouzeln\xFDmi p\u0159edm\u011Bty", sortOrder: 2 }
      ];
      for (const roomData of knockturnAlleyRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            categoryId: knockturnAlley.id,
            isPublic: true,
            sortOrder: roomData.sortOrder
          });
        }
      }
      const additionalCategories = [
        { name: "Ministerstvo kouzel", description: "\xDA\u0159ad kouzeln\xE9 vl\xE1dy", sortOrder: 3 },
        { name: "Nemocnice u sv. Munga", description: "Nemocnice pro kouzeln\xE9 nemoci a \xFArazy", sortOrder: 4 },
        { name: "Katakomby", description: "Podzemn\xED bludi\u0161t\u011B pod Lond\xFDnem", sortOrder: 5 }
      ];
      for (const categoryData of additionalCategories) {
        let category = await storage.getChatCategoryByName(categoryData.name);
        if (!category) {
          category = await storage.createChatCategory({
            name: categoryData.name,
            description: categoryData.description,
            parentId: wizardingLondon.id,
            sortOrder: categoryData.sortOrder
          });
        }
        const existingRoom = await storage.getChatRoomByName(categoryData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: categoryData.name,
            description: categoryData.description,
            categoryId: category.id,
            isPublic: true,
            sortOrder: 1
          });
        }
      }
      const originalRooms = [
        { name: "Testovac\xED chat", description: "M\xEDstnost pro testov\xE1n\xED a experimenty", sortOrder: 0 }
      ];
      for (const roomData of originalRooms) {
        const existingRoom = await storage.getChatRoomByName(roomData.name);
        if (!existingRoom) {
          await storage.createChatRoom({
            name: roomData.name,
            description: roomData.description,
            isPublic: true,
            sortOrder: roomData.sortOrder
          });
        }
      }
      res.json({ message: "Test data initialized successfully" });
    } catch (error) {
      console.error("Error initializing test data:", error);
      res.status(500).json({ message: "Failed to initialize test data" });
    }
  });
  app2.get("/api/chat/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getChatCategoriesWithChildren();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });
  app2.get("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getAllChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });
  app2.get("/api/chat/rooms/:roomId/messages", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      console.log("GET /api/chat/rooms/:roomId/messages - roomId:", roomId);
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const messages2 = await storage.getMessagesByRoom(roomId, limit, offset);
      console.log("Fetched messages:", messages2.length, "messages");
      if (messages2.length > 0) {
        console.log("First message (should be newest):", messages2[0].id, messages2[0].content);
        console.log("Last message (should be oldest):", messages2[messages2.length - 1].id, messages2[messages2.length - 1].content);
      }
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.query.roomId);
      console.log("GET /api/chat/messages - roomId:", roomId);
      if (!roomId) {
        console.log("Missing roomId parameter");
        return res.status(400).json({ message: "roomId is required" });
      }
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const messages2 = await storage.getMessagesByRoom(roomId, limit, offset);
      console.log("Fetched messages:", messages2.length, "messages");
      console.log("Sample message:", messages2[0]);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      console.log("POST /api/chat/messages - Request body:", req.body);
      const { roomId, characterId, content, messageType } = req.body;
      const user = req.session.userId ? await storage.getUser(req.session.userId) : null;
      if (!roomId || !content || user?.role !== "admin" && !characterId) {
        console.log("Missing required fields:", { roomId, characterId, content, isAdmin: user?.role === "admin" });
        return res.status(400).json({ message: "roomId and content are required" });
      }
      if (content.length < 1 || content.length > 5e3) {
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
  app2.post("/api/chat/rooms/:roomId/archive", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const beforeDate = req.body.beforeDate ? new Date(req.body.beforeDate) : void 0;
      const archivedCount = await storage.archiveMessages(roomId, beforeDate);
      res.json({ message: `Archived ${archivedCount} messages`, count: archivedCount });
    } catch (error) {
      console.error("Error archiving messages:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });
  app2.get("/api/chat/rooms/:roomId/export", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages2 = await storage.getMessagesByRoom(roomId, 1e3, 0);
      const exportData = messages2.map((msg) => ({
        timestamp: msg.createdAt,
        character: `${msg.character.firstName}${msg.character.middleName ? ` ${msg.character.middleName}` : ""} ${msg.character.lastName}`,
        message: msg.content,
        type: msg.messageType
      }));
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="chat-export-${roomId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting chat:", error);
      res.status(500).json({ message: "Failed to export chat" });
    }
  });
  app2.patch("/api/admin/chat/rooms/:roomId", requireAuth, async (req, res) => {
    try {
      const user = req.session.userId ? await storage.getUser(req.session.userId) : null;
      if (!user || user.role !== "admin") {
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
  app2.get("/api/chat/rooms/:roomId/presence", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const characterIds = Array.from(roomPresence.get(roomId) || []);
      if (characterIds.length === 0) {
        return res.json([]);
      }
      const characters2 = await Promise.all(
        characterIds.map(async (characterId) => {
          const character = await storage.getCharacter(characterId);
          return character ? {
            id: character.id,
            firstName: character.firstName,
            middleName: character.middleName,
            lastName: character.lastName,
            fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ""} ${character.lastName}`,
            avatar: character.avatar
          } : null;
        })
      );
      res.json(characters2.filter(Boolean));
    } catch (error) {
      console.error("Error fetching room presence:", error);
      res.status(500).json({ message: "Failed to fetch room presence" });
    }
  });
  app2.post("/api/chat/rooms/:roomId/verify-password", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { password } = req.body;
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      if (room.isPublic) {
        return res.json({ success: true });
      }
      if (room.password === password) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false });
      }
    } catch (error) {
      console.error("Error verifying room password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });
  app2.get("/api/characters", requireAuth, async (req, res) => {
    try {
      const characters2 = await storage.getCharactersByUserId(req.session.userId);
      res.json(characters2);
    } catch (error) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });
  app2.get("/api/characters/all", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const allCharacters = [];
      for (const user of users2) {
        if (user.isSystem && req.session.userRole !== "admin") {
          continue;
        }
        const characters2 = await storage.getCharactersByUserId(user.id);
        for (const character of characters2) {
          if (character.isSystem && req.session.userRole !== "admin") {
            continue;
          }
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
  app2.get("/api/characters/dormitory-residents", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const dormitoryCharacters = [];
      for (const user of users2) {
        if (user.isSystem && req.session.userRole !== "admin") {
          continue;
        }
        const characters2 = await storage.getCharactersByUserId(user.id);
        for (const character of characters2) {
          if (character.isSystem && req.session.userRole !== "admin") {
            continue;
          }
          if (character.residence && character.residence.includes("Ubytovna U star\xE9ho \u0160ept\xE1ka")) {
            dormitoryCharacters.push({
              id: character.id,
              firstName: character.firstName,
              middleName: character.middleName,
              lastName: character.lastName,
              residence: character.residence
            });
          }
        }
      }
      res.json(dormitoryCharacters);
    } catch (error) {
      console.error("Error fetching dormitory residents:", error);
      res.status(500).json({ message: "Failed to fetch dormitory residents" });
    }
  });
  app2.get("/api/characters/:id", requireAuth, async (req, res) => {
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
  app2.post("/api/game/dice-roll", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId } = req.body;
      if (!roomId || !characterId) {
        return res.status(400).json({ message: "roomId and characterId are required" });
      }
      const diceResult = Math.floor(Math.random() * 10) + 1;
      const diceMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: `hodil kostkou: ${diceResult}`,
        messageType: "dice_roll"
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
  app2.post("/api/game/coin-flip", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId } = req.body;
      if (!roomId || !characterId) {
        return res.status(400).json({ message: "roomId and characterId are required" });
      }
      const coinResult = Math.floor(Math.random() * 2) + 1;
      const coinSide = coinResult === 1 ? "panna" : "orel";
      const coinMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: `hodil minc\xED: ${coinSide}`,
        messageType: "coin_flip"
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
  app2.post("/api/chat/narrator-message", requireAuth, async (req, res) => {
    try {
      const { roomId, content } = req.body;
      const userId = req.session.userId;
      if (!roomId || !content || !content.trim()) {
        return res.status(400).json({ message: "roomId and content are required" });
      }
      const user = await storage.getUser(userId);
      if (!user || !user.canNarrate) {
        return res.status(403).json({ message: "Narrator permissions required" });
      }
      const narratorMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: null,
        // null for narrator messages
        content: content.trim(),
        messageType: "narrator"
      });
      broadcastToRoom(parseInt(roomId), {
        type: "new_message",
        message: {
          ...narratorMessage,
          character: {
            firstName: "Vyprav\u011B\u010D",
            middleName: null,
            lastName: "",
            avatar: null
          }
        }
      });
      res.json({
        message: narratorMessage,
        success: true
      });
    } catch (error) {
      console.error("Error sending narrator message:", error);
      res.status(500).json({ message: "Failed to send narrator message" });
    }
  });
  app2.get("/api/admin/spells", requireAuth, requireAdmin, async (req, res) => {
    try {
      const spells2 = await storage.getAllSpells();
      res.json(spells2);
    } catch (error) {
      console.error("Error fetching spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });
  app2.post("/api/admin/spells", requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = spellSchema.parse(req.body);
      const spell = await storage.createSpell(validatedData);
      res.json(spell);
    } catch (error) {
      console.error("Error creating spell:", error);
      res.status(500).json({ message: "Failed to create spell" });
    }
  });
  app2.put("/api/admin/spells/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app2.delete("/api/admin/spells/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app2.get("/api/characters/:id/spells", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const spells2 = await storage.getCharacterSpells(characterId);
      res.json(spells2);
    } catch (error) {
      console.error("Error fetching character spells:", error);
      res.status(500).json({ message: "Failed to fetch character spells" });
    }
  });
  app2.post("/api/admin/spells/initialize", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultSpells();
      res.json({ message: "Default spells initialized and added to all characters" });
    } catch (error) {
      console.error("Error initializing default spells:", error);
      res.status(500).json({ message: "Failed to initialize default spells" });
    }
  });
  app2.post("/api/admin/spells/bulk-import", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { spells: spells2 } = req.body;
      if (!Array.isArray(spells2) || spells2.length === 0) {
        return res.status(400).json({ message: "Spells array is required" });
      }
      let imported = 0;
      let skipped = 0;
      for (const spellData of spells2) {
        try {
          const validatedData = spellSchema.parse(spellData);
          const existingSpell = await storage.getSpellByName(validatedData.name);
          if (existingSpell) {
            skipped++;
            continue;
          }
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
  app2.get("/api/characters/:id/wand", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const wand = await storage.getCharacterWand(characterId);
      res.json(wand);
    } catch (error) {
      console.error("Error fetching character wand:", error);
      res.status(500).json({ message: "Failed to fetch character wand" });
    }
  });
  app2.get("/api/characters/:id/last-chat", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.session.userId;
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== userId) {
        return res.status(404).json({ message: "Character not found" });
      }
      const lastMessage = await storage.getLastMessageByCharacter(characterId);
      if (!lastMessage) {
        return res.json({ room: null, lastActivity: null });
      }
      const room = await storage.getChatRoom(lastMessage.roomId);
      if (!room) {
        return res.json({ room: null, lastActivity: null });
      }
      res.json({
        room: {
          id: room.id,
          name: room.name,
          description: room.description
        },
        lastActivity: lastMessage.createdAt
      });
    } catch (error) {
      console.error("Error fetching character's last chat:", error);
      res.status(500).json({ message: "Failed to fetch last chat" });
    }
  });
  app2.get("/api/characters/:id/wand", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const wand = await storage.getCharacterWand(characterId);
      res.json(wand || null);
    } catch (error) {
      console.error("Error fetching character's wand:", error);
      res.status(500).json({ message: "Failed to fetch character's wand" });
    }
  });
  app2.get("/api/wand-components", requireAuth, async (req, res) => {
    try {
      const components = await storage.getAllWandComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching wand components:", error);
      res.status(500).json({ message: "Failed to fetch wand components" });
    }
  });
  app2.put("/api/admin/wand-components", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "admin") {
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
  app2.post("/api/admin/migrate-wands-to-inventory", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole !== "admin") {
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
  app2.post("/api/characters/:id/visit-ollivanders", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ message: "Character already has a wand" });
      }
      const wand = await storage.generateRandomWand(characterId);
      await storage.addInventoryItem({
        characterId,
        itemName: `H\u016Flka (${wand.wood})`,
        itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
        quantity: 1,
        category: "Wand",
        rarity: "Epic",
        value: 7,
        // 7 galleons for a wand
        isEquipped: true,
        notes: "Hlavn\xED h\u016Flka postavy pro ses\xEDl\xE1n\xED kouzel"
      });
      res.json(wand);
    } catch (error) {
      console.error("Error visiting Ollivanders:", error);
      res.status(500).json({ message: "Failed to visit Ollivanders" });
    }
  });
  app2.post("/api/characters/:id/create-custom-wand", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { wood, core, length, flexibility, description } = req.body;
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const existingWand = await storage.getCharacterWand(characterId);
      if (existingWand) {
        return res.status(400).json({ message: "Character already has a wand" });
      }
      if (!wood || !core || !length || !flexibility) {
        return res.status(400).json({ message: "All wand components are required" });
      }
      const wandData = {
        characterId,
        wood,
        core,
        length,
        flexibility,
        description: description || `H\u016Flka z ${wood.toLowerCase()}, ${length} dlouh\xE1, ${flexibility.toLowerCase()}, s j\xE1drem ${core.toLowerCase()}. Pe\u010Dliv\u011B vybr\xE1na podle p\u0159\xE1n\xED sv\xE9ho majitele.`
      };
      const wand = await storage.createWand(wandData);
      await storage.addInventoryItem({
        characterId,
        itemName: `H\u016Flka (${wand.wood})`,
        itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
        quantity: 1,
        category: "Wand",
        rarity: "Epic",
        value: 7,
        // 7 galleons for a wand
        isEquipped: true,
        notes: "Vlastn\xED h\u016Flka vybran\xE1 u Ollivandera"
      });
      res.json(wand);
    } catch (error) {
      console.error("Error creating custom wand:", error);
      res.status(500).json({ message: "Failed to create custom wand" });
    }
  });
  app2.post("/api/game/cast-spell", requireAuth, async (req, res) => {
    try {
      const { roomId, characterId, spellId, message } = req.body;
      if (!roomId || !characterId || !spellId) {
        return res.status(400).json({ message: "roomId, characterId and spellId are required" });
      }
      const wand = await storage.getCharacterWand(parseInt(characterId));
      if (!wand) {
        return res.status(400).json({ message: "Va\u0161e postava pot\u0159ebuje h\u016Flku pro ses\xEDl\xE1n\xED kouzel. Nav\u0161tivte nejprve Ollivandera!" });
      }
      const characterSpells2 = await storage.getCharacterSpells(parseInt(characterId));
      const hasSpell = characterSpells2.some((cs) => cs.spell.id === parseInt(spellId));
      if (!hasSpell) {
        return res.status(403).json({ message: "Character doesn't know this spell" });
      }
      const spell = await storage.getSpell(parseInt(spellId));
      if (!spell) {
        return res.status(404).json({ message: "Spell not found" });
      }
      const successRoll = Math.floor(Math.random() * 10) + 1;
      const isSuccess = successRoll >= 5;
      const spellResult = `[Seslal kouzlo ${spell.name} (${successRoll}/10) - ${isSuccess ? "\xDAsp\u011Bch" : "Ne\xFAsp\u011Bch"}] ${spell.effect}`;
      const combinedContent = message ? `${message.trim()}
${spellResult}` : spellResult;
      const spellMessage = await storage.createMessage({
        roomId: parseInt(roomId),
        characterId: parseInt(characterId),
        content: combinedContent,
        messageType: "spell_cast"
      });
      res.json({
        spell,
        successRoll,
        isSuccess,
        message: spellMessage,
        success: true
      });
    } catch (error) {
      console.error("Error casting spell:", error);
      res.status(500).json({ message: "Failed to cast spell" });
    }
  });
  app2.get("/api/characters/:characterId/inventory", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const inventory = await storage.getCharacterInventory(characterId);
      res.json(inventory);
    } catch (error) {
      console.error("Error getting inventory:", error);
      res.status(500).json({ message: "Failed to get inventory" });
    }
  });
  app2.post("/api/characters/:characterId/inventory", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
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
  app2.patch("/api/inventory/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      const character = await storage.getCharacter(item.characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });
  app2.delete("/api/inventory/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      const character = await storage.getCharacter(item.characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
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
  app2.get("/api/characters/:characterId/journal", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const journal = await storage.getCharacterJournal(characterId);
      res.json(journal);
    } catch (error) {
      console.error("Error getting journal:", error);
      res.status(500).json({ message: "Failed to get journal" });
    }
  });
  app2.post("/api/characters/:characterId/journal", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
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
  app2.patch("/api/journal/:entryId", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      const entry = await storage.getJournalEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      const character = await storage.getCharacter(entry.characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const updatedEntry = await storage.updateJournalEntry(entryId, req.body);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });
  app2.delete("/api/journal/:entryId", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      const entry = await storage.getJournalEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      const character = await storage.getCharacter(entry.characterId);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
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
  app2.get("/api/influence-bar", (req, res, next) => {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  }, async (req, res) => {
    try {
      const influenceData = await storage.getInfluenceBar();
      res.json(influenceData);
    } catch (error) {
      console.error("Error fetching influence bar:", error);
      res.status(500).json({ message: "Failed to fetch influence bar" });
    }
  });
  app2.get("/api/influence-history", async (req, res) => {
    try {
      const history = await storage.getInfluenceHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching influence history:", error);
      res.status(500).json({ message: "Failed to fetch influence history" });
    }
  });
  app2.post("/api/admin/influence-bar/adjust", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { side, points } = req.body;
      if (!side || typeof points !== "number") {
        return res.status(400).json({ message: "Side and points are required" });
      }
      await storage.adjustInfluence(side, points, req.session.userId);
      res.json({ message: "Influence adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting influence:", error);
      res.status(500).json({ message: "Failed to adjust influence" });
    }
  });
  app2.post("/api/admin/influence-bar/set", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { grindelwaldPoints, dumbledorePoints } = req.body;
      if (typeof grindelwaldPoints !== "number" || typeof dumbledorePoints !== "number") {
        return res.status(400).json({ message: "Both point values are required" });
      }
      await storage.setInfluence(grindelwaldPoints, dumbledorePoints, req.session.userId);
      res.json({ message: "Influence set successfully" });
    } catch (error) {
      console.error("Error setting influence:", error);
      res.status(500).json({ message: "Failed to set influence" });
    }
  });
  app2.post("/api/admin/influence-bar/adjust-with-history", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { changeType, points, reason } = req.body;
      if (!changeType || typeof points !== "number" || !reason) {
        return res.status(400).json({ message: "Change type, points and reason are required" });
      }
      const currentData = await storage.getInfluenceBar();
      const previousTotal = changeType === "grindelwald" ? currentData.grindelwaldPoints : currentData.dumbledorePoints;
      const newTotal = Math.max(0, previousTotal + points);
      const newGrindelwaldPoints = changeType === "grindelwald" ? newTotal : currentData.grindelwaldPoints;
      const newDumbledorePoints = changeType === "dumbledore" ? newTotal : currentData.dumbledorePoints;
      await storage.setInfluence(newGrindelwaldPoints, newDumbledorePoints, req.session.userId);
      await db.execute(sql2`
        INSERT INTO influence_history (change_type, points_changed, previous_total, new_total, reason, admin_id, created_at)
        VALUES (${changeType}, ${points}, ${previousTotal}, ${newTotal}, ${reason}, ${req.session.userId}, NOW())
      `);
      res.json({ message: "Influence adjusted with history successfully" });
    } catch (error) {
      console.error("Error adjusting influence with history:", error);
      res.status(500).json({ message: "Failed to adjust influence with history" });
    }
  });
  app2.post("/api/admin/influence-bar/reset", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { type } = req.body;
      if (!type || type !== "0:0" && type !== "50:50") {
        return res.status(400).json({ message: "Reset type must be '0:0' or '50:50'" });
      }
      const currentData = await storage.getInfluenceBar();
      const resetValues = type === "0:0" ? { grindelwald: 0, dumbledore: 0 } : { grindelwald: 50, dumbledore: 50 };
      await storage.setInfluence(resetValues.grindelwald, resetValues.dumbledore, req.session.userId);
      const grindelwaldChange = resetValues.grindelwald - currentData.grindelwaldPoints;
      const dumbledoreChange = resetValues.dumbledore - currentData.dumbledorePoints;
      await db.execute(sql2`
        INSERT INTO influence_history (change_type, points_changed, previous_total, new_total, reason, admin_id, created_at)
        VALUES ('grindelwald', ${grindelwaldChange}, ${currentData.grindelwaldPoints}, ${resetValues.grindelwald}, ${"Admin reset na " + type + " - Grindelwald"}, ${req.session.userId}, NOW())
      `);
      await db.execute(sql2`
        INSERT INTO influence_history (change_type, points_changed, previous_total, new_total, reason, admin_id, created_at)
        VALUES ('dumbledore', ${dumbledoreChange}, ${currentData.dumbledorePoints}, ${resetValues.dumbledore}, ${"Admin reset na " + type + " - Brumb\xE1l"}, ${req.session.userId}, NOW())
      `);
      res.json({ message: "Influence reset successfully" });
    } catch (error) {
      console.error("Error resetting influence:", error);
      res.status(500).json({ message: "Failed to reset influence" });
    }
  });
  app2.post("/api/housing-requests", requireAuth, async (req, res) => {
    try {
      const requestData = insertHousingRequestSchema.parse(req.body);
      if (requestData.requestType === "dormitory") {
        const autoApprovedRequest = await storage.createHousingRequest({
          ...requestData,
          userId: req.session.userId
        });
        const approvedRequest = await storage.approveHousingRequest(
          autoApprovedRequest.id,
          req.session.userId,
          // Automatické schválení systémem
          "Lond\xFDn - Ubytovna U star\xE9ho \u0160ept\xE1ka",
          "Automaticky schv\xE1leno - ubytovna"
        );
        let housingAdminCharacter = await storage.getCharacterByName("Spr\xE1va", "ubytov\xE1n\xED");
        if (!housingAdminCharacter) {
          housingAdminCharacter = await storage.createCharacter({
            userId: req.session.userId,
            // Dočasně přiřadit k current user
            firstName: "Spr\xE1va",
            lastName: "ubytov\xE1n\xED",
            birthDate: "1900-01-01",
            description: "Syst\xE9mov\xE1 postava pro spr\xE1vu ubytov\xE1n\xED",
            school: "",
            residence: "Lond\xFDn - Ministerstvo kouzel"
          });
        }
        await storage.sendOwlPostMessage({
          senderCharacterId: housingAdminCharacter.id,
          recipientCharacterId: requestData.characterId,
          subject: "P\u0159id\u011Blen\xED pokoje na ubytovn\u011B",
          content: `V\xE1\u017Een\xE1 \u010Darod\u011Bjko/V\xE1\u017Een\xFD \u010Darod\u011Bji,

s pot\u011B\u0161en\xEDm V\xE1m oznamujeme, \u017Ee Va\u0161e \u017E\xE1dost o pokoj na ubytovn\u011B byla schv\xE1lena.

PODROBNOSTI UBYTOV\xC1N\xCD:
\u{1F4CD} Adresa: ${approvedRequest.assignedAddress}
\u{1F3E0} Typ: Pokoj na ubytovn\u011B
\u{1F4C5} Datum p\u0159id\u011Blen\xED: ${getCurrentGameDate()}

V\xE1\u0161 pokoj je nyn\xED p\u0159ipraven k nast\u011Bhov\xE1n\xED. Kl\xED\u010De si m\u016F\u017Eete vyzvednout u spr\xE1vce ubytovny.

D\u016ELE\u017DIT\xC9 INFORMACE:
\u2022 Pokoj je ur\u010Den pro jednu osobu
\u2022 Dodr\u017Eujte pros\xEDm dom\xE1c\xED \u0159\xE1d ubytovny
\u2022 V p\u0159\xEDpad\u011B jak\xFDchkoliv probl\xE9m\u016F se obra\u0165te na spr\xE1vu ubytov\xE1n\xED

P\u0159ejeme V\xE1m p\u0159\xEDjemn\xE9 bydlen\xED!

S pozdravem,
Spr\xE1va ubytov\xE1n\xED`
        });
        res.json(approvedRequest);
      } else {
        const request = await storage.createHousingRequest({
          ...requestData,
          userId: req.session.userId
        });
        res.json(request);
      }
    } catch (error) {
      console.error("Error creating housing request:", error);
      res.status(500).json({ message: "Failed to create housing request" });
    }
  });
  app2.get("/api/housing-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getHousingRequestsByUserId(req.session.userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching housing requests:", error);
      res.status(500).json({ message: "Failed to fetch housing requests" });
    }
  });
  app2.delete("/api/housing-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getHousingRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      if (request.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be withdrawn" });
      }
      const success = await storage.deleteHousingRequest(requestId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete request" });
      }
      res.json({ message: "Housing request withdrawn successfully" });
    } catch (error) {
      console.error("Error deleting housing request:", error);
      res.status(500).json({ message: "Failed to delete housing request" });
    }
  });
  app2.get("/api/admin/housing-requests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingHousingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending housing requests:", error);
      res.status(500).json({ message: "Failed to fetch pending housing requests" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const activeConnections = /* @__PURE__ */ new Map();
  const roomPresence = /* @__PURE__ */ new Map();
  function broadcastToRoom(roomId, message) {
    activeConnections.forEach((connInfo, ws2) => {
      if (connInfo.roomId === roomId && ws2.readyState === WebSocket.OPEN) {
        ws2.send(JSON.stringify(message));
      }
    });
  }
  wss.on("connection", (ws2, req) => {
    console.log("New WebSocket connection");
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "authenticate":
            if (!message.sessionId || !message.userId || !message.characterId) {
              ws2.send(JSON.stringify({ type: "error", message: "Missing authentication data" }));
              return;
            }
            const user = await storage.getUser(message.userId);
            if (!user) {
              ws2.send(JSON.stringify({ type: "error", message: "Invalid user" }));
              return;
            }
            const userCharacter = await storage.getCharacter(message.characterId);
            if (!userCharacter || userCharacter.userId !== message.userId) {
              ws2.send(JSON.stringify({ type: "error", message: "Character access denied" }));
              return;
            }
            activeConnections.set(ws2, {
              userId: message.userId,
              characterId: message.characterId
            });
            ws2.send(JSON.stringify({ type: "authenticated", success: true }));
            break;
          case "join_room":
            const connInfo = activeConnections.get(ws2);
            if (!connInfo?.characterId) {
              ws2.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
              return;
            }
            const roomId = parseInt(message.roomId);
            if (!roomId) {
              ws2.send(JSON.stringify({ type: "error", message: "Invalid room ID" }));
              return;
            }
            if (connInfo.roomId) {
              const oldRoomCharacters = roomPresence.get(connInfo.roomId);
              if (oldRoomCharacters) {
                oldRoomCharacters.delete(connInfo.characterId);
                if (oldRoomCharacters.size === 0) {
                  roomPresence.delete(connInfo.roomId);
                }
                broadcastToRoom(connInfo.roomId, {
                  type: "presence_update",
                  characters: Array.from(oldRoomCharacters)
                });
              }
            }
            if (!roomPresence.has(roomId)) {
              roomPresence.set(roomId, /* @__PURE__ */ new Set());
            }
            roomPresence.get(roomId).add(connInfo.characterId);
            connInfo.roomId = roomId;
            const characterIds = Array.from(roomPresence.get(roomId));
            const characters2 = await Promise.all(
              characterIds.map(async (characterId) => {
                const character = await storage.getCharacter(characterId);
                return character ? {
                  id: character.id,
                  firstName: character.firstName,
                  middleName: character.middleName,
                  lastName: character.lastName,
                  fullName: `${character.firstName}${character.middleName ? ` ${character.middleName}` : ""} ${character.lastName}`
                } : null;
              })
            );
            const validCharacters = characters2.filter(Boolean);
            broadcastToRoom(roomId, {
              type: "presence_update",
              characters: validCharacters
            });
            ws2.send(JSON.stringify({
              type: "room_joined",
              roomId,
              characters: validCharacters
            }));
            break;
          case "chat_message":
            const connectionInfo = activeConnections.get(ws2);
            if (!connectionInfo?.characterId) {
              ws2.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
              return;
            }
            const messageCharacterCheck = await storage.getCharacter(connectionInfo.characterId);
            if (!messageCharacterCheck || messageCharacterCheck.deathDate) {
              ws2.send(JSON.stringify({
                type: "error",
                message: "Zem\u0159el\xE9 postavy nemohou ps\xE1t zpr\xE1vy. Nav\u0161tivte h\u0159bitov pro v\xEDce informac\xED."
              }));
              return;
            }
            const validatedMessage = insertMessageSchema.parse({
              roomId: message.roomId,
              characterId: connectionInfo.characterId,
              content: message.content,
              messageType: message.messageType || "message"
            });
            console.log("WebSocket saving message:", validatedMessage);
            const savedMessage = await storage.createMessage(validatedMessage);
            console.log("WebSocket message saved:", savedMessage);
            const messageCharacter = await storage.getCharacter(connectionInfo.characterId);
            if (!messageCharacter) return;
            const broadcastMessage = {
              type: "new_message",
              message: {
                ...savedMessage,
                character: {
                  firstName: messageCharacter.firstName,
                  middleName: messageCharacter.middleName,
                  lastName: messageCharacter.lastName
                }
              }
            };
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastMessage));
              }
            });
            break;
          case "dice_roll":
            const diceConnectionInfo = activeConnections.get(ws2);
            if (!diceConnectionInfo?.characterId) {
              ws2.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
              return;
            }
            const diceResult = Math.floor(Math.random() * 10) + 1;
            const diceCharacter = await storage.getCharacter(diceConnectionInfo.characterId);
            if (!diceCharacter || diceCharacter.deathDate) {
              ws2.send(JSON.stringify({
                type: "error",
                message: "Zem\u0159el\xE9 postavy nemohou h\xE1zet kostkou. Nav\u0161tivte h\u0159bitov pro v\xEDce informac\xED."
              }));
              return;
            }
            const tempDiceMessage = {
              id: Date.now(),
              // Temporary ID for immediate display
              roomId: message.roomId,
              characterId: diceConnectionInfo.characterId,
              content: `hodil kostkou: ${diceResult}`,
              messageType: "dice_roll",
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              character: {
                firstName: diceCharacter.firstName,
                middleName: diceCharacter.middleName,
                lastName: diceCharacter.lastName
              }
            };
            const diceBroadcast = {
              type: "new_message",
              message: tempDiceMessage
            };
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(diceBroadcast));
              }
            });
            storage.createMessage({
              roomId: message.roomId,
              characterId: diceConnectionInfo.characterId,
              content: `hodil kostkou: ${diceResult}`,
              messageType: "dice_roll"
            }).catch((error) => console.error("Error saving dice roll:", error));
            break;
          case "coin_flip":
            const coinConnectionInfo = activeConnections.get(ws2);
            if (!coinConnectionInfo?.characterId) {
              ws2.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
              return;
            }
            const coinResult = Math.floor(Math.random() * 2) + 1;
            const coinSide = coinResult === 1 ? "panna" : "orel";
            const coinCharacter = await storage.getCharacter(coinConnectionInfo.characterId);
            if (!coinCharacter || coinCharacter.deathDate) {
              ws2.send(JSON.stringify({
                type: "error",
                message: "Zem\u0159el\xE9 postavy nemohou h\xE1zet minc\xED. Nav\u0161tivte h\u0159bitov pro v\xEDce informac\xED."
              }));
              return;
            }
            const tempCoinMessage = {
              id: Date.now(),
              // Temporary ID for immediate display
              roomId: message.roomId,
              characterId: coinConnectionInfo.characterId,
              content: `hodil minc\xED: ${coinSide}`,
              messageType: "coin_flip",
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              character: {
                firstName: coinCharacter.firstName,
                middleName: coinCharacter.middleName,
                lastName: coinCharacter.lastName
              }
            };
            const coinBroadcast = {
              type: "new_message",
              message: tempCoinMessage
            };
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinBroadcast));
              }
            });
            storage.createMessage({
              roomId: message.roomId,
              characterId: coinConnectionInfo.characterId,
              content: `hodil minc\xED: ${coinSide}`,
              messageType: "coin_flip"
            }).catch((error) => console.error("Error saving coin flip:", error));
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws2.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });
    ws2.on("close", () => {
      console.log("WebSocket connection closed");
      const connInfo = activeConnections.get(ws2);
      if (connInfo?.characterId && connInfo?.roomId) {
        const roomCharacters = roomPresence.get(connInfo.roomId);
        if (roomCharacters) {
          roomCharacters.delete(connInfo.characterId);
          if (roomCharacters.size === 0) {
            roomPresence.delete(connInfo.roomId);
          } else {
            broadcastToRoom(connInfo.roomId, {
              type: "presence_update",
              characters: Array.from(roomCharacters)
            });
          }
        }
      }
      activeConnections.delete(ws2);
    });
  });
  (async () => {
    try {
      const testRoom = await storage.getChatRoomByName("Testovac\xED chat");
      if (!testRoom) {
        await storage.createChatRoom({
          name: "Testovac\xED chat",
          description: "M\xEDstnost pro testov\xE1n\xED a experimenty",
          isPublic: true
        });
        console.log("Created test chat room: Testovac\xED chat");
      }
    } catch (error) {
      console.error("Error initializing chat rooms:", error);
    }
  })();
  app2.delete("/api/admin/messages/all", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAllMessages();
      res.json({ message: "All messages deleted successfully" });
    } catch (error) {
      console.error("Error deleting all messages:", error);
      res.status(500).json({ message: "Failed to delete messages" });
    }
  });
  app2.post("/api/admin/rooms/:roomId/archive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archivedCount = await storage.archiveMessages(roomId);
      res.json({ message: `${archivedCount} messages archived successfully` });
    } catch (error) {
      console.error("Error archiving messages:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });
  app2.delete("/api/admin/rooms/:roomId/clear", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const deletedCount = await storage.clearRoomMessages(roomId);
      res.json({ message: `${deletedCount} messages cleared from chat` });
    } catch (error) {
      console.error("Error clearing room messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });
  app2.get("/api/rooms/:roomId/download", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      const currentMessages = await storage.getMessagesByRoom(roomId, 1e3);
      const archivedMessages2 = await storage.getArchivedMessages(roomId, 1e3);
      const allMessages = [
        ...currentMessages.map((msg) => ({
          content: msg.content,
          characterName: `${msg.character.firstName}${msg.character.middleName ? ` ${msg.character.middleName}` : ""} ${msg.character.lastName}`,
          createdAt: msg.createdAt,
          messageType: msg.messageType
        })),
        ...archivedMessages2.map((msg) => ({
          content: msg.content,
          characterName: msg.characterName,
          createdAt: msg.originalCreatedAt,
          messageType: msg.messageType
        }))
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const chatContent = allMessages.map((msg) => {
        const timestamp2 = new Date(msg.createdAt).toLocaleString("cs-CZ");
        return `[${timestamp2}] ${msg.characterName}: ${msg.content}`;
      }).join("\n");
      const filename = `chat_${room.name.replace(/[^a-zA-Z0-9]/g, "_")}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(chatContent);
    } catch (error) {
      console.error("Error downloading chat:", error);
      res.status(500).json({ message: "Failed to download chat" });
    }
  });
  app2.get("/api/admin/rooms/:roomId/archived", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const archivedMessages2 = await storage.getArchivedMessages(roomId, limit, offset);
      res.json(archivedMessages2);
    } catch (error) {
      console.error("Error fetching archived messages:", error);
      res.status(500).json({ message: "Failed to fetch archived messages" });
    }
  });
  app2.get("/api/admin/rooms/:roomId/archive-dates", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archiveDatesWithCounts = await storage.getArchiveDatesWithCounts(roomId);
      res.json(archiveDatesWithCounts);
    } catch (error) {
      console.error("Error fetching archive dates:", error);
      res.status(500).json({ message: "Failed to fetch archive dates" });
    }
  });
  app2.get("/api/admin/rooms/:roomId/archived/:date", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const archiveDate = req.params.date;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const archivedMessages2 = await storage.getArchivedMessagesByDate(roomId, archiveDate, limit, offset);
      res.json(archivedMessages2);
    } catch (error) {
      console.error("Error fetching archived messages by date:", error);
      res.status(500).json({ message: "Failed to fetch archived messages" });
    }
  });
  app2.post("/api/character-requests", requireAuth, async (req, res) => {
    try {
      const validatedData = characterRequestSchema.parse(req.body);
      const characterRequest = await storage.createCharacterRequest({
        ...validatedData,
        userId: req.session.userId
      });
      res.json(characterRequest);
    } catch (error) {
      console.error("Error creating character request:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create character request" });
    }
  });
  app2.get("/api/character-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getCharacterRequestsByUserId(req.session.userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });
  app2.delete("/api/character-requests/:id", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getCharacterRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      if (request.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Can only delete pending requests" });
      }
      await storage.deleteCharacterRequest(requestId);
      res.json({ message: "Request deleted successfully" });
    } catch (error) {
      console.error("Error deleting character request:", error);
      res.status(500).json({ message: "Failed to delete character request" });
    }
  });
  app2.get("/api/admin/character-requests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });
  app2.get("/api/admin/character-requests/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending character requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });
  app2.post("/api/admin/character-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      const character = await storage.approveCharacterRequest(requestId, req.session.userId, reviewNote);
      res.json({ message: "Character request approved", character });
    } catch (error) {
      console.error("Error approving character request:", error);
      res.status(500).json({ message: "Failed to approve character request" });
    }
  });
  app2.post("/api/admin/character-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      if (!reviewNote || reviewNote.trim().length < 10) {
        return res.status(400).json({ message: "Review note is required and must be at least 10 characters long" });
      }
      const request = await storage.rejectCharacterRequest(requestId, req.session.userId, reviewNote);
      res.json({ message: "Character request rejected", request });
    } catch (error) {
      console.error("Error rejecting character request:", error);
      res.status(500).json({ message: "Failed to reject character request" });
    }
  });
  app2.patch("/api/chat/messages/:id/character", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { characterId } = req.body;
      if (!characterId) {
        return res.status(400).json({ message: "Character ID is required" });
      }
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      const messageTime = new Date(message.createdAt);
      const now = /* @__PURE__ */ new Date();
      const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1e3 * 60);
      if (timeDiffMinutes > 5) {
        return res.status(403).json({ message: "Message can only be reassigned within 5 minutes of posting" });
      }
      if (!message.characterId) {
        return res.status(400).json({ message: "Message has no character assigned" });
      }
      const originalCharacter = await storage.getCharacter(message.characterId);
      if (!originalCharacter || originalCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "You can only reassign your own messages" });
      }
      const newCharacter = await storage.getCharacter(characterId);
      if (!newCharacter || newCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "You can only reassign to your own characters" });
      }
      await storage.updateMessageCharacter(messageId, characterId);
      res.json({ message: "Message character updated successfully" });
    } catch (error) {
      console.error("Error updating message character:", error);
      res.status(500).json({ message: "Failed to update message character" });
    }
  });
  app2.get("/api/admin/activity-log", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const activityLog = await storage.getAdminActivityLog(limit, offset);
      res.json(activityLog);
    } catch (error) {
      console.error("Error fetching admin activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });
  app2.post("/api/admin/characters/:id/kill", requireAuth, requireAdmin, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { deathReason } = req.body;
      const adminId = req.session.userId;
      if (!deathReason || deathReason.trim().length === 0) {
        return res.status(400).json({ message: "Death reason is required" });
      }
      const killedCharacter = await storage.killCharacter(characterId, deathReason.trim(), adminId);
      if (!killedCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      await storage.logAdminActivity({
        adminId,
        action: "character_death",
        targetUserId: killedCharacter.userId,
        details: `Postava ${killedCharacter.firstName} ${killedCharacter.lastName} byla ozna\u010Dena jako mrtv\xE1. D\u016Fvod: ${deathReason.trim()}`
      });
      res.json({ message: "Character killed successfully", character: killedCharacter });
    } catch (error) {
      console.error("Error killing character:", error);
      res.status(500).json({ message: "Failed to kill character" });
    }
  });
  app2.get("/api/cemetery", async (req, res) => {
    try {
      const deadCharacters = await storage.getDeadCharacters();
      res.json(deadCharacters);
    } catch (error) {
      console.error("Error fetching dead characters:", error);
      res.status(500).json({ message: "Failed to fetch cemetery data" });
    }
  });
  app2.post("/api/characters/:id/revive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const adminId = req.session.userId;
      const revivedCharacter = await storage.reviveCharacter(characterId);
      if (!revivedCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      await storage.logAdminActivity({
        adminId,
        action: "character_revive",
        targetUserId: revivedCharacter.userId,
        details: `Postava ${revivedCharacter.firstName} ${revivedCharacter.lastName} byla o\u017Eivena`
      });
      res.json({ message: "Character revived successfully", character: revivedCharacter });
    } catch (error) {
      console.error("Error reviving character:", error);
      res.status(500).json({ message: "Failed to revive character" });
    }
  });
  app2.post("/api/admin/users/:id/ban", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banReason } = req.body;
      const adminId = req.session.userId;
      if (!banReason || banReason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role === "admin") {
        return res.status(400).json({ message: "Cannot ban admin users" });
      }
      await storage.banUser(userId, banReason.trim());
      await storage.logAdminActivity({
        adminId,
        action: "user_ban",
        targetUserId: userId,
        details: `U\u017Eivatel ${user.username} byl zabanov\xE1n. D\u016Fvod: ${banReason.trim()}`
      });
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });
  app2.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await storage.hashPassword(tempPassword);
      await storage.resetUserPassword(userId, hashedPassword);
      await storage.logAdminActivity({
        adminId,
        action: "password_reset",
        targetUserId: userId,
        details: `Heslo pro u\u017Eivatele ${user.username} bylo resetov\xE1no`
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
  app2.patch("/api/admin/users/:id/narrator", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { canNarrate, reason } = req.body;
      const adminId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUserNarratorPermissions(userId, canNarrate);
      await storage.logAdminActivity({
        adminId,
        action: "narrator_permission_change",
        targetUserId: userId,
        details: `Vyprav\u011B\u010Dsk\xE1 opr\xE1vn\u011Bn\xED pro u\u017Eivatele ${user.username} ${canNarrate ? "ud\u011Blena" : "odebr\xE1na"}${reason ? `. D\u016Fvod: ${reason}` : ""}`
      });
      res.json({ message: "Narrator permissions updated successfully" });
    } catch (error) {
      console.error("Error updating narrator permissions:", error);
      res.status(500).json({ message: "Failed to update narrator permissions" });
    }
  });
  app2.get("/api/admin/chat-categories", requireAuth, requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllChatCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });
  app2.post("/api/admin/chat-categories", requireAuth, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertChatCategorySchema.parse(req.body);
      const category = await storage.createChatCategory(categoryData);
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_category_create",
        details: `Vytvo\u0159ena kategorie "${category.name}"`
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating chat category:", error);
      res.status(500).json({ message: "Failed to create chat category" });
    }
  });
  app2.put("/api/admin/chat-categories/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatCategorySchema.partial().parse(req.body);
      const category = await storage.updateChatCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: "Chat category not found" });
      }
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_category_update",
        details: `Upravena kategorie "${category.name}"`
      });
      res.json(category);
    } catch (error) {
      console.error("Error updating chat category:", error);
      res.status(500).json({ message: "Failed to update chat category" });
    }
  });
  app2.delete("/api/admin/chat-categories/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getChatCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Chat category not found" });
      }
      const success = await storage.deleteChatCategory(id);
      if (!success) {
        return res.status(400).json({ message: "Cannot delete category with child categories or rooms" });
      }
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_category_delete",
        details: `Smaz\xE1na kategorie "${category.name}"`
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat category:", error);
      res.status(500).json({ message: "Failed to delete chat category" });
    }
  });
  app2.post("/api/admin/chat-rooms", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomData = insertChatRoomSchema.parse(req.body);
      if (roomData.password) {
        roomData.password = await storage.hashPassword(roomData.password);
      }
      const room = await storage.createChatRoom(roomData);
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_room_create",
        details: `Vytvo\u0159ena m\xEDstnost "${room.name}"`
      });
      res.json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });
  app2.put("/api/admin/chat-rooms/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatRoomSchema.partial().parse(req.body);
      const room = await storage.updateChatRoom(id, updates);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_room_update",
        details: `Upravena m\xEDstnost "${room.name}"`
      });
      res.json(room);
    } catch (error) {
      console.error("Error updating chat room:", error);
      res.status(500).json({ message: "Failed to update chat room" });
    }
  });
  app2.delete("/api/admin/chat-rooms/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getChatRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      const success = await storage.deleteChatRoom(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete chat room" });
      }
      await storage.logAdminActivity({
        adminId: req.session.userId,
        action: "chat_room_delete",
        details: `Smaz\xE1na m\xEDstnost "${room.name}"`
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat room:", error);
      res.status(500).json({ message: "Failed to delete chat room" });
    }
  });
  app2.get("/api/owl-post/inbox", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      const firstAliveCharacter = userCharacters.find((char) => !char.deathDate);
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      const messages2 = await storage.getOwlPostInbox(firstAliveCharacter.id, limit, offset);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching inbox messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/owl-post/sent", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      const firstAliveCharacter = userCharacters.find((char) => !char.deathDate);
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      const messages2 = await storage.getOwlPostSent(firstAliveCharacter.id, limit, offset);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/owl-post/unread-count", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      const firstAliveCharacter = userCharacters.find((char) => !char.deathDate);
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      const count2 = await storage.getUnreadOwlPostCount(firstAliveCharacter.id);
      res.json({ count: count2 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });
  app2.post("/api/owl-post/send", requireAuth, async (req, res) => {
    try {
      const messageData = insertOwlPostMessageSchema.parse(req.body);
      const senderCharacter = await storage.getCharacter(messageData.senderCharacterId);
      if (!senderCharacter || senderCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to send from this character" });
      }
      const recipientCharacter = await storage.getCharacter(messageData.recipientCharacterId);
      if (!recipientCharacter || !recipientCharacter.isActive) {
        return res.status(400).json({ message: "Recipient character not found or inactive" });
      }
      const message = await storage.sendOwlPostMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending owl post message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/owl-post/inbox/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to access this character's messages" });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      const messages2 = await storage.getOwlPostInbox(characterId, limit, offset);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/owl-post/sent/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to access this character's messages" });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      const messages2 = await storage.getOwlPostSent(characterId, limit, offset);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/owl-post/mark-read/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const message = await storage.getOwlPostMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      const recipientCharacter = await storage.getCharacter(message.recipientCharacterId);
      if (!recipientCharacter || recipientCharacter.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized to mark this message as read" });
      }
      await storage.markOwlPostAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  app2.get("/api/owl-post/unread-count/:characterId", requireAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      if (!character || character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const count2 = await storage.getUnreadOwlPostCount(characterId);
      res.json({ count: count2 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });
  app2.delete("/api/owl-post/message/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const message = await storage.getOwlPostMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      const senderCharacter = await storage.getCharacter(message.senderCharacterId);
      const recipientCharacter = await storage.getCharacter(message.recipientCharacterId);
      const canDelete = senderCharacter && senderCharacter.userId === req.session.userId || recipientCharacter && recipientCharacter.userId === req.session.userId;
      if (!canDelete) {
        return res.status(403).json({ message: "Unauthorized to delete this message" });
      }
      const deleted = await storage.deleteOwlPostMessage(messageId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete message" });
      }
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting owl post message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.get("/api/owl-post/characters", requireAuth, async (req, res) => {
    try {
      const characters2 = await storage.getAllCharactersForOwlPost();
      const characterList = characters2.map((char) => ({
        id: char.id,
        firstName: char.firstName,
        middleName: char.middleName,
        lastName: char.lastName,
        fullName: `${char.firstName} ${char.middleName ? char.middleName + " " : ""}${char.lastName}`
      }));
      res.json(characterList.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (error) {
      console.error("Error fetching characters for owl post:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });
  app2.get("/api/owl-post/unread-total", requireAuth, async (req, res) => {
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      const aliveCharacters = userCharacters.filter((char) => !char.deathDate);
      let totalUnread = 0;
      for (const character of aliveCharacters) {
        const count2 = await storage.getUnreadOwlPostCount(character.id);
        totalUnread += count2;
      }
      res.json({ count: totalUnread });
    } catch (error) {
      console.error("Error fetching total unread count:", error);
      res.status(500).json({ message: "Failed to fetch total unread count" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { assignedAddress, reviewNote } = req.body;
      if (!assignedAddress) {
        return res.status(400).json({ message: "Assigned address is required" });
      }
      const approvedRequest = await storage.approveHousingRequest(
        requestId,
        req.session.userId,
        assignedAddress,
        reviewNote
      );
      res.json(approvedRequest);
    } catch (error) {
      console.error("Error approving housing request:", error);
      res.status(500).json({ message: "Failed to approve housing request" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for rejection" });
      }
      const rejectedRequest = await storage.rejectHousingRequest(
        requestId,
        req.session.userId,
        reviewNote
      );
      res.json(rejectedRequest);
    } catch (error) {
      console.error("Error rejecting housing request:", error);
      res.status(500).json({ message: "Failed to reject housing request" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/return", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for returning request" });
      }
      const request = await storage.rejectHousingRequest(
        requestId,
        req.session.userId,
        reviewNote
      );
      res.json(request);
    } catch (error) {
      console.error("Error returning housing request:", error);
      res.status(500).json({ message: "Failed to return housing request" });
    }
  });
  app2.put("/api/admin/chat-categories/:id/sort-order", requireAuth, requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { sortOrder } = req.body;
      if (typeof sortOrder !== "number") {
        return res.status(400).json({ message: "Sort order must be a number" });
      }
      const category = await storage.updateChatCategorySortOrder(categoryId, sortOrder);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category sort order:", error);
      res.status(500).json({ message: "Failed to update category sort order" });
    }
  });
  app2.put("/api/admin/chat-rooms/:id/sort-order", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { sortOrder } = req.body;
      if (typeof sortOrder !== "number") {
        return res.status(400).json({ message: "Sort order must be a number" });
      }
      const room = await storage.updateChatRoomSortOrder(roomId, sortOrder);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error updating room sort order:", error);
      res.status(500).json({ message: "Failed to update room sort order" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  serveStatic(app);
  const port = Number(process.env.PORT) || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    // Make sure to bind to 0.0.0.0 for accessibility
    reusePort: true
  }, () => {
    log(`Server running on port ${port}`);
  });
})();
