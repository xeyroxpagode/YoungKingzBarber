# YOUNGKINGZ — P5 MÁS
# MASTER IMPLEMENTATION CONTRACT V3.0
## FRONTEND PROTOTYPE · M01–M83 · R5-01–R5-60 · PREMIUM EXPERIENCE BASELINE

**Ejecutor:** Codex en el workspace `C:\Users\thega\Desktop\YoungKingZ-Owner-Design`.

**Misión:** recuperar el estado CURRENT real, implementar por completo P5 **Más** como prototipo frontend navegable e integrado con P1–P4, respetar íntegramente el Design Contract Lock V2.0 adjunto y entregar evidencia honesta. Una sola ejecución integral con checkpoints internos y un informe final. No requerir nuevos prompts para terminar un dominio.

**Alcance exacto:** root Más y siete dominios: Clientes; Servicios; Cursos; Presencia pública y promociones; Horarios y reservas; Configuración y acceso; Actividad, avisos y auditoría.

**Estado buscado:** `P5_FUNCTIONAL_BASELINE_PASS` si —y sólo si— la cobertura, invariantes, 60 recorridos y QA pasan. **NO** significa backend productivo ni `P5_VISUAL_FREEZE_VERIFIED` automático. La estética baseline debe ser intencional, sin degradar UI/UX; la aprobación artística pixel-perfect final será otra revisión.

---

## 00. DOCUMENTOS AUTORITATIVOS: LEER ANTES DE EDITAR

El paquete entregado incluye la carpeta `P5_DESIGN_LOCK` con:

1. `README_P5_DESIGN_LOCK.md` — orden y estado del cierre.
2. `00_P5_PRODUCT_TRUTH_AND_TARGET.md` — autoridad L0, entidades, geometría, patrones, interfaces cruzadas.
3. `01_P5_SURFACE_MASTER_M01_M83.md` — **83 fichas** con entrada, tipo, composición, acciones, variantes, movimiento, retorno y QA.
4. `02_P5_JOURNEYS_R5_01_R5_60.md` — **60 recorridos desarrollados**, con pasos, precondiciones, validaciones, consecuencias y excepciones.
5. `03_P5_FORM_AND_STATE_CONTRACTS.md` — **44 contratos** de formularios, estados, dependencias y writes.
6. `04_P5_MOTION_COMPONENT_SYSTEM.md` — **C01–C24 y MO01–MO22**, incluyendo foco, interrupción, reversión y reduced-motion.
7. `05_P5_STRESS_CORRECTIVES_ACCEPTANCE.md` — **ST01–ST40**, correctivos **COR-01–COR-20**, simulaciones y gates.
8. `06_P5_VISUAL_SPECIMENS.html` — **12 maquetas estáticas**, referencia de estructura y lenguaje visual; **NO** capturas del producto ni licencia para implementar las 83 surfaces como 12 clones.
9. `P5_DESIGN_LOCK_FULL.md` — consolidado para búsqueda y lectura continua.
10. `P5_MANIFEST.json` — inventario del paquete.

**Leer todos los documentos, no sólo el README, resumen o primeras líneas.** Primero registrar inventario real de 83 IDs, 60 journeys, 44 formularios, 24 componentes, 22 contratos motion, 40 casos de stress y 20 correctivos. Comparar conteos del paquete con el contenido; si aparece diferencia, investigarla y consignarla. **El contenido completo de la ficha específica tiene precedencia sobre el resumen de un ID en este prompt.**

Si los archivos no están accesibles dentro del workspace, pedir su adjunto/ruta exacta antes de decidir flujos a ciegas; no reemplazar el contrato por una interpretación genérica. No usar la referencia HTML como implementación ni insertar su explorador dentro del PhoneFrame.

### Autoridad

1. Product Truth y políticas explícitamente congeladas en los documentos P5.
2. Fichas M01–M83 y journeys R5-01–R5-60.
3. Formularios, componentes, motion y correctivos del paquete.
4. Contratos vigentes P1–P4 cuando son propietarios del dato.
5. Estado CURRENT verificado del workspace.

Ante contradicción real, preservar el dato/operación del dominio propietario, no inventar política y documentar `SPEC_CONFLICT` con referencia exacta, efecto y solución mínima segura. No autoproclamar freeze en una contradicción material sin resolver.

---

## 01. ALCANCE: SOLO PROTOTIPO FRONTEND

Esto es una **aplicación demostrativa de interfaz y recorridos**, con estado local demo compartido, operaciones funcionales dentro de ese estado y resultados reproducibles. No desarrollar backend productivo, migraciones de DB, autenticación real, OAuth, integraciones bancarias, pasarela de pago, sistema de correo/SMS/WhatsApp, publicación web remota, fiscalidad, emisión legal de certificados ni políticas legales simuladas.

- Una acción válida modifica el **estado demo** real y actualiza vistas relacionadas; no basta un toast o un cambio de texto local del botón.
- Un dato de P2, P3 o P4 se consulta por la identidad existente. No crear otra colección independiente con Alex, Juan, servicios, turnos, pedidos, inventario o ventas inventadas.
- Persistencia: respetar la estrategia demo actual. Si el estado está en memoria, informar que una recarga repone fixtures; no fingir durabilidad de servidor. Los archivos `Object URL` son temporales y deben indicarse como tales.
- Idempotencia por `operation_id`, versión de entidad y revisión antes de confirmar como garantías **simuladas de frontend**, sin afirmar propiedades de infraestructura productiva.
- `POLICY_REQUIRED`: renderizar la rama y explicación, conservar borrador, permitir volver/consultar; **no** ejecutar un efecto irreversible basado en política no aprobada. Esto no es un placeholder: es el estado funcional correcto.

---

## 02. PREFLIGHT NO DESTRUCTIVO Y RECUPERACIÓN CURRENT

1. `Set-Location 'C:\Users\thega\Desktop\YoungKingZ-Owner-Design'` y verificar `package.json`, scripts y rutas reales. No asumir estructura sin mirar.
2. Registrar árbol relevante, archivos modificados, estado de trabajo y si existe Git. Según las entregas anteriores no había `.git`: si continúa así, NO inicializarlo ni inventar rama/HEAD.
3. Crear respaldo timestamped de **cada archivo existente que vayas a cambiar**, junto a manifiesto de rutas/sha256, en `artifacts/p5/backups/<timestamp>/`. Nunca pisar backups ni modificaciones ajenas.
4. Ejecutar y registrar **baseline real**: `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm exec playwright test --workers=2 --reporter=line`, adaptando comandos si `package.json` difiere. Distinguir problemas preexistentes de regresiones nuevas.
5. Inspeccionar PhoneFrame, TopBar, BottomNav, navigation/back-stack, overlay manager, shared components y motion existentes; en especial el selector animado exitoso de P3.
6. Inspeccionar estados actuales de Agenda y Personal (P2), Inventario (P3), Finanzas (P4), clientes, servicios, políticas, permissions y audit. P4 reportó 260 tests y 91 capturas, pero **el código es autoridad de CURRENT**, no el informe.
7. Clasificar cada módulo/archivo relevante `KEEP / ADAPT / REPLACE / NEW / RETIRE / VERIFY`; establecer `CURRENT → TARGET → REAL GAP` antes de modificar.
8. Identificar superficies/proveedores compartidos para que P5 **se acople** a P1–P4 y no paralelice catálogos.

**No** reset, clean, stash, rebase, borrado de archivos ajenos, push, cambios a Figma ni edición en otro proyecto. No reimplementar P2/P3/P4. Sólo adaptaciones mínimas y auditables para integración. El div gigante visual reportado en P3 pertenece al pulido posterior, excepto si bloquea directamente un handoff de P5.

---

## 03. ARQUITECTURA DE PRODUCTO Y NAVEGACIÓN

BottomNav existente: `Resumen / Equipo / Inventario / Finanzas / Más`. Implementar **M01 Más** como root con siete filas operativas, jerarquía clara, scroll y navbar normales, sin dashboard de cards, chips decorativos, CTA global `+` ni códigos Mxx visibles.

Orden de las siete familias: **Clientes, Servicios, Cursos, Presencia y promociones, Horarios y reservas, Configuración y acceso, Actividad y avisos**.

Profundidad 1: `DetailHeader` directo, toolbar contextual Search / Filter / `+` donde aplica. Profundidad 2: identidad protagonista, estado real, una acción principal y secundarias contextualizadas. Regresar preserva `origin`, `entity_id`, scroll, filtros, búsqueda, período y borrador relevante. No concatenar breadcrumbs feos tipo `‹ Más · Clientes · Juan`.

Taxonomía fija: ROOT, LIST, DETAIL, FORM, SELECTOR, REVIEW, HISTORY, PREVIEW, RECOVERY y HANDOFF. El ID no exige un componente independiente, **pero sí comportamiento propio verificable**. No usar una pantalla `switch(surfaceId)` con título cambiado, formulario genérico y CTA común como sustituto de las 83 experiencias. No crear una galería visible de IDs para probar navegación. Harness de QA, si hace falta, aislado del producto.

Superficies temporales: search inline reversible; filtros en bottom sheet; pickers extensos con búsqueda; menús breves popover anclado; edición simple inline; formularios largos pantalla completa; revisión multidominio pantalla completa. No cadena de sheets para navegación jerárquica. Empty states específicos con acción válida.

### Semántica UX obligatoria

- Predeterminar datos ya conocidos por contexto sin pedirlos otra vez.
- No pedir lo no necesario para una operación puntual.
- Mantener datos de draft al seleccionar entidad, fecha, recurso, participante o medio.
- Separar Save/Publish, draft/live, archive/delete, read/resolve, service/course, account/staff/client.
- Error al lado del campo, foco visible, CTA accesible con teclado y safe-area.
- Acción irreversible sólo desde revisión con consecuencias y estado actual validado.

---

## 04. IMPLEMENTACIÓN POR DOMINIO — SIN PÉRDIDA DE COBERTURA

### 04.A Clientes · M02–M14 · R5-01–R5-10

Directorio real: búsqueda inline, filtros contextualizados, `+`, filas compactas y ficha contextual. Alta/edición conserva IDs y previene duplicados; contacto condicional. Ficha con identidad, actividad relevante, turno, compras/pedidos/cobros y notas privadas según capacidades. M07 presenta coincidencias; M08 ejecuta fusión revisada con entidad canónica, redirección de alias, historial y relaciones intactas con P2/P3/P4. No borrar obligaciones ni eventos al fusionar. M13 archiva/restaura sin borrar historia; solicitudes de privacidad se muestran según límites del prototipo, nunca como cumplimiento real. Handoffs a turno, pedido, finanzas y regreso al origen exacto.

### 04.B Servicios · M15–M25 · R5-11–R5-19

Catálogo único: nombre, categoría, duración exacta, precio minor units, variantes, profesionales elegibles, estado interno y visibilidad pública. Crear/editar con valores precargados, duplicados revisados y versionado. Cambio de precio NO modifica reservas/ventas históricas; duración, habilitación de profesional o desactivación que afecte reservas futuras abre M23 con Antes/Después y afectados. Resolver conflictos por el dominio propietario P2, no mover o cancelar turnos silenciosamente. Servicio desactivado sigue consultable históricamente. No crear segundo catálogo independiente para P5.

### 04.C Cursos · M26–M42 · R5-20–R5-32

Modelos separados `Course`, `ProgramSection`, `CourseSession`, `InstructorRef`, `ResourceRef`, `Enrollment`, `WaitlistEntry`, `Attendance`, `Progress` y sus revisiones/auditoría. Curso ≠ servicio/turno/atención. Borrador editable, programa ordenable con controles accesibles subir/bajar, sesiones con tiempo exacto `[start,end)`, instructor existente y recursos, conflicto de horario con Agenda P2 y otras sesiones. Cupo real, inscripción única, lista de espera no promovida automáticamente sin política, asistencia por sesión y progreso derivado. Reprogramación/cancelación revisa estudiantes, instructores y compromisos, sin notificaciones ni reembolsos ficticios. Curso pago: sólo vínculo a P4 y estado `POLICY_REQUIRED` cuando falta tarifa/política, no cobro automático. Archivar preserva asistencia e historia.

### 04.D Presencia pública y promociones · M43–M54 · R5-33–R5-40

`draft_version` y `published_demo_version` independientes. Editar datos e imágenes afecta borrador, no la versión que consume Cliente. M45 utiliza fotos reales seleccionadas, preview, orden y límites de Object URLs; prohibidas imágenes genéricas presentadas como subidas. M46 muestra claramente BORRADOR versus versión demo publicada y reutiliza datos/componentes públicos reales cuando existan. M47 muestra diff, requisitos y publicación **demo** única; NO desplegar web externa. Promociones: objetivo P2/P3, beneficio, fechas, condiciones, elegibilidad, versionado y snapshots en operación P4. No inventar porcentajes, acumulación, límites o campaña comercial. Activación dependiente de regla no definida → `POLICY_REQUIRED`. Pausa/fin no altera descuentos históricos.

### 04.E Horarios y reservas · M55–M65 · R5-41–R5-47

Horario semanal del local separado del calendario de cada profesional. Intervalos múltiples sin solapamientos, cierres y excepciones, ventanas de reserva y reglas de anticipación. Disponibilidad calculada desde **intersección** de horario local, excepciones, profesional, servicio, bloqueos, recursos y cursos. Preview de disponibilidad con causa de ausencia real. Modificación que afecta turnos P2, sesiones de cursos o retiros P3 → M62/M63: lista de afectados y resolución especializada por owner, con operación coordinada, sin cancelación automática general. Políticas de seña/cancelación no aprobadas → `POLICY_REQUIRED`, nunca retención/cobro inventado. Recordatorios: configuración/registro demo ≠ envío real a WhatsApp/SMS/correo.

### 04.F Configuración y acceso · M66–M75 · R5-48–R5-54

Negocio: datos internos separados de datos públicos; no publicar al guardar. `AccountID ≠ StaffID ≠ ClientID`. Cuentas demo, vínculo/invitación simulados honestamente, matriz de capacidades por dominio, revisión de cambios Antes/Después, suspensión/reactivación que NO inactiva al empleado. Protecciones del último administrador y permisos revalidados durante `review → confirm`. No construir autenticación real; no implementar toggle “Soy dueño” para evadir controles. No exponer a Recepción datos salariales privados por tener acceso a Agenda. Seguridad describe límites de prototipo.

### 04.G Actividad, avisos e incidencias · M76–M83 · R5-55–R5-60

Auditoría sólo lectura: evento, actor real, fecha, objeto, antes/después y correctivos vinculados. No crear un segundo ledger separado de P2/P3/P4; consumir eventos y añadir únicamente hechos nuevos de P5. Avisos accionables con `read/unread` distinto de `resolved/unresolved`; la campana global abre LA MISMA bandeja. Marcar leído no resuelve stock bajo ni cobro incierto. Cada aviso/evento enlaza al owner y vuelve conservando scroll. Incidencias/recuperaciones se resuelven por procedimiento propietario, nunca botón genérico “Corregir todo”.

---

## 05. CONTRATOS DE FORMULARIOS Y ESTADOS

Los **44 contratos** en `03_P5_FORM_AND_STATE_CONTRACTS.md` son obligación de implementación, no documentación optativa. Para cada uno garantizar: label, tipo, valor inicial, required/conditional, fuente, reglas, opciones, validación, mensaje específico, write autorizado, versión, `operation_id`, cancel, review, feedback y retorno. No fabricar inputs sin fuente ni selector que no conserva borrador.

Estados materialmente alcanzables: `EMPTY/PREFILLED/DIRTY/UNCHANGED/INCOMPLETE/INVALID/VALID/REVIEW/CONFIRMING/CONFIRMED/CONFLICT/DUPLICATE/PERMISSION_DENIED/STALE_DRAFT/UNKNOWN_RESULT/READ_ONLY`, más variantes propias de curso, promoción, publicación, cuenta, asistencia, etc. No crear combinatoria absurda: implementar cada transición que cambie un resultado real, acción, información o riesgo.

Para cambios cruzados, probar al menos: objeto cambiado durante review; permiso revocado; `operation_id` repetido; origen archivado; selector cancelado; borrador sucio; confirmación incierta; regreso de handoff; evento ya confirmado. Estados `POLICY_REQUIRED` tienen explicación, bloqueo del efecto sensible y salida concreta.

---

## 06. COMPONENTES Y MOTION: IMPLEMENTAR, NO SÓLO DECLARAR

Reutilizar C01–C24 del archivo `04_P5_MOTION_COMPONENT_SYSTEM.md` o equivalentes existentes con la misma semántica: Root/Detail headers, OperationalRow, SegmentedControl, SearchMorph, FilterSheet, EntityPicker, FormField, MoneyField, DateTimePicker, ReviewSurface, StateBlock, IdentityHero, InlineEditor, ActivityRow, MediaTile, CalendarRail, ImpactRow, CapabilityRow, PublicationVersion, PrimaryActionFooter, Toast/Result, ContextualPopover, AuditEventLink.

Implementar MO01–MO22 donde sus consumidores estén presentes, no un único CSS fade para todas las pantallas. Mínimos:

- Push/pop con dirección y retorno; scroll estable.
- SearchMorph 44px→input, cancel/clear/foco y reflow controlado.
- Sheet desde abajo, foco y cierre sin pérdida de datos.
- Inline expansion, editor de intervalos y condicionales sin salto.
- Antes/Después y conflictos con transición localizada.
- Reordenamiento accesible en galería/programa; alternativa a drag.
- Calendario centrado y cambio temporal coherente.
- Confirmación visual **después** del write, no antes.
- Cambio de publicación que actualiza preview público sólo al confirmar.
- Permisos con diff claro y actualización tras commit.
- Aviso leído que no resuelve incidencia.

Tokens TARGET documentados (press 90–130ms; estado 140–200; indicador 180–240; search 190–250; sheet 260–320; push 240–300; reflow 180–260). Ajustar lo necesario a la física real del runtime, registrar desviación; no sustituir motion por adorno. Interrupción, doble tap, cancelación, `prefers-reduced-motion`, teclado, foco y back deben conservar estados.

NO reproducir las 12 maquetas HTML como si fueran el app; sirven de composición, no certifican motion.

---

## 07. LAYOUT Y ACCESIBILIDAD TARGET

PhoneFrame de referencia **390×844**; stress **320×700** y **430×932**. Mantener shell y safe areas existentes sin dibujar una segunda status bar. Márgenes base 16, spacing 4/8/12/16/20/24/32, target mínimo 44×44, inputs 52, filas operativas 68–84 y crecimiento real por texto. Tema Dark Premium actual, violeta, iconos vectoriales (nunca emoji-lupa), sin pills decorativas, sin scrollbar visible, sin hero en cada fila.

Un único scroll principal por pantalla salvo regiones justificadas. Footer fijo sólo si no tapa contenido ni teclado. Formularios con labels persistentes, errores asociados, navegación teclado, foco restaurado tras overlays, ESC/back consistente, contraste razonable, texto ampliado y reduced motion. En 320px, nombres/precios/estados no se superponen; no encoger targets hasta volverlos inutilizables.

La especificación de tablet/desktop queda como TARGET futuro; **no** construir otra app por separado. No perseguir todavía perfección artística pixel-by-pixel, pero el baseline debe verse deliberado, cómodo, limpio y coherente.

---

## 08. CHECKPOINTS INTERNOS: UNA SOLA ENTREGA

Orden de ejecución recomendado, con tests progresivos después de cada slice:

1. **Contract preflight:** fuentes/IDs/matriz, CURRENT real, baseline, backups.
2. **Domain/state:** entidades P5, tipos, fixtures, selectores, operaciones y adaptadores P1–P4.
3. **Shared patterns:** componentes/primitivas reutilizadas y motion base.
4. **Clientes + Servicios:** superficies, variantes y handoffs.
5. **Cursos:** sesiones, capacidad, inscripción, asistencia, conflictos con Agenda.
6. **Presencia + Promociones:** draft/published, galería, preview y estados condicionados.
7. **Horarios + Configuración:** disponibilidad cruzada, cuentas, capacidades y seguridad demo.
8. **Actividad + Alertas + QA:** evento/aviso y navegación cross-domain.
9. **Stress, correctivos, regresiones y delivery:** cerrar cobertura, evidencia, reportes.

Estos slices son organización interna, NO entregas parciales que requieran nuevos prompts. No desmantelar arquitectura existente para adaptar un componente de P5. Cuando sea necesario cambiar shared state, preservar contratos y suites heredadas.

---

## 09. QA REAL: NO APROBAR POR CONTAR PANTALLAS

### 09.A Contrato → Evidencia

Crear matrices **bidireccionales**, con referencia de archivo/ruta, gesto real, test y evidencia:

- `Mxx → entry points → actions → states → motion → journeys → tests → screenshots`.
- `R5-xx → pasos → superficies → operación → efecto → retorno → tests`.
- `Form(44) → campos → validación → estados → write → pruebas`.
- `C01–C24 → consumidores → variantes → interacción`.
- `MO01–MO22 → consumidores → activación/interrupción/reverse/reduced → secuencia`.
- `ST01–ST40 → fixture → resultado → correctivo si falla`.
- `COR-01–COR-20 → implementación → evidencia → estado`.

No reemplazar pruebas de interacción por capturas directas de una URL de debug. El harness de fixtures puede establecer escenarios, pero para certificar journey debe usarse navegación natural de usuario dentro del teléfono.

### 09.B Tests unitarios/de dominio mínimos

Identidad canónica y alias tras fusión; preservación de IDs P2/P3/P4; servicio versionado y snapshots previos; duración exacta y reservas afectadas; P2 conflictos desde cursos; ocupación `[start,end)`; cupos nunca negativos; inscripción sin duplicados; asistencia vinculada a sesión real; publicación draft separada; promoción bloqueada si falta política; precio histórico preservado; horario global vs profesional; M63 revalidación multidominio; cuenta ≠ staff ≠ cliente; último admin; suspensión sin pérdida histórica; permisos en confirmación; audit readonly; aviso leído ≠ resuelto; idempotencia; resultado incierto sin falso éxito; no duplicar objetos ni efectos de P1–P4.

### 09.C E2E

Al menos un Playwright E2E para **cada R5-01–R5-60**, más ramas de invalidación/cancel/conflict/policy/permission/unknown cuando alcanzables. Un test debe interactuar con controles reales, verificar datos antes y después, navegar al módulo propietario y volver. No aceptar `getByText('M37')` como prueba del flujo.

Ejecutar regresiones P1–P4. Registrar números reales; no presumir que los 260 tests P4 heredados siguen PASS. TypeScript, build, Playwright y consola sin errores nuevos. Un warning de tamaño de bundle se documenta; no se altera código de P4 sólo para ocultarlo.

### 09.D Visual + temporal

Capturas reales del runtime para **M01–M83** y variantes críticas; ID puede compartir layout, pero la captura debe mostrar **su estado/acción particular**, no simplemente cambiar título. Verificar 320/390/430, modo teclado, lista larga, formularios, empty states, filtros, return-back y texto ampliado. Usar secuencias de frames/videos o pruebas temporales/reduced-motion para MO01–MO22; una sola captura no demuestra animación. Registrar limitaciones de captura si el navegador no permite video.

Ejecutar ST01–ST40 y las simulaciones SIM-P5-01–06 del contrato, corrigiendo P0/P1 antes del veredicto. La evidencia de cada COR debe demostrar el correctivo y no sólo documentarlo.

### 09.E Condiciones de FAIL/NO-FREEZE

- Galería de IDs dentro de Más o de cualquier pantalla productiva.
- Un solo formulario genérico reutilizado para acciones de significado diferente sin comportamiento propio.
- Botón visual sin navegación o escritura efectiva.
- Test que simula resultado insertando directamente lo que debería confirmar el usuario.
- Duplicación de cliente, servicio, staff, venta, pedido o saldo.
- Modificación histórica destructiva.
- Cambiar horario/duración y cancelar turnos/cursos/pedidos en silencio.
- Crear venta/cobro por inscribir a curso sin contrato comercial.
- Anunciar SMS/WhatsApp/email/publicación externa que no ocurrió.
- Aprobar descuento/política no definida.
- Handoff que pierde filtros/borrador/scroll y termina en root incorrecta.
- `POLICY_REQUIRED` que miente sobre éxito, o botón muerto sin explicación.
- Cuenta suspendida que destruye empleado/historial.
- Aviso marcado como leído que borra problema del dominio.
- Ícono emoji, scroll superpuesto, formularios inaccesibles o motion que bloquea el uso.
- Suites fallando y declaradas “selector issue” sin análisis.

---

## 10. SALIDA DOCUMENTAL + VEREDICTO

Crear bajo `artifacts/p5/implementation/` (sin tocar los contratos fuente):

- `00_CURRENT_BASELINE.md` — árbol, reports, respaldos, KEEP/ADAPT/REPLACE/NEW/RETIRE, baseline tests.
- `01_DOMAIN_INTEGRATION.md` — fuentes P1–P4, entidades, ownership, adapters, invariantes.
- `02_SURFACE_IMPLEMENTATION_MATRIX.md` — M01–M83, archivo, UI entry, estado, screenshot, tests.
- `03_JOURNEY_ACCEPTANCE_MATRIX.md` — R5-01–R5-60, pasos, mutaciones, veredicto, test.
- `04_FORM_STATE_MATRIX.md` — 44 contratos y variantes alcanzables.
- `05_COMPONENT_MOTION_MATRIX.md` — C01–C24 + MO01–MO22, consumo y evidencia visual/temporal.
- `06_STRESS_CORRECTIVES.md` — ST01–ST40 y COR-01–COR-20, pendientes reales.
- `07_CROSS_DOMAIN_REGRESSION.md` — integraciones y regresiones P1–P4.
- `screenshots/` + `screenshots-manifest.json` — capturas reales con ID, estado, archivo.
- `motion/` — secuencias/video/tests temporales, o limitaciones documentadas.
- `P5-DELIVERY.md` — resumen ejecutivo y veredicto final.

### Entrega a usuario en formato fijo

A. Estado general; B. CURRENT→TARGET→GAP; C. M01–M83; D. R5-01–R5-60; E. modelos y P1–P4; F. formularios/estados; G. motion/componentes; H. Playwright/TS/build y regresiones; I. evidencia visual; J. desviaciones/políticas pendientes; K. comandos PowerShell y puerto; L. veredicto.

**Veredictos:**

- `P5_FUNCTIONAL_BASELINE_PASS`: rutas, operaciones, estados, handoffs y pruebas críticos ejecutados con evidencia; las ramas `POLICY_REQUIRED` se comportan correctamente como bloqueadas y no se simulan como operaciones.
- `P5_PARTIAL`: falta cobertura, evidencia o test crítico, aunque compile.
- `P5_BLOCKED`: impedimento real verificable que no permite completar contrato sin violar autoridad.

`P5_PRODUCT_SPEC_LOCKED` es un estado documental del diseño previo. **No** equivale automáticamente a `P5_IMPLEMENTATION_PASS` ni a `P5_VISUAL_FREEZE_APPROVED`. El último sólo podrá decidirse tras revisión humana de UI renderizada y motion.

**Una ejecución, checkpoints internos, cero pushes, cero cambios a Figma, cero políticas inventadas. STOP después de entregar el reporte final y preservar el workspace.**


---

## ANEXO A — INVENTARIO NOMINAL DE LAS 83 SUPERFICIES (CONTROL DE OMISIONES)

**La ficha individual en `01_P5_SURFACE_MASTER_M01_M83.md` es la definición vinculante**; este anexo es un índice para cotejar que ninguna se omitió.

- `M01` — Más
- `M02` — Clientes
- `M03` — Buscar/filtrar clientes
- `M04` — Ficha cliente
- `M05` — Registrar cliente
- `M06` — Editar datos
- `M07` — Posibles duplicados
- `M08` — Fusionar clientes
- `M09` — Turnos y atenciones
- `M10` — Compras/pedidos/cobros
- `M11` — Notas y preferencias
- `M12` — Contacto y consentimiento
- `M13` — Archivar/restaurar/privacidad
- `M14` — Historial de identidad
- `M15` — Catálogo servicios
- `M16` — Detalle servicio
- `M17` — Crear/editar servicio
- `M18` — Variantes/precio/duración
- `M19` — Profesionales habilitados
- `M20` — Disponibilidad pública servicio
- `M21` — Categorías servicio
- `M22` — Duplicados servicio
- `M23` — Impacto de cambio servicio
- `M24` — Desactivar/reactivar servicio
- `M25` — Historia y uso servicio
- `M26` — Cursos
- `M27` — Detalle curso
- `M28` — Crear/editar curso
- `M29` — Programa/contenidos
- `M30` — Sesiones
- `M31` — Crear sesión curso
- `M32` — Editar/reprogramar sesión
- `M33` — Elegir instructor/recursos
- `M34` — Inscripciones curso
- `M35` — Inscribir participante
- `M36` — Detalle inscripción
- `M37` — Capacidad y espera
- `M38` — Asistencia sesión
- `M39` — Finalización/progreso
- `M40` — Cancelar curso/sesión
- `M41` — Situación económica curso
- `M42` — Cursos históricos
- `M43` — Centro presencia
- `M44` — Información pública
- `M45` — Galería pública
- `M46` — Vista previa Cliente
- `M47` — Revisar/publicar
- `M48` — Promociones
- `M49` — Crear/editar promoción
- `M50` — Elegir objetivos promo
- `M51` — Vigencia/condiciones
- `M52` — Preview promoción
- `M53` — Pausar/finalizar promo
- `M54` — Historial promo
- `M55` — Horarios/reservas
- `M56` — Horario local semanal
- `M57` — Feriados/excepciones
- `M58` — Reglas generales reserva
- `M59` — Cancelación/ausencia/seña
- `M60` — Ventana anticipación
- `M61` — Preview disponibilidad
- `M62` — Conflictos de recursos
- `M63` — Impacto en reservas
- `M64` — Recordatorios/confirmaciones
- `M65` — Historial disponibilidad
- `M66` — Configuración negocio
- `M67` — Datos internos negocio
- `M68` — Cuentas
- `M69` — Detalle cuenta
- `M70` — Vincular/invitar demo
- `M71` — Capacidades
- `M72` — Revisar permisos
- `M73` — Suspender/reactivar cuenta
- `M74` — Preferencias operativas
- `M75` — Seguridad/límites demo
- `M76` — Actividad
- `M77` — Detalle evento
- `M78` — Buscar/filtrar auditoría
- `M79` — Bandeja avisos
- `M80` — Detalle/destino aviso
- `M81` — Preferencias avisos
- `M82` — Recuperación/corrección
- `M83` — Incidencias cruzadas

---

## ANEXO B — INVENTARIO NOMINAL DE LOS 60 JOURNEYS (CONTROL DE OMISIONES)

**La ficha individual en `02_P5_JOURNEYS_R5_01_R5_60.md` es vinculante**. Un journey se considera probado sólo si la secuencia, mutación o lectura y retorno coinciden con su contrato.

- `R5-01` — Buscar y consultar cliente
- `R5-02` — Alta cliente
- `R5-03` — Coincidencia de cliente
- `R5-04` — Fusionar clientes
- `R5-05` — Editar contacto
- `R5-06` — Crear turno desde cliente
- `R5-07` — Consultar pedido cliente
- `R5-08` — Historial económico cliente
- `R5-09` — Nota privada
- `R5-10` — Archivar/restaurar cliente
- `R5-11` — Consultar catálogo servicio
- `R5-12` — Crear servicio
- `R5-13` — Cambiar precio
- `R5-14` — Cambiar duración
- `R5-15` — Cambiar profesionales
- `R5-16` — Publicar servicio
- `R5-17` — Ocultar servicio
- `R5-18` — Desactivar servicio con turnos
- `R5-19` — Historial de servicio
- `R5-20` — Crear curso borrador
- `R5-21` — Editar programa
- `R5-22` — Crear sesión curso
- `R5-23` — Seleccionar instructor
- `R5-24` — Curso choca con turno
- `R5-25` — Inscribir participante
- `R5-26` — Curso cupo completo
- `R5-27` — Gestionar espera
- `R5-28` — Registrar asistencia
- `R5-29` — Consultar progreso
- `R5-30` — Reprogramar sesión con inscritos
- `R5-31` — Curso y Finanzas
- `R5-32` — Cancelar/finalizar/archivar curso
- `R5-33` — Editar presencia pública
- `R5-34` — Gestionar galería
- `R5-35` — Preview borrador
- `R5-36` — Publicar perfil demo
- `R5-37` — Crear promoción
- `R5-38` — Condiciones/preview promo
- `R5-39` — Activar promoción y aplicarla
- `R5-40` — Pausar/finalizar promo
- `R5-41` — Editar semana
- `R5-42` — Crear excepción
- `R5-43` — Cierre con reservas
- `R5-44` — Cambiar anticipación
- `R5-45` — Configurar señas/cancelación
- `R5-46` — Vista previa disponibilidad
- `R5-47` — Recordatorios
- `R5-48` — Datos del negocio
- `R5-49` — Consultar cuentas
- `R5-50` — Vincular staff a cuenta
- `R5-51` — Cambiar capacidades
- `R5-52` — Revocación durante operación
- `R5-53` — Suspender/reactivar cuenta
- `R5-54` — Último admin
- `R5-55` — Actividad filtrada
- `R5-56` — Handoff desde evento
- `R5-57` — Campana y destino
- `R5-58` — Marcar aviso leído
- `R5-59` — Resolver incidencia
- `R5-60` — Auditoría de corrección
