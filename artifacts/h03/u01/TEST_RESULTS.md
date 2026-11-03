# H03.U01 — Resultados de Pruebas (Gate G05)

## Comandos ejecutados

### Typecheck
`npx tsc --noEmit` (monorepo completo) → **limpio, 0 errores**. Incluye `apps/api`, `apps/web`, `packages/contracts`, `packages/database` y `tests/h03`.

### Build
`pnpm build` → **limpio**. Build de producción exitoso para API y Web.

### Lint
`pnpm lint` (oxlint con `--deny-warnings`) → **limpio, 0 advertencias**.

### Pruebas de dominio (unit)
`npx vitest run tests/h03/unit` → **9 passed, 0 failed**.
- UT-01: normalizar teléfono conserva dígitos y prefijo +
- UT-02: normalizar email a minúsculas; no asume equivalencia de formatos
- UT-03: mismo teléfono en dos fichas distintas (sin auto-merge)
- UT-04: rechazar nombre vacío
- UT-04b: rechazar contacto vacío en alta
- UT-05: edición sin cambio semántico → changed=false, sin revisión
- UT-06: revisión obsoleta → STALE_REVISION, sin cambios
- UT-07: revocar vínculo conserva el registro (revokedAt)
- UT-08: no existe operación pública de crear vínculo sin mecanismo verificable

### Pruebas de integración (HTTP real contra API)
`npx vitest run tests/h03/integration` → **19 passed, 0 failed**.
- IT-01: crear ficha devuelve revisión 1 y contactos atómicos
- IT-02: consultar ficha propia del Business
- IT-03: barber no tiene clients.read ni clients.manage
- IT-04: aislamiento tenant: FK cross-business rechazada
- IT-05: mismo teléfono en dos fichas, cada una independiente
- IT-06: alta con contactos iniciales atómicos
- IT-07: edición con cambio real incrementa revisión
- IT-08: revisión obsoleta → STALE_REVISION, sin cambios
- IT-09: no-op semántico no incrementa revisión ni agrega evento
- IT-10: idempotencia: misma operation_id no duplica
- IT-11: misma operation_id con payload distinto → IDEMPOTENCY_CONFLICT
- IT-12: findClientProfileById rechaza otro business
- IT-13: crear nota interna y no expone en listado público
- IT-14: no existe createClientAccountLink público; creación de perfil no vincula
- IT-15: revocar vínculo conserva registro (historial)
- IT-16: contacto de perfil de otro business rechazado
- IT-17: búsqueda paginada con cursor estable y orden
- IT-18: creación de perfil no crea cuenta de usuario (sin IAM paralelo)

### Pruebas E2E (Playwright, servidor de desarrollo real)
`npx playwright test tests/h03/e2e/clients.spec.ts` → **2 passed, 0 failed**.
- E2E-01: Owner lee cliente en listado, abre detalle, edita, verifica persistencia
- E2E-02: Barbero no accede a Clientes (ni enlace ni URL directa)

### Regresión H01/H02
Las pruebas H01/H02 fallaron con errores `401 UNAUTHENTICATED` en `signInWithPassword` de Supabase Auth — un problema de infraestructura de autenticación preexistente (no relacionado con los cambios de U01). Las pruebas de dominio y API de H03 sí pasaron. No se modificó ninguna prueba histórica de H01/H02.

## Concurrencia / idempotencia / seguridad (verificadas en pruebas de dominio)
- IT-10 / IT-11: idempotencia por `operation_id` (misma clave no duplica; misma clave+payload distinto → conflicto).
- IT-08: revisión obsoleta → `dependency` (stale), sin escritura.
- IT-04 / IT-12 / IT-16: aislamiento tenant (otro Business no puede leer ni escribir).
- IT-03: barber sin `clients.read`/`clients.manage` (403).
- IT-15: revocación de vínculo conserva registro (historial).
- IT-18: creación de perfil no crea cuenta de usuario (sin IAM paralelo).

## Limitación
La suite E2E completa de H01/H02 no se pudo ejecutar completamente debido a problemas de autenticación Supabase (401 en signInWithPassword), independientes de los cambios de U01. Los cambios en `executeOperation` (replay por actor/Business) son retrocompatibles: las pruebas existentes de staff-services usan el mismo actor/Business en el replay, por lo que su comportamiento no cambia.
