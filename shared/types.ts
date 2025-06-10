import { z } from "zod";

// --- Zod schémata používaná ve frontendu ---

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

export const insertHousingRequestSchema = z.object({
  characterId: z.number(),
  requestType: z.string(),
  size: z.string().optional(),
  location: z.string(),
  customLocation: z.string().optional(),
  selectedArea: z.string().optional(),
  description: z.string(),
  housingName: z.string().optional(),
  housingPassword: z.string().optional(),
});

export const characterEditSchema = z.object({
  school: z.string().optional(),
  description: z.string().optional(),
  height: z.number().min(120, "Výška musí být alespoň 120 cm").max(250, "Výška nesmí překročit 250 cm").optional(),
  weight: z.number().min(30, "Váha musí být alespoň 30 kg").max(300, "Váha nesmí překročit 300 kg").optional(),
});

export const characterAdminEditSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  school: z.string().optional(),
  description: z.string().optional(),
  height: z.number().min(120, "Výška musí být alespoň 120 cm").max(250, "Výška nesmí překročit 250 cm").optional(),
  weight: z.number().min(30, "Váha musí být alespoň 30 kg").max(300, "Váha nesmí překročit 300 kg").optional(),
});

// --- Typy používané ve frontendu (ručně zkopírované, bez drizzle-orm) ---

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  isBanned: boolean;
  isSystem: boolean;
  banReason?: string;
  bannedAt?: string;
  characterOrder?: string;
  highlightWords?: string;
  highlightColor?: string;
  canNarrate: boolean;
  narratorColor?: string;
  createdAt: string;
  updatedAt: string;
};

export type Spell = {
  id: number;
  name: string;
  effect: string;
  category: string;
  type: string;
  targetType: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Wand = {
  id: number;
  characterId: number;
  wood: string;
  core: string;
  length: string;
  flexibility: string;
  description?: string;
  acquiredAt: string;
};
