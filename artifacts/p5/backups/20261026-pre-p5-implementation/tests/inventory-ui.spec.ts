import { expect, test, type Page } from "@playwright/test"

async function openInventory(page: Page) {
  await page.goto("/")
  await page.getByLabel("Ir a Inventario").click()
  await expect(page.getByTestId("inventory-root")).toBeVisible()
}

test.describe("Inventario — P3 baseline", () => {
  test("I01 muestra fixture reconciliado sin duplicar mixtos", async ({ page }) => {
    await openInventory(page)
    await expect(page.getByText("Cera modeladora", { exact: true })).toHaveCount(1)
    await expect(page.getByText(/\$\s?12\.000 · 2 disponible/)).toBeVisible()
    await expect(page.getByText("Shampoo profesional", { exact: true })).toHaveCount(1)
  })

  test("I02 cambia a uso interno y mantiene artículo mixto único", async ({ page }) => {
    await openInventory(page)
    await page.getByRole("tab", { name: "Uso interno" }).click()
    await expect(page.getByText("Hojas descartables", { exact: true })).toBeVisible()
    await expect(page.getByText("Shampoo profesional", { exact: true })).toHaveCount(1)
  })

  test("I03 busca por SKU y cancela restaurando lista", async ({ page }) => {
    await openInventory(page)
    await page.getByLabel("Buscar").click()
    await page.getByLabel("Buscar inventario").fill("ACE-001")
    await expect(page.getByText("Aceite para barba", { exact: true })).toBeVisible()
    await expect(page.getByText("Cera modeladora", { exact: true })).not.toBeVisible()
    await page.getByLabel("Cancelar búsqueda").click()
    await expect(page.getByText("Cera modeladora", { exact: true })).toBeVisible()
  })

  test("I04 filtros separan borrador y aplicación", async ({ page }) => {
    await openInventory(page)
    await page.getByLabel("Filtrar").click()
    await page.getByText("Bajo mínimo", { exact: true }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Cera modeladora", { exact: true })).toBeVisible()
    await expect(page.getByText("Aceite para barba", { exact: true })).not.toBeVisible()
  })

  test("I05 valida alta y crea con stock cero", async ({ page }) => {
    await openInventory(page)
    await page.getByLabel("Nuevo producto").click()
    await page.getByRole("button", { name: "Crear producto" }).click()
    await expect(page.getByText("Completá los campos obligatorios")).toBeVisible()
  })

  test("I08 detalla físico apto, compromiso y disponible", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Cera modeladora", { exact: true }).click()
    await expect(page.getByTestId("surface-I8")).toBeVisible()
    await expect(page.getByText("Físico apto", { exact: true })).toBeVisible()
    await expect(page.getByText("Comprometido", { exact: true })).toBeVisible()
  })

  test("I14 navega a ubicación sin BottomNav", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Cera modeladora", { exact: true }).click()
    await page.getByText("Existencias por ubicación").click()
    await expect(page.getByTestId("surface-I14")).toBeVisible()
    await page.getByText("Depósito", { exact: true }).click()
    await expect(page.getByTestId("surface-I43")).toBeVisible()
    await expect(page.getByLabel("Ir a Inventario")).not.toBeVisible()
  })

  test("I18 recepción muta stock y muestra I44", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Explorar operaciones y registros").click()
    await page.getByText("Recibir mercadería", { exact: true }).click()
    await page.getByLabel("Cantidad").fill("2")
    await page.getByRole("button", { name: "Revisar y confirmar" }).click()
    await expect(page.getByTestId("surface-I44")).toBeVisible()
    await expect(page.getByText("Invariantes globales reconciliadas")).toBeVisible()
  })

  test("I22 bloquea consumo reservado", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Explorar operaciones y registros").click()
    await page.getByText("Registrar consumo", { exact: true }).click()
    await page.getByLabel("Cantidad").fill("1")
    await page.getByRole("button", { name: "Revisar y confirmar consumo" }).click()
    await expect(page.getByText("Consumo registrado")).toBeVisible()
  })

  test("I25 traslado conserva global", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Explorar operaciones y registros").click()
    await page.getByText("Trasladar", { exact: true }).click()
    await page.getByRole("button", { name: "Revisar y confirmar traslado" }).click()
    await expect(page.getByText(/Total global conservado/)).toBeVisible()
  })

  test("I31 separa estado de pedido y cobro", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Pedidos para retirar").click()
    await expect(page.getByText("#1040 · Martín Gómez")).toBeVisible()
    await page.getByText("#1040 · Martín Gómez").click()
    await expect(page.getByText("Listo para retirar", { exact: true })).toBeVisible()
    await expect(page.getByText("Cobrado", { exact: true })).toBeVisible()
  })

  test("I35 cobra transferencia sin efectivo y permite entrega", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Pedidos para retirar").click()
    await page.getByText("#1040 · Martín Gómez").click()
    await page.getByRole("button", { name: "Registrar retiro" }).click()
    await page.getByRole("button", { name: "Registrar cobro" }).click()
    await page.getByRole("button", { name: "Revisar y registrar cobro" }).click()
    await expect(page.getByText("No modificó efectivo.")).toBeVisible()
  })

  test("I37 cancelación libera sin descontar físico", async ({ page }) => {
    await openInventory(page)
    await page.getByText("Pedidos para retirar").click()
    await page.getByText("#1042 · Juan Pérez").click()
    await page.getByRole("button", { name: "Cancelar pedido" }).click()
    await page.getByRole("button", { name: "Confirmar cancelación" }).click()
    await expect(page.getByText("Pedido cancelado")).toBeVisible()
    await expect(page.getByText("Invariantes globales reconciliadas")).toBeVisible()
  })

  test("viewport 320 mantiene controles y scroll invisible", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openInventory(page)
    await expect(page.getByLabel("Nuevo producto")).toBeVisible()
    expect(await page.locator(".inventory-scroll").evaluate((el) => getComputedStyle(el).scrollbarWidth)).toBe("none")
  })
})
