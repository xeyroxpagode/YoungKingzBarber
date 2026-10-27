import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react"
import { BottomSheet } from "../../components/BottomSheet"
import { DetailHeader, RootHeader } from "../../components/Headers"
import { InputField } from "../../components/Inputs"
import { PrimaryAction, SecondaryAction, StatusIndicator } from "../../components/Actions"
import { SegmentedControl } from "../../components/SegmentedControl"
import { clientePorId, servicioPorId } from "../../state/agenda"
import {
  activeAgreement,
  activityFor,
  addException,
  addStaff,
  agreementsFor,
  createAgreement,
  exceptionsFor,
  linkAccount,
  listStaff,
  money,
  registerPayment,
  settlementById,
  settlementsFor,
  staffById,
  toggleAccount,
  updateStaff,
  type AgreementKind,
  type ScheduleDay,
  type StaffMember,
  type StaffRole,
} from "../../state/staff"

type PersonalPage =
  | "directory"
  | "new"
  | "profile"
  | "edit"
  | "schedule"
  | "exceptions"
  | "services"
  | "activity-detail"
  | "agreement"
  | "agreement-edit"
  | "agreement-review"
  | "agreements-history"
  | "settlements"
  | "settlement"
  | "operations"
  | "payment"
  | "access"
  | "permissions"
  | "responsibilities"
  | "deactivate"
  | "link-account"

type FilterState = {
  status: "todos" | "activos" | "inactivos"
  role: "todas" | StaffRole
  order: "az" | "za" | "recent"
}

const DEFAULT_FILTERS: FilterState = { status: "todos", role: "todas", order: "az" }

export function PersonalSurface({
  onSelectAgenda,
  onDepthChange,
  onNavigateFinance,
}: {
  onSelectAgenda: () => void
  onDepthChange?: (deep: boolean) => void
  onNavigateFinance?: (surface: "F27" | "F28", originId: string) => void
}) {
  const [page, setPage] = useState<PersonalPage>("directory")
  const [selectedId, setSelectedId] = useState("ST01")
  const [profileTab, setProfileTab] = useState("resumen")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedSettlementId, setSelectedSettlementId] = useState("")
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const [agreementDraft, setAgreementDraft] = useState<{
    kind: AgreementKind
    amount: string
    percentage: string
    frequency: "semanal" | "mensual"
    collection: "barberia" | "profesional"
  }>({ kind: "comision", amount: "", percentage: "60", frequency: "semanal", collection: "barberia" })

  const deep = page !== "directory"
  useEffect(() => onDepthChange?.(deep), [deep, onDepthChange])
  useEffect(() => () => onDepthChange?.(false), [onDepthChange])

  const refresh = (message?: string) => {
    setRevision((value) => value + 1)
    if (message) {
      setNotice(message)
      window.setTimeout(() => setNotice(null), 2600)
    }
  }

  const member = staffById(selectedId)
  if (page !== "directory" && page !== "new" && !member) {
    return <EmptyPanel title="Integrante no encontrado" onBack={() => setPage("directory")} />
  }

  const navigate = (next: PersonalPage) => {
    setPage(next)
  }

  const screen = (() => {
    switch (page) {
      case "directory": return renderDirectory()
      case "new": return <NewMember onBack={() => navigate("directory")} onCreated={(id) => { setSelectedId(id); refresh("Integrante creado sin cuenta, jornada ni acuerdo automático"); navigate("profile") }} />
      case "profile": return renderProfile(member!)
      case "edit": return <EditIdentity member={member!} onBack={() => navigate("profile")} onSaved={() => { refresh("Identidad actualizada"); navigate("profile") }} />
      case "schedule": return <ScheduleEditor member={member!} onBack={() => navigate("profile")} onSaved={() => refresh("Jornada actualizada")} onExceptions={() => navigate("exceptions")} />
      case "exceptions": return <Exceptions member={member!} onBack={() => navigate("schedule")} onSaved={() => refresh("Excepción registrada con trazabilidad")} />
      case "services": return <ServicesEditor member={member!} onBack={() => navigate("profile")} onSaved={() => { refresh("Servicios actualizados"); navigate("profile") }} />
      case "activity-detail": return <ActivityDetail member={member!} activityId={selectedActivityId} onBack={() => navigate("profile")} />
      case "agreement": return <AgreementDetail member={member!} onBack={() => navigate("profile")} onEdit={() => navigate("agreement-edit")} onHistory={() => navigate("agreements-history")} />
      case "agreement-edit": return <AgreementEditor member={member!} value={agreementDraft} onChange={setAgreementDraft} onBack={() => navigate("agreement")} onReview={() => navigate("agreement-review")} />
      case "agreement-review": return <AgreementReview member={member!} draft={agreementDraft} onBack={() => navigate("agreement-edit")} onConfirm={() => { createAgreement({ staffId: member!.id, kind: agreementDraft.kind, amount: Number(agreementDraft.amount) || undefined, percentage: Number(agreementDraft.percentage) || undefined, frequency: agreementDraft.frequency, collection: agreementDraft.collection, validFrom: agreementDraft.frequency === "semanal" ? "2026-10-26" : "2026-11-01" }); refresh("Nueva versión programada; el histórico permanece intacto"); navigate("agreement") }} />
      case "agreements-history": return <AgreementsHistory member={member!} onBack={() => navigate("agreement")} />
      case "settlements": return <Settlements member={member!} onBack={() => navigate("profile")} onOpen={(id) => { setSelectedSettlementId(id); navigate("settlement") }} />
      case "settlement": return <SettlementDetail member={member!} settlementId={selectedSettlementId} onBack={() => navigate("settlements")} onOperations={() => navigate("operations")} onPayment={() => navigate("payment")} onFinance={() => onNavigateFinance?.(selectedSettlementId.startsWith("OBL-") ? "F28" : "F27", selectedSettlementId)} />
      case "operations": return <Operations settlementId={selectedSettlementId} onBack={() => navigate("settlement")} />
      case "payment": return <Payment member={member!} settlementId={selectedSettlementId} onBack={() => navigate("settlement")} onSaved={() => { refresh("Pago registrado sin afectar efectivo"); navigate("settlement") }} />
      case "access": return <Access member={member!} onBack={() => navigate("profile")} onPermissions={() => navigate("permissions")} onResponsibilities={() => navigate("responsibilities")} onAccount={() => { if (member!.account.status === "sin_cuenta") navigate("link-account"); else { const wasEnabled = member!.account.status === "habilitada"; toggleAccount(member!.id); refresh(wasEnabled ? "Cuenta suspendida; las reservas se conservan" : "Cuenta reactivada") } }} onDeactivate={() => navigate("deactivate")} />
      case "permissions": return <Permissions member={member!} onBack={() => navigate("access")} onSaved={() => { refresh("Permisos aplicados después de la revisión"); navigate("access") }} />
      case "responsibilities": return <Responsibilities member={member!} onBack={() => navigate("access")} onSaved={() => { refresh("Responsabilidades actualizadas"); navigate("access") }} />
      case "deactivate": return <Deactivate member={member!} onBack={() => navigate("access")} onSaved={() => { refresh(member!.status === "activo" ? "Integrante desactivado; el historial se conserva" : "Integrante reactivado sin disponibilidad ficticia"); navigate("profile") }} />
      case "link-account": return <LinkAccount member={member!} onBack={() => navigate("access")} onSaved={() => { refresh("Cuenta demo vinculada; no se enviaron credenciales"); navigate("access") }} />
    }
  })()

  return (
    <section className={`team-screen ${deep ? "team-screen--deep" : ""}`} data-page={page} data-revision={revision}>
      {screen}
      {notice ? <div role="status" className="yk-toast">{notice}</div> : null}
    </section>
  )

  function renderDirectory() {
    const members = listStaff()
      .filter((item) => {
        const q = query.trim().toLocaleLowerCase("es")
        const matchQuery = !q || item.name.toLocaleLowerCase("es").includes(q) || item.roles.join(" ").toLocaleLowerCase("es").includes(q) || item.email?.toLocaleLowerCase("es").includes(q)
        const matchStatus = filters.status === "todos" || (filters.status === "activos" ? item.status === "activo" : item.status === "inactivo")
        const matchRole = filters.role === "todas" || item.roles.includes(filters.role)
        return matchQuery && matchStatus && matchRole
      })
      .sort((a, b) => {
        if (filters.status === "todos" && a.status !== b.status) return a.status === "activo" ? -1 : 1
        if (filters.order === "recent") return b.joinedAt.localeCompare(a.joinedAt)
        const value = a.name.localeCompare(b.name, "es")
        return filters.order === "za" ? -value : value
      })

    return (
      <>
        <RootHeader title="Equipo" />
        <div className="yk-context-switch">
          <SegmentedControl options={[{ id: "agenda", label: "Agenda" }, { id: "personal", label: "Personal" }]} value="personal" onChange={(id) => id === "agenda" && onSelectAgenda()} />
        </div>
        <div className="yk-toolbar">
          <label className="yk-inline-search">
            <Search size={19} aria-hidden />
            <input aria-label="Buscar personal" placeholder="Buscar personal" value={query} onChange={(event) => setQuery(event.target.value)} />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">×</button> : null}
          </label>
          <button className={`yk-icon-button ${filters !== DEFAULT_FILTERS ? "is-active" : ""}`} type="button" aria-label="Filtrar personal" onClick={() => setFiltersOpen(true)}><Settings2 size={20} /></button>
          <button className="yk-icon-button yk-icon-button--primary" type="button" aria-label="Nuevo integrante" onClick={() => navigate("new")}><Plus size={21} /></button>
        </div>
        <div className="yk-list-heading"><span>{query ? "Resultados" : "Personal"}</span><small>{members.length} integrante{members.length === 1 ? "" : "s"}</small></div>
        <div className="yk-list" data-testid="staff-directory">
          {members.length ? members.map((item) => (
            <button key={item.id} type="button" className="yk-person-row" onClick={() => { setSelectedId(item.id); setProfileTab("resumen"); navigate("profile") }}>
              <Avatar member={item} />
              <span className="yk-person-copy"><strong>{item.name}</strong><small>{item.roles.join(" · ")}</small></span>
              <span className={`yk-text-status ${item.status === "activo" ? "is-success" : "is-muted"}`}>{item.status === "activo" ? "Activo" : "Inactivo"}</span>
              <ChevronRight size={18} aria-hidden />
            </button>
          )) : <div className="yk-empty"><UserRound size={30} /><strong>Sin coincidencias</strong><p>Probá otra búsqueda o restablecé los filtros.</p><button type="button" onClick={() => { setQuery(""); setFilters(DEFAULT_FILTERS) }}>Restablecer</button></div>}
        </div>
        <PersonalFilters open={filtersOpen} value={filters} onClose={() => setFiltersOpen(false)} onApply={(next) => { setFilters(next); setFiltersOpen(false) }} />
      </>
    )
  }

  function renderProfile(current: StaffMember) {
    const activity = activityFor(current.id)
    const agreement = activeAgreement(current.id)
    const settlements = settlementsFor(current.id)
    return (
      <>
        <DetailHeader title="Perfil" onBack={() => navigate("directory")} right={<button className="yk-header-action" type="button" aria-label="Más acciones"><MoreHorizontal size={21} /></button>} />
        <div className="yk-profile-identity">
          <Avatar member={current} large />
          <h1>{current.name}</h1>
          <div className="yk-profile-meta"><span>{current.roles.join(" · ")}</span><StatusIndicator label={current.status === "activo" ? "Activo" : "Inactivo"} tone={current.status === "activo" ? "success" : "neutral"} size="small" /></div>
        </div>
        <div className="yk-profile-actions"><SecondaryAction label="Ver agenda" onPress={onSelectAgenda} fullWidth /><SecondaryAction label="Editar" onPress={() => navigate("edit")} fullWidth /></div>
        <div className="yk-profile-tabs"><SegmentedControl fullWidth options={[{ id: "resumen", label: "Resumen" }, { id: "actividad", label: "Actividad" }, { id: "economia", label: "Economía" }]} value={profileTab} onChange={setProfileTab} /></div>
        <div className="yk-profile-content">
          {profileTab === "resumen" ? (
            <>
              <SectionTitle>Configuración profesional</SectionTitle>
              <NavRow icon={<Clock3 />} title="Jornada habitual" value={current.schedule.find((day) => day.day === "Sábado")?.bands[0] ? "Sáb 09:00–19:00" : "Sin configurar"} onPress={() => navigate("schedule")} />
              {current.roles.includes("Barbero") ? <NavRow icon={<Settings2 />} title="Servicios habilitados" value={`${current.enabledServices.length} servicios`} onPress={() => navigate("services")} /> : null}
              <NavRow icon={<CalendarDays />} title="Ausencias y excepciones" value={`${exceptionsFor(current.id).filter((item) => item.status === "vigente").length} vigentes`} onPress={() => navigate("exceptions")} />
              <SectionTitle>Administración</SectionTitle>
              <NavRow icon={<ShieldCheck />} title="Acceso y responsabilidades" value={accountLabel(current)} onPress={() => navigate("access")} />
            </>
          ) : profileTab === "actividad" ? (
            <>
              <HeroValue eyebrow="24 de octubre" value={String(activity.length)} label="atenciones realizadas" />
              <SectionTitle>Servicios realizados</SectionTitle>
              {serviceBreakdown(activity).map(([label, total]) => <DataRow key={label} label={label} value={String(total)} />)}
              <SectionTitle>Actividad reciente</SectionTitle>
              {activity.length ? activity.map((entry) => (
                <button className="yk-activity-row" type="button" key={entry.id} onClick={() => { setSelectedActivityId(entry.id); navigate("activity-detail") }}><span><strong>{entry.serviceNames.join(" + ")}</strong><small>{clientePorId(entry.clientId ?? "")?.nombre ?? "Atención presencial"}</small></span><span>{formatTime(entry.inicio)}</span><ChevronRight size={18} /></button>
              )) : <InlineEmpty title="Sin atenciones realizadas" body="Las ausencias y reservas no cuentan como actividad." />}
            </>
          ) : (
            <>
              {!agreement ? <InlineEmpty title="Sin acuerdo configurado" body="Este integrante todavía no tiene una regla económica vigente." action="Configurar acuerdo" onAction={() => navigate("agreement-edit")} /> : <EconomySummary member={current} onAgreement={() => navigate("agreement")} onSettlements={() => navigate("settlements")} />}
              {agreement && settlements.length === 0 ? <InlineEmpty title="Sin liquidaciones" body="No hay períodos económicos para consultar." /> : null}
            </>
          )}
        </div>
      </>
    )
  }
}

function PersonalFilters({ open, value, onClose, onApply }: { open: boolean; value: FilterState; onClose: () => void; onApply: (value: FilterState) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { if (open) setDraft(value) }, [open, value])
  return <BottomSheet open={open} onClose={onClose} title="Filtrar personal"><div className="yk-sheet-stack">
    <ChoiceGroup label="Estado" options={["todos", "activos", "inactivos"]} value={draft.status} onChange={(status) => setDraft({ ...draft, status: status as FilterState["status"] })} />
    <ChoiceGroup label="Responsabilidad" options={["todas", "Barbero", "Recepción"]} value={draft.role} onChange={(role) => setDraft({ ...draft, role: role as FilterState["role"] })} />
    <ChoiceGroup label="Orden" options={["az", "za", "recent"]} labels={{ az: "Nombre A–Z", za: "Nombre Z–A", recent: "Incorporación reciente" }} value={draft.order} onChange={(order) => setDraft({ ...draft, order: order as FilterState["order"] })} />
    <div className="yk-sheet-actions"><SecondaryAction label="Restablecer" onPress={() => setDraft(DEFAULT_FILTERS)} fullWidth /><PrimaryAction label="Aplicar" onPress={() => onApply(draft)} fullWidth /></div>
  </div></BottomSheet>
}

function NewMember({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [error, setError] = useState("")
  const submit = () => {
    if (!name.trim()) return setError("Ingresá el nombre")
    if (!roles.length) return setError("Elegí al menos una responsabilidad")
    const result = addStaff({ name: name.trim(), phone: phone || undefined, email: email || undefined, roles })
    if (!result.ok) return setError(`Posible duplicado: ${result.duplicate?.name}`)
    onCreated(result.member!.id)
  }
  return <DeepPage title="Nuevo integrante" onBack={onBack} footer={<PrimaryAction label="Crear integrante" onPress={submit} fullWidth />}>
    <FormIntro title="Identidad y responsabilidades" body="La cuenta, la jornada, los servicios y el acuerdo se configuran por separado." />
    <InputField id="new-name" label="Nombre" value={name} onChange={setName} placeholder="Nombre completo" error={error.includes("nombre") ? error : undefined} />
    <InputField id="new-phone" label="Teléfono · opcional" value={phone} onChange={setPhone} placeholder="+54 9 11…" />
    <InputField id="new-email" label="Correo · opcional" value={email} onChange={setEmail} placeholder="nombre@correo.com" type="email" />
    <CheckboxGroup label="Responsabilidades" options={["Barbero", "Recepción"]} values={roles} onChange={(value) => { setError(""); setRoles(value as StaffRole[]) }} />
    {error && !error.includes("nombre") ? <FormError>{error}</FormError> : null}
  </DeepPage>
}

function EditIdentity({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const [name, setName] = useState(member.name)
  const [phone, setPhone] = useState(member.phone ?? "")
  const [email, setEmail] = useState(member.email ?? "")
  const dirty = name !== member.name || phone !== (member.phone ?? "") || email !== (member.email ?? "")
  return <DeepPage title="Editar identidad" onBack={onBack} footer={<PrimaryAction label="Guardar cambios" disabled={!dirty || !name.trim()} onPress={() => { updateStaff(member.id, { name, phone, email }); onSaved() }} fullWidth />}>
    <InputField id="edit-name" label="Nombre" value={name} onChange={setName} />
    <InputField id="edit-phone" label="Teléfono" value={phone} onChange={setPhone} />
    <InputField id="edit-email" label="Correo" value={email} onChange={setEmail} type="email" />
    <p className="yk-help">Las responsabilidades se administran desde Acceso y responsabilidades.</p>
  </DeepPage>
}

function ScheduleEditor({ member, onBack, onSaved, onExceptions }: { member: StaffMember; onBack: () => void; onSaved: () => void; onExceptions: () => void }) {
  const [days, setDays] = useState<ScheduleDay[]>(member.schedule.map((day) => ({ ...day, bands: day.bands.map((band) => ({ ...band })) })))
  const [editing, setEditing] = useState<number | null>(null)
  const [timeDraft, setTimeDraft] = useState({ from: "09:00", to: "19:00" })
  const [error, setError] = useState("")
  const saveTime = () => {
    if (editing === null) return
    if (timeDraft.from >= timeDraft.to) return setError("La hora Desde debe ser anterior a Hasta")
    setDays((current) => current.map((day, index) => index === editing ? { ...day, closed: false, bands: [{ id: `${day.day}-1`, ...timeDraft }] } : day))
    setEditing(null); setError("")
  }
  return <DeepPage title="Jornada" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Guardar jornada" onPress={() => { updateStaff(member.id, { schedule: days }); onSaved() }} fullWidth />}>
    <FormIntro title="Horario habitual" body="Las excepciones sustituyen la recurrencia sin reescribirla." />
    <div className="yk-schedule-list">{days.map((day, index) => <div className="yk-schedule-row" key={day.day}><strong>{day.day}</strong>{day.closed ? <span className="yk-muted">Cerrado</span> : <button type="button" onClick={() => { setTimeDraft(day.bands[0] ?? { from: "09:00", to: "19:00" }); setEditing(index) }}>{day.bands.map((band) => `${band.from}–${band.to}`).join(" · ")}</button>}<label className="yk-switch"><input type="checkbox" checked={!day.closed} onChange={(event) => setDays((current) => current.map((entry, currentIndex) => currentIndex === index ? { ...entry, closed: !event.target.checked, bands: event.target.checked && !entry.bands.length ? [{ id: `${entry.day}-1`, from: "09:00", to: "19:00" }] : entry.bands } : entry))} /><span /></label></div>)}</div>
    <SectionTitle>Ausencias y excepciones</SectionTitle>
    <NavRow icon={<CalendarDays />} title="Administrar excepciones" value={`${exceptionsFor(member.id).length} registradas`} onPress={onExceptions} />
    <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title="Editar franja"><div className="yk-time-editor"><p>{editing === null ? "" : days[editing].day} · {member.name}</p><label>Desde<input type="time" value={timeDraft.from} onChange={(event) => setTimeDraft({ ...timeDraft, from: event.target.value })} /></label><label>Hasta<input type="time" value={timeDraft.to} onChange={(event) => setTimeDraft({ ...timeDraft, to: event.target.value })} /></label>{error ? <FormError>{error}</FormError> : null}<div className="yk-sheet-actions"><SecondaryAction label="Cancelar" onPress={() => setEditing(null)} fullWidth /><PrimaryAction label="Guardar" onPress={saveTime} fullWidth /></div></div></BottomSheet>
  </DeepPage>
}

function Exceptions({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(false)
  const [type, setType] = useState<"ausencia" | "horario_especial">("ausencia")
  const [from, setFrom] = useState("2026-10-26")
  const [to, setTo] = useState("2026-10-26")
  const [reason, setReason] = useState("")
  const entries = exceptionsFor(member.id)
  return <DeepPage title="Excepciones" subtitle={member.name} onBack={onBack} right={<button className="yk-header-action" aria-label="Nueva excepción" onClick={() => setForm(true)}><Plus size={20} /></button>}>
    {form ? <div className="yk-form-block"><ChoiceGroup label="Tipo" options={["ausencia", "horario_especial"]} labels={{ ausencia: "Registrar ausencia", horario_especial: "Horario especial" }} value={type} onChange={(value) => setType(value as typeof type)} /><InputField id="ex-from" label="Desde" type="date" value={from} onChange={setFrom} /><InputField id="ex-to" label="Hasta" type="date" value={to} onChange={setTo} /><InputField id="ex-reason" label="Motivo" value={reason} onChange={setReason} placeholder="Motivo obligatorio" /><PrimaryAction label="Revisar conflictos" disabled={!reason || from > to} onPress={() => { addException({ staffId: member.id, type, from, to, reason }); setForm(false); onSaved() }} fullWidth /></div> : null}
    <SectionTitle>Historial</SectionTitle>
    {entries.length ? entries.map((entry) => <div className="yk-detail-list-row" key={entry.id}><span><strong>{entry.type === "ausencia" ? "Ausencia" : "Horario especial"}</strong><small>{entry.from.slice(0, 10)} → {entry.to.slice(0, 10)}</small><small>{entry.reason}</small></span><StatusIndicator label={entry.status === "vigente" ? "Vigente" : "Cancelada"} tone={entry.status === "vigente" ? "info" : "neutral"} size="small" /></div>) : <InlineEmpty title="Sin excepciones" body="La jornada habitual se aplica sin sustituciones." />}
  </DeepPage>
}

function ServicesEditor({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const catalog = ["SV01", "SV02", "SV03"]
  const [enabled, setEnabled] = useState([...member.enabledServices])
  const [durations, setDurations] = useState({ ...member.customDurations })
  return <DeepPage title="Servicios habilitados" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Guardar cambios" onPress={() => { updateStaff(member.id, { enabledServices: enabled, customDurations: durations }); onSaved() }} fullWidth />}>
    <p className="yk-help">El catálogo es compartido. Una duración particular sólo aplica a este profesional.</p>
    {catalog.map((id) => { const service = servicioPorId(id)!; const checked = enabled.includes(id); return <div className="yk-service-row" key={id}><label><input type="checkbox" checked={checked} onChange={(event) => setEnabled((current) => event.target.checked ? [...current, id] : current.filter((value) => value !== id))} /><span><strong>{service.nombre}</strong><small>{service.duracionMin} min · {money(service.precio)}</small></span></label>{checked ? <label className="yk-duration">Duración<input aria-label={`Duración particular ${service.nombre}`} type="number" min="15" step="5" value={durations[id] ?? service.duracionMin} onChange={(event) => setDurations({ ...durations, [id]: Number(event.target.value) })} /></label> : null}</div> })}
  </DeepPage>
}

function ActivityDetail({ member, activityId, onBack }: { member: StaffMember; activityId: string; onBack: () => void }) {
  const activity = activityFor(member.id).find((entry) => entry.id === activityId)
  if (!activity) return <EmptyPanel title="Atención no encontrada" onBack={onBack} />
  return <DeepPage title="Detalle de atención" onBack={onBack}><HeroValue eyebrow="Prestación efectiva" value={formatTime(activity.inicio)} label={activity.serviceNames.join(" + ")} /><SectionTitle>Información</SectionTitle><DataRow label="Profesional" value={member.name} /><DataRow label="Cliente" value={clientePorId(activity.clientId ?? "")?.nombre ?? "Sin cliente"} /><DataRow label="Reserva vinculada" value={activity.linkedReservation ?? "Atención presencial"} /><DataRow label="Estado" value="Completada" /><SectionTitle>Historial</SectionTitle><DataRow label="Registro" value={activity.id} /></DeepPage>
}

function EconomySummary({ member, onAgreement, onSettlements }: { member: StaffMember; onAgreement: () => void; onSettlements: () => void }) {
  const agreement = activeAgreement(member.id)!
  const current = settlementsFor(member.id)[0]
  const protagonist = agreement.kind === "comision" ? current?.total ?? 0 : current?.due ?? agreement.amount ?? 0
  const label = agreement.kind === "comision" ? "Comisión calculada" : agreement.kind === "alquiler" ? "Pendiente de cobro" : "Obligación del período"
  return <><HeroValue eyebrow={current?.period ?? "Período actual"} value={money(protagonist)} label={label} /><SectionTitle>Acuerdo vigente</SectionTitle><NavRow icon={<WalletCards />} title={agreementLabel(agreement.kind)} value={agreement.percentage ? `${agreement.percentage}% · ${agreement.frequency}` : `${money(agreement.amount ?? 0)} · ${agreement.frequency}`} onPress={onAgreement} /><DataRow label="Recaudación" value={agreement.collection === "profesional" ? "Profesional" : "Barbería"} />{current ? <><DataRow label="Base elegible" value={money(current.base)} /><DataRow label="Estado" value={settlementStatus(current.status)} /><NavRow icon={<ArrowRight />} title="Liquidaciones" value={`${settlementsFor(member.id).length} períodos`} onPress={onSettlements} /></> : null}</>
}

function AgreementDetail({ member, onBack, onEdit, onHistory }: { member: StaffMember; onBack: () => void; onEdit: () => void; onHistory: () => void }) {
  const agreement = activeAgreement(member.id)
  return <DeepPage title="Acuerdo" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label={agreement ? "Modificar acuerdo" : "Configurar acuerdo"} onPress={onEdit} fullWidth />}>
    {agreement ? <><HeroValue eyebrow="Modalidad" value={agreementLabel(agreement.kind)} label={agreement.status} /><SectionTitle>Regla principal</SectionTitle><DataRow label={agreement.kind === "comision" ? "Porcentaje" : "Importe"} value={agreement.percentage ? `${agreement.percentage}%` : money(agreement.amount ?? 0)} /><DataRow label="Periodicidad" value={agreement.frequency} /><DataRow label="Quién recauda" value={agreement.collection === "profesional" ? "Profesional" : "Barbería"} /><DataRow label="Vigencia" value={`Desde ${agreement.validFrom}`} /><NavRow icon={<Clock3 />} title="Historial de acuerdos" value={`${agreementsFor(member.id).length} versiones`} onPress={onHistory} /></> : <InlineEmpty title="Sin acuerdo configurado" body="No se muestran importes ficticios en ausencia de una regla." />}
  </DeepPage>
}

type AgreementDraft = { kind: AgreementKind; amount: string; percentage: string; frequency: "semanal" | "mensual"; collection: "barberia" | "profesional" }
function AgreementEditor({ member, value, onChange, onBack, onReview }: { member: StaffMember; value: AgreementDraft; onChange: (value: AgreementDraft) => void; onBack: () => void; onReview: () => void }) {
  const percentageValid = value.kind !== "comision" || (Number(value.percentage) > 0 && Number(value.percentage) <= 100)
  const amountValid = value.kind === "comision" || Number(value.amount) > 0
  return <DeepPage title="Configurar acuerdo" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Revisar acuerdo" disabled={!percentageValid || !amountValid} onPress={onReview} fullWidth />}>
    <ChoiceGroup label="Modalidad" options={["comision", "alquiler", "fijo", "mixto"]} labels={{ comision: "Comisión", alquiler: "Alquiler", fijo: "Fijo", mixto: "Mixto" }} value={value.kind} onChange={(kind) => onChange({ ...value, kind: kind as AgreementKind })} />
    {value.kind === "comision" ? <InputField id="agreement-percentage" label="Porcentaje" type="number" value={value.percentage} onChange={(percentage) => onChange({ ...value, percentage })} error={percentageValid ? undefined : "Usá un porcentaje entre 1 y 100"} /> : <InputField id="agreement-amount" label="Importe" type="number" value={value.amount} onChange={(amount) => onChange({ ...value, amount })} error={amountValid ? undefined : "Ingresá un importe mayor que cero"} />}
    <ChoiceGroup label="Periodicidad" options={["semanal", "mensual"]} value={value.frequency} onChange={(frequency) => onChange({ ...value, frequency: frequency as AgreementDraft["frequency"] })} />
    {(value.kind === "comision" || value.kind === "alquiler") ? <ChoiceGroup label="Quién recauda los servicios" options={["barberia", "profesional"]} labels={{ barberia: "Barbería", profesional: "Profesional" }} value={value.collection} onChange={(collection) => onChange({ ...value, collection: collection as AgreementDraft["collection"] })} /> : null}
    {value.kind === "mixto" ? <div className="yk-callout">La modalidad mixta conserva componentes independientes. En esta demo se revisa un fijo más comisión sin duplicar bases.</div> : null}
    <p className="yk-help">La vigencia comenzará en el próximo período completo. Los cierres históricos no se reescriben.</p>
  </DeepPage>
}

function AgreementReview({ member, draft, onBack, onConfirm }: { member: StaffMember; draft: AgreementDraft; onBack: () => void; onConfirm: () => void }) {
  const previous = activeAgreement(member.id)
  return <DeepPage title="Revisar acuerdo" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Confirmar nueva versión" onPress={onConfirm} fullWidth />}><CompareBlock title="Antes" lines={previous ? [agreementLabel(previous.kind), previous.percentage ? `${previous.percentage}%` : money(previous.amount ?? 0), `Desde ${previous.validFrom}`] : ["Sin acuerdo"]} /><CompareBlock title="Después" accent lines={[agreementLabel(draft.kind), draft.kind === "comision" ? `${draft.percentage}%` : money(Number(draft.amount)), `Desde ${draft.frequency === "semanal" ? "26/10/2026" : "01/11/2026"}`]} /><div className="yk-callout">Se crea una versión nueva. La anterior y las liquidaciones cerradas permanecen inmutables.</div></DeepPage>
}

function AgreementsHistory({ member, onBack }: { member: StaffMember; onBack: () => void }) {
  return <DeepPage title="Historial de acuerdos" subtitle={member.name} onBack={onBack}>{agreementsFor(member.id).slice().reverse().map((agreement) => <div className="yk-history-card" key={agreement.id}><div><strong>{agreementLabel(agreement.kind)}</strong><small>{agreement.validFrom}{agreement.validTo ? ` → ${agreement.validTo}` : " → vigente"}</small></div><StatusIndicator label={agreement.status} tone={agreement.status === "vigente" ? "success" : agreement.status === "programada" ? "info" : "neutral"} size="small" /><DataRow label="Regla" value={agreement.percentage ? `${agreement.percentage}%` : money(agreement.amount ?? 0)} /></div>)}</DeepPage>
}

function Settlements({ member, onBack, onOpen }: { member: StaffMember; onBack: () => void; onOpen: (id: string) => void }) {
  const rows = settlementsFor(member.id)
  return <DeepPage title="Liquidaciones" subtitle={member.name} onBack={onBack}>{rows.length ? rows.map((item) => <button className="yk-settlement-row" type="button" key={item.id} onClick={() => onOpen(item.id)}><span><strong>{item.period}</strong><small>{settlementStatus(item.status)} · pendiente {money(item.due)}</small></span><ChevronRight size={18} /></button>) : <InlineEmpty title="Sin liquidaciones" body="No hay períodos para este acuerdo." />}</DeepPage>
}

function SettlementDetail({ member, settlementId, onBack, onOperations, onPayment, onFinance }: { member: StaffMember; settlementId: string; onBack: () => void; onOperations: () => void; onPayment: () => void; onFinance: () => void }) {
  const settlement = settlementById(settlementId)
  if (!settlement) return <EmptyPanel title="Liquidación no encontrada" onBack={onBack} />
  const canPay = settlement.status !== "abierta" && settlement.due > 0
  return <DeepPage title="Detalle liquidación" subtitle={member.name} onBack={onBack} footer={canPay ? <PrimaryAction label="Registrar pago" onPress={onPayment} fullWidth /> : undefined}><HeroValue eyebrow={settlement.period} value={money(settlement.total)} label={settlementStatus(settlement.status)} /><SectionTitle>Resultado</SectionTitle><DataRow label="Base" value={money(settlement.base)} /><DataRow label="Pagado" value={money(settlement.paid)} /><DataRow label="Pendiente" value={money(settlement.due)} /><NavRow icon={<WalletCards />} title="Operaciones incluidas" value={`${settlement.operations.length} operaciones`} onPress={onOperations} /><NavRow icon={<ArrowRight />} title="Gestionar en Finanzas" value={settlement.id.startsWith("OBL-") ? "Cobrar alquiler" : "Pagar liquidación"} onPress={onFinance} />{settlement.status === "abierta" ? <div className="yk-callout">El cálculo es preliminar. El período actual termina el 25/10 y todavía no puede cerrarse.</div> : null}</DeepPage>
}

function Operations({ settlementId, onBack }: { settlementId: string; onBack: () => void }) {
  const settlement = settlementById(settlementId)
  if (!settlement) return <EmptyPanel title="Operaciones no encontradas" onBack={onBack} />
  return <DeepPage title="Operaciones" subtitle={settlement.period} onBack={onBack}>{settlement.operations.map((operation) => <div className="yk-operation" key={operation.id}><div><strong>{operation.origin}</strong><small>{operation.id} · {operation.rule}</small></div>{operation.service ? <DataRow label="Servicio" value={operation.service} /> : null}<DataRow label="Base" value={money(operation.base)} /><DataRow label="Importe" value={money(operation.amount)} /></div>)}<div className="yk-total-row"><span>Total</span><strong>{money(settlement.operations.reduce((sum, operation) => sum + operation.amount, 0))}</strong></div></DeepPage>
}

function Payment({ member, settlementId, onBack, onSaved }: { member: StaffMember; settlementId: string; onBack: () => void; onSaved: () => void }) {
  const settlement = settlementById(settlementId)
  const [amount, setAmount] = useState(settlement ? String(settlement.due) : "")
  const [method, setMethod] = useState<"transferencia" | "efectivo">("transferencia")
  const [error, setError] = useState("")
  if (!settlement) return <EmptyPanel title="Liquidación no encontrada" onBack={onBack} />
  const resulting = settlement.due - Number(amount || 0)
  const submit = () => { const result = registerPayment(settlement.id, Number(amount), method, `PAY-${settlement.id}-${amount}-${method}`); if (!result.ok) setError(result.reason ?? "No se pudo registrar"); else onSaved() }
  return <DeepPage title="Registrar pago" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Revisar y confirmar" onPress={submit} fullWidth />}><DataRow label="Liquidación" value={settlement.period} /><DataRow label="Pendiente" value={money(settlement.due)} /><InputField id="payment-amount" label="Importe propuesto" type="number" value={amount} onChange={(value) => { setAmount(value); setError("") }} error={error || undefined} /><ChoiceGroup label="Medio" options={["transferencia", "efectivo"]} labels={{ transferencia: "Transferencia", efectivo: "Efectivo" }} value={method} onChange={(value) => setMethod(value as typeof method)} /><InputField id="payment-date" label="Fecha" type="date" value="2026-10-24" onChange={() => {}} disabled /><HeroValue eyebrow="Saldo resultante" value={money(Math.max(0, resulting))} label={resulting === 0 ? "Quedará pagada" : "Conservará saldo pendiente"} /></DeepPage>
}

function Access({ member, onBack, onPermissions, onResponsibilities, onAccount, onDeactivate }: { member: StaffMember; onBack: () => void; onPermissions: () => void; onResponsibilities: () => void; onAccount: () => void; onDeactivate: () => void }) {
  return <DeepPage title="Acceso y responsabilidades" subtitle={member.name} onBack={onBack}><SectionTitle>Cuenta</SectionTitle><DataRow label="Estado" value={accountLabel(member)} /><DataRow label="Usuario vinculado" value={member.account.user ?? "Sin usuario"} /><SecondaryAction label={member.account.status === "sin_cuenta" ? "Vincular cuenta demo" : member.account.status === "habilitada" ? "Suspender acceso" : "Reactivar acceso"} onPress={onAccount} fullWidth /><SectionTitle>Administración</SectionTitle><NavRow icon={<ShieldCheck />} title="Permisos" value={`${Object.values(member.permissions).filter(Boolean).length} habilitados`} onPress={onPermissions} /><NavRow icon={<UserRound />} title="Responsabilidades" value={member.roles.join(" · ")} onPress={onResponsibilities} /><SectionTitle>Relación</SectionTitle><button type="button" className="yk-danger-row" onClick={onDeactivate}>{member.status === "activo" ? "Desactivar integrante" : "Reactivar integrante"}<ChevronRight size={18} /></button></DeepPage>
}

function Permissions({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState({ ...member.permissions })
  const [review, setReview] = useState(false)
  const changed = JSON.stringify(draft) !== JSON.stringify(member.permissions)
  if (review) return <DeepPage title="Revisar permisos" subtitle={member.name} onBack={() => setReview(false)} footer={<PrimaryAction label="Aplicar permisos" onPress={() => { updateStaff(member.id, { permissions: draft }); onSaved() }} fullWidth />}><CompareBlock title="Cambios" accent lines={Object.keys(draft).filter((key) => draft[key] !== member.permissions[key]).map((key) => `${draft[key] ? "Habilitar" : "Quitar"} · ${permissionLabel(key)}`)} /><div className="yk-callout">La autorización se evalúa al ejecutar cada operación, no sólo al mostrar controles.</div></DeepPage>
  const groups = ["Agenda", "Clientes", "Inventario", "Finanzas", "Administración"]
  return <DeepPage title="Permisos" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Revisar cambios" disabled={!changed} onPress={() => setReview(true)} fullWidth />}>{groups.map((group) => <div key={group}><SectionTitle>{group}</SectionTitle>{Object.keys(draft).filter((key) => key.startsWith(group.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))).map((key) => <label className="yk-check-row" key={key}><input type="checkbox" checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} /><span>{permissionLabel(key)}</span></label>)}</div>)}</DeepPage>
}

function Responsibilities({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const [roles, setRoles] = useState([...member.roles])
  const [review, setReview] = useState(false)
  if (review) return <DeepPage title="Revisar responsabilidades" subtitle={member.name} onBack={() => setReview(false)} footer={<PrimaryAction label="Confirmar cambios" onPress={() => { updateStaff(member.id, { roles }); onSaved() }} fullWidth />}><CompareBlock title="Actuales" lines={member.roles} /><CompareBlock title="Propuestas" accent lines={roles} />{member.roles.includes("Barbero") && !roles.includes("Barbero") ? <div className="yk-callout yk-callout--warning">Retirar Barbero exige revisar reservas y clases futuras antes de aplicar.</div> : null}</DeepPage>
  return <DeepPage title="Cambiar responsabilidades" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Revisar cambios" disabled={!roles.length || JSON.stringify(roles) === JSON.stringify(member.roles)} onPress={() => setReview(true)} fullWidth />}><CheckboxGroup label="Funciones propuestas" options={["Barbero", "Recepción"]} values={roles} onChange={(value) => setRoles(value as StaffRole[])} /><div className="yk-callout">Añadir Barbero habilita la configuración; no crea jornada, servicios ni disponibilidad.</div></DeepPage>
}

function Deactivate({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const reservations = member.status === "activo" && member.id === "ST01" ? 1 : 0
  return <DeepPage title={member.status === "activo" ? "Desactivar integrante" : "Reactivar integrante"} subtitle={member.name} onBack={onBack} footer={<PrimaryAction label={member.status === "activo" ? "Confirmar desactivación" : "Confirmar reactivación"} onPress={() => { updateStaff(member.id, { status: member.status === "activo" ? "inactivo" : "activo" }); onSaved() }} fullWidth />}><HeroValue eyebrow="Revisión de impacto" value={String(reservations)} label="reservas futuras" /><DataRow label="Clases futuras" value={member.id === "ST01" ? "1 · Técnicas Fade" : "0"} /><DataRow label="Obligaciones económicas" value={activeAgreement(member.id) ? "Requiere seguimiento" : "Sin acuerdo vigente"} /><DataRow label="Cuenta" value={accountLabel(member)} />{reservations ? <div className="yk-callout yk-callout--warning">Los compromisos deben resolverse en A19 antes de una desactivación operativa definitiva. Esta revisión no los cancela.</div> : <div className="yk-callout">El historial y los acuerdos se conservan. Reactivar no crea disponibilidad falsa.</div>}</DeepPage>
}

function LinkAccount({ member, onBack, onSaved }: { member: StaffMember; onBack: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState(member.email ?? "")
  const [error, setError] = useState("")
  return <DeepPage title="Vincular cuenta demo" subtitle={member.name} onBack={onBack} footer={<PrimaryAction label="Confirmar vinculación demo" onPress={() => { if (!linkAccount(member.id, email)) setError("Ingresá un correo válido"); else onSaved() }} fullWidth />}><DataRow label="Integrante" value={member.name} /><InputField id="account-email" label="Correo" type="email" value={email} onChange={(value) => { setEmail(value); setError("") }} error={error || undefined} /><DataRow label="Estado resultante" value="Habilitada" /><div className="yk-callout">No se enviará correo ni se creará una contraseña. El acceso es exclusivamente demo.</div></DeepPage>
}

function DeepPage({ title, subtitle, onBack, right, footer, children }: { title: string; subtitle?: string; onBack: () => void; right?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return <div className="yk-deep-page"><DetailHeader title={title} subtitle={subtitle} onBack={onBack} right={right} /><div className="yk-deep-scroll">{children}</div>{footer ? <div className="yk-fixed-footer">{footer}</div> : null}</div>
}

function Avatar({ member, large = false }: { member: StaffMember; large?: boolean }) {
  const initials = member.name.split(" ").slice(0, 2).map((part) => part[0]).join("")
  return <span className={`yk-avatar ${large ? "yk-avatar--large" : ""}`} aria-hidden>{initials}</span>
}
function SectionTitle({ children }: { children: ReactNode }) { return <h2 className="yk-section-title">{children}</h2> }
function NavRow({ icon, title, value, onPress }: { icon: ReactNode; title: string; value?: string; onPress: () => void }) { return <button type="button" className="yk-nav-row" onClick={onPress}><span className="yk-nav-icon">{icon}</span><span><strong>{title}</strong>{value ? <small>{value}</small> : null}</span><ChevronRight size={18} /></button> }
function DataRow({ label, value }: { label: string; value: string }) { return <div className="yk-data-row"><span>{label}</span><strong>{value}</strong></div> }
function HeroValue({ eyebrow, value, label }: { eyebrow: string; value: string; label: string }) { return <div className="yk-hero"><span>{eyebrow}</span><strong>{value}</strong><small>{label}</small></div> }
function FormIntro({ title, body }: { title: string; body: string }) { return <div className="yk-form-intro"><strong>{title}</strong><p>{body}</p></div> }
function FormError({ children }: { children: ReactNode }) { return <p role="alert" className="yk-form-error">{children}</p> }
function InlineEmpty({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) { return <div className="yk-inline-empty"><strong>{title}</strong><p>{body}</p>{action ? <button type="button" onClick={onAction}>{action}</button> : null}</div> }
function EmptyPanel({ title, onBack }: { title: string; onBack: () => void }) { return <DeepPage title={title} onBack={onBack}><InlineEmpty title={title} body="Volvé a la pantalla anterior e intentá nuevamente." /></DeepPage> }
function CompareBlock({ title, lines, accent = false }: { title: string; lines: string[]; accent?: boolean }) { return <section className={`yk-compare ${accent ? "is-accent" : ""}`}><h3>{title}</h3>{lines.length ? lines.map((line) => <p key={line}>{line}</p>) : <p>Sin cambios</p>}</section> }

function ChoiceGroup({ label, options, labels, value, onChange }: { label: string; options: string[]; labels?: Record<string, string>; value: string; onChange: (value: string) => void }) { return <fieldset className="yk-choice-group"><legend>{label}</legend>{options.map((option) => <label key={option}><input type="radio" name={label} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{labels?.[option] ?? option}</span></label>)}</fieldset> }
function CheckboxGroup({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) { return <fieldset className="yk-choice-group"><legend>{label}</legend>{options.map((option) => <label key={option}><input type="checkbox" value={option} checked={values.includes(option)} onChange={(event) => onChange(event.target.checked ? [...values, option] : values.filter((value) => value !== option))} /><span>{option}</span></label>)}</fieldset> }

function accountLabel(member: StaffMember) { return member.account.status === "sin_cuenta" ? "Sin cuenta" : member.account.status === "habilitada" ? "Habilitada" : "Suspendida" }
function agreementLabel(kind: AgreementKind) { return ({ comision: "Comisión", alquiler: "Alquiler de silla", fijo: "Fijo", mixto: "Mixto" })[kind] }
function settlementStatus(status: string) { return ({ abierta: "Abierta", cerrada: "Cerrada pendiente", parcial: "Parcialmente pagada", pagada: "Pagada" } as Record<string, string>)[status] ?? status }
function formatTime(iso: string) { return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(iso)) }
function serviceBreakdown(activity: ReturnType<typeof activityFor>): [string, number][] { const total = new Map<string, number>(); activity.flatMap((entry) => entry.serviceNames).forEach((name) => total.set(name, (total.get(name) ?? 0) + 1)); return [...total.entries()] }
function permissionLabel(key: string) { const [, action] = key.split("."); return ({ ver: "Ver", editar: "Crear y editar", equipo: "Administrar equipo" } as Record<string, string>)[action] ?? action }
