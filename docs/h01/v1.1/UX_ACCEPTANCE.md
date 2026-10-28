# H01 V1.1 — UX acceptance

| Familia | Estado | Evidencia / límite |
|---|---|---|
| Shell por capability y lenguaje de producto | PASS | E2E single-role; sin `Staff · H01` ni módulos futuros |
| Contexto único | PASS | selector oculto y entrada directa |
| Contexto multirol | PARTIAL | implementación revisionada y revalidación cross-tab; sin captura multirol dedicada |
| Directorio: búsqueda, estados, filtros | PASS | búsqueda remota cancelable, cinco filtros, límite 100 |
| Detalle y estados semánticos | PASS | relación y acceso diferenciados |
| Protección propio/último Dueño | PASS | UI anticipa; backend AT-23 conserva garantía |
| Roles con revisión | PASS | borrador, diferencias, confirmación y stale handling |
| Grants sólo en Recepción | PASS | sección condicional y catálogo cerrado |
| Incorporación | PASS | revisión y resultado de entrega separado |
| Invitaciones | PASS | emisión, reemisión, revocación y delivery visible |
| Historial comprensible | PARTIAL | acciones y fechas legibles; el detalle aún no expone actor/outcome completos de `/v1/audit` |
| Mis datos | PASS | lectura/edición, dirty/no-op, revisión de concurrencia |
| Cambio de correo | PASS local | vacío, distinto, pending; confirmación completa depende de Mailpit/Supabase local |
| Cambio de contraseña | PASS implementación | identidad actual, confirmación, política y cierre de otras; no automatizado por ser destructivo |
| Sesiones | PASS | causa corregida, paginación, historial, cierres por alcance |
| Cuenta comprometida | PASS implementación | impacto explicado y recuperación sin tocar roles; no automatizado por ser destructivo |
| Teclado/foco/labels | PARTIAL | foco visible, labels, Escape en diálogos principales; falta auditoría asistiva formal |
| Responsive | PASS | capturas reales 1440×900, 1280×800, 768×1024, 390×844 y 320×700 |

El resultado general es `PARTIAL` porque el contrato exige una matriz E2E destructiva de veinte familias y una auditoría de accesibilidad formal que no quedaron completas en esta ejecución.
