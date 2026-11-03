# H03.U01 — Reporte de Persistencia (Gate G01)

## Esquema Drizzle (`packages/database/src/clients.ts`)
Esquema `clients` con cuatro tablas, aislado por `business_id` en cada una y FKs tenant-safe:

- **client_profiles**: `id` (PK UUID), `business_id` (FK a business.businesses), `name` (CHECK no vacío), `first_name`, `last_name`, `lifecycle_state` (CHECK active/archived), `revision` (CHECK >= 1, default 1), `idempotency_key`, `created_at`, `updated_at`. Unique `(business_id, id)`.
- **client_contacts**: `id` (PK UUID), `business_id`, `client_profile_id`, `type` (CHECK telefono/email/whatsapp), `value`, `normalized_value`, `label`, `is_primary`, `created_at`, `updated_at`. Composite FK `(business_id, client_profile_id)` → `client_profiles(business_id, id)`. Unique `(business_id, client_profile_id, type, normalized_value)`.
- **client_notes**: `id` (PK UUID), `business_id`, `client_profile_id`, `text` (CHECK no vacío), `author_id`, `author_name`, `created_at`, `replaces_note_id` (FK a client_notes.id, ON DELETE SET NULL). Composite FK `(business_id, client_profile_id)`.
- **client_account_links**: `id` (PK UUID), `business_id`, `client_profile_id`, `account_id` (FK a iam.user_accounts), `auth_method` (CHECK staff-verified/document/pending-u02), `evidence_reference`, `authority_id` (FK a iam.user_accounts), `authority_name`, `linked_at`, `revoked_at`, `audit_reference`. Composite FK `(business_id, client_profile_id)`. Unique `(business_id, client_profile_id, account_id)`.

## Migración PostgreSQL (`supabase/migrations/202611020001_h03_u01_clients.sql`)
- Crea esquema `clients` y las cuatro tablas con las mismas restricciones que Drizzle.
- Habilita RLS en todas las tablas.
- Revoca acceso a `anon`/`authenticated`; otorga solo a `service_role` (acceso solo vía backend autorizado).
- Aplicada al entorno de prueba local (Supabase en puerto 55322) mediante `supabase migration up`.

## Registro en `packages/database/src/schema.ts`
Se agregó `export * from "./clients.js"` y `export const clientsSchema = pgSchema("clients")`.

## Corrección de seguridad en `executeOperation` (`apps/api/src/modules/system/operations.ts`)
La ruta de replay ahora verifica `business_id` y `actor_account_id` de la operación original antes de devolver un resultado cacheado. Una identidad de operación conocida no permite recuperar resultados de otro actor o Business (IDEV-01). Cambio mínimo y compatible: las pruebas H01/H02 existentes siguen pasando porque usan el mismo actor/Business en el replay.

## Verificación G01
- `npx tsc --noEmit` — limpio en todos los paquetes.
- `pnpm build` — build de producción exitoso (API + Web).
- Migración aplicada a base de prueba local (Supabase local).
- No se crearon cuentas IAM por accidente (no hay inserciones en `iam.user_accounts` ni `team.staff_members` desde el código de U01).
- No se declaró ninguna tabla en esquema PostgreSQL equivocado.

**G01: PASS**
