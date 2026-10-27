import { useState } from "react"
import { DetailHeader } from "../../components/Headers"
import { EmptyState } from "../../components/Feedback"
import { PrimaryAction, SecondaryAction } from "../../components/Actions"
import { InputField } from "../../components/Inputs"
import {
  crearBloqueo,
  editarBloqueo,
  eliminarBloqueo,
  profesionalesActivos,
  type Bloqueo,
  type Profesional,
} from "../../state/agenda"

/* ══════════════════════════════════════════════════════════════════
   A17 — CREAR BLOQUEO
   ══════════════════════════════════════════════════════════════════ */

type CrearBloqueoViewProps = { onVolver: () => void; onGuardar: () => void }

export function CrearBloqueoView({ onVolver, onGuardar }: CrearBloqueoViewProps) {
  const [profesionalId, setProfesionalId] = useState<string>('')
  const [fecha, setFecha] = useState<string>('')
  const [horaDesde, setHoraDesde] = useState<string>('')
  const [horaHasta, setHoraHasta] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [observaciones, setObservaciones] = useState<string>('')
  const [error, setError] = useState<string | null>('')

  const pros = profesionalesActivos()

  const guardar = () => {
    setError(null)
    if (!profesionalId || !fecha || !horaDesde || !horaHasta || !motivo) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    const inicio = `${fecha}T${horaDesde}:00-03:00`
    const fin = `${fecha}T${horaHasta}:00-03:00`
    if (new Date(inicio).getTime() >= new Date(fin).getTime()) {
      setError('La hora desde debe ser anterior a la hora hasta.')
      return
    }
    const res = crearBloqueo({ profesionalId, inicio, fin, motivo, observaciones: observaciones || undefined })
    if (res.ok) onGuardar()
    else setError(res.mensaje ?? 'No se pudo crear el bloqueo.')
  }

  return (
    <>
      <DetailHeader title='Crear bloqueo' onBack={onVolver} />
      <div className='flex flex-col gap-4' style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Profesional</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pros.map((p) => (
              <button key={p.id} type='button' onClick={() => setProfesionalId(p.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${profesionalId === p.id ? 'var(--color-brand)' : 'var(--color-border-subtle)'}`,
                background: profesionalId === p.id ? 'var(--color-brand-soft)' : 'transparent',
                color: 'var(--color-ink)', width: '100%',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{p.nombre}</span>
                {profesionalId === p.id && <span style={{ fontSize: 16, color: 'var(--color-ink-3)' }}>›</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Fecha</p>
            <InputField id='bloqueo-fecha' label='Fecha' value={fecha} onChange={setFecha} type='date' />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Desde</p>
            <InputField id='bloqueo-desde' label='Desde' value={horaDesde} onChange={setHoraDesde} placeholder='HH:mm' />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Hasta</p>
            <InputField id='bloqueo-hasta' label='Hasta' value={horaHasta} onChange={setHoraHasta} placeholder='HH:mm' />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Motivo</p>
          <InputField id='bloqueo-motivo' label='Motivo' value={motivo} onChange={setMotivo} placeholder='Ej: Capacitación' />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Observaciones</p>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder='Notas opcionales' style={{
            width: '100%', minHeight: 60, borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-ink)', fontSize: 14, lineHeight: '20px', padding: '10px 14px', resize: 'vertical',
          }} />
        </div>
        {error && <p style={{ fontSize: 11, color: 'var(--color-danger)', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 20 }}>
          <SecondaryAction label='Volver' onPress={onVolver} />
          <PrimaryAction label='Guardar bloqueo' onPress={guardar} fullWidth />
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   A18 — DETALLE DE BLOQUEO
   ══════════════════════════════════════════════════════════════════ */

type DetalleBloqueoViewProps = { onVolver: () => void }

export function DetalleBloqueoView({ onVolver }: DetalleBloqueoViewProps) {
  return (
    <>
      <DetailHeader title='Detalle del bloqueo' onBack={onVolver} />
      <div className='flex flex-col gap-4' style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Franja horaria</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>09:00 – 11:00</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Fecha</p>
          <p style={{ fontSize: 15, color: 'var(--color-ink)', margin: 0 }}>Sábado 24 oct</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Profesional</p>
          <p style={{ fontSize: 15, color: 'var(--color-ink)', margin: 0 }}>Alex Martínez</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Motivo</p>
          <p style={{ fontSize: 15, color: 'var(--color-ink)', margin: 0 }}>Capacitación del equipo</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Observaciones</p>
          <p style={{ fontSize: 14, color: 'var(--color-ink-2)', margin: 0 }}>Sesión de actualización de técnicas de corte.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Estado</p>
          <span className='flex items-center gap-1.5 rounded-full shrink-0' style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: '9999px', padding: '2px 8px', background: 'var(--color-info-soft)' }}>
            <span className='shrink-0' style={{ width: 6, height: 6, borderRadius: '9999px', background: 'var(--color-info)', display: 'block' }} />
            <span className='text-[11px] leading-[15px] font-[600]' style={{ fontSize: 11, lineHeight: '15px', fontWeight: 600, color: 'var(--color-info)' }}>Activo</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className='text-[13px] leading-[18px] text-[var(--color-ink-3)] font-[600]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-3)' }}>Historial</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p className='text-[12px] leading-[16px] text-[var(--color-ink-3)]' style={{ fontSize: 12, lineHeight: '16px', color: 'var(--color-ink-3)' }}>Creado</p>
            <p className='text-[11px] leading-[15px] text-[var(--color-ink-4)]' style={{ fontSize: 11, lineHeight: '15px', color: 'var(--color-ink-4)' }}>14:00 · Bloqueo creado desde Agenda</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          <SecondaryAction label='Modificar bloqueo' onPress={() => onVolver()} fullWidth />
          <SecondaryAction label='Eliminar bloqueo' onPress={() => onVolver()} fullWidth />
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   A19 — RESOLVER TURNOS AFECTADOS (IMPACTO)
   ══════════════════════════════════════════════════════════════════ */

type ResolverImpactoViewProps = { onVolver: () => void; onConfirmar: () => void }

export function ResolverImpactoView({ onVolver, onConfirmar }: ResolverImpactoViewProps) {
  const [resueltos, setResueltos] = useState<number>(0)
  const total = 3

  return (
    <>
      <DetailHeader title='Revisar impacto' onBack={onVolver} />
      <div className='flex flex-col gap-4' style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className='text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]' style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-ink-2)' }}>Descripción del cambio</p>
          <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0 }}>'El bloqueo de 09:00 a 11:00 afecta 3 turnos programados en esa franja.'</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{resueltos} de {total} resueltos</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-3)', margin: 0 }}>Compromisos afectados</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['Juan Pérez · 09:00', 'Martín Gómez · 09:30', 'Lucas Fernández · 10:00'].map((turno, i) => (
            <button key={i} type='button' onClick={() => setResueltos(prev => Math.min(prev + 1, total))} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)',
              color: 'var(--color-ink)', width: '100%',
            }}>
              <span style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0 }}>{turno}</span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>Sin resolver</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 20 }}>
          <SecondaryAction label='Abandonar' onPress={onVolver} />
          <PrimaryAction label='Confirmar cambios' disabled={resueltos < total} onPress={onConfirmar} fullWidth />
        </div>
      </div>
    </>
  )
}
