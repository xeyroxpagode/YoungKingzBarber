import { z } from "zod";

const uuid = z.string().uuid();
const positiveRevision = z.number().int().positive();

export type ClientProfile = {
  id: string;
  businessId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  lifecycleState: "active" | "archived";
  revision: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientContact = {
  id: string;
  businessId: string;
  clientProfileId: string;
  type: "telefono" | "email" | "whatsapp";
  value: string;
  normalizedValue: string;
  label?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientNote = {
  id: string;
  businessId: string;
  clientProfileId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  replacesNoteId?: string;
};

export type ClientAccountLink = {
  id: string;
  businessId: string;
  clientProfileId: string;
  accountId: string;
  authMethod: "staff-verified" | "document" | "pending-u02";
  evidenceReference: string;
  authorityId: string;
  authorityName: string;
  linkedAt: string;
  revokedAt?: string;
  auditReference: string;
};

export type ClientProfileSummary = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  lifecycleState: "active" | "archived";
  revision: number;
  primaryContact?: { type: string; value: string };
  createdAt: string;
  updatedAt: string;
};

export type CreateClientProfileInput = {
  name: string;
  firstName?: string;
  lastName?: string;
  contacts?: Array<{ type: "telefono" | "email" | "whatsapp"; value: string; label?: string; isPrimary?: boolean }>;
};

export type UpdateClientProfileInput = {
  expectedRevision: number;
  name?: string;
  firstName?: string;
  lastName?: string;
};

export type AddClientContactInput = {
  type: "telefono" | "email" | "whatsapp";
  value: string;
  label?: string;
  isPrimary?: boolean;
};

export type UpdateClientContactInput = {
  type?: "telefono" | "email" | "whatsapp";
  value?: string;
  label?: string;
  isPrimary?: boolean;
};

export type CreateClientNoteInput = {
  text: string;
  replacesNoteId?: string;
};

export type ClientSearchQuery = {
  q?: string;
  cursor?: string;
  limit?: number;
};

export type ClientSearchResult = {
  items: ClientProfileSummary[];
  nextCursor: string | null;
  total: number;
};

export const clientProfileSchema = z.object({
  id: uuid,
  businessId: uuid,
  name: z.string().trim().min(1).max(200),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable(),
  lifecycleState: z.enum(["active", "archived"]),
  revision: positiveRevision,
  idempotencyKey: uuid.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const createClientProfileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  contacts: z.array(z.object({
    type: z.enum(["telefono", "email", "whatsapp"]),
    value: z.string().trim().min(1).max(200),
    label: z.string().trim().max(50).optional(),
    isPrimary: z.boolean().optional()
  })).max(20).optional()
});

export const updateClientProfileSchema = z.object({
  expectedRevision: positiveRevision,
  name: z.string().trim().min(1).max(200).optional(),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable()
});

export const addClientContactSchema = z.object({
  type: z.enum(["telefono", "email", "whatsapp"]),
  value: z.string().trim().min(1).max(200),
  label: z.string().trim().max(50).optional(),
  isPrimary: z.boolean().optional()
});

export const updateClientContactSchema = z.object({
  type: z.enum(["telefono", "email", "whatsapp"]).optional(),
  value: z.string().trim().min(1).max(200).optional(),
  label: z.string().trim().max(50).optional().nullable(),
  isPrimary: z.boolean().optional()
});

export const createClientNoteSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  replacesNoteId: uuid.optional()
});

export const clientSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const clientProfileSummarySchema = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(200),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable(),
  lifecycleState: z.enum(["active", "archived"]),
  revision: positiveRevision,
  primaryContact: z.object({ type: z.string(), value: z.string() }).optional().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const clientContactSchema = z.object({
  id: uuid,
  businessId: uuid,
  clientProfileId: uuid,
  type: z.enum(["telefono", "email", "whatsapp"]),
  value: z.string().trim().min(1).max(200),
  normalizedValue: z.string().trim().min(1).max(200),
  label: z.string().trim().max(50).optional().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const clientNoteSchema = z.object({
  id: uuid,
  businessId: uuid,
  clientProfileId: uuid,
  text: z.string().trim().min(1).max(4000),
  authorId: uuid,
  authorName: z.string().trim().min(1).max(200),
  createdAt: z.string().min(1),
  replacesNoteId: uuid.optional()
});

export const clientAccountLinkSchema = z.object({
  id: uuid,
  businessId: uuid,
  clientProfileId: uuid,
  accountId: uuid,
  authMethod: z.enum(["staff-verified", "document", "pending-u02"]),
  evidenceReference: z.string().trim().min(1).max(200),
  authorityId: uuid,
  authorityName: z.string().trim().min(1).max(200),
  linkedAt: z.string().min(1),
  revokedAt: z.string().min(1).optional().nullable(),
  auditReference: z.string().trim().min(1).max(200)
});
