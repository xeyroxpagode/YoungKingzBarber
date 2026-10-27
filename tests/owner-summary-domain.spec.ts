import { expect, test } from "@playwright/test"
import {
  DEMO_NOW_ISO,
  demoTodayKey,
  reiniciarFixturesParaPruebas,
  reservasDelDia,
  todasLasAtenciones,
} from "../src/state/agenda"
import {
  OWNER_ACTOR,
  baseState,
  financeState,
  financeStore,
  setFinanceActorForTests,
  type MoneyMovement,
} from "../src/state/financeCore"
import { collect } from "../src/state/financeOps"
import { inventoryStore } from "../src/state/inventory"
import { moreStore } from "../src/state/more"
import {
  selectAppointmentsToday,
  selectCollectedToday,
  selectOwnerSummary,
} from "../src/state/ownerSummary"

test.describe.configure({ mode: "serial" })
test.beforeEach(() => {
  reiniciarFixturesParaPruebas()
  inventoryStore.reset()
  financeStore.reset()
  moreStore.reset()
  setFinanceActorForTests(OWNER_ACTOR)
})

test("P6-D01 reconcilia $36.000 con dos operaciones únicas del ledger", () => {
  const projection = selectCollectedToday(baseState())
  expect(projection.amountCents).toBe(3_600_000)
  expect(projection.operationCount).toBe(2)
  expect(projection.operationIds).toEqual([
    "OP-SEED-COBRO-JUAN",
    "OP-SEED-COBRO-SOFIA",
  ])
})

test("P6-D02 un cobro mixto suma componentes pero cuenta una recepción", () => {
  const state = baseState()
  const template = state.movements[0]
  state.movements.push(
    {
      ...template,
      id: "MV-MIX-CASH",
      operationId: "OP-MIX",
      amountCents: 1_000_000,
      medio: "efectivo",
    },
    {
      ...template,
      id: "MV-MIX-TRANSFER",
      operationId: "OP-MIX",
      amountCents: 1_500_000,
      medio: "transferencia",
    },
  )
  const projection = selectCollectedToday(state)
  expect(projection.amountCents).toBe(6_100_000)
  expect(projection.operationCount).toBe(3)
})

test("P6-D03 transferencia pendiente no aumenta Cobrado", () => {
  const state = baseState()
  state.movements.push({
    ...state.movements[0],
    id: "MV-PENDING",
    operationId: "OP-PENDING",
    medio: "transferencia",
    amountCents: 9_000_000,
    status: "pendiente_verificacion",
  })
  expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
})

test("P6-D04 fondos ajenos quedan fuera del dinero propio", () => {
  const state = baseState()
  state.movements.push({
    ...state.movements[0],
    id: "MV-THIRD",
    operationId: "OP-THIRD",
    amountCents: 9_000_000,
    thirdPartyOwner: "Profesional",
  })
  expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
})

test("P6-D05 fecha efectiva impide recontar una seña recibida ayer", () => {
  const state = baseState()
  state.movements.push({
    ...state.movements[0],
    id: "MV-YESTERDAY",
    operationId: "OP-DEPOSIT",
    amountCents: 500_000,
    date: "2026-10-23T18:00:00-03:00",
    concept: "Seña aplicada hoy",
  })
  expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
})

test("P6-D06 reintegro no se oculta como ingreso negativo", () => {
  const state = baseState()
  state.movements.push({
    ...state.movements[0],
    id: "MV-REFUND",
    operationId: "OP-REFUND",
    kind: "egreso",
    amountCents: 300_000,
    concept: "Reintegro",
  })
  expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
})

test("P6-D07 reconcilia 8/12 y cinco estados excluyentes", () => {
  const projection = selectAppointmentsToday(
    reservasDelDia(demoTodayKey()),
    todasLasAtenciones(),
  )
  expect(projection).toMatchObject({ total: 12, attended: 8, consistent: true })
  expect(projection.breakdown).toEqual({
    finalizados: 8,
    enAtencion: 1,
    pendientes: 1,
    ausentes: 1,
    cancelados: 1,
  })
})

test("P6-D08 identidad repetida de una reserva no duplica denominador", () => {
  const reservations = reservasDelDia(demoTodayKey())
  const projection = selectAppointmentsToday(
    [...reservations, { ...reservations[0] }],
    todasLasAtenciones(),
  )
  expect(projection.total).toBe(12)
})

test("P6-D09 walk-in se anota pero no crea turno", () => {
  const attentions = [
    ...todasLasAtenciones(),
    {
      id: "WALK-IN",
      profesionalId: "ST01",
      serviciosRealizados: ["SV01"],
      inicio: DEMO_NOW_ISO,
      estado: "completada" as const,
    },
  ]
  const projection = selectAppointmentsToday(
    reservasDelDia(demoTodayKey()),
    attentions,
  )
  expect(projection.total).toBe(12)
  expect(projection.walkIns).toBe(1)
})

test("P6-D10 día sin reservas usa estado vacío y no 0/0 porcentual", () => {
  const projection = selectAppointmentsToday([], [], demoTodayKey())
  expect(projection.total).toBe(0)
  expect(projection.consistent).toBeTruthy()
})

test("P6-D11 stock crítico usa disponible después de compromisos", () => {
  const summary = selectOwnerSummary()
  expect(summary.attention.map((incident) => incident.causeKey)).toEqual(
    expect.arrayContaining(["AT-05", "AT-06"]),
  )
  const saleStock = summary.attention.find((incident) => incident.causeKey === "AT-06")!
  expect(saleStock.entityIds).toContain("ART-CERA")
  expect(saleStock.relatedNoticeId).toBe("ALR-STOCK")
})

test("P6-D12 mínimo sin configurar no produce falso positivo", () => {
  const inventory = structuredClone(inventoryStore.getSnapshot())
  inventory.articles.forEach((article) => {
    article.minimumSale = 0
    article.minimumInternal = 0
  })
  const summary = selectOwnerSummary({ inventory })
  expect(summary.attention.some((incident) => ["AT-05", "AT-06"].includes(incident.causeKey))).toBeFalsy()
})

test("P6-D13 pedido listo sin problema no aparece como incidencia", () => {
  const inventory = structuredClone(inventoryStore.getSnapshot())
  inventory.orders.forEach((order) => {
    order.status = "ready"
  })
  const summary = selectOwnerSummary({ inventory })
  expect(summary.attention.some((incident) => ["AT-07", "AT-08", "AT-09"].includes(incident.causeKey))).toBeFalsy()
})

test("P6-D14 Caja abierta a las 14:00 no genera alerta", () => {
  const summary = selectOwnerSummary()
  expect(summary.attention.some((incident) => incident.causeKey === "AT-14")).toBeFalsy()
})

test("P6-D15 aviso leído no resuelve la causa de stock", () => {
  const more = structuredClone(moreStore.getSnapshot())
  more.alerts.find((alert) => alert.id === "ALR-STOCK")!.read = true
  const summary = selectOwnerSummary({ more })
  expect(summary.attention.find((incident) => incident.causeKey === "AT-06")?.relatedNoticeId).toBe("ALR-STOCK")
})

test("P6-D16 obligaciones vencidas se agrupan en una causa estable", () => {
  const first = selectOwnerSummary().attention.find((incident) => incident.causeKey === "AT-12")!
  const second = selectOwnerSummary().attention.find((incident) => incident.causeKey === "AT-12")!
  expect(first.entityIds.length).toBeGreaterThan(0)
  expect(first.id).toBe(second.id)
  expect(first.destination.params.financeSurface).toBe("F61")
})

test("P6-D17 UNKNOWN crea recuperación y no suma Cobrado", () => {
  const state = baseState()
  const uncertain: MoneyMovement = {
    ...state.movements[0],
    id: "MV-UNKNOWN",
    operationId: "OP-UNKNOWN",
    status: "incierto",
    amountCents: 7_000_000,
  }
  state.movements.push(uncertain)
  const summary = selectOwnerSummary({ finance: state })
  expect(summary.collected.amountCents).toBe(3_600_000)
  expect(summary.attention.find((incident) => incident.causeKey === "AT-17")?.destination.params.financeSurface).toBe("F56")
})

test("P6-D18 permiso financiero restringe importe y elimina conteos indirectos", () => {
  const summary = selectOwnerSummary({
    permissions: { agenda: true, finance: false, inventory: true, more: true },
  })
  expect(summary.collected.status).toBe("restricted")
  expect(summary.collected.amountCents).toBeUndefined()
  expect(summary.collected.operationCount).toBeUndefined()
  expect(summary.attention.some((incident) => incident.source === "finance")).toBeFalsy()
})

test("P6-D19 fuente fallida produce guion y no cero", () => {
  const summary = selectOwnerSummary({ sourceOverrides: { finance: "unavailable" } })
  expect(summary.collected.status).toBe("unavailable")
  expect(summary.collected.amountCents).toBeUndefined()
})

test("P6-D20 fuente parcial conserva secciones válidas", () => {
  const summary = selectOwnerSummary({ sourceOverrides: { inventory: "unavailable" } })
  expect(summary.collected.amountCents).toBe(3_600_000)
  expect(summary.appointments.total).toBe(12)
  expect(summary.attention.some((incident) => incident.source === "inventory")).toBeFalsy()
})

test("P6-D21 cobro confirmado invalida y recalcula desde P4", () => {
  const before = selectOwnerSummary().collected
  const obligation = financeState().obligations.find((item) => item.id === "OBL-SAL-03")!
  const result = collect({
    operationId: "P6-REACTIVE-COLLECT",
    amountCents: 100_000,
    media: [
      {
        id: "P6-MEDIA",
        medio: "transferencia",
        amountCents: 100_000,
        fundAccountId: "FUND-BANK",
        reference: "P6-OK",
      },
    ],
    allocations: [{ obligationId: obligation.id, amountCents: 100_000 }],
    payerLabel: obligation.counterpartyLabel,
  })
  expect(result.ok).toBeTruthy()
  const after = selectOwnerSummary().collected
  expect(after.amountCents).toBe((before.amountCents ?? 0) + 100_000)
  expect(after.operationCount).toBe((before.operationCount ?? 0) + 1)
})

test("P6-D22 prioridades se ordenan por severidad y no por módulo", () => {
  const incidents = selectOwnerSummary().attention
  const rank = { critical: 0, high: 1, medium: 2, low: 3 }
  expect(
    incidents.every(
      (incident, index) => index === 0 || rank[incidents[index - 1].severity] <= rank[incident.severity],
    ),
  ).toBeTruthy()
})
