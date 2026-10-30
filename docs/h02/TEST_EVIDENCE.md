# H02.U01 — Test evidence

| Command | Result | Passed | Failed |
| --- | --- | ---: | ---: |
| `pnpm lint` | PASS | lint completed with zero warnings | 0 |
| `pnpm typecheck` | PASS | 6 workspaces | 0 |
| `pnpm build` | PASS | API + Web; 14 app routes generated | 0 |
| `pnpm test:unit` | PASS | 6 | 0 |
| `pnpm test:h02:unit` | PASS | 8 | 0 |
| `pnpm test:integration` | PASS | 28 | 0 |
| `pnpm test:h02:integration` | PASS | 18 | 0 |
| `pnpm test:e2e` | PASS | 36 (H01 29 + H02 7) | 0 |
| `pnpm db:reset` | PASS | 3 migrations + seed | 0 |
| `pnpm test:h02:integration` after reset | PASS | 18 | 0 |

The H02 integration matrix covers database constraints, immutable Terms v1/v2/v3 history, Category uniqueness/reactivation conflicts, tenant isolation, optimistic revision conflicts, no-op semantics, idempotent replay, persisted failed operations, account-scoped operation lookup, audit, authorization and all specified concurrency races.

The H02 browser matrix covers the Owner journey, stale local-input preservation, lost-response recovery, accessibility, phone/tablet/desktop layouts, dirty navigation protection and delegated Receptionist capability behavior.
