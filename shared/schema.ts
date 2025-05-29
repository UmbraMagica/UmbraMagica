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
  characterId: integer("character_id").references(() => characters.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("message").notNull(), // message, action, system, dice_roll, coin_flip
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Archived messages table (for backup/archival)
export const archivedMessages = pgTable("archived_messages", {
  id: serial("id").primaryKey(),
  originalMessageId: integer("original_message_id").notNull(),
  roomId: integer("room_id").notNull(),
  characterId: integer("character_id").notNull(),
  characterName: varchar("character_name", { length: 150 }).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull(),
  originalCreatedAt: timestamp("original_created_at").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  messages: many(messages),
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
