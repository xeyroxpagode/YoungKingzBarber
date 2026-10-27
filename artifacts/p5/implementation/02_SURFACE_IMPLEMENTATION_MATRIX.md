# P5 · Matriz M01–M83

Estado común: **PASS funcional**. Cada fila corresponde a una superficie real del prototipo, tiene `data-testid=surface-Mxx`, navegación contextual y captura en `evidence/screens/Mxx-baseline.png`. El query `p5Surface` existe sólo para el harness externo; no hay atlas ni explorador de IDs dentro del teléfono.

| ID | Superficie | Tipo/acción implementada | Estado |
|---|---|---|---|
| M01 | Más | root de siete destinos, scroll único y BottomNav | PASS |
| M02 | Clientes | lista canónica, búsqueda, filtros, alta y ficha | PASS |
| M03 | Buscar y filtrar | query contextual, no-match y retorno | PASS |
| M04 | Ficha de cliente | identidad, actividad P2/P3/P4 y CTA turno | PASS |
| M05 | Registrar cliente | validación, duplicados y alta canónica | PASS |
| M06 | Editar datos | prefill, dirty, versión y guardado | PASS |
| M07 | Posibles duplicados | comparación y derivación a fusión | PASS |
| M08 | Fusionar clientes | principal/alias, impactos y remap | PASS |
| M09 | Turnos y atenciones | lectura P2 y handoff por reserva | PASS |
| M10 | Compras, pedidos y cobros | lectura P3/P4 sin saldo inventado | PASS |
| M11 | Notas y preferencias | editor inline y auditoría | PASS |
| M12 | Contacto y consentimiento | contacto, decisión explícita, sin envío | PASS |
| M13 | Archivo y privacidad | archive/restore; delete bloqueado | PASS |
| M14 | Historial de identidad | eventos y alias inmutables | PASS |
| M15 | Servicios | catálogo canónico, filtros y alta | PASS |
| M16 | Detalle del servicio | versión, estado, disponibilidad e impactos | PASS |
| M17 | Crear o editar servicio | precio/duración/categoría; revisión | PASS |
| M18 | Variantes, precio y duración | defaults explícitos y review | PASS |
| M19 | Profesionales habilitados | elegibilidad StaffID real | PASS |
| M20 | Disponibilidad pública | publicar/ocultar demo separado | PASS |
| M21 | Categorías | editor localizado y recuentos | PASS |
| M22 | Servicios similares | coincidencias sin duplicación automática | PASS |
| M23 | Impacto del cambio | before/after y reservas propietarias | PASS |
| M24 | Estado del servicio | desactivar sin cancelar compromisos | PASS |
| M25 | Historia y uso | versiones y usos P2 | PASS |
| M26 | Cursos | próximos, históricos y alta | PASS |
| M27 | Detalle del curso | configuración y seguimiento | PASS |
| M28 | Crear o editar curso | borrador y paid POLICY_REQUIRED | PASS |
| M29 | Programa y contenidos | secciones ordenables/versionadas | PASS |
| M30 | Sesiones | cronograma, alta y asistencia | PASS |
| M31 | Nueva sesión | fecha, instructor, recurso y conflicto | PASS |
| M32 | Reprogramar sesión | before/after e inscritos afectados | PASS |
| M33 | Instructor y recursos | selector con elegibilidad real | PASS |
| M34 | Inscripciones | listado y alta contextual | PASS |
| M35 | Inscribir participante | Cliente canónico, cupo y separación comercial | PASS |
| M36 | Detalle de inscripción | asistencia y situación económica | PASS |
| M37 | Capacidad y espera | cupo real; promoción bloqueada por policy | PASS |
| M38 | Asistencia | estado por participante y sesión | PASS |
| M39 | Finalización y progreso | cálculo desde asistencia | PASS |
| M40 | Cancelar curso o sesión | impactos; sin refund/message ficticio | PASS |
| M41 | Situación económica | curso gratuito/pago y handoff P4 | PASS |
| M42 | Cursos históricos | finalizados/archivados, empty real | PASS |
| M43 | Presencia y promociones | hub de perfil y campañas | PASS |
| M44 | Información pública | edición de draft independiente | PASS |
| M45 | Galería pública | archivos reales temporales y reorder accesible | PASS |
| M46 | Vista previa Cliente | toggle draft/publicado | PASS |
| M47 | Revisar y publicar | diff de versiones y publish demo | PASS |
| M48 | Promociones | lista, estados e historia | PASS |
| M49 | Crear promoción | draft preservado y policy explícita | PASS |
| M50 | Objetivos de la promoción | servicios P2/productos P3 canónicos | PASS |
| M51 | Vigencia y condiciones | fechas y acumulación POLICY_REQUIRED | PASS |
| M52 | Vista previa de promoción | base/beneficio; activación bloqueada | PASS |
| M53 | Pausar o finalizar | historia preservada | PASS |
| M54 | Historial de promoción | versiones y aplicaciones P4 | PASS |
| M55 | Horarios y reservas | hub disponibilidad/reglas | PASS |
| M56 | Horario local semanal | intervalos editables e impacto | PASS |
| M57 | Feriados y excepciones | cierre/especial y conflicto | PASS |
| M58 | Reglas generales | reserva pública, sin buffers inferidos | PASS |
| M59 | Cancelación, ausencia y seña | POLICY_REQUIRED y handoff P4 | PASS |
| M60 | Ventana de anticipación | mínimo/horizonte y preview | PASS |
| M61 | Vista previa de disponibilidad | servicio/staff/fecha y origen P2 | PASS |
| M62 | Conflictos de recursos | intervalos exactos y alternativas | PASS |
| M63 | Impacto en reservas | afectados por owner; no Cancelar todo | PASS |
| M64 | Recordatorios y confirmaciones | regla demo; sin entrega externa | PASS |
| M65 | Historial de disponibilidad | eventos auditados | PASS |
| M66 | Configuración y acceso | hub negocio/cuentas/límites | PASS |
| M67 | Datos internos | edición versionada separada de público | PASS |
| M68 | Cuentas | AccountID separado de StaffID | PASS |
| M69 | Detalle de cuenta | identidad, capacidades y estado | PASS |
| M70 | Vincular cuenta demo | vínculo único, sin credenciales | PASS |
| M71 | Capacidades | conjunto explícito editable | PASS |
| M72 | Revisar permisos | diff atómico y guard de admin | PASS |
| M73 | Suspender o reactivar | acceso separado del integrante | PASS |
| M74 | Preferencias operativas | semana/densidad local | PASS |
| M75 | Seguridad y límites demo | límites de auth/backend explícitos | PASS |
| M76 | Actividad | feed readonly multi-dominio | PASS |
| M77 | Detalle del evento | actor, objeto, before/after | PASS |
| M78 | Buscar y filtrar actividad | query y dominio | PASS |
| M79 | Avisos | bandeja compartida con campana | PASS |
| M80 | Detalle del aviso | lectura y destino propietario | PASS |
| M81 | Preferencias de avisos | local, sin canales externos | PASS |
| M82 | Recuperación y corrección | compensación, no rewrite | PASS |
| M83 | Incidencias cruzadas | owner, objeto y invariantes | PASS |

Resultado: **83/83 superficies implementadas, renderizadas y capturadas**.
