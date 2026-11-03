# H03.U01 — Reporte de Implementación (Gate G02/G03/G04)

## Resumen
Se implementó H03.U01 (Clientes y CRM) sobre el stack real del monorepo: Fastify API, contratos Zod, esquema Drizzle, migración PostgreSQL, y frontend Next.js. No se creó un backend paralelo ni se simuló funcionalidad.

## Archivos creados
- `packages/database/src/clients.ts` — Esquema Drizzle de las 4 tablas de clientes.
- `packages/contracts/src/clients.ts` — Contratos Zod y tipos de cliente.
- `supabase/migrations/202611020001_h03_u01_clients.sql` — Migración PostgreSQL con RLS.
- `apps/api/src/modules/clients/routes.ts` — Rutas Fastify de Clientes.
- `apps/api/src/modules/clients/domain.ts` — Dominio puro (normalización, canonicalización, comparación semántica).
- `apps/api/src/modules/clients/commands.ts` — Comandos de mutación con executeOperation + auditoría.
- `apps/api/src/modules/clients/queries.ts` — Lecturas tenant-safe (búsqueda paginada, detalle, contactos, notas, vínculos).
- `apps/web/src/features/clients/api.ts` — Cliente HTTP del frontend.
- `apps/web/src/features/clients/ClientsWorkspace.tsx` — Componente de UI de Clientes.
- `apps/web/src/app/(staff)/clients/page.tsx` — Página de Clientes (ruta `/app/clients`).
- `tests/h03/unit/clients.spec.ts` — Pruebas unitarias de dominio (8 pruebas).
- `tests/h03/integration/clients.spec.ts` — Pruebas de integración HTTP real (19 pruebas).
- `tests/h03/e2e/clients.spec.ts` — Pruebas E2E de Playwright (2 pruebas).
- `artifacts/h03/u01/` — Esta carpeta de evidencia.

## Archivos modificados
- `packages/database/src/schema.ts` — Registró `clients.js` y `clientsSchema`.
- `packages/contracts/src/index.ts` — Exportó `clients`, agregó 6 capacidades (`clients.read/manage`, `clients.notes.read/manage`, `clients.links.read/manage`), las agregó a `roleCapabilities` (Owner: todas; Reception: read/manage/notes.read/manage/links.read; Barber: ninguna).
- `packages/contracts/package.json` — Agregó export `./clients`.
- `apps/api/src/modules/system/operations.ts` — `executeOperation` verifica `business_id` y `actor_account_id` en replay (seguridad contra replay de otro actor).
- `apps/api/src/modules/clients/routes.ts` — (nuevo, registrado en app.ts)
- `apps/api/src/app.ts` — Registró `registerClientsRoutes` y tag de Swagger `clients`.
- `apps/web/src/components/AppShell.tsx` — Agregó navegación "Clientes" cuando existe `clients.read`.
- `vitest.config.ts` — Agregó `tests/h03/**/*.spec.ts` al include.

## Capabilities y roles (Gate G03)
- `clients.read` / `clients.manage`: Owner y Reception.
- `clients.notes.read` / `clients.notes.manage`: Owner y Reception.
- `clients.links.read`: Owner y Reception. `clients.links.manage`: solo Owner (vínculo sensible no se concede indiscriminadamente).
- `Barber`: ninguna capability de clientes.
- Verificado en pruebas: barber no tiene `clients.read` ni `clients.manage` (403 en /v1/clients).

## Endpoints implementados (`/v1/clients`)
- `GET /v1/clients` — Búsqueda y paginación (clients.read). Cursor estable, filtro obligatorio por Business, admite teléfonos compartidos.
- `POST /v1/clients` — Crear ficha (clients.manage). Atómica (perfil + contactos), revisión 1, idempotente por `x-operation-id`.
- `GET /v1/clients/:id` — Detalle autorizado (clients.read). Tenant-safe: devuelve 404 para otro Business sin revelar existencia.
- `PATCH /v1/clients/:id` — Corrección con `expectedRevision` (clients.manage). Stale → 409. No-op semántico → `changed=false`, sin incremento de revisión.
- `POST /v1/clients/:id/contacts` — Agregar contacto (clients.manage). No duplicados exactos, principal único, FK tenant-safe.
- `PATCH /v1/clients/:id/contacts/:contactId` — Corregir contacto (clients.manage).
- `GET /v1/clients/:id/notes` — Consultar notas internas (clients.notes.read). No expuestas en listado.
- `POST /v1/clients/:id/notes` — Crear nota interna (clients.notes.manage). `replacesNoteId` trazable.
- `GET /v1/clients/:id/account-links` — Consultar vínculos (clients.links.read). Creación de vínculos CERRADA (pendiente de U02/U04).

## Errores estables
- 400 VALIDATION_ERROR: campos inválidos, nombre vacío, contacto vacío.
- 401 UNAUTHENTICATED: sin sesión.
- 403 FORBIDDEN: falta de capability.
- 404 NOT_FOUND: ficha/contacto no existe o es de otro Business (no revela existencia).
- 409 STALE_REVISION: revisión obsoleta.
- 409 IDEMPOTENCY_CONFLICT: misma `operation_id` con payload distinto, o usada por otro actor/Business.
- 409 CONFLICT: operación en reconciliación.

## UI Staff (Gate G04)
- Ruta `/app/clients` integrada en el shell existente (AppShell), protegida por `clients.read`.
- Listado con búsqueda, resultados paginados, detalle, edición, contactos, notas internas.
- Estética: violeta como acento, jerarquía editorial, componentes consistentes (`@youngkingz/ui`), responsive, sin naranja, sin íconos improvisados.
- Estados: loading, empty, search empty, validation error, permission denied, save pending/success, stale revision, return navigation.
- Recorrido real verificado por E2E: Listado → búsqueda → creación → detalle → edición → contacto → nota → retorno.

## Decisiones técnicas efectivas
1. Se extiende el dominio existente en lugar de crear backend paralelo.
2. `ClientContact.businessId`/`clientProfileId` son parte de FKs tenant-safe (no opcionales en SQL).
3. Normalización telefónica conservadora: `+54 9 11...` y `11 5555-1234` son valores distintos (no se asume equivalencia).
4. Creación de `ClientAccountLink` cerrada públicamente: no existe endpoint de creación. Queda preparado el esquema para U02/U04.
5. `verified` no se usa; no hay concepto de "cuenta verificada" en la ficha CRM.

**G02: PASS | G03: PASS | G04: PASS**
