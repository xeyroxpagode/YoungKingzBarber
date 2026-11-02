import { DomainError, weekdayNumber, type ScheduleInterval, type ScheduleTeamSummaryItem, type StaffWeeklySchedule } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { one, rows, sql } from "../../lib/sql.js";
import { emptyWeek, formatTimeOfDay, getCurrentBusinessWeekday } from "./domain.js";
import { intervalsToCanonicalWeek, toStaffScheduleResponse, type IntervalRow } from "./mapper.js";

type StaffRow = { staffMemberId: string; displayName: string; employmentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE" };

async function readStaff(actor: Actor, staffMemberId: string): Promise<StaffRow> {
  const staff = await one<StaffRow>(sql`select sm.id "staffMemberId",
      concat_ws(' ', p.first_name, p.last_name) "displayName",
      sm.employment_status::text "employmentStatus"
    from team.staff_members sm join iam.persons p on p.id = sm.person_id
    where sm.business_id = ${actor.businessId} and sm.id = ${staffMemberId}`);
  if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found", 404);
  return staff;
}

// GET /v1/schedules/team — operational summary for Receptionist/Owner (U03 §39).
// Deliberately surfaces only operational data: no email/phone/account/session/grant.
export async function getSchedulesTeam(actor: Actor) {
  const business = await one<{ timezone: string }>(sql`select timezone from business.businesses where id = ${actor.businessId}`);
  const today = getCurrentBusinessWeekday(business?.timezone ?? "UTC");
  const todayNumber = weekdayNumber[today];
  const members = await rows<{ staffMemberId: string; displayName: string; employmentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE"; roles: string[]; hasSchedule: boolean }>(sql`
    select sm.id "staffMemberId",
      concat_ws(' ', p.first_name, p.last_name) "displayName",
      sm.employment_status::text "employmentStatus",
      coalesce(array_agg(distinct ra.role::text) filter (where ra.revoked_at is null and ra.effective_at is not null), '{}') roles,
      (sws.id is not null) "hasSchedule"
    from team.staff_members sm
    join iam.persons p on p.id = sm.person_id
    left join iam.role_assignments ra on ra.business_id = sm.business_id and ra.staff_member_id = sm.id
    left join team.staff_weekly_schedules sws on sws.business_id = sm.business_id and sws.staff_member_id = sm.id
    where sm.business_id = ${actor.businessId} and sm.employment_status <> 'INACTIVE'
    group by sm.id, p.first_name, p.last_name, sws.id
    order by p.first_name, p.last_name, sm.id`);
  const intervalRows = await rows<{ staffMemberId: string; startMinute: number | string; endMinute: number | string }>(sql`
    select sws.staff_member_id "staffMemberId", ssi.start_minute "startMinute", ssi.end_minute "endMinute"
    from team.staff_schedule_intervals ssi
    join team.staff_weekly_schedules sws on sws.business_id = ssi.business_id and sws.id = ssi.weekly_schedule_id
    join team.staff_members sm on sm.business_id = sws.business_id and sm.id = sws.staff_member_id
    where sws.business_id = ${actor.businessId} and ssi.weekday = ${todayNumber} and sm.employment_status <> 'INACTIVE'
    order by ssi.start_minute`);
  const todayByStaff = new Map<string, ScheduleInterval[]>();
  for (const row of intervalRows) {
    const list = todayByStaff.get(row.staffMemberId) ?? [];
    list.push({ start: formatTimeOfDay(Number(row.startMinute)), end: formatTimeOfDay(Number(row.endMinute)) });
    todayByStaff.set(row.staffMemberId, list);
  }
  const items: ScheduleTeamSummaryItem[] = members.map((member) => ({
    staffMemberId: member.staffMemberId,
    displayName: member.displayName,
    roles: member.roles ?? [],
    employmentStatus: member.employmentStatus,
    hasSchedule: member.hasSchedule,
    todayIntervals: todayByStaff.get(member.staffMemberId) ?? []
  }));
  return { today, items };
}

async function readSchedule(actor: Actor, staffMemberId: string): Promise<StaffWeeklySchedule> {
  const [staff, business] = await Promise.all([
    readStaff(actor, staffMemberId),
    one<{ timezone: string }>(sql`select timezone from business.businesses where id = ${actor.businessId}`)
  ]);
  const timezone = business?.timezone ?? "UTC";
  const schedule = await one<{ id: string; revision: number | string }>(sql`select id, revision from team.staff_weekly_schedules where business_id = ${actor.businessId} and staff_member_id = ${staffMemberId}`);
  if (!schedule) {
    return toStaffScheduleResponse({ staffMemberId: staff.staffMemberId, displayName: staff.displayName, employmentStatus: staff.employmentStatus, timezone, revision: 0, hasSchedule: false, week: emptyWeek() });
  }
  const intervalRows = await rows<IntervalRow>(sql`select weekday, start_minute "startMinute", end_minute "endMinute" from team.staff_schedule_intervals where business_id = ${actor.businessId} and weekly_schedule_id = ${schedule.id} order by weekday, start_minute`);
  return toStaffScheduleResponse({ staffMemberId: staff.staffMemberId, displayName: staff.displayName, employmentStatus: staff.employmentStatus, timezone, revision: Number(schedule.revision), hasSchedule: true, week: intervalsToCanonicalWeek(intervalRows) });
}

// GET /v1/staff/:staffMemberId/schedule (schedules.read) and GET /v1/schedules/me
// (schedules.self.read). Missing schedule reports revision 0 without a row (U03 §18).
export async function getStaffSchedule(actor: Actor, staffMemberId: string) { return readSchedule(actor, staffMemberId); }
export async function getMySchedule(actor: Actor) { return readSchedule(actor, actor.staffMemberId); }
