# H01 V1.1 — CURRENT audit

Fecha de inspección: 2026-10-28. Rama: `feature/h01-implementation`. HEAD auditado: `b94bd29d6ca0c29f1806e5b7611e22cfa97c1eb8`.

## Estado operativo inspeccionado

- El árbol de trabajo estaba limpio. Los worktrees de `main`, Dueño, Recepción y Barbero no fueron modificados.
- Supabase local `youngkingz-h01` estaba activo en 55321–55327. No se ejecutó `db reset` ni se eliminaron datos.
- El puerto 8089 pertenecía al worktree de Recepción y quedó intacto. Los puertos previstos de H01, 3100 y 4100, estaban libres.
- La implementación real consta de Next.js (`apps/web`), Fastify (`apps/api`), PostgreSQL/Supabase y los paquetes compartidos de contratos, base de datos y UI.

## Mapa de superficies y autoridad

| Superficie | Ruta / componente | Datos y operaciones | Autoridad efectiva | Estados observados |
|---|---|---|---|---|
| Login | `/login` · `LoginForm` | Supabase password sign-in | Pública; la API vuelve a autorizar Staff | error uniforme, sesión vencida, acceso restringido |
| Activación | `/activate` · `ActivationForm` | invitación + identidad Supabase + aceptación explícita | destinatario acreditado | invitación ausente, error, éxito |
| Recuperación | `/recover`, `/reset-password` | solicitud no enumerante y `updateUser` | pública / sesión recovery | enviado, inválido, éxito básico |
| Shell | `(staff)/layout` · `AppShell` | contexto y capabilities | Staff activo | navegación por capability |
| Equipo/directorio | `/team` · `TeamWorkspace` | `/v1/staff` | `iam.staff.list` | carga, error, vacío, selección |
| Detalle | `/team` · `MemberDetail` | Staff, roles, grants, acceso e historial | capabilities por endpoint | activo, suspendido, revocado, histórico |
| Incorporación | modal `CreateMember` | `POST /v1/staff` | `iam.staff.create` | alta e invitación opcional |
| Invitaciones | endpoints H01; sin superficie administrativa completa | listar, emitir, reemitir, revocar, aceptar | `iam.invitations.*` | estados persistidos y entrega separada |
| Roles | `MemberDetail` | roles vigentes e historial; replace revisionado | `iam.roles.*` | multirol, stale, último Dueño |
| Delegaciones | `MemberDetail` | catálogo cerrado y grants RECEPTIONIST | `iam.grants.*` | vigente/revocado |
| Control de acceso | `MemberDetail` | suspend/reactivate/revoke/offboard/reonboard | `iam.access.*` | revisión, autoacción prohibida, último Dueño |
| Historial | detalle + `/v1/audit` | hechos de roles/acceso/auditoría | lectura tenant-scoped | reciente; API general paginada |
| Contextos | `/context` · `ContextWorkspace` | lista, actual, switch revisionado | `iam.contexts.*` | uno, varios, stale |
| Mi cuenta | `/account` · `AccountWorkspace` | identidad, credenciales, sesiones, compromiso | self capabilities | carga/error/éxito básico |
| Asistencia excepcional | CLI + runbook | abre caso y bloquea sesiones | operador autorizado fuera de HTTP | no restituye OWNER ni credenciales |

## Hallazgos comprobados

| ID | Clase | Ruta / componente | CURRENT comprobado | TARGET / correctivo | Causa y archivos | Severidad / reproducción |
|---|---|---|---|---|---|---|
| AUD-01 | BUG | API auth · `AuthorizationService` | Una sesión auténtica produjo 4 filas operativas concurrentes. La cuenta piloto acumuló 28 filas para 8 `session_id`. | Una fila por `(account, business, provider session)` incluso bajo concurrencia; conservar la historia existente. | Patrón consultar-y-luego-insertar sin restricción única ni upsert en `authorization.ts`; carga paralela de shell y workspace. | Alta. Consulta SQL agrupada por `auth_session_id`; timestamps separados por 0–4 ms. |
| AUD-02 | UX | `/account` · sesiones | La API devuelve toda la historia y la UI renderiza todos los registros no revocados en una sola columna. | Vigentes primero, máximo cinco adicionales, historial bajo demanda y consulta paginada. | Query sin `limit/cursor` en `app.ts`; filtro/render ilimitado en `AccountWorkspace`. | Alta con 28 filas del piloto. |
| AUD-03 | BUG | `/account` · cambiar correo | “Correo nuevo” inicia con el correo actual. | Correo actual sólo lectura; campo nuevo vacío; impedir igualdad y mostrar verificación pendiente sin afirmar cambio. | `load()` ejecuta `setEmail(identity.email)`. | Media; visible al abrir Mi cuenta. |
| AUD-04 | SECURITY | `/account` · cambiar contraseña | Un único campo llama `supabase.auth.updateUser` desde cualquier sesión autenticada, sin paso visible de identidad reciente ni confirmación. | Reautenticación válida, nueva contraseña y confirmación; limpiar secretos y coordinar sesiones. | `AccountWorkspace.tsx`. | Alta por inspección del flujo real. Recuperación por enlace sigue siendo un flujo separado y válido. |
| AUD-05 | VISUAL | `/team` · detalle | Dos pills muestran `ACTIVE` sin explicar entidad. | “Relación laboral: Activa” y “Acceso: Activo”, con lenguaje de producto. | `MemberDetail` renderiza enums crudos. | Media; reproducido con Owner piloto. |
| AUD-06 | UX | `/team` · roles/acceso | Roles siempre editables. La UI ofrece suspender, revocar, desvincular o retirar OWNER sobre el propio y/o único Dueño; sólo el backend rechaza después. | Consulta primero, modo editar/revisar/confirmar; restricciones explicadas y acciones deshabilitadas antes del envío. | `MemberDetail`; backend sí mantiene lock transaccional y prohibición de autoacción. | Alta; inspección frontend + regresiones AT-23 y lifecycle. |
| AUD-07 | UX | shell y `/context` | “Contexto” es raíz permanente aunque haya un único contexto; muestra `OWNER` crudo y el texto técnico `Staff · H01`. | Ocultar selector con un rol; mostrar “Dueño/Recepción/Barbero”; eliminar texto técnico. | `AppShell.tsx`, `ContextWorkspace.tsx`. | Media; cuenta piloto con OWNER único. |
| AUD-08 | VISUAL | `/team` · directorio | Roles y estados se presentan como enums; no hay filtro por situación y móvil mantiene directorio+detalle en el mismo documento. | Lenguaje legible, filtro coherente y detalle separado en móvil sin scroll horizontal. | `TeamWorkspace.tsx`, `globals.css`. | Media. |
| AUD-09 | UX | `/team` · historial | Acciones técnicas (`access.suspend`, `OWNER`) y fecha, sin resultado/actor comprensible. | Hechos legibles, fecha local, resultado y actor sólo cuando sea conocido. | Mapeo de UI insuficiente; endpoints de detalle no exponen aún actor/outcome. | Media. |
| AUD-10 | MISSING STATE | `/team` · invitaciones | El backend soporta listar/emitir/reemitir/revocar/aceptar y delivery status, pero el detalle no representa esos estados ni permite recuperación. | Mostrar estados y acciones válidas sin confundir registro con entrega. | Superficie omitida en `TeamWorkspace`. | Alta para operación administrativa. |
| AUD-11 | UX | incorporación | El alta se confirma directamente desde campos y roles, sin revisión; el fallo de entrega queda persistido pero el cierre visual no lo explica. | Paso de revisión; resultado distingue Staff, invitación y entrega. | `CreateMember`; `createStaff` persiste `delivery_status` luego del commit. | Media. |
| AUD-12 | UX | `/account` · arquitectura | Datos, credenciales, sesiones y compromiso compiten en dos paneles extensos; “Mis datos” es sólo lectura sin edición. | Tres secciones internas: Mis datos, Acceso y seguridad, Mis sesiones; edición explícita y no-op disabled. | `AccountWorkspace.tsx`; falta endpoint self-update. | Media. |
| AUD-13 | UX | terminación de sesiones | “Cerrar otras” revoca IAM pero no solicita la revocación `others` de Supabase desde el cliente. | Coordinar proveedor e IAM y describir con precisión resultados parciales. | `AccountWorkspace.terminate`; API sólo controla capa operacional. | Alta. |
| AUD-14 | VISUAL | responsive/accesibilidad | Modal no implementa Escape/retorno de foco; a 560–900 px el directorio y detalle quedan apilados, no como pantallas separadas. | Diálogo accesible, foco visible y navegación móvil maestro/detalle. | `TeamWorkspace.tsx`, `globals.css`. | Media por inspección de código y viewport. |

## Sospechas no reproducidas o límites

- `NOT REPRODUCED`: no se encontró creación de sesión por refresh ordinario secuencial. La duplicación confirmada es una carrera de creación concurrente para el mismo `session_id`.
- `NOT REPRODUCED`: no se comprobó acceso cross-business; consultas y pruebas existentes incluyen `business_id`, y AT-17 lo rechaza.
- `NOT REPRODUCED`: no se comprobó bypass del último Dueño en backend. El lock de negocio y `iam.valid_owner_count` existen y AT-23 cubre roles; la desviación está en la anticipación visual.
- La asistencia excepcional abre un caso y revoca sesiones; el runbook declara correctamente que no recupera autoridad, contraseña ni OWNER. No debe presentarse como recuperación completada.
- La certificación de email y correo de recuperación depende del Supabase/Mailpit local. No se afirmará entrega externa.

## Correctivo planificado

1. Corregir correlación concurrente de sesiones con migración compatible, upsert y regresión de concurrencia.
2. Introducir consultas paginadas para sesiones e historial y estados legibles.
3. Reestructurar Equipo, edición/revisión de roles, incorporación, invitaciones y restricciones visibles.
4. Reestructurar Mi cuenta, correo, contraseña con reautenticación y coordinación de sesiones.
5. Hacer el shell/contexto condicional y traducir el lenguaje de producto.
6. Certificar typecheck, builds, matriz 26/26, regresiones nuevas, E2E y capturas reales en los viewports requeridos.
