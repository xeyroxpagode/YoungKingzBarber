import { z } from "zod";

export const serviceLifecycles = ["ACTIVE", "ARCHIVED"] as const;
export const serviceLifecycleSchema = z.enum(serviceLifecycles);
export const servicePublications = ["UNPUBLISHED", "PUBLISHED"] as const;
export const servicePublicationSchema = z.enum(servicePublications);

export const moneySchema = z.object({
  amountMinor: z.number().int().min(0),
  currency: z.literal("ARS")
});

export const commercialTermsSchema = z.object({
  money: moneySchema,
  durationMinutes: z.number().int().positive(),
  preBufferMinutes: z.number().int().min(0).default(0),
  postBufferMinutes: z.number().int().min(0).default(0),
  conditions: z.string().trim().max(2_000).nullable().optional()
});

const serviceNameSchema = z.string().trim().min(1).max(120);
const categoryNameSchema = z.string().trim().min(1).max(80);
const expectedRevisionSchema = z.number().int().positive();

export const createServiceSchema = z.object({
  name: serviceNameSchema,
  description: z.string().trim().max(2_000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  initialCommercialTerms: commercialTermsSchema.optional()
});

export const updateServiceProfileSchema = z.object({
  expectedRevision: expectedRevisionSchema,
  name: serviceNameSchema.optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional()
}).refine((value) => value.name !== undefined || value.description !== undefined || value.categoryId !== undefined, {
  message: "At least one profile field is required"
});

export const replaceCommercialTermsSchema = z.object({
  expectedRevision: expectedRevisionSchema,
  terms: commercialTermsSchema
});

export const createCategorySchema = z.object({ name: categoryNameSchema });
export const renameCategorySchema = z.object({ name: categoryNameSchema, expectedRevision: expectedRevisionSchema });
export const catalogLifecycleSchema = z.object({ expectedRevision: expectedRevisionSchema });

export const serviceQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  lifecycle: serviceLifecycleSchema.optional(),
  publication: servicePublicationSchema.optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const categoryQuerySchema = z.object({
  lifecycle: serviceLifecycleSchema.optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const publishRequirementCodes = [
  "CATEGORY_REQUIRED",
  "ACTIVE_CATEGORY_REQUIRED",
  "CURRENT_TERMS_REQUIRED"
] as const;
export const publishRequirementCodeSchema = z.enum(publishRequirementCodes);

export type ServiceLifecycle = z.infer<typeof serviceLifecycleSchema>;
export type ServicePublication = z.infer<typeof servicePublicationSchema>;
export type CommercialTerms = z.infer<typeof commercialTermsSchema>;
export type PublishRequirementCode = z.infer<typeof publishRequirementCodeSchema>;
