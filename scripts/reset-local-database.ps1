$ErrorActionPreference = "Stop"

& "$PSScriptRoot/assert-local-supabase.ps1"
if (-not $?) { exit 1 }

supabase db reset --local
exit $LASTEXITCODE
