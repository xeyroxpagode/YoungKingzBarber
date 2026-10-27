import { chromium } from "@playwright/test"
import { mkdir, readdir, rename } from "node:fs/promises"
import { join } from "node:path"

const baseURL = "http://127.0.0.1:5173"
const screenshotDir = "artifacts/screenshots"
const videoDir = "artifacts/videos"

await mkdir(screenshotDir, { recursive: true })
await mkdir(videoDir, { recursive: true })

const browser = await chromium.launch()

async function openPage(viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await page.goto(baseURL)
  return { context, page }
}

async function openAgenda(page) {
  await page.getByLabel("Ir a Equipo").click()
  await page.getByRole("tab", { name: "Agenda" }).waitFor()
}

async function openPersonal(page, name) {
  await page.getByLabel("Ir a Equipo").click()
  await page.getByRole("tab", { name: "Personal" }).click()
  await page.getByTestId("staff-directory").waitFor()
  if (name) await page.getByText(name, { exact: true }).click()
}

async function capture(name, setup, viewport) {
  const { context, page } = await openPage(viewport)
  await setup(page)
  await page.waitForTimeout(420)
  await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: true })
  await context.close()
}

await capture("a01-agenda-list", openAgenda)
await capture("a02-agenda-grid", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Abrir filtros").click()
  await page.getByText("Grilla", { exact: true }).click()
  await page.getByRole("button", { name: "Aplicar" }).click()
})
await capture("a03-calendar-popover", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Seleccionar fecha").click()
})
await capture("a05-filter-sheet", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Abrir filtros").click()
})
await capture("a06-booking-detail", async (page) => {
  await openAgenda(page)
  await page.getByText("Juan Pérez", { exact: true }).click()
})
await capture("a07-new-booking", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Nuevo turno").click()
})
await capture("a08-service-sheet", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Nuevo turno").click()
  await page.getByRole("button", { name: "Seleccionar servicio" }).click()
})
await capture("a10-availability", async (page) => {
  await openAgenda(page)
  await page.getByLabel("Nuevo turno").click()
  await page.getByRole("button", { name: "Seleccionar servicio" }).click()
  await page.getByText("Corte clásico", { exact: true }).last().click()
  await page.getByRole("button", { name: "Seleccionar profesional" }).click()
  await page.getByText("Alex Martínez", { exact: true }).last().click()
  await page.getByRole("button", { name: "Seleccionar disponibilidad" }).click()
})
await capture("p01-directory", async (page) => openPersonal(page))
await capture("p03-filter-sheet", async (page) => {
  await openPersonal(page)
  await page.getByLabel("Filtrar personal").click()
})
await capture("p04-new-staff", async (page) => {
  await openPersonal(page)
  await page.getByLabel("Nuevo integrante").click()
})
await capture("p05-profile-summary", async (page) => openPersonal(page, "Alex Martínez"))
await capture("p07-schedule", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByText("Jornada habitual", { exact: true }).click()
})
await capture("p10-services", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByText("Servicios habilitados", { exact: true }).click()
})
await capture("p11-activity", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByRole("tab", { name: "Actividad" }).click()
})
await capture("p13-economy", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByRole("tab", { name: "Economía" }).click()
})
await capture("p14-agreement", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByRole("tab", { name: "Economía" }).click()
  await page.getByText("Comisión", { exact: true }).click()
})
await capture("p17-settlements", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByRole("tab", { name: "Economía" }).click()
  await page.getByText("Liquidaciones", { exact: true }).click()
})
await capture("p21-access", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByText("Acceso y responsabilidades", { exact: true }).click()
})
await capture("p22-permissions", async (page) => {
  await openPersonal(page, "Alex Martínez")
  await page.getByText("Acceso y responsabilidades", { exact: true }).click()
  await page.getByText("Permisos", { exact: true }).click()
})
await capture("phoneframe-desktop", async (page) => openPersonal(page), { width: 1280, height: 1000 })

const videoContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir: videoDir, size: { width: 390, height: 844 } },
})
const videoPage = await videoContext.newPage()
await videoPage.goto(baseURL)
await videoPage.getByLabel("Ir a Equipo").click()
await videoPage.waitForTimeout(350)
await videoPage.getByRole("tab", { name: "Personal" }).click()
await videoPage.waitForTimeout(350)
await videoPage.getByText("Alex Martínez", { exact: true }).click()
await videoPage.waitForTimeout(350)
await videoPage.getByRole("tab", { name: "Economía" }).click()
await videoPage.waitForTimeout(350)
await videoPage.getByLabel("Volver").click()
await videoPage.waitForTimeout(350)
await videoContext.close()

const videos = (await readdir(videoDir)).filter((file) => file.endsWith(".webm"))
const newest = videos.at(-1)
if (newest && newest !== "team-navigation-motion.webm") {
  try { await rename(join(videoDir, newest), join(videoDir, "team-navigation-motion.webm")) } catch {}
}

await browser.close()
console.log("Evidence captured")
