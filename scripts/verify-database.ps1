$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "assert-local-supabase.ps1")
$container = "supabase_db_youngkingz-h01"
docker inspect $container | Out-Null
docker exec $container psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "select n.nspname schema_name,count(*) tables from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('business','iam','team','system') group by n.nspname order by n.nspname;" -c "select provisioning_key,display_name,timezone,status,version from business.businesses where provisioning_key='young-kingz-pilot';"
