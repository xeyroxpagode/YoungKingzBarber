import { describe, expect, it } from "vitest";
import { delegableCapabilities, replaceWeeklyScheduleSchema, roleCapabilities, type ScheduleInterval } from "@youngkingz/contracts";
import {
  canonicalizeDayIntervals,
  canonicalizeWeek,
  formatTimeOfDay,
  getCurrentBusinessWeekday,
  parseTimeOfDay,
  weekIsEmpty,
  weeklySchedulesEqual
} from "../../../apps/api/src/modules/schedules/domain";

const interval = (start: string, end: string): ScheduleInterval => ({ start, end });

describe("H02.U03 schedule capability model", () => {
  it("gives Owner all three schedule capabilities and keeps them non-configurable defaults", () => {
    expect(roleCapabilities.OWNER).toEqual(expect.arrayContaining(["schedules.read", "schedules.manage", "schedules.self.read"]));
  });

  it("gives Receptionist read + self read but not manage (manage is delegated only)", () => {
    expect(roleCapabilities.RECEPTIONIST).toEqual(expect.arrayContaining(["schedules.read", "schedules.self.read"]));
    expect(roleCapabilities.RECEPTIONIST).not.toContain("schedules.manage");
  });

  it("gives Barber only self read and never team read or manage", () => {
    expect(roleCapabilities.BARBER).toContain("schedules.self.read");
    expect(roleCapabilities.BARBER).not.toContain("schedules.read");
    expect(roleCapabilities.BARBER).not.toContain("schedules.manage");
  });

  it("delegates schedules.manage (Receptionist grants are role-gated server-side)", () => {
    expect(delegableCapabilities).toContain("schedules.manage");
    expect(delegableCapabilities).not.toContain("schedules.read");
    expect(delegableCapabilities).not.toContain("schedules.self.read");
  });
});

describe("H02.U03 schedule contracts", () => {
  it("accepts first write (expectedRevision 0) and defaults an empty week to every day", () => {
    const parsed = replaceWeeklyScheduleSchema.parse({ expectedRevision: 0, week: {} });
    expect(parsed.expectedRevision).toBe(0);
    expect(Object.keys(parsed.week).sort()).toEqual(["FRIDAY", "MONDAY", "SATURDAY", "SUNDAY", "THURSDAY", "TUESDAY", "WEDNESDAY"]);
    expect(parsed.week.MONDAY).toEqual([]);
  });

  it("rejects negative revisions, unknown days, and extra keys", () => {
    expect(() => replaceWeeklyScheduleSchema.parse({ expectedRevision: -1, week: {} })).toThrow();
    expect(() => replaceWeeklyScheduleSchema.parse({ expectedRevision: 0, week: { FUNDAY: [] } })).toThrow();
    expect(() => replaceWeeklyScheduleSchema.parse({ expectedRevision: 0, week: {}, extra: true })).toThrow();
    expect(() => replaceWeeklyScheduleSchema.parse({ expectedRevision: 0, week: { MONDAY: [{ start: "25:00", end: "10:00" }] } })).toThrow();
  });
});

describe("H02.U03 schedule time domain", () => {
  it("parses and formats HH:mm to/from minute of day", () => {
    expect(parseTimeOfDay("00:00")).toBe(0);
    expect(parseTimeOfDay("10:00")).toBe(600);
    expect(parseTimeOfDay("13:30")).toBe(810);
    expect(parseTimeOfDay("19:00")).toBe(1140);
    expect(parseTimeOfDay("23:59")).toBe(1439);
    expect(parseTimeOfDay("24:00")).toBe(1440);
    expect(formatTimeOfDay(0)).toBe("00:00");
    expect(formatTimeOfDay(600)).toBe("10:00");
    expect(formatTimeOfDay(810)).toBe("13:30");
    expect(formatTimeOfDay(1140)).toBe("19:00");
    expect(formatTimeOfDay(1440)).toBe("24:00");
    expect(formatTimeOfDay(parseTimeOfDay("14:05"))).toBe("14:05");
  });

  it("rejects malformed times", () => {
    for (const value of ["25:00", "10:60", "9:5", "abc", "10.00", ""]) expect(() => parseTimeOfDay(value)).toThrow();
  });
});

describe("H02.U03 schedule canonicalization", () => {
  it("keeps an empty week empty across all seven days", () => {
    const week = canonicalizeWeek({});
    expect(weekIsEmpty(week)).toBe(true);
    expect(Object.values(week).flat()).toEqual([]);
  });

  it("keeps a single interval and multiple disjoint intervals sorted", () => {
    expect(canonicalizeDayIntervals([interval("10:00", "19:00")])).toEqual([{ startMinute: 600, endMinute: 1140 }]);
    expect(canonicalizeDayIntervals([interval("14:00", "19:00"), interval("10:00", "13:00")])).toEqual([
      { startMinute: 600, endMinute: 780 },
      { startMinute: 840, endMinute: 1140 }
    ]);
  });

  it("merges touching intervals into one canonical block", () => {
    expect(canonicalizeDayIntervals([interval("10:00", "13:00"), interval("13:00", "19:00")])).toEqual([{ startMinute: 600, endMinute: 1140 }]);
    expect(canonicalizeDayIntervals([interval("08:00", "12:00"), interval("12:00", "16:00"), interval("16:00", "20:00")])).toEqual([{ startMinute: 480, endMinute: 1200 }]);
  });

  it("rejects overlapping, duplicate, and contained intervals", () => {
    for (const input of [
      [interval("10:00", "14:00"), interval("13:00", "18:00")],
      [interval("10:00", "19:00"), interval("10:00", "19:00")],
      [interval("10:00", "19:00"), interval("11:00", "12:00")]
    ]) {
      let code: string | undefined;
      try { canonicalizeDayIntervals(input); } catch (error) { code = (error as { details?: { issue?: string } }).details?.issue; }
      expect(code).toBe("INTERVAL_OVERLAP");
    }
  });

  it("rejects overnight and zero-length intervals", () => {
    for (const input of [[interval("19:00", "10:00")], [interval("10:00", "10:00")]]) {
      let issue: string | undefined;
      try { canonicalizeDayIntervals(input); } catch (error) { issue = (error as { details?: { issue?: string } }).details?.issue; }
      expect(issue).toBe("INVALID_INTERVAL_ORDER");
    }
    // 24:00 is a valid day END (minute 1440).
    expect(canonicalizeDayIntervals([interval("00:00", "24:00")])).toEqual([{ startMinute: 0, endMinute: 1440 }]);
    // 24:00 is invalid as a start (INVALID_START_TIME), not an order violation.
    let startIssue: string | undefined;
    try { canonicalizeDayIntervals([interval("24:00", "24:00")]); } catch (error) { startIssue = (error as { details?: { issue?: string } }).details?.issue; }
    expect(startIssue).toBe("INVALID_START_TIME");
  });

  it("compares weeks semantically, collapsing equivalent representations", () => {
    const a = canonicalizeWeek({ WEDNESDAY: [interval("10:00", "13:00"), interval("13:00", "19:00")] });
    const b = canonicalizeWeek({ WEDNESDAY: [interval("10:00", "19:00")] });
    const c = canonicalizeWeek({ WEDNESDAY: [interval("10:00", "18:00")] });
    expect(weeklySchedulesEqual(a, b)).toBe(true);
    expect(weeklySchedulesEqual(a, c)).toBe(false);
  });
});

describe("H02.U03 schedule timezone resolution", () => {
  // 2026-11-01T00:30Z is Sunday in UTC but Saturday west of the date line.
  it("derives the business weekday from the Business timezone", () => {
    const instant = new Date("2026-11-01T00:30:00Z");
    expect(getCurrentBusinessWeekday("UTC", instant)).toBe("SUNDAY");
    expect(getCurrentBusinessWeekday("Pacific/Honolulu", instant)).toBe("SATURDAY");
    expect(getCurrentBusinessWeekday("America/Argentina/Buenos_Aires", new Date("2026-10-31T14:00:00Z"))).toBe("SATURDAY");
  });
});
