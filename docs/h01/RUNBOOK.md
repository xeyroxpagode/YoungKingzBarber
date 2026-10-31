# H01 local runbook (Windows PowerShell)

## Requirements

Node.js 24+, pnpm 12+, Git, Docker Desktop and Supabase CLI 2.90+ are required. Docker must be running. YoungKingZ uses ports 3100, 4100, 55321, 55322, 55323, 55324 and 55327; do not stop or reuse the HomePlus project on 54321–54327.

## Install and configure

```powershell
Set-Location 'C:\Users\thega\Desktop\YoungKingZ-H01-Implementation'
pnpm install
Copy-Item .env.example .env
pnpm supabase:start
supabase status -o env
```

Copy the local URL and keys reported by `supabase status` into `.env`, `apps/api/.env` and `apps/web/.env.local`. `SUPABASE_SERVICE_ROLE_KEY` belongs only in API/internal process configuration. Never prefix it with `NEXT_PUBLIC_`.

## Database lifecycle

```powershell
pnpm supabase:status
pnpm db:verify
pnpm db:reset       # guarded: local port 55322 and project youngkingz-h01 only
pnpm supabase:stop
```

`supabase/migrations/*.sql` is the only migration history. `pnpm db:reset` destroys only the verified local YoungKingZ database, reapplies that history and then loads the development/manual-QA seed documented in [`docs/LOCAL_QA_SEED.md`](../LOCAL_QA_SEED.md). That seed is not part of provisioning or production bootstrap.

## Provision and bootstrap

```powershell
pnpm provision
pnpm bootstrap:owner -- --email owner@example.com --first-name 'Nombre' --last-name 'Apellido'
```

The Owner email is mandatory and never inferred. The second Owner must be created from Team and assigned `OWNER` through the ordinary role command. Local mail is visible at `http://127.0.0.1:55324`.

The recipient follows the Supabase invite, authenticates, reviews `/activate?invitation=...` and explicitly posts acceptance. GET never consumes an invitation.

## Develop

```powershell
pnpm dev
# Web: http://localhost:3100
# API: http://127.0.0.1:4100
# OpenAPI UI: http://127.0.0.1:4100/docs
```

## Account and recovery

Password and email changes use official Supabase Auth calls from Mi cuenta. The API maintains operational session revocation independently of JWT lifetime. A compromise action sets `recovery_required`, advances `sessions_valid_after` and revokes every operational session.

Exceptional recovery requires all evidence explicitly:

```powershell
pnpm recovery:admin -- `
  --account-id '<uuid>' `
  --operator '<authorized operator>' `
  --authorization-reference '<case/reference>' `
  --evidence '<reference-1>,<reference-2>' `
  --reason '<reason>'
```

This command does not mint an Owner role or bypass Auth.

## Verification

```powershell
pnpm typecheck
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm backup:verify
pnpm evidence
```

Integration/E2E commands require local keys in the environment. Use controlled test identities only. Never commit passwords, JWTs, cookies, invitation material or service keys.
