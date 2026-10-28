# H01 test evidence

Certification date: 2026-10-28, America/Buenos_Aires.

## Environment

- Node `v24.13.0`
- pnpm `12.15.0`
- Git `2.55.0.windows.3`
- Docker `29.5.3`
- Supabase CLI `2.90.0`
- Next.js `16.4.3`
- Fastify `5.12.7`
- PostgreSQL 17 in the local Supabase container

## Commands executed

| Command | Result |
|---|---|
| `pnpm install` | PASS |
| `supabase start` | PASS on isolated ports; migration applied |
| `pnpm provision` twice | PASS; first `created: true`, second `created: false`; one durable row |
| `pnpm bootstrap:owner ...` | PASS; pending Owner and invitation delivered to Mailpit |
| controlled invitation acceptance | PASS; Business, employment, access and OWNER became ACTIVE atomically |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS; Fastify TypeScript and Next production build |
| `pnpm test:unit` | PASS — 6/6 |
| `pnpm test:integration` | PASS — 26/26 |
| `pnpm test:e2e` | PASS — 3/3 Chromium |
| isolated custom-schema `pg_dump` / `pg_restore` | PASS; source and restore counts matched |

## Integration coverage

`tests/h01/integration/h01-matrix.spec.ts` implements H01-AT-01 through H01-AT-26. It uses unique businesses and Supabase Auth users, real JWTs, Fastify injection at the HTTP boundary and the live local PostgreSQL database. Covered negative/security cases include terminated sessions, invalid login, default-deny Reception, cross-business UUID, grant revocation, context permission loss, last-Owner blocking, stale revision races and idempotency fingerprint conflict.

The matrix also maps Global Product Freeze AT-29 to H01-AT-19, AT-30 to H01-AT-17 and AT-35 to H01-AT-25.

## Database evidence

The applied migration produced:

```text
business  1 table
iam      11 tables
team      2 tables
system    2 tables
```

The backup certification dumped only H01 schemas with ownership/privileges excluded, restored them into a clean isolated database with minimal Auth identity references, compared Business/Person/Staff/Audit counts, and dropped only the temporary certification database. A full Supabase cluster dump was intentionally rejected after it attempted to reproduce internal platform ownership; the corrected procedure is `pnpm backup:verify`.

## Browser evidence

Chromium verified real password login, Owner Team data, Mi cuenta sessions and non-enumerating recovery. The suite writes real screenshots to `docs/h01/evidence/runtime/team.png` and `account.png`; they are generated from the running application and are not fabricated fixtures.

No passwords, JWTs, cookies, service keys or invitation tokens are recorded here.
