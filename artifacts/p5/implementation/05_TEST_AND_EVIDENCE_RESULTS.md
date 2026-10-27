# P5 · Pruebas y evidencia real

## Resultado final

Ejecutado el 2026-10-26 sobre Chromium local:

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | PASS · 0 errores |
| `npm run build` | PASS · 1 warning no bloqueante de chunk; JS 655,48 kB / gzip 168,41 kB |
| `tests/more-ui.spec.ts` + `tests/more-stress.spec.ts` | PASS · 113/113 |
| `npm run test:e2e -- --reporter=line` | PASS · 373/373 en 1,4 min |
| Regresión P1–P4 | PASS dentro de las 373 pruebas |
| Capturas P5 | 90 archivos / 90 entradas manifest |
| Evidencia temporal | 85 PNG / 85 muestras JSON |

La falla inicial preexistente R4-50/F53 no se reprodujo en las dos regresiones completas finales.

## ST01–ST40

| ID | Resultado adversarial verificado | Estado |
|---|---|---|
| ST01 | fusión conserva alias/notas/audit | PASS |
| ST02 | compromisos detectados antes de duración | PASS |
| ST03 | ocultar servicio no cancela reservas | PASS |
| ST04 | conflicto sólo bloquea franja/recurso | PASS |
| ST05 | cupo completo no asciende candidato | PASS |
| ST06 | curso pago no crea venta/reintegro | PASS |
| ST07 | Client/Staff/Account IDs separados | PASS |
| ST08 | 320×700, 7 destinos, scroll único | PASS |
| ST09 | profesionales en destino M19 | PASS |
| ST10 | 50 secciones conservan jerarquía | PASS |
| ST11 | nombre largo conserva acción | PASS |
| ST12 | taxonomía lista/form/review | PASS |
| ST13 | búsqueda local/no global | PASS |
| ST14 | selector conserva draft | PASS |
| ST15 | nota inline | PASS |
| ST16 | impacto agrupado por owner | PASS |
| ST17 | query vuelve intacta | PASS |
| ST18 | doble Buscar produce un input | PASS |
| ST19 | Escape no deja overlay fantasma | PASS |
| ST20 | éxito sólo tras write | PASS |
| ST21 | actividad limita filas animadas | PASS |
| ST22 | reduced motion sin perder foco | PASS |
| ST23 | CTA alcanzable en viewport corto | PASS |
| ST24 | autodegradación admin protegida | PASS |
| ST25 | leído no equivale a resuelto | PASS |
| ST26 | horario concurrente rechaza stale | PASS |
| ST27 | promo no altera snapshot P4 | PASS |
| ST28 | target válido no evita policy block | PASS |
| ST29 | Object URL declarado temporal | PASS |
| ST30 | resize conserva valores | PASS |
| ST31 | permiso revocado invalida review viejo | PASS |
| ST32 | evento de archivado sigue legible | PASS |
| ST33 | aviso P3 abre P3, no P4 | PASS |
| ST34 | fila comunica contenido sin color-only | PASS |
| ST35 | media mover arriba/abajo | PASS |
| ST36 | texto ampliado conserva CTA | PASS |
| ST37 | Staff/Account relación sin copia | PASS |
| ST38 | draft/publicado separados | PASS |
| ST39 | impacto cruzado sin Cancelar todo | PASS |
| ST40 | M01–M83 por harness externo, sin atlas | PASS |

Código ejecutable: `tests/more-stress.spec.ts`.

## Evidencia visual

- `evidence/screens/M01-baseline.png` … `M83-baseline.png`: una captura por superficie.
- `responsive-M01-320.png`, `responsive-M47-390.png`, `responsive-M83-430.png`.
- variantes: `POLICY_REQUIRED`, conflicto de recursos, empty histórico.
- manifest: `evidence/screenshots-manifest.json`.
- secuencias MO01–MO22: `evidence/motion/` y `evidence/temporal-evidence.json`.

Las capturas se tomaron del PhoneFrame real con Playwright; no provienen del HTML de referencia.
