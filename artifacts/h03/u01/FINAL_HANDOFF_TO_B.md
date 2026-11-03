# H03.U01 — Handoff Final a Actor B

## Dictamen
`IMPLEMENTATION CANDIDATE READY`

No se declara `ACCEPTED / PASS` (corresponde a Actor B). No se emitió `B ACCEPTANCE PASS`.

## Qué se implementó (alcance autorizado U01)
- **Modelo de dominio**: `ClientProfile`, `ClientContact`, `ClientNote`, `ClientAccountLink` en `packages/database/src/clients.ts` y `packages/contracts/src/clients.ts`.
- **Persistencia**: Migración PostgreSQL `supabase/migrations/202611020001_h03_u01_clients.sql` con esquema `clients`, FKs tenant-safe, RLS habilitado, acceso solo vía `service_role`.
- **Backend API**: Módulo Fastify `apps/api/src/modules/clients/` (routes, domain, commands, queries) con 9 endpoints (`GET/POST /v1/clients`, `GET/PATCH /v1/clients/:id`, `POST/PATCH /v1/clients/:id/contacts`, `GET/POST /v1/clients/:id/notes`, `GET /v1/clients/:id/account-links`).
- **Contratos Zod**: `packages/contracts/src/clients.ts` reexportado desde `packages/contracts/src/index.ts`.
- **Capabilities**: `clients.read/manage`, `clients.notes.read/manage`, `clients.links.read/manage` agregadas a `packages/contracts/src/index.ts` (Owner: todas; Reception: read/manage/notes.read/manage/links.read; Barber: ninguna).
- **Seguridad**: `executeOperation` replay verifica `business_id` y `actor_account_id` (corrección de hallazgo previo de replay cross-actor).
- **Frontend**: `apps/web/src/features/clients/` (API client, workspace component) y `apps/web/src/app/(staff)/clients/page.tsx` (ruta `/app/clients`), navegación en AppShell.
- **Pruebas**: 9 unit + 19 integration + 2 E2E, todas PASS. Typecheck, lint, build limpios.

## Qué quedó preparado para U02
- Esquema `ClientAccountLink` completo (`accountId`, `auth_method` restringido, `evidence_reference`, `authority_id/name`, `linked_at`, `revoked_at`, `audit_reference`).
- `revokeClientAccountLink` implementado y auditable (conserva historial).
- `ClientProfile` con identidad estable y `business_id`, listo para vincularse.
- Capabilities `clients.links.read` / `clients.links.manage` definidas.

## Qué contrato de cuenta/CRM puede consumir U04
- `searchClientProfiles` / `findClientProfileById` (consultar fichas del Business).
- `listClientAccountLinks` (consultar vínculos existentes de una ficha).
- `createClientProfile` (preparar ficha antes de vincular).

## Qué mecanismo de vinculación ya es realmente seguro
- Revocación de vínculos (`revokeClientAccountLink`): auditable, tenant-safe, conserva historial.
- Esquema de `ClientAccountLink` con `auth_method` restringido (`staff-verified` | `document` | `pending-u02`) y `evidence_reference` no arbitraria.

## Qué mecanismo requiere prueba de U02/U04
- **Creación de `ClientAccountLink`**: no existe operación pública. El contrato exige prueba acreditada por mecanismo confiable del servidor o procedimiento Staff autorizado y auditable. U01 no simula `verified=true`, teléfono coincidente ni `evidence_reference` arbitrario.

## Cómo se evita que una ficha CRM otorgue titularidad de reservas
- `ClientProfile` no es propietaria de `Attention`/`reservation`.
- `verified` no es titularidad de cuenta (no existe el campo como tal en el modelo).
- No se crea `ClientProfile` automáticamente desde reservas/invitadas.
- Teléfono no es identificador único de Cliente.
- Coincidencia de contacto no es prueba de identidad.

## Archivos de evidencia (`artifacts/h03/u01/`)
- `BASELINE.md` — preflight G00.
- `MIGRATION_REPORT.md` — persistencia G01.
- `IMPLEMENTATION_REPORT.md` — implementación G02/G03/G04.
- `TEST_RESULTS.md` — resultados G05.
- `SECURITY_REVIEW.md` — auditoría de seguridad Fase 06.
- `UX_REVIEW.md` — revisión de UX Fase 06.
- `REQUIREMENT_TEST_EVIDENCE.md` — matriz requirement→código→prueba→evidencia.
- `FINAL_HANDOFF_TO_B.md` — este documento.
- `INFORME_FINAL.md` — informe completo (secciones A-H).

## Estado Git
- Rama: `feature/h03-u01-implementation` (desde `f1997d9a1b0ea0a856525b5ce3faa056e8eda4c0`).
- No hubo commit ni push durante la sesión.
- Archivos preexistentes: ninguno modificado fuera del alcance U01.
