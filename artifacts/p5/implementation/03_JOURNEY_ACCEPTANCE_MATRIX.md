# P5 · Matriz R5-01–R5-60

La evidencia ejecutable está en `tests/more-ui.spec.ts`. Cada recorrido verifica destino y consecuencia contractual; las mutaciones y handoffs críticos tienen casos adicionales en el mismo archivo.

| ID | Recorrido | Consecuencia comprobada | Estado |
|---|---|---|---|
| R5-01 | Buscar y consultar cliente | query local → ficha canónica | PASS |
| R5-02 | Alta cliente | Client.create versionado | PASS |
| R5-03 | Coincidencia de cliente | deriva a revisión, no duplica | PASS |
| R5-04 | Fusionar clientes | alias/remap, historia intacta | PASS |
| R5-05 | Editar contacto | guarda campos; no envía mensaje | PASS |
| R5-06 | Crear turno desde cliente | handoff P2 con ClientID precargado | PASS |
| R5-07 | Consultar pedido cliente | objeto P3 y retorno | PASS |
| R5-08 | Historial económico cliente | ventas P4 separadas | PASS |
| R5-09 | Nota privada | mutación real + audit | PASS |
| R5-10 | Archivar/restaurar | estado cambia; historia permanece | PASS |
| R5-11 | Consultar catálogo servicio | catálogo único P2 | PASS |
| R5-12 | Crear servicio | interno y oculto por defecto | PASS |
| R5-13 | Cambiar precio | nueva versión, snapshots intactos | PASS |
| R5-14 | Cambiar duración | afectados antes del commit | PASS |
| R5-15 | Cambiar profesionales | sólo StaffID elegibles | PASS |
| R5-16 | Publicar servicio | versión pública demo | PASS |
| R5-17 | Ocultar servicio | nuevas reservas bloqueadas, previas intactas | PASS |
| R5-18 | Desactivar con turnos | deriva a M23/P2 | PASS |
| R5-19 | Historial servicio | versiones/usos legibles | PASS |
| R5-20 | Crear curso borrador | no crea sesiones/ventas | PASS |
| R5-21 | Editar programa | orden y versión | PASS |
| R5-22 | Crear sesión | slot/recurso revalidados | PASS |
| R5-23 | Seleccionar instructor | staff activo y recursos reales | PASS |
| R5-24 | Curso choca con turno | CONFLICT localizado | PASS |
| R5-25 | Inscribir participante | inscripción única, no venta | PASS |
| R5-26 | Curso cupo completo | no excede capacidad | PASS |
| R5-27 | Gestionar espera | POLICY_REQUIRED, sin ascenso falso | PASS |
| R5-28 | Registrar asistencia | estado por sesión | PASS |
| R5-29 | Consultar progreso | derivado de asistencia | PASS |
| R5-30 | Reprogramar con inscritos | review de afectados | PASS |
| R5-31 | Curso y Finanzas | handoff, no cobro implícito | PASS |
| R5-32 | Cancelar/finalizar/archivar | docencia separada de obligación | PASS |
| R5-33 | Editar presencia pública | sólo draft | PASS |
| R5-34 | Gestionar galería | Object URL temporal + reorder | PASS |
| R5-35 | Preview borrador | draft/publicado distinguibles | PASS |
| R5-36 | Publicar perfil demo | publishedVersion avanza tras write | PASS |
| R5-37 | Crear promoción | draft preservado | PASS |
| R5-38 | Condiciones/preview promo | vigencia validada; policy visible | PASS |
| R5-39 | Activar/aplicar promoción | bloqueada sin política | PASS |
| R5-40 | Pausar/finalizar promo | usos históricos intactos | PASS |
| R5-41 | Editar semana | intervalos e impacto | PASS |
| R5-42 | Crear excepción | duplicado/conflicto controlado | PASS |
| R5-43 | Cierre con reservas | objetos agrupados por owner | PASS |
| R5-44 | Cambiar anticipación | regla real y preview | PASS |
| R5-45 | Configurar señas/cancelación | POLICY_REQUIRED; sin dinero | PASS |
| R5-46 | Vista previa disponibilidad | intersección Agenda/curso/recurso | PASS |
| R5-47 | Recordatorios | regla demo, entrega no conectada | PASS |
| R5-48 | Datos del negocio | interno ≠ público | PASS |
| R5-49 | Consultar cuentas | AccountID explícito | PASS |
| R5-50 | Vincular staff a cuenta | relación sin fusionar IDs | PASS |
| R5-51 | Cambiar capacidades | review + commit atómico | PASS |
| R5-52 | Revocación durante operación | versión vieja rechazada | PASS |
| R5-53 | Suspender/reactivar cuenta | staff/historia intactos | PASS |
| R5-54 | Último admin | operación bloqueada | PASS |
| R5-55 | Actividad filtrada | query/dominio sobre audit | PASS |
| R5-56 | Handoff desde evento | objeto propietario trazable | PASS |
| R5-57 | Campana y destino | misma bandeja/estado | PASS |
| R5-58 | Marcar aviso leído | read cambia, resolved no | PASS |
| R5-59 | Resolver incidencia | destino por dominio/ID | PASS |
| R5-60 | Auditoría de corrección | compensación sin reescritura | PASS |

Resultado ejecutado: **60/60 recorridos PASS**, más 12 recorridos mutantes/handoffs y un barrido M01–M83.
