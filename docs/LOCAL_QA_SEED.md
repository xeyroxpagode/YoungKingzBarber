# Seed local para desarrollo y QA manual

Este seed es exclusivamente local. No forma parte de las migraciones, del provisioning ni del bootstrap de producción. `pnpm db:reset` verifica el proyecto `youngkingz-h01` y el puerto PostgreSQL aislado `55322`, reconstruye la base local y recién entonces aplica `supabase/seeds/local-qa.sql`.

## Arranque reproducible

```powershell
pnpm supabase:start
pnpm db:reset
pnpm dev
```

La aplicación queda disponible en `http://127.0.0.1:3100` y Supabase Studio en `http://127.0.0.1:55323`.

## Credenciales

| Rol | Email | Contraseña |
| --- | --- | --- |
| Owner | `owner@youngkingz.local` | `YoungKingZ-Owner-2026!` |
| Receptionist | `receptionist@youngkingz.local` | `YoungKingZ-Reception-2026!` |
| Barber | `barber@youngkingz.local` | `YoungKingZ-Barber-2026!` |

Las tres cuentas están confirmadas y activas dentro del Business `Young KingZ Dev`.

## Fixtures mínimos

- H01: tres Staff activos con cuenta persistente, período laboral abierto, invitación aceptada y asignación efectiva de Owner, Receptionist o Barber.
- U01: categoría activa `Cortes` y servicio publicado `Corte clásico`, con términos comerciales v1 en ARS.
- U02: el Receptionist tiene un ProfessionalProfile `ACTIVE`; el Barber está activo y deliberadamente no tiene ProfessionalProfile, para recorrer el alta propia.

El seed no crea `capability_grants`: cada cuenta usa únicamente las capabilities del rol definidas por Product Truth.
