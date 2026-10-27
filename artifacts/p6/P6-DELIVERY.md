# P6 Delivery

## Estado general

P6 Resumen quedó implementado como capa derivada sobre P2–P5. La Home muestra `$36.000` desde dos operaciones P4 reales, `8/12 atendidos` desde identidades P2 reconciliadas y una lista priorizada de causas accionables con destinos propietarios.

## Archivos de implementación

- `src/state/ownerSummary.ts`: tipos, selectores y catálogo derivado.
- `src/surfaces/OverviewSurface.tsx`: root congelada y fixtures visuales aislados.
- `src/app/App.tsx`: navegación contextual y limpieza de retorno.
- `src/surfaces/TeamSurface.tsx` y `src/surfaces/agenda/AgendaSurface.tsx`: fecha/estado/IDs y retorno.
- `src/surfaces/InventorySurface.tsx`: uso/filtro/entidad y retorno.
- `src/surfaces/MoreSurface.tsx`: retorno contextual.
- `src/index.css`: layout P6, responsive, foco y reduced motion.
- `tests/owner-summary-domain.spec.ts`, `owner-summary-ui.spec.ts`, `owner-summary-acceptance.spec.ts`.
- `scripts/capture-p6-evidence.mjs` y comando `npm run capture:p6`.

Cambios fuera de P6 fueron mínimos, de integración y cubiertos por 475/475 tests. No se modificaron reglas de negocio P2–P5.

## Reconciliaciones

- Cobrado: movimientos entrantes, confirmados, propios y del 24/10/2026; conteo por operación única.
- Turnos: 12 reservas únicas; 8 finalizadas, 1 en atención, 1 pendiente, 1 ausente y 1 cancelada.
- Walk-ins: anotación separada sin ampliar denominador.
- Stock: disponible real después de compromisos y sólo con mínimo configurado.
- Avisos: `read` no resuelve la causa; se conserva `relatedNoticeId`.

## Gates

| Gate | Estado |
|---|---|
| G0 Baseline y respaldo | PASS |
| G1 Alcance | PASS |
| G2 Tres bloques y shell | PASS |
| G3 Fuentes reales | PASS |
| G4 Economía | PASS |
| G5 Agenda | PASS |
| G6 Incidencias aplicables, sin falsos positivos | PASS |
| G7 Navegación y retorno | PASS |
| G8 Vacíos, parciales, UNKNOWN, permisos | PASS |
| G9 Reactividad | PASS |
| G10 Visual | PASS |
| G11 J6/ST/SIM | PASS |
| G12 Regresiones | PASS |
| G13 Evidencia | PASS |

## Resultados

- Baseline: 373/373.
- Gate final: 475/475.
- TypeScript: PASS.
- Build: PASS.
- Capturas: 24, con manifest verificable.

## Desviaciones documentadas

- No hay Git en el workspace; no se inicializó ni se pudo producir diff/commit.
- AT-08, AT-13, AT-21, AT-23 y AT-25 no tienen estado persistido/política suficiente en CURRENT; se documentan como no aplicables o `POLICY_REQUIRED` en lugar de fabricar incidencias.
- El build mantiene el warning no bloqueante de tamaño de chunk existente en baseline.

## Ejecución

```text
npm run dev
npm run typecheck
npm run build
npm run test:e2e
npm run capture:p6
npm run qa
```

## Veredicto

`P6_FUNCTIONAL_BASELINE_PASS`
