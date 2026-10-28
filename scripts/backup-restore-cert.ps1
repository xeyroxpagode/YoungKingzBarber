$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "assert-local-supabase.ps1")
$container = "supabase_db_youngkingz-h01"
$restoreDb = "youngkingz_h01_restore_cert"
$dumpInContainer = "/tmp/youngkingz-h01-custom.dump"
$evidenceDir = Join-Path $PSScriptRoot "..\docs\h01\evidence\runtime"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
$existing = docker exec $container psql -U postgres -d postgres -tAc "select 1 from pg_database where datname='$restoreDb'"
if ($existing -eq "1") { throw "Restore database already exists; refusing to overwrite $restoreDb." }
docker exec $container pg_dump -U postgres -d postgres -Fc --no-owner --no-privileges --schema=business --schema=iam --schema=team --schema=system -f $dumpInContainer
docker cp "${container}:$dumpInContainer" (Join-Path $evidenceDir "youngkingz-h01-cert.dump") | Out-Null
docker exec $container createdb -U postgres -T template0 $restoreDb
try {
  docker exec $container psql -U postgres -d $restoreDb -v ON_ERROR_STOP=1 -c "create extension if not exists pgcrypto; create extension if not exists citext; create schema auth; create table auth.users(id uuid primary key);" | Out-Null
  docker exec $container pg_restore -U postgres -d $restoreDb --section=pre-data $dumpInContainer
  $authIds = docker exec $container psql -U postgres -d postgres -tAc "select distinct auth_user_id from iam.user_accounts where auth_user_id is not null"
  foreach ($authId in $authIds) {
    $cleanId = $authId.Trim()
    if ($cleanId -notmatch "^[0-9a-f-]{36}$") { throw "Unexpected Auth UUID in backup source." }
    docker exec $container psql -U postgres -d $restoreDb -v ON_ERROR_STOP=1 -c "insert into auth.users(id) values ('$cleanId');" | Out-Null
  }
  docker exec $container pg_restore -U postgres -d $restoreDb --section=data $dumpInContainer
  docker exec $container pg_restore -U postgres -d $restoreDb --section=post-data $dumpInContainer
  $source = docker exec $container psql -U postgres -d postgres -tAc "select (select count(*) from business.businesses),(select count(*) from iam.persons),(select count(*) from team.staff_members),(select count(*) from system.audit_events);"
  $restored = docker exec $container psql -U postgres -d $restoreDb -tAc "select (select count(*) from business.businesses),(select count(*) from iam.persons),(select count(*) from team.staff_members),(select count(*) from system.audit_events);"
  if ($source -ne $restored) { throw "Backup verification failed. Source=$source Restored=$restored" }
  Write-Output "Backup and isolated restore verified: $restored"
}
finally {
  docker exec $container dropdb -U postgres --if-exists $restoreDb
}
