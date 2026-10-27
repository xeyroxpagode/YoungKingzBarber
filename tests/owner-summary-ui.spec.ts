import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("P6-UI01 renderiza sólo los tres bloques congelados", async ({ page }) => {
  await expect(page.getByTestId("owner-summary")).toBeVisible()
  await expect(page.getByText("Cobrado hoy", { exact: true })).toBeVisible()
  await expect(page.getByText("Turnos de hoy", { exact: true })).toBeVisible()
  await expect(page.getByText("Requiere atención", { exact: true })).toBeVisible()
  await expect(page.getByText("Ocupación", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Reportes", { exact: true })).toHaveCount(0)
})

test("P6-UI02 muestra $36.000, dos cobros y 8/12 reconciliados", async ({ page }) => {
  await expect(page.getByTestId("collected-total")).toContainText("36.000")
  await expect(page.getByTestId("collected-count")).toContainText("2 cobros confirmados")
  await expect(page.getByTestId("appointments-progress")).toHaveText("8/12")
  const breakdown = page.getByTestId("appointment-breakdown")
  await expect(breakdown.getByRole("button", { name: /Finalizados 8/ })).toBeVisible()
  await expect(breakdown.getByRole("button", { name: /En atención 1/ })).toBeVisible()
  await expect(breakdown.getByRole("button", { name: /Pendientes 1/ })).toBeVisible()
  await expect(breakdown.getByRole("button", { name: /Ausentes 1/ })).toBeVisible()
  await expect(breakdown.getByRole("button", { name: /Cancelados 1/ })).toBeVisible()
})

test("P6-UI03 Cobrado abre desglose financiero y vuelve a Resumen", async ({ page }) => {
  await page.getByRole("button", { name: "Ver movimientos" }).click()
  await expect(page.getByTestId("surface-F09")).toBeVisible()
  expect(page.url()).toContain("financeSurface=F09")
  expect(page.url()).toContain("returnRoot=resumen")
  await page.getByRole("button", { name: "Volver" }).click()
  await expect(page.getByTestId("owner-summary")).toBeVisible()
  expect(new URL(page.url()).search).toBe("")
})

test("P6-UI04 estado de Jornada abre Agenda con fecha y filtro", async ({ page }) => {
  await page.getByTestId("appointment-breakdown").getByRole("button", { name: /Pendientes 1/ }).click()
  await expect(page.getByText("Equipo", { exact: true }).first()).toBeVisible()
  expect(page.url()).toContain("agendaDate=2026-10-24")
  expect(page.url()).toContain("agendaStates=confirmado")
  await expect(page.getByRole("button", { name: "Volver a Resumen" })).toBeVisible()
  await page.getByRole("button", { name: "Volver a Resumen" }).click()
  await expect(page.getByTestId("owner-summary")).toBeVisible()
})

test("P6-UI05 stock crítico abre el artículo propietario", async ({ page }) => {
  const row = page.locator('[data-cause="AT-06"]')
  await expect(row).toBeVisible()
  await row.click()
  await expect(page.getByTestId("surface-I8")).toBeVisible()
  expect(page.url()).toContain("articleId=ART-CERA")
  await page.getByRole("button", { name: "Volver" }).click()
  await expect(page.getByTestId("owner-summary")).toBeVisible()
})

test("P6-UI06 obligación vencida abre Finanzas F61", async ({ page }) => {
  await page.locator('[data-cause="AT-12"]').click()
  await expect(page.getByTestId("surface-F61")).toBeVisible()
  await page.getByRole("button", { name: "Volver" }).click()
  await expect(page.getByTestId("owner-summary")).toBeVisible()
})

test("P6-UI07 cobrado cero es cero real y no error", async ({ page }) => {
  await page.goto("/?summaryScenario=no-payments")
  await expect(page.getByTestId("collected-total")).toContainText("0")
  await expect(page.getByTestId("collected-count")).toContainText("0 cobros confirmados")
})

test("P6-UI08 día sin turnos evita 0/0", async ({ page }) => {
  await page.goto("/?summaryScenario=no-appointments")
  await expect(page.getByTestId("appointments-empty")).toContainText("Sin turnos para hoy")
  await expect(page.getByText("0/0", { exact: true })).toHaveCount(0)
})

test("P6-UI09 sin incidencias muestra un único estado limpio", async ({ page }) => {
  await page.goto("/?summaryScenario=no-incidents")
  await expect(page.getByTestId("attention-empty")).toContainText("Sin situaciones que requieran atención")
  await expect(page.getByTestId("attention-list")).toHaveCount(0)
})

test("P6-UI10 fuente parcial no bloquea dinero ni jornada", async ({ page }) => {
  await page.goto("/?summaryScenario=partial")
  await expect(page.getByText("Fuente inventory no disponible")).toBeVisible()
  await expect(page.getByTestId("collected-total")).toContainText("36.000")
  await expect(page.getByTestId("appointments-progress")).toHaveText("8/12")
})

test("P6-UI11 permisos limitados ocultan importe y conteo sensible", async ({ page }) => {
  await page.goto("/?summaryScenario=restricted")
  await expect(page.getByText("Información restringida", { exact: true })).toBeVisible()
  await expect(page.getByTestId("collected-total")).toHaveCount(0)
  await expect(page.getByTestId("collected-count")).toHaveCount(0)
})

test("P6-UI12 estado stale se identifica sin reemplazar el valor", async ({ page }) => {
  await page.goto("/?summaryScenario=stale")
  await expect(page.getByTestId("collected-total")).toContainText("36.000")
  await expect(page.getByTestId("collected-count")).toContainText("Datos desactualizados")
})

for (const width of [320, 390, 430]) {
  test(`P6-UI viewport ${width}px conserva contenido y sin overflow horizontal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/")
    await expect(page.getByTestId("owner-summary")).toBeVisible()
    const metrics = await page.getByTestId("owner-summary").evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    }))
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
  })
}

test("P6-UI16 retorno conserva scroll de Resumen", async ({ page }) => {
  const summary = page.getByTestId("owner-summary")
  await summary.evaluate((node) => {
    node.scrollTop = 360
    node.dispatchEvent(new Event("scroll", { bubbles: true }))
  })
  const before = await summary.evaluate((node) => node.scrollTop)
  expect(before).toBeGreaterThan(0)
  await page.locator('[data-cause="AT-12"]').click()
  await page.getByRole("button", { name: "Volver" }).click()
  await expect(summary).toBeVisible()
  await expect.poll(() => summary.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
})

test("P6-UI17 reduced motion corta transiciones sin perder navegación", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.reload()
  const transition = await page.locator(".owner-summary-progress span").evaluate((node) => Number.parseFloat(getComputedStyle(node).transitionDuration))
  expect(transition).toBeLessThanOrEqual(0.001)
  await page.getByRole("button", { name: "Ver movimientos" }).click()
  await expect(page.getByTestId("surface-F09")).toBeVisible()
})

test("P6-UI18 no registra errores de consola en la carga y los handoffs principales", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.reload()
  await page.getByRole("button", { name: "Ver movimientos" }).click()
  await page.getByRole("button", { name: "Volver" }).click()
  expect(errors).toEqual([])
})
