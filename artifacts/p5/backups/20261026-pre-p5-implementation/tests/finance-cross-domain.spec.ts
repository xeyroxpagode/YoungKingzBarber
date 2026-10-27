import { expect, test, type Page } from "@playwright/test"

async function openPersonal(page: Page, name: string) {
  await page.goto("/")
  await page.getByLabel("Ir a Equipo").click()
  await page.getByRole("tab", { name: "Personal" }).click()
  await page.getByText(name, { exact: true }).click()
  await page.getByRole("tab", { name: "Economía" }).click()
  await page.getByText("Liquidaciones", { exact: true }).click()
}

test.describe("P4 · recorridos cruzados P2/P3", () => {
  test("P2 liquidación histórica entrega identidad a F27 y vuelve a Equipo", async ({ page }) => {
    await openPersonal(page, "Alex Martínez")
    await page.getByText("12–18 oct 2026", { exact: true }).click()
    await page.getByText("Gestionar en Finanzas", { exact: true }).click()
    await expect(page.getByTestId("surface-F27")).toBeVisible()
    await expect(page.getByText("LIQ-ALEX-2026-42", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: /Volver/ }).click()
    await expect(page.getByLabel("Ir a Equipo")).toHaveAttribute("aria-selected", "true")
  })

  test("P2 alquiler conserva dirección por cobrar en F28", async ({ page }) => {
    await openPersonal(page, "Nicolás García")
    await page.getByText("19–25 oct 2026", { exact: true }).click()
    await page.getByText("Gestionar en Finanzas", { exact: true }).click()
    await expect(page.getByTestId("surface-F28")).toBeVisible()
    await expect(page.getByText("OBL-NICO-2026-43", { exact: true })).toBeVisible()
    await expect(page.getByText(/por cobrar/i)).toBeVisible()
  })

  test("P3 compra entrega obligación existente a F38 y vuelve a Inventario", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Ir a Inventario").click()
    await page.getByText("Explorar operaciones y registros").click()
    await page.getByText("Recibir mercadería", { exact: true }).click()
    await page.getByText("Vincular compra", { exact: true }).click()
    await page.getByRole("button", { name: "Continuar obligación en Finanzas" }).click()
    await expect(page.getByTestId("surface-F38")).toBeVisible()
    await expect(page.getByText(/PUR-901/)).toBeVisible()
    await page.getByRole("button", { name: /Volver/ }).click()
    await expect(page.getByLabel("Ir a Inventario")).toHaveAttribute("aria-selected", "true")
  })
})
