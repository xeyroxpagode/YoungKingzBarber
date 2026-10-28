# H01 API contract

Base URL: `http://127.0.0.1:4100`. OpenAPI UI: `/docs`. Private routes require `Authorization: Bearer <Supabase access token>`. Mutating commands require `x-operation-id: <UUID v4>` unless the operation is a native Supabase credential action.

The API verifies the Supabase identity, UserAccount, Staff membership, access state, employment state, operational session, active RoleAssignment, capability, scope and current grant state. It never trusts a browser role field.

## Routes

| Area | Routes | Capability |
|---|---|---|
| System | `GET /health` | public |
| Business | `GET /v1/businesses/current` | authenticated Staff |
| Identity | `GET /v1/iam/me`, `/contexts`, `/context`, `/me/permissions`, `/me/access` | self/context capabilities |
| Context | `PUT /v1/iam/context` | `iam.contexts.switch` + active assignment + revision |
| Staff | `GET/POST /v1/staff`, `GET/PATCH /v1/staff/:id` | `iam.staff.*` |
| Invitations | staff invitation list/issue; invitation reissue/revoke/accept | `iam.invitations.*`; accept requires matching verified email |
| Roles | staff role list/replace/history | `iam.roles.*`; Owner confirmation and last-Owner lock |
| Grants | staff grant list/issue/history; grant revoke; delegable catalog | `iam.grants.*` |
| Access | staff access read/history plus suspend/reactivate/revoke/offboard/reonboard | `iam.access.*` |
| Sessions | `GET /v1/iam/access-sessions`, `POST .../terminate` | own session capabilities |
| Security | account security read, compromise lock, password recovery request | self/public non-enumerating recovery |
| Operations | `GET /v1/operations/:operationId` | `iam.operations.read` |
| Audit | `GET /v1/audit?cursor=&limit=` | `iam.audit.read` |

## Idempotency

The first command inserts `system.operation_attempts` with command name and a canonical SHA-256 request fingerprint. A successful exact retry returns the stored response with `replayed: true`. Reusing an identifier for different content returns `409 IDEMPOTENCY_CONFLICT`. Facts and audit are committed in the same PostgreSQL transaction. Supabase Auth/email effects run after the local commit and use delivery/reconciliation states instead of claiming distributed atomicity.

## Stable errors

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `STALE_REVISION`, `LAST_OWNER_PROTECTED`, `SESSION_REVOKED`, `ACCESS_RESTRICTED`, `INVITATION_INVALID`, `INVITATION_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `EXTERNAL_OUTCOME_UNKNOWN`.

Responses use `{ "error": { "code", "message", "details?" } }`. Absence, denial, stale writes and infrastructure failure are not conflated.
