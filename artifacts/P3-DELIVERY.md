# P3 Inventario — Functional Baseline V1.0

## A. Estado general

Implementación integral completa del Inventario del Dueño. Se reemplazó el placeholder por un módulo navegable con ledger físico, asignaciones, compromisos, operaciones comerciales separadas, idempotencia demo, integración con Equipo/Agenda/Finanzas y evidencia real de I01–I44.

Estado técnico final: TypeScript PASS, build PASS, Playwright PASS (138/138), 48 capturas generadas.

## B. Auditoría CURRENT → TARGET

| Clasificación | CURRENT | TARGET / acción | Archivos |
|---|---|---|---|
| KEEP | PhoneFrame, TopBar, BottomNav, overlays, tema, selector y componentes P1.1 | Reutilizados sin alterar contratos | `src/components/*` |
| KEEP | Entidades reales de profesionales, clientes y atenciones | Reutilizadas por ID, sin stores paralelos | `src/state/staff.ts`, `src/state/agenda.ts` |
| ADAPT | Shell sólo ocultaba BottomNav en profundidad de Equipo | Profundidad compartida para Equipo e Inventario; handoff a Finanzas | `src/app/App.tsx` |
| ADAPT | Finanzas era placeholder | Consume obligaciones económicas originadas en Inventario | `src/surfaces/FinanceSurface.tsx` |
| ADAPT | Estilos existentes de Equipo/Agenda | Baseline visual específico de Inventario, responsive y reduced motion | `src/index.css` |
| REPLACE | Inventario era un placeholder sin estado ni acciones | I01–I44, formularios, navegación y mutaciones reales | `src/surfaces/InventorySurface.tsx` |
| NUEVO | No existía dominio de Inventario | Ledger, proyecciones, fixtures, operaciones y auditoría | `src/state/inventory.ts` |
| RETIRE | Ninguno | No se retiró código de P0/P1/P2 | — |

El workspace no contiene `.git`; por eso no existen rama, HEAD ni status Git registrables.

## C. Superficies

Todas se implementan en `src/surfaces/InventorySurface.tsx`; el estado y las mutaciones viven en `src/state/inventory.ts`.

| ID | Nombre | Acceso normal | Estado |
|---|---|---|---|
| I01 | Root Para venta | BottomNav → Inventario | PASS |
| I02 | Root Uso interno | Selector centrado | PASS |
| I03 | Búsqueda | Toolbar Buscar | PASS |
| I04 | Filtros | Toolbar Filtrar, sheet | PASS |
| I05 | Nuevo producto | `+` en Para venta | PASS |
| I06 | Nuevo insumo | `+` en Uso interno | PASS |
| I07 | Coincidencias / mixto | Alta → Revisar coincidencias | PASS |
| I08 | Detalle producto | Fila de producto | PASS |
| I09 | Detalle insumo | Fila de insumo | PASS |
| I10 | Editar artículo | Detalle → Editar | PASS |
| I11 | Disponibilidad pública | Detalle producto → Disponibilidad | PASS |
| I12 | Imagen | Detalle → Imagen | PASS |
| I13 | Stock mínimo | Detalle → Stock mínimo | PASS |
| I14 | Existencias por ubicación | Detalle → Existencias | PASS |
| I15 | Historial de movimientos | Detalle → Historial | PASS |
| I16 | Detalle movimiento | Fila de historial | PASS |
| I17 | Menú de operaciones | Detalle → Registrar movimiento | PASS |
| I18 | Recibir mercadería | Menú de operaciones | PASS |
| I19 | Recepción múltiple | I18 → múltiples artículos | PASS |
| I20 | Compra vinculada | I18 → Vincular compra | PASS |
| I21 | Detalle recepción | I20 → recepción vinculada | PASS |
| I22 | Registrar consumo | Menú de operaciones | PASS |
| I23 | Seleccionar atención | I22 → Buscar atención | PASS |
| I24 | Consumos por profesional | I09/I22 | PASS |
| I25 | Trasladar | Menú de operaciones / ubicación | PASS |
| I26 | Recuento | Menú de operaciones / ubicación | PASS |
| I27 | Revisar diferencia | I26 → Revisar | PASS |
| I28 | Pérdida / deterioro | Menú de operaciones | PASS |
| I29 | Inspección cuarentena | Menú de operaciones | PASS |
| I30 | Destino de uso | Menú / detalle | PASS |
| I31 | Pedidos para retirar | Acceso destacado de I01 | PASS |
| I32 | Detalle pedido | Fila de pedido | PASS |
| I33 | Preparar pedido | Pedido recibido | PASS |
| I34 | Listo para retirar | Pedido listo → Registrar retiro | PASS |
| I35 | Cobro de pedido | I34 con saldo | PASS |
| I36 | Confirmar entrega | I34 con cobro completo | PASS |
| I37 | Cancelar pedido | Detalle de pedido | PASS |
| I38 | Devolución cliente | Pedidos → operaciones relacionadas | PASS |
| I39 | Devolución proveedor | Recepción / pedidos relacionados | PASS |
| I40 | Entrega venta presencial | I41 → venta elegible | PASS |
| I41 | Operación comercial pendiente | Pedidos → venta presencial pendiente | PASS |
| I42 | Resolver faltante | Preparación / pedido con incidencia | PASS |
| I43 | Ubicación | Fila de I14 | PASS |
| I44 | Resultados y recuperación | Resultado de cada mutación | PASS |

## D. Operaciones y estado

- Artículo único con destinos `sale/internal`, unidad canónica y snapshots comerciales.
- Ledger de movimientos para apertura, recepción, consumo, entrega, traslado, recuento, cuarentena, recuperación, descarte, devolución y corrección.
- Proyecciones puras: total, apto, cuarentena, ubicación, asignación, compromiso y disponible.
- Recepción y compra separadas; factura posterior crea obligación sin duplicar físico.
- Compromisos de pedido separados del físico; preparación no descuenta, entrega descuenta una vez.
- Cobros parciales, efectivo ligado a Caja demo y transferencia sin modificar efectivo.
- Cancelación libera compromiso y crea obligación de reembolso cuando corresponde.
- Devoluciones de cliente y proveedor limitadas por origen; crédito/reembolso separado.
- `operation_id` impide doble efecto; las operaciones compuestas validan antes de mutar.
- Kits usan los IDs reales de Alex, Nicolás y Leo. Consumos usan atenciones reales de P2.
- Finanzas consume las obligaciones creadas en Inventario, sin store económico paralelo.

## E. Recorridos

| Recorrido | Resultado / evidencia |
|---|---|
| R01 | PASS — alta → detalle → recepción inicial |
| R02 | PASS — alta insumo → recepción → traslado a kit |
| R03 | PASS — asignaciones venta/interno sobre una identidad |
| R04 | PASS — recepción múltiple atómica |
| R05 | PASS — test 39: factura posterior sin duplicar recepción |
| R06 | PASS — consumo con profesional y atención real |
| R07 | PASS — consumo general sin obligación financiera |
| R08 | PASS — traslado conserva físico global |
| R09 | PASS — recuento y ajuste trazable |
| R10 | PASS — deterioro → cuarentena → inspección |
| R11 | PASS — descarte reduce físico |
| R12 | PASS — #1042 recibido con compromisos |
| R13 | PASS — preparación conserva físico |
| R14 | PASS — cobro completo → entrega única |
| R15 | PASS — cancelación libera compromiso |
| R16 | PASS — VP-208 entrega sin recrear venta/pago |
| R17 | PASS — devolución apta/no apta y límite entregado |
| R18 | PASS — solicitud vs despacho a proveedor |
| R19 | PASS — reassign/pending/adjust con confirmación conjunta |
| R20 | PASS — desactivación conserva historial |
| R21 | PASS — consumos por integrante desde eventos reales |
| R22 | PASS — corrección vinculada conserva original |
| R23 | PASS — búsqueda/filtros/contexto preservados al volver |
| R24 | PASS — compra → obligación → botón y root Finanzas compartido |

## F. Tests

| Suite | Total | PASS | FAIL | No ejecutados |
|---|---:|---:|---:|---:|
| Agenda heredada | 40 | 40 | 0 | 0 |
| Personal heredada | 44 | 44 | 0 | 0 |
| Inventario dominio/invariantes | 39 | 39 | 0 | 0 |
| Inventario UI | 14 | 14 | 0 | 0 |
| Evidencia I01–I44 | 1 | 1 | 0 | 0 |
| **Total** | **138** | **138** | **0** | **0** |

TypeScript: PASS. Vite build: PASS. Consola Playwright: sin errores no controlados.

## G. Capturas

Carpeta: `C:\Users\thega\Desktop\YoungKingZ-Owner-Design\dist\screenshots\p3\`

Contiene 48 PNG: una por I01–I44 y cuatro estados adicionales (`estado-error-campo`, `estado-sin-resultados`, `estado-sheet-largo`, `estado-formulario-foco`). Se generan ejecutando `tests/inventory-evidence.spec.ts` contra la interfaz real.

## H. Desviaciones

| ID | TARGET | ACTUAL | CAUSA | IMPACTO | ESTADO |
|---|---|---|---|---|---|
| D01 | Persistencia demo coherente | Estado compartido en memoria durante navegación y cambio de roots | El workspace no tenía persistencia local previa; se evitó introducir migraciones incompatibles | Al recargar el navegador se reinicia el fixture | Aceptado para baseline local |
| D02 | Imagen local | Preview mediante Object URL | No existe backend de archivos | La imagen dura la sesión y se informa en I12 | Aceptado por contrato |
| D03 | Git preflight | Rama/HEAD/status | El directorio no es repositorio Git | Sin impacto funcional | Informativo |

No hay desviaciones críticas abiertas.

## I. Cómo ejecutar

```powershell
Set-Location 'C:\Users\thega\Desktop\YoungKingZ-Owner-Design'
pnpm install
pnpm dev
```

Puerto real: `http://localhost:5173`.

Verificación completa:

```powershell
pnpm exec tsc --noEmit
pnpm build
pnpm exec playwright test --workers=2 --reporter=line
```

## J. Veredicto final

`P3_FUNCTIONAL_BASELINE_PASS`
