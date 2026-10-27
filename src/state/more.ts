import {
  CLIENTES,
  DEMO_NOW_ISO,
  PROFESIONALES,
  SERVICIOS,
  todasLasAtenciones,
  todasLasReservas,
  type Cliente,
  type Servicio,
} from "./agenda"
import { financeStore } from "./financeCore"
import { inventoryStore } from "./inventory"
import { listStaff } from "./staff"

export type MoreStatus =
  | "confirmed"
  | "invalid"
  | "duplicate"
  | "conflict"
  | "policy_required"
  | "permission_denied"
  | "unknown"

export type MoreResult = {
  ok: boolean
  status: MoreStatus
  message: string
  id?: string
  operationId?: string
}

export type ClientMeta = {
  clientId: string
  archived: boolean
  version: number
  notes: Array<{ id: string; body: string; actor: string; at: string }>
  aliases: string[]
  consent: "not_recorded" | "granted" | "revoked"
}

export type ServiceMeta = {
  serviceId: string
  category: string
  description: string
  publicVisible: boolean
  version: number
  variants: Array<{ id: string; name: string; durationMinutes: number; priceMinor: number; enabled: boolean }>
  history: Array<{ version: number; at: string; detail: string; price: number; duration: number }>
}

export type ProgramSection = { id: string; title: string; topics: string[] }
export type CourseSession = {
  id: string
  startsAt: string
  endsAt: string
  instructorId: string
  resourceId: string
  status: "scheduled" | "completed" | "cancelled"
  version: number
}
export type Enrollment = {
  id: string
  clientId: string
  status: "enrolled" | "waitlist" | "cancelled" | "completed"
  attendance: Record<string, "pending" | "present" | "absent">
}
export type Course = {
  id: string
  name: string
  objective: string
  status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled" | "archived"
  publication: "private" | "public_demo"
  capacity: number
  instructorId?: string
  paid: boolean
  version: number
  program: ProgramSection[]
  sessions: CourseSession[]
  enrollments: Enrollment[]
}

export type Promotion = {
  id: string
  name: string
  publicText: string
  status: "draft" | "scheduled" | "active" | "paused" | "ended"
  targetIds: string[]
  benefit: string
  startsAt: string
  endsAt: string
  policyApproved: boolean
  version: number
}

export type DemoAccount = {
  id: string
  label: string
  email: string
  staffId?: string
  status: "active" | "suspended" | "pending"
  role: "owner" | "admin" | "reception"
  capabilities: Record<string, boolean>
  version: number
}

export type AuditEvent = {
  id: string
  at: string
  actor: string
  action: string
  domain: "Clientes" | "Servicios" | "Cursos" | "Presencia" | "Horarios" | "Acceso" | "Agenda" | "Inventario" | "Finanzas"
  objectType: string
  objectId: string
  before?: string
  after?: string
  correctionOf?: string
}

export type AlertItem = {
  id: string
  title: string
  detail: string
  domain: "Agenda" | "Inventario" | "Finanzas" | "Cursos" | "Servicios"
  objectId: string
  read: boolean
  resolved: boolean
  priority: "normal" | "high"
}

export type BusinessSchedule = Record<string, Array<{ id: string; start: string; end: string }>>

export type MoreState = {
  clientMeta: Record<string, ClientMeta>
  serviceMeta: Record<string, ServiceMeta>
  courses: Course[]
  profile: {
    draftVersion: number
    publishedVersion: number
    draft: { name: string; description: string; phone: string; address: string; website: string; media: Array<{ id: string; name: string; url?: string; temporary: boolean }> }
    published: { name: string; description: string; phone: string; address: string; website: string; media: Array<{ id: string; name: string; url?: string; temporary: boolean }> }
  }
  promotions: Promotion[]
  schedule: BusinessSchedule
  scheduleVersion: number
  exceptions: Array<{ id: string; date: string; type: "closed" | "special"; intervals: Array<{ start: string; end: string }>; reason: string }>
  bookingRules: { enabled: boolean; minNoticeMinutes: number; maxHorizonDays: number; reminderEnabled: boolean; reminderLeadHours: number; cancellationPolicyDefined: boolean }
  business: { internalName: string; adminPhone: string; address: string; timezone: string; version: number }
  accounts: DemoAccount[]
  audit: AuditEvent[]
  alerts: AlertItem[]
  operationIds: string[]
}

const defaultCapabilities = (admin: boolean) => ({
  "agenda.view": true,
  "agenda.edit": true,
  "clients.view": true,
  "clients.edit": true,
  "services.edit": admin,
  "courses.edit": admin,
  "inventory.view": admin,
  "finance.view": admin,
  "settings.admin": admin,
  "audit.view": admin,
})

const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

function initialState(): MoreState {
  const clientMeta = Object.fromEntries(
    CLIENTES.map((client) => [client.id, { clientId: client.id, archived: false, version: 1, notes: [], aliases: [], consent: "not_recorded" } satisfies ClientMeta]),
  )
  const serviceMeta = Object.fromEntries(
    SERVICIOS.map((service) => [service.id, {
      serviceId: service.id,
      category: service.id === "SV03" ? "Barba" : "Cortes",
      description: `${service.nombre} en YoungKingZ`,
      publicVisible: service.activo,
      version: 1,
      variants: [],
      history: [{ version: 1, at: DEMO_NOW_ISO, detail: "Versión inicial P2", price: service.precio, duration: service.duracionMin }],
    } satisfies ServiceMeta]),
  )
  const course: Course = {
    id: "CRS-01",
    name: "Fundamentos de barbería",
    objective: "Práctica guiada de preparación, corte y terminación.",
    status: "scheduled",
    publication: "private",
    capacity: 2,
    instructorId: "ST01",
    paid: false,
    version: 1,
    program: [{ id: "SEC-01", title: "Preparación", topics: ["Herramientas", "Diagnóstico"] }],
    sessions: [{ id: "SES-01", startsAt: "2026-10-26T10:00:00-03:00", endsAt: "2026-10-26T11:30:00-03:00", instructorId: "ST01", resourceId: "SILLON-01", status: "scheduled", version: 1 }],
    enrollments: [
      { id: "ENR-01", clientId: "CL01", status: "enrolled", attendance: { "SES-01": "pending" } },
      { id: "ENR-02", clientId: "CL02", status: "enrolled", attendance: { "SES-01": "pending" } },
    ],
  }
  const schedule = Object.fromEntries(weekdays.map((day) => [day, day === "Domingo" ? [] : [{ id: `${day}-1`, start: "09:00", end: day === "Sábado" ? "19:00" : "20:00" }]])) as BusinessSchedule
  const staff = listStaff()
  const accounts: DemoAccount[] = [
    { id: "ACC-OWNER", label: "Dueño YoungKingZ", email: "owner@youngkingz.demo", status: "active", role: "owner", capabilities: defaultCapabilities(true), version: 1 },
    ...staff.filter((member) => member.account.status !== "sin_cuenta").map((member, index) => ({
      id: `ACC-${String(index + 1).padStart(2, "0")}`,
      label: member.name,
      email: member.account.user ?? member.email ?? `${member.id.toLowerCase()}@youngkingz.demo`,
      staffId: member.id,
      status: member.account.status === "suspendida" ? "suspended" as const : "active" as const,
      role: member.roles.includes("Administración") ? "admin" as const : "reception" as const,
      capabilities: defaultCapabilities(member.roles.includes("Administración")),
      version: 1,
    })),
  ]
  return {
    clientMeta,
    serviceMeta,
    courses: [course],
    profile: {
      draftVersion: 2,
      publishedVersion: 1,
      draft: { name: "YoungKingZ", description: "Barbería de autor y formación profesional.", phone: "+54 9 11 5555-0199", address: "Palermo, Buenos Aires", website: "https://youngkingz.demo", media: [] },
      published: { name: "YoungKingZ", description: "Barbería de autor.", phone: "+54 9 11 5555-0199", address: "Palermo, Buenos Aires", website: "", media: [] },
    },
    promotions: [{ id: "PROMO-01", name: "Borrador fidelidad", publicText: "Beneficio pendiente de política comercial", status: "draft", targetIds: ["SV01"], benefit: "Sin definir", startsAt: "2026-11-01", endsAt: "2026-11-30", policyApproved: false, version: 1 }],
    schedule,
    scheduleVersion: 1,
    exceptions: [],
    bookingRules: { enabled: true, minNoticeMinutes: 120, maxHorizonDays: 30, reminderEnabled: false, reminderLeadHours: 24, cancellationPolicyDefined: false },
    business: { internalName: "YoungKingZ Barber Studio", adminPhone: "+54 9 11 5555-0100", address: "Palermo, Buenos Aires", timezone: "America/Argentina/Buenos_Aires", version: 1 },
    accounts,
    audit: [
      { id: "AUD-P5-01", at: DEMO_NOW_ISO, actor: "Sistema demo", action: "Estado P5 inicial cargado", domain: "Acceso", objectType: "workspace", objectId: "P5" },
      { id: "AUD-P2-01", at: "2026-10-24T13:30:00-03:00", actor: "Camila Ruiz", action: "Atención iniciada", domain: "Agenda", objectType: "reserva", objectId: todasLasReservas().find((item) => item.estado === "en_atencion")?.id ?? "reserva-demo" },
    ],
    alerts: [
      { id: "ALR-STOCK", title: "Stock bajo", detail: "Cera mate requiere revisión en Inventario.", domain: "Inventario", objectId: "ART-CERA", read: false, resolved: false, priority: "high" },
      { id: "ALR-COURSE", title: "Curso con cupo completo", detail: "La lista de espera requiere una política antes de promover.", domain: "Cursos", objectId: "CRS-01", read: false, resolved: false, priority: "normal" },
      { id: "ALR-PAYMENT", title: "Cobro externo sin verificar", detail: "Finanzas conserva el resultado pendiente hasta revisión.", domain: "Finanzas", objectId: "F68", read: true, resolved: false, priority: "high" },
    ],
    operationIds: [],
  }
}

let state = initialState()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function nextId(prefix: string) {
  return `${prefix}-${String(state.audit.length + state.operationIds.length + 1).padStart(3, "0")}`
}

function begin(operationId: string): MoreResult | undefined {
  if (!operationId) return { ok: false, status: "invalid", message: "Falta operation_id" }
  if (state.operationIds.includes(operationId)) return { ok: false, status: "duplicate", message: "La operación ya fue registrada", operationId }
  return undefined
}

function commit(operationId: string, event: Omit<AuditEvent, "id" | "at">, message: string, id?: string): MoreResult {
  state.operationIds.push(operationId)
  state.audit.unshift({ id: nextId("AUD-P5"), at: DEMO_NOW_ISO, ...event })
  state = { ...state }
  emit()
  return { ok: true, status: "confirmed", message, id, operationId }
}

export const moreStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return state
  },
  reset() {
    state = initialState()
    emit()
  },
}

export const operationId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function clientRows() {
  return CLIENTES.map((client) => ({ client, meta: state.clientMeta[client.id] ?? { clientId: client.id, archived: false, version: 1, notes: [], aliases: [], consent: "not_recorded" } }))
}

export function clientMeta(clientId: string) {
  return state.clientMeta[clientId]
}

export function createClient(input: Omit<Cliente, "id">, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const duplicate = CLIENTES.find((client) =>
    client.nombre.localeCompare(input.nombre, "es", { sensitivity: "base" }) === 0 ||
    Boolean(input.telefono && client.telefono === input.telefono) ||
    Boolean(input.correo && client.correo === input.correo),
  )
  if (duplicate) return { ok: false, status: "duplicate", message: `Coincide con ${duplicate.nombre}`, id: duplicate.id, operationId: opId }
  const id = `CL${String(CLIENTES.length + 1).padStart(2, "0")}`
  CLIENTES.push({ ...input, id })
  state.clientMeta[id] = { clientId: id, archived: false, version: 1, notes: [], aliases: [], consent: "not_recorded" }
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Cliente registrado", domain: "Clientes", objectType: "cliente", objectId: id, after: input.nombre }, "Cliente registrado en la identidad canónica", id)
}

export function updateClient(clientId: string, updates: Partial<Omit<Cliente, "id">>, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const client = CLIENTES.find((item) => item.id === clientId)
  const meta = state.clientMeta[clientId]
  if (!client || !meta) return { ok: false, status: "invalid", message: "Cliente no disponible", operationId: opId }
  if (meta.version !== expectedVersion) return { ok: false, status: "conflict", message: "La ficha cambió; revisá la versión actual", operationId: opId }
  const before = JSON.stringify(client)
  Object.assign(client, updates)
  meta.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Datos de cliente actualizados", domain: "Clientes", objectType: "cliente", objectId: clientId, before, after: JSON.stringify(client) }, "Datos guardados sin alterar su historial", clientId)
}

export function updateClientContact(clientId:string,updates:Pick<Partial<Cliente>,"telefono"|"correo">,consent:ClientMeta["consent"],expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  const client=CLIENTES.find(item=>item.id===clientId),meta=state.clientMeta[clientId]
  if(!client||!meta)return {ok:false,status:"invalid",message:"Cliente no disponible",operationId:opId}
  if(meta.version!==expectedVersion)return {ok:false,status:"conflict",message:"El contacto cambió durante la revisión",operationId:opId}
  if(updates.correo&&!/^\S+@\S+\.\S+$/.test(updates.correo))return {ok:false,status:"invalid",message:"Ingresá un correo válido",operationId:opId}
  const before=JSON.stringify({telefono:client.telefono,correo:client.correo,consent:meta.consent})
  Object.assign(client,updates);meta.consent=consent;meta.version+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:"Contacto y consentimiento actualizados",domain:"Clientes",objectType:"cliente",objectId:clientId,before,after:JSON.stringify({telefono:client.telefono,correo:client.correo,consent})},"Contacto guardado sin realizar envíos",clientId)
}

export function addClientNote(clientId: string, body: string, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const meta = state.clientMeta[clientId]
  if (!meta || !body.trim()) return { ok: false, status: "invalid", message: "Escribí una nota", operationId: opId }
  meta.notes.unshift({ id: nextId("NOTE"), body: body.trim(), actor: "Dueño YoungKingZ", at: DEMO_NOW_ISO })
  meta.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Nota privada agregada", domain: "Clientes", objectType: "cliente", objectId: clientId }, "Nota privada registrada", clientId)
}

export function setClientArchived(clientId: string, archived: boolean, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const meta = state.clientMeta[clientId]
  if (!meta) return { ok: false, status: "invalid", message: "Cliente no disponible", operationId: opId }
  if (meta.version !== expectedVersion) return { ok: false, status: "conflict", message: "La ficha cambió durante la revisión", operationId: opId }
  meta.archived = archived
  meta.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: archived ? "Cliente archivado" : "Cliente restaurado", domain: "Clientes", objectType: "cliente", objectId: clientId, before: archived ? "Activo" : "Archivado", after: archived ? "Archivado" : "Activo" }, archived ? "Cliente archivado; reservas, pedidos y cobros permanecen" : "Cliente restaurado", clientId)
}

export function mergeClients(primaryId: string, aliasId: string, expectedPrimaryVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const primary = state.clientMeta[primaryId]
  const alias = state.clientMeta[aliasId]
  if (!primary || !alias || primaryId === aliasId) return { ok: false, status: "invalid", message: "Seleccioná dos identidades distintas", operationId: opId }
  if (primary.version !== expectedPrimaryVersion) return { ok: false, status: "conflict", message: "La identidad principal cambió durante la revisión", operationId: opId }
  primary.aliases = [...new Set([...primary.aliases, aliasId, ...alias.aliases])]
  primary.notes = [...primary.notes, ...alias.notes]
  primary.version += 1
  alias.archived = true
  alias.version += 1
  const reservations = todasLasReservas()
  const attentions = todasLasAtenciones()
  reservations.filter((item) => item.clienteId === aliasId).forEach((item) => { item.clienteId = primaryId })
  attentions.filter((item) => item.clienteId === aliasId).forEach((item) => { item.clienteId = primaryId })
  inventoryStore.getSnapshot().orders.filter((item) => item.clientId === aliasId).forEach((item) => { item.clientId = primaryId })
  inventoryStore.getSnapshot().sales.filter((item) => item.clientId === aliasId).forEach((item) => { item.clientId = primaryId })
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Clientes fusionados", domain: "Clientes", objectType: "cliente", objectId: primaryId, before: aliasId, after: primaryId }, "Identidad canónica conservada y alias redirigido", primaryId)
}

export function serviceRows() {
  return SERVICIOS.map((service) => ({ service, meta: state.serviceMeta[service.id] }))
}

export function createService(input: Omit<Servicio, "id"> & { category: string; description: string }, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const duplicate = SERVICIOS.find((service) => service.nombre.localeCompare(input.nombre, "es", { sensitivity: "base" }) === 0)
  if (duplicate) return { ok: false, status: "duplicate", message: `Ya existe ${duplicate.nombre}`, id: duplicate.id, operationId: opId }
  if (!input.nombre.trim() || input.duracionMin <= 0 || input.precio < 0) return { ok: false, status: "invalid", message: "Revisá nombre, duración y precio", operationId: opId }
  const id = `SV${String(SERVICIOS.length + 1).padStart(2, "0")}`
  const service: Servicio = { id, nombre: input.nombre.trim(), duracionMin: input.duracionMin, precio: input.precio, activo: input.activo }
  SERVICIOS.push(service)
  state.serviceMeta[id] = { serviceId: id, category: input.category, description: input.description, publicVisible: false, version: 1, variants: [], history: [{ version: 1, at: DEMO_NOW_ISO, detail: "Servicio creado", price: service.precio, duration: service.duracionMin }] }
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Servicio creado", domain: "Servicios", objectType: "servicio", objectId: id, after: service.nombre }, "Servicio interno creado; publicación separada", id)
}

export function updateService(serviceId: string, updates: Partial<Pick<Servicio, "nombre" | "duracionMin" | "precio" | "activo">>, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const service = SERVICIOS.find((item) => item.id === serviceId)
  const meta = state.serviceMeta[serviceId]
  if (!service || !meta) return { ok: false, status: "invalid", message: "Servicio no disponible", operationId: opId }
  if (meta.version !== expectedVersion) return { ok: false, status: "conflict", message: "El servicio cambió durante la revisión", operationId: opId }
  if (updates.duracionMin !== undefined && updates.duracionMin <= 0) return { ok: false, status: "invalid", message: "La duración debe ser mayor a cero", operationId: opId }
  if (updates.precio !== undefined && updates.precio < 0) return { ok: false, status: "invalid", message: "El precio no puede ser negativo", operationId: opId }
  const before = `${service.nombre} · ${service.duracionMin} min · ${service.precio}`
  Object.assign(service, updates)
  meta.version += 1
  meta.history.unshift({ version: meta.version, at: DEMO_NOW_ISO, detail: "Nueva versión para operaciones futuras", price: service.precio, duration: service.duracionMin })
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Servicio versionado", domain: "Servicios", objectType: "servicio", objectId: serviceId, before, after: `${service.nombre} · ${service.duracionMin} min · ${service.precio}` }, "Servicio actualizado; snapshots históricos intactos", serviceId)
}

export function addServiceVariant(serviceId:string,input:{name:string;durationMinutes:number;priceMinor:number},expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  const meta=state.serviceMeta[serviceId]
  if(!meta||meta.version!==expectedVersion)return {ok:false,status:"conflict",message:"El servicio cambió durante la revisión",operationId:opId}
  if(!input.name.trim()||input.durationMinutes<=0||input.priceMinor<0)return {ok:false,status:"invalid",message:"Revisá nombre, duración y precio",operationId:opId}
  if(meta.variants.some(item=>item.name.localeCompare(input.name,"es",{sensitivity:"base"})===0))return {ok:false,status:"duplicate",message:"Ya existe una variante con ese nombre",operationId:opId}
  const id=`VAR-${serviceId}-${meta.variants.length+1}`;meta.variants.push({id,...input,enabled:true});meta.version+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:"Variante de servicio creada",domain:"Servicios",objectType:"variante",objectId:id},"Variante guardada como versión futura",id)
}

export function updateServiceEligibility(serviceId:string,staffIds:string[],expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  const meta=state.serviceMeta[serviceId]
  if(!meta||meta.version!==expectedVersion)return {ok:false,status:"conflict",message:"La elegibilidad cambió durante la revisión",operationId:opId}
  const eligible=new Set(PROFESIONALES.filter(item=>item.estado==="activo").map(item=>item.id));if(!staffIds.length||staffIds.some(id=>!eligible.has(id)))return {ok:false,status:"invalid",message:"Elegí al menos un profesional activo",operationId:opId}
  PROFESIONALES.forEach(item=>{const has=item.serviciosHabilitados.includes(serviceId),wanted=staffIds.includes(item.id);if(wanted&&!has)item.serviciosHabilitados.push(serviceId);if(!wanted&&has)item.serviciosHabilitados=item.serviciosHabilitados.filter(id=>id!==serviceId)})
  meta.version+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:"Elegibilidad de servicio actualizada",domain:"Servicios",objectType:"servicio",objectId:serviceId,after:staffIds.join(",")},"Profesionales habilitados actualizados para reservas futuras",serviceId)
}

export function setServicePublic(serviceId: string, visible: boolean, expectedVersion: number, opId: string): MoreResult {
  const service = SERVICIOS.find((item) => item.id === serviceId)
  const meta = state.serviceMeta[serviceId]
  if (!service || !meta) return { ok: false, status: "invalid", message: "Servicio no disponible", operationId: opId }
  if (!service.activo || service.precio < 0 || !PROFESIONALES.some((professional) => professional.estado === "activo" && professional.serviciosHabilitados.includes(serviceId))) return { ok: false, status: "invalid", message: "Falta un servicio activo, precio válido o profesional elegible", operationId: opId }
  const early = begin(opId)
  if (early) return early
  if (meta.version !== expectedVersion) return { ok: false, status: "conflict", message: "La versión pública cambió", operationId: opId }
  meta.publicVisible = visible
  meta.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: visible ? "Servicio publicado en demo" : "Servicio ocultado", domain: "Servicios", objectType: "servicio", objectId: serviceId, before: visible ? "Oculto" : "Visible", after: visible ? "Visible" : "Oculto" }, visible ? "Servicio visible en Cliente demo" : "Nuevas reservas públicas deshabilitadas; turnos existentes intactos", serviceId)
}

export function createCourse(input: Pick<Course, "name" | "objective" | "capacity" | "paid">, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  if (!input.name.trim() || input.capacity < 0) return { ok: false, status: "invalid", message: "Revisá nombre y capacidad", operationId: opId }
  const id = `CRS-${String(state.courses.length + 1).padStart(2, "0")}`
  state.courses.push({ id, name: input.name.trim(), objective: input.objective, status: "draft", publication: "private", capacity: input.capacity, paid: input.paid, version: 1, program: [], sessions: [], enrollments: [] })
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Curso borrador creado", domain: "Cursos", objectType: "curso", objectId: id, after: input.name }, input.paid ? "Curso guardado; precio y cobro requieren política" : "Curso borrador creado sin sesiones ni inscripciones ficticias", id)
}

export function updateCourseProgram(courseId: string, sections: ProgramSection[], expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const course = state.courses.find((item) => item.id === courseId)
  if (!course) return { ok: false, status: "invalid", message: "Curso no disponible", operationId: opId }
  if (course.version !== expectedVersion) return { ok: false, status: "conflict", message: "El programa cambió durante la edición", operationId: opId }
  course.program = sections
  course.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Programa de curso versionado", domain: "Cursos", objectType: "curso", objectId: courseId }, "Programa guardado con orden accesible", courseId)
}

export function sessionConflicts(startsAt: string, endsAt: string, instructorId: string, ignoreSessionId?: string) {
  const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => new Date(aStart).getTime() < new Date(bEnd).getTime() && new Date(bStart).getTime() < new Date(aEnd).getTime()
  const reservations = todasLasReservas().filter((reservation) => reservation.profesionalId === instructorId && !["cancelada", "ausente"].includes(reservation.estado) && overlap(startsAt, endsAt, reservation.inicio, reservation.fin)).map((reservation) => ({ type: "Reserva P2", id: reservation.id, label: `${reservation.inicio.slice(11, 16)} · ${CLIENTES.find((item) => item.id === reservation.clienteId)?.nombre ?? reservation.clienteId}` }))
  const sessions = state.courses.flatMap((course) => course.sessions.filter((session) => session.id !== ignoreSessionId && session.instructorId === instructorId && session.status !== "cancelled" && overlap(startsAt, endsAt, session.startsAt, session.endsAt)).map((session) => ({ type: "Sesión", id: session.id, label: `${course.name} · ${session.startsAt.slice(11, 16)}` })))
  return [...reservations, ...sessions]
}

export function createCourseSession(courseId: string, input: Omit<CourseSession, "id" | "status" | "version">, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const course = state.courses.find((item) => item.id === courseId)
  if (!course) return { ok: false, status: "invalid", message: "Curso no disponible", operationId: opId }
  if (course.version !== expectedVersion) return { ok: false, status: "conflict", message: "El curso cambió durante la revisión", operationId: opId }
  const conflicts = sessionConflicts(input.startsAt, input.endsAt, input.instructorId)
  if (conflicts.length) return { ok: false, status: "conflict", message: `Conflicto con ${conflicts[0].type} ${conflicts[0].id}`, operationId: opId }
  const id = `SES-${String(course.sessions.length + 2).padStart(2, "0")}`
  course.sessions.push({ ...input, id, status: "scheduled", version: 1 })
  course.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Sesión creada", domain: "Cursos", objectType: "sesion", objectId: id, after: input.startsAt }, "Sesión creada y recurso ocupado", id)
}

export function updateCourseSession(courseId:string,sessionId:string,input:Pick<CourseSession,"startsAt"|"endsAt"|"instructorId"|"resourceId">,expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  const course=state.courses.find(item=>item.id===courseId),session=course?.sessions.find(item=>item.id===sessionId)
  if(!course||!session||course.version!==expectedVersion)return {ok:false,status:"conflict",message:"La sesión cambió durante la revisión",operationId:opId}
  const conflicts=sessionConflicts(input.startsAt,input.endsAt,input.instructorId,sessionId);if(conflicts.length)return {ok:false,status:"conflict",message:`Conflicto con ${conflicts[0].type} ${conflicts[0].id}`,operationId:opId}
  const before=session.startsAt;Object.assign(session,input);session.version+=1;course.version+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:"Sesión reprogramada",domain:"Cursos",objectType:"sesion",objectId:sessionId,before,after:input.startsAt},"Sesión reprogramada; participantes conservados y sin mensajes externos",sessionId)
}

export function setCourseStatus(courseId:string,status:Course["status"],expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  const course=state.courses.find(item=>item.id===courseId);if(!course||course.version!==expectedVersion)return {ok:false,status:"conflict",message:"El curso cambió durante la revisión",operationId:opId}
  if(status==="completed"&&course.sessions.some(session=>session.status==="scheduled"))return {ok:false,status:"invalid",message:"Registrá o cancelá las sesiones pendientes antes de finalizar",operationId:opId}
  const before=course.status;course.status=status;course.version+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:`Curso ${status}`,domain:"Cursos",objectType:"curso",objectId:courseId,before,after:status},"Estado docente actualizado; obligaciones P4 no fueron alteradas",courseId)
}

export function enrollClient(courseId: string, clientId: string, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const course = state.courses.find((item) => item.id === courseId)
  if (!course || !CLIENTES.some((item) => item.id === clientId)) return { ok: false, status: "invalid", message: "Curso o cliente no disponible", operationId: opId }
  if (course.enrollments.some((item) => item.clientId === clientId && item.status !== "cancelled")) return { ok: false, status: "duplicate", message: "El cliente ya tiene una inscripción", operationId: opId }
  const occupied = course.enrollments.filter((item) => item.status === "enrolled").length
  if (occupied >= course.capacity) return { ok: false, status: "policy_required", message: "Cupo completo. La prioridad de lista de espera no está definida", operationId: opId }
  const id = `ENR-${String(course.enrollments.length + 1).padStart(2, "0")}`
  course.enrollments.push({ id, clientId, status: "enrolled", attendance: Object.fromEntries(course.sessions.map((session) => [session.id, "pending"])) })
  course.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Participante inscripto", domain: "Cursos", objectType: "inscripcion", objectId: id, after: clientId }, "Inscripción única registrada; situación económica separada", id)
}

export function saveAttendance(courseId: string, sessionId: string, values: Record<string, "pending" | "present" | "absent">, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const course = state.courses.find((item) => item.id === courseId)
  const session = course?.sessions.find((item) => item.id === sessionId)
  if (!course || !session) return { ok: false, status: "invalid", message: "Sesión no disponible", operationId: opId }
  course.enrollments.filter((item) => item.status === "enrolled").forEach((enrollment) => { enrollment.attendance[sessionId] = values[enrollment.clientId] ?? "pending" })
  course.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Asistencia registrada", domain: "Cursos", objectType: "sesion", objectId: sessionId }, "Asistencia guardada; progreso recalculado desde sesiones reales", sessionId)
}

export function updateProfileDraft(updates: Partial<MoreState["profile"]["draft"]>, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  state.profile.draft = { ...state.profile.draft, ...updates }
  state.profile.draftVersion += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Borrador público actualizado", domain: "Presencia", objectType: "perfil_publico", objectId: "PUBLIC-PROFILE", after: `draft v${state.profile.draftVersion}` }, "Borrador guardado; la versión publicada no cambió", "PUBLIC-PROFILE")
}

export function publishProfile(expectedDraftVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  if (state.profile.draftVersion !== expectedDraftVersion) return { ok: false, status: "conflict", message: "El borrador cambió durante la revisión", operationId: opId }
  if (!state.profile.draft.name.trim() || !state.profile.draft.description.trim() || !state.profile.draft.phone.trim()) return { ok: false, status: "invalid", message: "Completá nombre, descripción y contacto público", operationId: opId }
  state.profile.published = structuredClone(state.profile.draft)
  state.profile.publishedVersion = state.profile.draftVersion
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Perfil publicado en demo", domain: "Presencia", objectType: "perfil_publico", objectId: "PUBLIC-PROFILE", before: `v${expectedDraftVersion - 1}`, after: `v${expectedDraftVersion}` }, "Versión demo publicada; no hubo despliegue externo", "PUBLIC-PROFILE")
}

export function savePromotion(promotion: Omit<Promotion, "id" | "status" | "version">, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  if (!promotion.name.trim() || promotion.targetIds.length === 0 || promotion.startsAt > promotion.endsAt) return { ok: false, status: "invalid", message: "Revisá nombre, objetivo y vigencia", operationId: opId }
  const id = `PROMO-${String(state.promotions.length + 1).padStart(2, "0")}`
  state.promotions.push({ ...promotion, id, status: "draft", version: 1 })
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Promoción borrador creada", domain: "Presencia", objectType: "promocion", objectId: id }, "Promoción guardada como borrador; no se aplicó descuento", id)
}

export function activatePromotion(promotionId: string, expectedVersion: number, opId: string): MoreResult {
  const promotion = state.promotions.find((item) => item.id === promotionId)
  if (!promotion) return { ok: false, status: "invalid", message: "Promoción no disponible", operationId: opId }
  if (!promotion.policyApproved) return { ok: false, status: "policy_required", message: "La regla de beneficio y acumulación requiere política comercial", operationId: opId }
  const early = begin(opId)
  if (early) return early
  if (promotion.version !== expectedVersion) return { ok: false, status: "conflict", message: "La promoción cambió durante la revisión", operationId: opId }
  promotion.status = "active"
  promotion.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Promoción activada", domain: "Presencia", objectType: "promocion", objectId: promotionId }, "Promoción activa para futuras operaciones elegibles", promotionId)
}

export function setPromotionStatus(promotionId: string, status: "paused" | "ended", expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const promotion = state.promotions.find((item) => item.id === promotionId)
  if (!promotion || promotion.version !== expectedVersion) return { ok: false, status: "conflict", message: "Revisá la versión actual de la promoción", operationId: opId }
  promotion.status = status
  promotion.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: status === "paused" ? "Promoción pausada" : "Promoción finalizada", domain: "Presencia", objectType: "promocion", objectId: promotionId }, "No se alteraron aplicaciones históricas", promotionId)
}

export function scheduleImpacts(day: string, intervals: Array<{ start: string; end: string }>) {
  const dayIndex = weekdays.indexOf(day)
  const targetDates = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]
  const date = targetDates[Math.max(0, dayIndex)]
  const inside = (iso: string) => intervals.some((interval) => iso.slice(11, 16) >= interval.start && iso.slice(11, 16) < interval.end)
  const reservations = todasLasReservas().filter((reservation) => reservation.inicio.startsWith(date) && reservation.estado === "confirmada" && !inside(reservation.inicio)).map((reservation) => ({ type: "Reserva P2", id: reservation.id }))
  const sessions = state.courses.flatMap((course) => course.sessions.filter((session) => session.startsAt.startsWith(date) && session.status === "scheduled" && !inside(session.startsAt)).map((session) => ({ type: "Curso", id: session.id })))
  return [...reservations, ...sessions]
}

export function updateScheduleDay(day: string, intervals: Array<{ start: string; end: string }>, opId: string, expectedVersion = state.scheduleVersion): MoreResult {
  const early = begin(opId)
  if (early) return early
  if(expectedVersion!==state.scheduleVersion)return {ok:false,status:"conflict",message:"El horario cambió durante la revisión",operationId:opId}
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start))
  if (sorted.some((interval, index) => interval.start >= interval.end || (index > 0 && sorted[index - 1].end > interval.start))) return { ok: false, status: "invalid", message: "Los intervalos deben estar ordenados y no superponerse", operationId: opId }
  const impacts = scheduleImpacts(day, sorted)
  if (impacts.length) return { ok: false, status: "conflict", message: `${impacts.length} compromiso(s) requieren resolución en su dominio propietario`, operationId: opId }
  state.schedule[day] = sorted.map((interval, index) => ({ id: `${day}-${index + 1}`, ...interval }))
  state.scheduleVersion += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Horario local actualizado", domain: "Horarios", objectType: "horario", objectId: day }, "Horario actualizado para disponibilidad futura", day)
}

export function updateWeekSchedule(next:BusinessSchedule,expectedVersion:number,opId:string):MoreResult{
  const early=begin(opId);if(early)return early
  if(expectedVersion!==state.scheduleVersion)return {ok:false,status:"conflict",message:"El horario cambió durante la revisión",operationId:opId}
  for(const day of weekdays){const sorted=[...(next[day]??[])].sort((a,b)=>a.start.localeCompare(b.start));if(sorted.some((band,index)=>band.start>=band.end||(index>0&&sorted[index-1].end>band.start)))return {ok:false,status:"invalid",message:`Revisá los intervalos de ${day}`,operationId:opId};const impacts=scheduleImpacts(day,sorted);if(impacts.length)return {ok:false,status:"conflict",message:`${impacts.length} compromiso(s) de ${day} requieren resolución`,operationId:opId}}
  state.schedule=structuredClone(next);state.scheduleVersion+=1
  return commit(opId,{actor:"Dueño YoungKingZ",action:"Semana local actualizada",domain:"Horarios",objectType:"horario",objectId:"WEEK"},"Semana actualizada atómicamente para disponibilidad futura","WEEK")
}

export function addScheduleException(input: MoreState["exceptions"][number], opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  if (state.exceptions.some((item) => item.date === input.date)) return { ok: false, status: "duplicate", message: "Ya existe una excepción para esa fecha", operationId: opId }
  state.exceptions.push(input)
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Excepción de horario creada", domain: "Horarios", objectType: "excepcion", objectId: input.id }, "Excepción guardada; compromisos existentes permanecen", input.id)
}

export function updateBookingRules(updates: Partial<MoreState["bookingRules"]>, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const next = { ...state.bookingRules, ...updates }
  if (next.minNoticeMinutes < 0 || next.maxHorizonDays < 1) return { ok: false, status: "invalid", message: "Revisá anticipación mínima y horizonte", operationId: opId }
  state.bookingRules = next
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Reglas de reserva actualizadas", domain: "Horarios", objectType: "reglas_reserva", objectId: "BOOKING-RULES" }, "Reglas demo actualizadas; no se movieron reservas", "BOOKING-RULES")
}

export function updateBusiness(updates: Partial<MoreState["business"]>, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  if (state.business.version !== expectedVersion) return { ok: false, status: "conflict", message: "Los datos internos cambiaron", operationId: opId }
  state.business = { ...state.business, ...updates, version: state.business.version + 1 }
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Datos internos actualizados", domain: "Acceso", objectType: "negocio", objectId: "BUSINESS" }, "Datos internos guardados; el perfil público no cambió", "BUSINESS")
}

export function linkDemoAccount(accountId: string, staffId: string, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account || !listStaff().some((item) => item.id === staffId)) return { ok: false, status: "invalid", message: "Cuenta o integrante no disponible", operationId: opId }
  if (state.accounts.some((item) => item.id !== accountId && item.staffId === staffId)) return { ok: false, status: "duplicate", message: "Ese integrante ya está vinculado a otra cuenta", operationId: opId }
  account.staffId = staffId
  account.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Cuenta demo vinculada", domain: "Acceso", objectType: "cuenta", objectId: accountId, after: staffId }, "Vínculo demo guardado; no se enviaron credenciales", accountId)
}

export function updateCapabilities(accountId: string, capabilities: Record<string, boolean>, expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account || account.version !== expectedVersion) return { ok: false, status: "conflict", message: "La cuenta cambió durante la revisión", operationId: opId }
  const activeAdmins = state.accounts.filter((item) => item.status === "active" && ["owner", "admin"].includes(item.role) && item.capabilities["settings.admin"])
  if (activeAdmins.length === 1 && activeAdmins[0].id === accountId && !capabilities["settings.admin"]) return { ok: false, status: "permission_denied", message: "No puede quedar el negocio sin un administrador válido", operationId: opId }
  account.capabilities = capabilities
  account.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: "Capacidades actualizadas", domain: "Acceso", objectType: "cuenta", objectId: accountId }, "Permisos actualizados como conjunto atómico", accountId)
}

export function setAccountStatus(accountId: string, status: "active" | "suspended", expectedVersion: number, opId: string): MoreResult {
  const early = begin(opId)
  if (early) return early
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account || account.version !== expectedVersion) return { ok: false, status: "conflict", message: "La cuenta cambió durante la revisión", operationId: opId }
  const activeAdmins = state.accounts.filter((item) => item.status === "active" && ["owner", "admin"].includes(item.role) && item.capabilities["settings.admin"])
  if (status === "suspended" && activeAdmins.length === 1 && activeAdmins[0].id === accountId) return { ok: false, status: "permission_denied", message: "No se puede suspender el último administrador", operationId: opId }
  account.status = status
  account.version += 1
  return commit(opId, { actor: "Dueño YoungKingZ", action: status === "suspended" ? "Cuenta demo suspendida" : "Cuenta demo reactivada", domain: "Acceso", objectType: "cuenta", objectId: accountId }, status === "suspended" ? "Acceso suspendido; integrante e historial intactos" : "Acceso demo reactivado", accountId)
}

export function markAlertRead(alertId: string) {
  const alert = state.alerts.find((item) => item.id === alertId)
  if (!alert) return
  alert.read = true
  state = { ...state }
  emit()
}

export function allAuditEvents(): AuditEvent[] {
  const inventoryEvents = inventoryStore.getSnapshot().audits.slice(-8).map((event) => ({ id: `P3-${event.id}`, at: event.date, actor: "Inventario P3", action: event.detail, domain: "Inventario" as const, objectType: event.type, objectId: event.operationId }))
  const financeEvents = financeStore.getSnapshot().audits.slice(-8).map((event) => ({ id: `P4-${event.id}`, at: event.date, actor: "Finanzas P4", action: event.detail, domain: "Finanzas" as const, objectType: event.type, objectId: event.operationId }))
  return [...state.audit, ...inventoryEvents, ...financeEvents].sort((a, b) => b.at.localeCompare(a.at))
}

export function reservationsForClient(clientId: string) {
  return todasLasReservas().filter((item) => item.clienteId === clientId)
}

export function inventoryOrdersForClient(clientId: string) {
  return inventoryStore.getSnapshot().orders.filter((item) => item.clientId === clientId)
}

export function financeSalesForClient(clientId: string) {
  return financeStore.getSnapshot().sales.filter((item) => item.clientId === clientId)
}

export function moneyArs(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value / 100)
}

export function verifyMoreInvariants(): string[] {
  const errors: string[] = []
  const clientIds = new Set(CLIENTES.map((item) => item.id))
  if (clientIds.size !== CLIENTES.length) errors.push("IDs de cliente duplicados")
  if (new Set(SERVICIOS.map((item) => item.id)).size !== SERVICIOS.length) errors.push("IDs de servicio duplicados")
  for (const course of state.courses) {
    const enrolled = course.enrollments.filter((item) => item.status === "enrolled").length
    if (enrolled > course.capacity) errors.push(`${course.id}: cupo excedido`)
    if (new Set(course.enrollments.filter((item) => item.status !== "cancelled").map((item) => item.clientId)).size !== course.enrollments.filter((item) => item.status !== "cancelled").length) errors.push(`${course.id}: inscripción duplicada`)
    for (const session of course.sessions) {
      if (new Date(session.startsAt) >= new Date(session.endsAt)) errors.push(`${session.id}: intervalo inválido`)
    }
  }
  const admins = state.accounts.filter((item) => item.status === "active" && item.capabilities["settings.admin"])
  if (admins.length === 0) errors.push("Sin administrador activo")
  if (state.profile.publishedVersion > state.profile.draftVersion) errors.push("Versión publicada supera borrador")
  return errors
}

