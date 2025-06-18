import { Request } from "express";

/**
 * Pomocná funkce pro získání uživatele z požadavku.
 * Tady bys měl dekódovat session/token a vrátit objekt s ID uživatele.
 */
export function getUserFromRequest(req: Request): { id: number } | null {
  // Zde nahraď podle toho, odkud bereš info o přihlášeném uživateli
  // Například z hlavičky, cookies, nebo session middleware

  const userId = req.headers["x-user-id"];

  if (!userId || Array.isArray(userId)) {
    return null;
  }

  const id = parseInt(userId, 10);

  if (isNaN(id)) {
    return null;
  }

  return { id };
}
