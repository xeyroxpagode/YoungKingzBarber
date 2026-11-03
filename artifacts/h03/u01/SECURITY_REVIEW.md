# H03.U01 — Auditoría de Seguridad (Fase 06)

## Identidad
- **Equivalencia Person/UserAccount/StaffMember/ClientProfile**: NO se introdujo. `ClientProfile` es una entidad distinta con identidad UUID estable (`id`), separada de `StaffRecord` (personal) y de `iam.user_accounts`. `createClientProfile` no toca `world.staff` ni crea cuentas de usuario (verificado en IT-18).
- **Apropiación de fichas por teléfono**: NO es posible. No existe creación automática de vínculos por coincidencia telefónica. No hay concepto de `verified=true` como titularidad. `revision` inicia en 1 y solo indica estado de la ficha.
- **Ficha otorga acceso a reservas**: NO. `ClientProfile` no está ligada a `Attention`/`reservation` por propiedad. No se creó `Reservation`, `BookingPolicy`, ni `Attendance` (frontera con U02/U04/U05 respetada).

## Privacidad
- **Notas internas expuestas en ruta**: NO. `ClientNote` no forma parte del DTO de listado (`searchClientProfiles` devuelve perfiles sin `notes`; verificado en IT-13). Las notas requieren `clients.notes.read` / `clients.notes.manage`.
- **Búsqueda pública enumerar clientes**: NO. `searchClientProfiles` exige `business_id` y filtra tenant-safe. `findClientProfileById` devuelve null para otro Business sin revelar existencia (verificado en IT-04, IT-12).
- **FK expone datos de otro Business**: NO. Todas las operaciones de lectura/escritura filtran por `business_id`. `addClientContact` rechaza FK de otro Business (verificado en IT-16). RLS habilitado en todas las tablas de `clients`, acceso solo vía `service_role`.

## Historial
- **Corrección pisa datos sin revisión**: NO. `updateClientProfile` exige `expectedRevision`; stale → `dependency` (409) sin cambios (verificado en IT-06, IT-08). No-op semántico → `changed=false`, sin incremento de revisión ni evento de auditoría (verificado en IT-09).
- **Notas conservan autoría**: SÍ. `createClientNote` registra `author_id`, `author_name`, `created_at` y `replaces_note_id` trazable (verificado en IT-13).
- **Vínculo revocado desaparece del historial**: NO. No existe operación pública de creación de vínculo; `revokeClientAccountLink` (disponible para uso interno) establece `revoked_at` y conserva el registro (verificado en IT-15).

## Confiabilidad
- **Retry duplica ficha**: NO. Idempotencia por `operation_id` (verificado en IT-10, IT-11).
- **Resultado reproducido a otro actor**: NO. `executeOperation` verifica `business_id` y `actor_account_id` en el replay (corrección de hallazgo previo). Un actor diferente no obtiene resultado de operación ajena aunque conozca el `operation_id` y payload.
- **Conflicto de versión como escritura exitosa**: NO. `expectedRevision` se valida antes de mutar; stale → `dependency` (409) (verificado en IT-08).

## UX y capabilities
- **UI concede permisos**: NO. La UI solo renderiza acciones según capacidad; la verificación real está en el backend/dominio.
- **Acciones sin backend real**: NO. Las pruebas E2E corren contra el servidor de desarrollo real (Fastify + PostgreSQL en memoria).
- **Capabilities técnicas mostradas al usuario**: NO. Los nombres de permiso (`clients.notes.manage`, etc.) no se renderizan en la UI.
- **CRUD genérico que contradiga la experiencia**: NO. La superficie sigue el diseño aprobado (lista plana, sin badge de verificación, sin auto-merge).

## Regresión
- `pnpm build`, `pnpm typecheck`, `pnpm lint`: limpios. No se rompieron sesiones Staff, catálogo, profesionales, horarios ni servicios asignados. No se modificó `S15Clientes` ni operaciones legacy de H01/H02.

## Riesgos residuales
1. **Aislamiento tenant en capa de aplicación, no en motor de BD**: Aunque RLS está habilitado en las tablas de `clients`, no se definieron políticas de RLS específicas (el acceso es vía `service_role` desde el backend). Si se expone el esquema directamente a clientes de la BD, habría que agregar políticas RLS.
2. **Creación de `ClientAccountLink` cerrada**: Pendiente de mecanismo verificable de titularidad por U02/U04. No se simula verificación.
3. **Replay de `executeOperation`**: La corrección agrega verificación de `business_id`/`actor_account_id`, pero no hay pruebas de integración específicas para el escenario de replay cross-actor (cubierto por diseño, no por prueba específica).
