# Integración P1/P2/P3

## P1 Agenda

F12/F13 consumen atenciones reales y sólo permiten `propia_sin_venta`. F31 liga señas a reservas. F66 reutiliza `CLIENTES` y `registrarCliente` con deduplicación.

## P2 Personal

`p2ObligationsView` adapta liquidaciones como por pagar y alquileres como por cobrar. Liquidaciones abiertas conservan importe no confirmado. `pay` delega a `registerPayment` / `applySettlementCredit`; no reabre ni recalcula períodos cerrados. Handoff F27/F28 conserva origen y retorno.

## P3 Inventario

Compras/pedidos conservan IDs nativos. `pay` delega a `payObligation`/`payOrder`; no recibe stock. F37 bloquea documento ya presente en P3. F38 muestra `PUR-901` y retorna a Inventario.

Prueba automatizada: `tests/finance-cross-domain.spec.ts` (3 recorridos reales).
