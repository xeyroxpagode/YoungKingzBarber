/* ═════════════════════════════════════════════════════════════════
   P4 FINANZAS — Núcleo de dominio (contratos, fixtures, proyecciones)
   Fuente única de verdad financiera. Moneda base ARS en centavos (enteros).
   Las operaciones mutantes viven en financeOps.ts; este módulo es
   tipos + estado + derivaciones puras.
   ═════════════════════════════════════════════════════════════════ */

import {
  CLIENTES,
  DEMO_NOW_ISO,
  PROFESIONALES,
  SERVICIOS,
  todasLasAtenciones,
} from "./agenda"
import { activeAgreement, listStaff, settlementsFor } from "./staff"
import { inventoryStore } from "./inventory"

/* ═════════════════════════════════════════════════════════════════
   Reloj y fechas
   ═════════════════════════════════════════════════════════════════ */

export const FINANCE_NOW = DEMO_NOW_ISO
export const FINANCE_TODAY = DEMO_NOW_ISO.slice(0, 10)

export function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

export type PeriodPreset = "hoy" | "ayer" | "semana" | "mes" | "personalizado"

export type FinancePeriod = {
  preset: PeriodPreset
  fromKey: string
  toKey: string
}

function shiftDay(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function resolvePeriod(period: FinancePeriod): { fromKey: string; toKey: string; label: string } {
  const hoy = FINANCE_TODAY
  switch (period.preset) {
    case "hoy":
      return { fromKey: hoy, toKey: hoy, label: "Hoy · 24 OCT 2026" }
    case "ayer": {
      const key = shiftDay(hoy, -1)
      return { fromKey: key, toKey: key, label: "Ayer · 23 OCT 2026" }
    }
    case "semana": {
      // Semana 19–25 oct 2026 (lunes a domingo)
      return { fromKey: "2026-10-19", toKey: "2026-10-25", label: "Semana · 19–25 OCT" }
    }
    case "mes":
      return { fromKey: "2026-10-01", toKey: "2026-10-31", label: "Mes · OCT 2026" }
    case "personalizado":
      return {
        fromKey: period.fromKey,
        toKey: period.toKey,
        label: `Personalizado · ${period.fromKey} → ${period.toKey}`,
      }
  }
}

export function validPeriodRange(fromKey: string, toKey: string): boolean {
  const iso = (key: string) => new Date(`${key}T12:00:00Z`).getTime()
  const ok = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fromKey) && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(toKey)
  return ok && !Number.isNaN(iso(fromKey)) && !Number.isNaN(iso(toKey)) && iso(fromKey) <= iso(toKey)
}

export function inPeriod(iso: string, fromKey: string, toKey: string): boolean {
  const key = dateKey(iso)
  return key >= fromKey && key <= toKey
}

/* ═════════════════════════════════════════════════════════════════
   Tipos de dominio (contrato 05.2)
   ═════════════════════════════════════════════════════════════════ */

export type Medio = "efectivo" | "transferencia" | "debito" | "credito"

export type FundAccount = {
  id: string
  name: string
  kind: "caja" | "banco_propio"
  /** Saldo conocido sólo cuando hay cobertura de operaciones suficiente. */
  coverage: "known" | "insufficient"
  knownBalanceCents?: number
  active: boolean
}

export type CashRegister = {
  id: string
  name: string
  fundAccountId: string
  active: boolean
}

export type SaleLine = {
  id: string
  kind: "servicio" | "producto"
  refId: string
  name: string
  quantity: number
  unitPriceCents: number
  attentionId?: string
}

export type SaleAdjustment = {
  id: string
  saleId: string
  kind: "descuento" | "correccion" | "reintegro"
  /** Negativo reduce el total comercial; positivo amplía. */
  deltaCents: number
  reason: string
  date: string
  actor: string
  correctionOf?: string
}

export type CommercialSale = {
  id: string
  clientId?: string
  clientLabel: string
  /** Titularidad comercial del hecho (06.2). */
  ownership: "propia" | "ajena" | "revisar"
  origin: "atencion" | "libre" | "pedido"
  attentionId?: string
  orderId?: string
  lines: SaleLine[]
  subtotalCents: number
  discountCents: number
  totalCents: number
  status: "confirmada" | "ajustada"
  createdAt: string
  actor: string
  version: number
}

export type ObligationDirection = "cobrar" | "pagar"

export type ObligationKind =
  | "venta"
  | "pedido"
  | "alquiler"
  | "otra_cuenta"
  | "liquidacion"
  | "compra"
  | "reintegro"
  | "gasto"
  | "entrega_terceros"

export type FinanceObligation = {
  id: string
  direction: ObligationDirection
  kind: ObligationKind
  originId: string
  originLabel: string
  counterpartyId?: string
  counterpartyLabel: string
  totalCents: number
  /** false = importe a confirmar (POLICY/dato pendiente). */
  amountKnown: boolean
  paidCents: number
  dueDate?: string
  status: "abierta" | "parcial" | "saldada"
  createdAt: string
  actor: string
  version: number
  externalRef?: { module: "p2" | "p3"; id: string }
}

export type PaymentAllocation = {
  id: string
  operationId: string
  obligationId: string
  amountCents: number
  date: string
}

export type MoneyOperationKind =
  | "venta"
  | "cobro"
  | "pago"
  | "gasto"
  | "retiro"
  | "traslado"
  | "apertura"
  | "cierre"
  | "arqueo"
  | "relevo"
  | "correccion"
  | "anticipo"
  | "aplicacion_anticipo"
  | "reintegro"
  | "entrega_terceros"

export type MediaLine = {
  id: string
  medio: Medio
  amountCents: number
  fundAccountId: string
  /** Referencia o estado de verificación cuando el medio lo requiere. */
  reference?: string
  verificationId?: string
}

export type MoneyOperation = {
  id: string
  kind: MoneyOperationKind
  date: string
  actor: string
  status: "confirmada" | "incierto" | "pendiente_verificacion"
  media: MediaLine[]
  allocationIds: string[]
  detail: string
  relatedId?: string
  correctionOf?: string
}

export type MovementKind = "ingreso" | "egreso" | "retiro" | "traslado"

export type MoneyMovement = {
  id: string
  operationId: string
  kind: MovementKind
  concept: string
  counterpartyLabel?: string
  medio: Medio
  amountCents: number
  fundAccountId: string
  /** Traslados: cuenta destino; el origen queda en fundAccountId. */
  toFundAccountId?: string
  date: string
  status: "confirmada" | "incierto" | "pendiente_verificacion"
  /** El dinero es de un tercero en custodia (06.9). */
  thirdPartyOwner?: string
  relatedObligationId?: string
  relatedSaleId?: string
  relatedExpenseId?: string
  correctionOf?: string
  actor: string
}

export type CashSession = {
  id: string
  registerId: string
  registerName: string
  openedAt: string
  openedBy: string
  openingFloatCents: number
  status: "abierta" | "cerrada"
  closedAt?: string
  closedBy?: string
  expectedCents?: number
  countedCents?: number
  differenceCents?: number
  notes?: string
  version: number
}

export type CashCount = {
  id: string
  sessionId: string
  countedCents: number
  method: "denominaciones" | "total"
  denominations?: { valueCents: number; quantity: number }[]
  expectedCents: number
  differenceCents: number
  date: string
  actor: string
  notes?: string
}

export type CashDifference = {
  id: string
  sessionId: string
  kind: "faltante" | "sobrante"
  amountCents: number
  reason: string
  notes?: string
  date: string
  actor: string
}

export type HandoffStatus = "borrador" | "conteo_salida" | "revisado_entrada" | "aceptado" | "rechazado"

export type CashCustodyHandoff = {
  id: string
  sessionId: string
  fromStaff: string
  toStaff: string
  outgoingCountCents?: number
  incomingCountCents?: number
  expectedCents: number
  differenceCents?: number
  observations?: string
  status: HandoffStatus
  date: string
}

export type AdvanceKind = "anticipo_cliente" | "sena_reserva" | "adelanto_profesional"

export type Advance = {
  id: string
  kind: AdvanceKind
  direction: "cliente" | "profesional"
  personId?: string
  personLabel: string
  amountCents: number
  appliedCents: number
  medio: Medio
  fundAccountId?: string
  reservationId?: string
  relatedSettlementId?: string
  date: string
  actor: string
  version: number
}

/** Alias de contrato: la seña de reserva es un anticipo vinculado a reserva. */
export type ReservationDeposit = Advance & { reservationId: string }

export type CustomerCredit = {
  id: string
  clientId: string
  clientLabel: string
  originOperationId: string
  originLabel: string
  totalCents: number
  appliedCents: number
  refundedCents: number
  date: string
  actor: string
  version: number
}

export type RefundObligation = FinanceObligation & {
  direction: "pagar"
  kind: "reintegro"
}

export type Expense = {
  id: string
  concept: string
  categoryId: string
  amountCents: number
  date: string
  counterparty?: string
  notes?: string
  status: "pendiente" | "pagado"
  obligationId?: string
  paidOperationId?: string
  recurringRuleId?: string
  actor: string
  version: number
}

export type RecurringExpenseRule = {
  id: string
  concept: string
  categoryId: string
  frequency: "semanal" | "mensual"
  startDate: string
  endDate?: string
  amountCents?: number
  amountKnown: boolean
  supplier?: string
  status: "activa" | "pausada" | "finalizada"
  generatedPeriods: string[]
  version: number
}

export type RecurringExpenseInstance = {
  id: string
  ruleId: string
  period: string
  expenseId?: string
  date: string
}

export type ThirdPartyFunds = {
  id: string
  payerLabel: string
  professionalId?: string
  professionalLabel?: string
  ownerLabel: string
  custodianLabel: string
  amountCents: number
  deliveredCents: number
  medio: Medio
  deliveryObligationId?: string
  date: string
  status: "en_custodia" | "parcial" | "entregado"
  actor: string
  version: number
}

export type FinancialCorrection = {
  id: string
  originalMovementId: string
  reason: string
  compensatingOperationId: string
  compensatingMovementId: string
  effects: string[]
  date: string
  actor: string
}

export type VerificationStatus =
  | "declarado"
  | "comprobante_presentado"
  | "pendiente_verificacion"
  | "verificado"
  | "rechazado"

export type ExternalPaymentVerification = {
  id: string
  declaredAmountCents: number
  medio: Medio
  payerLabel: string
  reference?: string
  evidenceDocumentId?: string
  status: VerificationStatus
  declaredBy: string
  declaredAt: string
  verifiedBy?: string
  verifiedAt?: string
  note?: string
  /** Aplicaciones en borrador que se confirman sólo al verificarse. */
  pendingOperationId?: string
  pendingDetail: string
  pendingApps?: { obligationId: string; amountCents: number }[]
  pendingMedia?: MediaLine[]
}

export type FinancialDocument = {
  id: string
  name: string
  sizeBytes: number
  mime: string
  kind: "comprobante" | "factura" | "otro"
  linkedTo: { type: string; id: string }
  persistence: "temporal" | "sesion"
  date: string
  actor: string
  replacedBy?: string
}

export type ApprovalStatus = "solicitada" | "aprobada" | "rechazada" | "expirada" | "cancelada"

export type ApprovalRequest = {
  id: string
  operationId: string
  actor: string
  reason: string
  scope: string
  amountCents?: number
  version: number
  status: ApprovalStatus
  requestedAt: string
  resolvedAt?: string
  resolvedBy?: string
  consumedByOperationId?: string
}

export type FinanceAuditEvent = {
  id: string
  operationId: string
  type: string
  result: "success" | "rejected" | "duplicate" | "unknown" | "blocked_policy" | "blocked_permission"
  date: string
  detail: string
}

export type OperationAttempt = {
  id: string
  kind: MoneyOperationKind
  status: "enviado" | "confirmado" | "incierto" | "fallido"
  date: string
  entityId?: string
}

export type FundTransfer = {
  id: string
  operationId: string
  fromAccountId: string
  toAccountId: string
  amountCents: number
  date: string
  status: "confirmada" | "incierto"
  actor: string
}

export type FinanceCategory = {
  id: string
  name: string
  active: boolean
}

export type FinancePolicyBlock = {
  id: string
  subject: string
  policy:
    | "retencion_senas"
    | "devolucion_senas"
    | "descuentos_delegados"
    | "recargos_intereses"
    | "fiado_general"
    | "otro"
  reason: string
  date: string
  draftSummary: string
}

export type FinanceState = {
  sales: CommercialSale[]
  saleAdjustments: SaleAdjustment[]
  obligations: FinanceObligation[]
  allocations: PaymentAllocation[]
  operations: MoneyOperation[]
  movements: MoneyMovement[]
  fundAccounts: FundAccount[]
  sessions: CashSession[]
  counts: CashCount[]
  differences: CashDifference[]
  handoffs: CashCustodyHandoff[]
  advances: Advance[]
  credits: CustomerCredit[]
  expenses: Expense[]
  recurringRules: RecurringExpenseRule[]
  recurringInstances: RecurringExpenseInstance[]
  thirdPartyFunds: ThirdPartyFunds[]
  corrections: FinancialCorrection[]
  verifications: ExternalPaymentVerification[]
  documents: FinancialDocument[]
  approvals: ApprovalRequest[]
  categories: FinanceCategory[]
  audits: FinanceAuditEvent[]
  attempts: OperationAttempt[]
  transfers: FundTransfer[]
  policyBlocks: FinancePolicyBlock[]
  operationIds: string[]
}

/* ═════════════════════════════════════════════════════════════════
   Permisos (sección 15)
   ═════════════════════════════════════════════════════════════════ */

export type FinancePermission =
  | "finance.read_summary"
  | "finance.read_movements"
  | "finance.read_pending"
  | "finance.create_sale"
  | "finance.collect"
  | "finance.discount"
  | "finance.create_expense"
  | "finance.pay_obligation"
  | "finance.read_staff_economy"
  | "finance.withdraw"
  | "finance.open_cash"
  | "finance.cash_count"
  | "finance.close_cash"
  | "finance.cash_handoff"
  | "finance.correct_movement"
  | "finance.manage_categories"
  | "finance.verify_external_payment"
  | "finance.approve_exception"
  | "finance.manage_fund_sources"

export type FinanceActor = {
  id: string
  name: string
  role: "owner" | "recepcion" | "barbero"
}

export const OWNER_ACTOR: FinanceActor = { id: "owner", name: "Dueño YoungKingZ", role: "owner" }

const ROLE_CAPABILITIES: Record<FinanceActor["role"], FinancePermission[] | "all"> = {
  owner: "all",
  recepcion: [
    "finance.read_summary",
    "finance.read_movements",
    "finance.read_pending",
    "finance.create_sale",
    "finance.collect",
    "finance.open_cash",
    "finance.cash_count",
    "finance.cash_handoff",
  ],
  barbero: [],
}

let currentActor: FinanceActor = OWNER_ACTOR

/** Uso exclusivo de pruebas automatizadas; la UI no expone cambio de rol. */
export function setFinanceActorForTests(actor: FinanceActor): void {
  currentActor = actor
}

export function financeActor(): FinanceActor {
  return currentActor
}

export function can(permission: FinancePermission, actor: FinanceActor = currentActor): boolean {
  const caps = ROLE_CAPABILITIES[actor.role]
  if (caps === "all") return true
  return caps.includes(permission)
}

/* ═════════════════════════════════════════════════════════════════
   Adaptadores hacia P2/P3 (identidades heredadas, 05.1)
   ═════════════════════════════════════════════════════════════════ */

export function clientLabel(clientId?: string): string {
  if (!clientId) return "Cliente ocasional"
  return CLIENTES.find((c) => c.id === clientId)?.nombre ?? "Cliente"
}

export function serviceName(serviceId: string): string {
  return SERVICIOS.find((s) => s.id === serviceId)?.nombre ?? serviceId
}

export function professionalName(staffId: string): string {
  return PROFESIONALES.find((p) => p.id === staffId)?.nombre ?? staffId
}

/** Titularidad comercial de una atención según el acuerdo vigente (06.2). */
export function attentionOwnership(profesionalId: string): "propia" | "ajena" | "revisar" {
  const collection = activeAgreement(profesionalId)?.collection
  if (collection === "barberia") return "propia"
  if (collection === "profesional") return "ajena"
  return "revisar"
}

/** Atenciones completadas elegibles y su clasificación para venta (F13). */
export type EligibleAttention = {
  id: string
  clienteId?: string
  clienteLabel: string
  profesionalId: string
  profesionalLabel: string
  serviceIds: string[]
  serviceLabels: string[]
  estimatedCents: number
  date: string
  classification: "propia_sin_venta" | "ya_vendida" | "recaudacion_ajena" | "titularidad_pendiente"
  saleId?: string
}

export function eligibleAttenances(state: FinanceState): EligibleAttention[] {
  const sold = new Set(state.sales.map((s) => s.attentionId).filter(Boolean) as string[])
  return todasLasAtenciones()
    .filter((a) => a.estado === "completada")
    .map((a) => {
      const ownership = attentionOwnership(a.profesionalId)
      const serviceIds = a.serviciosRealizados
      const estimated = serviceIds.reduce((sum, id) => sum + (SERVICIOS.find((s) => s.id === id)?.precio ?? 0), 0) * 100
      const classification: EligibleAttention["classification"] =
        ownership === "ajena"
          ? "recaudacion_ajena"
          : ownership === "revisar"
            ? "titularidad_pendiente"
            : sold.has(a.id)
              ? "ya_vendida"
              : "propia_sin_venta"
      return {
        id: a.id,
        clienteId: a.clienteId,
        clienteLabel: clientLabel(a.clienteId),
        profesionalId: a.profesionalId,
        profesionalLabel: professionalName(a.profesionalId),
        serviceIds,
        serviceLabels: serviceIds.map(serviceName),
        estimatedCents: estimated,
        date: a.fin ?? a.inicio,
        classification,
        saleId: sold.has(a.id) ? state.sales.find((s) => s.attentionId === a.id)?.id : undefined,
      }
    })
}

/** Obligaciones derivadas de P3 (pedidos por cobrar y compras/reintegros). */
export function p3Obligations(): FinanceObligation[] {
  const inv = inventoryStore.getSnapshot()
  const out: FinanceObligation[] = []
  for (const order of inv.orders) {
    if (order.status === "delivered" || order.status === "cancelled") continue
    const total = order.lines.reduce((n, l) => n + l.quantity * l.unitPriceCents, 0)
    const paid = inv.payments.filter((p) => p.orderId === order.id).reduce((n, p) => n + p.amountCents, 0)
    const saldo = total - paid
    if (saldo <= 0) continue
    out.push({
      id: `p3:order:${order.id}`,
      direction: "cobrar",
      kind: "pedido",
      originId: order.id,
      originLabel: `Pedido ${order.number}`,
      counterpartyId: order.clientId,
      counterpartyLabel: clientLabel(order.clientId),
      totalCents: total,
      amountKnown: true,
      paidCents: paid,
      status: paid > 0 ? "parcial" : "abierta",
      createdAt: order.date,
      actor: "P3 Inventario",
      version: 1,
      externalRef: { module: "p3", id: order.id },
    })
  }
  for (const ob of inv.obligations) {
    if (ob.status === "paid") continue
    const saldo = ob.totalCents - ob.paidCents
    if (saldo <= 0) continue
    const purchase = inv.purchases.find((p) => p.id === ob.originId)
    out.push({
      id: `p3:obl:${ob.id}`,
      direction: "pagar",
      kind: ob.kind === "refund" ? "reintegro" : "compra",
      originId: ob.originId,
      originLabel: ob.kind === "refund" ? `Reintegro pedido ${ob.originId}` : `Compra ${purchase?.document ?? ob.originId}`,
      counterpartyLabel: ob.kind === "refund" ? clientLabel(inv.orders.find((o) => o.id === ob.originId)?.clientId) : "Proveedor",
      totalCents: ob.totalCents,
      amountKnown: true,
      paidCents: ob.paidCents,
      status: ob.paidCents > 0 ? "parcial" : "abierta",
      createdAt: FINANCE_NOW,
      actor: "P3 Inventario",
      version: 1,
      externalRef: { module: "p3", id: ob.id },
    })
  }
  return out
}

/** Vista unificada de obligaciones (nativas + P2 + P3). */
export function allObligations(state: FinanceState): FinanceObligation[] {
  return [...state.obligations, ...p2ObligationsView(), ...p3Obligations()]
}

export function p2ObligationsView(): FinanceObligation[] {
  const out: FinanceObligation[] = []
  for (const member of listStaff()) {
    for (const s of settlementsFor(member.id)) {
      const saldo = s.due
      if (saldo <= 0) continue
      const isRental = s.id.startsWith("OBL-")
      const isOpenSettlement = !isRental && s.status === "abierta"
      out.push({
        id: `p2:${s.id}`,
        direction: isRental ? "cobrar" : "pagar",
        kind: isRental ? "alquiler" : "liquidacion",
        originId: s.id,
        originLabel: isRental ? `Alquiler de silla · ${professionalName(s.staffId)}` : `Liquidación ${s.period} · ${professionalName(s.staffId)}`,
        counterpartyId: s.staffId,
        counterpartyLabel: professionalName(s.staffId),
        totalCents: s.total * 100,
        amountKnown: !isOpenSettlement,
        paidCents: s.paid * 100,
        dueDate: s.period.includes("19–25") ? "2026-10-25" : s.period.includes("12–18") ? "2026-10-19" : "2026-10-31",
        status: s.paid > 0 ? "parcial" : "abierta",
        createdAt: FINANCE_NOW,
        actor: "P2 Equipo",
        version: 1,
        externalRef: { module: "p2", id: s.id },
      })
    }
  }
  return out
}

export function obligationSaldo(state: FinanceState, ob: FinanceObligation): number {
  return Math.max(0, ob.totalCents - ob.paidCents)
}

export function obligationById(state: FinanceState, id: string): FinanceObligation | undefined {
  return allObligations(state).find((o) => o.id === id)
}

/* ═════════════════════════════════════════════════════════════════
   Caja — esperado reconstruible (06.11)
   ═════════════════════════════════════════════════════════════════ */

export function cashMovementsForSession(state: FinanceState, sessionId: string): MoneyMovement[] {
  const session = state.sessions.find((s) => s.id === sessionId)
  if (!session) return []
  const openAt = session.openedAt
  const closedAt = session.closedAt
  return state.movements.filter((m) => {
    if (m.fundAccountId !== "FUND-CAJA") return false
    if (m.medio !== "efectivo") return false
    if (m.status === "incierto") return false
    if (m.date < openAt) return false
    if (closedAt && m.date >= closedAt) return false
    if (m.correctionOf) return true
    return true
  })
}

export function cashExpected(state: FinanceState, session: CashSession): number {
  const moves = cashMovementsForSession(state, session.id)
  let expected = session.openingFloatCents
  for (const m of moves) {
    // La compensación es un movimiento real de signo opuesto. El original se
    // conserva en el ledger y no se vuelve a restar aquí.
    expected += signEffect(m)
  }
  return expected
}

function signEffect(m: MoneyMovement): number {
  if (m.kind === "ingreso") return m.amountCents
  if (m.kind === "traslado") return m.toFundAccountId === "FUND-CAJA" ? m.amountCents : -m.amountCents
  return -m.amountCents // egreso, retiro
}

export function activeSession(state: FinanceState): CashSession | undefined {
  return state.sessions.find((s) => s.status === "abierta")
}

/* ═════════════════════════════════════════════════════════════════
   Proyecciones (sección 07)
   ═════════════════════════════════════════════════════════════════ */

export type FinanceSummary = {
  vendidoCents: number
  cobradoCents: number
  saldoVentasCents: number
  porCobrarCents: number
  porPagarCents: number
  porCobrarVencidoCents: number
  porPagarVencidoCents: number
  aConfirmarCobrarCents: number
  aConfirmarPagarCents: number
  caja: {
    session?: CashSession
    expectedCents?: number
    status: "abierta" | "cerrada" | "inexistente"
  }
  attention: string[]
  resultadoStatus: "parcial" | "no_disponible"
  resultadoParcialCents: number
}

export function salesInPeriod(state: FinanceState, period: FinancePeriod): CommercialSale[] {
  const { fromKey, toKey } = resolvePeriod(period)
  return state.sales.filter((s) => inPeriod(s.createdAt, fromKey, toKey) && s.ownership === "propia")
}

/** Vendido: ventas propias confirmadas − ajustes comerciales (07.1). */
export function vendidoEn(state: FinanceState, period: FinancePeriod): number {
  const sales = salesInPeriod(state, period)
  const { fromKey, toKey } = resolvePeriod(period)
  const bruto = sales.reduce((sum, s) => sum + s.totalCents, 0)
  const ajustes = state.saleAdjustments
    .filter((a) => a.kind !== "reintegro" && inPeriod(a.date, fromKey, toKey))
    .filter((a) => sales.some((s) => s.id === a.saleId))
    .reduce((sum, a) => sum + a.deltaCents, 0)
  return bruto + ajustes
}

/** Cobrado: dinero propio efectivamente recibido en el período (07.2). */
export function cobradoEn(state: FinanceState, period: FinancePeriod): number {
  const { fromKey, toKey } = resolvePeriod(period)
  return state.movements
    .filter((m) => m.kind === "ingreso" && m.status === "confirmada" && !m.thirdPartyOwner && inPeriod(m.date, fromKey, toKey))
    .reduce((sum, m) => sum + m.amountCents, 0)
}

export function cobradoPorMedio(state: FinanceState, period: FinancePeriod): { medio: Medio; totalCents: number; count: number }[] {
  const { fromKey, toKey } = resolvePeriod(period)
  const rows = new Map<Medio, { totalCents: number; count: number }>()
  for (const m of state.movements) {
    if (m.kind !== "ingreso" || m.status !== "confirmada" || m.thirdPartyOwner) continue
    if (!inPeriod(m.date, fromKey, toKey)) continue
    const row = rows.get(m.medio) ?? { totalCents: 0, count: 0 }
    row.totalCents += m.amountCents
    row.count += 1
    rows.set(m.medio, row)
  }
  return [...rows.entries()].map(([medio, row]) => ({ medio, ...row }))
}

/** Saldo pendiente de las ventas del período (07.3): por venta, no por diferencia global. */
export function saldoVentasEn(state: FinanceState, period: FinancePeriod): number {
  return salesInPeriod(state, period).reduce((sum, sale) => {
    const ob = state.obligations.find((o) => o.originId === sale.id && o.direction === "cobrar")
    return sum + (ob ? obligationSaldo(state, ob) : 0)
  }, 0)
}

export function pendingGroups(state: FinanceState) {
  const today = FINANCE_TODAY
  const obs = allObligations(state).filter((o) => obligationSaldo(state, o) > 0 || !o.amountKnown)
  const cobrar = obs.filter((o) => o.direction === "cobrar")
  const pagar = obs.filter((o) => o.direction === "pagar")
  const classify = (list: FinanceObligation[]) => ({
    vencidas: list.filter((o) => o.amountKnown && o.dueDate && o.dueDate < today),
    hoy: list.filter((o) => o.amountKnown && o.dueDate === today),
    futuras: list.filter((o) => o.amountKnown && (!o.dueDate || o.dueDate > today) && o.dueDate),
    sinVencimiento: list.filter((o) => o.amountKnown && !o.dueDate),
    aConfirmar: list.filter((o) => !o.amountKnown),
  })
  return { cobrar, pagar, cobrarBuckets: classify(cobrar), pagarBuckets: classify(pagar) }
}

export function computeSummary(state: FinanceState, period: FinancePeriod): FinanceSummary {
  const { fromKey, toKey } = resolvePeriod(period)
  const vendido = vendidoEn(state, period)
  const cobrado = cobradoEn(state, period)
  const saldoVentas = saldoVentasEn(state, period)
  const pending = pendingGroups(state)
  const session = activeSession(state)
  const attention: string[] = []
  if (pending.cobrarBuckets.vencidas.length) attention.push(`${pending.cobrarBuckets.vencidas.length} cobro(s) vencido(s)`)
  if (pending.pagarBuckets.vencidas.length) attention.push(`${pending.pagarBuckets.vencidas.length} pago(s) vencido(s)`)
  const unverified = state.verifications.filter((v) => v.status === "pendiente_verificacion" || v.status === "comprobante_presentado" || v.status === "declarado")
  if (unverified.length) attention.push(`${unverified.length} cobro(s) externo(s) sin verificar`)
  const unvendown = eligibleAttenances(state).filter((a) => a.classification === "propia_sin_venta")
  if (unvendown.length) attention.push(`${unvendown.length} atención(es) propia(s) sin venta`)
  const unknowOps = state.movements.filter((m) => m.status === "incierto")
  if (unknowOps.length) attention.push(`${unknowOps.length} operación(es) con resultado incierto`)
  const gastosPendientes = state.expenses.filter((e) => e.status === "pendiente")
  if (gastosPendientes.length) attention.push(`${gastosPendientes.length} gasto(s) pendiente(s) de pago`)
  const cobradoMovs = state.movements.filter((m) => m.kind === "ingreso" && m.status === "confirmada" && !m.thirdPartyOwner && inPeriod(m.date, fromKey, toKey))
  const gastosPagados = state.movements.filter((m) => m.kind === "egreso" && m.status === "confirmada" && m.medio === "efectivo" && inPeriod(m.date, fromKey, toKey))
  const resultadoParcial = cobradoMovs.reduce((s, m) => s + m.amountCents, 0) - gastosPagados.reduce((s, m) => s + m.amountCents, 0)
  return {
    vendidoCents: vendido,
    cobradoCents: cobrado,
    saldoVentasCents: saldoVentas,
    porCobrarCents: pending.cobrar.reduce((s, o) => s + (o.amountKnown ? obligationSaldo(state, o) : 0), 0),
    porPagarCents: pending.pagar.reduce((s, o) => s + (o.amountKnown ? obligationSaldo(state, o) : 0), 0),
    porCobrarVencidoCents: pending.cobrarBuckets.vencidas.reduce((s, o) => s + obligationSaldo(state, o), 0),
    porPagarVencidoCents: pending.pagarBuckets.vencidas.reduce((s, o) => s + obligationSaldo(state, o), 0),
    aConfirmarCobrarCents: pending.cobrarBuckets.aConfirmar.length,
    aConfirmarPagarCents: pending.pagarBuckets.aConfirmar.length,
    caja: session
      ? { session, expectedCents: cashExpected(state, session), status: "abierta" }
      : { status: state.sessions.length ? "cerrada" : "inexistente" },
    attention,
    resultadoStatus: "parcial",
    resultadoParcialCents: resultadoParcial,
  }
}

/* ═════════════════════════════════════════════════════════════════
   Estado inicial (escenario base §08)
   ═════════════════════════════════════════════════════════════════ */

const baseCategories = (): FinanceCategory[] => [
  { id: "CAT-LIMP", name: "Limpieza", active: true },
  { id: "CAT-INSUM", name: "Insumos", active: true },
  { id: "CAT-SERV", name: "Servicios", active: true },
  { id: "CAT-OTROS", name: "Otros", active: true },
]

const baseFundAccounts = (): FundAccount[] => [
  { id: "FUND-CAJA", name: "Caja principal", kind: "caja", coverage: "known", active: true },
  { id: "FUND-BANK", name: "Cuenta bancaria propia", kind: "banco_propio", coverage: "insufficient", active: true },
]

function attentionFor(clientId: string, profesionalId: string, serviceId: string) {
  return todasLasAtenciones().find(
    (a) => a.clienteId === clientId && a.profesionalId === profesionalId && a.serviciosRealizados.includes(serviceId) && a.estado === "completada",
  )
}

export function baseState(): FinanceState {
  const sale1Attention = attentionFor("CL01", "ST01", "SV01")
  const sale2Attention = attentionFor("CL04", "ST01", "SV01")
  const sale3Attention = attentionFor("CL07", "ST01", "SV02")

  const sales: CommercialSale[] = [
    {
      id: "SAL-01",
      clientId: "CL01",
      clientLabel: "Juan Pérez",
      ownership: "propia",
      origin: "atencion",
      attentionId: sale1Attention?.id,
      lines: [{ id: "SAL-01-L1", kind: "servicio", refId: "SV01", name: "Corte clásico", quantity: 1, unitPriceCents: 1_800_000, attentionId: sale1Attention?.id }],
      subtotalCents: 1_800_000,
      discountCents: 0,
      totalCents: 1_800_000,
      status: "confirmada",
      createdAt: "2026-10-24T10:15:00-03:00",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
    {
      id: "SAL-02",
      clientId: "CL04",
      clientLabel: "Sofía Ramírez",
      ownership: "propia",
      origin: "atencion",
      attentionId: sale2Attention?.id,
      lines: [{ id: "SAL-02-L1", kind: "servicio", refId: "SV01", name: "Corte clásico", quantity: 1, unitPriceCents: 1_800_000, attentionId: sale2Attention?.id }],
      subtotalCents: 1_800_000,
      discountCents: 0,
      totalCents: 1_800_000,
      status: "confirmada",
      createdAt: "2026-10-24T11:30:00-03:00",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
    {
      id: "SAL-03",
      clientId: "CL07",
      clientLabel: "Andrea López",
      ownership: "propia",
      origin: "atencion",
      attentionId: sale3Attention?.id,
      lines: [{ id: "SAL-03-L1", kind: "servicio", refId: "SV02", name: "Corte + barba", quantity: 1, unitPriceCents: 2_500_000, attentionId: sale3Attention?.id }],
      subtotalCents: 2_500_000,
      discountCents: 0,
      totalCents: 2_500_000,
      status: "confirmada",
      createdAt: "2026-10-24T12:45:00-03:00",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
  ]

  const movements: MoneyMovement[] = [
    {
      id: "MV-SEED-01",
      operationId: "OP-SEED-COBRO-JUAN",
      kind: "ingreso",
      concept: "Cobro venta Corte clásico",
      counterpartyLabel: "Juan Pérez",
      medio: "efectivo",
      amountCents: 1_800_000,
      fundAccountId: "FUND-CAJA",
      date: "2026-10-24T10:20:00-03:00",
      status: "confirmada",
      relatedSaleId: "SAL-01",
      actor: "Dueño YoungKingZ",
    },
    {
      id: "MV-SEED-02",
      operationId: "OP-SEED-COBRO-SOFIA",
      kind: "ingreso",
      concept: "Cobro venta Corte clásico",
      counterpartyLabel: "Sofía Ramírez",
      medio: "transferencia",
      amountCents: 1_800_000,
      fundAccountId: "FUND-BANK",
      date: "2026-10-24T11:40:00-03:00",
      status: "confirmada",
      relatedSaleId: "SAL-02",
      actor: "Dueño YoungKingZ",
    },
    {
      id: "MV-SEED-03",
      operationId: "OP-SEED-GASTO-LIMPIEZA",
      kind: "egreso",
      concept: "Limpieza",
      medio: "efectivo",
      amountCents: 500_000,
      fundAccountId: "FUND-CAJA",
      date: "2026-10-24T12:10:00-03:00",
      status: "confirmada",
      relatedExpenseId: "EXP-01",
      actor: "Dueño YoungKingZ",
    },
    {
      id: "MV-SEED-04",
      operationId: "OP-SEED-RETIRO",
      kind: "retiro",
      concept: "Retiro del dueño",
      counterpartyLabel: "Dueño YoungKingZ",
      medio: "efectivo",
      amountCents: 1_000_000,
      fundAccountId: "FUND-CAJA",
      date: "2026-10-24T13:00:00-03:00",
      status: "confirmada",
      actor: "Dueño YoungKingZ",
    },
  ]

  const expenses: Expense[] = [
    {
      id: "EXP-01",
      concept: "Limpieza",
      categoryId: "CAT-LIMP",
      amountCents: 500_000,
      date: "2026-10-24T12:10:00-03:00",
      status: "pagado",
      paidOperationId: "OP-SEED-GASTO-LIMPIEZA",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
  ]

  const sessions: CashSession[] = [
    {
      id: "CASH-20261023",
      registerId: "REG-1",
      registerName: "Caja principal",
      openedAt: "2026-10-23T09:00:00-03:00",
      openedBy: "Dueño YoungKingZ",
      openingFloatCents: 4_000_000,
      status: "cerrada",
      closedAt: "2026-10-23T20:05:00-03:00",
      closedBy: "Dueño YoungKingZ",
      expectedCents: 4_000_000,
      countedCents: 4_000_000,
      differenceCents: 0,
      version: 2,
    },
    {
      id: "CASH-20261024",
      registerId: "REG-1",
      registerName: "Caja principal",
      openedAt: "2026-10-24T09:00:00-03:00",
      openedBy: "Dueño YoungKingZ",
      openingFloatCents: 5_000_000,
      status: "abierta",
      version: 1,
    },
  ]

  const thirdParty: ThirdPartyFunds[] = [
    {
      id: "TPF-01",
      payerLabel: "Cliente de Nicolás (transferencia)",
      professionalId: "ST02",
      professionalLabel: "Nicolás García",
      ownerLabel: "Nicolás García",
      custodianLabel: "YoungKingZ (cuenta propia)",
      amountCents: 1_200_000,
      deliveredCents: 0,
      medio: "transferencia",
      date: "2026-10-24T12:30:00-03:00",
      status: "en_custodia",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
  ]

  const nativePayables: FinanceObligation[] = [
    {
      id: "OBL-TPF-01",
      direction: "pagar",
      kind: "entrega_terceros",
      originId: "TPF-01",
      originLabel: "Entrega de fondos ajenos · Nicolás García",
      counterpartyId: "ST02",
      counterpartyLabel: "Nicolás García",
      totalCents: 1_200_000,
      amountKnown: true,
      paidCents: 0,
      status: "abierta",
      createdAt: "2026-10-24T12:30:00-03:00",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
  ]

  const nativeReceivables: FinanceObligation[] = [
    {
      id: "OBL-SAL-03",
      direction: "cobrar",
      kind: "venta",
      originId: "SAL-03",
      originLabel: "Venta Corte + barba · Andrea López",
      counterpartyId: "CL07",
      counterpartyLabel: "Andrea López",
      totalCents: 2_500_000,
      amountKnown: true,
      paidCents: 0,
      status: "abierta",
      createdAt: "2026-10-24T12:45:00-03:00",
      actor: "Dueño YoungKingZ",
      version: 1,
    },
  ]

  const audits: FinanceAuditEvent[] = movements.map((m, index) => ({
    id: `AUD-SEED-${index + 1}`,
    operationId: m.operationId,
    type: m.kind,
    result: "success" as const,
    date: m.date,
    detail: `Movimiento semilla ${m.concept}`,
  }))

  return {
    sales,
    saleAdjustments: [],
    obligations: [...nativeReceivables, ...nativePayables],
    allocations: [],
    operations: [],
    movements,
    fundAccounts: baseFundAccounts(),
    sessions,
    counts: [],
    differences: [],
    handoffs: [],
    advances: [],
    credits: [],
    expenses,
    recurringRules: [],
    recurringInstances: [],
    thirdPartyFunds: thirdParty,
    corrections: [],
    verifications: [],
    documents: [],
    approvals: [],
    categories: baseCategories(),
    audits,
    attempts: [],
    transfers: [],
    policyBlocks: [],
    operationIds: ["OP-SEED-COBRO-JUAN", "OP-SEED-COBRO-SOFIA", "OP-SEED-GASTO-LIMPIEZA", "OP-SEED-RETIRO"],
  }
}

/* ═════════════════════════════════════════════════════════════════
   Store
   ═════════════════════════════════════════════════════════════════ */

let state: FinanceState = baseState()
const listeners = new Set<() => void>()

export const financeStore = {
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  getSnapshot() {
    return state
  },
  reset() {
    state = baseState()
    for (const fn of listeners) fn()
  },
  /** Uso de pruebas: carga un escenario aislado. */
  loadScenario(next: FinanceState) {
    state = next
    for (const fn of listeners) fn()
  },
}

export function emitFinance(): void {
  for (const fn of listeners) fn()
}

export function setFinanceState(next: FinanceState): void {
  state = next
}

export function financeState(): FinanceState {
  return state
}

/* ═════════════════════════════════════════════════════════════════
   Invariantes (verificables, sección 06/19.2)
   ═════════════════════════════════════════════════════════════════ */

export function verifyFinanceInvariants(): string[] {
  const errors: string[] = []
  const s = state
  // 1. Los saldos de obligaciones nunca son negativos.
  for (const ob of allObligations(s)) {
    if (ob.paidCents > ob.totalCents && ob.amountKnown) errors.push(`${ob.id}: pagado supera total`)
  }
  // 2. Anticipos: aplicado nunca supera el monto.
  for (const adv of s.advances) {
    if (adv.appliedCents > adv.amountCents) errors.push(`${adv.id}: anticipo aplicado por encima del monto`)
  }
  // 3. Créditos: aplicado + reembolsado nunca supera el total.
  for (const cr of s.credits) {
    if (cr.appliedCents + cr.refundedCents > cr.totalCents) errors.push(`${cr.id}: crédito excedido`)
  }
  // 4. Fondos de terceros: entregado nunca supera custodiado.
  for (const tpf of s.thirdPartyFunds) {
    if (tpf.deliveredCents > tpf.amountCents) errors.push(`${tpf.id}: entrega supera custodia`)
  }
  // 5. Caja abierta única por registro.
  const openByRegister = new Map<string, number>()
  for (const sess of s.sessions) {
    if (sess.status === "abierta") openByRegister.set(sess.registerId, (openByRegister.get(sess.registerId) ?? 0) + 1)
  }
  for (const [registerId, count] of openByRegister) {
    if (count > 1) errors.push(`${registerId}: sesiones simultáneas`)
  }
  // 6. Operaciones con IDs únicos.
  if (new Set(s.operationIds).size !== s.operationIds.length) errors.push("operationIds duplicados")
  // 7. Sesión cerrada conserva snapshot esperado/contado.
  for (const sess of s.sessions) {
    if (sess.status === "cerrada" && (sess.expectedCents === undefined || sess.countedCents === undefined)) {
      errors.push(`${sess.id}: cierre sin snapshot`)
    }
  }
  // 8. Correcciones no borran movimientos originales.
  for (const corr of s.corrections) {
    if (!s.movements.some((m) => m.id === corr.originalMovementId)) errors.push(`${corr.id}: original eliminado`)
  }
  // 9. Fondos de terceros: ningún ingreso en custodia se cuenta como propio.
  for (const m of s.movements) {
    if (m.thirdPartyOwner && m.status === "confirmada") {
      const counted = cobradoEn(s, { preset: "mes", fromKey: "2026-10-01", toKey: "2026-10-31" })
      const propios = s.movements
        .filter((x) => x.kind === "ingreso" && x.status === "confirmada" && !x.thirdPartyOwner)
        .reduce((sum, x) => sum + x.amountCents, 0)
      if (counted > propios) errors.push("cobrado incluye fondos de terceros")
      break
    }
  }
  return errors
}
