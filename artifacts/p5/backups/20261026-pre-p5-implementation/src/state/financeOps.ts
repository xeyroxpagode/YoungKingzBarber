import { registrarCliente } from "./agenda"
import {
  articleById,
  available,
  inventoryStore,
  payObligation as payInventoryObligation,
  payOrder,
  setCashSessionStatus,
} from "./inventory"
import { applySettlementCredit, registerPayment } from "./staff"
import {
  FINANCE_NOW, FINANCE_TODAY,
  activeSession,
  allObligations,
  can,
  cashExpected,
  clientLabel,
  emitFinance,
  financeActor,
  financeState,
  obligationById,
  obligationSaldo,
  type AdvanceKind,
  type ApprovalRequest,
  type CommercialSale,
  type ExternalPaymentVerification,
  type FinanceCategory,
  type FinanceObligation,
  type FinancePermission,
  type FinanceState,
  type FinancialDocument,
  type MediaLine,
  type Medio,
  type MoneyMovement,
  type MoneyOperationKind,
  type SaleLine,
} from "./financeCore"

export type FinanceResult = {
  ok: boolean
  status: "confirmed" | "pending_verification" | "policy_required" | "approval_required" | "duplicate" | "conflict" | "unknown" | "rejected"
  message: string
  entityId?: string
  operationId?: string
}

type VersionMap = Record<string, number>

const result = (ok: boolean, status: FinanceResult["status"], message: string, operationId?: string, entityId?: string): FinanceResult => ({ ok, status, message, operationId, entityId })
const uid = (prefix: string, count: number) => `${prefix}-${String(count + 1).padStart(3, "0")}`

function audit(state: FinanceState, operationId: string, type: string, outcome: FinanceState["audits"][number]["result"], detail: string) {
  state.audits.push({ id: uid("AUD", state.audits.length), operationId, type, result: outcome, date: FINANCE_NOW, detail })
}

function authorize(permission: FinancePermission, operationId: string): FinanceResult | undefined {
  if (can(permission)) return undefined
  const state = financeState()
  audit(state, operationId, permission, "blocked_permission", `Permiso revocado o insuficiente para ${permission}`)
  emitFinance()
  return result(false, "rejected", "PERMISSION_DENIED · El permiso fue revisado nuevamente al confirmar.", operationId)
}

function begin(operationId: string, kind: MoneyOperationKind): FinanceResult | undefined {
  const state = financeState()
  if (!operationId.trim()) return result(false, "rejected", "La operación necesita una identidad estable.")
  if (state.operationIds.includes(operationId)) {
    audit(state, operationId, kind, "duplicate", "Reintento idempotente: se devolvió el resultado existente")
    emitFinance()
    const entityId = state.operations.find((entry) => entry.id === operationId)?.relatedId
    return result(true, "duplicate", "DUPLICATE · La operación ya estaba registrada; no se creó otra.", operationId, entityId)
  }
  state.attempts.push({ id: operationId, kind, status: "enviado", date: FINANCE_NOW })
  return undefined
}

function fail(operationId: string, kind: MoneyOperationKind, message: string, status: FinanceResult["status"] = "rejected") {
  const state = financeState()
  const attempt = state.attempts.find((entry) => entry.id === operationId)
  if (attempt) attempt.status = status === "unknown" ? "incierto" : "fallido"
  audit(state, operationId, kind, status === "unknown" ? "unknown" : "rejected", message)
  emitFinance()
  return result(false, status, message, operationId)
}

function finish(operationId: string, kind: MoneyOperationKind, entityId: string, message: string, status: "confirmada" | "pendiente_verificacion" = "confirmada") {
  const state = financeState()
  state.operationIds.push(operationId)
  const attempt = state.attempts.find((entry) => entry.id === operationId)
  if (attempt) {
    attempt.status = status === "confirmada" ? "confirmado" : "enviado"
    attempt.entityId = entityId
  }
  audit(state, operationId, kind, "success", message)
  emitFinance()
  return result(true, status === "confirmada" ? "confirmed" : "pending_verification", message, operationId, entityId)
}

function validCents(value: number) {
  return Number.isSafeInteger(value) && value > 0
}

function mediaTotal(media: MediaLine[]) {
  return media.reduce((sum, line) => sum + line.amountCents, 0)
}

function requireCash(media: MediaLine[], operationId: string, kind: MoneyOperationKind): FinanceResult | undefined {
  if (!media.some((line) => line.medio === "efectivo")) return undefined
  if (activeSession(financeState())) return undefined
  return fail(operationId, kind, "CLOSED_CASH · Abrí una sesión de Caja antes de confirmar efectivo.", "conflict")
}

function pushOperation(operationId: string, kind: MoneyOperationKind, media: MediaLine[], detail: string, relatedId?: string, status: "confirmada" | "pendiente_verificacion" | "incierto" = "confirmada") {
  const state = financeState()
  state.operations.push({ id: operationId, kind, date: FINANCE_NOW, actor: financeActor().name, status, media, allocationIds: [], detail, relatedId })
}

function pushMovement(operationId: string, kind: MoneyMovement["kind"], line: MediaLine, concept: string, options: Partial<MoneyMovement> = {}) {
  const state = financeState()
  state.movements.push({
    id: uid("MV", state.movements.length), operationId, kind, concept, medio: line.medio,
    amountCents: line.amountCents, fundAccountId: line.fundAccountId, date: FINANCE_NOW,
    status: "confirmada", actor: financeActor().name, ...options,
  })
}

function versionConflict(obligation: FinanceObligation, versions?: VersionMap) {
  return versions?.[obligation.id] !== undefined && versions[obligation.id] !== obligation.version
}

function mutateNativeObligation(state: FinanceState, id: string, amountCents: number) {
  const native = state.obligations.find((entry) => entry.id === id)
  if (!native) return false
  native.paidCents += amountCents
  native.status = native.paidCents === native.totalCents ? "saldada" : "parcial"
  native.version += 1
  return true
}

function applyExternal(obligation: FinanceObligation, amountCents: number, medio: Medio, operationId: string, direction: "collect" | "pay"): FinanceResult | undefined {
  if (!obligation.externalRef) return undefined
  if (obligation.externalRef.module === "p3") {
    const adapterResult = obligation.kind === "pedido"
      ? payOrder(obligation.originId, amountCents, medio === "efectivo" ? "cash" : "transfer", `${operationId}:p3:${obligation.id}`)
      : payInventoryObligation(obligation.externalRef.id, amountCents, `${operationId}:p3:${obligation.id}`)
    if (!adapterResult.ok) return result(false, adapterResult.duplicate ? "duplicate" : "conflict", adapterResult.reason ?? "La fuente P3 rechazó la operación.", operationId)
  } else {
    const pesos = amountCents / 100
    const adapterResult = direction === "collect"
      ? applySettlementCredit(obligation.originId, pesos, `${operationId}:p2:${obligation.id}`)
      : registerPayment(obligation.originId, pesos, medio === "efectivo" ? "efectivo" : "transferencia", `${operationId}:p2:${obligation.id}`, { cashSessionOpen: Boolean(activeSession(financeState())) })
    if (!adapterResult.ok) return result(false, "conflict", adapterResult.reason ?? "La fuente P2 rechazó la operación.", operationId)
  }
  return undefined
}

export type CreateSaleInput = {
  operationId: string
  clientId?: string
  clientName?: string
  origin: "atencion" | "libre" | "pedido"
  attentionId?: string
  orderId?: string
  ownership?: "propia" | "ajena" | "revisar"
  lines: SaleLine[]
  discountCents?: number
  discountReason?: string
  expectedAttentionUnsold?: boolean
}

export function createSale(input: CreateSaleInput): FinanceResult {
  const denied = authorize("finance.create_sale", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "venta"); if (early) return early
  const state = financeState()
  if (!input.lines.length) return fail(input.operationId, "venta", "Agregá al menos una línea.")
  if (input.attentionId && state.sales.some((sale) => sale.attentionId === input.attentionId)) return fail(input.operationId, "venta", "DUPLICATE · Esa atención ya tiene una venta.", "duplicate")
  if (input.orderId && state.sales.some((sale) => sale.orderId === input.orderId)) return fail(input.operationId, "venta", "DUPLICATE · Ese pedido ya tiene una venta.", "duplicate")
  if ((input.ownership ?? "propia") === "ajena") return fail(input.operationId, "venta", "OWNERSHIP_REVIEW_REQUIRED · La recaudación pertenece al profesional.", "conflict")
  if ((input.ownership ?? "propia") === "revisar") return fail(input.operationId, "venta", "OWNERSHIP_REVIEW_REQUIRED · Definí titularidad antes de vender.", "conflict")
  const invalidLine = input.lines.find((line) => !validCents(line.unitPriceCents) || !Number.isSafeInteger(line.quantity) || line.quantity <= 0)
  if (invalidLine) return fail(input.operationId, "venta", "Cantidad y precio deben ser positivos.")
  for (const line of input.lines.filter((entry) => entry.kind === "producto")) {
    if (!articleById(line.refId)) return fail(input.operationId, "venta", `El artículo ${line.refId} no existe en P3.`)
    if (available(line.refId, "sale") < line.quantity) return fail(input.operationId, "venta", `Stock insuficiente para ${line.name}.`, "conflict")
  }
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0)
  const discount = input.discountCents ?? 0
  if (discount < 0 || discount > subtotal) return fail(input.operationId, "venta", "El descuento no puede dejar un total negativo.")
  if (discount > 0 && (!can("finance.discount") || !input.discountReason?.trim())) {
    const approval = requestApproval({ operationId: input.operationId, reason: input.discountReason || "Descuento sin motivo", scope: "finance.discount", amountCents: discount, version: 1 }, true)
    return { ...approval, status: "approval_required", message: "APPROVAL_REQUIRED · El descuento necesita autorización específica." }
  }
  const id = uid("SAL", state.sales.length)
  const sale: CommercialSale = {
    id, clientId: input.clientId, clientLabel: input.clientName ?? clientLabel(input.clientId), ownership: input.ownership ?? "propia",
    origin: input.origin, attentionId: input.attentionId, orderId: input.orderId, lines: input.lines,
    subtotalCents: subtotal, discountCents: discount, totalCents: subtotal - discount,
    status: "confirmada", createdAt: FINANCE_NOW, actor: financeActor().name, version: 1,
  }
  state.sales.push(sale)
  state.obligations.push({
    id: `OBL-${id}`, direction: "cobrar", kind: input.origin === "pedido" ? "pedido" : "venta", originId: id,
    originLabel: `Venta ${sale.clientLabel}`, counterpartyId: sale.clientId, counterpartyLabel: sale.clientLabel,
    totalCents: sale.totalCents, amountKnown: true, paidCents: 0, status: "abierta", createdAt: FINANCE_NOW,
    actor: financeActor().name, version: 1,
  })
  if (discount) state.saleAdjustments.push({ id: uid("ADJ", state.saleAdjustments.length), saleId: id, kind: "descuento", deltaCents: 0, reason: input.discountReason!, date: FINANCE_NOW, actor: financeActor().name })
  pushOperation(input.operationId, "venta", [], `Venta ${id}`, id)
  return finish(input.operationId, "venta", id, "Venta confirmada; el cobro permanece separado.")
}

export function adjustSale(input: { operationId: string; saleId: string; deltaCents: number; reason: string; expectedVersion?: number }): FinanceResult {
  const denied = authorize("finance.correct_movement", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "correccion"); if (early) return early
  const state = financeState(); const sale = state.sales.find((entry) => entry.id === input.saleId)
  if (!sale || !input.reason.trim() || !Number.isSafeInteger(input.deltaCents) || sale.totalCents + input.deltaCents < 0) return fail(input.operationId, "correccion", "El ajuste comercial no es válido.")
  if (input.expectedVersion !== undefined && sale.version !== input.expectedVersion) return fail(input.operationId, "correccion", "CONFLICT · La venta cambió antes de confirmar.", "conflict")
  const received = state.movements.filter((entry) => entry.relatedSaleId === sale.id && entry.kind === "ingreso" && entry.status === "confirmada").reduce((sum, entry) => sum + entry.amountCents, 0)
  sale.totalCents += input.deltaCents; sale.status = "ajustada"; sale.version += 1
  state.saleAdjustments.push({ id: uid("ADJ", state.saleAdjustments.length), saleId: sale.id, kind: "correccion", deltaCents: input.deltaCents, reason: input.reason, date: FINANCE_NOW, actor: financeActor().name })
  const obligation = state.obligations.find((entry) => entry.originId === sale.id && entry.direction === "cobrar")
  if (obligation) { obligation.totalCents = sale.totalCents; obligation.status = obligation.paidCents >= obligation.totalCents ? "saldada" : obligation.paidCents ? "parcial" : "abierta"; obligation.version += 1 }
  const excess = Math.max(0, received - sale.totalCents)
  if (excess > 0 && !state.credits.some((entry) => entry.originOperationId === input.operationId)) state.credits.push({ id: uid("CR", state.credits.length), clientId: sale.clientId ?? "CLIENTE", clientLabel: sale.clientLabel, originOperationId: input.operationId, originLabel: `Ajuste de ${sale.id}`, totalCents: excess, appliedCents: 0, refundedCents: 0, date: FINANCE_NOW, actor: financeActor().name, version: 1 })
  pushOperation(input.operationId, "correccion", [], `Ajuste comercial de ${sale.id}`, sale.id)
  return finish(input.operationId, "correccion", sale.id, "Venta ajustada; cobros, crédito y snapshots históricos permanecen separados.")
}

export function refund(input: { operationId: string; creditId?: string; obligationId?: string; amountCents: number; medio: Medio; fundAccountId: string; reason: string }): FinanceResult {
  const denied = authorize("finance.pay_obligation", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "reintegro"); if (early) return early
  const state = financeState(); const credit = input.creditId ? state.credits.find((entry) => entry.id === input.creditId) : undefined; const obligation = input.obligationId ? obligationById(state, input.obligationId) : undefined
  const available = credit ? credit.totalCents - credit.appliedCents - credit.refundedCents : obligation ? obligationSaldo(state, obligation) : 0
  if (!validCents(input.amountCents) || input.amountCents > available || !input.reason.trim()) return fail(input.operationId, "reintegro", "El reintegro supera el saldo disponible o carece de motivo.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: input.medio, amountCents: input.amountCents, fundAccountId: input.fundAccountId }; const cashError = requireCash([line], input.operationId, "reintegro"); if (cashError) return cashError
  if (credit) { credit.refundedCents += input.amountCents; credit.version += 1 }
  if (obligation) mutateNativeObligation(state, obligation.id, input.amountCents)
  pushOperation(input.operationId, "reintegro", [line], `Reintegro · ${input.reason}`, credit?.id ?? obligation?.id)
  pushMovement(input.operationId, "egreso", line, `Reintegro · ${input.reason}`, { counterpartyLabel: credit?.clientLabel ?? obligation?.counterpartyLabel })
  return finish(input.operationId, "reintegro", credit?.id ?? obligation!.id, "Reintegro confirmado sin modificar stock automáticamente.")
}

export type AllocationInput = { obligationId: string; amountCents: number }
export type CollectInput = { operationId: string; amountCents: number; media: MediaLine[]; allocations: AllocationInput[]; payerLabel: string; versions?: VersionMap; externalEvidence?: { reference?: string; documentId?: string }; simulateUnknown?: boolean }

export function collect(input: CollectInput): FinanceResult {
  const denied = authorize("finance.collect", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "cobro"); if (early) return early
  if (!validCents(input.amountCents) || mediaTotal(input.media) !== input.amountCents) return fail(input.operationId, "cobro", "La distribución por medios debe coincidir exactamente con el cobro.")
  const cashError = requireCash(input.media, input.operationId, "cobro"); if (cashError) return cashError
  if (!input.allocations.length || input.allocations.reduce((sum, allocation) => sum + allocation.amountCents, 0) > input.amountCents) return fail(input.operationId, "cobro", "La distribución entre obligaciones es inválida.")
  const state = financeState()
  const obligations: FinanceObligation[] = []
  for (const allocation of input.allocations) {
    const obligation = obligationById(state, allocation.obligationId)
    if (!obligation || obligation.direction !== "cobrar" || !obligation.amountKnown) return fail(input.operationId, "cobro", "La cuenta seleccionada no admite cobro.")
    if (versionConflict(obligation, input.versions)) return fail(input.operationId, "cobro", "CONFLICT · El saldo cambió. Revisá el borrador antes de confirmar.", "conflict")
    if (!validCents(allocation.amountCents) || allocation.amountCents > obligationSaldo(state, obligation)) return fail(input.operationId, "cobro", "El cobro supera el saldo de una obligación.")
    obligations.push(obligation)
  }
  if (input.simulateUnknown) {
    pushOperation(input.operationId, "cobro", input.media, `Cobro incierto de ${input.payerLabel}`, undefined, "incierto")
    const attempt = state.attempts.find((entry) => entry.id === input.operationId); if (attempt) attempt.status = "incierto"
    audit(state, input.operationId, "cobro", "unknown", "UNKNOWN · El ledger no confirma ejecución")
    emitFinance()
    return result(false, "unknown", "UNKNOWN · Conservamos el mismo ID; comprobá el ledger antes de reintentar.", input.operationId)
  }
  const requiresVerification = input.media.some((line) => line.medio === "transferencia" && !line.reference)
  if (requiresVerification) {
    const verificationId = uid("VER", state.verifications.length)
    state.verifications.push({ id: verificationId, declaredAmountCents: input.amountCents, medio: "transferencia", payerLabel: input.payerLabel, reference: input.externalEvidence?.reference, evidenceDocumentId: input.externalEvidence?.documentId, status: input.externalEvidence?.documentId ? "comprobante_presentado" : "pendiente_verificacion", declaredBy: financeActor().name, declaredAt: FINANCE_NOW, pendingOperationId: input.operationId, pendingDetail: `Cobro declarado a ${input.payerLabel}`, pendingApps: input.allocations, pendingMedia: input.media })
    pushOperation(input.operationId, "cobro", input.media, `Cobro externo declarado · ${input.payerLabel}`, verificationId, "pendiente_verificacion")
    return finish(input.operationId, "cobro", verificationId, "Cobro declarado; todavía no acredita dinero.", "pendiente_verificacion")
  }
  return confirmCollection(input.operationId, input.payerLabel, input.amountCents, input.media, input.allocations, obligations)
}

function confirmCollection(operationId: string, payerLabel: string, amountCents: number, media: MediaLine[], allocations: AllocationInput[], obligations?: FinanceObligation[]): FinanceResult {
  const state = financeState()
  const resolved = obligations ?? allocations.map((entry) => obligationById(state, entry.obligationId)!).filter(Boolean)
  for (let index = 0; index < allocations.length; index += 1) {
    const allocation = allocations[index]
    const obligation = resolved[index]
    const externalError = applyExternal(obligation, allocation.amountCents, media[0]?.medio ?? "transferencia", operationId, "collect")
    if (externalError) return fail(operationId, "cobro", externalError.message, externalError.status)
  }
  let operation = state.operations.find((entry) => entry.id === operationId)
  if (operation) {
    operation.status = "confirmada"
    operation.media = media
    operation.detail = `Cobro verificado de ${payerLabel}`
  } else {
    pushOperation(operationId, "cobro", media, `Cobro de ${payerLabel}`)
    operation = state.operations.find((entry) => entry.id === operationId)!
  }
  allocations.forEach((entry) => {
    mutateNativeObligation(state, entry.obligationId, entry.amountCents)
    const id = uid("ALLOC", state.allocations.length)
    state.allocations.push({ id, operationId, obligationId: entry.obligationId, amountCents: entry.amountCents, date: FINANCE_NOW })
    operation.allocationIds.push(id)
  })
  media.forEach((line) => pushMovement(operationId, "ingreso", line, `Cobro · ${payerLabel}`, { counterpartyLabel: payerLabel, relatedObligationId: allocations[0]?.obligationId }))
  const unapplied = amountCents - allocations.reduce((sum, entry) => sum + entry.amountCents, 0)
  if (unapplied > 0) {
    const first = resolved[0]
    state.credits.push({ id: uid("CR", state.credits.length), clientId: first.counterpartyId ?? "CLIENTE", clientLabel: first.counterpartyLabel, originOperationId: operationId, originLabel: "Excedente de cobro", totalCents: unapplied, appliedCents: 0, refundedCents: 0, date: FINANCE_NOW, actor: financeActor().name, version: 1 })
  }
  if (state.operationIds.includes(operationId)) {
    const attempt = state.attempts.find((entry) => entry.id === operationId)
    if (attempt) attempt.status = "confirmado"
    audit(state, operationId, "cobro", "success", "Cobro externo verificado y aplicado")
    emitFinance()
    return result(true, "confirmed", "Cobro confirmado y aplicado una sola vez.", operationId, operationId)
  }
  return finish(operationId, "cobro", operationId, "Cobro confirmado y aplicado una sola vez.")
}

export function verifyExternalPayment(verificationId: string, operationId: string, approve: boolean): FinanceResult {
  const denied = authorize("finance.verify_external_payment", operationId); if (denied) return denied
  const early = begin(operationId, "cobro"); if (early) return early
  const state = financeState(); const verification = state.verifications.find((entry) => entry.id === verificationId)
  if (!verification || !["declarado", "comprobante_presentado", "pendiente_verificacion"].includes(verification.status)) return fail(operationId, "cobro", "La verificación ya fue resuelta o no existe.", "conflict")
  verification.status = approve ? "verificado" : "rechazado"; verification.verifiedBy = financeActor().name; verification.verifiedAt = FINANCE_NOW
  if (!approve) return finish(operationId, "cobro", verificationId, "Transferencia rechazada; no se acreditó dinero.")
  const pendingOperation = verification.pendingOperationId!
  const obligations = (verification.pendingApps ?? []).map((entry) => obligationById(state, entry.obligationId)!).filter(Boolean)
  const confirmation = confirmCollection(pendingOperation, verification.payerLabel, verification.declaredAmountCents, verification.pendingMedia ?? [], verification.pendingApps ?? [], obligations)
  if (!confirmation.ok) return fail(operationId, "cobro", confirmation.message, confirmation.status)
  return finish(operationId, "cobro", verificationId, "Transferencia verificada manualmente y aplicada.")
}

export type PayInput = { operationId: string; obligationId: string; amountCents: number; medio: Medio; fundAccountId: string; expectedVersion?: number }
export function pay(input: PayInput): FinanceResult {
  const denied = authorize("finance.pay_obligation", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "pago"); if (early) return early
  const state = financeState(); const obligation = obligationById(state, input.obligationId)
  if (!obligation || obligation.direction !== "pagar" || !obligation.amountKnown) return fail(input.operationId, "pago", "La obligación no está confirmada para pago.")
  if (input.expectedVersion !== undefined && input.expectedVersion !== obligation.version) return fail(input.operationId, "pago", "CONFLICT · El saldo cambió antes de confirmar.", "conflict")
  if (!validCents(input.amountCents) || input.amountCents > obligationSaldo(state, obligation)) return fail(input.operationId, "pago", "El pago debe ser positivo y no superar el saldo.")
  const media: MediaLine[] = [{ id: `${input.operationId}:M1`, medio: input.medio, amountCents: input.amountCents, fundAccountId: input.fundAccountId }]
  const cashError = requireCash(media, input.operationId, "pago"); if (cashError) return cashError
  const externalError = applyExternal(obligation, input.amountCents, input.medio, input.operationId, "pay"); if (externalError) return fail(input.operationId, "pago", externalError.message, externalError.status)
  mutateNativeObligation(state, input.obligationId, input.amountCents)
  pushOperation(input.operationId, "pago", media, `Pago a ${obligation.counterpartyLabel}`, obligation.id)
  pushMovement(input.operationId, "egreso", media[0], `Pago · ${obligation.originLabel}`, { counterpartyLabel: obligation.counterpartyLabel, relatedObligationId: obligation.id })
  return finish(input.operationId, "pago", obligation.id, "Pago confirmado; la obligación conserva su identidad de origen.")
}

export type ExpenseInput = { operationId: string; concept: string; categoryId: string; amountCents: number; counterparty?: string; payNow: boolean; medio?: Medio; fundAccountId?: string }
export function createExpense(input: ExpenseInput): FinanceResult {
  const denied = authorize("finance.create_expense", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "gasto"); if (early) return early
  if (!input.concept.trim() || !validCents(input.amountCents)) return fail(input.operationId, "gasto", "Completá concepto e importe válido.")
  const state = financeState(); const id = uid("EXP", state.expenses.length)
  const obligationId = `OBL-${id}`
  state.expenses.push({ id, concept: input.concept, categoryId: input.categoryId, amountCents: input.amountCents, date: FINANCE_NOW, counterparty: input.counterparty, status: input.payNow ? "pagado" : "pendiente", obligationId, paidOperationId: input.payNow ? input.operationId : undefined, actor: financeActor().name, version: 1 })
  state.obligations.push({ id: obligationId, direction: "pagar", kind: "gasto", originId: id, originLabel: `Gasto ${input.concept}`, counterpartyLabel: input.counterparty ?? "Sin contraparte", totalCents: input.amountCents, amountKnown: true, paidCents: input.payNow ? input.amountCents : 0, status: input.payNow ? "saldada" : "abierta", createdAt: FINANCE_NOW, actor: financeActor().name, version: 1 })
  if (input.payNow) {
    if (!input.medio || !input.fundAccountId) return fail(input.operationId, "gasto", "Elegí medio y fuente para pagar ahora.")
    const line: MediaLine = { id: `${input.operationId}:M1`, medio: input.medio, amountCents: input.amountCents, fundAccountId: input.fundAccountId }
    const cashError = requireCash([line], input.operationId, "gasto"); if (cashError) { state.expenses.pop(); state.obligations.pop(); return cashError }
    pushOperation(input.operationId, "gasto", [line], `Gasto pagado ${input.concept}`, id)
    pushMovement(input.operationId, "egreso", line, input.concept, { counterpartyLabel: input.counterparty, relatedExpenseId: id, relatedObligationId: obligationId })
  } else pushOperation(input.operationId, "gasto", [], `Gasto pendiente ${input.concept}`, id)
  return finish(input.operationId, "gasto", id, input.payNow ? "Gasto y pago vinculados sin duplicar el egreso." : "Gasto pendiente; todavía no generó salida de fondos.")
}

export function createCommercialObligation(input: { operationId: string; supplier: string; document: string; concept: string; amountCents?: number; dueDate?: string; categoryId: string }): FinanceResult {
  const denied = authorize("finance.create_expense", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "gasto"); if (early) return early
  if (!input.supplier.trim() || !input.document.trim() || !input.concept.trim() || (input.amountCents !== undefined && !validCents(input.amountCents))) return fail(input.operationId, "gasto", "Proveedor, documento, concepto e importe válido o A confirmar son obligatorios.")
  const state = financeState(); const reference = `COM:${input.document.trim().toUpperCase()}`
  const duplicatedInP3 = inventoryStore.getSnapshot().purchases.some((purchase) => purchase.document.trim().toUpperCase() === input.document.trim().toUpperCase())
  if (duplicatedInP3 || allObligations(state).some((entry) => entry.originId === reference)) return fail(input.operationId, "gasto", "DUPLICATE · El documento ya está representado por una compra u obligación existente.", "duplicate")
  const expenseId = input.amountCents === undefined ? undefined : uid("EXP", state.expenses.length)
  const obligationId = uid("OBL-COM", state.obligations.length)
  if (expenseId) state.expenses.push({ id: expenseId, concept: input.concept, categoryId: input.categoryId, amountCents: input.amountCents!, date: FINANCE_NOW, counterparty: input.supplier, status: "pendiente", obligationId, actor: financeActor().name, version: 1 })
  state.obligations.push({ id: obligationId, direction: "pagar", kind: "gasto", originId: reference, originLabel: `${input.document} · ${input.concept}`, counterpartyLabel: input.supplier, totalCents: input.amountCents ?? 0, amountKnown: input.amountCents !== undefined, paidCents: 0, dueDate: input.dueDate, status: "abierta", createdAt: FINANCE_NOW, actor: financeActor().name, version: 1 })
  pushOperation(input.operationId, "gasto", [], `Obligación comercial ${input.document}`, obligationId)
  return finish(input.operationId, "gasto", obligationId, input.amountCents === undefined ? "Obligación comercial registrada con importe A confirmar; no generó egreso." : "Obligación comercial registrada; todavía no generó egreso.")
}

export function createOtherReceivable(input: { operationId: string; counterparty: string; concept: string; amountCents?: number; dueDate?: string; reference: string }): FinanceResult {
  const denied = authorize("finance.create_sale", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "venta"); if (early) return early
  if (!input.counterparty.trim() || !input.concept.trim() || !input.reference.trim()) return fail(input.operationId, "venta", "Contraparte, concepto y referencia son obligatorios.")
  const state = financeState(); if (state.obligations.some((entry) => entry.originId === input.reference)) return fail(input.operationId, "venta", "DUPLICATE · La referencia ya existe.", "duplicate")
  const id = uid("OBL-OTRA", state.obligations.length)
  state.obligations.push({ id, direction: "cobrar", kind: "otra_cuenta", originId: input.reference, originLabel: input.concept, counterpartyLabel: input.counterparty, totalCents: input.amountCents ?? 0, amountKnown: input.amountCents !== undefined, paidCents: 0, dueDate: input.dueDate, status: "abierta", createdAt: FINANCE_NOW, actor: financeActor().name, version: 1 })
  pushOperation(input.operationId, "venta", [], `Cuenta por cobrar ${input.concept}`, id)
  return finish(input.operationId, "venta", id, input.amountCents === undefined ? "Cuenta registrada con importe a confirmar." : "Cuenta por cobrar registrada.")
}

export function createAdvance(input: { operationId: string; kind: AdvanceKind; personId?: string; personLabel: string; amountCents: number; medio: Medio; fundAccountId: string; reservationId?: string; relatedSettlementId?: string }): FinanceResult {
  const permission = input.kind === "adelanto_profesional" ? "finance.pay_obligation" : "finance.collect"
  const denied = authorize(permission, input.operationId); if (denied) return denied
  const early = begin(input.operationId, "anticipo"); if (early) return early
  if (!validCents(input.amountCents)) return fail(input.operationId, "anticipo", "Ingresá un importe válido.")
  if (input.kind === "sena_reserva" && !input.reservationId) return fail(input.operationId, "anticipo", "La seña requiere una reserva real.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: input.medio, amountCents: input.amountCents, fundAccountId: input.fundAccountId }
  const cashError = requireCash([line], input.operationId, "anticipo"); if (cashError) return cashError
  const state = financeState(); const id = uid("ADV", state.advances.length)
  const incoming = input.kind !== "adelanto_profesional"
  state.advances.push({ id, kind: input.kind, direction: incoming ? "cliente" : "profesional", personId: input.personId, personLabel: input.personLabel, amountCents: input.amountCents, appliedCents: 0, medio: input.medio, fundAccountId: input.fundAccountId, reservationId: input.reservationId, relatedSettlementId: input.relatedSettlementId, date: FINANCE_NOW, actor: financeActor().name, version: 1 })
  pushOperation(input.operationId, "anticipo", [line], `${incoming ? "Anticipo recibido" : "Adelanto entregado"} · ${input.personLabel}`, id)
  pushMovement(input.operationId, incoming ? "ingreso" : "egreso", line, `${input.kind.replace(/_/g, " ")} · ${input.personLabel}`, { counterpartyLabel: input.personLabel })
  return finish(input.operationId, "anticipo", id, "Anticipo registrado como dinero real; todavía no fue aplicado.")
}

export function applyAdvance(input: { operationId: string; advanceId: string; obligationId: string; amountCents: number; expectedVersion?: number }): FinanceResult {
  const early = begin(input.operationId, "aplicacion_anticipo"); if (early) return early
  const state = financeState(); const advance = state.advances.find((entry) => entry.id === input.advanceId); const obligation = obligationById(state, input.obligationId)
  if (!advance || !obligation) return fail(input.operationId, "aplicacion_anticipo", "Anticipo u obligación inexistente.")
  if (input.expectedVersion !== undefined && advance.version !== input.expectedVersion) return fail(input.operationId, "aplicacion_anticipo", "CONFLICT · El saldo del anticipo cambió.", "conflict")
  const availableCents = advance.amountCents - advance.appliedCents
  if (!validCents(input.amountCents) || input.amountCents > availableCents || input.amountCents > obligationSaldo(state, obligation)) return fail(input.operationId, "aplicacion_anticipo", "La aplicación supera el saldo disponible o el destino.")
  advance.appliedCents += input.amountCents; advance.version += 1
  if (!mutateNativeObligation(state, obligation.id, input.amountCents)) {
    const external = applyExternal(obligation, input.amountCents, advance.medio, input.operationId, obligation.direction === "cobrar" ? "collect" : "pay")
    if (external) return fail(input.operationId, "aplicacion_anticipo", external.message, external.status)
  }
  pushOperation(input.operationId, "aplicacion_anticipo", [], `Aplicación ${advance.id} a ${obligation.id}`, advance.id)
  return finish(input.operationId, "aplicacion_anticipo", advance.id, "Saldo aplicado sin crear un segundo movimiento monetario.")
}

export function applyCredit(input: { operationId: string; creditId: string; obligationId: string; amountCents: number; expectedVersion?: number }): FinanceResult {
  const early = begin(input.operationId, "aplicacion_anticipo"); if (early) return early
  const state = financeState(); const credit = state.credits.find((entry) => entry.id === input.creditId); const obligation = obligationById(state, input.obligationId)
  if (!credit || !obligation) return fail(input.operationId, "aplicacion_anticipo", "Crédito u obligación inexistente.")
  if (input.expectedVersion !== undefined && credit.version !== input.expectedVersion) return fail(input.operationId, "aplicacion_anticipo", "CONFLICT · El crédito cambió.", "conflict")
  const available = credit.totalCents - credit.appliedCents - credit.refundedCents
  if (!validCents(input.amountCents) || input.amountCents > available || input.amountCents > obligationSaldo(state, obligation)) return fail(input.operationId, "aplicacion_anticipo", "La aplicación supera el crédito o el saldo destino.")
  credit.appliedCents += input.amountCents; credit.version += 1
  if (!mutateNativeObligation(state, obligation.id, input.amountCents)) { const external = applyExternal(obligation, input.amountCents, "transferencia", input.operationId, "collect"); if (external) return fail(input.operationId, "aplicacion_anticipo", external.message, external.status) }
  pushOperation(input.operationId, "aplicacion_anticipo", [], `Crédito ${credit.id} aplicado`, credit.id)
  return finish(input.operationId, "aplicacion_anticipo", credit.id, "Crédito aplicado sin registrar un ingreso nuevo.")
}

export function resolveDepositPolicy(input: { operationId: string; advanceId: string; decision: "conservar" | "retener" | "devolver" }): FinanceResult {
  const state = financeState(); const deposit = state.advances.find((entry) => entry.id === input.advanceId && entry.kind === "sena_reserva")
  if (!deposit) return result(false, "rejected", "Seña inexistente.", input.operationId)
  if (input.decision === "conservar") return result(true, "confirmed", "La seña permanece disponible para reprogramación.", input.operationId, deposit.id)
  state.policyBlocks.push({ id: uid("POL", state.policyBlocks.length), subject: deposit.id, policy: input.decision === "retener" ? "retencion_senas" : "devolucion_senas", reason: "No existe una política comercial aprobada", date: FINANCE_NOW, draftSummary: `${input.decision} ${deposit.amountCents - deposit.appliedCents}` })
  emitFinance()
  return result(false, "policy_required", "POLICY_REQUIRED · Se conservó el borrador sin ejecutar retención ni devolución.", input.operationId, deposit.id)
}

export function withdraw(input: { operationId: string; amountCents: number; originFundId: string; destination: string; reason: string; medio?: Medio }): FinanceResult {
  const denied = authorize("finance.withdraw", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "retiro"); if (early) return early
  if (!validCents(input.amountCents) || !input.reason.trim()) return fail(input.operationId, "retiro", "Importe y motivo son obligatorios.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: input.medio ?? "efectivo", amountCents: input.amountCents, fundAccountId: input.originFundId }
  const cashError = requireCash([line], input.operationId, "retiro"); if (cashError) return cashError
  pushOperation(input.operationId, "retiro", [line], `Retiro · ${input.reason}`)
  pushMovement(input.operationId, "retiro", line, `Retiro del dueño · ${input.reason}`, { counterpartyLabel: input.destination })
  return finish(input.operationId, "retiro", input.operationId, "Retiro confirmado; no se clasificó como gasto operativo.")
}

export function transferFunds(input: { operationId: string; fromAccountId: string; toAccountId: string; amountCents: number; expectedKnownBalance?: number }): FinanceResult {
  const denied = authorize("finance.manage_fund_sources", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "traslado"); if (early) return early
  const state = financeState(); const from = state.fundAccounts.find((entry) => entry.id === input.fromAccountId); const to = state.fundAccounts.find((entry) => entry.id === input.toAccountId)
  if (!from || !to || from.id === to.id || !validCents(input.amountCents)) return fail(input.operationId, "traslado", "Elegí fuentes diferentes y un importe válido.")
  if (from.coverage === "insufficient" && from.kind !== "caja") return fail(input.operationId, "traslado", "Sin cobertura suficiente para verificar fondos de origen.", "conflict")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: "efectivo", amountCents: input.amountCents, fundAccountId: from.id }
  if (from.kind === "caja" || to.kind === "caja") { const cashError = requireCash([line], input.operationId, "traslado"); if (cashError) return cashError }
  pushOperation(input.operationId, "traslado", [line], `Traslado ${from.name} → ${to.name}`)
  pushMovement(input.operationId, "traslado", line, `Traslado interno`, { toFundAccountId: to.id })
  state.transfers.push({ id: uid("TR", state.transfers.length), operationId: input.operationId, fromAccountId: from.id, toAccountId: to.id, amountCents: input.amountCents, date: FINANCE_NOW, status: "confirmada", actor: financeActor().name })
  return finish(input.operationId, "traslado", input.operationId, "Traslado confirmado; los fondos propios globales se conservan.")
}

export function openCash(input: { operationId: string; openingFloatCents: number; responsible: string }): FinanceResult {
  const denied = authorize("finance.open_cash", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "apertura"); if (early) return early
  const state = financeState(); if (activeSession(state)) return fail(input.operationId, "apertura", "CONFLICT · Ya existe una sesión abierta.", "conflict")
  if (!Number.isSafeInteger(input.openingFloatCents) || input.openingFloatCents < 0) return fail(input.operationId, "apertura", "El fondo contado no es válido.")
  const id = uid("CASH", state.sessions.length)
  state.sessions.push({ id, registerId: "REG-1", registerName: "Caja principal", openedAt: FINANCE_NOW, openedBy: input.responsible, openingFloatCents: input.openingFloatCents, status: "abierta", version: 1 })
  setCashSessionStatus(true); pushOperation(input.operationId, "apertura", [], `Apertura ${id}`, id)
  return finish(input.operationId, "apertura", id, "Caja abierta; la apertura no es ingreso comercial.")
}

export function countCash(input: { operationId: string; countedCents: number; expectedSessionVersion: number; notes?: string }): FinanceResult {
  const denied = authorize("finance.cash_count", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "arqueo"); if (early) return early
  const state = financeState(); const session = activeSession(state)
  if (!session) return fail(input.operationId, "arqueo", "CLOSED_CASH · No hay una sesión abierta.", "conflict")
  if (session.version !== input.expectedSessionVersion) return fail(input.operationId, "arqueo", "CONFLICT · Hubo un movimiento nuevo durante el arqueo.", "conflict")
  if (!Number.isSafeInteger(input.countedCents) || input.countedCents < 0) return fail(input.operationId, "arqueo", "El contado no es válido.")
  const expected = cashExpected(state, session); const id = uid("COUNT", state.counts.length)
  state.counts.push({ id, sessionId: session.id, countedCents: input.countedCents, method: "total", expectedCents: expected, differenceCents: input.countedCents - expected, date: FINANCE_NOW, actor: financeActor().name, notes: input.notes })
  pushOperation(input.operationId, "arqueo", [], `Arqueo ${id}`, id)
  return finish(input.operationId, "arqueo", id, "Arqueo guardado sin alterar el efectivo esperado.")
}

export function manualCashMovement(input: { operationId: string; direction: "entrada" | "salida"; amountCents: number; reason: string; reference: string }): FinanceResult {
  const denied = authorize("finance.cash_count", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "correccion"); if (early) return early
  if (!activeSession(financeState())) return fail(input.operationId, "correccion", "CLOSED_CASH · No hay Caja abierta.", "conflict")
  if (!validCents(input.amountCents) || !input.reason.trim() || !input.reference.trim()) return fail(input.operationId, "correccion", "Motivo, referencia e importe son obligatorios.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: "efectivo", amountCents: input.amountCents, fundAccountId: "FUND-CAJA" }
  pushOperation(input.operationId, "correccion", [line], `Movimiento manual restringido · ${input.reason}`)
  pushMovement(input.operationId, input.direction === "entrada" ? "ingreso" : "egreso", line, `Ajuste manual · ${input.reason}`)
  const session = activeSession(financeState()); if (session) session.version += 1
  return finish(input.operationId, "correccion", input.operationId, "Movimiento manual documentado; no reemplaza una venta, gasto o pago.")
}

export function closeCash(input: { operationId: string; countId: string; expectedSessionVersion: number; differenceReason?: string }): FinanceResult {
  const denied = authorize("finance.close_cash", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "cierre"); if (early) return early
  const state = financeState(); const session = activeSession(state); const count = state.counts.find((entry) => entry.id === input.countId)
  if (!session || !count || count.sessionId !== session.id) return fail(input.operationId, "cierre", "Necesitás un arqueo vigente de la sesión abierta.")
  if (session.version !== input.expectedSessionVersion || count.expectedCents !== cashExpected(state, session)) return fail(input.operationId, "cierre", "CONFLICT · La revisión quedó desactualizada por un movimiento nuevo.", "conflict")
  if (count.differenceCents !== 0 && !input.differenceReason?.trim()) return fail(input.operationId, "cierre", "Explicá la diferencia antes de cerrar.")
  if (count.differenceCents !== 0) state.differences.push({ id: uid("DIFF", state.differences.length), sessionId: session.id, kind: count.differenceCents < 0 ? "faltante" : "sobrante", amountCents: Math.abs(count.differenceCents), reason: input.differenceReason!, date: FINANCE_NOW, actor: financeActor().name })
  session.status = "cerrada"; session.closedAt = FINANCE_NOW; session.closedBy = financeActor().name; session.expectedCents = count.expectedCents; session.countedCents = count.countedCents; session.differenceCents = count.differenceCents; session.version += 1
  setCashSessionStatus(false); pushOperation(input.operationId, "cierre", [], `Cierre ${session.id}`, session.id)
  return finish(input.operationId, "cierre", session.id, "Caja cerrada con snapshot inmutable.")
}

export function handoffCash(input: { operationId: string; fromStaff: string; toStaff: string; outgoingCountCents: number; incomingCountCents: number; expectedSessionVersion: number; accepted: boolean; observations?: string }): FinanceResult {
  const denied = authorize("finance.cash_handoff", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "relevo"); if (early) return early
  const state = financeState(); const session = activeSession(state)
  if (!session || session.version !== input.expectedSessionVersion) return fail(input.operationId, "relevo", "CONFLICT · La sesión cambió antes de aceptar el relevo.", "conflict")
  const id = uid("HAND", state.handoffs.length); const expected = cashExpected(state, session)
  state.handoffs.push({ id, sessionId: session.id, fromStaff: input.fromStaff, toStaff: input.toStaff, outgoingCountCents: input.outgoingCountCents, incomingCountCents: input.incomingCountCents, expectedCents: expected, differenceCents: input.incomingCountCents - expected, observations: input.observations, status: input.accepted ? "aceptado" : "rechazado", date: FINANCE_NOW })
  if (input.accepted) { session.openedBy = input.toStaff; session.version += 1 }
  pushOperation(input.operationId, "relevo", [], `Relevo ${id}`, id)
  return finish(input.operationId, "relevo", id, input.accepted ? "Custodia aceptada; la misma sesión continúa." : "Relevo rechazado; la custodia no cambió.")
}

export function deliverThirdPartyFunds(input: { operationId: string; thirdPartyId: string; amountCents: number; medio: Medio; fundAccountId: string }): FinanceResult {
  const denied = authorize("finance.pay_obligation", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "entrega_terceros"); if (early) return early
  const state = financeState(); const funds = state.thirdPartyFunds.find((entry) => entry.id === input.thirdPartyId)
  if (!funds || !validCents(input.amountCents) || input.amountCents > funds.amountCents - funds.deliveredCents) return fail(input.operationId, "entrega_terceros", "La entrega supera los fondos custodiados.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: input.medio, amountCents: input.amountCents, fundAccountId: input.fundAccountId }; const cashError = requireCash([line], input.operationId, "entrega_terceros"); if (cashError) return cashError
  funds.deliveredCents += input.amountCents; funds.status = funds.deliveredCents === funds.amountCents ? "entregado" : "parcial"; funds.version += 1
  const obligation = state.obligations.find((entry) => entry.originId === funds.id); if (obligation) mutateNativeObligation(state, obligation.id, input.amountCents)
  pushOperation(input.operationId, "entrega_terceros", [line], `Entrega a ${funds.ownerLabel}`, funds.id)
  pushMovement(input.operationId, "egreso", line, `Entrega de fondos ajenos · ${funds.ownerLabel}`, { counterpartyLabel: funds.ownerLabel, thirdPartyOwner: funds.ownerLabel })
  return finish(input.operationId, "entrega_terceros", funds.id, "Fondos entregados; no se registraron como gasto propio.")
}

export function correctMovement(input: { operationId: string; movementId: string; reason: string }): FinanceResult {
  const denied = authorize("finance.correct_movement", input.operationId); if (denied) return denied
  const early = begin(input.operationId, "correccion"); if (early) return early
  const state = financeState(); const original = state.movements.find((entry) => entry.id === input.movementId)
  if (!original || !input.reason.trim()) return fail(input.operationId, "correccion", "Movimiento y motivo son obligatorios.")
  const line: MediaLine = { id: `${input.operationId}:M1`, medio: original.medio, amountCents: original.amountCents, fundAccountId: original.fundAccountId }
  pushOperation(input.operationId, "correccion", [line], `Corrección de ${original.id}`, original.id)
  const compensatingKind: MoneyMovement["kind"] = original.kind === "ingreso" ? "egreso" : "ingreso"
  pushMovement(input.operationId, compensatingKind, line, `Corrección · ${original.concept}`, { correctionOf: original.id, counterpartyLabel: original.counterpartyLabel })
  const compensation = state.movements.at(-1)!
  state.corrections.push({ id: uid("CORR", state.corrections.length), originalMovementId: original.id, reason: input.reason, compensatingOperationId: input.operationId, compensatingMovementId: compensation.id, effects: ["Movimiento original preservado", "Compensación trazable"], date: FINANCE_NOW, actor: financeActor().name })
  return finish(input.operationId, "correccion", compensation.id, "Corrección compensatoria registrada; el original permanece visible.")
}

export function addDocument(input: { operationId: string; name: string; sizeBytes: number; mime: string; linkedTo: { type: string; id: string }; replacesId?: string }): FinanceResult {
  const state = financeState()
  if (!input.name.trim() || input.sizeBytes <= 0 || input.sizeBytes > 5_000_000 || !["application/pdf", "image/png", "image/jpeg"].includes(input.mime)) return result(false, "rejected", "Archivo incompatible o mayor a 5 MB.", input.operationId)
  const id = uid("DOC", state.documents.length); const doc: FinancialDocument = { id, name: input.name, sizeBytes: input.sizeBytes, mime: input.mime, kind: "comprobante", linkedTo: input.linkedTo, persistence: "sesion", date: FINANCE_NOW, actor: financeActor().name }
  if (input.replacesId) { const previous = state.documents.find((entry) => entry.id === input.replacesId); if (previous) previous.replacedBy = id }
  state.documents.push(doc); emitFinance(); return result(true, "confirmed", "Comprobante ligado a la sesión; no confirma dinero por sí solo.", input.operationId, id)
}

export function requestApproval(input: { operationId: string; reason: string; scope: string; amountCents?: number; version: number }, internal = false): FinanceResult {
  const state = financeState(); const existing = state.approvals.find((entry) => entry.operationId === input.operationId && entry.version === input.version && entry.scope === input.scope)
  if (existing) return result(true, "duplicate", "La solicitud ya existe.", input.operationId, existing.id)
  const id = uid("APR", state.approvals.length); const approval: ApprovalRequest = { id, operationId: input.operationId, actor: financeActor().name, reason: input.reason, scope: input.scope, amountCents: input.amountCents, version: input.version, status: "solicitada", requestedAt: FINANCE_NOW }
  state.approvals.push(approval); if (!internal) emitFinance(); return result(false, "approval_required", "APPROVAL_REQUIRED · La aprobación sólo habilita revalidar; no ejecuta la operación.", input.operationId, id)
}

export function resolveApproval(id: string, approve: boolean): FinanceResult {
  if (!can("finance.approve_exception")) return result(false, "rejected", "PERMISSION_DENIED · Sólo una autoridad puede resolver.")
  const state = financeState(); const approval = state.approvals.find((entry) => entry.id === id)
  if (!approval || approval.status !== "solicitada") return result(false, "conflict", "La solicitud ya no está vigente.")
  approval.status = approve ? "aprobada" : "rechazada"; approval.resolvedAt = FINANCE_NOW; approval.resolvedBy = financeActor().name; emitFinance()
  return result(true, "confirmed", approve ? "Aprobación específica concedida; la operación debe revalidarse." : "Solicitud rechazada.", approval.operationId, id)
}

export function upsertCategory(input: { operationId: string; id?: string; name: string; active: boolean }): FinanceResult {
  if (!can("finance.manage_categories")) return result(false, "rejected", "PERMISSION_DENIED", input.operationId)
  const state = financeState(); if (!input.name.trim()) return result(false, "rejected", "Ingresá un nombre.", input.operationId)
  let category: FinanceCategory | undefined = input.id ? state.categories.find((entry) => entry.id === input.id) : undefined
  if (category) { category.name = input.name; category.active = input.active } else { category = { id: uid("CAT", state.categories.length), name: input.name, active: input.active }; state.categories.push(category) }
  emitFinance(); return result(true, "confirmed", "Categoría actualizada; los movimientos históricos conservaron su naturaleza.", input.operationId, category.id)
}

export function generateRecurringInstance(input: { operationId: string; ruleId: string; period: string }): FinanceResult {
  const state = financeState(); const rule = state.recurringRules.find((entry) => entry.id === input.ruleId)
  if (!rule || rule.status !== "activa") return result(false, "rejected", "Regla inexistente o pausada.", input.operationId)
  const existing = state.recurringInstances.find((entry) => entry.ruleId === rule.id && entry.period === input.period)
  if (existing) return result(true, "duplicate", "DUPLICATE · La instancia del período ya existe.", input.operationId, existing.id)
  const id = uid("REC-I", state.recurringInstances.length); state.recurringInstances.push({ id, ruleId: rule.id, period: input.period, date: FINANCE_NOW }); rule.generatedPeriods.push(input.period); rule.version += 1; emitFinance()
  return result(true, "confirmed", "Instancia única creada para el período.", input.operationId, id)
}

export function createRecurringRule(input: { operationId: string; concept: string; categoryId: string; frequency: "semanal" | "mensual"; amountCents?: number; supplier?: string }): FinanceResult {
  const denied = authorize("finance.create_expense", input.operationId); if (denied) return denied
  const state = financeState(); if (!input.concept.trim() || (input.amountCents !== undefined && !validCents(input.amountCents))) return result(false, "rejected", "Concepto o importe inválido.", input.operationId)
  const id = uid("REC-R", state.recurringRules.length); state.recurringRules.push({ id, concept: input.concept, categoryId: input.categoryId, frequency: input.frequency, startDate: FINANCE_TODAY, amountCents: input.amountCents, amountKnown: input.amountCents !== undefined, supplier: input.supplier, status: "activa", generatedPeriods: [], version: 1 }); emitFinance()
  return result(true, "confirmed", "Regla recurrente creada; no se fingió procesamiento en servidor.", input.operationId, id)
}

export function registerMinimalClient(name: string, phone?: string) {
  return registrarCliente({ nombre: name, telefono: phone })
}

export function inspectUnknown(operationId: string): FinanceResult {
  const state = financeState(); const movement = state.movements.find((entry) => entry.operationId === operationId)
  if (movement) return result(true, "confirmed", "El ledger contiene la operación; se abrió su resultado existente.", operationId, movement.id)
  const attempt = state.attempts.find((entry) => entry.id === operationId)
  return result(false, attempt?.status === "incierto" ? "unknown" : "rejected", attempt?.status === "incierto" ? "UNKNOWN · Aún no hay evidencia de ejecución; no se emitió otro ID." : "Intento inexistente.", operationId)
}

export function resetFinanceOperationsForTests() {
  financeState().attempts.length = financeState().attempts.length
  emitFinance()
}

