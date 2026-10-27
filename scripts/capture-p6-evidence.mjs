import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const baseURL = process.env.P6_BASE_URL ?? "http://127.0.0.1:5173"
const root = "artifacts/p6/screenshots"
await mkdir(root, { recursive: true })

const browser = await chromium.launch()
const manifest = []

async function contextFor(viewport, reducedMotion = "no-preference") {
  return browser.newContext({ viewport, reducedMotion })
}

async function captureSummary(name, { query = "", viewport = { width: 390, height: 844 }, reducedMotion = "no-preference", tags = [], scrollBottom = false } = {}) {
  const context = await contextFor(viewport, reducedMotion)
  const page = await context.newPage()
  await page.goto(`${baseURL}/${query}`)
  await page.getByTestId("owner-summary").waitFor()
  if (scrollBottom) await page.getByTestId("owner-summary").evaluate((node) => { node.scrollTop = node.scrollHeight })
  await page.waitForTimeout(120)
  const file = `${name}.png`
  await page.getByTestId("iphone-frame").screenshot({ path: join(root, file) })
  manifest.push({ file, viewport: `${viewport.width}x${viewport.height}`, query, reducedMotion, tags })
  await context.close()
}

await captureSummary("summary-normal", { tags: ["normal", "SIM-01"] })
await captureSummary("summary-8-of-12", { tags: ["journey", "R03"] })
await captureSummary("summary-zero-collected", { query: "?summaryScenario=no-payments", tags: ["empty-money", "J6-27"] })
await captureSummary("summary-mixed-payment", { query: "?summaryScenario=mixed-payment", tags: ["mixed-payment", "J6-03"] })
await captureSummary("summary-no-appointments", { query: "?summaryScenario=no-appointments", tags: ["empty-agenda", "J6-26"] })
await captureSummary("summary-day-finished", { query: "?summaryScenario=all-finished", tags: ["all-finished"] })
await captureSummary("summary-one-incident", { query: "?summaryScenario=one-incident", tags: ["one-incident"], scrollBottom: true })
await captureSummary("summary-many-incidents", { tags: ["many-incidents"], scrollBottom: true })
await captureSummary("summary-grouped-incidents", { tags: ["grouped", "AT"], scrollBottom: true })
await captureSummary("summary-critical-stock", { tags: ["AT-05", "AT-06"], scrollBottom: true })
await captureSummary("summary-overdue-obligations", { tags: ["AT-12"], scrollBottom: true })
await captureSummary("summary-partial-source", { query: "?summaryScenario=partial", tags: ["partial", "J6-28"], scrollBottom: true })
await captureSummary("summary-no-incidents", { query: "?summaryScenario=no-incidents", tags: ["empty-attention", "J6-25"], scrollBottom: true })
await captureSummary("summary-owner-multirole", { tags: ["multi-role", "J6-31"] })
await captureSummary("summary-restricted", { query: "?summaryScenario=restricted", tags: ["permissions", "J6-30"] })
await captureSummary("summary-stale", { query: "?summaryScenario=stale", tags: ["stale"] })
await captureSummary("summary-viewport-320", { viewport: { width: 320, height: 700 }, tags: ["responsive", "ST-19"] })
await captureSummary("summary-viewport-430", { viewport: { width: 430, height: 932 }, tags: ["responsive", "ST-19"] })
await captureSummary("summary-reduced-motion", { reducedMotion: "reduce", tags: ["reduced-motion", "ST-20"] })

const flowContext = await contextFor({ width: 390, height: 844 })
const page = await flowContext.newPage()

async function flowShot(name, tags = []) {
  await page.waitForTimeout(100)
  const file = `${name}.png`
  await page.getByTestId("iphone-frame").screenshot({ path: join(root, file) })
  manifest.push({ file, viewport: "390x844", query: new URL(page.url()).search, reducedMotion: "no-preference", tags })
}

await page.goto(baseURL)
await page.getByRole("button", { name: "Ver movimientos" }).click()
await page.getByTestId("surface-F09").waitFor()
await flowShot("handoff-finance", ["handoff", "finance", "J6-02"])
await page.getByRole("button", { name: "Volver" }).click()
await page.getByTestId("owner-summary").waitFor()
await flowShot("return-from-finance", ["return", "ST-13"])

await page.getByTestId("appointment-breakdown").getByRole("button", { name: /Pendientes 1/ }).click()
await page.getByRole("button", { name: "Volver a Resumen" }).waitFor()
await flowShot("handoff-agenda", ["handoff", "agenda", "J6-13"])
await page.getByRole("button", { name: "Volver a Resumen" }).click()
await page.getByTestId("owner-summary").waitFor()

await page.locator('[data-cause="AT-06"]').click()
await page.getByTestId("surface-I8").waitFor()
await flowShot("handoff-inventory", ["handoff", "inventory", "J6-14"])
await page.getByRole("button", { name: "Volver" }).click()
await page.getByTestId("owner-summary").waitFor()
await flowShot("return-from-inventory", ["return", "J6-29"])

await flowContext.close()
await writeFile(join(root, "screenshots-manifest.json"), JSON.stringify(manifest, null, 2))
await browser.close()
console.log(`P6 evidence captured: ${manifest.length} screenshots`)
