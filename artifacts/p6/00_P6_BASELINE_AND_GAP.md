# P6 baseline and gap

## Baseline comprobada

- Workspace: `C:\Users\thega\Desktop\YoungKingZ-Owner-Design`.
- Git: no existe `.git`; no se inicializó repositorio ni se hicieron commits.
- Respaldo localizado: `artifacts/p6/backups/20261026-pre-p6/`.
- Preimplementación: TypeScript PASS, build PASS, Playwright 373/373 PASS.
- Reloj compartido: `2026-10-24T14:00:00-03:00`, zona `America/Argentina/Buenos_Aires`.

## CURRENT → TARGET → GAP ejecutado

| Capacidad | CURRENT comprobado | TARGET | Acción realizada |
|---|---|---|---|
| Root Resumen | Dos métricas en grilla, `$0` hardcodeado y filas de turnos | Cobrado → Turnos → Atención | Reemplazo localizado de `OverviewSurface` |
| Cobrado hoy | Valor fijo sin P4 | Ledger propio confirmado | Selector canónico sobre `cobradoEn` y movimientos |
| Cantidad de cobros | Inexistente | Operaciones únicas | `Set(operationId)` sobre movimientos elegibles |
| Turnos | `contadorResumen()` sobre todas las fechas | Reservas únicas del día efectivo | Proyección por identidad y fecha de negocio |
| Estados | Sin desglose contractual | Cinco estados excluyentes | Implementado con invariante de suma |
| Atención | Turnos confirmados/en atención | Causas operativas reales | Incidencias derivadas tipadas y agrupadas |
| Deep-links | Resumen no navegaba a objetos | Contexto, entidad, filtro y retorno | Query contractual reutilizando roots existentes |
| Retorno | Sin contrato | Root y scroll conservados | Memoria de scroll y `returnRoot=resumen` |
| Permisos | No aplicados en Home | Ocultar valor y conteos | Lectura de capacidades P5 y grants P4 |
| Errores | Error indistinguible de cero | `—`, parcial, stale, restringido | Estados separados y fixtures deterministas |

No se reconstruyeron P2–P5 y no se creó un store de negocio P6.
