# P4 Finanzas — verdad de producto

Autoridad: `writing-block (1).md`, contrato V2.0. Corte demo determinista: 24/10/2026 14:00 -03. Moneda interna: centavos ARS enteros; presentación: pesos sin decimales.

## Invariantes operativas

- Venta, obligación, cobro, aplicación y movimiento son hechos distintos.
- Sólo el componente efectivo altera Caja; transferencia y medios externos nunca lo hacen.
- Fondos de terceros conservan titular económico y no son ingreso propio.
- Retiro del dueño no es gasto; traslado interno no es ingreso ni egreso.
- Pagar una compra P3 no ingresa stock; devolver stock no reintegra dinero.
- Liquidaciones P2 cerradas no se recalculan. Alquiler P2 es cuenta por cobrar, no venta.
- Una corrección conserva el original y agrega compensación trazable.
- Operaciones monetarias usan ID estable, control de versión e idempotencia.
- UNKNOWN nunca dispara un segundo intento automático. POLICY_REQUIRED y APPROVAL_REQUIRED no ejecutan dinero.

## Fixture reconciliado

Vendido propio: $61.000. Cobrado propio: $36.000. Saldo de ventas: $25.000. Caja esperada: $53.000. Las proyecciones se calculan desde ventas, obligaciones, aplicaciones y ledger; no se almacenan como totales editables.

## Alcance

Prototipo frontend con estado compartido P1/P2/P3/P4, sin API bancaria, backend productivo, conciliación automática ni política financiera inventada.
