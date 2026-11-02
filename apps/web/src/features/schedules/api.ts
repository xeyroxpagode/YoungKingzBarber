import { api, ApiError } from "@/lib/api/client";
import type { ScheduleInterval, ScheduleTeamSummaryItem, StaffWeeklySchedule } from "@youngkingz/contracts";

export type { ScheduleInterval, ScheduleTeamSummaryItem, StaffWeeklySchedule };

export type Operation = { status: "PENDING" | "SUCCEEDED" | "FAILED"; responseBody?: unknown; errorCode?: string };
export type WeekDraft = Record<string, ScheduleInterval[]>;

export async function getTeamSchedules(signal?: AbortSignal) {
  return api<{ today: string; items: ScheduleTeamSummaryItem[] }>("/v1/schedules/team", { signal });
}

export async function getStaffSchedule(staffMemberId: string, signal?: AbortSignal) {
  return api<StaffWeeklySchedule>(`/v1/staff/${staffMemberId}/schedule`, { signal });
}

export async function getMySchedule(signal?: AbortSignal) {
  return api<StaffWeeklySchedule>("/v1/schedules/me", { signal });
}

// PUT with transport-uncertainty recovery: a lost response is reconciled against
// system.operation_attempts before the user is asked to do anything (U02 pattern).
export async function replaceSchedule(staffMemberId: string, body: { expectedRevision: number; week: WeekDraft }, pendingOperation?: string) {
  const operationId = pendingOperation ?? crypto.randomUUID();
  try {
    return await api(`/v1/staff/${staffMemberId}/schedule`, { method: "PUT", operationId, body: JSON.stringify(body) });
  } catch (error) {
    if (error instanceof ApiError && error.code !== "TRANSPORT_UNCERTAIN") throw error;
    try {
      const operation = await api<Operation>(`/v1/operations/${operationId}`);
      if (operation.status === "SUCCEEDED") return { data: operation.responseBody, replayed: true };
      if (operation.status === "FAILED") throw new ApiError(operation.errorCode ?? "CONFLICT", "La operación falló; revisá el estado antes de intentar de nuevo.", 409);
    } catch (recovery) {
      if (recovery instanceof ApiError && recovery.code !== "NOT_FOUND") throw recovery;
    }
    throw new ApiError("TRANSPORT_UNCERTAIN", "No pudimos confirmar el resultado. Actualizá antes de volver a intentar.", 503, { operationId });
  }
}

export function formatTodayLabel(item: ScheduleTeamSummaryItem | undefined): string {
  if (!item) return "Sin horarios configurados";
  if (!item.hasSchedule) return "Sin horarios configurados";
  if (!item.todayIntervals.length) return "Hoy · No trabaja";
  return `Hoy · ${item.todayIntervals.map((interval) => `${interval.start}–${interval.end}`).join(" · ")}`;
}
