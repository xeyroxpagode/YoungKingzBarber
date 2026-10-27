import {
  DEMO_NOW_ISO,
  demoTodayKey,
  reservasDelDia,
  todasLasAtenciones,
  type Atencion,
  type Reserva,
} from "./agenda"
import {
  allObligations,
  can,
  cobradoEn,
  eligibleAttenances,
  financeActor,
  financeStore,
  inPeriod,
  obligationSaldo,
  pendingGroups,
  type FinanceState,
  type Medio,
} from "./financeCore"
import {
  inventoryStore,
  type Usage,
} from "./inventory"
import { exceptionsFor, listStaff } from "./staff"
import { moreStore, sessionConflicts, type MoreState } from "./more"

export type SummarySourceState =
  | "available"
  | "partial"
  | "unavailable"
  | "stale"
  | "restricted"

export type SummaryPermissions = {
  agenda: boolean
  finance: boolean
  inventory: boolean
  more: boolean
}

export type CollectedTodayProjection = {
  status: SummarySourceState
  amountCents?: number
  operationCount?: number
  operationIds: string[]
  movementIds: string[]
  byMethod: Array<{ method: Medio; amountCents: number }>
}

export type AppointmentBreakdown = {
  finalizados: number
  enAtencion: number
  pendientes: number
  ausentes: number
  cancelados: number
}

export type AppointmentsTodayProjection = {
  status: SummarySourceState
  total?: number
  attended?: number
  walkIns?: number
  reservationIds: string[]
  breakdown?: AppointmentBreakdown
  consistent: boolean
}

export type AttentionSeverity = "critical" | "high" | "medium" | "low"
export type AttentionLifecycle =
  | "active"
  | "resolved"
  | "stale"
  | "restricted"
  | "no_longer_applicable"
  | "policy_required"
  | "source_unavailable"

export type SummaryDestination = {
  root: "equipo" | "inventario" | "finanzas" | "mas"
  params: Record<string, string>
  label: string
}

export type OwnerAttentionIncident = {
  id: string
  causeKey: `AT-${string}`
  source: "agenda" | "inventory" | "finance" | "more"
  entityType: string
  entityIds: string[]
  severity: AttentionSeverity
  title: string
  context: string
  effectiveAt: string
  dueAt?: string
  requiredCapability: string
  lifecycle: AttentionLifecycle
  destination: SummaryDestination
  version: string
  freshness: SummarySourceState
  deduplicationKey: string
  relatedNoticeId?: string
}

export type OwnerSummaryProjection = {
  businessDate: string
  generatedAt: string
  collected: CollectedTodayProjection
  appointments: AppointmentsTodayProjection
  attention: OwnerAttentionIncident[]
  sources: Record<"agenda" | "finance" | "inventory" | "more", SummarySourceState>
}

export type SummarySourceOverrides = Partial<
  Record<"agenda" | "finance" | "inventory" | "more", SummarySourceState>
>

const TODAY_PERIOD = (businessDate: string) => ({
  preset: "personalizado" as const,
  fromKey: businessDate,
  toKey: businessDate,
})

export function currentSummaryPermissions(): SummaryPermissions {
  const owner = moreStore
    .getSnapshot()
    .accounts.find((account) => account.id === "ACC-OWNER")
  return {
    agenda: owner?.capabilities["agenda.view"] ?? true,
    finance:
      (owner?.capabilities["finance.view"] ?? true) &&
      can("finance.read_summary", financeActor()),
    inventory: owner?.capabilities["inventory.view"] ?? true,
    more: owner?.capabilities["settings.admin"] ?? true,
  }
}

export function selectCollectedToday(
  state: FinanceState,
  businessDate = demoTodayKey(),
  status: SummarySourceState = "available",
): CollectedTodayProjection {
  if (status !== "available" && status !== "partial" && status !== "stale") {
    return {
      status,
      operationIds: [],
      movementIds: [],
      byMethod: [],
    }
  }

  const movements = state.movements.filter(
    (movement) =>
      movement.kind === "ingreso" &&
      movement.status === "confirmada" &&
      !movement.thirdPartyOwner &&
      inPeriod(movement.date, businessDate, businessDate),
  )
  const methodTotals = new Map<Medio, number>()
  for (const movement of movements) {
    methodTotals.set(
      movement.medio,
      (methodTotals.get(movement.medio) ?? 0) + movement.amountCents,
    )
  }
  return {
    status,
    amountCents: cobradoEn(state, TODAY_PERIOD(businessDate)),
    operationCount: new Set(movements.map((movement) => movement.operationId)).size,
    operationIds: [...new Set(movements.map((movement) => movement.operationId))],
    movementIds: movements.map((movement) => movement.id),
    byMethod: [...methodTotals].map(([method, amountCents]) => ({
      method,
      amountCents,
    })),
  }
}

function visibleReservationState(
  reservation: Reserva,
  attentions: Atencion[],
): keyof AppointmentBreakdown {
  if (
    reservation.estado === "finalizada" ||
    attentions.some(
      (attention) =>
        attention.reservaId === reservation.id && attention.estado === "completada",
    )
  )
    return "finalizados"
  if (
    reservation.estado === "en_atencion" ||
    attentions.some(
      (attention) =>
        attention.reservaId === reservation.id && attention.estado === "en_curso",
    )
  )
    return "enAtencion"
  if (reservation.estado === "ausente") return "ausentes"
  if (reservation.estado === "cancelada") return "cancelados"
  return "pendientes"
}

export function selectAppointmentsToday(
  reservations: Reserva[],
  attentions: Atencion[],
  businessDate = demoTodayKey(),
  status: SummarySourceState = "available",
): AppointmentsTodayProjection {
  if (status !== "available" && status !== "partial" && status !== "stale") {
    return { status, reservationIds: [], consistent: false }
  }
  const identities = new Map<string, Reserva>()
  for (const reservation of reservations) {
    if (reservation.inicio.slice(0, 10) === businessDate) {
      identities.set(reservation.id, reservation)
    }
  }
  const breakdown: AppointmentBreakdown = {
    finalizados: 0,
    enAtencion: 0,
    pendientes: 0,
    ausentes: 0,
    cancelados: 0,
  }
  for (const reservation of identities.values()) {
    breakdown[visibleReservationState(reservation, attentions)] += 1
  }
  const total = identities.size
  const sum = Object.values(breakdown).reduce((value, count) => value + count, 0)
  const walkIns = attentions.filter(
    (attention) =>
      !attention.reservaId && attention.inicio.slice(0, 10) === businessDate,
  ).length
  return {
    status,
    total,
    attended: breakdown.finalizados,
    walkIns,
    reservationIds: [...identities.keys()],
    breakdown,
    consistent: sum === total,
  }
}

type AttentionInput = {
  finance: FinanceState
  inventory: ReturnType<typeof inventoryStore.getSnapshot>
  more: MoreState
  reservations: Reserva[]
  attentions: Atencion[]
  businessDate: string
  sources: OwnerSummaryProjection["sources"]
  permissions: SummaryPermissions
}

const severityOrder: Record<AttentionSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function stableIncident(
  input: Omit<OwnerAttentionIncident, "id" | "version" | "deduplicationKey">,
): OwnerAttentionIncident {
  const objects = [...input.entityIds].sort()
  const key = `${input.causeKey}:${objects.join(",")}`
  return { ...input, entityIds: objects, id: key, deduplicationKey: key, version: "1" }
}

function noticeFor(more: MoreState, objectIds: string[]): string | undefined {
  return more.alerts.find(
    (alert) => !alert.resolved && objectIds.includes(alert.objectId),
  )?.id
}

function inventoryQuantity(
  inventory: ReturnType<typeof inventoryStore.getSnapshot>,
  articleId: string,
  condition: "fit" | "quarantine",
) {
  return inventory.movements
    .filter(
      (movement) =>
        movement.articleId === articleId && movement.condition === condition,
    )
    .reduce(
      (sum, movement) =>
        sum +
        (movement.toLocationId ? movement.quantity : 0) -
        (movement.fromLocationId ? movement.quantity : 0),
      0,
    )
}

function inventoryAvailable(
  inventory: ReturnType<typeof inventoryStore.getSnapshot>,
  articleId: string,
  usage: Usage,
) {
  const allocated = inventory.allocations
    .filter((allocation) => allocation.articleId === articleId && allocation.usage === usage)
    .reduce((sum, allocation) => sum + allocation.quantity, 0)
  const committed = inventory.commitments
    .filter(
      (commitment) =>
        commitment.articleId === articleId && commitment.status === "active",
    )
    .reduce((sum, commitment) => sum + commitment.quantity, 0)
  return Math.max(
    0,
    Math.min(inventoryQuantity(inventory, articleId, "fit"), allocated) -
      (usage === "sale" ? committed : 0),
  )
}

function isBelowMinimum(
  inventory: ReturnType<typeof inventoryStore.getSnapshot>,
  article: ReturnType<typeof inventoryStore.getSnapshot>["articles"][number],
  usage: Usage,
) {
  const minimum = usage === "sale" ? article.minimumSale : article.minimumInternal
  return minimum > 0 && inventoryAvailable(inventory, article.id, usage) < minimum
}

function stockIncidents(input: AttentionInput): OwnerAttentionIncident[] {
  if (!input.permissions.inventory || input.sources.inventory === "restricted") return []
  if (input.sources.inventory === "unavailable") return []
  const incidents: OwnerAttentionIncident[] = []
  for (const usage of ["internal", "sale"] as Usage[]) {
    const articles = input.inventory.articles.filter(
      (article) => article.active && article.usages.includes(usage) && isBelowMinimum(input.inventory, article, usage),
    )
    if (!articles.length) continue
    const ids = articles.map((article) => article.id)
    const internal = usage === "internal"
    incidents.push(
      stableIncident({
        causeKey: internal ? "AT-05" : "AT-06",
        source: "inventory",
        entityType: "article",
        entityIds: ids,
        severity: articles.some((article) => inventoryAvailable(input.inventory, article.id, usage) === 0)
          ? "critical"
          : "high",
        title: `${articles.length} ${internal ? "insumo" : "producto"}${articles.length === 1 ? "" : "s"} con stock crítico`,
        context: articles
          .map(
            (article) =>
              `${article.name}: ${inventoryAvailable(input.inventory, article.id, usage)} disponibles`,
          )
          .join(" · "),
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "inventory.view",
        lifecycle: "active",
        destination: {
          root: "inventario",
          params:
            articles.length === 1
              ? {
                  inventorySurface: internal ? "I9" : "I8",
                  articleId: articles[0].id,
                  inventoryUsage: usage,
                }
              : { inventoryUsage: usage, stockFilter: "low" },
          label: internal ? "Revisar insumos" : "Revisar productos",
        },
        freshness: input.sources.inventory,
        relatedNoticeId: noticeFor(input.more, ids),
      }),
    )
  }

  const preparation = input.inventory.orders.filter((order) =>
    ["received", "preparing"].includes(order.status),
  )
  if (preparation.length) {
    const ids = preparation.map((order) => order.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-07",
        source: "inventory",
        entityType: "order",
        entityIds: ids,
        severity: "medium",
        title: `${preparation.length} pedido${preparation.length === 1 ? "" : "s"} requiere${preparation.length === 1 ? "" : "n"} preparación`,
        context: preparation.map((order) => order.number).join(" · "),
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "inventory.view",
        lifecycle: "active",
        destination: {
          root: "inventario",
          params:
            preparation.length === 1
              ? { inventorySurface: "I32", orderId: preparation[0].id }
              : { inventorySurface: "I31" },
          label: "Revisar pedidos",
        },
        freshness: input.sources.inventory,
        relatedNoticeId: noticeFor(input.more, ids),
      }),
    )
  }

  const shortages = input.inventory.orders.filter((order) => order.status === "incident")
  if (shortages.length) {
    const ids = shortages.map((order) => order.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-09",
        source: "inventory",
        entityType: "order",
        entityIds: ids,
        severity: "critical",
        title: `${shortages.length} pedido${shortages.length === 1 ? "" : "s"} con faltante`,
        context: "El compromiso no puede cumplirse con el disponible actual.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "inventory.view",
        lifecycle: "active",
        destination: {
          root: "inventario",
          params:
            shortages.length === 1
              ? { inventorySurface: "I42", orderId: shortages[0].id }
              : { inventorySurface: "I31" },
          label: "Resolver faltante",
        },
        freshness: input.sources.inventory,
        relatedNoticeId: noticeFor(input.more, ids),
      }),
    )
  }

  const unadjustedCounts = input.inventory.counts.filter(
    (count) => count.recorded !== count.counted && !count.adjustmentMovementId,
  )
  if (unadjustedCounts.length) {
    const ids = unadjustedCounts.map((count) => count.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-10",
        source: "inventory",
        entityType: "stock_count",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} diferencia${ids.length === 1 ? "" : "s"} física${ids.length === 1 ? "" : "s"} pendiente${ids.length === 1 ? "" : "s"}`,
        context: "El recuento todavía no tiene un ajuste confirmado.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "inventory.view",
        lifecycle: "active",
        destination: {
          root: "inventario",
          params: { inventorySurface: "I27" },
          label: "Revisar diferencias",
        },
        freshness: input.sources.inventory,
      }),
    )
  }

  const blockedByQuarantine = input.inventory.articles.filter(
    (article) =>
      inventoryQuantity(input.inventory, article.id, "quarantine") > 0 &&
      input.inventory.commitments.some(
        (commitment) => commitment.articleId === article.id && commitment.status === "active",
      ) &&
      inventoryAvailable(input.inventory, article.id, "sale") === 0,
  )
  if (blockedByQuarantine.length) {
    const ids = blockedByQuarantine.map((article) => article.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-11",
        source: "inventory",
        entityType: "article",
        entityIds: ids,
        severity: "critical",
        title: `${ids.length} compromiso${ids.length === 1 ? "" : "s"} bloqueado${ids.length === 1 ? "" : "s"} por cuarentena`,
        context: "Hay unidades en cuarentena y no queda disponible para el compromiso.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "inventory.view",
        lifecycle: "active",
        destination: {
          root: "inventario",
          params:
            ids.length === 1
              ? { inventorySurface: "I29", articleId: ids[0] }
              : { stockFilter: "out" },
          label: "Revisar cuarentena",
        },
        freshness: input.sources.inventory,
      }),
    )
  }
  return incidents
}

function financeIncidents(input: AttentionInput): OwnerAttentionIncident[] {
  if (!input.permissions.finance || input.sources.finance === "restricted") return []
  if (input.sources.finance === "unavailable") return []
  const incidents: OwnerAttentionIncident[] = []
  const periodAttentions = eligibleAttenances(input.finance).filter(
    (attention) =>
      attention.classification === "propia_sin_venta" &&
      attention.date.slice(0, 10) === input.businessDate,
  )
  if (periodAttentions.length) {
    const ids = periodAttentions.map((attention) => attention.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-03",
        source: "finance",
        entityType: "attention",
        entityIds: ids,
        severity: "medium",
        title: `${ids.length} atención${ids.length === 1 ? "" : "es"} propia${ids.length === 1 ? "" : "s"} sin venta`,
        context: "La atención finalizó, pero todavía no existe una venta vinculada.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.create_sale",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F12", entityIds: ids.join(",") },
          label: "Registrar venta",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  const buckets = pendingGroups(input.finance)
  const overdue = [
    ...buckets.cobrarBuckets.vencidas,
    ...buckets.pagarBuckets.vencidas,
  ]
  if (overdue.length) {
    const ids = overdue.map((obligation) => obligation.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-12",
        source: "finance",
        entityType: "obligation",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} obligación${ids.length === 1 ? "" : "es"} vencida${ids.length === 1 ? "" : "s"}`,
        context: `${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(overdue.reduce((sum, obligation) => sum + obligationSaldo(input.finance, obligation), 0) / 100)} pendientes`,
        effectiveAt: DEMO_NOW_ISO,
        dueAt: overdue.map((obligation) => obligation.dueDate ?? "").sort()[0],
        requiredCapability: "finance.read_pending",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F61", obligationIds: ids.join(",") },
          label: "Revisar vencimientos",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  const openSession = input.finance.sessions.find((session) => session.status === "abierta")
  const dayName = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(`${input.businessDate}T12:00:00-03:00`))
  const scheduleKey = `${dayName.charAt(0).toUpperCase()}${dayName.slice(1)}`
  const closingTime = input.more.schedule[scheduleKey]?.at(-1)?.end
  const currentTime = DEMO_NOW_ISO.slice(11, 16)
  if (openSession && (!closingTime || currentTime >= closingTime)) {
    incidents.push(
      stableIncident({
        causeKey: "AT-14",
        source: "finance",
        entityType: "cash_session",
        entityIds: [openSession.id],
        severity: "high",
        title: "Caja requiere cierre",
        context: closingTime
          ? `La jornada configurada finalizó a las ${closingTime}.`
          : "No hay una franja operativa vigente para la Caja abierta.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.close_cash",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F48", sessionId: openSession.id },
          label: "Cerrar Caja",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  if (input.finance.differences.length) {
    const ids = input.finance.differences.map((difference) => difference.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-15",
        source: "finance",
        entityType: "cash_difference",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} diferencia${ids.length === 1 ? "" : "s"} de Caja pendiente${ids.length === 1 ? "" : "s"}`,
        context: "El arqueo conserva una diferencia que requiere revisión.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.cash_count",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F49", entityIds: ids.join(",") },
          label: "Conciliar Caja",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  const verifications = input.finance.verifications.filter((verification) =>
    ["declarado", "comprobante_presentado", "pendiente_verificacion"].includes(
      verification.status,
    ),
  )
  if (verifications.length) {
    const ids = verifications.map((verification) => verification.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-16",
        source: "finance",
        entityType: "external_payment_verification",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} cobro${ids.length === 1 ? "" : "s"} externo${ids.length === 1 ? "" : "s"} sin verificar`,
        context: "El dinero no integra Cobrado hasta completar la verificación.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.verify_external_payment",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F68", entityIds: ids.join(",") },
          label: "Verificar cobro",
        },
        freshness: input.sources.finance,
        relatedNoticeId: noticeFor(input.more, ["F68", ...ids]),
      }),
    )
  }

  const unknownIds = [
    ...input.finance.attempts
      .filter((attempt) => attempt.status === "incierto")
      .map((attempt) => attempt.id),
    ...input.finance.movements
      .filter((movement) => movement.status === "incierto")
      .map((movement) => movement.id),
  ]
  const uniqueUnknownIds = [...new Set(unknownIds)]
  if (uniqueUnknownIds.length) {
    incidents.push(
      stableIncident({
        causeKey: "AT-17",
        source: "finance",
        entityType: "money_operation",
        entityIds: uniqueUnknownIds,
        severity: "critical",
        title: `${uniqueUnknownIds.length} operación${uniqueUnknownIds.length === 1 ? "" : "es"} con resultado incierto`,
        context: "No se reintenta ni se confirma hasta inspeccionar el resultado.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.correct_movement",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F56", entityIds: uniqueUnknownIds.join(",") },
          label: "Recuperar operación",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  const approvals = input.finance.approvals.filter(
    (approval) => approval.status === "solicitada",
  )
  if (approvals.length) {
    const ids = approvals.map((approval) => approval.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-18",
        source: "finance",
        entityType: "approval",
        entityIds: ids,
        severity: "medium",
        title: `${ids.length} autorización${ids.length === 1 ? "" : "es"} pendiente${ids.length === 1 ? "" : "s"}`,
        context: "La operación espera una decisión vigente.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.approve_exception",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F71", entityIds: ids.join(",") },
          label: "Revisar autorizaciones",
        },
        freshness: input.sources.finance,
      }),
    )
  }

  const refunds = allObligations(input.finance).filter(
    (obligation) =>
      obligation.kind === "reintegro" &&
      obligationSaldo(input.finance, obligation) > 0,
  )
  if (refunds.length) {
    const ids = refunds.map((refund) => refund.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-20",
        source: "finance",
        entityType: "refund_obligation",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} reintegro${ids.length === 1 ? "" : "s"} pendiente${ids.length === 1 ? "" : "s"}`,
        context: "La obligación sigue abierta en su registro financiero.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "finance.pay_obligation",
        lifecycle: "active",
        destination: {
          root: "finanzas",
          params: { financeSurface: "F23", entityIds: ids.join(",") },
          label: "Revisar reintegros",
        },
        freshness: input.sources.finance,
      }),
    )
  }
  return incidents
}

function agendaIncidents(input: AttentionInput): OwnerAttentionIncident[] {
  if (!input.permissions.agenda || input.sources.agenda === "restricted") return []
  if (input.sources.agenda === "unavailable") return []
  const incidents: OwnerAttentionIncident[] = []
  const affectedByAbsence = listStaff().flatMap((member) => {
    const absent = exceptionsFor(member.id).some(
      (exception) =>
        exception.status === "vigente" &&
        exception.type === "ausencia" &&
        exception.from.slice(0, 10) <= input.businessDate &&
        exception.to.slice(0, 10) >= input.businessDate,
    )
    if (!absent) return []
    return input.reservations.filter(
      (reservation) =>
        reservation.profesionalId === member.id &&
        !["cancelada", "finalizada", "ausente"].includes(reservation.estado),
    )
  })
  if (affectedByAbsence.length) {
    const ids = affectedByAbsence.map((reservation) => reservation.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-01",
        source: "agenda",
        entityType: "reservation",
        entityIds: ids,
        severity: "critical",
        title: `${ids.length} turno${ids.length === 1 ? "" : "s"} afectado${ids.length === 1 ? "" : "s"} por una ausencia`,
        context: "Las reservas necesitan reasignación o resolución en Agenda.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "agenda.edit",
        lifecycle: "active",
        destination: {
          root: "equipo",
          params:
            ids.length === 1
              ? { agendaReservation: ids[0] }
              : { agendaDate: input.businessDate, agendaIds: ids.join(",") },
          label: "Revisar turnos",
        },
        freshness: input.sources.agenda,
      }),
    )
  }

  const overlaps = new Set<string>()
  const activeReservations = input.reservations.filter(
    (reservation) => !["cancelada", "ausente"].includes(reservation.estado),
  )
  for (let index = 0; index < activeReservations.length; index += 1) {
    for (let right = index + 1; right < activeReservations.length; right += 1) {
      const first = activeReservations[index]
      const second = activeReservations[right]
      if (
        first.profesionalId === second.profesionalId &&
        first.inicio < second.fin &&
        second.inicio < first.fin
      ) {
        overlaps.add(first.id)
        overlaps.add(second.id)
      }
    }
  }
  if (overlaps.size) {
    const ids = [...overlaps]
    incidents.push(
      stableIncident({
        causeKey: "AT-02",
        source: "agenda",
        entityType: "reservation",
        entityIds: ids,
        severity: "critical",
        title: `${ids.length} turnos con conflicto de disponibilidad`,
        context: "Un mismo profesional tiene reservas superpuestas.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "agenda.edit",
        lifecycle: "active",
        destination: {
          root: "equipo",
          params: { agendaDate: input.businessDate, agendaIds: ids.join(",") },
          label: "Resolver conflicto",
        },
        freshness: input.sources.agenda,
      }),
    )
  }
  return incidents
}

function moreIncidents(input: AttentionInput): OwnerAttentionIncident[] {
  if (!input.permissions.more || input.sources.more === "restricted") return []
  if (input.sources.more === "unavailable") return []
  const incidents: OwnerAttentionIncident[] = []
  const conflictingSessions = input.more.courses.flatMap((course) =>
    course.sessions.filter(
      (session) =>
        session.status === "scheduled" &&
        session.startsAt.slice(0, 10) === input.businessDate &&
        sessionConflicts(
          session.startsAt,
          session.endsAt,
          session.instructorId,
          session.id,
        ).length > 0,
    ),
  )
  if (conflictingSessions.length) {
    const ids = conflictingSessions.map((session) => session.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-22",
        source: "more",
        entityType: "course_session",
        entityIds: ids,
        severity: "high",
        title: `${ids.length} sesión${ids.length === 1 ? "" : "es"} de curso con conflicto`,
        context: "Instructor o recurso se superpone con otro compromiso.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "courses.edit",
        lifecycle: "active",
        destination: {
          root: "mas",
          params: { p5Surface: "M62", entityIds: ids.join(",") },
          label: "Revisar conflicto",
        },
        freshness: input.sources.more,
        relatedNoticeId: noticeFor(input.more, ids),
      }),
    )
  }

  const endangeredAdmins = input.more.accounts.filter(
    (account) =>
      account.status !== "active" &&
      ["owner", "admin"].includes(account.role) &&
      account.capabilities["settings.admin"],
  )
  if (endangeredAdmins.length) {
    const ids = endangeredAdmins.map((account) => account.id)
    incidents.push(
      stableIncident({
        causeKey: "AT-24",
        source: "more",
        entityType: "account",
        entityIds: ids,
        severity: "critical",
        title: `${ids.length} acceso administrativo crítico`,
        context: "Una cuenta administrativa necesaria no está activa.",
        effectiveAt: DEMO_NOW_ISO,
        requiredCapability: "settings.admin",
        lifecycle: "active",
        destination: {
          root: "mas",
          params: { p5Surface: "M68", accountIds: ids.join(",") },
          label: "Revisar accesos",
        },
        freshness: input.sources.more,
      }),
    )
  }
  return incidents
}

export function selectAttentionIncidents(input: AttentionInput): OwnerAttentionIncident[] {
  return [
    ...agendaIncidents(input),
    ...stockIncidents(input),
    ...financeIncidents(input),
    ...moreIncidents(input),
  ].sort(
    (left, right) =>
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.causeKey.localeCompare(right.causeKey) ||
      left.id.localeCompare(right.id),
  )
}

export function selectOwnerSummary(options?: {
  businessDate?: string
  sourceOverrides?: SummarySourceOverrides
  permissions?: SummaryPermissions
  finance?: FinanceState
  inventory?: ReturnType<typeof inventoryStore.getSnapshot>
  more?: MoreState
  reservations?: Reserva[]
  attentions?: Atencion[]
}): OwnerSummaryProjection {
  const businessDate = options?.businessDate ?? demoTodayKey()
  const permissions = options?.permissions ?? currentSummaryPermissions()
  const sources: OwnerSummaryProjection["sources"] = {
    agenda: permissions.agenda ? "available" : "restricted",
    finance: permissions.finance ? "available" : "restricted",
    inventory: permissions.inventory ? "available" : "restricted",
    more: permissions.more ? "available" : "restricted",
    ...options?.sourceOverrides,
  }
  const finance = options?.finance ?? financeStore.getSnapshot()
  const inventory = options?.inventory ?? inventoryStore.getSnapshot()
  const more = options?.more ?? moreStore.getSnapshot()
  const reservations = options?.reservations ?? reservasDelDia(businessDate)
  const attentions = options?.attentions ?? todasLasAtenciones()
  return {
    businessDate,
    generatedAt: DEMO_NOW_ISO,
    collected: selectCollectedToday(finance, businessDate, sources.finance),
    appointments: selectAppointmentsToday(
      reservations,
      attentions,
      businessDate,
      sources.agenda,
    ),
    attention: selectAttentionIncidents({
      finance,
      inventory,
      more,
      reservations,
      attentions,
      businessDate,
      sources,
      permissions,
    }),
    sources,
  }
}
