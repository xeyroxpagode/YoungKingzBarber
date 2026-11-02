"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, StatusPill } from "@youngkingz/ui";
import { ApiError, api } from "@/lib/api/client";
import type { WeeklyScheduleWeek } from "@youngkingz/contracts";
import { getStaffSchedule, replaceSchedule, type WeekDraft } from "./api";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";

type State = "IDLE" | "DIRTY" | "SUBMITTING" | "SUCCESS" | "STALE" | "FORBIDDEN" | "CONFLICT" | "TRANSPORT_UNCERTAIN";
const employmentName = (status: string) => (status === "ACTIVE" ? "Activa" : status === "INACTIVE" ? "Relación finalizada" : "Incorporación pendiente");

export function ScheduleWorkspace({ staffMemberId }: { staffMemberId: string }) {
  const [schedule, setSchedule] = useState<{ staffMemberId: string; displayName: string; employmentStatus: string; timezone: string; revision: number; hasSchedule: boolean; week: WeeklyScheduleWeek } | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [state, setState] = useState<State>("IDLE");
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const [item, context] = await Promise.all([getStaffSchedule(staffMemberId, signal), api<{ capabilities: string[] }>("/v1/iam/context", { signal })]);
    setSchedule(item);
    setCapabilities(context.capabilities);
    setState("IDLE");
  }, [staffMemberId]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el horario."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  const canManage = capabilities.includes("schedules.manage");
  const editableStaff = schedule?.employmentStatus === "ACTIVE" || schedule?.employmentStatus === "ONBOARDING";
  const editable = canManage && editableStaff && state !== "SUBMITTING";

  function failure(error: unknown) {
    if (error instanceof ApiError && error.code === "TRANSPORT_UNCERTAIN") { setState("TRANSPORT_UNCERTAIN"); setMessage("Resultado incierto. Conservamos tu borrador; volvé a abrir sin modificar los datos."); return; }
    if (error instanceof ApiError) {
      setState(error.code === "STALE_REVISION" ? "STALE" : error.code === "FORBIDDEN" ? "FORBIDDEN" : error.status === 409 ? "CONFLICT" : "IDLE");
      setMessage(error.code === "STALE_REVISION" ? "El horario cambió en el servidor. Recargamos los datos; revisá antes de confirmar." : error.code === "SCHEDULE_STAFF_NOT_EDITABLE" ? "El horario no se edita mientras la relación esté finalizada." : error.message);
      if (error.code === "STALE_REVISION") load().catch(() => undefined);
      return;
    }
    setState("TRANSPORT_UNCERTAIN");
    setMessage("No pudimos confirmar el resultado.");
  }

  async function save(week: WeekDraft) {
    if (!schedule) return;
    setState("SUBMITTING");
    setMessage("");
    try {
      await replaceSchedule(staffMemberId, { expectedRevision: schedule.revision, week });
      await load();
      setState("SUCCESS");
      setMessage("El horario semanal fue guardado.");
    } catch (error) {
      failure(error);
    }
  }

  if (loading) return <div className="content"><div className="skeleton schedule-skeleton" role="status" aria-label="Cargando horario" /></div>;
  if (loadError || !schedule) return <div className="content"><EmptyState title="No pudimos abrir el horario" detail={loadError || "El integrante no está disponible."} action={<Link className="button" href="/team">Volver a Equipo</Link>} /></div>;

  return (
    <div className="content schedule-detail">
      <header className="page-header">
        <div>
          <Link className="eyebrow" href="/team">← Equipo</Link>
          <h1 className="page-title">{schedule.displayName}</h1>
          <div className="role-summary">
            <StatusPill tone={schedule.hasSchedule ? "neutral" : "warning"}>{schedule.hasSchedule ? `Revisión ${schedule.revision}` : "Sin horarios"}</StatusPill>
            <StatusPill tone={editableStaff ? "positive" : "warning"}>{employmentName(schedule.employmentStatus)}</StatusPill>
          </div>
        </div>
      </header>
      {message && <div className={`notice ${state === "SUCCESS" ? "success" : state === "FORBIDDEN" || state === "CONFLICT" || state === "STALE" || state === "TRANSPORT_UNCERTAIN" ? "error" : ""}`} role={state === "SUCCESS" ? "status" : "alert"}>{message}</div>}
      {canManage && !editableStaff && <div className="notice" role="status">El horario se conserva, pero no se edita mientras la relación laboral esté finalizada.</div>}
      {!canManage && <div className="notice" role="status">Sólo lectura: no tenés permiso para administrar horarios.</div>}
      <p className="muted">Horario semanal habitual. Las horas se interpretan en la zona horaria del negocio ({schedule.timezone}).</p>
      <WeeklyScheduleEditor initial={schedule.week} canManage={editable} busy={state === "SUBMITTING"} onSave={save} />
    </div>
  );
}
