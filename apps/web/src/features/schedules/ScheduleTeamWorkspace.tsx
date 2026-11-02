"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@youngkingz/ui";
import { ApiError } from "@/lib/api/client";
import { roles, type RoleCode } from "@youngkingz/contracts";
import { formatTodayLabel, getTeamSchedules, type ScheduleTeamSummaryItem } from "./api";

const roleName = (role: string) => (role === "OWNER" ? "Dueño" : role === "RECEPTIONIST" ? "Recepción" : roles.includes(role as RoleCode) ? "Barbero" : role);

// Receptionist operational view (U03 §65): names, roles and schedules only. It never
// requests or renders H01 private data (no email/phone/account/session/grant).
export function ScheduleTeamWorkspace() {
  const [items, setItems] = useState<ScheduleTeamSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await getTeamSchedules(signal);
    setItems(result.items);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .catch((error) => { if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : "No pudimos cargar el equipo."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  return (
    <div className="content schedule-team">
      <header className="page-header">
        <div>
          <span className="eyebrow">Operación diaria</span>
          <h1 className="page-title">Equipo</h1>
          <p>Horarios de hoy del equipo. Sólo información operativa.</p>
        </div>
      </header>
      {error && <div className="notice error" role="alert">{error} <button className="link-button" onClick={() => load().catch(() => undefined)}>Reintentar</button></div>}
      {loading ? <div className="stack skeleton-list">{[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}</div>
        : items.length ? (
          <div className="resource-list">
            {items.map((item) => (
              <Link className="resource-row schedule-team-row" key={item.staffMemberId} href={`/team/${item.staffMemberId}/schedule`}>
                <div><strong>{item.displayName}</strong><span>{item.roles.length ? item.roles.map(roleName).join(" · ") : "Sin responsabilidades"}</span></div>
                <div className="inline"><span className="schedule-today">{formatTodayLabel(item)}</span><CalendarClock size={16} /></div>
              </Link>
            ))}
          </div>
        ) : <EmptyState title="Sin integrantes" detail="Todavía no hay integrantes con horario para mostrar." />}
    </div>
  );
}
