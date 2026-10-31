$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

& "$PSScriptRoot/assert-local-supabase.ps1"
if (-not $?) { exit 1 }

Push-Location $repoRoot
try {
  supabase db reset --local --no-seed
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  pnpm exec tsx scripts/seed-local-qa.ts
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
