// server/utils/auth.ts

import { Request } from "express";

export function getUserFromRequest(req: Request): { id: number } | null {
  // Zde očekáváme, že budeš mít uživatele uloženého v req.user nebo v hlavičce
  // Např. z JWT tokenu, cookie, nebo custom hlavičky

  // 🔐 PRO DEMO: vezmeme userId z hlavičky X-User-Id
  const userId = req.header("X-User-Id");

  if (!userId) {
    return null;
  }

  return { id: parseInt(userId) };
}
