import { expect, test, type Page } from "@playwright/test"

async function openAgenda(page: Page) {
  await page.goto("/")
  await page.getByLabel("Ir a Equipo").click()
  await expect(page.getByRole("tab", { name: "Agenda" })).toHaveAttribute("aria-selected", "true")
}

async function selectBookingBase(page: Page) {
  await page.getByLabel("Nuevo turno").click()
  await page.getByRole("button", { name: "Seleccionar servicio" }).click()
  await page.getByText("Corte clásico", { exact: true }).last().click()
  await page.getByRole("button", { name: "Seleccionar profesional" }).click()
  await page.getByText("Alex Martínez", { exact: true }).last().click()
  await page.getByRole("button", { name: "Seleccionar disponibilidad" }).click()
  await page.getByRole("button", { name: "15:00" }).click()
  await page.getByRole("button", { name: "Seleccionar horario" }).click()
}

test.describe("Agenda — P2-FULL", () => {
  test.beforeEach(async ({ page }) => openAgenda(page))

  test("A01 carga exactamente las doce reservas del escenario", async ({ page }) => {
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
    await expect(page.getByText("12 turnos")).toBeVisible()
    await expect(page.locator("button").filter({ hasText: /Juan Pérez/ })).toBeVisible()
    await expect(page.locator("button").filter({ hasText: /Franco Molina/ })).toBeVisible()
  })

  test("A01 conserva estados canónicos sin confundir atención y activo", async ({ page }) => {
    await expect(page.getByText("En atención", { exact: true })).toBeVisible()
    await expect(page.getByText("Ausente", { exact: true })).toBeVisible()
    await expect(page.getByText("Cancelado", { exact: true })).toBeVisible()
  })

  test("A01 navega días con fecha en una sola línea", async ({ page }) => {
    await page.getByLabel("Día siguiente").click()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("DOM 25 OCT")
    await expect(page.getByText("Sin turnos")).toBeVisible()
    await page.getByLabel("Día anterior").click()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
  })

  test("A03 selecciona fecha desde calendario anclado", async ({ page }) => {
    await page.getByLabel("Seleccionar fecha").click()
    await expect(page.getByText("OCT 2026")).toBeVisible()
    await page.getByText("26", { exact: true }).click()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("LUN 26 OCT")
    await expect(page.getByText("3 turnos")).toBeVisible()
  })

  test("A03 Escape cierra calendario sin cambiar la fecha", async ({ page }) => {
    await page.getByLabel("Seleccionar fecha").click()
    await page.keyboard.press("Escape")
    await expect(page.getByText("OCT 2026")).not.toBeVisible()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
  })

  test("A04 busca por cliente inline", async ({ page }) => {
    await page.getByLabel("Buscar").click()
    await page.getByPlaceholder("Buscar turno o cliente").fill("Juan")
    await expect(page.getByText("Juan Pérez", { exact: true })).toBeVisible()
    await expect(page.getByText("Martín Gómez", { exact: true })).not.toBeVisible()
  })

  test("A04 busca por profesional y servicio", async ({ page }) => {
    await page.getByLabel("Buscar").click()
    await page.getByPlaceholder("Buscar turno o cliente").fill("Barba")
    await expect(page.getByText("Martín Gómez", { exact: true })).toBeVisible()
    await page.getByPlaceholder("Buscar turno o cliente").fill("Leo")
    await expect(page.getByText("Lucas Fernández", { exact: true })).toBeVisible()
  })

  test("A04 diferencia sin coincidencias de un día vacío", async ({ page }) => {
    await page.getByLabel("Buscar").click()
    await page.getByPlaceholder("Buscar turno o cliente").fill("no-existe")
    await expect(page.getByText("Sin resultados")).toBeVisible()
    await expect(page.getByRole("button", { name: "Limpiar filtros" })).toBeVisible()
  })

  test("A05 mantiene borrador separado al cerrar filtros", async ({ page }) => {
    await page.getByLabel("Abrir filtros").click()
    await page.getByText("Grilla", { exact: true }).click()
    await page.getByRole("button", { name: "Cerrar", exact: true }).click()
    await expect(page.getByText("Juan Pérez", { exact: true })).toBeVisible()
  })

  test("A05 filtra por profesional", async ({ page }) => {
    await page.getByLabel("Abrir filtros").click()
    await page.getByText("Alex Martínez", { exact: true }).last().click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Juan Pérez", { exact: true })).toBeVisible()
    await expect(page.getByText("Martín Gómez", { exact: true })).not.toBeVisible()
  })

  test("A05 filtra por estado", async ({ page }) => {
    await page.getByLabel("Abrir filtros").click()
    await page.getByText("Confirmado", { exact: true }).last().click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Clara Ruiz", { exact: true })).toBeVisible()
    await expect(page.getByText("Juan Pérez", { exact: true })).not.toBeVisible()
  })

  test("A05 restablece filtros aplicados", async ({ page }) => {
    await page.getByLabel("Abrir filtros").click()
    await page.getByText("Confirmado", { exact: true }).last().click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await page.getByLabel("Abrir filtros").click()
    await page.getByRole("button", { name: "Restablecer" }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("12 turnos")).toBeVisible()
  })

  test("A02 activa grilla desde filtros", async ({ page }) => {
    await page.getByLabel("Abrir filtros").click()
    await page.getByText("Grilla", { exact: true }).click()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
    await expect(page.getByTestId("agenda-grid")).toBeVisible()
  })

  test("A06 abre detalle con horario protagonista e historial", async ({ page }) => {
    await page.getByText("Juan Pérez", { exact: true }).click()
    await expect(page.getByText("Detalle del turno")).toBeVisible()
    await expect(page.getByText("09:00 – 09:30")).toBeVisible()
    await expect(page.getByText("Historial de la reserva")).toBeVisible()
  })

  test("A06 finalizado sólo ofrece consulta", async ({ page }) => {
    await page.getByText("Juan Pérez", { exact: true }).click()
    await expect(page.getByRole("button", { name: "Ver atención" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Finalizar atención" })).not.toBeVisible()
  })

  test("A06 en atención permite finalizar una sola vez", async ({ page }) => {
    await page.getByText("Mauro Díaz", { exact: true }).click()
    await page.getByRole("button", { name: "Finalizar atención" }).click()
    await expect(page.getByText("Atención finalizada")).toBeVisible()
  })

  test("A07 es un formulario único y no un wizard", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await expect(page.getByRole("button", { name: "Seleccionar servicio" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Elegí un servicio primero" })).toBeDisabled()
    await expect(page.getByRole("button", { name: "Seleccionar disponibilidad" })).toBeDisabled()
    await expect(page.getByRole("button", { name: "Buscar o registrar cliente" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Continuar" })).not.toBeVisible()
  })

  test("A08 servicio es un bottom sheet sin desactivados", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByRole("button", { name: "Seleccionar servicio" }).click()
    await expect(page.getByText("Corte clásico", { exact: true }).last()).toBeVisible()
    await expect(page.getByText("Corte + barba", { exact: true }).last()).toBeVisible()
    await expect(page.getByRole("button", { name: "Guardar" })).not.toBeVisible()
  })

  test("A09 no ofrece recepción ni inactivos como profesionales", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByRole("button", { name: "Seleccionar servicio" }).click()
    await page.getByText("Corte clásico", { exact: true }).last().click()
    await page.getByRole("button", { name: "Seleccionar profesional" }).click()
    await expect(page.getByText("Camila Ruiz", { exact: true })).not.toBeVisible()
    await expect(page.getByText("Tomás Díaz", { exact: true })).not.toBeVisible()
  })

  test("A10 ofrece inicios cada quince minutos respetando duración", async ({ page }) => {
    await selectBookingBase(page)
    await expect(page.getByText("Resumen contextual")).toBeVisible()
    await expect(page.getByText(/SÁB 24 OCT · 15:00–15:30/)).toBeVisible()
  })

  test("A10 cambiar día recalcula disponibilidad", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByRole("button", { name: "Seleccionar servicio" }).click()
    await page.getByText("Corte clásico", { exact: true }).last().click()
    await page.getByRole("button", { name: "Seleccionar profesional" }).click()
    await page.getByText("Alex Martínez", { exact: true }).last().click()
    await page.getByRole("button", { name: "Seleccionar disponibilidad" }).click()
    await page.getByLabel("Día").fill("2026-10-26")
    await expect(page.getByRole("button", { name: "08:00" })).toBeVisible()
  })

  test("A11 busca cliente conservando el borrador", async ({ page }) => {
    await selectBookingBase(page)
    await page.getByRole("button", { name: "Buscar o registrar cliente" }).click()
    await page.getByLabel("Buscar cliente").fill("Juan")
    await page.getByText("Juan Pérez", { exact: true }).click()
    await expect(page.getByText(/SÁB 24 OCT · 15:00–15:30/)).toBeVisible()
    await expect(page.getByText("Juan Pérez", { exact: true }).first()).toBeVisible()
  })

  test("A11 detecta duplicado potencial sin fusionar automáticamente", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByRole("button", { name: "Buscar o registrar cliente" }).click()
    await page.getByLabel("Nuevo cliente").click()
    await page.getByLabel("Nombre").fill("Juan Pérez")
    await page.getByRole("button", { name: "Crear y seleccionar" }).click()
    await expect(page.getByText(/Coincidencia posible: Juan Pérez/)).toBeVisible()
  })

  test("A07 valida faltantes mediante reflow", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByRole("button", { name: "Confirmar turno" }).click()
    await expect(page.getByRole("alert")).toHaveText(/Completá servicio/)
  })

  test("A07 crea una reserva única tras revalidar disponibilidad", async ({ page }) => {
    await selectBookingBase(page)
    await page.getByRole("button", { name: "Buscar o registrar cliente" }).click()
    await page.getByLabel("Buscar cliente").fill("Juan Pérez")
    await page.getByText("Juan Pérez", { exact: true }).click()
    await page.getByRole("button", { name: "Confirmar turno" }).click()
    await expect(page.getByText("Turno creado")).toBeVisible()
  })

  test("A16 ofrece atención presencial sin crear reserva", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await page.getByText("Registrar atención presencial", { exact: true }).click()
    await expect(page.getByText("Atención presencial")).toBeVisible()
  })

  test("A12 edita observaciones sin reprogramar", async ({ page }) => {
    await page.getByText("Clara Ruiz", { exact: true }).click()
    await page.getByRole("button", { name: "Editar" }).click()
    await page.getByPlaceholder("Notas opcionales").fill("Cliente prefiere corte bajo")
    await page.getByRole("button", { name: "Guardar cambios" }).click()
    await expect(page.getByText("Turno actualizado")).toBeVisible()
  })

  test("A13 reprograma conservando el ID funcional", async ({ page }) => {
    await page.getByText("Clara Ruiz", { exact: true }).click()
    await page.getByRole("button", { name: "Reprogramar" }).click()
    await page.getByPlaceholder("HH:mm").fill("15:00")
    await page.getByRole("button", { name: "Confirmar reprogramación" }).click()
    await expect(page.getByText("Turno reprogramado")).toBeVisible()
  })

  test("A14 cancelación conserva historial", async ({ page }) => {
    await page.getByText("Clara Ruiz", { exact: true }).click()
    await page.getByRole("button", { name: "Cancelar" }).click()
    await page.getByRole("button", { name: "Confirmar cancelación" }).click()
    await expect(page.getByText("Turno cancelado")).toBeVisible()
  })

  test("A14 ausencia usa confirmación distinta", async ({ page }) => {
    await page.getByText("Clara Ruiz", { exact: true }).click()
    await page.getByRole("button", { name: "Registrar ausencia" }).click()
    await expect(page.getByRole("button", { name: "Registrar inasistencia" })).toBeVisible()
    await page.getByLabel("Motivo", { exact: true }).fill("No se presentó")
    await page.getByRole("button", { name: "Registrar inasistencia" }).click()
    await expect(page.getByText("Inasistencia registrada")).toBeVisible()
  })

  test("A20 no muestra operaciones financieras inventadas", async ({ page }) => {
    await expect(page.getByText("Cobrar", { exact: true })).not.toBeVisible()
    await expect(page.getByText("Liquidar", { exact: true })).not.toBeVisible()
  })

  test("retorno desde detalle conserva fecha y lista", async ({ page }) => {
    await page.getByText("Juan Pérez", { exact: true }).click()
    await page.getByLabel("Volver").click()
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
    await expect(page.getByText("Juan Pérez", { exact: true })).toBeVisible()
  })

  test("selector Equipo conserva un único thumb móvil", async ({ page }) => {
    await expect(page.getByTestId("segmented-control-thumb")).toHaveCount(1)
    const before = await page.getByTestId("segmented-control-thumb").getAttribute("style")
    await page.getByRole("tab", { name: "Personal" }).click()
    const after = await page.getByTestId("segmented-control-thumb").getAttribute("style")
    expect(after).not.toBe(before)
  })

  test("navbar desaparece en profundidad y vuelve al root", async ({ page }) => {
    await page.getByLabel("Nuevo turno").click()
    await expect(page.getByLabel("Ir a Resumen")).not.toBeVisible()
    await page.getByLabel("Volver").click()
    await expect(page.getByLabel("Ir a Resumen")).toBeVisible()
  })

  test("reduced motion mantiene navegación funcional", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.getByText("Juan Pérez", { exact: true }).click()
    await expect(page.getByText("Detalle del turno")).toBeVisible()
  })

  test("viewport estrecho mantiene fecha y toolbar accesibles", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openAgenda(page)
    await expect(page.getByLabel("Seleccionar fecha")).toHaveText("SÁB 24 OCT")
    await expect(page.getByLabel("Nuevo turno")).toBeVisible()
  })

  test("viewport amplio conserva selector centrado", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 })
    await openAgenda(page)
    const box = await page.getByTestId("segmented-control").boundingBox()
    expect(Math.abs((box!.x + box!.width / 2) - 215)).toBeLessThan(2)
  })

  test("no renderiza emoji de búsqueda como control", async ({ page }) => {
    await expect(page.getByText("🔍", { exact: true })).toHaveCount(0)
  })

  test("avisos globales siguen accesibles desde Equipo", async ({ page }) => {
    await page.getByLabel("Abrir avisos y actividad").click()
    await expect(page.getByRole("region", { name: "Avisos y actividad" })).toBeVisible()
  })

  test("cuenta global sigue accesible desde Equipo", async ({ page }) => {
    await page.getByLabel("Abrir cuenta").click()
    await expect(page.getByRole("region", { name: "Cuenta" })).toBeVisible()
  })
})
