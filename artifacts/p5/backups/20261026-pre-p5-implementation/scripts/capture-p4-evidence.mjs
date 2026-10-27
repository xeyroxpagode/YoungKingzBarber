import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const baseURL = process.env.P4_BASE_URL ?? "http://127.0.0.1:5173"
const output = "artifacts/p4/screenshots"
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
const page = await context.newPage()
const manifest = []

async function fresh(viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport)
  await page.goto(baseURL)
  return page
}

async function openFinance(page, surface) {
  if (surface && !["F01", "F02", "F03", "F05", "F06", "F07"].includes(surface)) {
    await page.goto(`${baseURL}/?financeSurface=${surface}`)
  }
  await page.getByLabel("Ir a Finanzas").click()
  if (surface && !["F01", "F02", "F03", "F05", "F06", "F07"].includes(surface)) {
    await page.getByTestId(`surface-${surface}`).waitFor()
  } else {
    await page.getByTestId("finance-root").waitFor()
  }
  if (surface === "F02") await page.getByRole("tab", { name: "Movimientos" }).click()
  if (surface === "F03") await page.getByRole("tab", { name: "Pendientes" }).click()
  if (surface === "F05") { await page.getByRole("tab", { name: "Movimientos" }).click(); await page.getByLabel("Nueva acción financiera").click() }
  if (surface === "F06") { await page.getByRole("tab", { name: "Movimientos" }).click(); await page.getByLabel("Buscar movimientos").fill("sin-coincidencias") }
  if (surface === "F07") { await page.getByRole("tab", { name: "Movimientos" }).click(); await page.getByLabel("Filtrar movimientos").click() }
}

async function capture(name, setup, surfaces = [], viewport = { width: 390, height: 844 }) {
  await fresh(viewport)
  await setup(page)
  await page.waitForTimeout(120)
  const path = join(output, `${name}.png`)
  await page.getByTestId("iphone-frame").screenshot({ path })
  manifest.push({ file: `${name}.png`, surfaces, viewport: `${viewport.width}x${viewport.height}` })
}

for (let index = 1; index <= 73; index += 1) {
  const id = `F${String(index).padStart(2, "0")}`
  await capture(`${id}-baseline`, (page) => openFinance(page, id), [id])
}

await capture("variant-summary-empty", async (page) => {
  await openFinance(page, "F01")
  await page.evaluate(async () => {
    const core = await import("/src/state/financeCore.ts")
    const state = core.baseState()
    state.sales = []; state.saleAdjustments = []; state.obligations = []; state.movements = []; state.operations = []; state.expenses = []; state.verifications = []; state.thirdPartyFunds = []
    core.financeStore.loadScenario(state)
  })
}, ["F01", "EMPTY"])

await capture("variant-movements-filtered", async (page) => {
  await openFinance(page, "F02")
  await page.getByRole("button", { name: "Gastos" }).click()
  await page.getByRole("button", { name: "Retiros" }).click()
}, ["F02", "F04", "F06"])

await capture("variant-cobro-parcial", async (page) => {
  await openFinance(page, "F17")
  await page.getByLabel("Importe").fill("1000")
  await page.getByRole("button", { name: "Revisar y confirmar cobro" }).click()
}, ["F17", "F20", "F21", "PARTIAL"])

await capture("variant-cobro-mixto", async (page) => {
  await openFinance(page, "F19")
  await page.getByLabel("Importe").fill("1000")
  await page.getByLabel("Medio").selectOption("mixto")
}, ["F17", "F19", "F20"])

await capture("variant-varias-obligaciones", (page) => openFinance(page, "F69"), ["F17", "F69"])
await capture("variant-gasto-pagado", async (page) => { await openFinance(page, "F35"); await page.getByRole("button", { name: "Revisar y registrar gasto" }).click() }, ["F35", "F36", "CONFIRMED"])
await capture("variant-gasto-pendiente", async (page) => { await openFinance(page, "F35"); await page.getByRole("checkbox").uncheck(); await page.getByRole("button", { name: "Revisar y registrar gasto" }).click() }, ["F35", "F25", "PENDING"])
await capture("variant-sena", async (page) => { await openFinance(page, "F31"); await page.getByRole("button", { name: "Registrar anticipo" }).click() }, ["F31", "F32"])
await capture("variant-anticipo", async (page) => { await openFinance(page, "F29"); await page.getByRole("button", { name: "Registrar anticipo" }).click() }, ["F29", "F30"])
await capture("variant-caja-abierta", (page) => openFinance(page, "F43"), ["F43", "OPEN"])
await capture("variant-arqueo-diferencia", async (page) => { await openFinance(page, "F47"); await page.getByLabel("Contado").fill("52000"); await page.getByRole("button", { name: "Guardar arqueo" }).click() }, ["F47", "F49", "DIFFERENCE"])
await capture("variant-relevo", (page) => openFinance(page, "F67"), ["F67", "RETURN_FROM_HANDOFF"])
await capture("variant-externo-no-verificado", async (page) => { await openFinance(page, "F17"); await page.getByLabel(/Referencia externa/).fill(""); await page.getByLabel("Importe").fill("1000"); await page.getByRole("button", { name: "Revisar y confirmar cobro" }).click() }, ["F17", "F68", "UNVERIFIED"])
await capture("variant-autorizacion-pendiente", async (page) => { await openFinance(page, "F71"); await page.getByRole("button", { name: "Solicitar" }).click() }, ["F71", "APPROVAL_REQUIRED"])
await capture("variant-permiso-denegado", async (page) => {
  await openFinance(page, "F63")
  await page.evaluate(async () => { const core = await import("/src/state/financeCore.ts"); core.setFinanceActorForTests({ id: "barber", name: "Barbero", role: "barbero" }); core.emitFinance() })
}, ["F63", "PERMISSION_DENIED"])
await capture("variant-resultado-incierto", async (page) => {
  await openFinance(page, "F56")
  await page.evaluate(async () => {
    const core = await import("/src/state/financeCore.ts"); const ops = await import("/src/state/financeOps.ts"); const ob = core.financeState().obligations.find((entry) => entry.id === "OBL-SAL-03")
    ops.collect({ operationId: "CAPTURE-UNKNOWN", amountCents: 100000, media: [{ id: "M", medio: "transferencia", amountCents: 100000, fundAccountId: "FUND-BANK", reference: "X" }], allocations: [{ obligationId: ob.id, amountCents: 100000 }], payerLabel: ob.counterpartyLabel, simulateUnknown: true })
  })
}, ["F56", "UNKNOWN"])
await capture("variant-viewport-320", (page) => openFinance(page, "F01"), ["F01", "320x700"], { width: 320, height: 700 })
await capture("variant-viewport-430", (page) => openFinance(page, "F64"), ["F64", "430x932"], { width: 430, height: 932 })

await writeFile(join(output, "screenshots-manifest.json"), JSON.stringify(manifest, null, 2))
await context.close()
await browser.close()
console.log(`P4 evidence captured: ${manifest.length} files`)

