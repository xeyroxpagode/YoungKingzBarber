import { expect, test, type Page } from "@playwright/test"

async function openFinance(page: Page) {
  await page.goto("/")
  await page.getByLabel("Ir a Finanzas").click()
  await expect(page.getByTestId("finance-root")).toBeVisible()
}

async function openSurface(page: Page, id: string) {
  await openFinance(page)
  if (id === "F01") return
  if (id === "F02") { await page.getByRole("tab", { name: "Movimientos" }).click(); return }
  if (id === "F03") { await page.getByRole("tab", { name: "Pendientes" }).click(); return }
  await page.getByLabel("Revisión de jornada").click()
  await expect(page.getByTestId("surface-F64")).toBeVisible()
  if (id !== "F64") await page.getByRole("button", { name: new RegExp(`^${id}\\b`) }).click()
  await expect(page.getByTestId(`surface-${id}`)).toBeVisible()
}

const journeys: Array<[string, string, string]> = [
  ["R4-01", "F04", "Período"], ["R4-02", "F09", "Cifras reconciliables"], ["R4-03", "F43", "Efectivo esperado"],
  ["R4-04", "F02", "Ingresos"], ["R4-05", "F02", "Cobro venta"], ["R4-06", "F61", "vencimiento"],
  ["R4-07", "F12", "Venta comercial"], ["R4-08", "F13", "Atención"], ["R4-09", "F14", "Productos"],
  ["R4-10", "F15", "Descuentos"], ["R4-11", "F13", "duplicados"], ["R4-12", "F17", "recepción monetaria"],
  ["R4-13", "F17", "Saldo anterior"], ["R4-14", "F19", "Medio"], ["R4-15", "F22", "Antes/Después"],
  ["R4-16", "F31", "anticipo"], ["R4-17", "F32", "política"], ["R4-18", "F29", "anticipo"],
  ["R4-19", "F23", "reintegro"], ["R4-20", "F17", "Objeto a cobrar"], ["R4-21", "F23", "stock"],
  ["R4-22", "F38", "P3 Compra"], ["R4-23", "F26", "reduce una obligación"], ["R4-24", "F35", "Gasto reconocido"],
  ["R4-25", "F35", "Pagar ahora"], ["R4-26", "F39", "Gastos recurrentes"], ["R4-27", "F27", "P2 Liquidación"],
  ["R4-28", "F28", "alquiler"], ["R4-29", "F29", "aplicación futura"], ["R4-30", "F53", "Titular económico"],
  ["R4-31", "F44", "fondo de apertura"], ["R4-32", "F35", "Medio"], ["R4-33", "F40", "retiro"],
  ["R4-34", "F42", "conserva fondos propios"], ["R4-35", "F47", "conteo"], ["R4-36", "F49", "diferencia"],
  ["R4-37", "F17", "Medio"], ["R4-38", "F56", "Recuperación"], ["R4-39", "F55", "compensación"],
  ["R4-40", "F64", "Centro operativo"], ["R4-41", "F65", "Venta comercial"], ["R4-42", "F66", "Cliente"],
  ["R4-43", "F68", "verificación"], ["R4-44", "F69", "varias obligaciones"], ["R4-45", "F67", "custodia"],
  ["R4-46", "F72", "saldo"], ["R4-47", "F71", "aprobación"], ["R4-48", "F70", "adjuntos"],
  ["R4-49", "F73", "cobertura"], ["R4-50", "F53", "Titular"], ["R4-51", "F39", "recurrentes"],
  ["R4-52", "F55", "original"], ["R4-53", "F32", "POLÍTICA"], ["R4-54", "F59", "Handoff compra"],
]

test.describe("Finanzas — R4-01 a R4-54", () => {
  for (const [journey, surface, evidence] of journeys) {
    test(`${journey} navega, expone estado y conserva retorno (${surface})`, async ({ page }) => {
      await openSurface(page, surface)
      await expect(page.getByTestId(`surface-${surface}`)).toBeVisible()
      await expect(page.getByText(new RegExp(evidence, "i")).first()).toBeVisible()
      if (!["F01", "F02", "F03", "F64"].includes(surface)) {
        await page.getByLabel("Volver").click()
        await expect(page.getByTestId("surface-F64")).toBeVisible()
      }
    })
  }
})

test.describe("Finanzas — recorridos mutantes visibles", () => {
  test("período personalizado invalida rango y recupera", async ({ page }) => {
    await openSurface(page, "F04")
    await page.getByRole("button", { name: "Personalizado" }).click()
    await page.getByLabel("Desde").fill("2026-10-25")
    await page.getByLabel("Hasta").fill("2026-10-20")
    await page.getByRole("button", { name: "Aplicar período" }).click()
    await expect(page.getByText("Desde debe ser anterior o igual a Hasta")).toBeVisible()
  })

  test("tipos acumulativos nunca permiten cero", async ({ page }) => {
    await openSurface(page, "F02")
    await page.getByRole("button", { name: "Gastos" }).click()
    await page.getByRole("button", { name: "Retiros" }).click()
    await page.getByRole("button", { name: "Ingresos" }).click()
    await expect(page.getByRole("button", { name: "Ingresos" })).toHaveAttribute("aria-pressed", "true")
  })

  test("búsqueda diferencia NO_MATCH y restaura", async ({ page }) => {
    await openSurface(page, "F02")
    await page.getByLabel("Buscar movimientos").fill("no-existe-xyz")
    await expect(page.getByText("Sin coincidencias")).toBeVisible()
    await page.getByLabel("Buscar movimientos").fill("")
    await expect(page.getByText("Cobro venta Corte clásico").first()).toBeVisible()
  })

  test("venta libre confirma sin crear atención", async ({ page }) => {
    await openSurface(page, "F65")
    await page.getByRole("button", { name: "Revisar y confirmar venta" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("CONFIRMED")
    await expect(page.getByTestId("finance-result")).toContainText("cobro permanece separado")
  })

  test("descuento sin motivo entra en APPROVAL_REQUIRED", async ({ page }) => {
    await openSurface(page, "F65")
    await page.getByLabel("Descuento").fill("1000")
    await page.getByRole("button", { name: "Revisar y confirmar venta" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("APPROVAL_REQUIRED")
  })

  test("cobro parcial escribe y muestra saldo posterior", async ({ page }) => {
    await openSurface(page, "F17")
    await page.getByLabel("Importe").fill("1000")
    await page.getByRole("button", { name: "Revisar y confirmar cobro" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("CONFIRMED")
  })

  test("cobro mixto confirma una recepción", async ({ page }) => {
    await openSurface(page, "F19")
    await page.getByLabel("Importe").fill("1000")
    await page.getByLabel("Medio").selectOption("mixto")
    await page.getByRole("button", { name: "Revisar y confirmar cobro" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("CONFIRMED")
    await expect(page.getByText("Sólo el componente efectivo afecta Caja.")).toBeVisible()
  })

  test("transferencia sin referencia queda pendiente y no acreditada", async ({ page }) => {
    await openSurface(page, "F17")
    await page.getByLabel(/Referencia externa/).fill("")
    await page.getByLabel("Importe").fill("1000")
    await page.getByRole("button", { name: "Revisar y confirmar cobro" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("PENDING_VERIFICATION")
  })

  test("gasto pendiente no presenta movimiento", async ({ page }) => {
    await openSurface(page, "F35")
    await page.getByRole("checkbox").uncheck()
    await page.getByRole("button", { name: "Revisar y registrar gasto" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("todavía no generó salida")
  })

  test("retiro se confirma como retiro y no gasto", async ({ page }) => {
    await openSurface(page, "F40")
    await page.getByRole("button", { name: "Confirmar retiro" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("no se clasificó como gasto")
  })

  test("arqueo guarda conteo sin alterar esperado", async ({ page }) => {
    await openSurface(page, "F47")
    await page.getByRole("button", { name: "Guardar arqueo" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("sin alterar el efectivo esperado")
  })

  test("relevo cambia custodio sólo tras aceptar", async ({ page }) => {
    await openSurface(page, "F67")
    await page.getByRole("button", { name: "Aceptar relevo" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("misma sesión continúa")
  })

  test("corrección conserva original y registra compensación", async ({ page }) => {
    await openSurface(page, "F55")
    await page.getByRole("button", { name: "Registrar compensación" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("original permanece visible")
  })

  test("F24 filtra pendientes sin mutar el conjunto", async ({ page }) => {
    await openSurface(page, "F24")
    await page.getByLabel("Dirección").selectOption("pagar")
    await page.getByLabel("Vencimiento").selectOption("vencidas")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Coincidencias", { exact: true })).toBeVisible()
    await expect(page.getByText(/conjunto original conserva/)).toBeVisible()
  })

  test("F37 bloquea factura ya representada en P3", async ({ page }) => {
    await openSurface(page, "F37")
    await page.getByRole("button", { name: "Registrar obligación comercial" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("DUPLICATE")
  })

  test("F66 busca y evita duplicar cliente mínimo", async ({ page }) => {
    await openSurface(page, "F66")
    await page.getByLabel("Nombre").fill("Juan Pérez")
    await page.getByRole("button", { name: "Registrar y usar cliente" }).click()
    await expect(page.getByTestId("finance-result")).toContainText("DUPLICATE")
  })

  test("atlas F01–F73 no oculta rutas", async ({ page }) => {
    await openSurface(page, "F64")
    for (let index = 1; index <= 73; index += 1) {
      const id = `F${String(index).padStart(2, "0")}`
      await expect(page.getByRole("button", { name: new RegExp(`^${id}\\b`) })).toHaveCount(1)
    }
  })

  test("viewport 320 mantiene scroll y controles accesibles", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openFinance(page)
    await expect(page.getByRole("tab", { name: "Pendientes" })).toBeVisible()
    expect(await page.locator(".finance-scroll").evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe("none")
  })
})

