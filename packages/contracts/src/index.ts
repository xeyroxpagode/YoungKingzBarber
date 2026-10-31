import { z } from "zod";
export * from "@youngkingz/contracts/catalog";
export * from "@youngkingz/contracts/professionals";

export const roles = ["OWNER", "RECEPTIONIST", "BARBER"] as const;
export const roleSchema = z.enum(roles);
export type RoleCode = z.infer<typeof roleSchema>;

export const capabilities = [
  "iam.self.read", "iam.self.update", "iam.sessions.read", "iam.sessions.terminate",
  "iam.contexts.list", "iam.contexts.switch", "iam.staff.list", "iam.staff.read",
  "iam.staff.create", "iam.staff.update", "iam.invitations.issue",
  "iam.invitations.reissue", "iam.invitations.revoke", "iam.roles.read",
  "iam.roles.assign", "iam.roles.revoke", "iam.grants.read", "iam.grants.issue",
  "iam.grants.revoke", "iam.access.read", "iam.access.suspend",
  "iam.access.reactivate", "iam.access.revoke", "iam.access.offboard",
  "iam.access.reonboard", "iam.credentials.change", "iam.security.recover",
  "iam.audit.read", "iam.operations.read",
  "catalog.read", "catalog.services.create", "catalog.services.update_profile",
  "catalog.services.update_terms", "catalog.services.publish", "catalog.services.lifecycle",
  "catalog.categories.manage",
  "professionals.read", "professionals.create", "professionals.update",
  "professionals.lifecycle", "professionals.self.read", "professionals.self.update"
] as const;
export const capabilitySchema = z.enum(capabilities);
export type Capability = z.infer<typeof capabilitySchema>;

export const delegableCapabilities: readonly Capability[] = [
  "iam.staff.list", "iam.staff.read", "iam.staff.create", "iam.staff.update",
  "iam.invitations.issue", "iam.invitations.reissue", "iam.invitations.revoke",
  "catalog.services.create", "catalog.services.update_profile", "catalog.services.update_terms",
  "catalog.services.publish", "catalog.services.lifecycle", "catalog.categories.manage",
  "professionals.create", "professionals.update", "professionals.lifecycle"
];

export const createStaffSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  inviteNow: z.boolean().default(false),
  roles: z.array(roleSchema).max(3).default([])
}).superRefine((value, context) => {
  if (value.inviteNow && !value.email) context.addIssue({ code: "custom", path: ["email"], message: "Email is required to send an invitation" });
});

export const updateStaffSchema = z.object({ firstName: z.string().trim().min(1).max(100).optional(), lastName: z.string().trim().max(100).nullable().optional(), phone: z.string().trim().max(40).nullable().optional(), revision: z.number().int().positive() });
export const updateRolesSchema = z.object({ roles: z.array(roleSchema).max(3), revision: z.number().int().positive(), sensitiveConfirmation: z.string().optional() });
export const issueInvitationSchema = z.object({ email: z.string().email() });
export const acceptInvitationSchema = z.object({ token: z.string().min(32) });
export const grantSchema = z.object({ capability: capabilitySchema, expiresAt: z.string().datetime().optional(), roleAssignmentId: z.string().uuid() });
export const contextSwitchSchema = z.object({ roleAssignmentId: z.string().uuid(), revision: z.number().int().nonnegative() });
export const lifecycleSchema = z.object({ revision: z.number().int().positive(), reason: z.string().trim().min(3).max(500) });
export const terminateSessionsSchema = z.object({ scope: z.enum(["CURRENT", "OTHERS", "ALL"]), sessionId: z.string().uuid().optional() });

export type DomainErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "STALE_REVISION" | "LAST_OWNER_PROTECTED" | "SESSION_REVOKED" | "ACCESS_RESTRICTED" | "INVITATION_INVALID" | "INVITATION_EXPIRED" | "IDEMPOTENCY_CONFLICT" | "EXTERNAL_OUTCOME_UNKNOWN" | "SERVICE_NOT_PUBLISHABLE" | "SERVICE_ARCHIVED" | "CATEGORY_UNAVAILABLE" | "CATEGORY_IN_USE" | "CATEGORY_ARCHIVED" | "PROFESSIONAL_PROFILE_EXISTS" | "PROFESSIONAL_STAFF_NOT_ACTIVE";
export class DomainError extends Error { constructor(public readonly code: DomainErrorCode, message: string, public readonly statusCode = 400, public readonly details?: unknown) { super(message); } }

export const roleCapabilities: Readonly<Record<RoleCode, readonly Capability[]>> = {
  OWNER: capabilities.filter((capability) => capability !== "iam.security.recover"),
  RECEPTIONIST: ["iam.self.read", "iam.self.update", "iam.sessions.read", "iam.sessions.terminate", "iam.contexts.list", "iam.contexts.switch", "catalog.read", "professionals.read", "professionals.self.read", "professionals.self.update"],
  BARBER: ["iam.self.read", "iam.self.update", "iam.sessions.read", "iam.sessions.terminate", "iam.contexts.list", "iam.contexts.switch", "professionals.self.read", "professionals.self.update"]
};
