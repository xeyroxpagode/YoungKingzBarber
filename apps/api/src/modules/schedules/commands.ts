import { DomainError, replaceWeeklyScheduleSchema, weekdayNumber, weekdays } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { canonicalizeWeek, emptyWeek, weekIsEmpty, weeklySchedulesEqual, type CanonicalInterval, type CanonicalWeek } from "./domain.js";
import { intervalsToCanonicalWeek, toStaffScheduleResponse, type IntervalRow } from "./mapper.js";

type ScheduleRow = { id: string; revision: number | string };
type StaffEmployment = "ONBOARDING" | "ACTIVE" | "INACTIVE";

async function insertIntervals(tx: Tx, scheduleId: string, businessId: string, week: CanonicalWeek) {
  for (const weekday of weekdays) {
    const number = weekdayNumber[weekday];
    for (const interval of week[weekday]) {
      const { startMinute, endMinute } = interval satisfies CanonicalInterval;
      await tx`insert into team.staff_schedule_intervals(business_id, weekly_schedule_id, weekday, start_minute, end_minute)
        values (${businessId}, ${scheduleId}, ${number}, ${startMinute}, ${endMinute})`;
    }
  }
}

// PUT /v1/staff/:staffMemberId/schedule (schedules.manage).
// Canonicalization runs before executeOperation so the idempotency fingerprint is
// derived from the canonical week (U03 §52). One mutation covers the whole week
// (U03 §64); lock order is StaffMember -> WeeklySchedule (U03 §44).
export async function replaceWeeklySchedule(actor: Actor, staffMemberId: string, raw: unknown, operationId: string) {
  const input = replaceWeeklyScheduleSchema.parse(raw);
  const canonical = canonicalizeWeek(input.week);
  return executeOperation(
    { operationId, command: "schedules.weekly.replace", actor, payload: { staffMemberId, expectedRevision: input.expectedRevision, week: canonical } },
    async (tx) => {
      // 4. lock StaffMember (serialize concurrent writes and offboard) / 5. tenant
      const staff = await tx`select id, employment_status::text "employmentStatus" from team.staff_members where business_id = ${actor.businessId} and id = ${staffMemberId} for update`;
      if (!staff.length) throw new DomainError("NOT_FOUND", "Staff member not found", 404);
      const employmentStatus = staff[0]!.employmentStatus as StaffEmployment;
      // 6. only ONBOARDING/ACTIVE are editable (U03 §43)
      if (employmentStatus !== "ACTIVE" && employmentStatus !== "ONBOARDING") throw new DomainError("SCHEDULE_STAFF_NOT_EDITABLE", "Schedule is not editable while Staff is inactive", 409);
      // 7. fetch/lock Schedule (may be absent)
      const schedule = await tx`select id, revision from team.staff_weekly_schedules where business_id = ${actor.businessId} and staff_member_id = ${staffMemberId} for update` as unknown as ScheduleRow[];
      const actualRevision = schedule.length ? Number(schedule[0]!.revision) : 0;
      // 8. revision gate (first write requires expectedRevision 0) (U03 §19, §50)
      if (actualRevision !== input.expectedRevision) throw new DomainError("STALE_REVISION", "Weekly Schedule revision is stale", 409);

      const existingRows = (schedule.length ? (await tx`select weekday, start_minute "startMinute", end_minute "endMinute" from team.staff_schedule_intervals where business_id = ${actor.businessId} and weekly_schedule_id = ${schedule[0]!.id} order by weekday, start_minute`) : []) as unknown as IntervalRow[];
      const existingWeek = intervalsToCanonicalWeek(existingRows);

      let nextRevision: number;
      let hasSchedule: boolean;
      if (!schedule.length) {
        // 10/11. no existing schedule
        if (weekIsEmpty(canonical)) {
          // §20 empty first write: no row, no audit
          nextRevision = 0;
          hasSchedule = false;
        } else {
          // §19 effective first create
          const [created] = await tx`insert into team.staff_weekly_schedules(business_id, staff_member_id) values (${actor.businessId}, ${staffMemberId}) returning id, revision` as unknown as ScheduleRow[];
          await insertIntervals(tx, created!.id, actor.businessId, canonical);
          await audit(tx, { actor, operationId, action: "schedules.weekly.created", capability: "schedules.manage", resourceType: "STAFF_WEEKLY_SCHEDULE", resourceId: created!.id, changes: { staffMemberId } });
          nextRevision = Number(created!.revision);
          hasSchedule = true;
        }
      } else if (weeklySchedulesEqual(existingWeek, canonical)) {
        // §51 semantic no-op: same canonical week, no revision/audit
        nextRevision = actualRevision;
        hasSchedule = true;
      } else {
        // §21 effective replace or clear; Schedule row survives, revision bumps
        await tx`delete from team.staff_schedule_intervals where business_id = ${actor.businessId} and weekly_schedule_id = ${schedule[0]!.id}`;
        await insertIntervals(tx, schedule[0]!.id, actor.businessId, canonical);
        const [updated] = await tx`update team.staff_weekly_schedules set revision = revision + 1, updated_at = now() where id = ${schedule[0]!.id} returning revision` as unknown as ScheduleRow[];
        await audit(tx, { actor, operationId, action: "schedules.weekly.updated", capability: "schedules.manage", resourceType: "STAFF_WEEKLY_SCHEDULE", resourceId: schedule[0]!.id, changes: { staffMemberId, cleared: weekIsEmpty(canonical) } });
        nextRevision = Number(updated!.revision);
        hasSchedule = true;
      }

      // 14. authoritative response mirroring the read DTO (U03 §14, §17)
      const [person] = await tx`select concat_ws(' ', p.first_name, p.last_name) "displayName" from iam.persons p join team.staff_members sm on sm.person_id = p.id where sm.business_id = ${actor.businessId} and sm.id = ${staffMemberId}` as unknown as { displayName: string }[];
      const [business] = await tx`select timezone from business.businesses where id = ${actor.businessId}` as unknown as { timezone: string }[];
      const responseWeek = hasSchedule ? canonical : emptyWeek();
      return {
        ...toStaffScheduleResponse({ staffMemberId, displayName: person!.displayName, employmentStatus, timezone: business!.timezone, revision: nextRevision, hasSchedule, week: responseWeek }),
        changed: hasSchedule ? nextRevision !== actualRevision : false
      };
    }
  );
}
