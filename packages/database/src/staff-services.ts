import { bigint, check, foreignKey, pgSchema, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// StaffServiceSet is the aggregate root for U04 Staff <-> Service capability
// assignment. It belongs to a StaffMember (tenant-safe composite FK) and owns
// 0..N StaffServiceAssignment rows pointing at catalog.Services.
// It never references ProfessionalProfile, RoleAssignment, BARBER role or Person.
export const staffServiceTeamSchema = pgSchema("team");
// Minimal projection of team.staff_members so the tenant-safe composite FK can be
// declared without importing schema.ts (which re-exports this file).
const staffServiceStaffMembers = staffServiceTeamSchema.table("staff_members", {
  id: uuid("id").notNull(),
  businessId: uuid("business_id").notNull()
}, (table) => [unique("staff_members_business_id_id_key").on(table.businessId, table.id)]);

// Minimal projection of catalog.services so the tenant-safe composite FK can be
// declared without importing schema.ts.
const staffServiceCatalogServices = staffServiceTeamSchema.table("services", {
  id: uuid("id").notNull(),
  businessId: uuid("business_id").notNull()
}, (table) => [unique("catalog_service_business_id_key").on(table.businessId, table.id)]);

export const staffServiceSets = staffServiceTeamSchema.table("staff_service_sets", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  staffMemberId: uuid("staff_member_id").notNull(),
  revision: bigint("revision", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("staff_service_sets_business_staff_key").on(table.businessId, table.staffMemberId),
  unique("staff_service_sets_business_id_key").on(table.businessId, table.id),
  foreignKey({ columns: [table.businessId, table.staffMemberId], foreignColumns: [staffServiceStaffMembers.businessId, staffServiceStaffMembers.id], name: "staff_service_sets_staff_fk" }).onDelete("restrict"),
  check("staff_service_sets_revision_check", sql`${table.revision} >= 1`)
]);

export const staffServiceAssignments = staffServiceTeamSchema.table("staff_service_assignments", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  staffServiceSetId: uuid("staff_service_set_id").notNull(),
  serviceId: uuid("service_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("staff_service_assignments_business_set_service_key").on(table.businessId, table.staffServiceSetId, table.serviceId),
  foreignKey({ columns: [table.businessId, table.staffServiceSetId], foreignColumns: [staffServiceSets.businessId, staffServiceSets.id], name: "staff_service_assignments_set_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.businessId, table.serviceId], foreignColumns: [staffServiceCatalogServices.businessId, staffServiceCatalogServices.id], name: "staff_service_assignments_service_fk" }).onDelete("restrict")
]);
