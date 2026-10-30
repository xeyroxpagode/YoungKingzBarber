# H02.U01 local runbook

From the canonical workspace:

```powershell
pnpm supabase:start
pnpm db:reset
pnpm dev
```

Web: `http://localhost:3100/services`. API: `http://127.0.0.1:4100`. OpenAPI: `http://127.0.0.1:4100/docs`.

Certification commands:

```powershell
pnpm test:unit
pnpm test:integration
pnpm test:h02:unit
pnpm test:h02:integration
pnpm test:e2e
pnpm typecheck
pnpm build
pnpm db:reset
```

`pnpm db:reset` is deliberately guarded by `scripts/assert-local-supabase.ps1` and refuses a database other than the YoungKingZ local PostgreSQL port 55322.
