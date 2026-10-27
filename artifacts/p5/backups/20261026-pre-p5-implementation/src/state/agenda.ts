/* eslint-disable */
/**
 * Fuente única de verdad para Agenda (P2-A).
 * Estado demo, tipos y operaciones mutantes.
 * Ninguna pantalla debe mantener su propio estado duplicado.
 */

import type { ReactNode } from "react"

/* ═════════════════════════════════════════════════════════════════
   Reloj del escenario
   ═════════════════════════════════════════════════════════════════ */

export const DEMO_TZ = "America/Argentina/Buenos_Aires"

/** Sábado 24 de octubre de 2026, 14:00 (hora simulada del escenario) */
export const DEMO_NOW_ISO = "2026-10-24T14:00:00-03:00"

export function demoNow(): Date {
  return new Date(DEMO_NOW_ISO)
}

export function demoTodayKey(): string {
  return DEMO_NOW_ISO.slice(0, 10)
}

export function demoTodayLabel(iso?: string): string {
  const key = (iso ?? DEMO_NOW_ISO).slice(0, 10)
  const d = new Date(`${key}T12:00:00Z`)
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  if (isNaN(d.getTime())) return iso
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/* ══════════════════════════════════════════════════════════════════
   Tipos de dominio
   ══════════════════════════════════════════════════════════════════ */

export type Cliente = {
  id: string
  nombre: string
  telefono?: string
  correo?: string
}

export type Servicio = {
  id: string
  nombre: string
  duracionMin: number
  precio: number
  activo: boolean
}

export type Profesional = {
  id: string
  nombre: string
  responsabilida: string // "Barbero" | "Recepción"
  estado: "activo" | "inactivo"
  serviciosHabilitados: string[] // ids de Servicio
}

export type ReservaEstado = "confirmada" | "en_atencion" | "finalizada" | "ausente" | "cancelada"

export type Reserva = {
  id: string
  clienteId: string
  servicioId: string
  profesionalId: string
  inicio: string // ISO
  fin: string // ISO
  estado: ReservaEstado
  origen: "reserva_web" | "recepción" | "presencial"
  observaciones?: string
  historial: ReservaHistorialEntry[]
}

export type ReservaHistorialEntry = {
  id: string
  momento: string // ISO
  accion: "creada" | "editada" | "reprogramada" | "cancelada" | "inicio_atencion" | "fin_atencion" | "inasistencia" | "atencion_registrada"
  detalle?: string
}

export type AtencionEstado = "en_curso" | "completada"

export type Atencion = {
  id: string
  reservaId?: string
  clienteId?: string
  profesionalId: string
  serviciosRealizados: string[] // ids de Servicio
  inicio: string // ISO
  fin?: string // ISO
  estado: AtencionEstado
  observaciones?: string
}

export type BloqueoEstado = "activo" | "levantado"

export type Bloqueo = {
  id: string
  profesionalId: string
  inicio: string // ISO
  fin: string // ISO
  motivo: string
  observaciones?: string
  estado: BloqueoEstado
  historial: BloqueoHistorialEntry[]
}

export type BloqueoHistorialEntry = {
  id: string
  momento: string // ISO
  accion: "creado" | "editado" | "eliminado"
  detalle?: string
}

/* ══════════════════════════════════════════════════════════════════
   Catálogo demo
   ══════════════════════════════════════════════════════════════════ */

export const SERVICIOS: Servicio[] = [
  { id: "SV01", nombre: "Corte clásico", duracionMin: 30, precio: 18000, activo: true },
  { id: "SV02", nombre: "Corte + barba", duracionMin: 50, precio: 25000, activo: true },
  { id: "SV03", nombre: "Barba", duracionMin: 20, precio: 12000, activo: true },
]

export const PROFESIONALES: Profesional[] = [
  { id: "ST01", nombre: "Alex Martínez", responsabilida: "Barbero", estado: "activo", serviciosHabilitados: ["SV01", "SV02", "SV03"] },
  { id: "ST02", nombre: "Nicolás García", responsabilida: "Barbero", estado: "activo", serviciosHabilitados: ["SV01", "SV02", "SV03"] },
  { id: "ST03", nombre: "Leo Fernández", responsabilida: "Barbero", estado: "activo", serviciosHabilitados: ["SV01", "SV02", "SV03"] },
  { id: "ST04", nombre: "Camila Ruiz", responsabilida: "Recepción", estado: "activo", serviciosHabilitados: [] },
  { id: "ST05", nombre: "Tomás Díaz", responsabilida: "Barbero", estado: "inactivo", serviciosHabilitados: ["SV01", "SV02", "SV03"] },
]

export const CLIENTES: Cliente[] = [
  { id: "CL01", nombre: "Juan Pérez", telefono: "+54 9 11 2345-6789", correo: "juan.perez@example.com" },
  { id: "CL02", nombre: "Martín Gómez", telefono: "+54 9 11 3456-7890", correo: "martin.gomez@example.com" },
  { id: "CL03", nombre: "Lucas Fernández", telefono: "+54 9 11 4567-8901", correo: "lucas.fernandez@example.com" },
  { id: "CL04", nombre: "Sofía Ramírez", telefono: "+54 9 11 5678-9012", correo: "sofia.ramirez@example.com" },
  { id: "CL05", nombre: "Marcelo Torres", telefono: "+54 9 11 6789-0123", correo: "marcelo.torres@example.com" },
  { id: "CL06", nombre: "Bruno Acosta", telefono: "+54 9 11 7890-1234", correo: "bruno.acosta@example.com" },
  { id: "CL07", nombre: "Andrea López", telefono: "+54 9 11 8901-2345", correo: "andrea.lopez@example.com" },
  { id: "CL08", nombre: "Emilia Castro", telefono: "+54 9 11 9012-3456", correo: "emilia.castro@example.com" },
  { id: "CL09", nombre: "Thiago Gómez", telefono: "+54 9 11 0123-4567", correo: "thiago.gomez@example.com" },
  { id: "CL10", nombre: "Mauro Díaz", telefono: "+54 9 11 1234-5678", correo: "mauro.diaz@example.com" },
  { id: "CL11", nombre: "Clara Ruiz", telefono: "+54 9 11 2345-6780", correo: "clara.ruiz@example.com" },
  { id: "CL12", nombre: "Franco Molina", telefono: "+54 9 11 3456-7891", correo: "franco.molina@example.com" },
]

/* ══════════════════════════════════════════════════════════════════
   Helpers de tiempo
   ══════════════════════════════════════════════════════════════════ */

function parseISO(iso: string): Date {
  return new Date(iso)
}

function isoKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`
}

function dayStartISO(iso: string): string {
  const d = new Date(iso)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function addMinutesISO(iso: string, min: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + min)
  return d.toISOString()
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = new Date(aStart).getTime()
  const aE = new Date(aEnd).getTime()
  const bS = new Date(bStart).getTime()
  const bE = new Date(bEnd).getTime()
  return aS < bE && bS < aE
}

/* ══════════════════════════════════════════════════════════════════
   Estado in-memory (única fuente de verdad)
   ══════════════════════════════════════════════════════════════════ */

let _reservas: Reserva[] = []
let _atenciones: Atencion[] = []
let _bloqueos: Bloqueo[] = []
let _contador = 1000

function nextId(): string {
  _contador += 1
  return `ag-${_contador}`
}

function historialReserva(accion: ReservaHistorialEntry["accion"], detalle?: string): ReservaHistorialEntry {
  return { id: `h-${nextId()}`, momento: DEMO_NOW_ISO, accion, detalle }
}

function historialBloqueo(accion: BloqueoHistorialEntry["accion"], detalle?: string): BloqueoHistorialEntry {
  return { id: `hb-${nextId()}`, momento: DEMO_NOW_ISO, accion, detalle }
}

export function inicializarFixtures(): void {
  if (_reservas.length > 0) return

  const base = "2026-10-24T"

  const reservasData: Omit<Reserva, "id" | "historial">[] = [
    { clienteId: "CL01", servicioId: "SV01", profesionalId: "ST01", inicio: `${base}09:00:00-03:00`, fin: `${base}09:30:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL02", servicioId: "SV02", profesionalId: "ST02", inicio: `${base}09:30:00-03:00`, fin: `${base}10:20:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL03", servicioId: "SV01", profesionalId: "ST03", inicio: `${base}10:00:00-03:00`, fin: `${base}10:30:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL04", servicioId: "SV01", profesionalId: "ST01", inicio: `${base}10:45:00-03:00`, fin: `${base}11:15:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL05", servicioId: "SV01", profesionalId: "ST02", inicio: `${base}11:30:00-03:00`, fin: `${base}12:00:00-03:00`, estado: "ausente", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL06", servicioId: "SV03", profesionalId: "ST03", inicio: `${base}12:00:00-03:00`, fin: `${base}12:20:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL07", servicioId: "SV02", profesionalId: "ST01", inicio: `${base}12:30:00-03:00`, fin: `${base}13:20:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL08", servicioId: "SV01", profesionalId: "ST02", inicio: `${base}13:00:00-03:00`, fin: `${base}13:30:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL09", servicioId: "SV03", profesionalId: "ST03", inicio: `${base}13:15:00-03:00`, fin: `${base}13:35:00-03:00`, estado: "finalizada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL10", servicioId: "SV02", profesionalId: "ST01", inicio: `${base}13:30:00-03:00`, fin: `${base}14:20:00-03:00`, estado: "en_atencion", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL11", servicioId: "SV01", profesionalId: "ST02", inicio: `${base}14:30:00-03:00`, fin: `${base}15:00:00-03:00`, estado: "confirmada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL12", servicioId: "SV01", profesionalId: "ST03", inicio: `${base}16:00:00-03:00`, fin: `${base}16:30:00-03:00`, estado: "cancelada", origen: "reserva_web", observaciones: undefined },
  ]

  _reservas = reservasData.map((r) => ({
    ...r,
    id: `res-${nextId()}`,
    historial: [historialReserva("creada", "Reserva inicial del escenario demo")],
  }))

  // Ocho atenciones finalizadas vinculadas a las reservas finalizadas.
  _atenciones = _reservas
    .filter((reserva) => reserva.estado === "finalizada")
    .map((reserva) => ({
      id: `ate-${nextId()}`,
      reservaId: reserva.id,
      clienteId: reserva.clienteId,
      profesionalId: reserva.profesionalId,
      serviciosRealizados: [reserva.servicioId],
      inicio: reserva.inicio,
      fin: reserva.fin,
      estado: "completada" as const,
    }))

  // Atención en curso para Mauro Díaz (13:30)
  const resMauro = _reservas.find((r) => r.clienteId === "CL10")!
  _atenciones.push(
    {
      id: `ate-${nextId()}`,
      reservaId: resMauro.id,
      clienteId: resMauro.clienteId,
      profesionalId: resMauro.profesionalId,
      serviciosRealizados: [resMauro.servicioId],
      inicio: `${base}13:30:00-03:00`,
      estado: "en_curso",
    },
  )

  // Reservas del lunes 26 de octubre (al menos tres)
  const lun = "2026-10-26T"
  const reservasLunes: Omit<Reserva, "id" | "historial">[] = [
    { clienteId: "CL01", servicioId: "SV01", profesionalId: "ST01", inicio: `${lun}09:00:00-03:00`, fin: `${lun}09:30:00-03:00`, estado: "confirmada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL02", servicioId: "SV02", profesionalId: "ST02", inicio: `${lun}10:00:00-03:00`, fin: `${lun}10:50:00-03:00`, estado: "confirmada", origen: "reserva_web", observaciones: undefined },
    { clienteId: "CL03", servicioId: "SV01", profesionalId: "ST03", inicio: `${lun}11:00:00-03:00`, fin: `${lun}11:30:00-03:00`, estado: "confirmada", origen: "reserva_web", observaciones: undefined },
  ]
  reservasLunes.forEach((r) => {
    _reservas.push({ ...r, id: `res-${nextId()}`, historial: [historialReserva("creada", "Reserva inicial del escenario demo")] })
  })
}

/* ══════════════════════════════════════════════════════════════════
   Lecturas (derivadas, sin estado duplicado en pantallas)
   ══════════════════════════════════════════════════════════════════ */

export function servicioPorId(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id)
}

export function profesionalPorId(id: string): Profesional | undefined {
  return PROFESIONALES.find((p) => p.id === id)
}

export function clientePorId(id: string): Cliente | undefined {
  return CLIENTES.find((c) => c.id === id)
}

export function registrarCliente(input: Omit<Cliente, "id">): { cliente: Cliente; duplicado: boolean } {
  const existing = CLIENTES.find((cliente) =>
    cliente.nombre.localeCompare(input.nombre, "es", { sensitivity: "base" }) === 0 ||
    Boolean(input.telefono && cliente.telefono === input.telefono) ||
    Boolean(input.correo && cliente.correo === input.correo),
  )
  if (existing) return { cliente: existing, duplicado: true }
  const cliente = { ...input, id: `CL${String(CLIENTES.length + 1).padStart(2, "0")}` }
  CLIENTES.push(cliente)
  return { cliente, duplicado: false }
}

export function serviciosActivos(): Servicio[] {
  return SERVICIOS.filter((s) => s.activo)
}

export function profesionalesActivos(): Profesional[] {
  return PROFESIONALES.filter((p) => p.estado === "activo")
}

export function profesionalesHabilitadosParaServicio(servicioId: string): Profesional[] {
  return PROFESIONALES.filter(
    (p) => p.estado === "activo" && p.serviciosHabilitados.includes(servicioId),
  )
}

export function turnoEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    finalizado: "Finalizado",
    en_atencion: "En atención",
    confirmado: "Confirmado",
    ausente: "Ausente",
    cancelado: "Cancelado",
  }
  return labels[estado] ?? estado
}

export function reservasDelDia(fechaKey: string): Reserva[] {
  return _reservas.filter((r) => isoKey(r.inicio) === fechaKey)
}

export function todasLasReservas(): Reserva[] {
  return [..._reservas]
}

export function todasLasAtenciones(): Atencion[] {
  return [..._atenciones]
}

export function todosLosBloqueos(): Bloqueo[] {
  return [..._bloqueos]
}

export function reservaPorId(id: string): Reserva | undefined {
  return _reservas.find((r) => r.id === id)
}

export function atencionesDeReserva(reservaId: string): Atencion[] {
  return _atenciones.filter((a) => a.reservaId === reservaId)
}

export function estadoVisibleReserva(r: Reserva): "finalizado" | "en_atencion" | "confirmado" | "ausente" | "cancelado" {
  // Una atención completada implica finalizada
  const ate = _atenciones.find((a) => a.reservaId === r.id && a.estado === "completada")
  if (ate) return "finalizado"
  if (r.estado === "en_atencion" || _atenciones.some((a) => a.reservaId === r.id && a.estado === "en_curso")) return "en_atencion"
  if (r.estado === "finalizada") return "finalizado"
  if (r.estado === "confirmada") return "confirmado"
  if (r.estado === "cancelada") return "cancelado"
  return r.estado
}

export function contadorResumen(): {
  total: number
  finalizadas: number
  enAtencion: number
  confirmadas: number
  ausentes: number
  canceladas: number
} {
  let finalizadas = 0, enAtencion = 0, confirmadas = 0, ausentes = 0, canceladas = 0
  for (const r of _reservas) {
    const ev = estadoVisibleReserva(r)
    if (ev === "finalizado") finalizadas++
    else if (ev === "en_atencion") enAtencion++
    else if (ev === "confirmado") confirmadas++
    else if (ev === "ausente") ausentes++
    else if (ev === "cancelado") canceladas++
  }
  return { total: _reservas.length, finalizadas, enAtencion, confirmadas, ausentes, canceladas }
}

/* ══════════════════════════════════════════════════════════════════
   Disponibilidad
   ══════════════════════════════════════════════════════════════════ */

export type HorarioDisponible = {
  inicio: string
  fin: string
  label: string
}

const JORADA_INICIO = "08:00"
const JORADA_FIN = "20:00"
const INTERVALO_MIN = 15

function esHoraPasada(iso: string): boolean {
  return new Date(iso).getTime() <= new Date(DEMO_NOW_ISO).getTime()
}

export function calcularDisponibilidad(
  profesionalId: string,
  servicioId: string,
  fechaKey: string,
  excluirReservaId?: string,
): HorarioDisponible[] {
  const servicio = servicioPorId(servicioId)
  const profesional = profesionalPorId(profesionalId)
  if (!servicio || !profesional) return []
  if (!profesional.serviciosHabilitados.includes(servicioId)) return []

  const duracion = servicio.duracionMin
  const resultados: HorarioDisponible[] = []

  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += INTERVALO_MIN) {
      const inicio = `${fechaKey}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`
      const fin = addMinutesISO(inicio, duracion)

      // hora pasada respecto del reloj demo
      if (esHoraPasada(inicio)) continue

      // solapamiento con reservas existentes (excluyendo la propia si se edita)
      let conflictoReserva = false
      for (const r of _reservas) {
        if (r.id === excluirReservaId) continue
        if (r.profesionalId !== profesionalId) continue
        if (r.estado === "cancelada") continue
        if (overlaps(inicio, fin, r.inicio, r.fin)) { conflictoReserva = true; break }
      }
      if (conflictoReserva) continue

      // solapamiento con atenciones en curso
      let conflictoAtencion = false
      for (const a of _atenciones) {
        if (a.profesionalId !== profesionalId) continue
        if (a.estado !== "en_curso") continue
        const ateFin = a.fin ? a.fin : addMinutesISO(a.inicio, 60)
        if (overlaps(inicio, fin, a.inicio, ateFin)) { conflictoAtencion = true; break }
      }
      if (conflictoAtencion) continue

      // solapamiento con bloqueos
      let conflictoBloqueo = false
      for (const b of _bloqueos) {
        if (b.profesionalId !== profesionalId) continue
        if (b.estado !== "activo") continue
        if (overlaps(inicio, fin, b.inicio, b.fin)) { conflictoBloqueo = true; break }
      }
      if (conflictoBloqueo) continue

      resultados.push({ inicio, fin, label: timeLabel(inicio) })
    }
  }
  return resultados
}

/* ══════════════════════════════════════════════════════════════════
   Operaciones mutantes (A07-A19)
   ══════════════════════════════════════════════════════════════════ */

export type ResultadoOperacion = {
  ok: boolean
  reservaId?: string
  atencionId?: string
  bloqueoId?: string
  error?: "validacion" | "conflicto" | "sin_permisos" | "lectura" | "incierto"
  mensaje?: string
  detalle?: string
}

export function crearReserva({
  clienteId,
  servicioId,
  profesionalId,
  inicio,
  fin,
  origen = "recepción",
  observaciones,
}: {
  clienteId: string
  servicioId: string
  profesionalId: string
  inicio: string
  fin: string
  origen?: Reserva["origen"]
  observaciones?: string
}): ResultadoOperacion {
  // validar disponibilidad
  const disp = calcularDisponibilidad(profesionalId, servicioId, isoKey(inicio))
  const hay = disp.some((d) => new Date(d.inicio).getTime() === new Date(inicio).getTime() && new Date(d.fin).getTime() === new Date(fin).getTime())
  if (!hay) {
    return { ok: false, error: "conflicto", mensaje: "El horario ya no está disponible." }
  }

  const reserva: Reserva = {
    id: `res-${nextId()}`,
    clienteId,
    servicioId,
    profesionalId,
    inicio,
    fin,
    estado: "confirmada",
    origen,
    observaciones,
    historial: [historialReserva("creada", "Reserva creada desde Agenda")],
  }
  _reservas.push(reserva)
  return { ok: true, reservaId: reserva.id }
}

export function editarReserva(
  reservaId: string,
  cambios: Partial<Pick<Reserva, "observaciones" | "servicioId" | "profesionalId" | "inicio" | "fin" | "estado">>,
): ResultadoOperacion {
  const r = _reservas.find((x) => x.id === reservaId)
  if (!r) return { ok: false, error: "lectura", mensaje: "Reserva no encontrada." }
  if (r.estado === "cancelada" || r.estado === "finalizada") {
    return { ok: false, error: "validacion", mensaje: "Este turno no puede editarse en su estado actual." }
  }

  if (cambios.servicioId && cambios.servicioId !== r.servicioId) {
    const sv = servicioPorId(cambios.servicioId)
    if (!sv || !sv.activo) return { ok: false, error: "validacion", mensaje: "Servicio no válido." }
    const prof = profesionalPorId(r.profesionalId)
    if (prof && !prof.serviciosHabilitados.includes(cambios.servicioId)) {
      return { ok: false, error: "validacion", mensaje: "El profesional no realiza este servicio." }
    }
    const dur = sv.duracionMin
    r.fin = addMinutesISO(r.inicio, dur)
  }
  if (cambios.profesionalId && cambios.profesionalId !== r.profesionalId) {
    const prof = profesionalPorId(cambios.profesionalId)
    if (!prof || prof.estado !== "activo") return { ok: false, error: "validacion", mensaje: "Profesional no disponible." }
    if (!prof.serviciosHabilitados.includes(r.servicioId)) {
      return { ok: false, error: "validacion", mensaje: "El profesional no realiza el servicio asignado." }
    }
  }
  if ((cambios.inicio || cambios.fin) && !(cambios.inicio && cambios.fin)) {
    return { ok: false, error: "validacion", mensaje: "Debe indicar inicio y fin juntos." }
  }
  if (cambios.inicio && cambios.fin) {
    const disp = calcularDisponibilidad(cambios.profesionalId || r.profesionalId, cambios.servicioId || r.servicioId, isoKey(cambios.inicio), reservaId)
    const hay = disp.some((d) => new Date(d.inicio).getTime() === new Date(cambios.inicio!).getTime() && new Date(d.fin).getTime() === new Date(cambios.fin!).getTime())
    if (!hay) return { ok: false, error: "conflicto", mensaje: "El nuevo horario tiene un conflicto." }
    r.inicio = cambios.inicio
    r.fin = cambios.fin
  }
  if (cambios.servicioId) r.servicioId = cambios.servicioId
  if (cambios.profesionalId) r.profesionalId = cambios.profesionalId
  if (cambios.estado) r.estado = cambios.estado
  if (cambios.observaciones !== undefined) r.observaciones = cambios.observaciones
  r.historial.push(historialReserva("editada", "Turno editado desde Agenda"))
  return { ok: true, reservaId: r.id }
}

export function cancelarReserva(reservaId: string, motivo?: string): ResultadoOperacion {
  const r = _reservas.find((x) => x.id === reservaId)
  if (!r) return { ok: false, error: "lectura", mensaje: "Reserva no encontrada." }
  if (r.estado === "cancelada") return { ok: false, error: "validacion", mensaje: "La reserva ya está cancelada." }
  if (r.estado === "finalizada") return { ok: false, error: "validacion", mensaje: "No se puede cancelar una atención ya finalizada." }
  r.estado = "cancelada"
  r.historial.push(historialReserva("cancelada", motivo || "Cancelada desde Agenda"))
  return { ok: true, reservaId: r.id }
}

export function registrarInasistencia(reservaId: string, motivo?: string): ResultadoOperacion {
  const r = _reservas.find((x) => x.id === reservaId)
  if (!r) return { ok: false, error: "lectura", mensaje: "Reserva no encontrada." }
  if (r.estado === "finalizada" || r.estado === "cancelada") {
    return { ok: false, error: "validacion", mensaje: "No se puede registrar inasistencia en este estado." }
  }
  r.estado = "ausente"
  r.historial.push(historialReserva("inasistencia", motivo || "Inasistencia registrada desde Agenda"))
  return { ok: true, reservaId: r.id }
}

export function iniciarAtencion(reservaId: string): ResultadoOperacion {
  const r = _reservas.find((x) => x.id === reservaId)
  if (!r) return { ok: false, error: "lectura", mensaje: "Reserva no encontrada." }
  if (_atenciones.some((a) => a.reservaId === reservaId && a.estado === "en_curso")) {
    return { ok: false, error: "validacion", mensaje: "Ya hay una atención en curso para este turno." }
  }
  const ate: Atencion = {
    id: `ate-${nextId()}`,
    reservaId,
    clienteId: r.clienteId,
    profesionalId: r.profesionalId,
    serviciosRealizados: [r.servicioId],
    inicio: DEMO_NOW_ISO,
    estado: "en_curso",
  }
  _atenciones.push(ate)
  r.estado = "en_atencion"
  r.historial.push(historialReserva("inicio_atencion", "Atención iniciada desde Agenda"))
  return { ok: true, atencionId: ate.id, reservaId: r.id }
}

export function finalizarAtencion(reservaId: string): ResultadoOperacion {
  const r = _reservas.find((x) => x.id === reservaId)
  if (!r) return { ok: false, error: "lectura", mensaje: "Reserva no encontrada." }
  const ate = _atenciones.find((a) => a.reservaId === reservaId && a.estado === "en_curso")
  if (!ate) return { ok: false, error: "validacion", mensaje: "No hay atención en curso para finalizar." }
  ate.estado = "completada"
  ate.fin = DEMO_NOW_ISO
  r.estado = "finalizada"
  r.historial.push(historialReserva("fin_atencion", "Atención finalizada desde Agenda"))
  return { ok: true, atencionId: ate.id, reservaId: r.id }
}

export function registrarAtencionDirecta({
  clienteId,
  profesionalId,
  servicioId,
  inicio,
  estado = "completada",
}: {
  clienteId?: string
  profesionalId: string
  servicioId: string
  inicio: string
  estado?: AtencionEstado
}): ResultadoOperacion {
  const ate: Atencion = {
    id: `ate-${nextId()}`,
    clienteId,
    profesionalId,
    serviciosRealizados: [servicioId],
    inicio,
    estado,
  }
  _atenciones.push(ate)
  return { ok: true, atencionId: ate.id }
}

export function crearBloqueo({
  profesionalId,
  inicio,
  fin,
  motivo,
  observaciones,
}: {
  profesionalId: string
  inicio: string
  fin: string
  motivo: string
  observaciones?: string
}): ResultadoOperacion {
  const prof = profesionalPorId(profesionalId)
  if (!prof || prof.estado !== "activo") return { ok: false, error: "validacion", mensaje: "Profesional no válido." }
  if (new Date(inicio).getTime() >= new Date(fin).getTime()) {
    return { ok: false, error: "validacion", mensaje: "El inicio debe ser anterior al final." }
  }

  // validar solapamientos con reservas no canceladas
  for (const r of _reservas) {
    if (r.profesionalId !== profesionalId) continue
    if (r.estado === "cancelada") continue
    if (overlaps(inicio, fin, r.inicio, r.fin)) {
      return { ok: false, error: "conflicto", mensaje: "El bloqueo solapa un turno existente." }
    }
  }
  // solapamiento con otros bloqueos
  for (const b of _bloqueos) {
    if (b.profesionalId !== profesionalId) continue
    if (b.estado !== "activo") continue
    if (overlaps(inicio, fin, b.inicio, b.fin)) {
      return { ok: false, error: "conflicto", mensaje: "Ya existe un bloqueo en ese horario." }
    }
  }

  const bloqueo: Bloqueo = {
    id: `bl-${nextId()}`,
    profesionalId,
    inicio,
    fin,
    motivo,
    observaciones,
    estado: "activo",
    historial: [historialBloqueo("creado", "Bloqueo creado desde Agenda")],
  }
  _bloqueos.push(bloqueo)
  return { ok: true, bloqueoId: bloqueo.id }
}

export function editarBloqueo(
  bloqueoId: string,
  cambios: Partial<Pick<Bloqueo, "inicio" | "fin" | "motivo" | "observaciones">>,
): ResultadoOperacion {
  const b = _bloqueos.find((x) => x.id === bloqueoId)
  if (!b) return { ok: false, error: "lectura", mensaje: "Bloqueo no encontrado." }
  if (b.estado !== "activo") return { ok: false, error: "validacion", mensaje: "No se puede editar un bloqueo levantado." }
  const inicio = cambios.inicio ?? b.inicio
  const fin = cambios.fin ?? b.fin
  if (new Date(inicio).getTime() >= new Date(fin).getTime()) {
    return { ok: false, error: "validacion", mensaje: "El inicio debe ser anterior al final." }
  }
  for (const bb of _bloqueos) {
    if (bb.id === bloqueoId) continue
    if (bb.profesionalId !== b.profesionalId) continue
    if (bb.estado !== "activo") continue
    if (overlaps(inicio, fin, bb.inicio, bb.fin)) {
      return { ok: false, error: "conflicto", mensaje: "El nuevo horario solapa otro bloqueo." }
    }
  }
  b.inicio = inicio
  b.fin = fin
  if (cambios.motivo) b.motivo = cambios.motivo
  if (cambios.observaciones !== undefined) b.observaciones = cambios.observaciones
  b.historial.push(historialBloqueo("editado", "Bloqueo modificado desde Agenda"))
  return { ok: true, bloqueoId: b.id }
}

export function eliminarBloqueo(bloqueoId: string): ResultadoOperacion {
  const idx = _bloqueos.findIndex((x) => x.id === bloqueoId)
  if (idx === -1) return { ok: false, error: "lectura", mensaje: "Bloqueo no encontrado." }
  const b = _bloqueos[idx]
  b.estado = "levantado"
  b.historial.push(historialBloqueo("eliminado", "Bloqueo eliminado desde Agenda"))
  return { ok: true, bloqueoId: b.id }
}

/* ══════════════════════════════════════════════════════════════════
   Reinicio de fixtures (solo para pruebas automatizadas, sin UI)
   ══════════════════════════════════════════════════════════════════ */

export function reiniciarFixturesParaPruebas(): void {
  _reservas = []
  _atenciones = []
  _bloqueos = []
  _contador = 1000
  inicializarFixtures()
}

/* ══════════════════════════════════════════════════════════════════
   Inicializar al cargar el módulo
   ══════════════════════════════════════════════════════════════════ */

inicializarFixtures()


