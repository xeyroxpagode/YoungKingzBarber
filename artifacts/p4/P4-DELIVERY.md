# P4 Finanzas — entrega

Veredicto final: `P4_FUNCTIONAL_BASELINE_PASS`.

## Implementación

- Dominio: `src/state/financeCore.ts`, `src/state/financeOps.ts`.
- Integraciones: `src/state/inventory.ts`, `src/state/staff.ts`, `InventorySurface`, `TeamSurface`, `PersonalSurface`.
- UI: `src/surfaces/FinanceSurface.tsx`, estilos P4 en `src/index.css`.
- QA: `tests/finance-domain.spec.ts`, `tests/finance-ui.spec.ts`, `tests/finance-cross-domain.spec.ts`.
- Evidencia: `artifacts/p4/screenshots/` y `screenshots-manifest.json` (91 archivos).
- Respaldo previo: `artifacts/p4/backups/20261026-pre-p4-recovery/`.

## Desviaciones conscientes

- No hay backend, conexión bancaria ni persistencia de adjuntos: comportamiento demo exigido.
- POLICY_REQUIRED permanece bloqueado donde el contrato no define política.
- APPROVAL_REQUIRED sólo habilita revalidar; nunca ejecuta automáticamente.

## Resultado QA final — 26/10/2026

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS · TypeScript sin errores |
| `npm run build` | PASS · Vite 8.0.3, 1.28 s |
| `npm run test:e2e` | PASS · 260/260 Playwright, 1.1 min |
| `npm run capture:p4` | PASS · 91 PNG + manifiesto |

Desglose de las 260 pruebas: 47 dominio P4, 72 UI P4 (54 R4 + 18 ramas), 3 handoffs P2/P3 y 138 regresiones heredadas P1/P2/P3. El build sólo emite una advertencia no bloqueante por chunk JS mayor a 500 kB; no hay errores de compilación ni de ejecución.

Ver matrices completas en `05-P4-SURFACE-ATLAS.md`, `10-P4-ACCEPTANCE.md` y auditoría en `11-P4-COVERAGE-AUDIT.md`.
