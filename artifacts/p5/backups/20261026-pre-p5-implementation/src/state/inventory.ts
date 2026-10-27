import { CLIENTES, todasLasAtenciones } from "./agenda"
import { listStaff } from "./staff"

export const INVENTORY_NOW = "2026-10-24T14:00:00-03:00"
export type Usage = "sale" | "internal"
export type Condition = "fit" | "quarantine"
export type MovementType = "opening" | "receipt" | "consumption" | "delivery" | "transfer" | "count" | "quarantine" | "recovery" | "discard" | "return" | "correction"
export type OrderStatus = "received" | "preparing" | "ready" | "incident" | "delivered" | "cancelled"

export type Category = { id: string; name: string }
export type Location = {
  id: string
  name: string
  kind: "warehouse" | "counter" | "kit"
  staffId?: string
  active: boolean
}
export type Article = {
  id: string
  name: string
  sku?: string
  categoryId: string
  unit: string
  usages: Usage[]
  priceCents?: number
  published: boolean
  minimumSale: number
  minimumInternal: number
  active: boolean
  image?: string
}
export type ArticleAllocation = {
  articleId: string
  locationId: string
  usage: Usage
  quantity: number
}
export type StockMovement = {
  id: string
  operationId: string
  type: MovementType
  articleId: string
  quantity: number
  condition: Condition
  fromLocationId?: string
  toLocationId?: string
  date: string
  actor: string
  reason: string
  relatedId?: string
  correctionOf?: string
}
export type StockCommitment = {
  id: string
  orderId: string
  lineId: string
  articleId: string
  locationId: string
  quantity: number
  status: "active" | "released" | "consumed" | "pending"
  date: string
}
export type Supplier = { id: string; name: string }
export type PurchaseLine = {
  id: string
  articleId: string
  quantity: number
  unitCostCents: number
}
export type Purchase = {
  id: string
  supplierId: string
  document: string
  lines: PurchaseLine[]
  totalCents: number
  status: "pending" | "paid"
  obligationId?: string
}
export type ReceiptLine = {
  id: string
  articleId: string
  quantity: number
  locationId: string
  condition: Condition
}
export type Receipt = {
  id: string
  operationId: string
  supplierId?: string
  document?: string
  lines: ReceiptLine[]
  purchaseId?: string
  date: string
}
export type Consumption = {
  id: string
  movementId: string
  articleId: string
  quantity: number
  locationId: string
  staffId?: string
  attentionId?: string
  reason: string
}
export type StockCount = {
  id: string
  articleId: string
  locationId: string
  condition: Condition
  recorded: number
  counted: number
  adjustmentMovementId?: string
}
export type OrderLine = {
  id: string
  articleId: string
  quantity: number
  unitPriceCents: number
}
export type Order = {
  id: string
  number: string
  clientId: string
  date: string
  status: OrderStatus
  lines: OrderLine[]
  preparedLocationId?: string
  paymentStatus: "pending" | "partial" | "paid"
}
export type Payment = {
  id: string
  operationId: string
  orderId: string
  amountCents: number
  method: "cash" | "transfer"
  date: string
  cashSessionId?: string
}
export type Delivery = {
  id: string
  operationId: string
  orderId: string
  date: string
  movementIds: string[]
}
export type Sale = {
  id: string
  clientId: string
  date: string
  lines: OrderLine[]
  paidCents: number
  status: "pending_delivery" | "delivered" | "corrected"
  deliveryId?: string
}
export type Return = {
  id: string
  operationId: string
  orderId?: string
  purchaseId?: string
  articleId: string
  quantity: number
  condition: Condition | "discarded"
  locationId: string
  date: string
}
export type FinancialObligation = {
  id: string
  originId: string
  kind: "purchase" | "refund"
  totalCents: number
  paidCents: number
  status: "pending" | "paid"
}
export type AuditEvent = {
  id: string
  operationId: string
  type: string
  result: "success" | "rejected" | "duplicate" | "unknown"
  date: string
  detail: string
}
export type OperationResult = {
  ok: boolean
  duplicate?: boolean
  reason?: string
  id?: string
}

type InventoryState = {
  articles: Article[]
  categories: Category[]
  locations: Location[]
  allocations: ArticleAllocation[]
  movements: StockMovement[]
  commitments: StockCommitment[]
  suppliers: Supplier[]
  purchases: Purchase[]
  receipts: Receipt[]
  consumptions: Consumption[]
  counts: StockCount[]
  orders: Order[]
  payments: Payment[]
  deliveries: Delivery[]
  sales: Sale[]
  returns: Return[]
  obligations: FinancialObligation[]
  audits: AuditEvent[]
  operationIds: string[]
  cashSession: { id: string; status: "open" | "closed"; openedAt: string }
}

const categories: Category[] = [
  { id: "CAT-STYLING", name: "Styling" },
  { id: "CAT-HAIR", name: "Cabello" },
  { id: "CAT-BEARD", name: "Barba" },
  { id: "CAT-HYGIENE", name: "Higiene" },
]
const staff = listStaff()
const staffId = (fragment: string) =>
  staff.find((x) => x.name.includes(fragment))?.id ?? `missing-${fragment}`
const locations: Location[] = [
  { id: "LOC-DEP", name: "Depósito", kind: "warehouse", active: true },
  { id: "LOC-MOS", name: "Mostrador", kind: "counter", active: true },
  {
    id: "LOC-ALEX",
    name: "Kit de Alex",
    kind: "kit",
    staffId: staffId("Alex"),
    active: true,
  },
  {
    id: "LOC-NICO",
    name: "Kit de Nicolás",
    kind: "kit",
    staffId: staffId("Nicolás"),
    active: true,
  },
  {
    id: "LOC-LEO",
    name: "Kit de Leo",
    kind: "kit",
    staffId: staffId("Leo"),
    active: true,
  },
]
const articles: Article[] = [
  {
    id: "ART-CERA",
    name: "Cera modeladora",
    sku: "CER-001",
    categoryId: "CAT-STYLING",
    unit: "unidad",
    usages: ["sale"],
    priceCents: 1200000,
    published: true,
    minimumSale: 5,
    minimumInternal: 0,
    active: true,
  },
  {
    id: "ART-SHAMPOO",
    name: "Shampoo profesional",
    sku: "SHA-001",
    categoryId: "CAT-HAIR",
    unit: "envase",
    usages: ["sale", "internal"],
    priceCents: 1800000,
    published: true,
    minimumSale: 3,
    minimumInternal: 1,
    active: true,
  },
  {
    id: "ART-ACEITE",
    name: "Aceite para barba",
    sku: "ACE-001",
    categoryId: "CAT-BEARD",
    unit: "unidad",
    usages: ["sale"],
    priceCents: 1200000,
    published: true,
    minimumSale: 4,
    minimumInternal: 0,
    active: true,
  },
  {
    id: "ART-HOJAS",
    name: "Hojas descartables",
    sku: "HOJ-001",
    categoryId: "CAT-HYGIENE",
    unit: "unidad",
    usages: ["internal"],
    published: false,
    minimumSale: 0,
    minimumInternal: 30,
    active: true,
  },
  {
    id: "ART-CUELLOS",
    name: "Cuellos descartables",
    sku: "CUE-001",
    categoryId: "CAT-HYGIENE",
    unit: "unidad",
    usages: ["internal"],
    published: false,
    minimumSale: 0,
    minimumInternal: 25,
    active: true,
  },
  {
    id: "ART-DESINF",
    name: "Desinfectante",
    sku: "DES-001",
    categoryId: "CAT-HYGIENE",
    unit: "envase",
    usages: ["internal"],
    published: false,
    minimumSale: 0,
    minimumInternal: 10,
    active: true,
  },
]
let seq = 100
const m = (
  id: string,
  operationId: string,
  type: MovementType,
  articleId: string,
  quantity: number,
  toLocationId: string | undefined,
  fromLocationId: string | undefined,
  condition: Condition,
  reason: string,
  relatedId?: string,
): StockMovement => ({
  id,
  operationId,
  type,
  articleId,
  quantity,
  toLocationId,
  fromLocationId,
  condition,
  reason,
  relatedId,
  actor: "Dueño YoungKingZ",
  date: INVENTORY_NOW,
})
const seedMovements: StockMovement[] = [
  m(
    "MOV-001",
    "seed-cera",
    "opening",
    "ART-CERA",
    7,
    "LOC-DEP",
    undefined,
    "fit",
    "Apertura",
  ),
  m(
    "MOV-002",
    "seed-cera-q",
    "quarantine",
    "ART-CERA",
    1,
    undefined,
    "LOC-DEP",
    "fit",
    "Unidad en revisión",
  ),
  m(
    "MOV-003",
    "seed-cera-q",
    "quarantine",
    "ART-CERA",
    1,
    "LOC-DEP",
    undefined,
    "quarantine",
    "Unidad en revisión",
  ),
  m(
    "MOV-004",
    "seed-cera-t",
    "transfer",
    "ART-CERA",
    2,
    "LOC-MOS",
    "LOC-DEP",
    "fit",
    "Preparación inicial",
  ),
  m(
    "MOV-005",
    "seed-shampoo",
    "receipt",
    "ART-SHAMPOO",
    10,
    "LOC-DEP",
    undefined,
    "fit",
    "Recepción COMP-901",
    "REC-901",
  ),
  m(
    "MOV-006",
    "seed-oil",
    "opening",
    "ART-ACEITE",
    12,
    "LOC-DEP",
    undefined,
    "fit",
    "Apertura",
  ),
  m(
    "MOV-007",
    "seed-return",
    "return",
    "ART-ACEITE",
    1,
    "LOC-DEP",
    undefined,
    "fit",
    "Devolución histórica",
    "RET-001",
  ),
  m(
    "MOV-008",
    "seed-hojas",
    "opening",
    "ART-HOJAS",
    90,
    "LOC-DEP",
    undefined,
    "fit",
    "Apertura",
  ),
  m(
    "MOV-009",
    "seed-ha",
    "transfer",
    "ART-HOJAS",
    14,
    "LOC-ALEX",
    "LOC-DEP",
    "fit",
    "Asignación a kit",
  ),
  m(
    "MOV-010",
    "seed-hn",
    "transfer",
    "ART-HOJAS",
    12,
    "LOC-NICO",
    "LOC-DEP",
    "fit",
    "Asignación a kit",
  ),
  m(
    "MOV-011",
    "seed-hl",
    "transfer",
    "ART-HOJAS",
    8,
    "LOC-LEO",
    "LOC-DEP",
    "fit",
    "Asignación a kit",
  ),
  m(
    "MOV-012",
    "seed-hc",
    "consumption",
    "ART-HOJAS",
    6,
    undefined,
    "LOC-DEP",
    "fit",
    "Consumo general",
  ),
  m(
    "MOV-013",
    "seed-cuellos",
    "opening",
    "ART-CUELLOS",
    90,
    "LOC-DEP",
    undefined,
    "fit",
    "Apertura",
  ),
  m(
    "MOV-014",
    "seed-cc",
    "consumption",
    "ART-CUELLOS",
    5,
    undefined,
    "LOC-DEP",
    "fit",
    "Consumo profesional",
  ),
  m(
    "MOV-015",
    "seed-count",
    "count",
    "ART-CUELLOS",
    1,
    "LOC-DEP",
    undefined,
    "fit",
    "Diferencia de recuento regularizada",
  ),
  m(
    "MOV-016",
    "seed-des",
    "opening",
    "ART-DESINF",
    5,
    "LOC-DEP",
    undefined,
    "fit",
    "Apertura",
  ),
  m(
    "MOV-017",
    "seed-dc",
    "consumption",
    "ART-DESINF",
    1,
    undefined,
    "LOC-DEP",
    "fit",
    "Limpieza general",
  ),
]
const allocations: ArticleAllocation[] = [
  { articleId: "ART-CERA", locationId: "LOC-DEP", usage: "sale", quantity: 4 },
  { articleId: "ART-CERA", locationId: "LOC-MOS", usage: "sale", quantity: 2 },
  {
    articleId: "ART-SHAMPOO",
    locationId: "LOC-DEP",
    usage: "sale",
    quantity: 8,
  },
  {
    articleId: "ART-SHAMPOO",
    locationId: "LOC-DEP",
    usage: "internal",
    quantity: 2,
  },
  {
    articleId: "ART-ACEITE",
    locationId: "LOC-DEP",
    usage: "sale",
    quantity: 13,
  },
  {
    articleId: "ART-HOJAS",
    locationId: "LOC-DEP",
    usage: "internal",
    quantity: 50,
  },
  {
    articleId: "ART-HOJAS",
    locationId: "LOC-ALEX",
    usage: "internal",
    quantity: 14,
  },
  {
    articleId: "ART-HOJAS",
    locationId: "LOC-NICO",
    usage: "internal",
    quantity: 12,
  },
  {
    articleId: "ART-HOJAS",
    locationId: "LOC-LEO",
    usage: "internal",
    quantity: 8,
  },
  {
    articleId: "ART-CUELLOS",
    locationId: "LOC-DEP",
    usage: "internal",
    quantity: 86,
  },
  {
    articleId: "ART-DESINF",
    locationId: "LOC-DEP",
    usage: "internal",
    quantity: 4,
  },
]
const orders: Order[] = [
  {
    id: "ORD-1042",
    number: "#1042",
    clientId:
      CLIENTES.find((x) => x.nombre === "Juan Pérez")?.id ?? CLIENTES[0].id,
    date: INVENTORY_NOW,
    status: "received",
    paymentStatus: "pending",
    lines: [
      {
        id: "OL-1042-1",
        articleId: "ART-CERA",
        quantity: 2,
        unitPriceCents: 1200000,
      },
      {
        id: "OL-1042-2",
        articleId: "ART-ACEITE",
        quantity: 1,
        unitPriceCents: 1200000,
      },
    ],
  },
  {
    id: "ORD-1040",
    number: "#1040",
    clientId:
      CLIENTES.find((x) => x.nombre === "Martín Gómez")?.id ?? CLIENTES[1].id,
    date: INVENTORY_NOW,
    status: "ready",
    preparedLocationId: "LOC-MOS",
    paymentStatus: "pending",
    lines: [
      {
        id: "OL-1040-1",
        articleId: "ART-CERA",
        quantity: 2,
        unitPriceCents: 1200000,
      },
      {
        id: "OL-1040-2",
        articleId: "ART-SHAMPOO",
        quantity: 1,
        unitPriceCents: 1800000,
      },
    ],
  },
]
const commitments: StockCommitment[] = [
  {
    id: "COM-1",
    orderId: "ORD-1042",
    lineId: "OL-1042-1",
    articleId: "ART-CERA",
    locationId: "LOC-DEP",
    quantity: 2,
    status: "active",
    date: INVENTORY_NOW,
  },
  {
    id: "COM-2",
    orderId: "ORD-1042",
    lineId: "OL-1042-2",
    articleId: "ART-ACEITE",
    locationId: "LOC-DEP",
    quantity: 1,
    status: "active",
    date: INVENTORY_NOW,
  },
  {
    id: "COM-3",
    orderId: "ORD-1040",
    lineId: "OL-1040-1",
    articleId: "ART-CERA",
    locationId: "LOC-MOS",
    quantity: 2,
    status: "active",
    date: INVENTORY_NOW,
  },
  {
    id: "COM-4",
    orderId: "ORD-1040",
    lineId: "OL-1040-2",
    articleId: "ART-SHAMPOO",
    locationId: "LOC-DEP",
    quantity: 1,
    status: "active",
    date: INVENTORY_NOW,
  },
]

function initialState(): InventoryState {
  return {
    articles: structuredClone(articles),
    categories: structuredClone(categories),
    locations: structuredClone(locations),
    allocations: structuredClone(allocations),
    movements: structuredClone(seedMovements),
    commitments: structuredClone(commitments),
    suppliers: [{ id: "SUP-1", name: "Distribuidora Norte" }],
    purchases: [
      {
        id: "PUR-901",
        supplierId: "SUP-1",
        document: "FC-A-901",
        lines: [
          {
            id: "PL-1",
            articleId: "ART-SHAMPOO",
            quantity: 10,
            unitCostCents: 900000,
          },
        ],
        totalCents: 9000000,
        status: "pending",
        obligationId: "OBL-901",
      },
    ],
    receipts: [
      {
        id: "REC-901",
        operationId: "seed-shampoo",
        supplierId: "SUP-1",
        document: "REM-901",
        purchaseId: "PUR-901",
        date: INVENTORY_NOW,
        lines: [
          {
            id: "RL-1",
            articleId: "ART-SHAMPOO",
            quantity: 10,
            locationId: "LOC-DEP",
            condition: "fit",
          },
        ],
      },
    ],
    consumptions: [
      {
        id: "CON-1",
        movementId: "MOV-014",
        articleId: "ART-CUELLOS",
        quantity: 5,
        locationId: "LOC-DEP",
        staffId: staffId("Alex"),
        attentionId: todasLasAtenciones()[0]?.id,
        reason: "Servicio",
      },
      {
        id: "CON-2",
        movementId: "MOV-012",
        articleId: "ART-HOJAS",
        quantity: 6,
        locationId: "LOC-DEP",
        reason: "Consumo general",
      },
    ],
    counts: [
      {
        id: "COUNT-1",
        articleId: "ART-CUELLOS",
        locationId: "LOC-DEP",
        condition: "fit",
        recorded: 85,
        counted: 86,
        adjustmentMovementId: "MOV-015",
      },
    ],
    orders: structuredClone(orders),
    payments: [],
    deliveries: [],
    sales: [
      {
        id: "VP-208",
        clientId: CLIENTES[0].id,
        date: INVENTORY_NOW,
        lines: [{ id: "VPL-208-1", articleId: "ART-ACEITE", quantity: 1, unitPriceCents: 1200000 }],
        paidCents: 1200000,
        status: "pending_delivery",
      },
    ],
    returns: [
      {
        id: "RET-001",
        operationId: "seed-return",
        orderId: "ORD-HIST",
        articleId: "ART-ACEITE",
        quantity: 1,
        condition: "fit",
        locationId: "LOC-DEP",
        date: INVENTORY_NOW,
      },
    ],
    obligations: [
      {
        id: "OBL-901",
        originId: "PUR-901",
        kind: "purchase",
        totalCents: 9000000,
        paidCents: 0,
        status: "pending",
      },
    ],
    audits: [],
    operationIds: seedMovements.map((x) => x.operationId),
    cashSession: {
      id: "CASH-20261024",
      status: "open",
      openedAt: "2026-10-24T09:00:00-03:00",
    },
  }
}
let state = initialState()
const listeners = new Set<() => void>()
export const inventoryStore = {
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getSnapshot() {
    return state
  },
  reset() {
    state = initialState()
    emit()
  },
}
function emit() {
  listeners.forEach((fn) => fn())
}
const nextId = (prefix: string) => `${prefix}-${++seq}`
function reject(operationId: string, reason: string): OperationResult {
  state.audits.push({
    id: nextId("AUD"),
    operationId,
    type: "operation",
    result: "rejected",
    date: INVENTORY_NOW,
    detail: reason,
  })
  emit()
  return { ok: false, reason }
}
function begin(operationId: string): OperationResult | undefined {
  if (!operationId) return reject("missing", "Falta operation_id")
  if (state.operationIds.includes(operationId)) {
    state.audits.push({
      id: nextId("AUD"),
      operationId,
      type: "operation",
      result: "duplicate",
      date: INVENTORY_NOW,
      detail: "Operación ya registrada",
    })
    emit()
    return {
      ok: false,
      duplicate: true,
      reason: "Esta operación ya fue registrada",
    }
  }
}
function commit(
  operationId: string,
  type: string,
  detail: string,
  id?: string,
): OperationResult {
  state.operationIds.push(operationId)
  state.audits.push({
    id: nextId("AUD"),
    operationId,
    type,
    result: "success",
    date: INVENTORY_NOW,
    detail,
  })
  emit()
  return { ok: true, id }
}
export function money(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
export function articleById(id: string) {
  return state.articles.find((x) => x.id === id)
}
export function locationById(id: string) {
  return state.locations.find((x) => x.id === id)
}
export function orderById(id: string) {
  return state.orders.find((x) => x.id === id)
}
export function clientName(id: string) {
  return CLIENTES.find((x) => x.id === id)?.nombre ?? "Cliente"
}
export function physicalAt(
  articleId: string,
  locationId?: string,
  condition?: Condition,
) {
  return state.movements
    .filter(
      (x) =>
        x.articleId === articleId && (!condition || x.condition === condition),
    )
    .reduce(
      (sum, x) =>
        sum +
        (x.toLocationId && (!locationId || x.toLocationId === locationId)
          ? x.quantity
          : 0) -
        (x.fromLocationId && (!locationId || x.fromLocationId === locationId)
          ? x.quantity
          : 0),
      0,
    )
}
export function physicalTotal(articleId: string) {
  return physicalAt(articleId)
}
export function fitStock(articleId: string, locationId?: string) {
  return physicalAt(articleId, locationId, "fit")
}
export function quarantineStock(articleId: string, locationId?: string) {
  return physicalAt(articleId, locationId, "quarantine")
}
export function committed(articleId: string, locationId?: string) {
  return state.commitments
    .filter(
      (x) =>
        x.articleId === articleId &&
        x.status === "active" &&
        (!locationId || x.locationId === locationId),
    )
    .reduce((n, x) => n + x.quantity, 0)
}
export function allocated(articleId: string, usage: Usage) {
  return state.allocations
    .filter((x) => x.articleId === articleId && x.usage === usage)
    .reduce((n, x) => n + x.quantity, 0)
}
export function available(articleId: string, usage: Usage) {
  const base = Math.min(fitStock(articleId), allocated(articleId, usage))
  return Math.max(0, base - (usage === "sale" ? committed(articleId) : 0))
}
export function stockRows(articleId: string) {
  return state.locations
    .map((location) => ({
      location,
      fit: fitStock(articleId, location.id),
      quarantine: quarantineStock(articleId, location.id),
      committed: committed(articleId, location.id),
    }))
    .filter((x) => x.fit || x.quarantine || x.committed)
}
export function orderTotal(order: Order) {
  return order.lines.reduce((n, x) => n + x.quantity * x.unitPriceCents, 0)
}
export function paidForOrder(orderId: string) {
  return state.payments
    .filter((x) => x.orderId === orderId)
    .reduce((n, x) => n + x.amountCents, 0)
}
export function belowMinimum(article: Article, usage: Usage) {
  const min = usage === "sale" ? article.minimumSale : article.minimumInternal
  return min > 0 && available(article.id, usage) < min
}

export function createArticle(
  input: {
    name: string
    sku?: string
    categoryId: string
    unit: string
    usages: Usage[]
    priceCents?: number
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (
    !input.name.trim() ||
    !input.categoryId ||
    !input.unit ||
    !input.usages.length
  )
    return reject(operationId, "Completá los campos obligatorios")
  if (
    input.sku &&
    state.articles.some(
      (x) => x.sku?.toLowerCase() === input.sku?.toLowerCase(),
    )
  )
    return reject(operationId, "El SKU ya existe; abrí el artículo existente")
  if (
    input.usages.includes("sale") &&
    (!input.priceCents || input.priceCents <= 0)
  )
    return reject(operationId, "Ingresá un precio de venta válido")
  const similar = state.articles.find(
    (x) =>
      x.name.localeCompare(input.name, "es", { sensitivity: "base" }) === 0,
  )
  if (similar)
    return reject(
      operationId,
      `Ya existe ${similar.name}; habilitá el otro destino sin duplicarlo`,
    )
  const item: Article = {
    id: nextId("ART"),
    ...input,
    sku: input.sku || undefined,
    published: false,
    minimumSale: 0,
    minimumInternal: 0,
    active: true,
  }
  state.articles.push(item)
  return commit(
    operationId,
    "article.create",
    `Artículo ${item.name} creado con stock cero`,
    item.id,
  )
}
export function receive(
  lines: Array<Omit<ReceiptLine, "id"> & { id?: string }>,
  meta: { supplierId?: string; document?: string; purchaseId?: string },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (
    !lines.length ||
    lines.some(
      (x) =>
        !Number.isSafeInteger(x.quantity) ||
        x.quantity <= 0 ||
        !articleById(x.articleId) ||
        !locationById(x.locationId),
    )
  )
    return reject(operationId, "Revisá artículos, cantidades y destinos")
  if (meta.document && state.receipts.some((x) => x.document === meta.document))
    return reject(operationId, "El documento ya fue recibido")
  const receiptId = nextId("REC")
  const moves = lines.map((line) =>
    m(
      nextId("MOV"),
      operationId,
      "receipt",
      line.articleId,
      line.quantity,
      line.locationId,
      undefined,
      line.condition,
      "Recepción de mercadería",
      receiptId,
    ),
  )
  state.movements.push(...moves)
  state.receipts.push({
    id: receiptId,
    operationId,
    date: INVENTORY_NOW,
    lines: lines.map((line, index) => ({
      ...line,
      id: line.id ?? `${receiptId}-L${index + 1}`,
    })),
    ...meta,
  })
  lines
    .filter((x) => x.condition === "fit")
    .forEach((x) => {
      const article = articleById(x.articleId)!
      const usage = article.usages[0]
      const alloc = state.allocations.find(
        (a) =>
          a.articleId === x.articleId &&
          a.locationId === x.locationId &&
          a.usage === usage,
      )
      if (alloc) alloc.quantity += x.quantity
      else
        state.allocations.push({
          articleId: x.articleId,
          locationId: x.locationId,
          usage,
          quantity: x.quantity,
        })
    })
  return commit(
    operationId,
    "receipt",
    `${lines.length} línea(s) recibidas`,
    receiptId,
  )
}
export function consume(
  input: {
    articleId: string
    quantity: number
    locationId: string
    staffId?: string
    attentionId?: string
    reason: string
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0)
    return reject(operationId, "Ingresá una cantidad positiva")
  if (
    fitStock(input.articleId, input.locationId) -
      committed(input.articleId, input.locationId) <
    input.quantity
  )
    return reject(operationId, "No hay stock apto no comprometido suficiente")
  const movement = m(
    nextId("MOV"),
    operationId,
    "consumption",
    input.articleId,
    input.quantity,
    undefined,
    input.locationId,
    "fit",
    input.reason || "Consumo",
    input.attentionId,
  )
  state.movements.push(movement)
  const alloc = state.allocations.find(
    (x) =>
      x.articleId === input.articleId &&
      x.locationId === input.locationId &&
      x.usage === "internal",
  )
  if (alloc) alloc.quantity = Math.max(0, alloc.quantity - input.quantity)
  const id = nextId("CON")
  state.consumptions.push({ id, movementId: movement.id, ...input })
  return commit(
    operationId,
    "consumption",
    "Consumo registrado sin hecho financiero",
    id,
  )
}
export function transfer(
  input: {
    articleId: string
    quantity: number
    from: string
    to: string
    condition?: Condition
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const condition = input.condition ?? "fit"
  if (input.from === input.to)
    return reject(operationId, "Origen y destino deben ser diferentes")
  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity <= 0 ||
    physicalAt(input.articleId, input.from, condition) -
      (condition === "fit" ? committed(input.articleId, input.from) : 0) <
      input.quantity
  )
    return reject(operationId, "Cantidad no trasladable")
  state.movements.push(
    m(
      nextId("MOV"),
      operationId,
      "transfer",
      input.articleId,
      input.quantity,
      input.to,
      input.from,
      condition,
      "Traslado",
    ),
  )
  state.allocations
    .filter(
      (x) => x.articleId === input.articleId && x.locationId === input.from,
    )
    .forEach((x) => {
      const q = Math.min(x.quantity, input.quantity)
      x.quantity -= q
      const dest = state.allocations.find(
        (a) =>
          a.articleId === x.articleId &&
          a.locationId === input.to &&
          a.usage === x.usage,
      )
      if (dest) dest.quantity += q
      else state.allocations.push({ ...x, locationId: input.to, quantity: q })
    })
  return commit(
    operationId,
    "transfer",
    "Traslado confirmado; físico global conservado",
  )
}
export function recount(
  input: {
    articleId: string
    locationId: string
    condition: Condition
    counted: number
    reason: string
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (!Number.isSafeInteger(input.counted) || input.counted < 0)
    return reject(operationId, "La cantidad contada no es válida")
  const recorded = physicalAt(
    input.articleId,
    input.locationId,
    input.condition,
  )
  const delta = input.counted - recorded
  if (
    delta < 0 &&
    input.condition === "fit" &&
    input.counted < committed(input.articleId, input.locationId)
  )
    return reject(
      operationId,
      "La diferencia afecta stock comprometido; resolvé el faltante",
    )
  let moveId: string | undefined
  if (delta !== 0) {
    const movement = m(
      nextId("MOV"),
      operationId,
      "count",
      input.articleId,
      Math.abs(delta),
      delta > 0 ? input.locationId : undefined,
      delta < 0 ? input.locationId : undefined,
      input.condition,
      input.reason || "Ajuste por recuento",
    )
    moveId = movement.id
    state.movements.push(movement)
  }
  const id = nextId("COUNT")
  state.counts.push({
    id,
    articleId: input.articleId,
    locationId: input.locationId,
    condition: input.condition,
    recorded,
    counted: input.counted,
    adjustmentMovementId: moveId,
  })
  return commit(
    operationId,
    "count",
    `Recuento confirmado; diferencia ${delta}`,
    id,
  )
}
export function loss(
  input: {
    articleId: string
    locationId: string
    quantity: number
    destination: "quarantine" | "discard"
    reason: string
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (
    input.quantity <= 0 ||
    fitStock(input.articleId, input.locationId) -
      committed(input.articleId, input.locationId) <
      input.quantity
  )
    return reject(
      operationId,
      "La cantidad afecta stock inexistente o comprometido",
    )
  state.movements.push(
    m(
      nextId("MOV"),
      operationId,
      input.destination === "discard" ? "discard" : "quarantine",
      input.articleId,
      input.quantity,
      undefined,
      input.locationId,
      "fit",
      input.reason,
    ),
  )
  if (input.destination === "quarantine")
    state.movements.push(
      m(
        nextId("MOV"),
        operationId,
        "quarantine",
        input.articleId,
        input.quantity,
        input.locationId,
        undefined,
        "quarantine",
        input.reason,
      ),
    )
  return commit(
    operationId,
    "loss",
    input.destination === "discard"
      ? "Descarte registrado"
      : "Stock movido a cuarentena",
  )
}
export function inspect(
  input: {
    articleId: string
    locationId: string
    quantity: number
    decision: "recover" | "discard" | "keep"
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (
    input.quantity <= 0 ||
    quarantineStock(input.articleId, input.locationId) < input.quantity
  )
    return reject(operationId, "La cantidad supera el stock en cuarentena")
  if (input.decision !== "keep") {
    state.movements.push(
      m(
        nextId("MOV"),
        operationId,
        input.decision === "recover" ? "recovery" : "discard",
        input.articleId,
        input.quantity,
        undefined,
        input.locationId,
        "quarantine",
        "Inspección de cuarentena",
      ),
    )
    if (input.decision === "recover")
      state.movements.push(
        m(
          nextId("MOV"),
          operationId,
          "recovery",
          input.articleId,
          input.quantity,
          input.locationId,
          undefined,
          "fit",
          "Recuperado como apto",
        ),
      )
  }
  return commit(operationId, "quarantine.inspect", "Inspección registrada")
}
export function setAllocation(
  articleId: string,
  sale: number,
  internal: number,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  if (
    sale < 0 ||
    internal < 0 ||
    sale + internal > fitStock(articleId) ||
    sale < committed(articleId)
  )
    return reject(
      operationId,
      "Las asignaciones exceden el físico apto o dejan compromisos sin respaldo",
    )
  state.allocations = state.allocations.filter((x) => x.articleId !== articleId)
  const locationId = stockRows(articleId)[0]?.location.id ?? "LOC-DEP"
  if (sale)
    state.allocations.push({
      articleId,
      locationId,
      usage: "sale",
      quantity: sale,
    })
  if (internal)
    state.allocations.push({
      articleId,
      locationId,
      usage: "internal",
      quantity: internal,
    })
  const article = articleById(articleId)!
  article.usages = [
    ...(sale ? ["sale" as const] : []),
    ...(internal ? ["internal" as const] : []),
  ]
  return commit(
    operationId,
    "allocation",
    "Destino de uso actualizado sin crear stock",
  )
}
export function payOrder(
  orderId: string,
  amountCents: number,
  method: "cash" | "transfer",
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(orderId)
  if (!order) return reject(operationId, "Pedido inexistente")
  const due = orderTotal(order) - paidForOrder(orderId)
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    amountCents > due
  )
    return reject(
      operationId,
      "El importe debe ser positivo y no superar el saldo",
    )
  if (method === "cash" && state.cashSession.status !== "open")
    return reject(operationId, "No hay una sesión de Caja abierta")
  const id = nextId("PAY")
  state.payments.push({
    id,
    operationId,
    orderId,
    amountCents,
    method,
    date: INVENTORY_NOW,
    cashSessionId: method === "cash" ? state.cashSession.id : undefined,
  })
  const remaining = due - amountCents
  order.paymentStatus = remaining === 0 ? "paid" : "partial"
  return commit(
    operationId,
    "payment",
    method === "transfer"
      ? "Transferencia registrada; efectivo sin cambios"
      : "Cobro vinculado a Caja",
    id,
  )
}
export function prepareOrder(
  orderId: string,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(orderId)
  if (!order || !["received", "preparing", "incident"].includes(order.status))
    return reject(operationId, "El pedido no admite preparación")
  const invalid = order.lines.find(
    (line) =>
      committed(line.articleId) < line.quantity ||
      fitStock(line.articleId) < line.quantity,
  )
  if (invalid) {
    order.status = "incident"
    return reject(
      operationId,
      "Hay un faltante comprometido; resolvelo antes de continuar",
    )
  }
  order.status = "ready"
  order.preparedLocationId = order.preparedLocationId ?? "LOC-DEP"
  return commit(
    operationId,
    "order.prepare",
    "Pedido listo; el físico no fue descontado",
    order.id,
  )
}
export function deliverOrder(
  orderId: string,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(orderId)
  if (!order || order.status !== "ready")
    return reject(operationId, "El pedido debe estar Listo")
  if (paidForOrder(orderId) !== orderTotal(order))
    return reject(operationId, "El cobro ordinario debe estar completo")
  const active = state.commitments.filter(
    (x) => x.orderId === orderId && x.status === "active",
  )
  if (
    active.length !== order.lines.length ||
    active.some((x) => fitStock(x.articleId, x.locationId) < x.quantity)
  )
    return reject(operationId, "Los compromisos no tienen respaldo físico")
  const movementIds: string[] = []
  active.forEach((x) => {
    const mv = m(
      nextId("MOV"),
      operationId,
      "delivery",
      x.articleId,
      x.quantity,
      undefined,
      x.locationId,
      "fit",
      `Entrega ${order.number}`,
      order.id,
    )
    state.movements.push(mv)
    movementIds.push(mv.id)
    x.status = "consumed"
  })
  order.status = "delivered"
  const id = nextId("DEL")
  state.deliveries.push({
    id,
    operationId,
    orderId,
    date: INVENTORY_NOW,
    movementIds,
  })
  return commit(operationId, "delivery", "Entrega registrada una sola vez", id)
}
export function cancelOrder(
  orderId: string,
  reason: string,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(orderId)
  if (!order) return reject(operationId, "Pedido inexistente")
  if (order.status === "delivered")
    return reject(
      operationId,
      "Un pedido entregado debe procesarse como devolución",
    )
  if (order.status === "cancelled")
    return reject(operationId, "El pedido ya está cancelado")
  state.commitments
    .filter((x) => x.orderId === orderId && x.status === "active")
    .forEach((x) => (x.status = "released"))
  order.status = "cancelled"
  const paid = paidForOrder(orderId)
  if (paid)
    state.obligations.push({
      id: nextId("OBL"),
      originId: orderId,
      kind: "refund",
      totalCents: paid,
      paidCents: 0,
      status: "pending",
    })
  return commit(
    operationId,
    "order.cancel",
    `Pedido cancelado: ${reason}; físico conservado`,
  )
}
export function customerReturn(
  input: {
    orderId: string
    articleId: string
    quantity: number
    locationId: string
    condition: Condition | "discarded"
  },
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(input.orderId)
  const line = order?.lines.find((x) => x.articleId === input.articleId)
  const prior = state.returns
    .filter(
      (x) => x.orderId === input.orderId && x.articleId === input.articleId,
    )
    .reduce((n, x) => n + x.quantity, 0)
  if (
    !order ||
    order.status !== "delivered" ||
    !line ||
    input.quantity <= 0 ||
    input.quantity + prior > line.quantity
  )
    return reject(operationId, "La devolución supera lo entregado neto")
  const id = nextId("RET")
  if (input.condition !== "discarded")
    state.movements.push(
      m(
        nextId("MOV"),
        operationId,
        "return",
        input.articleId,
        input.quantity,
        input.locationId,
        undefined,
        input.condition,
        "Devolución de cliente",
        id,
      ),
    )
  state.returns.push({ id, operationId, ...input, date: INVENTORY_NOW })
  return commit(
    operationId,
    "return.customer",
    input.condition === "fit"
      ? "Devolución apta ingresada"
      : "Devolución no apta registrada",
    id,
  )
}
export function deactivateArticle(
  articleId: string,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const item = articleById(articleId)
  if (!item) return reject(operationId, "Artículo inexistente")
  item.active = false
  item.published = false
  return commit(
    operationId,
    "article.deactivate",
    "Artículo desactivado; historial conservado",
  )
}
export function updateArticle(
  articleId: string,
  changes: Partial<Pick<Article, "name" | "priceCents" | "published" | "minimumSale" | "minimumInternal">>,
  operationId: string,
): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const item = articleById(articleId)
  if (!item) return reject(operationId, "Artículo inexistente")
  Object.assign(item, changes)
  return commit(
    operationId,
    "article.update",
    "Artículo actualizado; snapshots comerciales conservados",
  )
}

export function deliverPendingSale(saleId: string, locationId: string, operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const sale = state.sales.find((entry) => entry.id === saleId)
  if (!sale || sale.status !== "pending_delivery") return reject(operationId, "La venta no tiene una entrega pendiente elegible")
  if (sale.lines.some((line) => fitStock(line.articleId, locationId) - committed(line.articleId, locationId) < line.quantity)) return reject(operationId, "No hay stock apto libre suficiente en la ubicación")
  const movementIds = sale.lines.map((line) => {
    const movement = m(nextId("MOV"), operationId, "delivery", line.articleId, line.quantity, undefined, locationId, "fit", `Entrega presencial ${sale.id}`, sale.id)
    state.movements.push(movement)
    return movement.id
  })
  const deliveryId = nextId("DEL")
  state.deliveries.push({ id: deliveryId, operationId, orderId: sale.id, date: INVENTORY_NOW, movementIds })
  sale.status = "delivered"
  sale.deliveryId = deliveryId
  return commit(operationId, "sale.delivery", "Entrega presencial vinculada a venta y pago existentes", deliveryId)
}

export function returnToSupplier(input: { purchaseId: string; articleId: string; quantity: number; locationId: string; dispatched: boolean }, operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const purchase = state.purchases.find((entry) => entry.id === input.purchaseId)
  const purchased = purchase?.lines.find((line) => line.articleId === input.articleId)?.quantity ?? 0
  const returned = state.returns.filter((entry) => entry.purchaseId === input.purchaseId && entry.articleId === input.articleId).reduce((sum, entry) => sum + entry.quantity, 0)
  if (!purchase || input.quantity <= 0 || input.quantity + returned > purchased) return reject(operationId, "La devolución supera lo recibido de la compra")
  if (!input.dispatched) return commit(operationId, "supplier.return.request", "Solicitud preparada; el físico no cambió")
  if (fitStock(input.articleId, input.locationId) - committed(input.articleId, input.locationId) < input.quantity) return reject(operationId, "No hay stock apto libre suficiente para despachar")
  const id = nextId("RET")
  state.movements.push(m(nextId("MOV"), operationId, "return", input.articleId, input.quantity, undefined, input.locationId, "fit", "Devolución despachada al proveedor", id))
  state.returns.push({ id, operationId, purchaseId: input.purchaseId, articleId: input.articleId, quantity: input.quantity, condition: "discarded", locationId: input.locationId, date: INVENTORY_NOW })
  return commit(operationId, "supplier.return.dispatch", "Despacho físico registrado; crédito comercial pendiente", id)
}

export function registerPurchaseForReceipt(receiptId: string, input: { supplierId: string; document: string; totalCents: number; dueDate?: string }, operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const receipt = state.receipts.find((entry) => entry.id === receiptId)
  if (!receipt) return reject(operationId, "Recepción inexistente")
  if (receipt.purchaseId || state.purchases.some((entry) => entry.document === input.document)) return reject(operationId, "La recepción o el documento ya tiene una compra vinculada")
  if (!Number.isSafeInteger(input.totalCents) || input.totalCents <= 0) return reject(operationId, "Ingresá un total comercial válido")
  const purchaseId = nextId("PUR")
  const obligationId = nextId("OBL")
  state.purchases.push({ id: purchaseId, supplierId: input.supplierId, document: input.document, lines: receipt.lines.map((line, index) => ({ id: `${purchaseId}-L${index + 1}`, articleId: line.articleId, quantity: line.quantity, unitCostCents: 0 })), totalCents: input.totalCents, status: "pending", obligationId })
  state.obligations.push({ id: obligationId, originId: purchaseId, kind: "purchase", totalCents: input.totalCents, paidCents: 0, status: "pending" })
  receipt.purchaseId = purchaseId
  return commit(operationId, "purchase.link", "Compra y obligación vinculadas sin duplicar la recepción física", purchaseId)
}

export function resolveShortage(orderId: string, articleId: string, strategy: "reassign" | "pending" | "adjust", operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const order = orderById(orderId)
  const affected = state.commitments.filter((entry) => entry.orderId === orderId && entry.articleId === articleId && entry.status === "active")
  if (!order || !affected.length) return reject(operationId, "No hay compromisos afectados para resolver")
  const missing = Math.max(0, affected.reduce((sum, entry) => sum + entry.quantity, 0) - fitStock(articleId))
  if (strategy === "reassign" && missing > 0) return reject(operationId, "No existen unidades aptas reales para reasignar")
  if (strategy === "pending") affected.forEach((entry) => entry.status = "pending")
  order.status = strategy === "reassign" && missing === 0 ? "preparing" : "incident"
  return commit(operationId, "shortage.resolve", strategy === "pending" ? "Demanda pendiente de reposición registrada" : strategy === "adjust" ? "Ajuste comercial pendiente de aceptación" : "Compromisos revalidados con stock real")
}

export function correctMovement(movementId: string, quantity: number, reason: string, operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const original = state.movements.find((entry) => entry.id === movementId)
  if (!original || quantity <= 0 || quantity > original.quantity) return reject(operationId, "La corrección no es válida")
  const correction = m(nextId("MOV"), operationId, "correction", original.articleId, quantity, original.fromLocationId, original.toLocationId, original.condition, reason, original.relatedId)
  correction.correctionOf = original.id
  state.movements.push(correction)
  return commit(operationId, "movement.correction", `Corrección vinculada a ${original.id}`, correction.id)
}

/** P4: sincroniza el estado de la sesión de Caja compartida (adaptador aditivo). */
export function setCashSessionStatus(open: boolean): void {
  state.cashSession = open
    ? { id: "CASH-20261024", status: "open", openedAt: INVENTORY_NOW }
    : { id: state.cashSession.id, status: "closed", openedAt: state.cashSession.openedAt }
}

/** P4: registra el pago de una obligación de P3 (compra/reintegro) sin duplicarla. */
export function payObligation(obligationId: string, amountCents: number, operationId: string): OperationResult {
  const early = begin(operationId)
  if (early) return early
  const obligation = state.obligations.find((entry) => entry.id === obligationId)
  if (!obligation) return reject(operationId, "Obligación inexistente")
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return reject(operationId, "Ingresá un importe mayor que cero")
  const due = obligation.totalCents - obligation.paidCents
  if (amountCents > due) return reject(operationId, "El importe supera el saldo pendiente")
  obligation.paidCents += amountCents
  obligation.status = obligation.paidCents === obligation.totalCents ? "paid" : "pending"
  return commit(operationId, "obligation.payment", `Pago aplicado a ${obligationId}`, obligationId)
}

export function verifyInvariants(): string[] {
  const errors: string[] = []
  for (const a of state.articles) {
    if (physicalTotal(a.id) !== fitStock(a.id) + quarantineStock(a.id))
      errors.push(`${a.id}: total != apto + cuarentena`)
    const locationSum = state.locations.reduce(
      (n, l) => n + physicalAt(a.id, l.id),
      0,
    )
    if (locationSum !== physicalTotal(a.id))
      errors.push(`${a.id}: ubicaciones no cuadran`)
    if (allocated(a.id, "sale") + allocated(a.id, "internal") > fitStock(a.id))
      errors.push(`${a.id}: asignación excedida`)
    if (available(a.id, "sale") < 0 || available(a.id, "internal") < 0)
      errors.push(`${a.id}: disponible negativo`)
  }
  if (
    state.locations
      .filter((x) => x.kind === "kit")
      .some((x) => !staff.some((s) => s.id === x.staffId))
  )
    errors.push("Kit sin integrante real")
  return errors
}
