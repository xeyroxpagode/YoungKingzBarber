# P5 · Formularios, componentes y motion

## 44 contratos de formularios

Todos usan labels persistentes, controles nativos accesibles, validación antes de commit, operation ID para mutaciones y resultado explícito. `POLICY_REQUIRED` es un bloqueo funcional.

| Superficie | Contrato implementado | Escritura/resultado | Estado |
|---|---|---|---|
| M03 | búsqueda + filtros clientes | consulta; draft de filtro separado | PASS |
| M05 | crear cliente | Client.create/audit; duplicate review | PASS |
| M06 | editar cliente | versión/dirty/conflict | PASS |
| M08 | fusionar clientes | alias/remap atómico | PASS |
| M11 | nota privada | Note event | PASS |
| M12 | contacto/consentimiento | campos + consent versionado; sin envío | PASS |
| M13 | archivo/restauración | estado, audit; delete bloqueado | PASS |
| M17 | crear/editar servicio | Service version | PASS |
| M18 | variantes | validación, impacto y variant version | PASS |
| M19 | elegibilidad | StaffID activos, impacto y version | PASS |
| M20 | visibilidad | offering público demo | PASS |
| M21 | categoría | alta localizada/duplicado visual | PASS |
| M23 | impacto servicio | before/after, objetos P2; commit bloqueado hasta resolver | PASS |
| M28 | curso | draft; paid policy block | PASS |
| M29 | programa | secciones/temas ordenables y versión | PASS |
| M31 | sesión | fecha/hora/instructor/recurso + conflict | PASS |
| M32 | reprogramar sesión | diff, conflicto y CourseSession.update | PASS |
| M35 | inscripción | ClientID/cupo/duplicado | PASS |
| M37 | cupo/espera | ascenso POLICY_REQUIRED | PASS |
| M38 | asistencia | estado por inscripción/sesión | PASS |
| M39 | finalización | progreso derivado; pendientes bloquean | PASS |
| M40 | cancelar/finalizar/archivar | Course status; P4 intacto | PASS |
| M44 | perfil público | draft version | PASS |
| M45 | galería | File/Object URL temporal + reorder | PASS |
| M47 | publicar | draftVersion compare/publishedVersion | PASS |
| M49 | promoción | draft con objetivos/vigencia preservados | PASS |
| M50 | objetivos promo | IDs P2/P3 elegibles | PASS |
| M51 | condiciones promo | fechas; acumulación policy | PASS |
| M53 | pausar/finalizar | status version; historia intacta | PASS |
| M56 | semana local | siete días, validación e impacto atómico | PASS |
| M57 | excepción local | fecha/tipo/motivo/duplicado | PASS |
| M58 | reglas reserva | enabled; buffers no inferidos | PASS |
| M59 | seña/cancelación | POLICY_REQUIRED, sin dinero | PASS |
| M60 | anticipación | mínimo/horizonte | PASS |
| M61 | preview disponibilidad | servicio/staff/fecha + conflictos | PASS |
| M63 | impacto horario | objetos por owner, sin cancel-all | PASS |
| M64 | recordatorios | regla demo; canal externo no conectado | PASS |
| M67 | datos internos | business version; perfil público intacto | PASS |
| M70 | vincular cuenta | AccountID↔StaffID único | PASS |
| M72 | permisos | diff, expectedVersion, último admin | PASS |
| M73 | suspender cuenta | estado de acceso, no Staff | PASS |
| M74 | preferencias | estado local explícito | PASS |
| M78 | filtros actividad | dominio/query readonly | PASS |
| M81 | preferencias avisos | local; no push/email ficticio | PASS |

Resultado: **44/44 contratos representados y operables**.

## C01–C24

| ID | Componente | Implementación P5 | Estado |
|---|---|---|---|
| C01 | RootHeader | M01 + shell existente | PASS |
| C02 | DetailHeader | M02–M83, back contextual | PASS |
| C03 | OperationalRow | `MoreRow`, multiline y trailing | PASS |
| C04 | SegmentedControl | preview draft/publicado y componentes P1–P4 | PASS |
| C05 | SearchMorph | `Toolbar`, foco/clear/cancel | PASS |
| C06 | FilterSheet | `BottomSheet`, draft/apply/Escape | PASS |
| C07 | EntityPicker | cliente, staff, objetivos, recursos | PASS |
| C08 | FormField | `InputField`/`SelectField` + error | PASS |
| C09 | MoneyField | minor units/ARS en servicios/variantes | PASS |
| C10 | DateTimePicker | sesiones, excepciones y preview | PASS |
| C11 | ReviewSurface | compare + impactos M08/M23/M32/M63/M72 | PASS |
| C12 | StateBlock | neutral/warning/danger/success/policy | PASS |
| C13 | IdentityHero | cliente/servicio/curso/cuenta | PASS |
| C14 | InlineEditor | notas, categorías y programa | PASS |
| C15 | ActivityRow | auditoría readonly | PASS |
| C16 | MediaTile | archivo real, temporary, mover accesible | PASS |
| C17 | CalendarRail | sesiones y slots | PASS |
| C18 | ImpactRow | M23/M40/M62/M63 | PASS |
| C19 | CapabilityRow | controles + diff M71/M72 | PASS |
| C20 | PublicationVersion | draft/publicado en M46/M47 | PASS |
| C21 | PrimaryActionFooter/CTA | acción segura y scrollable | PASS |
| C22 | Toast/Result | `ResultBlock` después de write | PASS |
| C23 | ContextualPopover | shell existente; acciones breves | PASS |
| C24 | AuditEventLink | objeto/tipo/destino propietario | PASS |

## MO01–MO22

Evidencia temporal: `evidence/temporal-evidence.json` y PNGs en `evidence/motion/`. Se capturaron estados before/t000/t120/t300 para interacciones MO03 y MO05–MO22, más tres frames para MO01, MO02 y MO04. Total: **85 frames**. `prefers-reduced-motion` se prueba en ST22.

| ID | Contrato | Evidencia | Estado |
|---|---|---|---|
| MO01 | root → deep | `MO01-structural-*` | PASS |
| MO02 | search morph | `MO02-search-*` | PASS |
| MO03 | row → detail | `MO03-row-detail-*` | PASS |
| MO04 | sheet/picker | `MO04-sheet-*` | PASS |
| MO05 | formulario profundo/foco | `MO05-form-focus-*` | PASS |
| MO06 | reflow condicional | `MO06-conditional-reflow-*` | PASS |
| MO07 | review impacto | `MO07-impact-review-*` | PASS |
| MO08 | reordenamiento | `MO08-program-reorder-*` | PASS |
| MO09 | selección temporal | `MO09-temporal-selection-*` | PASS |
| MO10 | confirmar estado real | `MO10-confirm-real-state-*` | PASS |
| MO11 | media preview | `MO11-media-preview-*` | PASS |
| MO12 | indicador segmentado | `MO12-segment-indicator-*` | PASS |
| MO13 | handoff cross-domain | `MO13-cross-domain-*` | PASS |
| MO14 | cambio estado curso | `MO14-course-status-*` | PASS |
| MO15 | conflicto/destino | `MO15-conflict-expand-*` | PASS |
| MO16 | fusión cliente | `MO16-client-merge-*` | PASS |
| MO17 | draft → publicado | `MO17-draft-publish-*` | PASS |
| MO18 | estado promoción | `MO18-promotion-state-*` | PASS |
| MO19 | intervalo horario | `MO19-schedule-interval-*` | PASS |
| MO20 | asistencia multisección | `MO20-attendance-list-*` | PASS |
| MO21 | capabilities/diff | `MO21-capability-diff-*` | PASS |
| MO22 | aviso leído/destino | `MO22-alert-read-*` | PASS |
