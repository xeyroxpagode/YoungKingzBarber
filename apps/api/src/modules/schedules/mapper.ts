import { weekdayByNumber, type ScheduleInterval, type StaffWeeklySchedule, type Weekday } from "@youngkingz/contracts";
import { canonicalWeekToApi, type CanonicalInterval, type CanonicalWeek } from "./domain.js";

export type IntervalRow = { weekday: number | string; startMinute: number | string; endMinute: number | string };

// Reads are ordered by (weekday, start_minute); assembling them here yields a
// canonical week. The domain guard keeps the mapping independent of schema drift.
export function intervalsToCanonicalWeek(rows: ReadonlyArray<IntervalRow>): CanonicalWeek {
  const week: CanonicalWeek = { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: [] };
  for (const row of rows) {
    const weekday = weekdayByNumber[Number(row.weekday)];
    if (!weekday) continue;
    week[weekday].push({ startMinute: Number(row.startMinute), endMinute: Number(row.endMinute) } satisfies CanonicalInterval);
  }
  for (const key of Object.keys(week) as Weekday[]) week[key].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  return week;
}

export type StaffScheduleResponseInput = {
  staffMemberId: string;
  displayName: string;
  employmentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE";
  timezone: string;
  revision: number;
  hasSchedule: boolean;
  week: CanonicalWeek;
};

// Response always exposes the seven days (U03 §17); empty days read "No trabaja".
export function toStaffScheduleResponse(input: StaffScheduleResponseInput): StaffWeeklySchedule {
  const week: Record<Weekday, ScheduleInterval[]> = canonicalWeekToApi(input.week);
  return {
    staffMemberId: input.staffMemberId,
    displayName: input.displayName,
    employmentStatus: input.employmentStatus,
    timezone: input.timezone,
    revision: input.revision,
    hasSchedule: input.hasSchedule,
    week
  };
}
