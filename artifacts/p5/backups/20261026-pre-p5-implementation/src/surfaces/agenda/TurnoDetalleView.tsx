import { useState } from "react"
import { DetailHeader } from "../../components/Headers"
import { OperationalListRow } from "../../components/OperationalListRow"
import { EmptyState } from "../../components/Feedback"
import { PrimaryAction, SecondaryAction, StatusIndicator } from "../../components/Actions"
import { ChevronRightIcon } from "../../components/Icons"
import {
  cancelarReserva,
  finalizarAtencion,
  iniciarAtencion,
  profesionalPorId,
  registrarInasistencia,
  servicioPorId,
  clientePorId,
  estadoVisibleReserva,
  turnoEstadoLabel,
  type Reserva,
} from "../../state/agenda"

type TurnoDetalleViewProps = {
  reserva: Reserva
  onVolver: () => void
  onEditar: () => void
  onReprogramar: () => void
  onCancelar: () => void
  onAusencia: () => void
  onResultado: (r: any) => void
}

export function TurnoDetalleView({
  reserva,
  onVolver,
  onEditar,
  onReprogramar,
  onCancelar,
  onAusencia,
  onResultado,
}: TurnoDetalleViewProps) {
  const sv = servicioPorId(reserva.servicioId)
  const prof = profesionalPorId(reserva.profesionalId)
  const cli = clientePorId(reserva.clienteId)
  const ev = estadoVisibleReserva(reserva)
  const hayAtencion = reserva.estado === "en_atencion" || ev === "en_atencion"

  return (
    <>
      <DetailHeader title="Detalle del turno" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Hora</p>
          <p className="text-[28px] leading-[34px] font-[700] text-[var(--color-ink)] tabular-nums" style={{ fontSize: 28, lineHeight: "34px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{timeLabel(reserva.inicio)} – {timeLabel(reserva.fin)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Servicio</p>
          <p className="text-[20px] leading-[26px] font-[600] text-[var(--color-ink)]" style={{ fontSize: 20, lineHeight: "26px", fontWeight: 600 }}>{sv?.nombre ?? reserva.servicioId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Estado</p>
          <span className="flex items-center gap-1.5 rounded-full shrink-0" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: "9999px", padding: "2px 8px", background: estadoBg(ev) }}>
            <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: "9999px", background: estadoDot(ev), display: "block" }} />
            <span className="text-[12px] leading-[16px] font-[600]" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: estadoText(ev) }}>{turnoEstadoLabel(ev)}</span>
          </span>
        </div>

        <SeccionNavegable label="Cliente" value={cli?.nombre ?? reserva.clienteId} />
        <SeccionNavegable label="Profesional" value={prof?.nombre ?? reserva.profesionalId} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Información</p>
          <p className="text-[14px] leading-[20px] text-[var(--color-ink-2)]" style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-2)" }}>
            {dateLabelHumano(reserva.inicio)} · {Math.round((new Date(reserva.fin).getTime() - new Date(reserva.inicio).getTime()) / 60000)} min · Origen: {origenLabel(reserva.origen)}
          </p>
        </div>

        {reserva.observaciones ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Observaciones</p>
            <p className="text-[14px] leading-[20px] text-[var(--color-ink-2)]" style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-2)" }}>{reserva.observaciones}</p>
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-3)" }}>Historial de la reserva</p>
          {reserva.historial.map((h) => (
            <div key={h.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)]" style={{ fontSize: 12, lineHeight: "16px", color: "var(--color-ink-3)" }}>{h.accion.replace(/_/g, " ")}</p>
              <p className="text-[11px] leading-[15px] text-[var(--color-ink-4)]" style={{ fontSize: 11, lineHeight: "15px", color: "var(--color-ink-4)" }}>{h.momento.slice(11, 16)} {h.detalle ?? ""}</p>
            </div>
          ))}
        </div>

        {renderAcciones()}
      </div>
    </>
  )

  function renderAcciones() {
    if (ev === "confirmado") {
      return (
        <div className="flex flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <SecondaryAction label="Editar" onPress={onEditar} />
          <SecondaryAction label="Reprogramar" onPress={onReprogramar} />
          <PrimaryAction label="Registrar ausencia" onPress={onAusencia} />
          <SecondaryAction label="Cancelar" onPress={onCancelar} />
          <SecondaryAction label="Ver actividad" onPress={() => onResultado({ tipo: "confirmado", titulo: "Actividad", cuerpo: "Sin actividad adicional registrada." })}/>
        </div>
      )
    }
    if (ev === "en_atencion") {
      return (
        <div className="flex flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <PrimaryAction label="Finalizar atención" onPress={() => {
            const res = finalizarAtencion(reserva.id)
            if (res.ok) onResultado({ tipo: "confirmado", titulo: "Atención finalizada", cuerpo: "El turno pasó a finalizado." })
          }} />
          <SecondaryAction label="Ver información" onPress={() => onResultado({ tipo: "confirmado", titulo: "Información", cuerpo: "Atención en curso con " + (prof?.nombre ?? reserva.profesionalId) + "." })}/>
        </div>
      )
    }
    if (ev === "finalizado") {
      return (
        <div className="flex flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <SecondaryAction label="Ver atención" onPress={() => onResultado({ tipo: "confirmado", titulo: "Atención", cuerpo: "Atención completada." })}/>
          <SecondaryAction label="Ver actividad" onPress={() => onResultado({ tipo: "confirmado", titulo: "Actividad", cuerpo: "Historial disponible arriba." })}/>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <SecondaryAction label="Consultar historial" onPress={() => onResultado({ tipo: "confirmado", titulo: "Historial", cuerpo: "Registro de cambios disponible arriba." })}/>
      </div>
    )
  }
}

function SeccionNavegable({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 16px", borderRadius: "var(--radius-md)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)" }}>
      <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>{label}</p>
      <p className="text-[15px] leading-[21px] text-[var(--color-ink)]" style={{ fontSize: 15, lineHeight: "21px", color: "var(--color-ink)" }}>{value}</p>
      <span style={{ fontSize: 16, color: "var(--color-ink-3)", alignSelf: "flex-end" }}>›</span>
    </div>
  )
}

function estadoBg(ev: string) {
  const b: Record<string, string> = {
    finalizado: "var(--color-success-soft)", en_atencion: "var(--color-warning-soft)",
    confirmado: "var(--color-info-soft)", ausente: "var(--color-danger-soft)", cancelado: "var(--color-danger-soft)",
  }
  return b[ev] ?? "var(--color-surface-muted)"
}
function estadoDot(ev: string) {
  const d: Record<string, string> = {
    finalizado: "var(--color-success)", en_atencion: "var(--color-warning)",
    confirmado: "var(--color-info)", ausente: "var(--color-danger)", cancelado: "var(--color-danger)",
  }
  return d[ev] ?? "var(--color-ink-3)"
}
function estadoText(ev: string) {
  const t: Record<string, string> = {
    finalizado: "var(--color-success)", en_atencion: "var(--color-warning)",
    confirmado: "var(--color-info)", ausente: "var(--color-danger)", cancelado: "var(--color-danger)",
  }
  return t[ev] ?? "var(--color-ink-3)"
}
function timeLabel(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
function dateLabelHumano(iso: string): string {
  const d = new Date(iso)
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} de ${months[d.getMonth()]}`
}
function origenLabel(o: string): string {
  if (o === "reserva_web") return "Reserva web"
  if (o === "presencial") return "Presencial"
  return "Recepción"
}
