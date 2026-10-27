import { PROFESIONALES, SERVICIOS, todasLasAtenciones, todasLasReservas } from "./agenda"

export type StaffStatus = "activo" | "inactivo"
export type StaffRole = "Barbero" | "Recepción" | "Administración"
export type AccountStatus = "sin_cuenta" | "habilitada" | "suspendida"
export type AgreementKind = "comision" | "alquiler" | "fijo" | "mixto"
export type SettlementStatus = "abierta" | "cerrada" | "parcial" | "pagada"

export type ScheduleBand = { id: string; from: string; to: string }
export type ScheduleDay = { day: string; closed: boolean; bands: ScheduleBand[] }

export type StaffMember = {
  id: string
  name: string
  phone?: string
  email?: string
  roles: StaffRole[]
  status: StaffStatus
  joinedAt: string
  account: { status: AccountStatus; user?: string }
  enabledServices: string[]
  customDurations: Record<string, number>
  schedule: ScheduleDay[]
  permissions: Record<string, boolean>
}

export type AgreementVersion = {
  id: string
  staffId: string
  kind: AgreementKind
  amount?: number
  percentage?: number
  frequency: "semanal" | "mensual"
  collection?: "barberia" | "profesional"
  validFrom: string
  validTo?: string
  status: "vigente" | "programada" | "finalizada"
}

export type SettlementOperation = {
  id: string
  origin: string
  service?: string
  base: number
  rule: string
  amount: number
  correctionOf?: string
}

export type Settlement = {
  id: string
  staffId: string
  period: string
  status: SettlementStatus
  base: number
  total: number
  paid: number
  due: number
  operations: SettlementOperation[]
  closedAt?: string
}

export type StaffException = {
  id: string
  staffId: string
  type: "ausencia" | "horario_especial"
  from: string
  to: string
  reason: string
  status: "vigente" | "cancelada"
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const baseSchedule = (): ScheduleDay[] =>
  DAYS.map((day) => ({
    day,
    closed: day === "Domingo",
    bands: day === "Domingo" ? [] : [{ id: `${day}-1`, from: "09:00", to: day === "Sábado" ? "19:00" : "20:00" }],
  }))

const defaultPermissions = (admin = false): Record<string, boolean> => ({
  "agenda.ver": true,
  "agenda.editar": true,
  "clientes.ver": true,
  "clientes.editar": true,
  "inventario.ver": admin,
  "finanzas.ver": admin,
  "administracion.equipo": admin,
})

let staff: StaffMember[] = PROFESIONALES.map((professional, index) => ({
  id: professional.id,
  name: professional.nombre,
  phone: index === 0 ? "+54 9 11 4321-8801" : undefined,
  email: index === 0 ? "alex@youngkingz.demo" : index === 3 ? "camila@youngkingz.demo" : undefined,
  roles: [professional.responsabilida as StaffRole],
  status: professional.estado,
  joinedAt: [`2024-02-12`, `2024-04-08`, `2025-01-16`, `2025-03-03`, `2023-11-20`][index],
  account: index === 0
    ? { status: "habilitada", user: "alex@youngkingz.demo" }
    : index === 3
      ? { status: "habilitada", user: "camila@youngkingz.demo" }
      : index === 4
        ? { status: "suspendida", user: "tomas@youngkingz.demo" }
        : { status: "sin_cuenta" },
  enabledServices: [...professional.serviciosHabilitados],
  customDurations: {},
  schedule: baseSchedule(),
  permissions: defaultPermissions(index === 3),
}))

let agreements: AgreementVersion[] = [
  { id: "AGR-ALEX-01", staffId: "ST01", kind: "comision", percentage: 60, frequency: "semanal", collection: "barberia", validFrom: "2026-10-01", status: "vigente" },
  { id: "AGR-NICO-01", staffId: "ST02", kind: "alquiler", amount: 100000, frequency: "semanal", collection: "profesional", validFrom: "2026-10-01", status: "vigente" },
  { id: "AGR-LEO-01", staffId: "ST03", kind: "fijo", amount: 250000, frequency: "mensual", validFrom: "2026-10-01", status: "vigente" },
  { id: "AGR-TOMAS-01", staffId: "ST05", kind: "comision", percentage: 50, frequency: "semanal", collection: "barberia", validFrom: "2025-01-01", validTo: "2026-08-31", status: "finalizada" },
]

const currentAlexOps: SettlementOperation[] = [
  { id: "OP-61001", origin: "Venta confirmada Juan", service: "Corte clásico", base: 18000, rule: "AGR-ALEX-01 · 60%", amount: 10800 },
  { id: "OP-61002", origin: "Venta confirmada Sofía", service: "Corte clásico", base: 18000, rule: "AGR-ALEX-01 · 60%", amount: 10800 },
  { id: "OP-61003", origin: "Venta confirmada Andrea", service: "Corte + barba", base: 25000, rule: "AGR-ALEX-01 · 60%", amount: 15000 },
]

let settlements: Settlement[] = [
  { id: "LIQ-ALEX-2026-43", staffId: "ST01", period: "19–25 oct 2026", status: "abierta", base: 61000, total: 36600, paid: 0, due: 36600, operations: currentAlexOps },
  { id: "LIQ-ALEX-2026-42", staffId: "ST01", period: "12–18 oct 2026", status: "parcial", base: 100000, total: 50000, paid: 30000, due: 20000, closedAt: "2026-10-19T09:05:00-03:00", operations: [
    { id: "OP-60001", origin: "4 ventas históricas", service: "Corte + barba", base: 100000, rule: "AGR-ALEX-01 · 60%", amount: 60000 },
    { id: "OP-60002", origin: "Adelanto documentado", base: 0, rule: "Ajuste", amount: -10000 },
  ] },
  { id: "OBL-NICO-2026-43", staffId: "ST02", period: "19–25 oct 2026", status: "abierta", base: 100000, total: 100000, paid: 0, due: 100000, operations: [{ id: "OP-NICO-01", origin: "Alquiler de silla", base: 100000, rule: "AGR-NICO-01", amount: 100000 }] },
  { id: "LIQ-LEO-2026-10", staffId: "ST03", period: "Octubre 2026", status: "abierta", base: 250000, total: 250000, paid: 0, due: 250000, operations: [{ id: "OP-LEO-01", origin: "Fijo mensual", base: 250000, rule: "AGR-LEO-01", amount: 250000 }] },
]

let exceptions: StaffException[] = [
  { id: "EX-01", staffId: "ST01", type: "horario_especial", from: "2026-10-31T10:00:00-03:00", to: "2026-10-31T16:00:00-03:00", reason: "Horario especial", status: "vigente" },
]

const paymentAttempts = new Set<string>()
let counter = 100

export function listStaff(): StaffMember[] { return staff.map((member) => ({ ...member })) }
export function staffById(id: string): StaffMember | undefined { return staff.find((member) => member.id === id) }
export function agreementsFor(id: string): AgreementVersion[] { return agreements.filter((agreement) => agreement.staffId === id) }
export function activeAgreement(id: string): AgreementVersion | undefined { return agreements.find((agreement) => agreement.staffId === id && agreement.status === "vigente") }
export function settlementsFor(id: string): Settlement[] { return settlements.filter((settlement) => settlement.staffId === id) }
export function settlementById(id: string): Settlement | undefined { return settlements.find((settlement) => settlement.id === id) }
export function exceptionsFor(id: string): StaffException[] { return exceptions.filter((entry) => entry.staffId === id) }

export function addStaff(input: Pick<StaffMember, "name" | "phone" | "email" | "roles">): { ok: boolean; member?: StaffMember; duplicate?: StaffMember } {
  const duplicate = staff.find((member) => member.name.localeCompare(input.name, "es", { sensitivity: "base" }) === 0 || (input.email && member.email === input.email))
  if (duplicate) return { ok: false, duplicate }
  counter += 1
  const member: StaffMember = {
    id: `ST${counter}`,
    ...input,
    status: "activo",
    joinedAt: "2026-10-24",
    account: { status: "sin_cuenta" },
    enabledServices: [],
    customDurations: {},
    schedule: DAYS.map((day) => ({ day, closed: true, bands: [] })),
    permissions: defaultPermissions(false),
  }
  staff = [...staff, member]
  return { ok: true, member }
}

export function updateStaff(id: string, updates: Partial<Pick<StaffMember, "name" | "phone" | "email" | "roles" | "status" | "enabledServices" | "customDurations" | "schedule" | "permissions">>): boolean {
  const index = staff.findIndex((member) => member.id === id)
  if (index < 0) return false
  staff[index] = { ...staff[index], ...updates }
  return true
}

export function toggleAccount(id: string): AccountStatus | undefined {
  const member = staffById(id)
  if (!member || member.account.status === "sin_cuenta") return undefined
  member.account.status = member.account.status === "habilitada" ? "suspendida" : "habilitada"
  return member.account.status
}

export function linkAccount(id: string, email: string): boolean {
  const member = staffById(id)
  if (!member || !email.includes("@")) return false
  member.email = email
  member.account = { status: "habilitada", user: email }
  return true
}

export function createAgreement(input: Omit<AgreementVersion, "id" | "status">): AgreementVersion {
  counter += 1
  const agreement: AgreementVersion = { ...input, id: `AGR-${counter}`, status: "programada" }
  agreements = [...agreements, agreement]
  return agreement
}

export function closeSettlement(id: string): { ok: boolean; reason?: string } {
  const settlement = settlementById(id)
  if (!settlement) return { ok: false, reason: "Liquidación inexistente" }
  if (settlement.status !== "abierta") return { ok: false, reason: "La liquidación ya fue cerrada" }
  if (id.includes("2026-43")) return { ok: false, reason: "El período termina el 25/10; todavía no puede cerrarse" }
  settlement.status = "cerrada"
  settlement.closedAt = "2026-10-24T14:00:00-03:00"
  return { ok: true }
}

export function registerPayment(id: string, amount: number, method: "transferencia" | "efectivo", attemptId: string, opts?: { cashSessionOpen?: boolean }): { ok: boolean; reason?: string } {
  if (paymentAttempts.has(attemptId)) return { ok: false, reason: "Este pago ya fue registrado" }
  const settlement = settlementById(id)
  if (!settlement) return { ok: false, reason: "Liquidación inexistente" }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "Ingresá un importe mayor que cero" }
  if (amount > settlement.due) return { ok: false, reason: "El importe supera el saldo pendiente" }
  if (method === "efectivo" && !opts?.cashSessionOpen) return { ok: false, reason: "No hay una sesión de Caja demo abierta" }
  paymentAttempts.add(attemptId)
  settlement.paid += amount
  settlement.due -= amount
  settlement.status = settlement.due === 0 ? "pagada" : "parcial"
  return { ok: true }
}

/** P4: aplica un crédito/adelanto a una liquidación; no registra dinero recibido. */
export function applySettlementCredit(id: string, amount: number, attemptId: string): { ok: boolean; reason?: string } {
  if (paymentAttempts.has(attemptId)) return { ok: false, reason: "Esta aplicación ya fue registrada" }
  const settlement = settlementById(id)
  if (!settlement) return { ok: false, reason: "Liquidación inexistente" }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "Ingresá un importe mayor que cero" }
  if (amount > settlement.due) return { ok: false, reason: "La aplicación supera el saldo pendiente" }
  paymentAttempts.add(attemptId)
  settlement.paid += amount
  settlement.due -= amount
  settlement.status = settlement.due === 0 ? "pagada" : "parcial"
  return { ok: true }
}

export function addException(input: Omit<StaffException, "id" | "status">): StaffException {
  counter += 1
  const entry: StaffException = { ...input, id: `EX-${counter}`, status: "vigente" }
  exceptions = [...exceptions, entry]
  return entry
}

export function activityFor(staffId: string) {
  const reservations = todasLasReservas()
  return todasLasAtenciones()
    .filter((attention) => attention.profesionalId === staffId && attention.estado === "completada")
    .map((attention) => {
      const reservation = attention.reservaId ? reservations.find((item) => item.id === attention.reservaId) : undefined
      return {
        ...attention,
        clientId: attention.clienteId,
        linkedReservation: reservation?.id,
        serviceNames: attention.serviciosRealizados.map((id) => SERVICIOS.find((service) => service.id === id)?.nombre ?? id),
      }
    })
}

export function money(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
}
