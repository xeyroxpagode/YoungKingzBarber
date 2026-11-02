import { bigint, check, foreignKey, integer, pgSchema, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Schedule belongs to StaffMember (U03 §5), a 0..1 aggregate (U03 §15). It never
// references ProfessionalProfile, RoleAssignment, BARBER role or Person.
export const scheduleTeamSchema = pgSchema("team");
// Minimal projection of team.staff_members so the tenant-safe composite FK can be
// declared without importing schema.ts (which re-exports this file).
const scheduleStaffMembers = scheduleTeamSchema.table("staff_members", {
  id: uuid("id").notNull(),
  businessId: uuid("business_id").notNull()
}, (table) => [unique("staff_members_business_id_id_key").on(table.businessId, table.id)]);

export const staffWeeklySchedules = scheduleTeamSchema.table("staff_weekly_schedules", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  staffMemberId: uuid("staff_member_id").notNull(),
  revision: bigint("revision", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("staff_weekly_schedules_staff_member_key").on(table.staffMemberId),
  unique("staff_weekly_schedules_business_id_key").on(table.businessId, table.id),
  foreignKey({ columns: [table.businessId, table.staffMemberId], foreignColumns: [scheduleStaffMembers.businessId, scheduleStaffMembers.id], name: "staff_weekly_schedules_staff_fk" }).onDelete("restrict"),
  check("staff_weekly_schedules_revision_check", sql`${table.revision} >= 1`)
]);

export const staffScheduleIntervals = scheduleTeamSchema.table("staff_schedule_intervals", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  weeklyScheduleId: uuid("weekly_schedule_id").notNull(),
  weekday: integer("weekday").notNull(),
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull()
}, (table) => [
  unique("staff_schedule_intervals_business_id_key").on(table.businessId, table.id),
  foreignKey({ columns: [table.businessId, table.weeklyScheduleId], foreignColumns: [staffWeeklySchedules.businessId, staffWeeklySchedules.id], name: "staff_schedule_intervals_schedule_fk" }).onDelete("cascade"),
  check("staff_schedule_intervals_weekday_check", sql`${table.weekday} between 1 and 7`),
  check("staff_schedule_intervals_start_check", sql`${table.startMinute} >= 0 and ${table.startMinute} <= 1439`),
  check("staff_schedule_intervals_end_check", sql`${table.endMinute} >= 1 and ${table.endMinute} <= 1440`),
  check("staff_schedule_intervals_order_check", sql`${table.startMinute} < ${table.endMinute}`),
  uniqueIndex("staff_schedule_intervals_lookup_idx").on(table.businessId, table.weeklyScheduleId, table.weekday)
]);
