import { bigint, check, foreignKey, pgSchema, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const professionalTeamSchema = pgSchema("team");
export const professionalStatus = professionalTeamSchema.enum("professional_status", ["ACTIVE", "INACTIVE"]);
const professionalStaffMembers = professionalTeamSchema.table("staff_members", {
  id: uuid("id").notNull(),
  businessId: uuid("business_id").notNull()
}, (table) => [unique("staff_members_business_id_id_key").on(table.businessId, table.id)]);

export const professionalProfiles = professionalTeamSchema.table("professional_profiles", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  staffMemberId: uuid("staff_member_id").notNull(),
  status: professionalStatus("status").notNull(),
  professionalDisplayName: text("professional_display_name"),
  bio: text("bio"),
  publicTitle: text("public_title"),
  revision: bigint("revision", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("professional_profiles_staff_member_key").on(table.staffMemberId),
  unique("professional_profiles_business_id_key").on(table.businessId, table.id),
  foreignKey({ columns: [table.businessId, table.staffMemberId], foreignColumns: [professionalStaffMembers.businessId, professionalStaffMembers.id], name: "professional_profiles_staff_fk" }).onDelete("restrict"),
  check("professional_profiles_revision_check", sql`${table.revision} >= 1`)
]);
