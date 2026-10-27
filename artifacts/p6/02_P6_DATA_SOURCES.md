# P6 data sources

| Lectura | Fuente real | Campos consumidos | Autoridad |
|---|---|---|---|
| Jornada | `src/state/agenda.ts` | Reserva, inicio, estado, historial, atención vinculada | P2 |
| Titularidad de atención | `eligibleAttenances`, acuerdos P2 | atención, profesional, clasificación propia/ajena | P4/P2 |
| Stock | `inventoryStore` | movimientos, asignaciones, compromisos, mínimos, cuarentena, pedidos | P3 |
| Cobrado | `financeStore`, `cobradoEn` | movimiento, operación, dirección, estado, medio, tercero, fecha | P4 |
| Obligaciones y control | `pendingGroups`, diferencias, verificaciones, attempts, approvals | saldos, vencimiento, UNKNOWN, autorización | P4 |
| Cursos, acceso y avisos | `moreStore` | sesiones, cuentas, capacidades, alertas | P5 |
| Tiempo | `DEMO_NOW_ISO`, `demoTodayKey` | día de negocio y hora demo | Compartida |

`ownerSummary.ts` es una capa `READ → AGGREGATE → INTERPRET → PRIORITIZE → NAVIGATE`. No persiste ventas, reservas, artículos, movimientos ni incidencias.

La proyección de stock usa un único snapshot de P3 para reconstruir físico apto, asignado, comprometido y disponible. La UI se suscribe a los stores P3, P4 y P5; al regresar desde P2 se remonta y consulta Agenda actual.
