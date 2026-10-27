# P5 · Ejecución y verificación

Requisitos: Node.js/npm y dependencias instaladas.

```powershell
cd C:\Users\thega\Desktop\YoungKingZ-Owner-Design
npm install
npm run dev
```

Abrir `http://localhost:5173` y elegir **Más** en la navegación inferior.

## QA

```powershell
npm run typecheck
npm run build
npm run test:e2e
```

Sólo P5:

```powershell
npx playwright test tests/more-ui.spec.ts tests/more-stress.spec.ts
```

Evidencia (requiere `npm run dev` activo en `127.0.0.1:5173`):

```powershell
npm run capture:p5
```

Salidas:

- capturas: `artifacts/p5/implementation/evidence/screens/`
- motion: `artifacts/p5/implementation/evidence/motion/`
- manifests: `screenshots-manifest.json`, `temporal-evidence.json`
- reporte Playwright: `playwright-report/`

El query `?p5Surface=Mxx` es exclusivamente un harness externo de QA. La app productiva no muestra IDs ni un explorador de superficies.
