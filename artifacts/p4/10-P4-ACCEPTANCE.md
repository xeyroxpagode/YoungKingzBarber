# Matriz R4-01–R4-54

Cada fila tiene un test E2E nombrado `R4-nn`; las escrituras/consecuencias se contrastan con la suite de dominio. `PASS` no significa que una política pendiente se inventó: significa que la rama bloquea con el estado contractual correcto.

| ID | Recorrido / entrada | Resultado contractual observado | Evidencia | Estado |
|---|---|---|---|---|
| R4-01 | Períodos · F01→F04 | rango válido aplica; rango invertido recuperable | UI período | PASS |
| R4-02 | Desglose Vendido · F01→F09 | $61.000 desde ventas, no cobros | UI + dominio 39 | PASS |
| R4-03 | Caja desde Resumen · F01→F43 | esperado $53.000 reconstruido | UI + dominio 26 | PASS |
| R4-04 | Tipos acumulativos · F02 | nunca quedan cero tipos activos | UI mutante | PASS |
| R4-05 | Buscar y filtrar · F02/F06/F07 | NO_MATCH y restauración sin borrar | UI mutante | PASS |
| R4-06 | Vencimientos · F03→F24/F61→F25 | clasifica sin mutar importes | UI F24 + F61 | PASS |
| R4-07 | Venta desde atención · F12 | venta separada de cobro | UI + dominio 02 | PASS |
| R4-08 | Selección atención · F13 | sólo atención propia elegible | UI + proyección | PASS |
| R4-09 | Venta con producto · F14 | usa artículo P3, sin atención ficticia | UI + dominio 36 | PASS |
| R4-10 | Descuento · F15 | motivo/autorización requerido | UI APPROVAL_REQUIRED | PASS |
| R4-11 | Venta duplicada · F13 | idempotencia devuelve DUPLICATE | dominio 01 | PASS |
| R4-12 | Cobro completo · F17 | salda obligación, ingreso único | dominio 04 | PASS |
| R4-13 | Cobros parciales · F17 | conserva saldo y estado parcial | UI + dominio 03 | PASS |
| R4-14 | Cobro mixto · F19 | medios suman; sólo efectivo a Caja | UI + dominio 06/07 | PASS |
| R4-15 | Ajuste venta · F22 | original ajustado, efecto separado | dominio 25 | PASS |
| R4-16 | Seña aplicada · F31/F30 | anticipo único, aplicación no mueve dinero | dominio 11/12 | PASS |
| R4-17 | Reserva cancelada con seña · F32 | POLICY_REQUIRED sin devolución/retención | dominio 41 | PASS |
| R4-18 | Anticipo parcial · F29/F30 | saldo disponible disminuye una vez | dominio 12 | PASS |
| R4-19 | Reintegro · F23 | salida separada, no stock | UI + dominio 22 | PASS |
| R4-20 | Pedido P3 cobrado · F17 | cobro monetario no entrega físico | adaptador + dominio 07/08 | PASS |
| R4-21 | Pedido cancelado tras cobro · F23/F60 | obligación de reintegro separada | UI separación | PASS |
| R4-22 | Compra P3 · F38 | misma compra/obligación, sin duplicar | cross-domain + dominio 20 | PASS |
| R4-23 | Pago parcial proveedor · F26 | reduce saldo, no ingresa stock | dominio 21 | PASS |
| R4-24 | Gasto y pago inmediato · F35 | gasto + un egreso vinculado | dominio 19 | PASS |
| R4-25 | Gasto pendiente · F35 | obligación sin salida | UI + dominio 18 | PASS |
| R4-26 | Recurrencia · F39 | regla e instancia única por período | dominio 38 | PASS |
| R4-27 | Liquidación Alex · P2→F27 | identidad LIQ-ALEX-2026-42, retorno | cross-domain | PASS |
| R4-28 | Alquiler Nicolás · P2→F28 | por cobrar, no venta | cross-domain + dominio 13 | PASS |
| R4-29 | Adelanto profesional · F29 | egreso anticipado, aplicación futura | UI + dominio anticipo | PASS |
| R4-30 | Fondos terceros · F53/F54 | no ingreso/gasto propio | dominio 14/15 | PASS |
| R4-31 | Apertura Caja · F44 | fondo inicial, no ingreso | UI + comando | PASS |
| R4-32 | Gasto efectivo · F35 | exige Caja; efectivo altera esperado | dominio requireCash | PASS |
| R4-33 | Retiro dueño · F40/F41 | movimiento retiro, no gasto | UI + dominio 16 | PASS |
| R4-34 | Traslado interno · F42 | conserva fondos propios | dominio 17 | PASS |
| R4-35 | Cierre exacto · F47/F48 | snapshot e idempotencia | dominio 29 | PASS |
| R4-36 | Cierre con diferencia · F49 | conserva esperado y diferencia | dominio 28 | PASS |
| R4-37 | Caja cerrada · F17 | efectivo bloqueado CLOSED_CASH | dominio 46 | PASS |
| R4-38 | Duplicado e incertidumbre · F56 | no reintento automático | dominio 34/35 | PASS |
| R4-39 | Corregir movimiento · F55 | compensación, original visible | UI + dominio 43 | PASS |
| R4-40 | Revisión jornada · F64 | centro operativo con F01–F73 | UI atlas | PASS |
| R4-41 | Venta libre · F65 | venta sin atención | UI + dominio 36 | PASS |
| R4-42 | Cliente desde venta · F65→F66→F65 | búsqueda/alta/dedupe; borrador en pila | UI + dominio 37 | PASS |
| R4-43 | Comprobante externo · F68 | archivo no acredita; verificación manual | dominio 31/42 | PASS |
| R4-44 | Cobro varias obligaciones · F69 | un ingreso, varias aplicaciones | dominio 09 | PASS |
| R4-45 | Relevo Caja · F67 | misma sesión, custodio tras aceptación | UI + dominio 30 | PASS |
| R4-46 | Saldo a favor · F72 | aplicación sin ingreso nuevo | dominio 10 | PASS |
| R4-47 | Autorización · F71 | alcance/importe/versión; no reutilizable | dominio 32 | PASS |
| R4-48 | Comprobante · F70 | tipo/tamaño y persistencia de sesión | dominio 31 | PASS |
| R4-49 | Fuentes propias · F73 | saldo desconocido se muestra sin inventar | dominio 40 | PASS |
| R4-50 | Atención de tercero · F53 | titular separado del custodio | dominio 14 | PASS |
| R4-51 | Recurrencia y compra existente · F39/F37 | no duplica período ni documento P3 `FC-A-901` | dominio 38/47 | PASS |
| R4-52 | Corrección después cierre · F55 | original histórico inmutable | dominio 43 | PASS |
| R4-53 | Seña sin política · F32 | POLICY_REQUIRED | dominio 41 | PASS |
| R4-54 | Pedido y actualización concurrente · F59/F56 | versión obsoleta → CONFLICT | dominio 45 + handoff | PASS |
