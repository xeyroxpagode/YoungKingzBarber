$ErrorActionPreference = "Stop"
$expectedPort = 55322
$expectedProject = 'project_id = "youngkingz-h01"'
$configPath = Join-Path $PSScriptRoot "..\supabase\config.toml"
$config = Get-Content -LiteralPath $configPath -Raw
if ($config -notmatch [regex]::Escape($expectedProject)) { throw "Refusing operation: Supabase project_id is not youngkingz-h01." }
if ($config -notmatch 'port = 55322') { throw "Refusing operation: PostgreSQL is not configured on isolated port $expectedPort." }
$client = [System.Net.Sockets.TcpClient]::new()
try {
  $client.Connect("127.0.0.1", $expectedPort)
} catch {
  throw "YoungKingZ PostgreSQL is not listening on port $expectedPort. Run pnpm supabase:start."
} finally {
  $client.Dispose()
}
Write-Output "Local YoungKingZ Supabase target verified on port $expectedPort."
