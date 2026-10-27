import { useState } from "react"
import { DetailHeader } from "../../components/Headers"
import { EmptyState } from "../../components/Feedback"
import { PrimaryAction, SecondaryAction } from "../../components/Actions"
import { InputField } from "../../components/Inputs"
import {
  cancelarReserva,
  editarReserva,
  profesionalPorId,
  registrarInasistencia,
  servicioPorId,
  clientePorId,
  estadoVisibleReserva,
  turnoEstadoLabel,
  type Reserva,
} from "../../state/agenda"

/* ══════════════════════════════════════════════════════════════════
   A12 — EDITAR TURNO
   ══════════════════════════════════════════════════════════════════ */

type EditarTurnoViewProps = { reserva: Reserva; onVolver: () => void; onGuardar: () => void }

export function EditarTurnoView({ reserva, onVolver, onGuardar }: EditarTurnoViewProps) {
  const [obs, setObs] = useState(reserva.observaciones ?? "")
  const [error, setError] = useState<string | null>(null)
  const sv = servicioPorId(reserva.servicioId)
  const prof = profesionalPorId(reserva.profesionalId)
  const cli = clientePorId(reserva.clienteId)
  const ev = estadoVisibleReserva(reserva)

  const puedeEditar = ev !== "ausente" && ev !== "cancelado" && ev !== "finalizado"

  const guardar = () => {
    setError(null)
    const res = editarReserva(reserva.id, { observaciones: obs || undefined })
    if (res.ok) onGuardar()
    else setError(res.mensaje ?? "No se pudo guardar.")
  }

  return (
    <>
      <DetailHeader title="Editar turno" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Observaciones</p>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Notas opcionales"
            style={{
              width: "100%", minHeight: 80, borderRadius: "var(--radius-md)",
              border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
              background: "var(--color-surface)", color: "var(--color-ink)",
              fontSize: 14, lineHeight: "20px", padding: "10px 14px", resize: "vertical",
            }}
          />
          {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>Cliente</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{cli?.nombre ?? reserva.clienteId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>Profesional</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{prof?.nombre ?? reserva.profesionalId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>Servicio</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{sv?.nombre ?? reserva.servicioId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>Estado actual</p>
          <span className="flex items-center gap-1.5 rounded-full shrink-0" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: "9999px", padding: "2px 8px", background: estadoBg(ev) }}>
            <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: "9999px", background: estadoDot(ev), display: "block" }} />
            <span className="text-[11px] leading-[15px] font-[600]" style={{ fontSize: 11, lineHeight: "15px", fontWeight: 600, color: estadoText(ev) }}>{turnoEstadoLabel(ev)}</span>
          </span>
        </div>
        {!puedeEditar && (
          <p style={{ fontSize: 12, color: "var(--color-ink-4)", margin: 0 }}>Este turno no se puede editar en su estado actual.</p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
          <SecondaryAction label="Volver" onPress={onVolver} />
          <PrimaryAction label="Guardar cambios" disabled={!puedeEditar || obs === (reserva.observaciones ?? "")} onPress={guardar} fullWidth />
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   A13 — REPROGRAMAR TURNO
   ══════════════════════════════════════════════════════════════════ */

type ReprogramarTurnoViewProps = { reserva: Reserva; onVolver: () => void; onConfirmar: () => void }

export function ReprogramarTurnoView({ reserva, onVolver, onConfirmar }: ReprogramarTurnoViewProps) {
  const [error, setError] = useState<string | null>(null)
  const [nuevaHora, setNuevaHora] = useState(timeLabel(reserva.inicio))
  const sv = servicioPorId(reserva.servicioId)
  const prof = profesionalPorId(reserva.profesionalId)

  const reprogramar = () => {
    setError(null)
    // En este prototipo simulamos reprogramar manteniendo el mismo día
    const res = editarReserva(reserva.id, {
      inicio: `${fechaKey(reserva.inicio)}T${nuevaHora}:00-03:00`,
      fin: `${fechaKey(reserva.inicio)}T${sumarMinutos(nuevaHora, sv?.duracionMin ?? 30)}:00-03:00`,
    })
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo reprogramar.")
  }

  return (
    <>
      <DetailHeader title="Reprogramar" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Turno actual</p>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderRadius: "var(--radius-md)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)" }}>
            <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Fecha y hora</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{timeLabel(reserva.inicio)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderRadius: "var(--radius-md)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)" }}>
            <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Profesional</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{prof?.nombre ?? reserva.profesionalId}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Nueva hora</p>
          <InputField id="nueva-hora" label="Hora" value={nuevaHora} onChange={setNuevaHora} placeholder="HH:mm" />
          {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[600] uppercase" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>Servicio y cliente se mantienen</p>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>{sv?.nombre ?? reserva.servicioId}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
          <SecondaryAction label="Volver" onPress={onVolver} />
          <PrimaryAction label="Confirmar reprogramación" onPress={reprogramar} fullWidth />
        </div>
      </div>
    </>
  )
}

function fechaKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function sumarMinutos(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + min
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`
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

/* ══════════════════════════════════════════════════════════════════
   A14 — CANCELAR TURNO
   ══════════════════════════════════════════════════════════════════ */

type CancelarTurnoViewProps = { reserva: Reserva; onVolver: () => void; onConfirmar: () => void }

export function CancelarTurnoView({ reserva, onVolver, onConfirmar }: CancelarTurnoViewProps) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const sv = servicioPorId(reserva.servicioId)
  const prof = profesionalPorId(reserva.profesionalId)
  const cli = clientePorId(reserva.clienteId)
  const ev = estadoVisibleReserva(reserva)

  const puedeCancelar = ev !== "ausente" && ev !== "cancelado" && ev !== "finalizado"

  const confirmar = () => {
    setError(null)
    if (!puedeCancelar) {
      setError("No se puede cancelar este turno.")
      return
    }
    const res = cancelarReserva(reserva.id, motivo || undefined)
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo cancelar.")
  }

  return (
    <>
      <DetailHeader title="Cancelar turno" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Cliente</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>{cli?.nombre ?? reserva.clienteId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Fecha y hora</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{timeLabel(reserva.inicio)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Servicio y profesional</p>
          <p style={{ fontSize: 14, color: "var(--color-ink)", margin: 0 }}>{sv?.nombre ?? reserva.servicioId} · {prof?.nombre ?? reserva.profesionalId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Motivo</p>
          <InputField id="motivo-cancelacion" label="Motivo (opcional)" value={motivo} onChange={setMotivo} placeholder="Ej: cliente no se presentó" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>Al confirmar, el estado pasará a cancelado y se registrará en el historial.</p>
          {!puedeCancelar && <p style={{ fontSize: 12, color: "var(--color-danger)", margin: 0 }}>Este turno no se puede cancelar en su estado actual.</p>}
        </div>
        {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
          <SecondaryAction label="Volver" onPress={onVolver} />
          <PrimaryAction label="Confirmar cancelación" disabled={!puedeCancelar} onPress={confirmar} fullWidth />
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   A14 — REGISTRAR INASISTENCIA
   ══════════════════════════════════════════════════════════════════ */

type AusenciaTurnoViewProps = { reserva: Reserva; onVolver: () => void; onConfirmar: () => void }

export function AusenciaTurnoView({ reserva, onVolver, onConfirmar }: AusenciaTurnoViewProps) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const sv = servicioPorId(reserva.servicioId)
  const prof = profesionalPorId(reserva.profesionalId)
  const cli = clientePorId(reserva.clienteId)
  const ev = estadoVisibleReserva(reserva)

  const puedeAusente = ev === "confirmado"

  const confirmar = () => {
    setError(null)
    if (!puedeAusente) {
      setError("Solo se puede registrar inasistencia en turnos confirmados.")
      return
    }
    const res = registrarInasistencia(reserva.id, motivo || undefined)
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo registrar la inasistencia.")
  }

  return (
    <>
      <DetailHeader title="Registrar inasistencia" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Cliente</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>{cli?.nombre ?? reserva.clienteId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Fecha y hora</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{timeLabel(reserva.inicio)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Estado actual</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{turnoEstadoLabel(ev)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Motivo</p>
          <InputField id="motivo-inasistencia" label="Motivo" value={motivo} onChange={setMotivo} placeholder="Ej: no asistió" />
        </div>
        {!puedeAusente && <p style={{ fontSize: 12, color: "var(--color-danger)", margin: 0 }}>La inasistencia solo se aplica a turnos confirmados.</p>}
        {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
          <SecondaryAction label="Volver" onPress={onVolver} />
          <PrimaryAction label="Registrar inasistencia" disabled={!puedeAusente} onPress={confirmar} fullWidth />
        </div>
      </div>
    </>
  )
}
