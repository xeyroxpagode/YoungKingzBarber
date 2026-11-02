import { DomainError, weekdays, type ScheduleInterval, type Weekday } from "@youngkingz/contracts";

// Canonical in-memory representation: local minutes of day (U03 §13). 1440 is the
// end-of-day sentinel ("24:00"); start minutes are capped at 1439 (no overnight,
// U03 §25) and start < end always holds within a single day.
export type CanonicalInterval = { startMinute: number; endMinute: number };
export type CanonicalWeek = Record<Weekday, CanonicalInterval[]>;

const MAX_END_MINUTE = 1440;
const MAX_START_MINUTE = 1439;
const HHmm = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

export function parseTimeOfDay(value: string): number {
  const normalized = value.trim();
  if (normalized === "24:00") return MAX_END_MINUTE;
  const match = HHmm.exec(normalized);
  if (!match) throw new DomainError("VALIDATION_ERROR", `Time must be HH:mm between 00:00 and 23:59 (or 24:00 as an end)`, 400, { issue: "INVALID_TIME_OF_DAY", value });
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTimeOfDay(minute: number): string {
  if (minute === MAX_END_MINUTE) return "24:00";
  if (minute < 0 || minute > MAX_START_MINUTE) throw new DomainError("VALIDATION_ERROR", "Minute of day is out of range", 400, { issue: "INVALID_MINUTE_OF_DAY", value: minute });
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// parse -> validate -> sort -> merge touching, rejecting any overlap or overnight.
export function canonicalizeDayIntervals(input: ReadonlyArray<ScheduleInterval>): CanonicalInterval[] {
  const parsed = input.map((interval) => {
    const startMinute = parseTimeOfDay(interval.start);
    const endMinute = parseTimeOfDay(interval.end);
    if (startMinute < 0 || startMinute > MAX_START_MINUTE) throw new DomainError("VALIDATION_ERROR", "Start time must be between 00:00 and 23:59", 400, { issue: "INVALID_START_TIME", value: interval.start });
    if (endMinute < 1 || endMinute > MAX_END_MINUTE) throw new DomainError("VALIDATION_ERROR", "End time must be between 00:01 and 24:00", 400, { issue: "INVALID_END_TIME", value: interval.end });
    if (startMinute >= endMinute) throw new DomainError("VALIDATION_ERROR", "Start time must be before end time; overnight intervals are not allowed", 400, { issue: "INVALID_INTERVAL_ORDER", value: interval });
    return { startMinute, endMinute } satisfies CanonicalInterval;
  });
  parsed.sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const merged: CanonicalInterval[] = [];
  for (const interval of parsed) {
    const current = merged.at(-1);
    if (!current) { merged.push({ ...interval }); continue; }
    if (interval.startMinute < current.endMinute) throw new DomainError("VALIDATION_ERROR", "Intervals overlap; split blocks must not intersect", 400, { issue: "INTERVAL_OVERLAP" });
    if (interval.startMinute === current.endMinute) { current.endMinute = Math.max(current.endMinute, interval.endMinute); continue; }
    merged.push({ ...interval });
  }
  return merged;
}

export function emptyWeek(): CanonicalWeek {
  return { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: [] };
}

export function weekIsEmpty(week: CanonicalWeek): boolean {
  return weekdays.every((weekday) => week[weekday].length === 0);
}

// Canonicalizes all seven days, always returning every weekday key (U03 §17).
export function canonicalizeWeek(input: Partial<Record<Weekday, ReadonlyArray<ScheduleInterval>>>): CanonicalWeek {
  const result = emptyWeek();
  for (const weekday of weekdays) result[weekday] = canonicalizeDayIntervals(input[weekday] ?? []);
  return result;
}

export function formatCanonicalInterval(interval: CanonicalInterval): ScheduleInterval {
  return { start: formatTimeOfDay(interval.startMinute), end: formatTimeOfDay(interval.endMinute) };
}

export function canonicalWeekToApi(week: CanonicalWeek): Record<Weekday, ScheduleInterval[]> {
  const result = {} as Record<Weekday, ScheduleInterval[]>;
  for (const weekday of weekdays) result[weekday] = week[weekday].map(formatCanonicalInterval);
  return result;
}

export function weeklySchedulesEqual(a: CanonicalWeek, b: CanonicalWeek): boolean {
  return weekdays.every((weekday) => {
    const left = a[weekday];
    const right = b[weekday];
    if (left.length !== right.length) return false;
    return left.every((interval, index) => interval.startMinute === right[index]!.startMinute && interval.endMinute === right[index]!.endMinute);
  });
}

// The weekday of "now" as observed in the Business timezone (U03 §27). This drives
// the Team "today" summary; schedule data stays timezone-free minutes.
export function getCurrentBusinessWeekday(timezone: string, now: Date = new Date()): Weekday {
  let label: string;
  try {
    label = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" }).format(now);
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Business timezone is not a valid IANA zone", 400, { issue: "INVALID_TIMEZONE", value: timezone });
  }
  const weekday = label.toUpperCase();
  if ((weekdays as readonly string[]).includes(weekday)) return weekday as Weekday;
  throw new DomainError("VALIDATION_ERROR", "Unable to resolve business weekday", 500, { issue: "WEEKDAY_RESOLUTION", value: label });
}
