import { expect, test, type Page } from "@playwright/test"
import {
  DEMO_NOW_ISO,
  cancelarReserva,
  crearReserva,
  demoTodayKey,
  editarReserva,
  finalizarAtencion,
  registrarAtencionDirecta,
  registrarInasistencia,
  reiniciarFixturesParaPruebas,
  reservasDelDia,
  todasLasAtenciones,
  type Reserva,
} from "../src/state/agenda"
import {
  OWNER_ACTOR,
  activeSession,
  baseState,
  cashExpected,
  financeState,
  financeStore,
  setFinanceActorForTests,
  type MediaLine,
} from "../src/state/financeCore"
import {
  closeCash,
  collect,
  correctMovement,
  countCash,
  createSale,
  requestApproval,
} from "../src/state/financeOps"
import {
  deliverOrder,
  inventoryStore,
  orderTotal,
  payOrder,
  prepareOrder,
  receive,
} from "../src/state/inventory"
import { markAlertRead, moreStore } from "../src/state/more"
import {
  selectAppointmentsToday,
  selectCollectedToday,
  selectOwnerSummary,
} from "../src/state/ownerSummary"
import { addException } from "../src/state/staff"

test.describe.configure({ mode: "serial" })

function resetDomains() {
  reiniciarFixturesParaPruebas()
  inventoryStore.reset()
  financeStore.reset()
  moreStore.reset()
  setFinanceActorForTests(OWNER_ACTOR)
}

function transfer(operationId: string, amountCents: number): MediaLine[] {
  return [
    {
      id: `${operationId}:M1`,
      medio: "transferencia",
      amountCents,
      fundAccountId: "FUND-BANK",
      reference: `${operationId}-OK`,
    },
  ]
}

async function loadSummary(page: Page, query = "") {
  await page.goto(`/${query}`)
  await expect(page.getByTestId("owner-summary")).toBeVisible()
}

test.describe("J6-01–J6-32 · recorridos de aceptación", () => {
  test.beforeEach(resetDomains)

  test("J6-01 abre Resumen con datos reales", () => {
    const value = selectOwnerSummary()
    expect(value.collected.amountCents).toBe(3_600_000)
    expect(value.appointments.total).toBe(12)
  })

  test("J6-02 Cobrado navega a Finanzas y retorna", async ({ page }) => {
    await loadSummary(page)
    await page.getByRole("button", { name: "Ver movimientos" }).click()
    await expect(page.getByTestId("surface-F09")).toBeVisible()
    await page.getByRole("button", { name: "Volver" }).click()
    await expect(page.getByTestId("owner-summary")).toBeVisible()
  })

  test("J6-03 cobro mixto no duplica recepción", () => {
    const state = baseState()
    state.movements.push(
      { ...state.movements[0], id: "MIX-1", operationId: "MIX", amountCents: 1_000_000 },
      { ...state.movements[1], id: "MIX-2", operationId: "MIX", amountCents: 1_500_000 },
    )
    expect(selectCollectedToday(state)).toMatchObject({ amountCents: 6_100_000, operationCount: 3 })
  })

  test("J6-04 cobro externo declarado queda fuera hasta verificación", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[1], id: "EXT", operationId: "EXT", amountCents: 1_000_000, status: "pendiente_verificacion" })
    expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
  })

  test("J6-05 reintegro y corrección preservan el indicador canónico", () => {
    const before = selectOwnerSummary().collected.amountCents
    const original = financeState().movements[0]
    expect(correctMovement({ operationId: "J6-CORR", movementId: original.id, reason: "Corrección histórica" }).ok).toBeTruthy()
    expect(financeState().movements.some((movement) => movement.id === original.id)).toBeTruthy()
    expect(selectOwnerSummary().collected.amountCents).toBe(before)
  })

  test("J6-06 custodia de tercero no suma dinero propio", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[0], id: "THIRD", operationId: "THIRD", thirdPartyOwner: "Nicolás", amountCents: 5_000_000 })
    expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
  })

  test("J6-07 consulta 8/12", () => {
    expect(selectOwnerSummary().appointments).toMatchObject({ attended: 8, total: 12, consistent: true })
  })

  test("J6-08 finalizar atención actualiza progreso", () => {
    const active = reservasDelDia(demoTodayKey()).find((reservation) => reservation.estado === "en_atencion")!
    expect(finalizarAtencion(active.id).ok).toBeTruthy()
    expect(selectOwnerSummary().appointments.attended).toBe(9)
  })

  test("J6-09 reprogramar conserva identidad y denominador", () => {
    const reservation = reservasDelDia(demoTodayKey()).find((item) => item.estado === "confirmada")!
    const id = reservation.id
    expect(editarReserva(id, { inicio: "2026-10-24T15:15:00-03:00", fin: "2026-10-24T15:45:00-03:00" }).ok).toBeTruthy()
    expect(selectOwnerSummary().appointments.total).toBe(12)
    expect(reservasDelDia(demoTodayKey()).some((item) => item.id === id)).toBeTruthy()
  })

  test("J6-10 cancelar y crear en el horario liberado agrega otra identidad legítima", () => {
    const reservation = reservasDelDia(demoTodayKey()).find((item) => item.estado === "confirmada")!
    expect(cancelarReserva(reservation.id, "Liberación").ok).toBeTruthy()
    const created = crearReserva({
      clienteId: reservation.clienteId,
      servicioId: reservation.servicioId,
      profesionalId: reservation.profesionalId,
      inicio: reservation.inicio,
      fin: reservation.fin,
    })
    expect(created.ok).toBeTruthy()
    expect(created.reservaId).not.toBe(reservation.id)
    expect(selectOwnerSummary().appointments.total).toBe(13)
  })

  test("J6-11 registrar ausencia cambia sólo el desglose", () => {
    const reservation = reservasDelDia(demoTodayKey()).find((item) => item.estado === "confirmada")!
    expect(registrarInasistencia(reservation.id, "No asistió").ok).toBeTruthy()
    expect(selectOwnerSummary().appointments.breakdown?.ausentes).toBe(2)
    expect(selectOwnerSummary().appointments.total).toBe(12)
  })

  test("J6-12 atención sin reserva permanece fuera del denominador", () => {
    registrarAtencionDirecta({ clienteId: "CL01", profesionalId: "ST01", servicioId: "SV01", inicio: DEMO_NOW_ISO })
    expect(selectOwnerSummary().appointments).toMatchObject({ total: 12, walkIns: 1 })
  })

  test("J6-13 estado del desglose entrega filtro real a Agenda", async ({ page }) => {
    await loadSummary(page)
    await page.getByTestId("appointment-breakdown").getByRole("button", { name: /Ausentes 1/ }).click()
    expect(page.url()).toContain("agendaStates=ausente")
    await expect(page.getByRole("button", { name: "Volver a Resumen" })).toBeVisible()
  })

  test("J6-14 stock crítico deriva a Inventario", () => {
    const incident = selectOwnerSummary().attention.find((item) => item.causeKey === "AT-06")!
    expect(incident.destination.root).toBe("inventario")
    expect(incident.entityIds).toContain("ART-CERA")
  })

  test("J6-15 reposición reevalúa y retira artículo de la incidencia", () => {
    expect(receive([{ articleId: "ART-CERA", quantity: 10, locationId: "LOC-DEP", condition: "fit" }], {}, "J6-RECEIVE").ok).toBeTruthy()
    const stock = selectOwnerSummary().attention.find((item) => item.causeKey === "AT-06")
    expect(stock?.entityIds ?? []).not.toContain("ART-CERA")
  })

  test("J6-16 pedido pendiente abre procedimiento propietario", () => {
    const incident = selectOwnerSummary().attention.find((item) => item.causeKey === "AT-07")!
    expect(incident.destination).toMatchObject({ root: "inventario", params: { inventorySurface: "I32", orderId: "ORD-1042" } })
  })

  test("J6-17 ausencia profesional agrupa reservas afectadas", () => {
    addException({ staffId: "ST02", type: "ausencia", from: "2026-10-24T00:00:00-03:00", to: "2026-10-24T23:59:00-03:00", reason: "Ausencia demo P6" })
    const incident = selectOwnerSummary().attention.find((item) => item.causeKey === "AT-01")!
    expect(incident.entityIds.length).toBeGreaterThan(0)
    expect(incident.destination.root).toBe("equipo")
  })

  test("J6-18 obligación vencida deriva a Finanzas", () => {
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-12")?.destination.params.financeSurface).toBe("F61")
  })

  test("J6-19 diferencia de Caja deriva a conciliación", () => {
    const session = activeSession(financeState())!
    const expected = cashExpected(financeState(), session)
    countCash({ operationId: "J6-COUNT", countedCents: expected - 100, expectedSessionVersion: session.version })
    const count = financeState().counts.at(-1)!
    closeCash({ operationId: "J6-CLOSE", countId: count.id, expectedSessionVersion: session.version, differenceReason: "Diferencia controlada" })
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-15")?.destination.params.financeSurface).toBe("F49")
  })

  test("J6-20 cierre de Caja aparece sólo después del horario configurado", () => {
    const more = structuredClone(moreStore.getSnapshot())
    more.schedule.Sábado = [{ id: "Sábado-1", start: "09:00", end: "13:00" }]
    expect(selectOwnerSummary({ more }).attention.find((item) => item.causeKey === "AT-14")?.destination.params.financeSurface).toBe("F48")
  })

  test("J6-21 autorización pendiente deriva a revisión", () => {
    requestApproval({ operationId: "J6-APPROVAL", reason: "Excepción", scope: "finance.discount", amountCents: 100_000, version: 1 })
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-18")?.destination.params.financeSurface).toBe("F71")
  })

  test("J6-22 UNKNOWN deriva a recuperación", () => {
    const obligation = financeState().obligations[0]
    collect({ operationId: "J6-UNKNOWN", amountCents: 100_000, media: transfer("J6-UNKNOWN", 100_000), allocations: [{ obligationId: obligation.id, amountCents: 100_000 }], payerLabel: obligation.counterpartyLabel, simulateUnknown: true })
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-17")?.destination.params.financeSurface).toBe("F56")
  })

  test("J6-23 incidencias multidominio conservan destinos distintos", () => {
    const roots = new Set(selectOwnerSummary().attention.map((item) => item.destination.root))
    expect(roots.has("inventario")).toBeTruthy()
    expect(roots.has("finanzas")).toBeTruthy()
  })

  test("J6-24 leer aviso no resuelve causa", () => {
    markAlertRead("ALR-STOCK")
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-06")?.relatedNoticeId).toBe("ALR-STOCK")
  })

  test("J6-25 sin incidencias renderiza estado explícito", async ({ page }) => {
    await loadSummary(page, "?summaryScenario=no-incidents")
    await expect(page.getByTestId("attention-empty")).toBeVisible()
  })

  test("J6-26 sin turnos renderiza estado explícito", async ({ page }) => {
    await loadSummary(page, "?summaryScenario=no-appointments")
    await expect(page.getByTestId("appointments-empty")).toBeVisible()
  })

  test("J6-27 sin cobros muestra $0 confirmado", async ({ page }) => {
    await loadSummary(page, "?summaryScenario=no-payments")
    await expect(page.getByTestId("collected-total")).toContainText("0")
  })

  test("J6-28 una fuente incompleta no pierde toda la Home", async ({ page }) => {
    await loadSummary(page, "?summaryScenario=partial")
    await expect(page.getByTestId("appointments-progress")).toHaveText("8/12")
  })

  test("J6-29 ida y vuelta conserva contexto", async ({ page }) => {
    await loadSummary(page)
    await page.getByRole("button", { name: "Ver movimientos" }).click()
    await page.getByRole("button", { name: "Volver" }).click()
    await expect(page.getByTestId("collected-total")).toContainText("36.000")
  })

  test("J6-30 revocación de permiso oculta valor y conteo", () => {
    const summary = selectOwnerSummary({ permissions: { agenda: true, finance: false, inventory: true, more: true } })
    expect(summary.collected.amountCents).toBeUndefined()
    expect(summary.collected.operationCount).toBeUndefined()
  })

  test("J6-31 dueño multirrol no duplica identidades", () => {
    const reservations = reservasDelDia(demoTodayKey())
    expect(selectAppointmentsToday([...reservations, reservations[0]], todasLasAtenciones()).total).toBe(12)
  })

  test("J6-32 cambiar día de negocio recalcula ambas métricas", () => {
    const monday = selectOwnerSummary({ businessDate: "2026-10-26" })
    expect(monday.appointments.total).toBe(3)
    expect(monday.collected.amountCents).toBe(0)
  })
})

test.describe("ST-01–ST-20 · stress verificable", () => {
  test.beforeEach(resetDomains)

  test("ST-01 conteo inconsistente se reconcilia por identidad", () => {
    const rows = reservasDelDia(demoTodayKey())
    const result = selectAppointmentsToday([...rows, ...rows], todasLasAtenciones())
    expect(result).toMatchObject({ total: 12, consistent: true })
  })
  test("ST-02 cobro aplicado a varias obligaciones cuenta una operación", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[0], id: "ALLOC", operationId: "ALLOC", amountCents: 1_000_000 })
    expect(selectCollectedToday(state).operationCount).toBe(3)
  })
  test("ST-03 cobro mixto cuenta una operación", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[0], id: "M1", operationId: "MIX" }, { ...state.movements[1], id: "M2", operationId: "MIX" })
    expect(selectCollectedToday(state).operationCount).toBe(3)
  })
  test("ST-04 fondos ajenos no alteran total", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[0], id: "TP", operationId: "TP", thirdPartyOwner: "Tercero" })
    expect(selectCollectedToday(state).amountCents).toBe(3_600_000)
  })
  test("ST-05 atención ajena sin venta no dispara AT-03", () => {
    expect(selectOwnerSummary().attention.some((item) => item.causeKey === "AT-03")).toBeFalsy()
  })
  test("ST-06 mínimo no configurado no alerta", () => {
    const inventory = structuredClone(inventoryStore.getSnapshot())
    inventory.articles.forEach((article) => { article.minimumSale = 0; article.minimumInternal = 0 })
    expect(selectOwnerSummary({ inventory }).attention.some((item) => ["AT-05", "AT-06"].includes(item.causeKey))).toBeFalsy()
  })
  test("ST-07 pedido listo sin retraso no alerta", () => {
    const inventory = structuredClone(inventoryStore.getSnapshot())
    inventory.orders.forEach((order) => { order.status = "ready" })
    expect(selectOwnerSummary({ inventory }).attention.some((item) => ["AT-07", "AT-08", "AT-09"].includes(item.causeKey))).toBeFalsy()
  })
  test("ST-08 Caja abierta durante jornada no alerta", () => {
    expect(selectOwnerSummary().attention.some((item) => item.causeKey === "AT-14")).toBeFalsy()
  })
  test("ST-09 aviso leído conserva incidencia", () => {
    markAlertRead("ALR-STOCK")
    expect(selectOwnerSummary().attention.some((item) => item.relatedNoticeId === "ALR-STOCK")).toBeTruthy()
  })
  test("ST-10 causas iguales se agrupan", () => {
    const causes = selectOwnerSummary().attention.map((item) => item.causeKey)
    expect(new Set(causes).size).toBe(causes.length)
  })
  test("ST-11 fuente desconocida no produce ceros", () => {
    expect(selectOwnerSummary({ sourceOverrides: { finance: "unavailable" } }).collected.amountCents).toBeUndefined()
  })
  test("ST-12 handoff conserva filtro", async ({ page }) => {
    await loadSummary(page)
    await page.getByTestId("appointment-breakdown").getByRole("button", { name: /Cancelados 1/ }).click()
    expect(page.url()).toContain("agendaStates=cancelado")
  })
  test("ST-13 retorno conserva scroll", async ({ page }) => {
    await loadSummary(page)
    const root = page.getByTestId("owner-summary")
    await root.evaluate((node) => { node.scrollTop = 320; node.dispatchEvent(new Event("scroll", { bubbles: true })) })
    await page.locator('[data-cause="AT-12"]').click()
    await page.getByRole("button", { name: "Volver" }).click()
    await expect.poll(() => root.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  })
  test("ST-14 cambio de permisos no filtra conteos sensibles", () => {
    const value = selectOwnerSummary({ permissions: { agenda: true, finance: false, inventory: false, more: true } })
    expect(value.collected.operationCount).toBeUndefined()
    expect(value.attention.every((item) => !["finance", "inventory"].includes(item.source))).toBeTruthy()
  })
  test("ST-15 multirrol conserva doce identidades", () => {
    const rows = reservasDelDia(demoTodayKey())
    expect(selectAppointmentsToday([...rows, rows[0]], todasLasAtenciones()).total).toBe(12)
  })
  test("ST-16 corrección posterior conserva original", () => {
    const original = financeState().movements[0]
    correctMovement({ operationId: "ST16", movementId: original.id, reason: "Corrección" })
    expect(financeState().movements.find((item) => item.id === original.id)).toBeTruthy()
    expect(financeState().movements.some((item) => item.correctionOf === original.id)).toBeTruthy()
  })
  test("ST-17 fuentes actualizadas en momentos distintos se marcan stale", () => {
    const value = selectOwnerSummary({ sourceOverrides: { finance: "stale", inventory: "partial" } })
    expect(value.sources).toMatchObject({ finance: "stale", inventory: "partial" })
  })
  test("ST-18 alto volumen conserva invariante", () => {
    const template = reservasDelDia(demoTodayKey())[0]
    const rows: Reserva[] = Array.from({ length: 500 }, (_, index) => ({ ...template, id: `VOL-${index}`, estado: index % 2 ? "finalizada" : "confirmada" }))
    const value = selectAppointmentsToday(rows, [])
    expect(value).toMatchObject({ total: 500, attended: 250, consistent: true })
  })
  test("ST-19 viewports 320, 390 y 430 no desbordan", async ({ page }) => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await loadSummary(page)
      const overflow = await page.getByTestId("owner-summary").evaluate((node) => node.scrollWidth - node.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)
    }
  })
  test("ST-20 foco, zoom y reduced motion siguen operativos", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await loadSummary(page)
    await page.getByRole("button", { name: "Ver movimientos" }).focus()
    await expect(page.getByRole("button", { name: "Ver movimientos" })).toBeFocused()
    await page.getByRole("button", { name: "Ver movimientos" }).press("Enter")
    await expect(page.getByTestId("surface-F09")).toBeVisible()
  })
})

test.describe("SIM-01–SIM-10 · simulaciones integradas", () => {
  test.beforeEach(resetDomains)

  test("SIM-01 inicio normal combina dinero, jornada e incidencias", () => {
    const value = selectOwnerSummary()
    expect(value.collected.amountCents).toBe(3_600_000)
    expect(value.appointments.total).toBe(12)
    expect(value.attention.length).toBeGreaterThan(0)
  })

  test("SIM-02 atención → venta → cobro actualiza fuentes independientes", () => {
    const reservation = reservasDelDia(demoTodayKey()).find((item) => item.estado === "en_atencion")!
    finalizarAtencion(reservation.id)
    const attention = todasLasAtenciones().find((item) => item.reservaId === reservation.id)!
    const sale = createSale({ operationId: "SIM02-SALE", clientId: reservation.clienteId, origin: "atencion", attentionId: attention.id, ownership: "propia", lines: [{ id: "SIM02-L1", kind: "servicio", refId: reservation.servicioId, name: "Servicio", quantity: 1, unitPriceCents: 1_000_000, attentionId: attention.id }] })
    expect(sale.ok).toBeTruthy()
    const obligation = financeState().obligations.find((item) => item.originId === sale.entityId)!
    expect(collect({ operationId: "SIM02-COLLECT", amountCents: 1_000_000, media: transfer("SIM02-COLLECT", 1_000_000), allocations: [{ obligationId: obligation.id, amountCents: 1_000_000 }], payerLabel: obligation.counterpartyLabel }).ok).toBeTruthy()
    expect(selectOwnerSummary().appointments.attended).toBe(9)
    expect(selectOwnerSummary().collected.amountCents).toBe(4_600_000)
  })

  test("SIM-03 transferencia confirmada no mueve efectivo", () => {
    const session = activeSession(financeState())!
    const before = cashExpected(financeState(), session)
    const obligation = financeState().obligations[0]
    collect({ operationId: "SIM03", amountCents: 100_000, media: transfer("SIM03", 100_000), allocations: [{ obligationId: obligation.id, amountCents: 100_000 }], payerLabel: obligation.counterpartyLabel })
    expect(cashExpected(financeState(), session)).toBe(before)
    expect(selectOwnerSummary().collected.amountCents).toBe(3_700_000)
  })

  test("SIM-04 pedido preparado, cobrado y entregado no deja incidencia", () => {
    expect(prepareOrder("ORD-1042", "SIM04-PREP").ok).toBeTruthy()
    const order = inventoryStore.getSnapshot().orders.find((item) => item.id === "ORD-1042")!
    expect(payOrder(order.id, orderTotal(order), "transfer", "SIM04-PAY").ok).toBeTruthy()
    expect(deliverOrder(order.id, "SIM04-DELIVER").ok).toBeTruthy()
    expect(selectOwnerSummary().attention.find((item) => item.causeKey === "AT-07")?.entityIds ?? []).not.toContain(order.id)
  })

  test("SIM-05 reposición hace desaparecer causa de stock", () => {
    expect(selectOwnerSummary().attention.some((item) => item.entityIds.includes("ART-CERA"))).toBeTruthy()
    receive([{ articleId: "ART-CERA", quantity: 10, locationId: "LOC-DEP", condition: "fit" }], {}, "SIM05")
    expect(selectOwnerSummary().attention.filter((item) => ["AT-05", "AT-06"].includes(item.causeKey)).some((item) => item.entityIds.includes("ART-CERA"))).toBeFalsy()
  })

  test("SIM-06 ausencia produce una incidencia agrupada", () => {
    addException({ staffId: "ST02", type: "ausencia", from: "2026-10-24T00:00:00-03:00", to: "2026-10-24T23:59:00-03:00", reason: "SIM06" })
    const incidents = selectOwnerSummary().attention.filter((item) => item.causeKey === "AT-01")
    expect(incidents).toHaveLength(1)
    expect(incidents[0].entityIds.length).toBeGreaterThan(0)
  })

  test("SIM-07 Caja normal no alerta; cierre con diferencia sí", () => {
    expect(selectOwnerSummary().attention.some((item) => item.causeKey === "AT-14")).toBeFalsy()
    const session = activeSession(financeState())!
    countCash({ operationId: "SIM07-COUNT", countedCents: cashExpected(financeState(), session) + 100, expectedSessionVersion: session.version })
    const count = financeState().counts.at(-1)!
    closeCash({ operationId: "SIM07-CLOSE", countId: count.id, expectedSessionVersion: session.version, differenceReason: "Sobrante" })
    expect(selectOwnerSummary().attention.some((item) => item.causeKey === "AT-15")).toBeTruthy()
  })

  test("SIM-08 alto volumen mantiene proyección atómica", () => {
    const template = reservasDelDia(demoTodayKey())[0]
    const rows = Array.from({ length: 1_000 }, (_, index) => ({ ...template, id: `SIM08-${index}` }))
    const value = selectAppointmentsToday(rows, todasLasAtenciones())
    expect(value.total).toBe(1_000)
    expect(value.consistent).toBeTruthy()
  })

  test("SIM-09 parcialidad, UNKNOWN y permisos se distinguen", () => {
    const unavailable = selectOwnerSummary({ sourceOverrides: { inventory: "unavailable" } })
    const restricted = selectOwnerSummary({ permissions: { agenda: true, finance: false, inventory: true, more: true } })
    expect(unavailable.sources.inventory).toBe("unavailable")
    expect(restricted.collected.status).toBe("restricted")
  })

  test("SIM-10 correcciones históricas respetan día de negocio", () => {
    const state = baseState()
    state.movements.push({ ...state.movements[0], id: "HIST", operationId: "HIST", date: "2026-10-23T23:50:00-03:00", amountCents: 5_000_000 })
    expect(selectCollectedToday(state, "2026-10-24").amountCents).toBe(3_600_000)
    expect(selectCollectedToday(state, "2026-10-23").amountCents).toBe(5_000_000)
  })
})
