# H01 V1.1 — Test evidence

Fecha: 2026-10-28. Supabase local real, PostgreSQL real, Fastify real y Chromium real.

## Resultados

- `pnpm typecheck`: PASS en seis packages/apps.
- `pnpm build`: PASS; Fastify TypeScript y Next.js 16 production build.
- `pnpm test:unit`: 6/6 PASS.
- `pnpm test:integration`: 28/28 PASS; incluye la matriz original 26/26 y dos regresiones V1.1.
- `pnpm test:e2e`: 7/7 PASS en la ejecución final, incluidos seis recorridos funcionales y la certificación visual.
- Migración en copia aislada: 20 duplicados abiertos reconciliados, cero grupos duplicados restantes, índice creado; base temporal eliminada.
- `supabase migration up --local`: PASS sin reset; versiones `202610280001` y `202610280002` aplicadas.

## Regresiones añadidas

- H01-V11-01: ocho requests concurrentes del mismo JWT producen una única sesión operativa abierta.
- H01-V11-02: sesiones activas paginadas y sin filas revocadas.
- E2E: login, Mi cuenta/sesiones, contexto único, correo vacío/igual, protección del último Dueño, recuperación no enumerante y matriz visual responsive.

## Evidencia visual

Directorio: `docs/h01/v1.1/evidence/`.

- `team-1440x900.png`
- `team-1280x800.png`
- `team-768x1024.png`
- `team-390x844.png`
- `team-320x700.png`
- `account-security-390x844.png`
- `account-sessions-390x844.png`
- capturas desktop adicionales de Equipo y sesiones.

Las capturas se realizaron contra el stack local real con un Owner E2E aislado. El fixture elimina Auth y filas del Business al terminar.

## Fallos observados durante la certificación

- La credencial histórica documentada para `owner.h01@youngkingz.local` ya no autenticaba. No se sobrescribió; el E2E se hizo con fixture aislado.
- El primer intento de copia de migración omitió `citext`; se descartó. La prueba válida copió exclusivamente `iam.access_sessions` con el mismo conteo de origen.
- La primera captura responsive agotó el timeout de 30 s; se elevó a 90 s para el único test visual. La suite final completa pasó 7/7 en 27.1 s.
