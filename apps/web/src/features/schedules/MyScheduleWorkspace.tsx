"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, StatusPill } from "@youngkingz/ui";
import { ApiError } from "@/lib/api/client";
import type { WeeklyScheduleWeek } from "@youngkingz/contracts";
import { getMySchedule } from "./api";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";

type MySchedule = { staffMemberId: string; displayName: string; employmentStatus: string; timezone: string; revision: number; hasSchedule: boolean; week: WeeklyScheduleWeek };

export function MyScheduleWorkspace() {
  const [schedule, setSchedule] = useState<MySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setSchedule(await getMySchedule(signal));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu horario."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  if (loading) return <div className="content account-content"><div className="skeleton schedule-skeleton" role="status" aria-label="Cargando tu horario" /></div>;
  if (loadError || !schedule) return <div className="content account-content"><EmptyState title="No pudimos abrir tu horario" detail={loadError || "Tu horario no está disponible."} action={<Link className="button" href="/account">Volver a Mi cuenta</Link>} /></div>;

  return (
    <div className="content account-content schedule-detail">
      <header className="page-header">
        <div>
          <span className="eyebrow">Área personal</span>
          <h1 className="page-title">Mi horario</h1>
          <div className="role-summary"><StatusPill tone={schedule.hasSchedule ? "neutral" : "warning"}>{schedule.hasSchedule ? `Revisión ${schedule.revision}` : "Sin horarios"}</StatusPill></div>
        </div>
      </header>
      {!schedule.hasSchedule && <div className="notice" role="status">Todavía no configuraste un horario. Se muestra sólo lectura; lo administra el negocio.</div>}
      <p className="muted">Tu horario semanal habitual, en la zona horaria del negocio ({schedule.timezone}). Sólo lectura.</p>
      <WeeklyScheduleEditor initial={schedule.week} canManage={false} />
    </div>
  );
}
