import { useState } from "react"
import { RootHeader, SectionHeader } from "../components/Headers"
import { MetricCard, InformativeCard } from "../components/Cards"
import { OperationalListRow } from "../components/OperationalListRow"
import { StatusIndicator } from "../components/Actions"
import { EmptyState } from "../components/Feedback"
import {
  reservasDelDia,
  todasLasAtenciones,
  contadorResumen,
  turnoEstadoLabel,
  estadoVisibleReserva,
  servicioPorId,
  profesionalPorId,
  clientePorId,
  demoTodayKey,
  type Reserva,
} from "../state/agenda"

const CONTABILIDAD_HOY = contadorResumen()

export function OverviewSurface() {
  const [vistaDetalle, setVistaDetalle] = useState<
    "resumen" | "turnos" | "atencion"
  >("resumen")

  const cobradoHoy = 0 // Se calculará en P4 con Finanzas
  const reservasHoy = reservasDelDia(demoTodayKey())

  const renderTurnoRow = (turno: Reserva) => {
    const sv = servicioPorId(turno.servicioId)
    const prof = profesionalPorId(turno.profesionalId)
    const cli = clientePorId(turno.clienteId)
    const ev = estadoVisibleReserva(turno)
    const tone: "neutral" | "success" | "warning" | "danger" | "info" = ({
      finalizado: "success",
      en_atencion: "warning",
      confirmado: "info",
      ausente: "danger",
      cancelado: "danger",
    }[ev as "finalizado" | "en_atencion" | "confirmado" | "ausente" | "cancelado"] ?? "neutral") as "neutral" | "success" | "warning" | "danger" | "info"
    return (
      <OperationalListRow
        key={turno.id}
        time={turno.inicio.slice(11, 16)}
        initials={cli?.nombre.split(" ").map((p: string) => p[0]).join("") ?? ""}
        title={cli?.nombre ?? turno.clienteId}
        detail={`${sv?.nombre ?? turno.servicioId} · ${prof?.nombre ?? turno.profesionalId}`}
        status={turnoEstadoLabel(ev)}
        statusTone={tone as "neutral" | "success" | "warning" | "danger" | "info"}
        trailing={">"}
        onPress={() => setVistaDetalle("turnos")}
      />
    )
  }

  const renderAtencionRow = (turno: Reserva) => {
    const sv = servicioPorId(turno.servicioId)
    const prof = profesionalPorId(turno.profesionalId)
    const cli = clientePorId(turno.clienteId)
    const ev = estadoVisibleReserva(turno)
    const tone: "warning" | "neutral" = {
      en_atencion: "warning",
      confirmado: "neutral",
    }[ev as "en_atencion" | "confirmado"] as "warning" | "neutral"
    return (
      <OperationalListRow
        key={turno.id}
        time={turno.inicio.slice(11, 16)}
        initials={cli?.nombre.split(" ").map((p: string) => p[0]).join("") ?? ""}
        title={cli?.nombre ?? turno.clienteId}
        detail={`${sv?.nombre ?? turno.servicioId} · ${prof?.nombre ?? turno.profesionalId}`}
        status={turnoEstadoLabel(ev)}
        statusTone={tone as "neutral" | "success" | "warning" | "danger" | "info"}
        trailing={">"}
        onPress={() => setVistaDetalle("atencion")}
      />
    )
  }

  const progreso = Math.round(
    (CONTABILIDAD_HOY.finalizadas / Math.max(CONTABILIDAD_HOY.total, 1)) * 100,
  )

  return (
    <section className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-5 pb-10">
      <RootHeader
        title="Resumen"
        subtitle="Agenda del día · YoungKingZ Barbería"
      />

      <SectionHeader label="Hoy" hint="Movimientos del día" />

      <div className="grid grid-cols-2 gap-3 mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
        <MetricCard
          label="Cobrado hoy"
          value={`$${cobradoHoy.toLocaleString()}`}
          detail="Pronto disponible en Finanzas (P4)"
          tone="neutral"
        />
        <MetricCard
          label="Turnos hoy"
          value={String(CONTABILIDAD_HOY.total)}
          detail={`${progreso}% completados`}
          tone="neutral"
        />
      </div>

      <SectionHeader
        label="Turnos de hoy"
        hint={`${CONTABILIDAD_HOY.total} turnos registrados`}
        right={
          <button
            type="button"
            className="pressable flex items-center justify-center border-none outline-none"
            aria-label="Ver todos los turnos"
            style={{
              borderRadius: "var(--radius-button)",
              border: `1px solid var(--color-border)`,
              background: "transparent",
              color: "var(--color-ink-2)",
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 600,
              padding: "6px 10px",
            }}
            onClick={() => setVistaDetalle("turnos")}
          >
            Ver todo
          </button>
        }
      />

      <div className="flex flex-col gap-2 mb-6" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {reservasHoy.slice(0, 4).map(renderTurnoRow)}
      </div>

      <SectionHeader
        label="Requiere atención"
        hint="Turnos pendientes o en atención"
      />

      <div className="flex flex-col gap-2" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reservasHoy.filter((r) => estadoVisibleReserva(r) === "en_atencion" || estadoVisibleReserva(r) === "confirmado").map(renderAtencionRow)}
      </div>

      <InformativeCard
        title="Todo al día"
        body="Sin turnos bloqueados ni alertas críticas por resolver en este momento."
        tone="success"
      />
    </section>
  )
}
