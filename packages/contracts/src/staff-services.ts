import { z } from "zod";

const uuid = z.string().uuid();
const nonNegativeRevision = z.number().int().nonnegative();
const positiveRevision = z.number().int().positive();

// Canonical in-memory representation of a Staff <-> Service assignment set.
// Order has no semantics; input is validated, deduplicated and sorted before
// comparison (U04 §30).
export type StaffServiceSet = {
  staffMemberId: string;
  businessId: string;
  revision: number;
  serviceIds: string[];
};

export type StaffServiceOption = {
  id: string;
  name: string;
  lifecycle: "ACTIVE" | "ARCHIVED";
  publication: "UNPUBLISHED" | "PUBLISHED";
  assigned: boolean;
  assignable: boolean;
};

export type StaffServiceSummary = {
  id: string;
  name: string;
  lifecycle: "ACTIVE" | "ARCHIVED";
  publication: "UNPUBLISHED" | "PUBLISHED";
  assigned: boolean;
};

export type ReplaceStaffServicesInput = {
  staffMemberId: string;
  expectedRevision: number;
  serviceIds: string[];
};

export type ReplaceStaffServicesResult = {
  staffMemberId: string;
  revision: number;
  changed: boolean;
  serviceIds: string[];
};

export const replaceStaffServicesSchema = z.object({
  expectedRevision: nonNegativeRevision,
  serviceIds: z.array(uuid).min(0).max(200)
}).refine((value) => {
  const seen = new Set<string>();
  for (const id of value.serviceIds) {
    if (seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}, { message: "Duplicate service ids are not allowed", path: ["serviceIds"] });

export const staffServiceSetSchema = z.object({
  staffMemberId: uuid,
  businessId: uuid,
  revision: positiveRevision,
  serviceIds: z.array(uuid)
});

export const staffServiceOptionSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(120),
  lifecycle: z.enum(["ACTIVE", "ARCHIVED"]),
  publication: z.enum(["UNPUBLISHED", "PUBLISHED"]),
  assigned: z.boolean(),
  assignable: z.boolean()
});

export const staffServiceSummarySchema = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(120),
  lifecycle: z.enum(["ACTIVE", "ARCHIVED"]),
  publication: z.enum(["UNPUBLISHED", "PUBLISHED"]),
  assigned: z.boolean()
});
