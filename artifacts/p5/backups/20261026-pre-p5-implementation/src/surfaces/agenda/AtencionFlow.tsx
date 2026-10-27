import { useState } from "react"
import { DetailHeader } from "../../components/Headers"
import { EmptyState } from "../../components/Feedback"
import { PrimaryAction, SecondaryAction } from "../../components/Actions"
import { InputField } from "../../components/Inputs"
import {
  finalizarAtencion,
  iniciarAtencion,
  registrarAtencionDirecta,
  servicioPorId,
  profesionalPorId,
  clientePorId,
  type Reserva,
} from "../../state/agenda"

/* ══════════════════════════════════════════════════════════════════
   A15 — REGISTRAR ATENCIÓN
   ══════════════════════════════════════════════════════════════════ */

type RegistrarAtencionViewProps = { reserva: Reserva; onVolver: () => void; onConfirmar: () => void }

export function RegistrarAtencionView({ reserva, onVolver, onConfirmar }: RegistrarAtencionViewProps) {
  const [serviciosRealizados, setServiciosRealizados] = useState<string[]>([reserva.servicioId])
  const [observaciones, setObservaciones] = useState("")
  const [error, setError] = useState<string | null>(null)
  const sv = servicioPorId(reserva.servicioId)

  const iniciar = () => {
    setError(null)
    const res = iniciarAtencion(reserva.id)
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo iniciar la atención.")
  }

  const finalizar = () => {
    setError(null)
    const res = finalizarAtencion(reserva.id)
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo finalizar la atención.")
  }

  const registrarDirecta = () => {
    setError(null)
    const res = registrarAtencionDirecta({
      clienteId: reserva.clienteId,
      profesionalId: reserva.profesionalId,
      servicioId: reserva.servicioId,
      inicio: new Date().toISOString(),
      estado: "completada",
    })
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo registrar la atención.")
  }

  const ev = reserva.estado as any
  const yaEnCurso = ev === "en_atencion"

  return (
    <>
      <DetailHeader title="Registrar atención" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Cliente</p>
          <p style={{ fontSize: 15, color: "var(--color-ink)", margin: 0 }}>{clientePorId(reserva.clienteId)?.nombre ?? reserva.clienteId}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Servicio(s) realizados</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {serviciosActivosList().map((s) => {
              const sel = serviciosRealizados.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setServiciosRealizados(prev => sel
                      ? prev.filter((id) => id !== s.id)
                      : [...prev, s.id])
                  }}
                  style={{
                    display: "flex", alignItems: "center", padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${sel ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
                    background: sel ? "var(--color-brand-soft)" : "transparent",
                    color: "var(--color-ink)", width: "100%",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: sel ? 700 : 500, color: sel ? "var(--color-brand)" : "var(--color-ink)", margin: 0 }}>{s.nombre}</span>
                  {sel && <span style={{ fontSize: 16, color: "var(--color-ink-3)" }}>✔</span>}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Observaciones</p>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas de la atención"
            style={{
              width: "100%", minHeight: 60, borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-border)`, background: "var(--color-surface)",
              color: "var(--color-ink)", fontSize: 14, lineHeight: "20px",
              padding: "10px 14px", resize: "vertical",
            }}
          />
        </div>
        {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {yaEnCurso ? (
            <PrimaryAction label="Finalizar atención" onPress={finalizar} fullWidth />
          ) : (
            <>
              <PrimaryAction label="Iniciar atención" onPress={iniciar} fullWidth />
              <SecondaryAction label="Registrar atención completada directamente" onPress={registrarDirecta} fullWidth />
            </>
          )}
          <SecondaryAction label="Volver" onPress={onVolver} />
        </div>
      </div>
    </>
  )
}

function serviciosActivosList() {
  return [
    { id: "SV01", nombre: "Corte clásico", duracionMin: 30 },
    { id: "SV02", nombre: "Corte + barba", duracionMin: 50 },
    { id: "SV03", nombre: "Barba", duracionMin: 20 },
  ]
}

/* ══════════════════════════════════════════════════════════════════
   A16 — ATENCIÓN PRESENCIAL SIN RESERVA
   ══════════════════════════════════════════════════════════════════ */

type AtencionPresencialViewProps = { onVolver: () => void; onConfirmar: () => void }

export function AtencionPresencialView({ onVolver, onConfirmar }: AtencionPresencialViewProps) {
  const [profesionalId, setProfesionalId] = useState("ST01")
  const [servicioId, setServicioId] = useState("SV01")
  const [clienteId, setClienteId] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [error, setError] = useState<string | null>(null)

  const profesionales = [
    { id: "ST01", nombre: "Alex Martínez" },
    { id: "ST02", nombre: "Nicolás García" },
    { id: "ST03", nombre: "Leo Fernández" },
  ]

  const registrar = () => {
    setError(null)
    const res = registrarAtencionDirecta({
      clienteId: clienteId || undefined,
      profesionalId,
      servicioId,
      inicio: new Date().toISOString(),
      estado: "completada",
    })
    if (res.ok) onConfirmar()
    else setError(res.mensaje ?? "No se pudo registrar la atención.")
  }

  return (
    <>
      <DetailHeader title="Atención presencial" onBack={onVolver} />
      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Profesional</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {profesionales.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfesionalId(p.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", borderRadius: "var(--radius-md)",
                  border: `1px solid ${profesionalId === p.id ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
                  background: profesionalId === p.id ? "var(--color-brand-soft)" : "transparent",
                  color: "var(--color-ink)", width: "100%",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>{p.nombre}</span>
                {profesionalId === p.id && <span style={{ fontSize: 16, color: "var(--color-ink-3)" }}>›</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Servicio</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {serviciosActivosList().map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServicioId(s.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", borderRadius: "var(--radius-md)",
                  border: `1px solid ${servicioId === s.id ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
                  background: servicioId === s.id ? "var(--color-brand-soft)" : "transparent",
                  color: "var(--color-ink)", width: "100%",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>{s.nombre}</span>
                {servicioId === s.id && <span style={{ fontSize: 16, color: "var(--color-ink-3)" }}>›</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Cliente (opcional)</p>
          <InputField id="cliente-presencial" label="Nombre del cliente" value={clienteId} onChange={setClienteId} placeholder="Ej: Juan Pérez" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}>Observaciones</p>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas de la atención"
            style={{
              width: "100%", minHeight: 60, borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-border)`, background: "var(--color-surface)",
              color: "var(--color-ink)", fontSize: 14, lineHeight: "20px",
              padding: "10px 14px", resize: "vertical",
            }}
          />
        </div>
        {error && <p style={{ fontSize: 11, color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
          <SecondaryAction label="Volver" onPress={onVolver} />
          <PrimaryAction label="Registrar atención" onPress={registrar} fullWidth />
        </div>
      </div>
    </>
  )
}
