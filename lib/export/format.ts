import { z } from "zod";
import { STRESS_TRIGGERS, SYMPTOM_TYPES } from "@/lib/db/types";

/** Version of the export file format (independent of the IndexedDB schema version). */
export const EXPORT_FORMAT = 1;
export const EXPORT_APP_ID = "pds-tracker";

const base = {
  id: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),
};
const optionalText = z.string().max(5000).optional();

export const mealSchema = z.object({
  ...base,
  timestamp: z.number(),
  description: z.string().max(500),
  tags: z.array(z.string()).default([]),
  size: z.enum(["small", "normal", "large"]).default("normal"),
  note: optionalText,
});

export const symptomSchema = z.object({
  ...base,
  timestamp: z.number(),
  types: z.array(z.enum(SYMPTOM_TYPES)).default([]),
  severity: z.number().min(0).max(10),
  bristol: z.number().int().min(1).max(7).nullable().optional(),
  note: optionalText,
});

export const stressSchema = z.object({
  ...base,
  timestamp: z.number(),
  level: z.number().int().min(1).max(5),
  trigger: z.enum(STRESS_TRIGGERS).default("other"),
  anticipatory: z.boolean().default(false),
  note: optionalText,
});

const nullableNumber = z.number().nullable().optional();
const time = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .nullable()
  .optional();

export const dayLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: time,
  wakeTime: time,
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  wearable: z
    .object({ stressScore: nullableNumber, hrv: nullableNumber, readiness: nullableNumber })
    .optional(),
  movement: nullableNumber,
  water: nullableNumber,
  note: optionalText,
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),
});

export const tagSchema = z.object({
  ...base,
  label: z.string().max(80),
  kind: z.literal("food").default("food"),
  builtin: z.boolean().default(false),
  archived: z.boolean().default(false),
  favorite: z.boolean().default(false),
});

export const exportSchema = z.object({
  app: z.literal(EXPORT_APP_ID),
  format: z.literal(EXPORT_FORMAT),
  exportedAt: z.number(),
  schemaVersion: z.number(),
  data: z.object({
    meals: z.array(mealSchema).default([]),
    symptoms: z.array(symptomSchema).default([]),
    stress: z.array(stressSchema).default([]),
    days: z.array(dayLogSchema).default([]),
    tags: z.array(tagSchema).default([]),
  }),
});

export type ExportFile = z.infer<typeof exportSchema>;
