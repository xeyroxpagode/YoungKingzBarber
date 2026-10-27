import { expect, test, type Page } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

const out = resolve("dist/screenshots/p3")
async function root(page: Page) { await page.goto("/"); await page.getByLabel("Ir a Inventario").click(); await expect(page.getByTestId("inventory-root")).toBeVisible() }
async function cap(page: Page, name: string) { await page.screenshot({ path: resolve(out, `${name}.png`) }) }
async function saleDetail(page: Page) { await root(page); await page.getByText("Cera modeladora", { exact: true }).click() }
async function internalDetail(page: Page) { await root(page); await page.getByRole("tab", { name: "Uso interno" }).click(); await page.getByText("Hojas descartables", { exact: true }).click() }
async function operations(page: Page, name: string) { await root(page); await page.getByText("Explorar operaciones y registros").click(); await page.getByText(name, { exact: true }).click() }
async function orders(page: Page) { await root(page); await page.getByText("Pedidos para retirar").click() }

test("capturas reales I01–I44 y estados críticos", async ({ page }) => {
  test.setTimeout(180_000)
  mkdirSync(out, { recursive: true })
  await page.setViewportSize({ width: 390, height: 844 })

  await root(page); await cap(page, "I01-root-venta")
  await page.getByRole("tab", { name: "Uso interno" }).click(); await cap(page, "I02-root-interno")
  await root(page); await page.getByLabel("Buscar").click(); await page.getByLabel("Buscar inventario").fill("ACE-001"); await cap(page, "I03-busqueda")
  await root(page); await page.getByLabel("Filtrar").click(); await cap(page, "I04-filtros")
  await root(page); await page.getByLabel("Nuevo producto").click(); await cap(page, "I05-nuevo-producto")
  await root(page); await page.getByRole("tab", { name: "Uso interno" }).click(); await page.getByLabel("Nuevo insumo").click(); await cap(page, "I06-nuevo-insumo")
  await root(page); await page.getByLabel("Nuevo producto").click(); await page.getByText("Revisar coincidencias").click(); await cap(page, "I07-coincidencias")
  await saleDetail(page); await cap(page, "I08-detalle-producto")
  await internalDetail(page); await cap(page, "I09-detalle-insumo")
  await saleDetail(page); await page.getByText("Editar artículo").click(); await cap(page, "I10-editar")
  await saleDetail(page); await page.getByText("Disponibilidad pública").click(); await cap(page, "I11-publicacion")
  await saleDetail(page); await page.getByText("Imagen", { exact: true }).click(); await cap(page, "I12-imagen")
  await saleDetail(page); await page.getByText("Stock mínimo").click(); await cap(page, "I13-stock-minimo")
  await saleDetail(page); await page.getByText("Existencias por ubicación").click(); await cap(page, "I14-existencias")
  await saleDetail(page); await page.getByText("Historial de movimientos").click(); await cap(page, "I15-movimientos")
  await saleDetail(page); await page.getByText("Historial de movimientos").click(); await page.locator(".deep-nav-row").first().click(); await cap(page, "I16-detalle-movimiento")
  await saleDetail(page); await page.getByText("Registrar movimiento").click(); await cap(page, "I17-operaciones")
  await operations(page, "Recibir mercadería"); await cap(page, "I18-recibir")
  await operations(page, "Recibir mercadería"); await page.getByText("Recibir múltiples artículos").click(); await cap(page, "I19-recepcion-multiple")
  await operations(page, "Recibir mercadería"); await page.getByText("Vincular compra").click(); await cap(page, "I20-compra")
  await operations(page, "Recibir mercadería"); await page.getByText("Vincular compra").click(); await page.getByText("Ver recepción vinculada").click(); await cap(page, "I21-detalle-recepcion")
  await operations(page, "Registrar consumo"); await cap(page, "I22-consumo")
  await operations(page, "Registrar consumo"); await page.getByText("Buscar atención existente").click(); await cap(page, "I23-atencion")
  await operations(page, "Registrar consumo"); await page.getByText("Ver consumos por profesional").click(); await cap(page, "I24-consumos-profesional")
  await operations(page, "Trasladar"); await cap(page, "I25-trasladar")
  await operations(page, "Recuento"); await cap(page, "I26-recuento")
  await operations(page, "Recuento"); await page.getByText("Revisar diferencia").click(); await cap(page, "I27-diferencia")
  await operations(page, "Pérdida o deterioro"); await cap(page, "I28-perdida")
  await operations(page, "Inspección de cuarentena"); await cap(page, "I29-cuarentena")
  await operations(page, "Cambiar destino de uso"); await cap(page, "I30-destino")
  await orders(page); await cap(page, "I31-pedidos")
  await orders(page); await page.getByText("#1042 · Juan Pérez").click(); await cap(page, "I32-pedido-recibido")
  await orders(page); await page.getByText("#1042 · Juan Pérez").click(); await page.getByText("Preparar pedido").click(); await cap(page, "I33-preparar")
  await orders(page); await page.getByText("#1040 · Martín Gómez").click(); await page.getByText("Registrar retiro").click(); await cap(page, "I34-listo")
  await orders(page); await page.getByText("#1040 · Martín Gómez").click(); await page.getByText("Registrar retiro").click(); await page.getByText("Registrar cobro").click(); await cap(page, "I35-cobro")

  await orders(page); await page.getByText("#1040 · Martín Gómez").click(); await page.getByText("Registrar retiro").click(); await page.getByText("Registrar cobro").click(); await page.getByText("Revisar y registrar cobro").click(); await page.getByText("Volver a Inventario").click(); await page.getByText("Pedidos para retirar").click(); await page.getByText("#1040 · Martín Gómez").click(); await page.getByText("Registrar retiro").click(); await page.getByText("Confirmar entrega").click(); await cap(page, "I36-entrega")
  await orders(page); await page.getByText("#1042 · Juan Pérez").click(); await page.getByText("Cancelar pedido").click(); await cap(page, "I37-cancelar")
  await orders(page); await page.getByText("Devolución de cliente").click(); await cap(page, "I38-devolucion-cliente")
  await orders(page); await page.getByText("Devolución a proveedor").click(); await cap(page, "I39-devolucion-proveedor")
  await orders(page); await page.getByText("Venta presencial pendiente").click(); await page.getByText("Venta VP-208 · Juan Pérez").click(); await cap(page, "I40-entrega-presencial")
  await orders(page); await page.getByText("Venta presencial pendiente").click(); await cap(page, "I41-operacion-pendiente")
  await orders(page); await page.getByText("#1042 · Juan Pérez").click(); await page.getByText("Preparar pedido").click(); await page.getByText("Resolver faltante").click(); await cap(page, "I42-faltante")
  await saleDetail(page); await page.getByText("Existencias por ubicación").click(); await page.getByText("Depósito", { exact: true }).click(); await cap(page, "I43-ubicacion")
  await operations(page, "Recibir mercadería"); await page.getByText("Revisar y confirmar").click(); await cap(page, "I44-resultado")

  await root(page); await page.getByLabel("Buscar").click(); await page.getByLabel("Buscar inventario").fill("sin coincidencias"); await cap(page, "estado-sin-resultados")
  await root(page); await page.getByLabel("Nuevo producto").click(); await page.getByText("Crear producto").click(); await cap(page, "estado-error-campo")
  await root(page); await page.getByText("Explorar operaciones y registros").click(); await cap(page, "estado-sheet-largo")
  await root(page); await page.getByLabel("Nuevo producto").click(); await page.getByLabel("Nombre").focus(); await cap(page, "estado-formulario-foco")
})
