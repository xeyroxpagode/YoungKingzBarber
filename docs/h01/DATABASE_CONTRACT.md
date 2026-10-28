# H01 database contract

The authoritative migration is `supabase/migrations/202610280001_h01_foundation.sql`. Drizzle in `packages/database/src/schema.ts` represents the same server-owned structures; it does not create a second migration history.

## Schemas and ownership

- `business.businesses`: tenant identity, lifecycle, version and authorization revision.
- `iam.persons`: canonical human identity data.
- `iam.user_accounts`: one global account per Person, optional Supabase Auth linkage.
- `team.staff_members`: canonical Person/Business employment and access projection.
- `team.staff_relationship_periods`: append-only employment periods with one open period.
- `iam.account_invitations`: product expiry, delivery and acceptance state; only a SHA-256 token hash is stored.
- `iam.role_assignments`: historical OWNER/RECEPTIONIST/BARBER assignments; one active assignment per role and Staff.
- `iam.capability_grants`: individual grants bound to a concrete RoleAssignment.
- `iam.access_sessions`: operational session and selected context independent from JWT lifetime.
- `iam.staff_role_states`: monotonic authorization revision by Staff.
- `iam.user_context_preferences`: preferred assignment by Account/Business.
- `iam.account_security_states`: compromise and credential invalidation boundary.
- `iam.credential_operations`: provider-coordinated credential operation state.
- `iam.account_recovery_cases`: exceptional, evidenced recovery cases.
- `system.operation_attempts`: idempotency fingerprint, result and reconciliation state.
- `system.audit_events`: actor/business/action/resource/outcome/change facts without secrets.

## Invariants

UUIDs are stable primary identities. Business-owned relations carry `business_id`; composite foreign keys prevent incompatible Staff/Business references. Partial unique indexes enforce one active Staff role, active grant, pending invitation and open employment period. Revoked rows remain historical. Reassigning a role creates a new row and cannot revive old grants.

`iam.valid_owner_count` counts only active, authenticated, employed, access-enabled Owners. Commands take a Business advisory transaction lock before any Owner removal/access termination, preventing concurrent removal of the final valid Owner.

## Security

Private schemas are not exposed through the Supabase Data API. `anon` and `authenticated` receive no schema/table access. RLS is enabled on all H01 tables. `service_role` is available only to the server, and Fastify still applies business authorization because privileged connections can bypass RLS.

No password, JWT, refresh token, cookie or reusable invitation token is stored in H01 tables or audit changes.

Migration `202610280002_access_session_correlation.sql` reconciles erroneous open duplicates without deleting history and adds a partial unique index for one open operational row per account, Business and Supabase `session_id`. Refreshing a JWT extends the observed expiry of that same row.
