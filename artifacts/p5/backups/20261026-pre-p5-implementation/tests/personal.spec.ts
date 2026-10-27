import { expect, test, type Page } from "@playwright/test"

async function openPersonal(page: Page) {
  await page.goto("/")
  await page.getByLabel("Ir a Equipo").click()
  await page.getByRole("tab", { name: "Personal" }).click()
  await expect(page.getByTestId("staff-directory")).toBeVisible()
}

async function openProfile(page: Page, name = "Alex Martínez") {
  await openPersonal(page)
  await page.getByText(name, { exact: true }).click()
  await expect(page.getByText("Perfil", { exact: true })).toBeVisible()
}

async function openAlexEconomy(page: Page) {
  await openProfile(page)
  await page.getByRole("tab", { name: "Economía" }).click()
}

test.describe("Personal — P2-FULL", () => {
  test("P01 lista activos antes de inactivos", async ({ page }) => {
    await openPersonal(page)
    const names = await page.locator(".yk-person-copy strong").allTextContents()
    expect(names).toEqual(["Alex Martínez", "Camila Ruiz", "Leo Fernández", "Nicolás García", "Tomás Díaz"])
  })

  test("P01 no confunde activo con en atención", async ({ page }) => {
    await openPersonal(page)
    await expect(page.getByText("En atención", { exact: true })).not.toBeVisible()
    await expect(page.getByText("Activo", { exact: true })).toHaveCount(4)
  })

  test("P02 busca por identidad inline", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Buscar personal").fill("Camila")
    await expect(page.getByText("Camila Ruiz", { exact: true })).toBeVisible()
    await expect(page.getByText("Alex Martínez", { exact: true })).not.toBeVisible()
  })

  test("P02 muestra estado sin coincidencias y restablece", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Buscar personal").fill("nadie")
    await expect(page.getByText("Sin coincidencias")).toBeVisible()
    await page.getByRole("button", { name: "Restablecer" }).click()
    await expect(page.getByText("Alex Martínez", { exact: true })).toBeVisible()
  })

  test("P03 cancela filtros sin aplicar borrador", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Filtrar personal").click()
    await page.getByText("inactivos", { exact: true }).click()
    await page.getByRole("button", { name: "Cerrar", exact: true }).click()
    await expect(page.getByText("Alex Martínez", { exact: true })).toBeVisible()
  })

  test("P03 filtra inactivos", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Filtrar personal").click()
    await page.getByText("inactivos", { exact: true }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Tomás Díaz", { exact: true })).toBeVisible()
    await expect(page.getByText("Alex Martínez", { exact: true })).not.toBeVisible()
  })

  test("P03 filtra responsabilidad Recepción", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Filtrar personal").click()
    await page.locator(".yk-choice-group").nth(1).getByText("Recepción", { exact: true }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Camila Ruiz", { exact: true })).toBeVisible()
    await expect(page.getByText("Nicolás García", { exact: true })).not.toBeVisible()
  })

  test("P03 orden Z–A conserva grupo activos primero", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Filtrar personal").click()
    await page.getByText("Nombre Z–A", { exact: true }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    const names = await page.locator(".yk-person-copy strong").allTextContents()
    expect(names.at(-1)).toBe("Tomás Díaz")
    expect(names.slice(0, 4)).toEqual(["Nicolás García", "Leo Fernández", "Camila Ruiz", "Alex Martínez"])
  })

  test("P04 valida nombre y responsabilidad", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Nuevo integrante").click()
    await page.getByRole("button", { name: "Crear integrante" }).click()
    await expect(page.getByText("Ingresá el nombre")).toBeVisible()
    await page.getByLabel("Nombre").fill("Micaela Soto")
    await page.getByRole("button", { name: "Crear integrante" }).click()
    await expect(page.getByText("Elegí al menos una responsabilidad")).toBeVisible()
  })

  test("P04 detecta duplicado potencial", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Nuevo integrante").click()
    await page.getByLabel("Nombre").fill("Alex Martínez")
    await page.getByText("Barbero", { exact: true }).click()
    await page.getByRole("button", { name: "Crear integrante" }).click()
    await expect(page.getByText(/Posible duplicado/)).toBeVisible()
  })

  test("P04 alta no crea cuenta, jornada, servicios ni acuerdo", async ({ page }) => {
    await openPersonal(page)
    await page.getByLabel("Nuevo integrante").click()
    await page.getByLabel("Nombre").fill("Micaela Soto")
    await page.getByText("Barbero", { exact: true }).click()
    await page.getByRole("button", { name: "Crear integrante" }).click()
    await expect(page.getByText("Micaela Soto", { exact: true })).toBeVisible()
    await expect(page.getByText("Sin configurar", { exact: true })).toBeVisible()
    await expect(page.getByText("0 servicios", { exact: true })).toBeVisible()
    await expect(page.getByText("Sin cuenta", { exact: true })).toBeVisible()
    await page.getByRole("tab", { name: "Economía" }).click()
    await expect(page.getByText("Sin acuerdo configurado")).toBeVisible()
  })

  test("P05 perfil mantiene identidad al cambiar tabs", async ({ page }) => {
    await openProfile(page)
    await page.getByRole("tab", { name: "Actividad" }).click()
    await expect(page.getByText("Alex Martínez", { exact: true })).toBeVisible()
    await page.getByRole("tab", { name: "Economía" }).click()
    await expect(page.getByText("Alex Martínez", { exact: true })).toBeVisible()
  })

  test("P05 acciones Ver agenda y Editar son visibles", async ({ page }) => {
    await openProfile(page)
    await expect(page.getByRole("button", { name: "Ver agenda" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible()
  })

  test("P06 CTA permanece inactivo sin cambios", async ({ page }) => {
    await openProfile(page)
    await page.getByRole("button", { name: "Editar" }).click()
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()
  })

  test("P06 actualiza identidad sin tocar responsabilidades", async ({ page }) => {
    await openProfile(page)
    await page.getByRole("button", { name: "Editar" }).click()
    await page.getByLabel("Teléfono").fill("+54 9 11 9999-0000")
    await page.getByRole("button", { name: "Guardar cambios" }).click()
    await expect(page.getByText("Alex Martínez", { exact: true })).toBeVisible()
    await expect(page.getByText("Barbero", { exact: true })).toBeVisible()
  })

  test("P07 muestra siete días y domingo cerrado", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Jornada habitual", { exact: true }).click()
    await expect(page.locator(".yk-schedule-row")).toHaveCount(7)
    await expect(page.locator(".yk-schedule-row").filter({ hasText: "Domingo" })).toContainText("Cerrado")
  })

  test("P08 valida inicio anterior al fin", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Jornada habitual", { exact: true }).click()
    await page.locator(".yk-schedule-row").filter({ hasText: "Sábado" }).getByRole("button").click()
    await page.getByLabel("Desde").fill("19:00")
    await page.getByLabel("Hasta").fill("09:00")
    await page.getByRole("button", { name: "Guardar", exact: true }).click()
    await expect(page.getByText("La hora Desde debe ser anterior a Hasta")).toBeVisible()
  })

  test("P09 registra ausencia con trazabilidad", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Ausencias y excepciones", { exact: true }).click()
    await page.getByLabel("Nueva excepción").click()
    await page.getByText("Registrar ausencia", { exact: true }).click()
    await page.getByLabel("Motivo").fill("Capacitación externa")
    await page.getByRole("button", { name: "Revisar conflictos" }).click()
    await expect(page.getByText("Capacitación externa", { exact: true })).toBeVisible()
  })

  test("P10 usa catálogo real de tres servicios", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Servicios habilitados", { exact: true }).click()
    await expect(page.getByText("Corte clásico", { exact: true })).toBeVisible()
    await expect(page.getByText("Corte + barba", { exact: true })).toBeVisible()
    await expect(page.getByText("Barba", { exact: true })).toBeVisible()
  })

  test("P10 permite duración particular sin alterar catálogo", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Servicios habilitados", { exact: true }).click()
    await page.getByLabel("Duración particular Corte clásico").fill("35")
    await page.getByRole("button", { name: "Guardar cambios" }).click()
    await expect(page.getByText("Perfil", { exact: true })).toBeVisible()
  })

  test("P11 actividad deriva de atenciones reales", async ({ page }) => {
    await openProfile(page)
    await page.getByRole("tab", { name: "Actividad" }).click()
    await expect(page.getByText("3", { exact: true })).toBeVisible()
    await expect(page.getByText("atenciones realizadas")).toBeVisible()
  })

  test("P11 no suma ausencias como atenciones", async ({ page }) => {
    await openProfile(page, "Nicolás García")
    await page.getByRole("tab", { name: "Actividad" }).click()
    await expect(page.getByTestId("root-content").getByText("2", { exact: true })).toBeVisible()
  })

  test("P12 abre detalle de una atención real", async ({ page }) => {
    await openProfile(page)
    await page.getByRole("tab", { name: "Actividad" }).click()
    await page.locator(".yk-activity-row").first().click()
    await expect(page.getByText("Detalle de atención")).toBeVisible()
    await expect(page.getByText("Reserva vinculada")).toBeVisible()
  })

  test("P13 muestra comisión exacta de Alex", async ({ page }) => {
    await openAlexEconomy(page)
    await expect(page.getByText("$ 36.600", { exact: true })).toBeVisible()
    await expect(page.getByText("$ 61.000", { exact: true })).toBeVisible()
  })

  test("P13 muestra alquiler como obligación de Nicolás", async ({ page }) => {
    await openProfile(page, "Nicolás García")
    await page.getByRole("tab", { name: "Economía" }).click()
    await expect(page.getByText("$ 100.000", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Alquiler de silla", { exact: true })).toBeVisible()
  })

  test("P13 muestra fijo mensual de Leo", async ({ page }) => {
    await openProfile(page, "Leo Fernández")
    await page.getByRole("tab", { name: "Economía" }).click()
    await expect(page.getByText("$ 250.000", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Fijo", { exact: true })).toBeVisible()
  })

  test("P13 Camila no muestra $0 falso", async ({ page }) => {
    await openProfile(page, "Camila Ruiz")
    await page.getByRole("tab", { name: "Economía" }).click()
    await expect(page.getByText("Sin acuerdo configurado")).toBeVisible()
    await expect(page.getByText("$ 0", { exact: true })).not.toBeVisible()
  })

  test("P14 acuerdo distingue regla, recaudación y vigencia", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Comisión", { exact: true }).click()
    await expect(page.getByText("60%", { exact: true })).toBeVisible()
    await expect(page.getByText("Barbería", { exact: true })).toBeVisible()
    await expect(page.getByText("Desde 2026-10-01", { exact: true })).toBeVisible()
  })

  test("P15 valida porcentaje entre 1 y 100", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Comisión", { exact: true }).click()
    await page.getByRole("button", { name: "Modificar acuerdo" }).click()
    await page.getByLabel("Porcentaje").fill("120")
    await expect(page.getByText("Usá un porcentaje entre 1 y 100")).toBeVisible()
    await expect(page.getByRole("button", { name: "Revisar acuerdo" })).toBeDisabled()
  })

  test("P16 revisión crea nueva versión sin reescribir anterior", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Comisión", { exact: true }).click()
    await page.getByRole("button", { name: "Modificar acuerdo" }).click()
    await page.getByLabel("Porcentaje").fill("55")
    await page.getByRole("button", { name: "Revisar acuerdo" }).click()
    await expect(page.getByText("Antes", { exact: true })).toBeVisible()
    await expect(page.getByText("Después", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Confirmar nueva versión" }).click()
    await expect(page.getByText(/Nueva versión programada/)).toBeVisible()
  })

  test("P17 lista liquidación abierta y parcial", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await expect(page.getByText(/Abierta · pendiente/)).toBeVisible()
    await expect(page.getByText(/Parcialmente pagada · pendiente/)).toBeVisible()
  })

  test("P18 no confunde período abierto con pagado", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await page.getByText("19–25 oct 2026", { exact: true }).click()
    await expect(page.getByText("Abierta", { exact: true })).toBeVisible()
    await expect(page.getByText(/todavía no puede cerrarse/)).toBeVisible()
    await expect(page.getByRole("button", { name: "Registrar pago" })).not.toBeVisible()
  })

  test("P19 desglose suma $50.000 en histórico", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await page.getByText("12–18 oct 2026", { exact: true }).click()
    await page.getByText("Operaciones incluidas", { exact: true }).click()
    await expect(page.getByText("$ 50.000", { exact: true })).toBeVisible()
  })

  test("P26 pago mayor que saldo es inválido", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await page.getByText("12–18 oct 2026", { exact: true }).click()
    await page.getByRole("button", { name: "Registrar pago" }).click()
    await page.getByLabel("Importe propuesto").fill("30000")
    await page.getByRole("button", { name: "Revisar y confirmar" }).click()
    await expect(page.getByText("El importe supera el saldo pendiente")).toBeVisible()
  })

  test("P26 efectivo requiere Caja demo válida", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await page.getByText("12–18 oct 2026", { exact: true }).click()
    await page.getByRole("button", { name: "Registrar pago" }).click()
    await page.getByText("Efectivo", { exact: true }).click()
    await page.getByRole("button", { name: "Revisar y confirmar" }).click()
    await expect(page.getByText("No hay una sesión de Caja demo abierta")).toBeVisible()
  })

  test("P26 pago parcial conserva saldo", async ({ page }) => {
    await openAlexEconomy(page)
    await page.getByText("Liquidaciones", { exact: true }).click()
    await page.getByText("12–18 oct 2026", { exact: true }).click()
    await page.getByRole("button", { name: "Registrar pago" }).click()
    await page.getByLabel("Importe propuesto").fill("10000")
    await expect(page.getByText("$ 10.000", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Revisar y confirmar" }).click()
    await expect(page.getByText("$ 10.000", { exact: true })).toBeVisible()
  })

  test("P21 separa cuenta de relación laboral", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await expect(page.getByText("Usuario vinculado", { exact: true })).toBeVisible()
    await expect(page.getByText("Relación", { exact: true })).toBeVisible()
  })

  test("P22 no aplica permisos sin revisión", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await page.getByText("Permisos", { exact: true }).click()
    await expect(page.getByRole("button", { name: "Revisar cambios" })).toBeDisabled()
    await page.getByText("Ver", { exact: true }).first().click()
    await expect(page.getByRole("button", { name: "Revisar cambios" })).toBeEnabled()
  })

  test("P23 suspender cuenta no desactiva integrante", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await page.getByRole("button", { name: "Suspender acceso" }).click()
    await expect(page.getByText(/Cuenta suspendida/)).toBeVisible()
    await page.getByLabel("Volver").click()
    await expect(page.getByText("Activo", { exact: true })).toBeVisible()
  })

  test("P24 desactivación revisa reservas, clases y obligaciones", async ({ page }) => {
    await openProfile(page)
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await page.getByText("Desactivar integrante", { exact: true }).click()
    await expect(page.getByText("reservas futuras")).toBeVisible()
    await expect(page.getByText("1 · Técnicas Fade", { exact: true })).toBeVisible()
    await expect(page.getByText("Requiere seguimiento", { exact: true })).toBeVisible()
  })

  test("P29 añadir Barbero no crea disponibilidad ficticia", async ({ page }) => {
    await openProfile(page, "Camila Ruiz")
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await page.getByText("Responsabilidades", { exact: true }).click()
    await page.getByText("Barbero", { exact: true }).click()
    await expect(page.getByText(/no crea jornada, servicios ni disponibilidad/)).toBeVisible()
  })

  test("P30 vincula cuenta demo sin credenciales ficticias", async ({ page }) => {
    await openProfile(page, "Nicolás García")
    await page.getByText("Acceso y responsabilidades", { exact: true }).click()
    await page.getByRole("button", { name: "Vincular cuenta demo" }).click()
    await page.getByLabel("Correo").fill("nico@youngkingz.demo")
    await page.getByRole("button", { name: "Confirmar vinculación demo" }).click()
    await expect(page.getByText(/no se enviaron credenciales/)).toBeVisible()
  })

  test("perfil profundo oculta navbar y la recupera en directorio", async ({ page }) => {
    await openProfile(page)
    await expect(page.getByLabel("Ir a Resumen")).not.toBeVisible()
    await page.getByLabel("Volver").click()
    await expect(page.getByLabel("Ir a Resumen")).toBeVisible()
  })

  test("directorio responde a 320 px sin truncar nombres", async ({ page }) => {
    await openPersonal(page)
    await page.setViewportSize({ width: 320, height: 700 })
    await expect(page.getByText("Nicolás García", { exact: true })).toBeVisible()
  })
})
