import { useMemo, useState } from "react"
import { CalendarDays, Check, ChevronRight, Search, UserPlus } from "lucide-react"
import { BottomSheet } from "../../components/BottomSheet"
import { PrimaryAction, SecondaryAction } from "../../components/Actions"
import { DetailHeader } from "../../components/Headers"
import { InputField } from "../../components/Inputs"
import {
  CLIENTES,
  calcularDisponibilidad,
  clientePorId,
  crearReserva,
  profesionalPorId,
  profesionalesHabilitadosParaServicio,
  registrarCliente,
  servicioPorId,
  serviciosActivos,
} from "../../state/agenda"
import { AtencionPresencialView } from "./AtencionFlow"

type Draft = {
  serviceId: string
  professionalId: string
  date: string
  start: string
  end: string
  clientId: string
  notes: string
}

export function NuevoTurnoView({ fechaKey, initialClientId = "", onVolver, onConfirmado }: { fechaKey: string; initialClientId?: string; onVolver: () => void; onConfirmado: () => void }) {
  const [view, setView] = useState<"form" | "availability" | "client" | "walk-in">("form")
  const [draft, setDraft] = useState<Draft>({ serviceId: "", professionalId: "", date: fechaKey.slice(0, 10), start: "", end: "", clientId: initialClientId, notes: "" })
  const [serviceOpen, setServiceOpen] = useState(false)
  const [professionalOpen, setProfessionalOpen] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const service = servicioPorId(draft.serviceId)
  const professional = profesionalPorId(draft.professionalId)
  const client = clientePorId(draft.clientId)

  const patch = (updates: Partial<Draft>) => { setError(""); setDraft((current) => ({ ...current, ...updates })) }
  const chooseService = (id: string) => {
    const compatible = draft.professionalId && profesionalesHabilitadosParaServicio(id).some((item) => item.id === draft.professionalId)
    patch({ serviceId: id, professionalId: compatible ? draft.professionalId : "", start: "", end: "" })
    setServiceOpen(false)
  }
  const chooseProfessional = (id: string) => { patch({ professionalId: id, start: "", end: "" }); setProfessionalOpen(false) }

  const submit = () => {
    if (!draft.serviceId || !draft.professionalId || !draft.start || !draft.clientId) return setError("Completá servicio, profesional, horario y cliente")
    if (submitting) return
    setSubmitting(true)
    const result = crearReserva({ clienteId: draft.clientId, servicioId: draft.serviceId, profesionalId: draft.professionalId, inicio: draft.start, fin: draft.end, observaciones: draft.notes || undefined })
    if (!result.ok) { setSubmitting(false); setError(result.mensaje ?? "No se pudo crear el turno"); return }
    onConfirmado()
  }

  if (view === "availability") return <Availability draft={draft} onBack={() => setView("form")} onSelect={(date, start, end) => { patch({ date, start, end }); setView("form") }} />
  if (view === "client") return <ClientPicker selected={draft.clientId} onBack={() => setView("form")} onSelect={(id) => { patch({ clientId: id }); setView("form") }} />
  if (view === "walk-in") return <AtencionPresencialView onVolver={() => setView("form")} onConfirmar={onConfirmado} />

  return (
    <div className="yk-deep-page">
      <DetailHeader title="Nuevo turno" onBack={onVolver} />
      <div className="yk-deep-scroll yk-booking-form">
        <p className="yk-help">Formulario único · las selecciones abren su contexto sin perder el borrador.</p>
        <PickerField label="Servicio" value={service ? `${service.nombre} · ${service.duracionMin} min · ${money(service.precio)}` : "Seleccionar servicio"} onPress={() => setServiceOpen(true)} />
        <PickerField label="Profesional" value={professional ? professional.nombre : draft.serviceId ? "Seleccionar profesional" : "Elegí un servicio primero"} disabled={!draft.serviceId} onPress={() => setProfessionalOpen(true)} />
        <PickerField label="Fecha y horario" value={draft.start ? `${dateLabel(draft.date)} · ${timeLabel(draft.start)}–${timeLabel(draft.end)}` : "Seleccionar disponibilidad"} disabled={!draft.serviceId || !draft.professionalId} onPress={() => setView("availability")} icon={<CalendarDays size={19} />} />
        <PickerField label="Cliente" value={client?.nombre ?? "Buscar o registrar cliente"} onPress={() => setView("client")} />
        <label className="yk-textarea-field"><span>Observaciones</span><textarea placeholder="Notas opcionales" value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} /></label>
        <section className="yk-booking-summary"><h2>Resumen contextual</h2><SummaryLine label="Servicio" value={service?.nombre ?? "Pendiente"} /><SummaryLine label="Profesional" value={professional?.nombre ?? "Pendiente"} /><SummaryLine label="Horario" value={draft.start ? `${dateLabel(draft.date)} ${timeLabel(draft.start)}` : "Pendiente"} /><SummaryLine label="Cliente" value={client?.nombre ?? "Pendiente"} /></section>
        <button type="button" className="yk-walkin-action" onClick={() => setView("walk-in")}><UserPlus size={20} /><span><strong>Registrar atención presencial</strong><small>Crea una atención real, no una reserva ficticia</small></span><ChevronRight size={18} /></button>
        {error ? <p role="alert" className="yk-form-error">{error}</p> : null}
      </div>
      <div className="yk-fixed-footer"><PrimaryAction label={submitting ? "Validando…" : "Confirmar turno"} disabled={submitting} onPress={submit} fullWidth /></div>

      <BottomSheet open={serviceOpen} onClose={() => setServiceOpen(false)} title="Seleccionar servicio">
        <div className="yk-picker-list">{serviciosActivos().map((item) => <button type="button" key={item.id} onClick={() => chooseService(item.id)}><span><strong>{item.nombre}</strong><small>{item.duracionMin} min · {money(item.precio)}</small></span>{draft.serviceId === item.id ? <Check size={20} /> : <ChevronRight size={18} />}</button>)}</div>
      </BottomSheet>
      <BottomSheet open={professionalOpen} onClose={() => setProfessionalOpen(false)} title="Seleccionar profesional">
        <div className="yk-picker-list">{profesionalesHabilitadosParaServicio(draft.serviceId).map((item) => <button type="button" key={item.id} onClick={() => chooseProfessional(item.id)}><span><strong>{item.nombre}</strong><small>{item.responsabilida} · compatibilidad confirmada</small></span>{draft.professionalId === item.id ? <Check size={20} /> : <ChevronRight size={18} />}</button>)}</div>
      </BottomSheet>
    </div>
  )
}

function Availability({ draft, onBack, onSelect }: { draft: Draft; onBack: () => void; onSelect: (date: string, start: string, end: string) => void }) {
  const [date, setDate] = useState(draft.date)
  const [slot, setSlot] = useState(draft.start)
  const times = useMemo(() => calcularDisponibilidad(draft.professionalId, draft.serviceId, date), [date, draft.professionalId, draft.serviceId])
  const selected = times.find((item) => item.inicio === slot)
  return <div className="yk-deep-page"><DetailHeader title="Disponibilidad" onBack={onBack} /><div className="yk-deep-scroll"><div className="yk-context-card"><strong>{servicioPorId(draft.serviceId)?.nombre}</strong><span>{profesionalPorId(draft.professionalId)?.nombre}</span></div><InputField id="availability-date" label="Día" type="date" value={date} onChange={(value) => { setDate(value); setSlot("") }} /><h2 className="yk-section-title">Horarios disponibles</h2>{times.length ? <div className="yk-slot-grid">{times.map((item) => <button type="button" className={slot === item.inicio ? "is-selected" : ""} key={item.inicio} onClick={() => setSlot(item.inicio)}>{item.label}</button>)}</div> : <div className="yk-inline-empty"><strong>Sin opciones disponibles</strong><p>Cambiá el día o volvé para elegir otro profesional.</p></div>}</div><div className="yk-fixed-footer"><PrimaryAction label="Seleccionar horario" disabled={!selected} onPress={() => selected && onSelect(date, selected.inicio, selected.fin)} fullWidth /></div></div>
}

function ClientPicker({ selected, onBack, onSelect }: { selected: string; onBack: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [warning, setWarning] = useState("")
  const results = CLIENTES.filter((client) => client.nombre.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")) || client.telefono?.includes(query) || client.correo?.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")))
  if (creating) return <div className="yk-deep-page"><DetailHeader title="Nuevo cliente" onBack={() => setCreating(false)} /><div className="yk-deep-scroll"><InputField id="client-name" label="Nombre" value={name} onChange={(value) => { setName(value); setWarning("") }} /><InputField id="client-phone" label="Teléfono · opcional" value={phone} onChange={setPhone} /><InputField id="client-email" label="Correo · opcional" value={email} onChange={setEmail} />{warning ? <div className="yk-callout yk-callout--warning">{warning}</div> : null}</div><div className="yk-fixed-footer"><PrimaryAction label="Crear y seleccionar" disabled={!name.trim()} onPress={() => { const result = registrarCliente({ nombre: name.trim(), telefono: phone || undefined, correo: email || undefined }); if (result.duplicado) setWarning(`Coincidencia posible: ${result.cliente.nombre}. Seleccionala o revisá los datos.`); else onSelect(result.cliente.id) }} fullWidth /></div></div>
  return <div className="yk-deep-page"><DetailHeader title="Seleccionar cliente" onBack={onBack} right={<button type="button" className="yk-header-action" aria-label="Nuevo cliente" onClick={() => setCreating(true)}><UserPlus size={20} /></button>} /><div className="yk-deep-scroll"><label className="yk-inline-search"><Search size={19} /><input placeholder="Nombre, teléfono o correo" aria-label="Buscar cliente" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="yk-picker-list">{results.map((client) => <button type="button" key={client.id} onClick={() => onSelect(client.id)}><span><strong>{client.nombre}</strong><small>{client.telefono ?? client.correo ?? "Sin contacto"}</small></span>{selected === client.id ? <Check size={20} /> : <ChevronRight size={18} />}</button>)}</div>{!results.length ? <div className="yk-inline-empty"><strong>Sin resultados</strong><p>Podés registrar un cliente nuevo sin salir del borrador.</p><button type="button" onClick={() => setCreating(true)}>Nuevo cliente</button></div> : null}</div></div>
}

function PickerField({ label, value, onPress, disabled = false, icon }: { label: string; value: string; onPress: () => void; disabled?: boolean; icon?: React.ReactNode }) { return <div className="yk-picker-field"><span>{label}</span><button type="button" onClick={onPress} disabled={disabled}>{icon}<strong>{value}</strong><ChevronRight size={18} /></button></div> }
function SummaryLine({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div> }
function money(value: number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value) }
function timeLabel(iso: string) { return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(iso)) }
function dateLabel(date: string) { return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(/[.,]/g, "").toLocaleUpperCase("es") }
