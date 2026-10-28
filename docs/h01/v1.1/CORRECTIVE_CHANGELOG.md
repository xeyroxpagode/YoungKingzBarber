# H01 V1.1 — Corrective changelog

| Hallazgo | Causa | Correctivo | Archivos principales | Verificación |
|---|---|---|---|---|
| Sesiones duplicadas | carrera consultar/insertar y recreación al vencer el JWT aunque `session_id` siguiera vigente | lock transaccional por sesión de proveedor, reutilización tras refresh, reconciliación sin borrar historia e índice único parcial | `authorization.ts`, migración `202610280002` | H01-V11-01, copia aislada y 28/28 integración |
| Lista de sesiones interminable | query y render sin límite | vistas ACTIVE/HISTORY, cursor, límite, actual primero, historial bajo demanda | `app.ts`, `AccountWorkspace.tsx` | H01-V11-02 y E2E Mi cuenta |
| Correo nuevo precargado | `setEmail(identity.email)` | correo actual de lectura, nuevo correo vacío, igualdad invalidada, estado pendiente | `AccountWorkspace.tsx` | E2E correctivo |
| Contraseña de un campo | `updateUser` directo | contraseña actual como reautenticación, nueva + confirmación, cierre IAM/Supabase de otras sesiones | `AccountWorkspace.tsx` | typecheck/build; recorrido destructivo no automatizado |
| Dos `ACTIVE` ambiguos | enums crudos | relación laboral y acceso con etiquetas explícitas | `TeamWorkspace.tsx` | capturas responsive |
| Acciones imposibles sobre único Dueño | frontend no anticipaba locks existentes | `isSelf`/`isLastOwner`, acciones deshabilitadas y explicación; backend conserva lock transaccional | `service.ts`, `TeamWorkspace.tsx` | AT-23 + E2E visible |
| Roles siempre editables | toggles directos | lectura → borrador → revisión de diferencias → confirmación | `TeamWorkspace.tsx` | E2E de protección y build |
| Contexto permanente | shell ignoraba cantidad de roles | selector sólo con más de un contexto y nombres de producto | `AppShell.tsx`, `ContextWorkspace.tsx` | E2E single-role |
| Incorporación sin revisión | alta directa desde el formulario | edición → revisión → resultado; diferencia Staff/invitación/activación | `TeamWorkspace.tsx` | build; backend cubierto por matriz |
| Invitaciones invisibles | endpoints sin composición UI | estado de entrega, expiración y acciones emitir/reemitir/revocar | `TeamWorkspace.tsx` | backend matriz y build |
| Mi cuenta extensa | dos paneles sin arquitectura interna | Mis datos, Acceso y seguridad, Mis sesiones; self-update revisionado | `AccountWorkspace.tsx`, `app.ts` | E2E y capturas |
| Responsive maestro/detalle | directorio y detalle apilados | pantallas separadas bajo 768 px, retorno contextual y sheets móviles | `globals.css`, `TeamWorkspace.tsx` | 1440, 1280, 768, 390 y 320 px |

No se agregaron roles, capabilities, autenticaciones paralelas ni módulos comerciales.
