import { z } from "zod";

// Weekday keys are 1-based ISO weekdays; the DTO always exposes the seven named
// days (U03 §12, §17). Empty days render as "No trabaja" (U03 §17).
export const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export const weekdaySchema = z.enum(weekdays);
export type Weekday = z.infer<typeof weekdaySchema>;

export const weekdayNumber: Record<Weekday, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7
};

export const weekdayByNumber: Record<number, Weekday> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
  7: "SUNDAY"
};

const clockTime = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

// Externally the API speaks HH:mm (U03 §16). The backend converts to/from
// minuteOfDay. 24:00 is a valid day END (minute 1440); it is rejected as a start
// by the domain (start_minute <= 1439).
export const timeOfDaySchema = z.string().refine((value) => clockTime.test(value) || value === "24:00", {
  message: "Time must be HH:mm between 00:00 and 23:59 (24:00 is allowed only as a day end)"
});
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

export const scheduleIntervalSchema = z.object({
  start: timeOfDaySchema,
  end: timeOfDaySchema
}).strict();
export type ScheduleInterval = z.infer<typeof scheduleIntervalSchema>;

const daySchema = z.array(scheduleIntervalSchema).default([]);

// A missing day is equivalent to "No trabaja" (empty array) (U03 §17, §18).
export const weeklyScheduleWeekSchema = z
  .object({
    MONDAY: daySchema,
    TUESDAY: daySchema,
    WEDNESDAY: daySchema,
    THURSDAY: daySchema,
    FRIDAY: daySchema,
    SATURDAY: daySchema,
    SUNDAY: daySchema
  })
  .strict();
export type WeeklyScheduleWeek = z.infer<typeof weeklyScheduleWeekSchema>;

// expectedRevision is non-negative: 0 means "no schedule persisted yet" (first
// write, U03 §19); >=1 compares against the current revision (U03 §50).
export const replaceWeeklyScheduleSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    week: weeklyScheduleWeekSchema
  })
  .strict();

export const emptyWeeklyScheduleWeek = (): WeeklyScheduleWeek => ({
  MONDAY: [],
  TUESDAY: [],
  WEDNESDAY: [],
  THURSDAY: [],
  FRIDAY: [],
  SATURDAY: [],
  SUNDAY: []
});

export type StaffWeeklySchedule = {
  staffMemberId: string;
  displayName: string;
  employmentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE";
  timezone: string;
  revision: number;
  hasSchedule: boolean;
  week: WeeklyScheduleWeek;
};

// Team summary only surfaces operational data (U03 §39): never email, phone,
// accountId, sessions, grants or security metadata.
export type ScheduleTeamSummaryItem = {
  staffMemberId: string;
  displayName: string;
  roles: string[];
  employmentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE";
  hasSchedule: boolean;
  todayIntervals: ScheduleInterval[];
};
