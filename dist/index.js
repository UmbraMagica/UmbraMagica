// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
import bcrypt from "bcrypt";

// server/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = "https://mzwbvzrkyjooegttklcq.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16d2J2enJreWpvb2VndHRrbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI4NTUsImV4cCI6MjA2NTAyODg1NX0.oRY1m83jybuB583GQBpHb_ulicbMsaAnyZ4WPrz2o0M";
var supabase2 = createClient(supabaseUrl, supabaseKey);

// server/storage.ts
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const { data, error } = await supabase2.from("users").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getUserByUsername(username) {
    const { data, error } = await supabase2.from("users").select("*").eq("username", username).single();
    console.log("getUserByUsername:", { username, data, error });
    if (error) return void 0;
    return toCamel(data);
  }
  async getUserByEmail(email) {
    const { data, error } = await supabase2.from("users").select("*").eq("email", email).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async createUser(insertUser) {
    const { data, error } = await supabase2.from("users").insert([{ ...insertUser, updated_at: /* @__PURE__ */ new Date() }]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
  async updateUserRole(id, role) {
    const { data, error } = await supabase2.from("users").update({ role, updated_at: /* @__PURE__ */ new Date() }).eq("id", id).select().single();
    if (error) return void 0;
    return toCamel(data);
  }
  async updateUserNarratorPermission(id, canNarrate) {
    const { data, error } = await supabase2.from("users").update({ can_narrate: canNarrate, updated_at: /* @__PURE__ */ new Date() }).eq("id", id).select().single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getAllUsers(includeSystem = false) {
    let query = supabase2.from("users").select("*");
    if (!includeSystem) {
      query = query.eq("is_system", false);
    }
    const { data, error } = await query;
    if (error) return [];
    return toCamel(data || []);
  }
  async banUser(id, banReason) {
    await supabase2.from("users").update({ is_banned: true, ban_reason: banReason, banned_at: /* @__PURE__ */ new Date() }).eq("id", id);
  }
  async resetUserPassword(id, hashedPassword) {
    await supabase2.from("users").update({ password: hashedPassword }).eq("id", id);
  }
  async updateUserPassword(id, hashedPassword) {
    await supabase2.from("users").update({ password: hashedPassword, updated_at: /* @__PURE__ */ new Date() }).eq("id", id);
  }
  async updateUserEmail(id, email) {
    await supabase2.from("users").update({ email, updated_at: /* @__PURE__ */ new Date() }).eq("id", id);
  }
  async updateUserSettings(id, settings) {
    const snakeSettings = {};
    if (settings.characterOrder !== void 0) snakeSettings.character_order = settings.characterOrder;
    if (settings.highlightWords !== void 0) snakeSettings.highlight_words = settings.highlightWords;
    if (settings.highlightColor !== void 0) snakeSettings.highlight_color = settings.highlightColor;
    if (settings.narratorColor !== void 0) snakeSettings.narrator_color = settings.narratorColor;
    snakeSettings.updated_at = /* @__PURE__ */ new Date();
    await supabase2.from("users").update(snakeSettings).eq("id", id);
  }
  // Character operations
  async getCharacter(id) {
    const { data, error } = await supabase2.from("characters").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getCharactersByUserId(userId) {
    const { data, error } = await supabase2.from("characters").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }
  async createCharacter(insertCharacter) {
    const { data, error } = await supabase2.from("characters").insert([{ ...insertCharacter, updatedAt: /* @__PURE__ */ new Date() }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateCharacter(id, updates) {
    const { data, error } = await supabase2.from("characters").update({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async getCharacterByName(firstName, lastName) {
    const { data, error } = await supabase2.from("characters").select("*").eq("first_name", firstName).eq("last_name", lastName).single();
    if (error) return void 0;
    return toCamel(data);
  }
  // Authentication and invite codes remain same...
  async getInviteCode(code) {
    const { data, error } = await supabase2.from("inviteCodes").select("*").eq("code", code).single();
    if (error) return void 0;
    return data;
  }
  async getAllInviteCodes() {
    const { data, error } = await supabase2.from("inviteCodes").select("*").order("created_at", { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }
  async createInviteCode(insertInviteCode) {
    const { data, error } = await supabase2.from("inviteCodes").insert([insertInviteCode]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async useInviteCode(code, userId) {
    const { error } = await supabase2.from("inviteCodes").update({ isUsed: true, usedBy: userId, usedAt: /* @__PURE__ */ new Date() }).eq("code", code);
    return !error;
  }
  async validateUser(username, password) {
    const user = await this.getUserByUsername(username);
    console.log("validateUser - user:", user);
    if (!user) return null;
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("validateUser - isValidPassword:", isValidPassword, "hash:", user.password, "input:", password);
    return isValidPassword ? user : null;
  }
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  // Chat operations (keeping existing implementation)
  async getChatRoom(id) {
    const { data, error } = await supabase2.from("chatRooms").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getChatRoomByName(name) {
    const { data, error } = await supabase2.from("chatRooms").select("*").eq("name", name).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async createChatRoom(insertChatRoom) {
    const { data, error } = await supabase2.from("chatRooms").insert([insertChatRoom]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
  async updateChatRoom(id, updates) {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    const { data, error } = await supabase2.from("chatRooms").update({ ...updates, updated_at: /* @__PURE__ */ new Date() }).eq("id", id).select().single();
    if (error) return void 0;
    return toCamel(data);
  }
  async deleteChatRoom(id) {
    await supabase2.from("messages").delete().eq("room_id", id);
    const { error } = await supabase2.from("chatRooms").delete().eq("id", id);
    return !error;
  }
  async getAllChatRooms() {
    const { data, error } = await supabase2.from("chatRooms").select("*").order("sort_order", { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }
  async getChatRoomsByCategory(categoryId) {
    const { data, error } = await supabase2.from("chatRooms").select("*").eq("category_id", categoryId).order("sort_order", { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }
  async validateRoomPassword(roomId, password) {
    const room = await this.getChatRoom(roomId);
    if (!room) return false;
    if (!room.password) return true;
    return bcrypt.compare(password, room.password);
  }
  async updateChatCategorySortOrder(id, sortOrder) {
    const { data, error } = await supabase2.from("chatCategories").update({ sortOrder }).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async updateChatRoomSortOrder(id, sortOrder) {
    const { data, error } = await supabase2.from("chatRooms").update({ sortOrder }).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async getChatCategory(id) {
    const { data, error } = await supabase2.from("chatCategories").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getChatCategoryByName(name) {
    const { data, error } = await supabase2.from("chatCategories").select("*").eq("name", name).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async createChatCategory(insertChatCategory) {
    const { data, error } = await supabase2.from("chatCategories").insert([insertChatCategory]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateChatCategory(id, updates) {
    const { data, error } = await supabase2.from("chatCategories").update(updates).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async deleteChatCategory(id) {
    const { data: children } = await supabase2.from("chatCategories").select("id").eq("parentId", id);
    if (children && children.length > 0) return false;
    const { data: rooms } = await supabase2.from("chatRooms").select("id").eq("categoryId", id);
    if (rooms && rooms.length > 0) return false;
    const { error } = await supabase2.from("chatCategories").delete().eq("id", id);
    return !error;
  }
  async getAllChatCategories() {
    const { data, error } = await supabase2.from("chatCategories").select("*").order("sort_order", { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }
  async getChatCategoriesWithChildren() {
    const { data: categories, error } = await supabase2.from("chatCategories").select("*").order("sort_order", { ascending: true });
    if (error || !categories) return [];
    const { data: rooms } = await supabase2.from("chatRooms").select("*");
    const byParent = {};
    for (const cat of categories) {
      if (cat.parent_id) {
        if (!byParent[cat.parent_id]) byParent[cat.parent_id] = [];
        byParent[cat.parent_id].push(cat);
      }
    }
    return toCamel(categories.map((cat) => ({
      ...cat,
      children: byParent[cat.id] || [],
      rooms: (rooms || []).filter((r) => r.category_id === cat.id)
    })));
  }
  // Message operations (keeping existing)
  async getMessage(id) {
    const { data, error } = await supabase2.from("messages").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getMessagesByRoom(roomId, limit = 50, offset = 0) {
    const { data, error } = await supabase2.from("messages").select("*").eq("room_id", roomId).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return toCamel(data || []);
  }
  async createMessage(insertMessage) {
    const { data, error } = await supabase2.from("messages").insert([insertMessage]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
  async deleteMessage(id) {
    const { error } = await supabase2.from("messages").delete().eq("id", id);
    return !error;
  }
  async updateMessageCharacter(messageId, characterId) {
    await supabase2.from("messages").update({ character_id: characterId }).eq("id", messageId);
  }
  // Archive operations (keeping existing)
  async archiveMessages(roomId, beforeDate) {
    const { data: messages2, error } = await supabase2.from("messages").select("*").eq("roomId", roomId).lt("createdAt", beforeDate ? beforeDate.toISOString() : (/* @__PURE__ */ new Date()).toISOString());
    if (error || !messages2) return 0;
    for (const msg of messages2) {
      await supabase2.from("archivedMessages").insert([{
        originalMessageId: msg.id,
        roomId: msg.roomId,
        characterId: msg.characterId,
        characterName: "",
        // Pokud potřebuješ, doplň jméno postavy
        content: msg.content,
        messageType: msg.messageType,
        originalCreatedAt: msg.createdAt,
        archivedAt: (/* @__PURE__ */ new Date()).toISOString()
      }]);
      await supabase2.from("messages").delete().eq("id", msg.id);
    }
    return messages2.length;
  }
  async getArchivedMessages(roomId, limit = 50, offset = 0) {
    const { data, error } = await supabase2.from("archivedMessages").select("*").eq("roomId", roomId).order("archivedAt", { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return data || [];
  }
  async deleteAllMessages() {
    await supabase2.from("messages").delete();
    await supabase2.from("archivedMessages").delete();
  }
  async clearRoomMessages(roomId) {
    const { data, error, count } = await supabase2.from("messages").delete().eq("roomId", roomId).select("*", { count: "exact" });
    if (error) return 0;
    if (typeof count === "number") return count;
    if (Array.isArray(data)) return data.length;
    return 0;
  }
  async getArchiveDates(roomId) {
    const { data, error } = await supabase2.from("archivedMessages").select("archivedAt").eq("roomId", roomId).order("archivedAt", { ascending: false });
    if (error || !data) return [];
    const uniqueDates = Array.from(new Set(data.map((d) => d.archivedAt && d.archivedAt.split("T")[0])));
    return uniqueDates;
  }
  async getArchiveDatesWithCounts(roomId) {
    const { data, error } = await supabase2.from("archivedMessages").select("archivedAt").eq("roomId", roomId).order("archivedAt", { ascending: false });
    if (error || !data) return [];
    const counts = {};
    for (const row of data) {
      const date2 = row.archivedAt && row.archivedAt.split("T")[0];
      if (date2) counts[date2] = (counts[date2] || 0) + 1;
    }
    return Object.entries(counts).map(([date2, count]) => ({ date: date2, count }));
  }
  async getArchivedMessagesByDate(roomId, archiveDate, limit = 50, offset = 0) {
    const startDate = new Date(archiveDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const { data, error } = await supabase2.from("archivedMessages").select("*").eq("roomId", roomId).gte("archivedAt", startDate.toISOString()).lt("archivedAt", endDate.toISOString()).order("originalCreatedAt", { ascending: false }).range(offset, offset + limit - 1);
    if (error) return [];
    return data || [];
  }
  async getLastMessageByCharacter(characterId) {
    const { data, error } = await supabase2.from("messages").select("*").eq("characterId", characterId).order("createdAt", { ascending: false }).limit(1);
    if (error || !data || data.length === 0) return void 0;
    return data[0];
  }
  // Character request operations
  async createCharacterRequest(request) {
    const { data, error } = await supabase2.from("characterRequests").insert([request]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async getCharacterRequestsByUserId(userId) {
    const { data, error } = await supabase2.from("characterRequests").select("*").eq("userId", userId);
    if (error) return [];
    return data || [];
  }
  async getCharacterRequestById(requestId) {
    const { data, error } = await supabase2.from("characterRequests").select("*").eq("id", requestId).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async deleteCharacterRequest(requestId) {
    const { error } = await supabase2.from("characterRequests").delete().eq("id", requestId);
    return !error;
  }
  async getAllCharacterRequests() {
    const { data: requests, error } = await supabase2.from("characterRequests").select("*");
    if (error || !requests) return [];
    const { data: usersData } = await supabase2.from("users").select("id,username,email");
    return toCamel(requests.map((r) => ({
      ...r,
      user: usersData?.find((u) => u.id === r.user_id) || { username: "", email: "" }
    })));
  }
  async getPendingCharacterRequests() {
    const { data: requests, error } = await supabase2.from("characterRequests").select("*").eq("status", "pending");
    if (error || !requests) return [];
    const { data: usersData } = await supabase2.from("users").select("id,username,email");
    return toCamel(requests.map((r) => ({
      ...r,
      user: usersData?.find((u) => u.id === r.user_id) || { username: "", email: "" }
    })));
  }
  async approveCharacterRequest(requestId, adminId, reviewNote) {
    const { data: request, error } = await supabase2.from("characterRequests").select("*").eq("id", requestId).single();
    if (error || !request) throw new Error("Request not found");
    await supabase2.from("characterRequests").update({ status: "approved", reviewedBy: adminId, reviewedAt: (/* @__PURE__ */ new Date()).toISOString(), reviewNote }).eq("id", requestId);
    const { data: character, error: charError } = await supabase2.from("characters").insert([{
      userId: request.userId,
      firstName: request.firstName,
      middleName: request.middleName,
      lastName: request.lastName,
      birthDate: request.birthDate,
      school: request.school,
      description: request.description,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }]).select().single();
    if (charError) throw new Error(charError.message);
    await this.logAdminActivity({
      adminId,
      action: "approve_character",
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Approved character request: ${request.firstName} ${request.lastName}`
    });
    return character;
  }
  async rejectCharacterRequest(requestId, adminId, reviewNote) {
    const { data: request, error } = await supabase2.from("characterRequests").select("*").eq("id", requestId).single();
    if (error || !request) throw new Error("Request not found");
    await supabase2.from("characterRequests").update({ status: "rejected", reviewedBy: adminId, reviewedAt: (/* @__PURE__ */ new Date()).toISOString(), reviewNote }).eq("id", requestId);
    await this.logAdminActivity({
      adminId,
      action: "reject_character",
      targetUserId: request.userId,
      targetRequestId: requestId,
      details: `Rejected character request: ${request.firstName} ${request.lastName}`
    });
    return { ...request, status: "rejected", reviewNote };
  }
  // Admin activity log operations
  async logAdminActivity(activity) {
    const { data, error } = await supabase2.from("adminActivityLog").insert([activity]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async getAdminActivityLog(limit = 50, offset = 0) {
    const { data: logs, error } = await supabase2.from("adminActivityLog").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error || !logs) return [];
    const { data: usersData } = await supabase2.from("users").select("id,username");
    return toCamel(logs.map((l) => ({
      ...l,
      admin: usersData?.find((u) => u.id === l.admin_id) || { username: "" },
      targetUser: l.target_user_id ? usersData?.find((u) => u.id === l.target_user_id) || { username: "" } : void 0
    })));
  }
  // Multi-character operations
  // Cemetery operations
  async killCharacter(characterId, deathReason, adminId) {
    const character = await this.getCharacter(characterId);
    if (!character) throw new Error("Character not found");
    const { data, error } = await supabase2.from("characters").update({ isActive: false, deathDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], deathReason, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", characterId).select().single();
    if (error) return void 0;
    await this.logAdminActivity({
      adminId,
      action: "kill_character",
      targetUserId: character.userId,
      targetCharacterId: characterId,
      details: `Killed character: ${character.firstName} ${character.lastName}. Reason: ${deathReason}`
    });
    return data;
  }
  async reviveCharacter(characterId) {
    const { data, error } = await supabase2.from("characters").update({ deathDate: null, deathReason: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", characterId).select().single();
    if (error) return void 0;
    return data;
  }
  async getDeadCharacters() {
    const { data, error } = await supabase2.from("characters").select("*").not("death_date", "is", null).order("death_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }
  // Spell operations
  async getAllSpells() {
    const { data, error } = await supabase2.from("spells").select("*").order("category", { ascending: true }).order("name", { ascending: true });
    if (error) return [];
    return toCamel(data || []);
  }
  async getSpell(id) {
    const { data, error } = await supabase2.from("spells").select("*").eq("id", id).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async getSpellByName(name) {
    const { data, error } = await supabase2.from("spells").select("*").eq("name", name).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async createSpell(insertSpell) {
    const { data, error } = await supabase2.from("spells").insert([insertSpell]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateSpell(id, updates) {
    const { data, error } = await supabase2.from("spells").update({ ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async deleteSpell(id) {
    await supabase2.from("characterSpells").delete().eq("spellId", id);
    const { error } = await supabase2.from("spells").delete().eq("id", id);
    return !error;
  }
  // Character spell operations
  async getCharacterSpells(characterId) {
    const { data: charSpells, error } = await supabase2.from("characterSpells").select("*").eq("character_id", characterId);
    if (error || !charSpells) return [];
    const { data: spellsData } = await supabase2.from("spells").select("*");
    return toCamel(charSpells.map((cs) => ({
      ...cs,
      spell: spellsData?.find((s) => s.id === cs.spell_id)
    })));
  }
  async addSpellToCharacter(characterId, spellId) {
    const { data, error } = await supabase2.from("characterSpells").insert([{ character_id: characterId, spell_id: spellId }]).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
  async removeSpellFromCharacter(characterId, spellId) {
    const { error } = await supabase2.from("characterSpells").delete().eq("character_id", characterId).eq("spell_id", spellId);
    return !error;
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
      const { data: existingSpells } = await supabase2.from("spells").select("*").eq("name", spellData.name);
      let spell;
      if (!existingSpells || existingSpells.length === 0) {
        const { data: inserted, error } = await supabase2.from("spells").insert([spellData]).select().single();
        if (error) throw new Error(error.message);
        spell = inserted;
        console.log(`Created spell: ${spell.name}`);
      } else {
        spell = existingSpells[0];
        console.log(`Spell already exists: ${spell.name}`);
      }
      const { data: allCharacters } = await supabase2.from("characters").select("*");
      if (!allCharacters) continue;
      for (const character of allCharacters) {
        const { data: existingCharacterSpell } = await supabase2.from("characterSpells").select("*").eq("characterId", character.id).eq("spellId", spell.id);
        if (!existingCharacterSpell || existingCharacterSpell.length === 0) {
          await supabase2.from("characterSpells").insert([{
            characterId: character.id,
            spellId: spell.id
          }]);
          console.log(`Added spell ${spell.name} to character ${character.firstName} ${character.lastName}`);
        }
      }
    }
  }
  // Character inventory operations
  async getCharacterInventory(characterId) {
    const { data, error } = await supabase2.from("characterInventory").select("*").eq("character_id", characterId);
    if (error) return [];
    return toCamel(data || []);
  }
  async getInventoryItem(id) {
    const { data, error } = await supabase2.from("characterInventory").select("*").eq("id", id).single();
    if (error) return void 0;
    return data;
  }
  async addInventoryItem(item) {
    const { data, error } = await supabase2.from("characterInventory").insert([item]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateInventoryItem(id, updates) {
    const { data, error } = await supabase2.from("characterInventory").update(updates).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async deleteInventoryItem(id) {
    const { error } = await supabase2.from("characterInventory").delete().eq("id", id);
    return !error;
  }
  // Character journal operations
  async getCharacterJournal(characterId) {
    const { data, error } = await supabase2.from("characterJournal").select("*").eq("character_id", characterId);
    if (error) return [];
    return toCamel(data || []);
  }
  async getJournalEntry(id) {
    const { data, error } = await supabase2.from("characterJournal").select("*").eq("id", id).single();
    if (error) return void 0;
    return data;
  }
  async addJournalEntry(entry) {
    const { data, error } = await supabase2.from("characterJournal").insert([entry]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateJournalEntry(id, updates) {
    const { data, error } = await supabase2.from("characterJournal").update(updates).eq("id", id).select().single();
    if (error) return void 0;
    return data;
  }
  async deleteJournalEntry(id) {
    const { error } = await supabase2.from("characterJournal").delete().eq("id", id);
    return !error;
  }
  // Wand operations
  async getCharacterWand(characterId) {
    const { data, error } = await supabase2.from("wands").select("*").eq("character_id", characterId).single();
    if (error) return void 0;
    return toCamel(data);
  }
  async createWand(wand) {
    const { data, error } = await supabase2.from("wands").insert([wand]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  async updateWand(wandId, updates) {
    const { data, error } = await supabase2.from("wands").update(updates).eq("id", wandId).select().single();
    if (error) return void 0;
    return data;
  }
  async deleteWand(wandId) {
    const { error } = await supabase2.from("wands").delete().eq("id", wandId);
    return !error;
  }
  async generateRandomWand(characterId) {
    throw new Error("Method not implemented");
  }
  async getAllWandComponents() {
    throw new Error("Method not implemented");
  }
  async migrateExistingWandsToInventory() {
    throw new Error("Method not implemented");
  }
  async updateWandComponents(components) {
    throw new Error("Method not implemented");
  }
  // Influence operations
  async getInfluenceBar() {
    return { grindelwaldPoints: 50, dumbledorePoints: 50 };
  }
  async getInfluenceHistory() {
    return [];
  }
  async adjustInfluence(side, points, userId) {
    return;
  }
  async setInfluence(grindelwaldPoints, dumbledorePoints, userId) {
    return;
  }
  // ... existující kód ...
  async getAllCharacters(includeSystem = false) {
    let query = supabase2.from("characters").select("*");
    if (!includeSystem) {
      query = query.eq("is_system", false);
    }
    const { data, error } = await query;
    if (error) return [];
    return toCamel(data || []);
  }
  // ... existující kód ...
  async assignHousingAdminToSystemUser() {
    const [character] = await supabase2.from("characters").select("*").eq("firstName", "Spr\xE1va").eq("lastName", "ubytov\xE1n\xED").single();
    if (character) {
      await supabase2.from("characters").update({ userId: 6, is_system: true }).eq("id", character.id);
    }
  }
  // Přidávám implementaci chybějící funkce pro admin rozhraní
  async getPendingHousingRequests() {
    const { data, error } = await supabase2.from("housingRequests").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (error) return [];
    return toCamel(data || []);
  }
};
var storage = new DatabaseStorage();
function toCamel(obj) {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v)
      ])
    );
  }
  return obj;
}

// shared/schema.ts
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

// server/routes.ts
import { z as z2 } from "zod";
import session from "express-session";
import multer from "multer";
import sharp from "sharp";
import connectPgSimple from "connect-pg-simple";
import jwt from "jsonwebtoken";
var pgSession = connectPgSimple(session);
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
var JWT_SECRET = process.env.JWT_SECRET || "umbra-magica-jwt-secret-key-fixed-2024";
function generateJwt(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}
function requireAuthJWT(req, res, next) {
  const auth = req.headers.authorization;
  console.log("Authorization header:", auth);
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = auth.slice(7);
  const payload = verifyJwt(token);
  console.log("JWT payload:", payload);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.user = payload;
  next();
}
function requireAdminJWT(req, res, next) {
  requireAuthJWT(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}
function requireAuthFlexible(req, res, next) {
  if (req.session && req.session.userId) return next();
  const auth = req.headers.authorization;
  console.log("Authorization header:", auth);
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const payload = verifyJwt(token);
    console.log("JWT payload:", payload);
    if (payload) {
      req.user = payload;
      return next();
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
}
async function registerRoutes(app2) {
  const sessionTtl2 = 7 * 24 * 60 * 60 * 1e3;
  const sessionSecret2 = process.env.SESSION_SECRET || "umbra-magica-session-secret-key-fixed-2024";
  app2.use(session({
    store: new pgSession({
      conString: process.env.DATABASE_URL
    }),
    secret: sessionSecret2,
    resave: false,
    saveUninitialized: false,
    name: "connect.sid",
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".onrender.com",
      // důležité pro cross-domain cookies na Renderu
      maxAge: sessionTtl2
    }
  }));
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const activeConnections = /* @__PURE__ */ new Map();
  const roomPresence = /* @__PURE__ */ new Map();
  const broadcastToRoom = (roomId, data) => {
    for (const [ws, connInfo] of activeConnections.entries()) {
      if (ws.readyState === WebSocket.OPEN && connInfo.roomId === roomId) {
        ws.send(JSON.stringify(data));
      }
    }
  };
  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");
    activeConnections.set(ws, {});
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString("utf-8"));
        const connInfo = activeConnections.get(ws);
        if (!connInfo) return;
        if (data.type === "join_room") {
          connInfo.roomId = data.roomId;
          connInfo.characterId = data.characterId;
          connInfo.userId = data.userId;
          if (!roomPresence.has(data.roomId)) {
            roomPresence.set(data.roomId, /* @__PURE__ */ new Set());
          }
          if (data.characterId) {
            roomPresence.get(data.roomId).add(data.characterId);
          }
        } else if (data.type === "leave_room") {
          if (connInfo.roomId && connInfo.characterId) {
            const roomChars = roomPresence.get(connInfo.roomId);
            if (roomChars) {
              roomChars.delete(connInfo.characterId);
            }
          }
          connInfo.roomId = void 0;
          connInfo.characterId = void 0;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      const connInfo = activeConnections.get(ws);
      if (connInfo && connInfo.roomId && connInfo.characterId) {
        const roomChars = roomPresence.get(connInfo.roomId);
        if (roomChars) {
          roomChars.delete(connInfo.characterId);
        }
      }
      activeConnections.delete(ws);
    });
  });
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
  const requireAuth = (req, res, next) => {
    console.log("REQUIRE_AUTH DEBUG - cookies:", req.cookies, "session:", req.session, "url:", req.url);
    if (!req.session.userId) {
      console.log("REQUIRE_AUTH DEBUG - missing userId in session");
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
  app2.get("/api/auth/user", async (req, res) => {
    console.log("[DEBUG] /api/auth/user", { session: req.session, cookies: req.cookies });
    if (req.session && req.session.userId) {
      const user2 = await storage.getUser(req.session.userId);
      console.log("[DEBUG] /api/auth/user - user:", user2);
      if (!user2) return res.status(404).json({ message: "User not found" });
      const characters3 = await storage.getCharactersByUserId(user2.id);
      console.log("[DEBUG] /api/auth/user - characters:", characters3);
      return res.json({
        id: user2.id,
        username: user2.username,
        email: user2.email,
        role: user2.role,
        characters: characters3
      });
    }
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.slice(7);
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await storage.getUser(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const characters2 = await storage.getCharactersByUserId(user.id);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      characters: characters2
    });
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("LOGIN DEBUG - cookies:", req.cookies, "session (before):", req.session, "body:", req.body);
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.validateUser(username, password);
      if (!user) {
        console.log("LOGIN DEBUG - invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateJwt(user);
      const characters2 = await storage.getCharactersByUserId(user.id);
      req.session.userId = user.id;
      req.session.userRole = user.role;
      console.log("LOGIN DEBUG - session (after):", req.session);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          characters: characters2
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        if (!res.headersSent) return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (!res.headersSent) res.status(500).json({ message: "Login failed" });
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
      if (typeof highlightWords !== "string") {
        return res.status(400).json({ message: "Invalid highlight words format" });
      }
      const updateData = {
        highlightWords
      };
      if (highlightColor && typeof highlightColor === "string") {
        updateData.highlightColor = highlightColor;
      }
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
        return res.status(400).json({ message: "Nov\xE9 heslo mus\xED obsahovat alespo\u0148 8 znak\u016F" });
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
  app2.get("/api/users", requireAdminJWT, async (req, res) => {
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
  app2.patch("/api/users/:id/role", requireAdminJWT, async (req, res) => {
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
  app2.patch("/api/admin/users/:id/role", requireAdminJWT, async (req, res) => {
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
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "user_role_change",
        details: `Changed role of user ${user.username} to ${role}`
      });
      res.json({ message: "Role updated successfully", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.patch("/api/admin/users/:id/narrator", requireAdminJWT, async (req, res) => {
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
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      await storage.logAdminActivity({
        adminId: req.user.id,
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
  app2.get("/api/characters/online", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/characters/online", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const onlineCharacters = await storage.getOnlineCharacters();
      res.json(onlineCharacters);
    } catch (error) {
      console.error("Error fetching online characters:", error);
      res.status(500).json({ message: "Failed to fetch online characters" });
    }
  });
  app2.get("/api/admin/online-users", requireAdminJWT, async (req, res) => {
    try {
      const connectedUserIds = /* @__PURE__ */ new Set();
      for (const [ws, connInfo] of activeConnections.entries()) {
        if (ws.readyState === WebSocket.OPEN && connInfo.userId) {
          const user = await storage.getUser(connInfo.userId);
          if (user && !user.isSystem) {
            connectedUserIds.add(connInfo.userId);
          }
        }
      }
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const currentUserId = req.user.id;
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
  app2.get("/api/admin/invite-codes", requireAdminJWT, async (req, res) => {
    try {
      const inviteCodes2 = await storage.getAllInviteCodes();
      res.json(inviteCodes2);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });
  app2.post("/api/admin/invite-codes", requireAdminJWT, async (req, res) => {
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
  app2.post("/api/admin/update-character-dates", requireAdminJWT, async (req, res) => {
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
          email: "admin@umbra-magica.cz",
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
          email: "user@umbra-magica.cz",
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
  app2.get("/api/chat/categories", requireAuthFlexible, async (req, res) => {
    try {
      const categories = await storage.getChatCategoriesWithChildren();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });
  app2.get("/api/chat/rooms", requireAuthFlexible, async (req, res) => {
    try {
      const rooms = await storage.getAllChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });
  app2.get("/api/chat/rooms/:roomId/messages", requireAuthFlexible, async (req, res) => {
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
  app2.get("/api/chat/messages", requireAuthFlexible, async (req, res) => {
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
  app2.post("/api/chat/messages", requireAuthFlexible, async (req, res) => {
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
  app2.post("/api/chat/rooms/:roomId/archive", requireAuthFlexible, async (req, res) => {
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
  app2.get("/api/chat/rooms/:roomId/export", requireAuthFlexible, async (req, res) => {
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
  app2.patch("/api/admin/chat/rooms/:roomId", requireAdminJWT, async (req, res) => {
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
  app2.get("/api/chat/rooms/:roomId/presence", requireAuthFlexible, async (req, res) => {
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
      console.log("[DEBUG] /api/characters", { session: req.session, userId: req.session.userId });
      const characters2 = await storage.getCharactersByUserId(req.session.userId);
      console.log("[DEBUG] /api/characters - characters:", characters2);
      res.json(characters2);
    } catch (error) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });
  app2.get("/api/characters/all", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/characters/all", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const users2 = await storage.getAllUsers();
      const allCharacters = [];
      const isAdmin = req.user.role === "admin";
      for (const user of users2) {
        if (user.isSystem && !isAdmin) {
          continue;
        }
        const characters2 = await storage.getCharactersByUserId(user.id);
        for (const character of characters2) {
          if (character.isSystem && !isAdmin) {
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
  app2.get("/api/characters/dormitory-residents", requireAuthFlexible, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const dormitoryCharacters = [];
      const isAdmin = req.user.role === "admin";
      for (const user of users2) {
        if (user.isSystem && !isAdmin) {
          continue;
        }
        const characters2 = await storage.getCharactersByUserId(user.id);
        for (const character of characters2) {
          if (character.isSystem && !isAdmin) {
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
  app2.get("/api/characters/:id", requireAuthFlexible, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      console.log("[DEBUG] /api/characters/:id", { session: req.session, user: req.user, characterId });
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      const character = await storage.getCharacter(characterId);
      console.log("[DEBUG] /api/characters/:id - character:", character);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      const user = await storage.getUser(character.userId);
      console.log("[DEBUG] /api/characters/:id - user:", user);
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
  app2.get("/api/admin/spells", requireAdminJWT, async (req, res) => {
    try {
      const spells2 = await storage.getAllSpells();
      res.json(spells2);
    } catch (error) {
      console.error("Error fetching spells:", error);
      res.status(500).json({ message: "Failed to fetch spells" });
    }
  });
  app2.post("/api/admin/spells", requireAdminJWT, async (req, res) => {
    try {
      const validatedData = spellSchema.parse(req.body);
      const spell = await storage.createSpell(validatedData);
      res.json(spell);
    } catch (error) {
      console.error("Error creating spell:", error);
      res.status(500).json({ message: "Failed to create spell" });
    }
  });
  app2.put("/api/admin/spells/:id", requireAdminJWT, async (req, res) => {
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
  app2.delete("/api/admin/spells/:id", requireAdminJWT, async (req, res) => {
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
  app2.post("/api/admin/spells/initialize", requireAdminJWT, async (req, res) => {
    try {
      await storage.initializeDefaultSpells();
      res.json({ message: "Default spells initialized and added to all characters" });
    } catch (error) {
      console.error("Error initializing default spells:", error);
      res.status(500).json({ message: "Failed to initialize default spells" });
    }
  });
  app2.post("/api/admin/spells/bulk-import", requireAdminJWT, async (req, res) => {
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
  app2.put("/api/admin/wand-components", requireAdminJWT, async (req, res) => {
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
  app2.post("/api/admin/migrate-wands-to-inventory", requireAdminJWT, async (req, res) => {
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
      console.log("[DEBUG] /api/characters/:id/visit-ollivanders", { session: req.session, userId: req.session.userId, characterId });
      const character = await storage.getCharacter(characterId);
      console.log("[DEBUG] /api/characters/:id/visit-ollivanders - character:", character);
      if (!character || character.userId !== req.session.userId && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const existingWand = await storage.getCharacterWand(characterId);
      console.log("[DEBUG] /api/characters/:id/visit-ollivanders - existingWand:", existingWand);
      if (existingWand) {
        return res.status(400).json({ message: "Character already has a wand" });
      }
      const wand = await storage.generateRandomWand(characterId);
      console.log("[DEBUG] /api/characters/:id/visit-ollivanders - new wand:", wand);
      await storage.addInventoryItem({
        characterId,
        itemName: `H\u016Flka (${wand.wood})`,
        itemDescription: wand.description || `${wand.wood}, ${wand.length}, ${wand.flexibility}, ${wand.core}`,
        quantity: 1,
        category: "Wand",
        rarity: "Epic",
        value: 7,
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
  app2.get("/api/influence-bar", requireAuthFlexible, (req, res, next) => {
    console.log("HIT /api/influence-bar", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
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
  app2.get("/api/influence-history", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/influence-history", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const history = await storage.getInfluenceHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching influence history:", error);
      res.status(500).json({ message: "Failed to fetch influence history" });
    }
  });
  app2.post("/api/admin/influence-bar/adjust", requireAdminJWT, async (req, res) => {
    try {
      const { side, points } = req.body;
      if (!side || typeof points !== "number") {
        return res.status(400).json({ message: "Side and points are required" });
      }
      await storage.adjustInfluence(side, points, req.user.id);
      res.json({ message: "Influence adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting influence:", error);
      res.status(500).json({ message: "Failed to adjust influence" });
    }
  });
  app2.post("/api/admin/influence-bar/set", requireAdminJWT, async (req, res) => {
    try {
      const { grindelwaldPoints, dumbledorePoints } = req.body;
      if (typeof grindelwaldPoints !== "number" || typeof dumbledorePoints !== "number") {
        return res.status(400).json({ message: "Both point values are required" });
      }
      await storage.setInfluence(grindelwaldPoints, dumbledorePoints, req.user.id);
      res.json({ message: "Influence set successfully" });
    } catch (error) {
      console.error("Error setting influence:", error);
      res.status(500).json({ message: "Failed to set influence" });
    }
  });
  app2.post("/api/admin/influence-bar/adjust-with-history", requireAdminJWT, async (req, res) => {
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
      await storage.setInfluence(newGrindelwaldPoints, newDumbledorePoints, req.user.id);
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "influence_change",
        details: `Changed influence for ${changeType} by ${points} points. Reason: ${reason}`
      });
      res.json({ message: "Influence adjusted with history successfully" });
    } catch (error) {
      console.error("Error adjusting influence with history:", error);
      res.status(500).json({ message: "Failed to adjust influence with history" });
    }
  });
  app2.post("/api/admin/influence-bar/reset", requireAdminJWT, async (req, res) => {
    try {
      const { type } = req.body;
      if (!type || type !== "0:0" && type !== "50:50") {
        return res.status(400).json({ message: "Reset type must be '0:0' or '50:50'" });
      }
      const currentData = await storage.getInfluenceBar();
      const resetValues = type === "0:0" ? { grindelwald: 0, dumbledore: 0 } : { grindelwald: 50, dumbledore: 50 };
      await storage.setInfluence(resetValues.grindelwald, resetValues.dumbledore, req.user.id);
      const grindelwaldChange = resetValues.grindelwald - currentData.grindelwaldPoints;
      const dumbledoreChange = resetValues.dumbledore - currentData.dumbledorePoints;
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "influence_reset",
        details: `Influence reset to ${type}. Grindelwald changed by ${grindelwaldChange}, Dumbledore changed by ${dumbledoreChange}`
      });
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
  app2.get("/api/admin/housing-requests", requireAdminJWT, async (req, res) => {
    try {
      const requests = await storage.getPendingHousingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending housing requests:", error);
      res.status(500).json({ message: "Failed to fetch pending housing requests" });
    }
  });
  const characterRequestSchema3 = z2.object({
    firstName: z2.string(),
    middleName: z2.string().optional(),
    lastName: z2.string(),
    birthDate: z2.string(),
    description: z2.string()
  });
  app2.post("/api/character-requests", requireAuth, async (req, res) => {
    try {
      const validatedData = characterRequestSchema3.parse(req.body);
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
  app2.get("/api/admin/character-requests", requireAdminJWT, async (req, res) => {
    try {
      const requests = await storage.getPendingCharacterRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching character requests:", error);
      res.status(500).json({ message: "Failed to fetch character requests" });
    }
  });
  app2.post("/api/admin/character-requests/:id/approve", requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      const character = await storage.approveCharacterRequest(requestId, req.user.id, reviewNote);
      res.json({ message: "Character request approved", character });
    } catch (error) {
      console.error("Error approving character request:", error);
      res.status(500).json({ message: "Failed to approve character request" });
    }
  });
  app2.post("/api/admin/character-requests/:id/reject", requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNote } = req.body;
      if (!reviewNote || reviewNote.trim().length < 10) {
        return res.status(400).json({ message: "Review note is required and must be at least 10 characters long" });
      }
      const request = await storage.rejectCharacterRequest(requestId, req.user.id, reviewNote);
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
  app2.get("/api/admin/activity-log", requireAdminJWT, async (req, res) => {
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
  app2.post("/api/admin/characters/:id/kill", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const { deathReason } = req.body;
      const adminId = req.user.id;
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
  app2.post("/api/characters/:id/revive", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      const adminId = req.user.id;
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
  app2.post("/api/admin/users/:id/ban", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banReason } = req.body;
      const adminId = req.user.id;
      if (!banReason || banReason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
      }
      if (typeof userId !== "number" || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
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
  app2.post("/api/admin/users/:id/reset-password", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = req.user.id;
      if (typeof userId !== "number" || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
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
  app2.patch("/api/admin/users/:id/narrator", requireAdminJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { canNarrate, reason } = req.body;
      const adminId = req.user.id;
      if (typeof userId !== "number" || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
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
  app2.get("/api/admin/chat-categories", requireAdminJWT, async (req, res) => {
    try {
      const categories = await storage.getAllChatCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching chat categories:", error);
      res.status(500).json({ message: "Failed to fetch chat categories" });
    }
  });
  app2.post("/api/admin/chat-categories", requireAdminJWT, async (req, res) => {
    try {
      const categoryData = insertChatCategorySchema.parse(req.body);
      const category = await storage.createChatCategory(categoryData);
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "chat_category_create",
        details: `Vytvo\u0159ena kategorie "${category.name}"`
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating chat category:", error);
      res.status(500).json({ message: "Failed to create chat category" });
    }
  });
  app2.put("/api/admin/chat-categories/:id", requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatCategorySchema.partial().parse(req.body);
      const category = await storage.updateChatCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: "Chat category not found" });
      }
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "chat_category_update",
        details: `Upravena kategorie "${category.name}"`
      });
      res.json(category);
    } catch (error) {
      console.error("Error updating chat category:", error);
      res.status(500).json({ message: "Failed to update chat category" });
    }
  });
  app2.delete("/api/admin/chat-categories/:id", requireAdminJWT, async (req, res) => {
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
        adminId: req.user.id,
        action: "chat_category_delete",
        details: `Smaz\xE1na kategorie "${category.name}"`
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat category:", error);
      res.status(500).json({ message: "Failed to delete chat category" });
    }
  });
  app2.post("/api/admin/chat-rooms", requireAdminJWT, async (req, res) => {
    try {
      const roomData = insertChatRoomSchema.parse(req.body);
      if (roomData.password) {
        roomData.password = await storage.hashPassword(roomData.password);
      }
      const room = await storage.createChatRoom(roomData);
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "chat_room_create",
        details: `Vytvo\u0159ena m\xEDstnost "${room.name}"`
      });
      res.json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });
  app2.put("/api/admin/chat-rooms/:id", requireAdminJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertChatRoomSchema.partial().parse(req.body);
      const room = await storage.updateChatRoom(id, updates);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      await storage.logAdminActivity({
        adminId: req.user.id,
        action: "chat_room_update",
        details: `Upravena m\xEDstnost "${room.name}"`
      });
      res.json(room);
    } catch (error) {
      console.error("Error updating chat room:", error);
      res.status(500).json({ message: "Failed to update chat room" });
    }
  });
  app2.delete("/api/admin/chat-rooms/:id", requireAdminJWT, async (req, res) => {
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
        adminId: req.user.id,
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
      console.log("[DEBUG] /api/owl-post/inbox", { session: req.session, userId: req.session.userId });
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      console.log("[DEBUG] /api/owl-post/inbox - userCharacters:", userCharacters);
      const firstAliveCharacter = userCharacters.find((char) => !char.deathDate);
      console.log("[DEBUG] /api/owl-post/inbox - firstAliveCharacter:", firstAliveCharacter);
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;
      const messages2 = await storage.getOwlPostInbox(firstAliveCharacter.id, limit, offset);
      console.log("[DEBUG] /api/owl-post/inbox - messages:", messages2);
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
      console.log("[DEBUG] /api/owl-post/unread-count", { session: req.session, userId: req.session.userId });
      const userCharacters = await storage.getCharactersByUserId(req.session.userId);
      console.log("[DEBUG] /api/owl-post/unread-count - userCharacters:", userCharacters);
      const firstAliveCharacter = userCharacters.find((char) => !char.deathDate);
      console.log("[DEBUG] /api/owl-post/unread-count - firstAliveCharacter:", firstAliveCharacter);
      if (!firstAliveCharacter) {
        return res.status(404).json({ message: "No alive character found" });
      }
      const count = await storage.getUnreadOwlPostCount(firstAliveCharacter.id);
      console.log("[DEBUG] /api/owl-post/unread-count - count:", count);
      res.json({ count });
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
      const count = await storage.getUnreadOwlPostCount(characterId);
      res.json({ count });
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
  app2.get("/api/owl-post/unread-total", requireAuthFlexible, async (req, res) => {
    console.log("HIT /api/owl-post/unread-total", { user: req.user, session: req.session });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userCharacters = await storage.getCharactersByUserId(req.session && req.session.userId || req.user && req.user.id);
      const aliveCharacters = userCharacters.filter((char) => !char.deathDate);
      let totalUnread = 0;
      for (const character of aliveCharacters) {
        const count = await storage.getUnreadOwlPostCount(character.id);
        totalUnread += count;
      }
      res.json({ count: totalUnread });
    } catch (error) {
      console.error("Error fetching total unread count:", error);
      res.status(500).json({ message: "Failed to fetch total unread count" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/approve", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { assignedAddress, reviewNote } = req.body;
      if (!assignedAddress) {
        return res.status(400).json({ message: "Assigned address is required" });
      }
      const approvedRequest = await storage.approveHousingRequest(
        requestId,
        req.user.id,
        assignedAddress,
        reviewNote
      );
      res.json(approvedRequest);
    } catch (error) {
      console.error("Error approving housing request:", error);
      res.status(500).json({ message: "Failed to approve housing request" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/reject", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for rejection" });
      }
      const rejectedRequest = await storage.rejectHousingRequest(
        requestId,
        req.user.id,
        reviewNote
      );
      res.json(rejectedRequest);
    } catch (error) {
      console.error("Error rejecting housing request:", error);
      res.status(500).json({ message: "Failed to reject housing request" });
    }
  });
  app2.post("/api/admin/housing-requests/:requestId/return", requireAuth, requireAdminJWT, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reviewNote } = req.body;
      if (!reviewNote) {
        return res.status(400).json({ message: "Review note is required for returning request" });
      }
      const request = await storage.rejectHousingRequest(
        requestId,
        req.user.id,
        reviewNote
      );
      res.json(request);
    } catch (error) {
      console.error("Error returning housing request:", error);
      res.status(500).json({ message: "Failed to return housing request" });
    }
  });
  app2.put("/api/admin/chat-categories/:id/sort-order", requireAdminJWT, async (req, res) => {
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
  app2.put("/api/admin/chat-rooms/:id/sort-order", requireAdminJWT, async (req, res) => {
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
  app2.get("/api/test-db", async (req, res) => {
    try {
      const { data, error, status, statusText } = await supabase.from("users").select("*");
      res.json({
        ok: !error,
        error,
        status,
        statusText,
        usersCount: data ? data.length : 0,
        data,
        env: {
          SUPABASE_URL: process.env.SUPABASE_URL || "hardcoded",
          SUPABASE_KEY: process.env.SUPABASE_KEY ? "set" : "not set",
          NODE_ENV: process.env.NODE_ENV || "undefined"
        }
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
  app2.get("/api/debug", (req, res) => {
    res.json({ ok: true, user: req.user || null, session: req.session || null });
  });
  app2.get("/api/debug/session", (req, res) => {
    res.json({
      session: req.session,
      cookies: req.cookies,
      headers: req.headers,
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      method: req.method,
      url: req.url,
      ip: req.ip
    });
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
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
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ["*"]
  };
  const vite = await createViteServer({
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/routes/supabase.js
import express2 from "express";
var router = express2.Router();
router.get("/users", async (req, res) => {
  const { data, error } = await supabase2.from("users").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
var supabase_default = router;

// server/index.ts
import cookieParser from "cookie-parser";
import session2 from "express-session";
import connectPgSimple2 from "connect-pg-simple";
var app = express3();
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://umbramagica-1.onrender.com",
    // frontend
    "https://umbramagica.onrender.com"
    // backend
  ];
  const nodeEnv = process.env.NODE_ENV || "production";
  console.log("CORS check:", { origin, nodeEnv });
  if (nodeEnv === "production" || !process.env.NODE_ENV) {
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
  } else {
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
var pgSession2 = connectPgSimple2(session2);
var sessionTtl = 7 * 24 * 60 * 60 * 1e3;
var sessionSecret = process.env.SESSION_SECRET || "umbra-magica-session-secret-key-fixed-2024";
app.use(session2({
  store: new pgSession2({ conString: process.env.DATABASE_URL }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: "connect.sid",
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".onrender.com",
    maxAge: sessionTtl
  }
}));
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use("/api/*", (req, res, next) => {
  console.log("API DEBUG - cookies:", req.cookies, "session:", req.session, "url:", req.url);
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
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
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funguje!" });
});
app.use("/api", supabase_default);
app.get("/api/debug/routes", (req, res) => {
  res.json({
    routes: app._router.stack.filter((r) => r.route).map((r) => r.route.path)
  });
});
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "Not Found", url: req.originalUrl });
});
(async () => {
  await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, void 0);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5e3;
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
