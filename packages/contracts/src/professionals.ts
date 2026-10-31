import { z } from "zod";

export const professionalStatuses = ["ACTIVE", "INACTIVE"] as const;
export const professionalStatusSchema = z.enum(professionalStatuses);

const nullableTrimmed = (maximum: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(maximum).nullable()
);
const optionalNullableTrimmed = (maximum: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(maximum).nullable().optional()
);
const expectedRevisionSchema = z.number().int().positive();

export const createProfessionalProfileSchema = z.object({
  staffMemberId: z.string().uuid(),
  professionalDisplayName: nullableTrimmed(80).optional(),
  bio: nullableTrimmed(500).optional(),
  publicTitle: nullableTrimmed(80).optional()
}).strict();

export const updateProfessionalProfileSchema = z.object({
  expectedRevision: expectedRevisionSchema,
  professionalDisplayName: optionalNullableTrimmed(80),
  bio: optionalNullableTrimmed(500),
  publicTitle: optionalNullableTrimmed(80)
}).strict().refine((value) => value.professionalDisplayName !== undefined || value.bio !== undefined || value.publicTitle !== undefined, {
  message: "At least one professional presentation field is required"
});

export const updateMyProfessionalProfileSchema = z.object({
  expectedRevision: expectedRevisionSchema,
  professionalDisplayName: optionalNullableTrimmed(80),
  bio: optionalNullableTrimmed(500)
}).strict().refine((value) => value.professionalDisplayName !== undefined || value.bio !== undefined, {
  message: "At least one self-editable field is required"
});

export const professionalLifecycleSchema = z.object({ expectedRevision: expectedRevisionSchema }).strict();
export const professionalQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: professionalStatusSchema.optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
}).strict();

export type ProfessionalStatus = z.infer<typeof professionalStatusSchema>;
export type ProfessionalProfile = {
  professionalProfileId: string;
  staffMemberId: string;
  status: ProfessionalStatus;
  revision: number;
  professionalDisplayName: string | null;
  effectiveDisplayName: string;
  bio: string | null;
  publicTitle: string | null;
  staffEmploymentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE";
  professionallyEnabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};
