# YOUNGKINGZ P5 MÁS — DESIGN LOCK FULL V2.0

**Archivo consolidado para traslado íntegro a una sesión de implementación.** Para aprobar pixel-perfect y motion se necesitan pruebas del runtime.



---

# YOUNGKINGZ · P5 MÁS — PRODUCT TRUTH + EXPERIENCE TARGET V2.0

**Objeto:** especificación de diseño integral para el prototipo FRONTEND del Dueño. **No** es una autorización de implementación ni una certificación de renderizado.  
**Cobertura:** M01–M83, R5-01–R5-60, seis pilares de `YKZ-PER-V2.0`.  
**Reloj demo de referencia:** 24/10/2026, 14:00 (America/Argentina/Buenos_Aires).  
**Estados de cierre:** `PRODUCT_SPEC_LOCKED`; `VISUAL_IMPLEMENTATION_QA_PENDING`.

## 1. Product Truth · entidades y autoridad

- **Cliente:** una identidad canónica compartida con Agenda, Inventario y Finanzas. Ficha sin cuenta válida; ficha archivada conserva reservas, cobros y pedidos. Fusión genera redirecciones de IDs, no sobrescribe historias financieras.
- **Servicio:** una identidad canónica; nombre, familia, duración en minutos reales (no redondeos ocultos), precio ARS minor units, elegibilidad por profesional, visibilidad pública, estado interno, versiones. Reservas/ventas históricas conservan snapshots. Cambios potencialmente incompatibles con futuro generan revisión de impactos; no desplazan compromisos automáticamente.
- **Curso:** separado de atención y reserva individual. Curso → programa → sesiones con recursos/instructor → inscripciones → asistencia y progreso. Puede estar en borrador, programado, en desarrollo, finalizado, cancelado o archivado; habilitación pública/comercial es una dimensión separada. Cupos y espera nunca se convierten en asistencia o pago.
- **Oferta pública:** `draft_version` vs `published_demo_version`; cambio de borrador no implica publicación. La vista previa es del borrador con etiqueta; la vista cliente demo sólo lee versión publicada y catálogos realmente públicos.
- **Promoción:** regla comercial versionada, segmento objetivo/eligibilidad, beneficio y vigencia, autorización; sólo se aplica a operación futura elegible y queda registrada con snapshot. No descuentos arbitrarios, acumulación, uso por primera vez o cupos sin política explícita.
- **Horario local:** intersección entre horario del negocio, excepción, elegibilidad de servicio, turno del profesional, bloqueos/cursos/recursos y reglas públicas de anticipación. Edición de horario no reescribe compromisos ya confirmados.
- **Cuenta de acceso:** diferente de profesional, cliente y rol. Demo capabilities propias, no autenticación real. Suspender acceso no inactiva empleo ni altera historiales.
- **Evento de auditoría:** evidencia inmutable de hecho/actor/fecha/objeto. **Aviso:** objeto accionable derivado de un hecho, con leído/sin leer independiente de resuelto/no resuelto. No hay entrega externa efectiva sin integración.

### Alcance no autorizado a inventar

No backend, DB, autenticación real, email/SMS/WhatsApp real, publicación web externa, pagos online, emisión legal de certificados, cálculo impositivo, nueva política de señas, política de descuentos/acumulación, términos de inscripción o de lista de espera, política de privacidad productiva ni modificación automática de obligaciones P4. Para ramas dependientes: `POLICY_REQUIRED` y una explicación específica; el formulario/dato y la navegación existen, **no** la escritura irreversible.

### Integración obligatoria

| Fuente | Se utiliza en P5 | Debe conservarse |
|---|---|---|
| P2 Agenda | reservas, atenciones, ocupación y conflictos | IDs, estados, retornos, snapshots históricos |
| P2 Personal | profesionales, habilidades, calendarios, instructores | empleado ≠ cuenta, elegibilidad por servicio |
| P3 Inventario | productos públicos, pedidos y retiro | stock y compromisos, mismo artículo |
| P4 Finanzas | ventas, cobros, obligaciones, señas y ajustes | propiedad económica, ledger y ausencia de cobros inventados |
| Root Resumen | métricas e incidencias accionables | no crear KPI paralelo |
| Shell YoungKingZ | TopBar, campana, cuenta, BottomNav | `Resumen / Equipo / Inventario / Finanzas / Más` |

## 2. Arquitectura y geometría TARGET del teléfono

**Viewport de composición:** 390×844 CSS px dentro del PhoneFrame existente; stress 320×700 y 430×932. Usar insets reales del shell en vez de duplicar la status bar. Los números aquí son **dimensiones de diseño propuestas**; deben verificarse visualmente sobre el runtime.

- Canvas base `#0B0A09`; superficie I `#151219`, II `#1D1824`, seleccionada `#261C37`; texto fuerte `#F7F4FA`, secundario `#B6ACBF`; acento violeta `#8B5CF6`; divisor `#342C3D` con contraste suficiente. Reusar tokens existentes si difieren sin romper la identidad.
- Margen horizontal 16, área útil 358 en 390; sistema espaciado `4/8/12/16/20/24/32`; mínimo target 44×44 CSS px, campo 52, fila 68–84 según dos líneas y tamaño de texto; radios `12/16/20/24` por función. Evitar pill decorativa por defecto.
- Root Más: título directo, descriptor mínimo opcional, **siete filas** agrupadas, sin cards individuales ni CTA universal. Sección superior Clientes / Servicios / Cursos; inferior Presencia y promociones / Horarios y reservas / Configuración y acceso / Actividad y avisos. Scroll vertical único del contenido; navbar no se superpone.
- Profundidad 1 (listados): `DetailHeader` con back, título y overflow si existe; toolbar `search/filter/+` contextual (botones cuadrados 44, + visible); agrupaciones en filas con divisores, no cards.
- Profundidad 2 (detalle): encabezado de identidad dominante, estado secundario, una acción principal y menú contextual; secciones separadas por jerarquía, **no** una card por atributo; acciones en footer seguro si requieren persistencia.
- Formularios simples: edición contextual/inline o sheet corto. Formularios con 4+ campos y estado, revisión compleja o efecto sobre otros objetos: **pantalla completa**. Filtros y selectores breves: sheet. Menú de 2–5 acciones: popover anclado. Conflictos multidominio: revisión de pantalla completa.
- CTA fijo: ocupa ancho contenido, altura 48–52, safe-area inferior; no tapa último campo ni teclado. Contenido puede desplazar hasta el CTA o desplazar CTA encima del teclado según tarea. No ocultar acción necesaria detrás de menú contextual.
- Scroll position, filtros, búsqueda, draft y origen: preservados por `return_to` al volver del handoff; back sin wrapper como `‹ Más · ... · ...`.
- Responsive: 320 → filas multi-line, importes/nombres no se pisan, pie de formulario accesible; 430 → más espacio negativo, mismos roles; tablet/desktop TARGET futuro: lista/inspector de dos columnas sólo cuando el shell se diseñe para eso, **no construir ahora otra aplicación**.

### Jerarquías y taxonomía de pantalla

`ROOT`: navegación estable | `LIST`: filas operativas | `DETAIL`: identidad y operaciones | `FORM`: edición con validación | `SELECTOR`: elegir dato | `REVIEW`: consecuencias y confirmación | `HISTORY`: lectura inmutable | `PREVIEW`: comparación borrador/publicado | `RECOVERY`: conflicto recuperable | `HANDOFF`: navegador al dominio propietario. Un ID **no implica** un componente independiente, pero sí comportamiento y estado alcanzables.

## 3. Biblioteca de patrones cerrada

| Patrón | Problema | TARGET | Antipatrón rechazado |
|---|---|---|---|
| PAT-01 | Llegar a un dominio | fila jerárquica y push con back | card grande con CTA duplicado |
| PAT-02 | Buscar en lista local | lupa 44→SearchField inline, foco y Cancelar; query preservada | modal sólo para escribir cuatro letras |
| PAT-03 | Aplicar filtros | bottom sheet con borrador separado de aplicado; Apply/Reset | chips interminables encima de lista |
| PAT-04 | Elegir entidad entre muchas | selector dedicado con búsqueda y filas | dropdown diminuto de 200 clientes |
| PAT-05 | Editar un dato | editor contextual con valores precargados | formulario total para cambiar un toggle |
| PAT-06 | Crear estructura profunda | pantalla completa, progressive disclosure y draft | cadena de 6 sheets |
| PAT-07 | Mutar compromisos | revisión Antes/Después + afectados + resolución | aceptar y arreglar silenciosamente |
| PAT-08 | Ficha | cabecera editorial, grupos, un CTA principal | KPIs y cards para cada campo |
| PAT-09 | Historial | lista cronológica inmutable + filtros | formulario modificable con datos históricos |
| PAT-10 | Fecha/capacidad | calendario y disponibilidad real, origen/retorno | fecha/horario de fixture inventado |
| PAT-11 | Galería | miniaturas, preview real, reorder accesible | imágenes fake de stock |
| PAT-12 | Cross-domain | deep link contextual con back preservado | saltar siempre a root destino |
| PAT-13 | Error sensible | explicación + acciones de recuperación + versión | toast de “error” sin salida |
| PAT-14 | Confirmación | estado confirming, bloquear duplicación, resultado real | animación de éxito antes del write |
| PAT-15 | Estados vacíos | mensaje específico + acción válida | “No hay datos” genérico |
| PAT-16 | Capacidades | grupos por dominio, diff Antes/Después, guard último admin | 70 toggles incontrolados |

## 4. Motion architecture — tokens PROPOSED, contrato de verificación

| Familia | Duración inicial | Curva/física | Reduced motion |
|---|---:|---|---|
| feedback press | 90–130 ms | ease-out, escala máx. 0.985 | contraste/foco inmediato |
| estado local | 140–200 ms | ease-out | actualización sin movimiento |
| indicador segmentado | 180–240 ms | spring amortiguado sin overshoot | traslado instantáneo + seleccionado |
| search morph | 190–250 ms | ease-in-out; width/transform medidos | campo aparece sin desplazamiento |
| popover | 140–200 ms | translateY 4–8px, scale .98→1 | aparece sin trayectoria |
| sheet | 260–320 ms | easing de salida/entrada distinta | appear breve, foco controlado |
| push/pop | 240–300 ms | curva espacial consistente, dirección contraria al volver | sustitución directa con cambio de título |
| reflow | 180–260 ms | layout animation localizada | actualización inmediata estable |
| lista reordenable | 180–240 ms tras drop | transform, no reflow global por frame | acciones mover arriba/abajo |
| operación confirmada | 160–240 ms | cambio semántico local después del resultado | feedback textual persistente |

**Nunca** usar un fade completo en vez de navegar, spring de recompensa en pagos/permisos, animar 100 filas al filtrar ni depender del movimiento para indicar confirmación real. Controlar foco/scroll/teclado durante transiciones. Cada MOTION tiene ID, consumidores y casos interrupción/reversión en el catálogo dedicado.

## 5. Core grammar de formularios

Cada formulario tiene estados `EMPTY / PREFILLED / DIRTY / INVALID / VALID / REVIEW / CONFIRMING / CONFIRMED / STALE / DUPLICATE / PERMISSION_REVOKED / UNKNOWN / POLICY_REQUIRED` cuando sean alcanzables. Los editores secundarios **conservan el borrador de origen**. Cambiar un dato padre revalida dependencias; no borra otras elecciones compatibles. Guardar y publicar distintos; fecha efectiva distinta del registro; permisos se verifican en confirmación.

### Campos reutilizables

- `IdentitySelect`: busca ID real, devuelve ID y label; detecta duplicado, no crea nueva persona en selección.
- `MoneyField`: ARS decimal exacto, límites, teclado, legibilidad; no reutilizar monto de precio histórico como precio presente.
- `DateTimeSelect`: local del negocio, zona `America/Argentina/Buenos_Aires`, intervalos `[start,end)`, DST seguro; evita conflicto con citas.
- `AvailabilityReview`: cambios propuestos, compromisos afectados, alternativas, conclusión atómica.
- `PublicationReview`: draft vs publicado, versión, preview, pendiente de política.
- `MediaPicker`: archivo real o vista previa explícita; si objeto URL es temporal, etiquetado.
- `CapabilityMatrix`: categorías y capacidades; no activar permisos solo por cambiar rol si política no lo indica.
- `ProgramEditor`: orden y temas, no depender sólo de drag; orden persistente.

## 6. Lifecycle y sistema de errores

- `DRAFT` → `VALIDATING` → `REVIEW` → `CONFIRMING` → `CONFIRMED`. Variantes `REJECTED / CONFLICT / UNKNOWN / POLICY_REQUIRED / PERMISSION_DENIED / DUPLICATE`.
- Entidades con estados ortogonales: curso curricular/inscripciones/publicación/economía; promoción vigencia/publicación/elegibilidad; cliente activo/archivado + cuenta separada; servicios interno/público; aviso leído/resuelto. **No reducirlos a un único booleano**.
- Las operaciones compuestas de cambio de horario, fusión de cliente, cancelación curso y cambios de permisos requieren ID único y versión; no confirmar parcialmente si una decisión depende de otra. Estado demo puede modelar atomicidad/idempotencia sin alegar garantías server.
- `UNKNOWN` no equivale a éxito ni a error seguro: consultar operation ID en estado local antes de reintento.
- Al cambiar de dominio, el objeto dueño mantiene el ID original; P5 no crea réplicas de ventas, profesionales, artículos, reservas o obligaciones.

## 7. Decisiones de negocio congeladas y condicionales

**LOCKED:** Cliente canónico; servicios con snapshots y revisión de impacto; curso separado de servicio; horario local separado de personal; publicación demo versionada; auditoría separada de aviso; no escritura financiera en P5; permisos con guard último admin; sin envíos externos ficticios.

**CONDITIONAL / BLOCKED BY POLICY:** Precio real de curso, proceso de cobro y reembolso de curso, orden de promoción de lista de espera, requisitos de inscripción, políticas de seña/cancelación, descuentos de promociones y acumulación, alcance de borrado/privacidad, criterios de promoción pública. Debe renderizar flujo hasta revisión y bloquear sólo el efecto que requiere regla, mostrando `REQUIRES_POLICY`, referencia y acción adecuada. No inventar thresholds ni porcentajes.

## 8. Cierre de decisiones de diseño y aceptación

La especificación puede cerrarse como `PRODUCT_SPEC_LOCKED` si están cubiertas M01–M83, R5-01–R5-60, formularios, estados, navegación, motion y consecuencias. Para `DESIGN_FREEZE_APPROVED` en el producto renderizado todavía se requieren capturas verdaderas de cada variante materialmente distinta, prototipo navegable, secuencias de movimiento, test de interrupción, accesibilidad, responsive, QA E2E y aprobación humana. **No confundir la matriz con evidencia ya ejecutada.**

### Reglas de rechazo

No aceptar IDs de QA en la app normal; componente gigante inexplicable; menú de más que esconde tareas primarias; fórmulas monetarias fake; cliente duplicado; editar reserva histórica por cambiar servicio; publicar sin publicar; enviar aviso externo falso; acceso inseguro a datos; estado completado por tocar botón; motion que confirme accidentalmente o ignore reduced motion.


---

# YOUNGKINGZ · P5 — ATLAS DE SUPERFICIES M01–M83

**Estado:** `TARGET_SPEC_DEFINED`; diseño de composición y comportamiento por pantalla. Geometría de familias en `00` y pruebas en `05`. No son capturas del runtime.

Cada ficha identifica entrada, pregunta, composición, acciones, estados, motion y retorno. Se exige navegación natural (no galería de IDs dentro de la app). Las variantes transversales aplican únicamente cuando son alcanzables.


---

## A · CLIENTES

### M01 — Más

- **Tipo / patrón de contenedor:** `ROOT`. RootTopBar + contenido scroll + BottomNav normal.
- **Entrada legítima:** BottomNav Más.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Más» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** RootHeader Más + descriptor breve; grupos Clientes/Servicios/Cursos, Presencia/Horarios, Configuración/Actividad; filas 72–80px y divisores. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Entrar al dominio específico; campana global conserva misma bandeja. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin datos de algunos módulos; altura 320; 7 filas; estado restringido. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Retorno de cualquier dominio restaura scroll. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M02 — Clientes

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M01 Clientes, F66 y P2 origen.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Clientes» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Header directo; toolbar Buscar/Filtrar/+; filas avatar opcional 40, nombre, última actividad real; agrupación sin tarjetas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir M04, M05, M03. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, uno, cien, archivado, sin contacto, sin resultados. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01/MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Restituye orden, query, filtros, scroll. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M03 — Buscar/filtrar clientes

- **Tipo / patrón de contenedor:** `INLINE+SHEET`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M02 search/filter.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Buscar/filtrar clientes» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** SearchField expandible 44→ancho disponible, filtros Activos/Archivados/Actividad/orden en sheet. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Aplicar/restablecer filtros, cancelar búsqueda. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** filtro borrador/aplicado, sin coincidencias, retorno teclado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO02/MO04`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M02 sin perder posición. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M04 — Ficha cliente

- **Tipo / patrón de contenedor:** `DETAIL`. DetailHeader + identidad + sección principal + relaciones + acciones.
- **Entrada legítima:** M02, reserva P2, pedido P3, venta P4.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Ficha cliente» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre/estado arriba; próxima actividad; acción contextual Crear turno; ficha e historial en secciones con divisores. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Editar M06; turnos M09; compras M10; notas M11; permisos M12; archivo M13. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** con/sin actividad; ocasional; archivado; obligaciones; vínculo histórico. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Retorna al origin exacto. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M05 — Registrar cliente

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M02; selector desde reserva/venta/curso.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Registrar cliente» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Campos Nombre requerido, contacto condicional; identificación opcional; revisión de coincidencias antes de crear. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Validar y guardar; saltar a M07 si hay candidatos. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, parcial, contacto inválido, duplicado, ya existe, permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** A ficha o al formulario invocante con ID. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M06 — Editar datos

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M04 Editar.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Editar datos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Datos precargados, contactos con etiquetas, cambio mínimo; footer Guardar. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar sólo cambios, validar unicidad/concurrencia. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin cambio, dirty, conflicto, archivado, correo inválido. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 conservando scroll. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M07 — Posibles duplicados

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M05; M02 coincidencias.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Posibles duplicados» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Comparación de identidades, coincidencias por campos con privacidad; vínculo de operaciones. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir ficha o continuar alta diferenciada; revisar fusión M08. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** coincidencia exacta, aproximada, falsos positivos, permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Devuelve borrador original. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M08 — Fusionar clientes

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M07 o M04 overflow autorizado.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Fusionar clientes» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Antes/Después de identidad sobreviviente, contactos ganadores, reservas/pedidos/ventas/notas a reasignar y conflictos. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar fusión idempotente o cancelar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** pagos cruzados, ambos con reservas, campo contradictorio, versión stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 identidad canónica; alias histórico navegable. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M09 — Turnos y atenciones

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M04.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Turnos y atenciones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Agrupación Próximos/Histórico; filas estado y profesional reales. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir reserva/atención P2. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin actividad, futura, cancelada, ausente, múltiple, origen eliminado lógicamente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 origen. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M10 — Compras/pedidos/cobros

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M04.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Compras/pedidos/cobros» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Grupos Pedidos P3, Ventas y cobros P4, créditos; saldo por objeto no suma cruzada. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir operación propietaria. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin ventas, deuda parcial, pedido listo, reintegro, privacidad. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 origen. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M11 — Notas y preferencias

- **Tipo / patrón de contenedor:** `INLINE+FORM`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M04.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Notas y preferencias» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista notas con autor/fecha, observación privada editable; preferencias expresas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Agregar/editar nota autorizada; auditar cambios. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, mucho texto, visibilidad restringida, cambio sin guardar. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 sección. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M12 — Contacto y consentimiento

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M04 datos de contacto.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Contacto y consentimiento» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Teléfono/email, estado de contacto y consentimiento sólo si realmente registrado; sin default afirmativo. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar o retirar preferencia/consentimiento demo; no enviar mensajes. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin contacto, inválido, no otorgado, revocado, duplicado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M13 — Archivar/restaurar/privacidad

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M04 overflow.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Archivar/restaurar/privacidad» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Resumen de vínculos vivos y efectos; opciones Archivar/Restaurar/Solicitud tratamiento. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar archivo/restore; solicitud de borrado como pendiente de política. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** pedido vigente, deuda, historia, cuenta distinta, privacidad pendiente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04 conservada histórica. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M14 — Historial de identidad

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M04 overflow.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Historial de identidad» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Eventos sobre datos, fusión, alias, permisos, actor y timestamp; tabla readonly. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir evento y objeto original autorizado. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin eventos extra, fusión, dato enmascarado, actor no disponible. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M04. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## B · SERVICIOS

### M15 — Catálogo servicios

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M01 Servicios.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Catálogo servicios» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Grupos categorías, filas Nombre 1–2 líneas/duración/precio/status; Buscar/Filtrar/+. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir M16, crear M17, M21. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, largo, publicado/oculto, inactivo, sin profesional. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01/MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M16 — Detalle servicio

- **Tipo / patrón de contenedor:** `DETAIL`. DetailHeader + identidad + sección principal + relaciones + acciones.
- **Entrada legítima:** M15; Agenda P2.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, minutos, precio ARS, estado interno/público, profesionales y reservas/uso; CTA Editar. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M17,M18,M19,M20,M23,M24,M25. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin profesionales, inactivo, varios precios, histórico, reservas futuras. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Retorno al origen. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M17 — Crear/editar servicio

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M15 o M16.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Crear/editar servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, categoría, duración real, precio, descripción; campos vinculados sólo cuando aplican. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar draft/confirmar revisión M23; no reescribir snapshots. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, nombre duplicado, precio inválido, duración conflicto, unchanged. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO06/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M16/M15. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M18 — Variantes/precio/duración

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M16/M17.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Variantes/precio/duración» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Tabla de variantes elegibles con nombre, duración, precio; edición por fila y defaults explícitos. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Agregar/modificar variante, validar intervalos y precios. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin variantes, nombre largo, variantes repetidas, variante utilizada en reserva. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M17 o M16. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M19 — Profesionales habilitados

- **Tipo / patrón de contenedor:** `SELECTOR`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M16/M17.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Profesionales habilitados» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista searchable con estados Activos/Inactivos, selección múltiple y elegibilidad. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Seleccionar/deseleccionar, avisar reservas afectadas vía M23. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** ninguno, uno, varios, inactivo, incompatibilidad agenda. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO04/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Vuelve al formulario con selección. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M20 — Disponibilidad pública servicio

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M16.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Disponibilidad pública servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Switch visible publicamente, requisitos de foto/descripción/precio/roles según contrato; preview de oferta. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Activar/desactivar futuras reservas públicas. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** precio ausente, sin profesional, oculto con reservas, estado interno inactivo. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M16. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M21 — Categorías servicio

- **Tipo / patrón de contenedor:** `LIST+FORM`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M15 filtros/alta.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Categorías servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista categorías, crear/editar nombre, estado; ocultar categoría en uso sólo con revisión. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Agregar, renombrar, archivar categoría. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, duplicado, con servicios, histórica. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M15/M17 con categoría seleccionada. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M22 — Duplicados servicio

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M17 validación.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Duplicados servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Coincidencias SKU/nombre/variante; identidad y profesionales; apertura existente. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Usar existente o continuar sólo con diferenciación justificada. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** exacto, parecido, servicio inactivo, dos categorías. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M17 conservando draft. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M23 — Impacto de cambio servicio

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M17/M18/M19/M24.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Impacto de cambio servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Antes/Después, lista reservas futuras afectadas, decisiones por cita usando procedimiento P2 A19. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Resolver afectados o bloquear mutación; confirmar conjunto. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, uno, muchos, curso y reserva, resultado stale, permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M16 nuevo valor o editor conservado. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M24 — Desactivar/reactivar servicio

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M16 overflow.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Desactivar/reactivar servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Qué reservas/público queda bloqueado y qué histórico permanece. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar estado cuando compromisos resueltos. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin uso, reservas vigentes, inactivo histórico, read-only. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M16. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M25 — Historia y uso servicio

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M16.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Historia y uso servicio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Actividad real P2, ventas P4, cambios/versiones, usos por profesional. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir vínculo; sin edición histórica. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin usos, histórico extenso, precio antiguo, atención restringida. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M16. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## C · CURSOS

### M26 — Cursos

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M01 Cursos.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Cursos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Header Cursos, toolbar +/Buscar/Filtrar, lista agrupada Próximos/En curso/Borradores/Histórico; fila fecha/cupo/instructor. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M27 o M28. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, sin sesiones, cupo completo, cancelado, larga lista. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01/MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M27 — Detalle curso

- **Tipo / patrón de contenedor:** `DETAIL`. DetailHeader + identidad + sección principal + relaciones + acciones.
- **Entrada legítima:** M26; aviso o participante.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle curso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, estado, próxima sesión, progreso de configuración, programa, sesiones, inscripciones, situación comercial, CTA contextual. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M28–M42. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** borrador, publicado demo, programado, en curso, cancelado, archivado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M26/aviso exacto. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M28 — Crear/editar curso

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M26 / M27.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Crear/editar curso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, objetivo, modalidad, instructor opcional, capacidad editable, publicación separada, precio solo con política. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Crear borrador; revalidar sesiones afectadas al editar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, incompleto, pagado POLICY_REQUIRED, conflicto versión. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO06/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M29 — Programa/contenidos

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M27.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Programa/contenidos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Secciones y temas ordenables, lista con controles mover arriba/abajo, edición inline; progreso editado. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Agregar, editar, reordenar, guardar versión. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin contenido, muchos temas, texto largo, edición concurrente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO08/MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27 con cambios. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M30 — Sesiones

- **Tipo / patrón de contenedor:** `LIST+CALENDAR`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M27.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Sesiones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Listado por fecha agrupado, calendario compacto, próxima sesión, filtro por instructor. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M31, M32, M38. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin sesiones, cronograma largo, sesión pasada, cancelada. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO09`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M31 — Crear sesión curso

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M30.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Crear sesión curso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Fecha, hora, duración, instructor, recurso/ubicación, estado draft; sugerir fecha por contexto sin inventarla. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Revisar disponibilidad cruzada P2, confirmar sesión. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin instructor, fuera de horario, choque turno, recurso doble reservado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO07/MO09`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M30 en fecha creada. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M32 — Editar/reprogramar sesión

- **Tipo / patrón de contenedor:** `FORM+REVIEW`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M30 fila.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Editar/reprogramar sesión» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Antes/Después fecha/hora/instructor/recurso, participantes afectados, política avisos. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar si no conflicto o resolver agenda. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin inscritos, con inscritos, fecha pasada, incidencia, stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO09/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M30 scroll preservado. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M33 — Elegir instructor/recursos

- **Tipo / patrón de contenedor:** `SELECTOR`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M31/M32.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Elegir instructor/recursos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista de profesionales reales y recursos habilitados, carga de ocupación por franja. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Seleccionar opción disponible y volver. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin eligible, ocupa servicio, inactivo, recurso no configurado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO04/MO09`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M31/M32 con campos conservados. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M34 — Inscripciones curso

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M27.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Inscripciones curso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Inscritos/Espera/Bajas en grupos; contador sobre capacidad confirmada; búsqueda. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M35,M36,M37. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, lleno, en espera, duplicado, cancelado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M35 — Inscribir participante

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M34.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Inscribir participante» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Seleccionar identidad compartida desde M02 (alta opcional M05), curso precargado, condición/cupo, estado comercial aparte. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Validar duplicados y cupo; inscribir o esperar si política aprobada. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin identidad, cupo lleno, repetido, requisitos POLICY_REQUIRED. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M34 participante visible. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M36 — Detalle inscripción

- **Tipo / patrón de contenedor:** `DETAIL`. DetailHeader + identidad + sección principal + relaciones + acciones.
- **Entrada legítima:** M34.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle inscripción» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Participante, curso, plaza/espera, fechas, asistencia, historial y situación comercial. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Consultar M38, gestionar baja, Finanzas M41. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** activa, espera, cancelada, finalizada, pago externo sin confirmar. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M34. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M37 — Capacidad y espera

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M34/M35.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Capacidad y espera» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Cupos ocupados, confirmados, en espera, bajas, impacto; prioridad explícita sólo configurada. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Registrar baja o ofrecer plaza con aceptación válida. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** completo, liberado, política lista espera ausente, version stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M34. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M38 — Asistencia sesión

- **Tipo / patrón de contenedor:** `LIST+FORM`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M30/M36.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Asistencia sesión» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Header sesión, lista participantes reales con Pendiente/Presente/Ausente; resumen; guardar cambios. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Marcar uno/varios y confirmar como evento; sin cierre automático de curso. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sesión futura, pasada, sin inscriptos, baja, permisos. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M30 o inscripción. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M39 — Finalización/progreso

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M27/M36.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Finalización/progreso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Criterios basados en sesiones/asistencia, progreso por participante, historial; nada de certificados legales. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Marcar curso finalizado según requisitos definidos. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin sesiones, asistencia incompleta, participante ausente, completado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27/M36. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M40 — Cancelar curso/sesión

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M27/M30 overflow.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Cancelar curso/sesión» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Antes/Después, participantes, recursos, obligaciones P4, reprogramación y notificación demo. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Registrar cancelación si impacto resuelto; nunca reembolsar sin P4. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin inscritos, pagos, sesiones pasadas, policy pending, stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M27/M30. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M41 — Situación económica curso

- **Tipo / patrón de contenedor:** `HANDOFF`. Superficie de origen y navegación a la entidad propietaria, con retorno contextual.
- **Entrada legítima:** M27/M36.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Situación económica curso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Precio/obligaciones P4 solamente si oferta pago aprobada; estado claro Sin configuración. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir registro financiero existente, no crear movimiento por visita. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** gratuito, pago no definido, parcial, reintegro pendiente, restringido. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Volver curso/inscripción. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M42 — Cursos históricos

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M26 filtro/M27.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Cursos históricos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Finalizados y archivados con sesiones, programa y asistencia snapshot; buscable. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir consulta, no mutar historia sin corrección. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, muchos, participante archivado, pagado históricamente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M26/M27. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## D · PRESENCIA Y PROMOCIONES

### M43 — Centro presencia

- **Tipo / patrón de contenedor:** `LIST/HUB`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M01 Presencia.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Centro presencia» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Secciones Perfil público y Promociones; estado Publicado/Borrador; dos filas principales no tarjetas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M44, M45, M46, M48. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** perfil no configurado, borrador, publicado demo, política incompleta. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M44 — Información pública

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M43 Perfil.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Información pública» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, descripción, contacto público, ubicación textual, enlace validado; sección separada de datos internos. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar draft sin publicar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, link inválido, dato privado accidental, cambios sin publicar. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M43. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M45 — Galería pública

- **Tipo / patrón de contenedor:** `LIST+MEDIA`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M43/M44.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Galería pública» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Grid de miniaturas reales, preview full image, añadir/quitar/reorder con control accesible. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Editar draft de galería, no publicar directo. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin imágenes, archivo temporal, corrupto, 20 fotos, ratio extremo. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO08/MO11`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M44/M43. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M46 — Vista previa Cliente

- **Tipo / patrón de contenedor:** `PREVIEW`. Header Borrador/Publicado + representación sin efectos + regreso.
- **Entrada legítima:** M43/M44/M47.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Vista previa Cliente» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Vista render de borrador con etiqueta Borrador, lado de publicado o toggle de comparación; mismos datos públicos elegibles. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Navegar vista previa, volver sin publicar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin servicios, stock agotado, foto ausente, draft divergente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M43/M44 draft intacto. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M47 — Revisar/publicar

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M43/M44/M46.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Revisar/publicar» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Diferencias draft vs publicado, requisitos, impacto servicios/horarios/promos; CTA Publicar demo. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar versión demo y auditar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** falta dato, conflicto versión, servicios ocultos, publish fail. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M43 con versión actualizada. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M48 — Promociones

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M43.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Promociones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Borradores/Programadas/Activas/Pausadas/Histórico, filas beneficio/objetivo/vigencia. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M49/M53/M54. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, vencida, muchas, regla POLICY_REQUIRED. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01/MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M43. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M49 — Crear/editar promoción

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** + M48 o detalle promo.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Crear/editar promoción» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre, texto público, tipo beneficio, valor, objetivo, fechas, reglas; opciones no aprobadas bloqueadas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar borrador; revisar elegibilidad y política antes activar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** incompleta, descuento inválido, stacking desconocido, fecha mal. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M48 promo borrador. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M50 — Elegir objetivos promo

- **Tipo / patrón de contenedor:** `SELECTOR`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M49.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Elegir objetivos promo» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Buscar servicios M15/productos P3 públicos, multiselección con estado de elegibilidad. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar selección, invalidar si objeto desactivado. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin objetivos, agotado, oculto, mixto, servicio sin pro. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO04`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M49. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M51 — Vigencia/condiciones

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M49.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Vigencia/condiciones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Rango fechas, límites si aprobados, alcance, exclusiones; revisión política. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar datos validables; no activar sin regla de stacking cuando importa. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** solapadas, sin política, fecha pasada, restricciones. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M49. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M52 — Preview promoción

- **Tipo / patrón de contenedor:** `PREVIEW+REVIEW`. Header Borrador/Publicado + representación sin efectos + regreso.
- **Entrada legítima:** M49.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Preview promoción» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Precio base, beneficio propuesto, precio final para casos elegibles; copy público real. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Comparar casos y regresar; ir a activar sólo sin bloqueo. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** monto cero, precio cambiado, objetivo oculto, no elegible. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M49. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M53 — Pausar/finalizar promo

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M48 detalle.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Pausar/finalizar promo» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Estado actual, efecto sobre nuevas aplicaciones, historial intacto, razón. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar pause/end con evento. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** borrador, activa, programada, ya finalizada, stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M48. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M54 — Historial promo

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M48 detalle.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Historial promo» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Aplicaciones reales por venta P4 y versiones, no conteos estimados. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir venta existente. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin usos, muchos, precios previos, corrección venta. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M48. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## E · HORARIOS Y RESERVAS

### M55 — Horarios/reservas

- **Tipo / patrón de contenedor:** `HUB`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M01 Horarios.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Horarios/reservas» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Filas horario semanal, excepciones, reglas de reserva, política señas, preview y cambios. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M56–M65. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin configurar, bloqueos, horario especial. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M56 — Horario local semanal

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Horario local semanal» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** 7 filas, Abierto/Cerrado, intervalos por día, editor compacto; no 7 cards. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Editar intervalos y validar solape; antes confirmar M63. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** un intervalo, dos, cerrado, cruce medianoche no autorizado, reserva afectada. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55 con cambios. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M57 — Feriados/excepciones

- **Tipo / patrón de contenedor:** `LIST+FORM`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Feriados/excepciones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Calendario fechas especiales, cierres completos/parciales y recurso afectado. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Crear excepción, revisar impacto M63. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin fechas, fecha repetida, conflicto de curso, rango. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO09/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M58 — Reglas generales reserva

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Reglas generales reserva» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Reglas aceptación, publicación, elegibilidad, buffers sólo si existen; sección explicativa. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar regla, revalidar preview M61. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin política, condicional, reserva existente, inválida. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M59 — Cancelación/ausencia/seña

- **Tipo / patrón de contenedor:** `FORM+REVIEW`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Cancelación/ausencia/seña» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Política vigente, campos por cancelación/no-show/seña, ejemplo de caso y bloqueo cuando falta. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar política sólo si dueño la aprueba; no ejecutar dinero. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin política, borrador, conflictos con P4, revocada. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M60 — Ventana anticipación

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Ventana anticipación» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** mínimo/máximo de anticipación, unidad, fecha negocio; ejemplo de disponibilidad. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Validar min≤max y efecto en futuras ofertas. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** uno, varios, inválido, fuera de horario. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M61 — Preview disponibilidad

- **Tipo / patrón de contenedor:** `PREVIEW`. Header Borrador/Publicado + representación sin efectos + regreso.
- **Entrada legítima:** M55/M58/M60.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Preview disponibilidad» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Fecha centrada, servicio, profesional, slots reales por intersección con Agenda y cursos; explicación de ausencia. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Simular y abrir origen; no crear reserva sin confirmación P2. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** 0 slots, horario cerrado, prof ocupado, recurso curso, filtro. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO09/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55 y draft intacto. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M62 — Conflictos de recursos

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M31/M56/M57/M61.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Conflictos de recursos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista de recursos/profesionales y eventos `[inicio,fin)`, severidad y alternativas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Elegir alternativa o derivar A19 P2. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** un conflicto, muchos, recurso desconocido, stale. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Flujo invocante. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M63 — Impacto en reservas

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M23/M56/M57/M58.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Impacto en reservas» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista de reservas P2, sesiones curso y retiros afectados, Antes/Después; resolución por entidad. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar cambio sólo con casos resueltos; log atómico. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** 0,1,20 impactos; cancelación pendiente; permiso; version. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Editor origen o P2 contextual. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M64 — Recordatorios/confirmaciones

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Recordatorios/confirmaciones» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Tipos de aviso, anticipación, canal demo/elegibilidad, estado entregado externo no soportado. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar configuración demo, sin fingir SMS/WhatsApp. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** deshabilitado, regla activa, canal ausente, sin permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M65 — Historial disponibilidad

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M55.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Historial disponibilidad» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Cambio antes/después horario, actor, fecha, reservas afectadas, links. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir versión y objeto propietario. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** ninguno, histórico, corrección, actor borrado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M55. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## F · CONFIGURACIÓN Y ACCESO

### M66 — Configuración negocio

- **Tipo / patrón de contenedor:** `HUB`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M01 Configuración.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Configuración negocio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Secciones Datos internos, Cuentas, Capacidades, Preferencias y Seguridad demo, filas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M67–M75. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** acceso limitado, ninguna cuenta, varias, versión. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO01`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M67 — Datos internos negocio

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M66.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Datos internos negocio» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Nombre legal interno/operativo, contacto administrativo, dirección del local; separado de perfil público. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar valores del estado demo; preservar público hasta M47. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** vacío, público distinto, error de campo, permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M66. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M68 — Cuentas

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M66.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Cuentas» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Activas/Suspendidas; cuenta, rol, vínculo de staff, estado; búsqueda/+. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M69/M70. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin cuentas extra, muchas, sin vincular, last-admin. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M66. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M69 — Detalle cuenta

- **Tipo / patrón de contenedor:** `DETAIL`. DetailHeader + identidad + sección principal + relaciones + acciones.
- **Entrada legítima:** M68.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle cuenta» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Identidad de login demo, rol, estado, capacidades agrupadas, vínculo staff, historial. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M70/M71/M72/M73. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** activa, suspendida, invitación pendiente, sin staff. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M68. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M70 — Vincular/invitar demo

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M68/M69.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Vincular/invitar demo» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Identidad staff existente, contacto, tipo de vínculo; texto visible “No se envía correo real”. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Vincular cuenta demo, detectar 1:1 y duplicado. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** ya vinculada, invitación simulada, sin staff, sin permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO05/MO07`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M69. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M71 — Capacidades

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M69.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Capacidades» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Capacidades por dominio Agenda/Clientes/Servicios/Cursos/Inventario/Finanzas/Config/Auditoría; estado claro. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M72 editor con grupos, mostrar fuente rol/capacidad. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** múltiples, heredadas, ocultas, último admin. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M69. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M72 — Revisar permisos

- **Tipo / patrón de contenedor:** `FORM+REVIEW`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M71.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Revisar permisos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Switches agrupados con diff de cambios, dependencias, último admin; ver qué actor afecta. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar conjunto atómico y emitir evento. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** permiso revocado mid-flow, rol cambiado, dependencia rota. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M69/M71. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M73 — Suspender/reactivar cuenta

- **Tipo / patrón de contenedor:** `REVIEW`. Header de revisión + antes/después + impactos + decisión explícita.
- **Entrada legítima:** M69 overflow.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Suspender/reactivar cuenta» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Consecuencias solo acceso demo, actividad histórica intacta y credenciales reales no gestionadas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Confirmar guard último admin; reactivar. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** último admin, sesión en uso, cuenta staff inactivo, sin permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO10`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M69. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M74 — Preferencias operativas

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M66.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Preferencias operativas» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Zona horaria negocio (se muestra ES-AR demo), visualización horario, notificaciones internas; no preferencias ajenas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar preferencias compatibles con estado demo. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** default, personalizadas, inválidas, no aplica. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M66. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M75 — Seguridad/límites demo

- **Tipo / patrón de contenedor:** `HISTORY/INFO`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M66.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Seguridad/límites demo» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Estado explícito: frontend local, cuentas demo, sin autenticación real, sin envíos; sesiones simuladas. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Consultar restricciones, nunca “cambiar contraseña real” fake. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin sesión, demo user, acceso denegado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M66. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

---

## G · ACTIVIDAD Y AVISOS

### M76 — Actividad

- **Tipo / patrón de contenedor:** `LIST`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M01 o avisos.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Actividad» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Eventos auditados por fecha, actor/acción/objeto, sin card por evento; búsqueda/filter. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M77/M78. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** 0,1000, evento restringido, operación corregida. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO02/MO03`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M77 — Detalle evento

- **Tipo / patrón de contenedor:** `HISTORY`. Header + filtros/fecha si aplican + lista de eventos readonly.
- **Entrada legítima:** M76 o M80.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle evento» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Qué/Quién/Cuándo/Antes/Después/referencias, readonly y actor protegido. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir operación propietaria, nunca reescribir log. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin actor disponible, evento antiguo, corrección, sin permiso. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M76. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M78 — Buscar/filtrar auditoría

- **Tipo / patrón de contenedor:** `INLINE+SHEET`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M76 toolbar.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Buscar/filtrar auditoría» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Search local + filtro período/actor/dominio/tipo/resultado, draft/applied. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Aplicar y restablecer. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin resultados, 1000 registros, restringido, fecha inválida. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO02/MO04`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M76 scroll. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M79 — Bandeja avisos

- **Tipo / patrón de contenedor:** `SHEET/SCREEN`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** Campana global, M01 Actividad.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Bandeja avisos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Lista No leídos/Todos, detalle motivo y objeto, marcar leído; misma bandeja única. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** M80, M81, M83. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, muchos, leído pendiente, origen inaccesible, alta prioridad. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO04/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Devuelve contexto anterior. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M80 — Detalle/destino aviso

- **Tipo / patrón de contenedor:** `DETAIL/HANDOFF`. Header contextual, espacio útil 358 px, agrupaciones operativas y footer seguro según acción.
- **Entrada legítima:** M79.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Detalle/destino aviso» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Resumen causa, tiempo, criticidad y acción específica; leído separado de resuelto. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Navegar origen real P2/P3/P4/P5, preservar scroll. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** leído/no resuelto, resuelto/no leído, vínculo archivado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M79 exactamente. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M81 — Preferencias avisos

- **Tipo / patrón de contenedor:** `FORM`. DetailHeader + grupos de inputs + validación inline + footer seguro.
- **Entrada legítima:** M79/M66.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Preferencias avisos» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Tipos de alertas internas, umbrales autorizados de cada dominio y destinatario. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Guardar preferencias demo sin notificación externa. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** desactivado, no autorizado, aviso existente. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO06`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M79/M66. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M82 — Recuperación/corrección

- **Tipo / patrón de contenedor:** `HANDOFF+RECOVERY`. Superficie de origen y navegación a la entidad propietaria, con retorno contextual.
- **Entrada legítima:** M77/M83.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Recuperación/corrección» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Objeto, inconsistencia, dueño de escritura, acción de revisión autorizada. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Handoff a A19/I42/F55 o editor P5, nunca “corregir todo”. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** sin poder, cross-domain, UNKNOWN, stale, duplicado. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO07/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** Devuelve auditoría/incidencia. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.

### M83 — Incidencias cruzadas

- **Tipo / patrón de contenedor:** `LIST+REVIEW`. DetailHeader + toolbar contextual + secciones de filas + ScrollArea.
- **Entrada legítima:** M01 Actividad, M79.
- **Pregunta / intención:** ¿cómo puede el Dueño consultar o resolver «Incidencias cruzadas» sin duplicar información ni perder el contexto de origen?
- **Composición TARGET concreta:** Pendientes operativos de Agenda/Stock/Caja/Curso/Servicios, motivo/responsable, acciones contextual. Alineación a retícula 16/8, título y dato protagonista arriba; secundario en tipografía menor; evitar cards innecesarias y menús de IDs.
- **Acción y transición de negocio:** Abrir origen, marcar aviso leído ≠ resolver incidencia. Toda mutación valida permisos y versión antes de confirmar, y sólo muestra éxito después del write demo confirmado.
- **Variantes materiales:** cero, muchos, vencido, en revisión, bloqueado política. Además errores de validación, consulta restringida, borrador sucio y resultado incierto cuando son alcanzables.
- **Motion vinculado:** `MO03/MO13`. No interrumpir interacción por esperar animación; reduced motion equivalente.
- **Salida y retorno:** M01 o bandeja. Conservar entidad, consulta, selección y scroll relevantes.
- **QA específico:** verificar llegada desde entrada visible, datos reales/derivados, acción ejecutable, estado alternativo, back, un caso extremo de contenido, permiso y ausencia de placeholder fingido.


---

# YOUNGKINGZ · P5 — 60 JOURNEYS E2E EXPANDIDOS

**Objetivo:** especificar interacción real, no una lista de pantallas. Cada camino tiene actor implícito Dueño salvo handoff; una prueba deberá usar navegación visible, no un panel interno de IDs.

Regla común: el origen sólo muta al confirmar; los selectores conservan draft; permisos revalidados; unknown no es éxito; back respeta objeto, search y scroll. Tests automáticos y screenshots reales quedan pendientes de ejecución.

---

## R5-01 — Buscar y consultar cliente

**Ruta y estados principales:** `M01>M02>M03>M04>M02`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Clientes; expandir search; escribir nombre/teléfono; aplicar filtro si procede; abrir fila; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Identidad autorizada y resultados según consulta. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Ficha readonly, root/lista conserva query, filtros y scroll. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin cliente, coincidencia parcial, consulta larga; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO01/MO02/MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-02 — Alta cliente

**Ruta y estados principales:** `M02>M05>M07?>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Tocar +; introducir nombre; contacto opcional; revisar coincidencias; confirmar; abrir ficha. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** nombre válido, no duplicado exacto, contacto válido y permiso. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Nuevo cliente canónico, historial de alta con actor. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** borrador abandonado, cuenta ya existente, resultado unknown; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-03 — Coincidencia de cliente

**Ruta y estados principales:** `M05>M07>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Completar datos similares; ver candidato; comparar campos sin datos restringidos; elegir existente. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No consolidar falsos positivos ni duplicar ID exacto. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Usa identidad existente y devuelve al origen. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** candidato erróneo, dos coincidencias, permiso; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-04 — Fusionar clientes

**Ruta y estados principales:** `M04>M07>M08>M14>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Seleccionar principal; revisar secundarios, datos ganadores y referencias P2/P3/P4; resolver conflictos; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** versión de identidades y relaciones, autorización, no obligaciones perdidas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Alias de ID secundario, historia y relaciones reasignadas una vez. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** cliente con cobro, doble confirmación, vínculo bloqueado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-05 — Editar contacto

**Ruta y estados principales:** `M04>M06/M12>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Editar; editar un dato; ver errores inline; guardar; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** unicidad y campo valido, no alterar otra identidad. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Ficha actualizada, historial de cambios. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin cambios, cambio concurrente, dato inválido; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-06 — Crear turno desde cliente

**Ruta y estados principales:** `M04>M09>P2-A07>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Tocar Crear turno; cargar cliente ID; elegir servicio, profesional y slot desde Agenda; confirmar; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** usar disponibilidad P2 y permisos, no inventar reserva. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Agenda crea turno y ficha muestra nueva reserva. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin slots, cancelación draft, cliente archivado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-07 — Consultar pedido cliente

**Ruta y estados principales:** `M04>M10>P3-I32>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Compras y pedidos; seleccionar pedido #; consultar detalle real; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** ID coincide con P3 y pertenece a cliente. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Muestra estado del mismo pedido sin duplicar. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** pedido cancelado, parcialmente preparado, restringido; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-08 — Historial económico cliente

**Ruta y estados principales:** `M04>M10>P4-F11/F21>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir compras/cobros; seleccionar venta; entrar a Finanzas; regresar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** verificar permiso y vínculo cliente-venta. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Historial visible con saldos compartidos. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** reintegro, crédito, cobro parcial, acceso limitado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-09 — Nota privada

**Ruta y estados principales:** `M04>M11>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir notas; nueva nota; escribir contenido; confirmar; verificar histórico. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** capability de nota, no usar para mutar historia financiera. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Evento nota con autor, acceso contextual. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** nota extensa, permiso revocado, sin notas; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-10 — Archivar/restaurar cliente

**Ruta y estados principales:** `M04>M13>M04`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Overflow; revisar reservas/deudas; archivar; consultar histórico; restaurar cuando autorizado. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No eliminar referencias ni cancelar obligaciones. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Estado archivado y restaurado auditado. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** deuda pendiente, alias fusionado, solicitud privacidad; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-11 — Consultar catálogo servicio

**Ruta y estados principales:** `M01>M15>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Servicios; búsqueda; tocar servicio; consultar variantes/profesionales. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** identidad catálogo compartida con Agenda. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Ficha y retorno a lista con contexto. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** servicio oculto/inactivo, nombre largo; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO01/MO02/MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-12 — Crear servicio

**Ruta y estados principales:** `M15>M17>M21?>M22?>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Tocar +; nombre, categoría, duración, precio; resolver similitudes; confirmar; abrir detalle. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** duración positiva, precio ARS válido, no ID duplicado. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Servicio único interno, publicación separada. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** precio faltante, duración 0, sin pro, borrador; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-13 — Cambiar precio

**Ruta y estados principales:** `M16>M17>M18?>M23>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Editar precio; revisar diferencia y futuras cotizaciones; guardar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** no alterar ventas históricas P4 y reserva cotizada si está confirmada. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Versión nuevo precio para futuras operaciones. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** venta ya cobrada, precio negativo, versión stale; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-14 — Cambiar duración

**Ruta y estados principales:** `M16>M17>M23>P2-A19?>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Editar 30→45; listar compromisos futuros; resolver afectados; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** intervalos exactos, detectar overlaps P2 y cursos. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Nueva disponibilidad sin mover citas automáticamente. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** varias reservas, curso ocupado, fecha pasada; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO09, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-15 — Cambiar profesionales

**Ruta y estados principales:** `M16>M19>M23>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir selector; cambiar elegibilidad; revisar reservas afectadas; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** IDs P2, inactivos excluidos para nuevas reservas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Elegibilidad única compartida. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** ningún pro, reserva futura, permiso; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO04/MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-16 — Publicar servicio

**Ruta y estados principales:** `M16>M20>M46?>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Público; revisar requisitos, preview; confirmar demo. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** precio, estado interno y elegibilidad; no web real. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Publicación versionada para Cliente demo. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin pro, precio inválido, no policy; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-17 — Ocultar servicio

**Ruta y estados principales:** `M16>M20>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Desactivar visibilidad pública; revisar qué no se ofrecerá; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** reservas futuras preservadas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** No acepta nuevas reservas públicas, historia conserva. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** servicio con turno, preview desactualizada; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-18 — Desactivar servicio con turnos

**Ruta y estados principales:** `M16>M24>M23>P2-A19?>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Elegir Desactivar; ver lista de turnos futuros; resolver; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** ningún compromiso irresuelto y permiso. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** No nuevas reservas, histórico intacto. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** turnos bloqueados, reactivación, cambios de versión; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-19 — Historial de servicio

**Ruta y estados principales:** `M16>M25>P2/P4>M16`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir usos; filtrar fecha; abrir atención/venta; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Snapshots precios/duración preservados. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Consulta sin escritura. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin usos, precio antiguo, acceso a comisión restringido; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-20 — Crear curso borrador

**Ruta y estados principales:** `M01>M26>M28>M27`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** +; nombre/objetivo/modalidad; guardar como borrador; abrir detalle. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** nombre válido, sin prometer curso pago ni publicación externa. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Curso único borrador, sin sesiones ni inscripciones ficticias. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** duplicado, sin instructor, ausencia precio; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-21 — Editar programa

**Ruta y estados principales:** `M27>M29>M27`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Añadir sección/temas; editar; mover con botones/drag opcional; guardar versión. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** no perder contenido por reordenar; no inventar progreso. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Programa persistente dentro sesión demo. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** 20 temas, repetidos, teclado, cancelación; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO08/MO06, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-22 — Crear sesión curso

**Ruta y estados principales:** `M27>M30>M31>M33>M30`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Elegir fecha, duración, instructor y recurso; consultar disponibilidad; revisar; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** intervalos, horario local, ocupación P2 y otras sesiones. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Sesión añadida y ocupa recurso. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin instructor, fecha cerrada, resource conflict; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO09/MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-23 — Seleccionar instructor

**Ruta y estados principales:** `M31>M33>M31`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir instructor; buscar personal; elegir profesional elegible; retornar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** ID staff compartido y disponibilidad real. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Borrador sesión conserva resto de campos. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** profesional inactivo, otro curso, vuelta sin elegir; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO04/MO09, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-24 — Curso choca con turno

**Ruta y estados principales:** `M31>M62>P2-A19?>M31`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Seleccionar slot ocupado; explicar overlaps y alternativas; elegir otro slot o resolver agenda autorizado. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No aplicar bloqueos a toda barbería ni mover reserva silenciosa. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Sesión compatible o draft retenido. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** 20 conflictos, cambio de staff, permiso insuficiente; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-25 — Inscribir participante

**Ruta y estados principales:** `M27>M34>M35>M05?>M34`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** +; buscar cliente canónico; comprobar cupo; completar mínimos; registrar inscripción. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** curso elegible, identidad única, política requisitos conocida. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Plaza inscripta con evento único. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** duplicado, cupo cero, pendiente pago, política; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-26 — Curso cupo completo

**Ruta y estados principales:** `M34>M35>M37>M34`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Intentar alta al llegar al límite; ver capacidad y alternativas. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No sobreocupar; espera sólo si política aprobada. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** No se crea plaza, puede quedar candidato condicionado. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin política, cupo liberado concurrente; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-27 — Gestionar espera

**Ruta y estados principales:** `M34>M37>M36`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Liberación de cupo; identificar candidatos; priorizar según política; oferta/aceptación; activar plaza. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No ascenso automático sin criterio y aceptación. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Estado de inscripto sólo después de validación. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** política ausente, rechaza, dos candidatos, stale; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-28 — Registrar asistencia

**Ruta y estados principales:** `M30>M38>M30`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir sesión; marcar Presente/Ausente por alumno; revisar y guardar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** solo alumnos elegibles, fecha y actor válidos. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Asistencia individual real, progreso recalculado. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** incompleto, desinscripto, sesión futura; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-29 — Consultar progreso

**Ruta y estados principales:** `M27>M39>M36`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir progreso; ver criterios y asistencia; seleccionar participante. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No calcular logro desde pago, sin certificados reales. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Progreso trazable y legible. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** alumno con baja, sesión sin nota, faltantes; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-30 — Reprogramar sesión con inscritos

**Ruta y estados principales:** `M30>M32>M62?>M30`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Editar franja; comparar antes/después; analizar recursos e inscriptos; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No enviar avisos reales; datos de sesión versionados. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Nueva fecha, afectados y aviso demo claros. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** choque Agenda, cambio durante revisión, sesión pasada; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO09/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-31 — Curso y Finanzas

**Ruta y estados principales:** `M27>M41>P4>M27`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir situación económica; consultar obligaciones vinculadas cuando existan; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Precio/política de curso confirmados; no inventar venta/cobro. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Handoff lectura o POLICY_REQUIRED explícito. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** gratuito, pago no definido, reintegro pendiente; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-32 — Cancelar/finalizar/archivar curso

**Ruta y estados principales:** `M27>M40/M39>M42`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Iniciar cierre; listar sesiones y alumnos, obligaciones; confirmar cambio permitido; histórico. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No reembolsos automáticos ni eliminar asistencia. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Curso histórico conservado; pendientes transferidos dueño. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** con pagos, con sesión futura, progreso incompleto; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-33 — Editar presencia pública

**Ruta y estados principales:** `M01>M43>M44>M43`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir perfil; modificar descripción/contacto; guardar borrador; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** contacto público válido, privado oculto. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Draft distinto de publicación, sin efecto externo. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** datos incompletos, imagen temporal; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-34 — Gestionar galería

**Ruta y estados principales:** `M44>M45>M44`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Añadir foto local real; preview; mover; eliminar draft; guardar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** archivo soportado, no objetos URL permanentes. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Orden de borrador modificado, público estable. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** foto inválida, 20 imágenes, cancel drag; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO08/MO11, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-35 — Preview borrador

**Ruta y estados principales:** `M43>M46>M43`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir vista Cliente borrador; comparar con publicado; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Misma data fuente no representación inventada. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Sin publicar, sólo consulta del borrador. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** servicio inactivo, producto agotado, sin foto; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-36 — Publicar perfil demo

**Ruta y estados principales:** `M43>M47>M43`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Revisar campos obligatorios y diff, confirmar publicación demo, consultar versión. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No web externa, detectar cambios concurrentes. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Versión demo publicada, auditada. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** conflicto, datos faltantes, reintento duplicado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-37 — Crear promoción

**Ruta y estados principales:** `M43>M48>M49>M50>M49`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Crear draft; definir texto/beneficio y objetivos; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Objetivo real, regla no inventada, permiso. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Promoción draft; no descuento aplicado. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** porcentaje desconocido, objetivo oculto, cliente elegible; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO04, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-38 — Condiciones/preview promo

**Ruta y estados principales:** `M49>M51>M52>M49`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Ingresar rango y reglas; probar precio final; volver a editar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No monto final negativo, stacking requiere política. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Preview explicable sin activación por default. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** precio cambió, vigencia pasada, falta política; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-39 — Activar promoción y aplicarla

**Ruta y estados principales:** `M49>M52>M48>P4`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Revalidar precio/objetivo; activar demo si política cerrada; venta futura elegible la consume. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** snapshot P4, no aplicar dos veces; no retroactividad. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Promo activa y venta con descuento trazable. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** stacking desconocido queda POLICY_REQUIRED; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-40 — Pausar/finalizar promo

**Ruta y estados principales:** `M48>M53>M54`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Pausar; ver efecto; confirmar; consultar usos históricos. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No invalidar ventas ya confirmadas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Sin nuevas aplicaciones, historial intacto. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** promo no activa, versión concurrente; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-41 — Editar semana

**Ruta y estados principales:** `M01>M55>M56>M63?>M65?>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Cambiar abierto/cerrado o intervalos; revisar choques; guardar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** segmentos no solapados, staff distinto local. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Disponibilidad futura actualizada. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** cierre con turnos, intervalos inválidos, 2 franjas; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-42 — Crear excepción

**Ruta y estados principales:** `M55>M57>M63?>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Elegir fecha o rango; tipo parcial/total; comprobar recursos; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** evento temporal único, feriados no inventados. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Excepción aplicada, compromisos previos preservados. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** fechas repetidas, curso afectado, retiro pedido; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO09/MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-43 — Cierre con reservas

**Ruta y estados principales:** `M56/M57>M63>P2/P5>M56`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Mostrar todos los objetos afectados; resolver por tipo; revalidar; confirmar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No cancelar turnos/sesiones/retiros genéricamente. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Horario nuevo y afectados documentados. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin resolución, stale, sin permiso; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-44 — Cambiar anticipación

**Ruta y estados principales:** `M55>M58/M60>M61>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Editar mínimos/máximos; preview días y slots; guardar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** mínimo ≤ máximo, horas locales, no mover reservas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Nuevas solicitudes usan regla, historia intacta. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** rango inválido, sin slots, fecha pasada; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO09, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-45 — Configurar señas/cancelación

**Ruta y estados principales:** `M55>M59>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir políticas; revisar campos y ejemplos, guardar decisiones aprobadas. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No inventar porcentaje de retención ni aplicar cobros. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Política demo si definida; si no POLICY_REQUIRED. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** conflictos P4, reversión política, no-show; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-46 — Vista previa disponibilidad

**Ruta y estados principales:** `M55>M61>P2?>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Elegir fecha, servicio, profesional; consultar slots; abrir origen de restricción. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Intersección de horarios, staffing, curso, P2, publicación. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Explicación de 0 o más slots, sin reserva ficticia. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** local cerrado, barbero ausente, recurso ocupado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO09/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-47 — Recordatorios

**Ruta y estados principales:** `M55>M64>M55`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Configurar regla demo y ver estado, guardar; consultar acciones generadas. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No afirmar email/WhatsApp enviado. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Configuración persistente demo y límites visibles. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** canal no disponible, inválido, permisos; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-48 — Datos del negocio

**Ruta y estados principales:** `M01>M66>M67/M74>M66`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Configuración; editar dato interno; guardar; consultar público. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No publicar automáticamente M44. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Datos internos nuevos, públicos intactos. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** teléfono inválido, error, permiso; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-49 — Consultar cuentas

**Ruta y estados principales:** `M66>M75?>M68>M69`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Buscar cuenta, abrir detalle, consultar role/capability real. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Respetar datos privados y rol. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Lectura completa para admin autorizado. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** suspendida, invitación pendiente, sin staff; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO02/MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-50 — Vincular staff a cuenta

**Ruta y estados principales:** `M69>M70>M69`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Buscar profesional existente; comparar ya vinculado; confirmar relación demo. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Un staff no duplica ID, no correo real. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Cuenta demo vinculada una vez. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** staff inactivo, cuenta ya vinculada, email inválido; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO05/MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-51 — Cambiar capacidades

**Ruta y estados principales:** `M69>M71>M72>M69`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir matriz por dominio; modificar acceso; ver diff; confirmar conjunto. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** guard último admin; permisos actuales se revalidan. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Capacidades actualizadas con log. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** dependencia, cambios simultáneos, restricción propia; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-52 — Revocación durante operación

**Ruta y estados principales:** `M72>M05/M35>M72`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Iniciar operación autorizada; simular revocación; intentar confirmar; recuperar draft. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Se comprueba permiso efectivo al confirmar. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Sin escritura; explicación y retorno. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** cambio de rol, unknown, revisión ya abierta; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-53 — Suspender/reactivar cuenta

**Ruta y estados principales:** `M69>M73>M69`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Seleccionar suspender; revisar objeto y efectos; confirmar; luego reactivar. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No afecta vínculo staff ni finanzas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Acceso demo cambiado e histórico persistido. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** cuenta en uso, permiso revocado, last-admin; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-54 — Último admin

**Ruta y estados principales:** `M69>M73/M72>M69`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Intentar suspender/quitar permiso admin último; mostrar bloqueo. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No dejar cero admins válidos. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Rechazado sin writes. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** rol heredado, otra cuenta suspendida; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-55 — Actividad filtrada

**Ruta y estados principales:** `M01>M76>M78>M77`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir Activity; buscar evento; filtrar; entrar a detalle; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Solo hechos auditados, permisos por dominio. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Scroll/búsqueda preservados; readonly. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** 0 eventos, 1000, referencia archivada; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO02/MO03, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-56 — Handoff desde evento

**Ruta y estados principales:** `M77>P2/P3/P4>M77`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir objeto original según type/id, consultar y volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No recrear entidad ni romper backstack. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Mismo evento y origin audit. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** referencia sin acceso, operación corregida; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-57 — Campana y destino

**Ruta y estados principales:** `Campana>M79>M81?>M80>P2/P3/P4/P5`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir bandeja global; tocar alerta; seguir destino; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Misma bandeja que acceso Más, no dos stores. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Retorno a M79 con lectura y posición. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** alerta de otro rol, destino archivado, sin datos; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO04/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-58 — Marcar aviso leído

**Ruta y estados principales:** `M79>M80>M79`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Abrir aviso, marcar leído; volver; comparar incidencia aún abierta. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Leído independiente de resuelto. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Estado visual de leído actualizado, negocio sin mutar. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** muchos avisos, aviso ya leído; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO06/MO10, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-59 — Resolver incidencia

**Ruta y estados principales:** `M83>M82>P2/P3/P4>M83`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Elegir incidencia; abrir procedimiento propietario; confirmar si autorizado; volver. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** No botón universal que autoarregle ledger. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Incidencia recalculada como resuelta sólo desde hecho real. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** sin permiso, policy required, resultado unknown; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO07/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.

---

## R5-60 — Auditoría de corrección

**Ruta y estados principales:** `M76>M77>M82>M77`.

**Disparador y actor:** Dueño autorizado desde el primer destino visible del recorrido; cuando entra desde otro módulo, recuperar su objeto/actor y autorización.

**Secuencia de interacción TARGET:** Ver evento original; entrar a corrección propietaria; volver; ver compensatorio. Los taps deben usar controles visuales con nombres comprensibles, sin códigos Mxx en la UI.

**Validación/precondiciones:** Historia inmutable, refs cruzadas correctas. Si un dato cambia en revisión, regresar a la decisión conservando lo compatible.

**Resultado, modelo y feedback:** Dos eventos vinculados, sin edición del original. Confirmación semántica sin página de éxito innecesaria; pantalla estable accesible tras escribir.

**Ramas alcanzables a probar:** pago histórico P4, conflicto, objeto cerrado; además cancelar con borrador sucio, acceso denegado y resultado incierto cuando exista escritura. No crear operaciones falsas para el test.

**Continuidad visual / motion:** MO03/MO13, con interrupción y alternativa reduced motion.

**Criterio de aceptación:** entrar desde la UI normal, realizar pasos y validaciones, inspeccionar consecuencia por el objeto dueño y su lectura en otros módulos si aplica, verificar evento único (sin duplicados), retornar exactamente al contexto anterior y comprobar que ninguna rama muestra éxito indebido.


---

# YOUNGKINGZ P5 · FORM CONTRACTS + STATE MACHINES

**Campos individualizados:** entrada, tipo, obligatoriedad, condición, validación, mutación, retorno. No son inputs genéricos de QA.


### M03 — Buscar y filtrar clientes

- **Entrada y precarga:** M02. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `search:text optional;status:enum Todos/Activos/Archivados;sort:enum Nombre/Actividad`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Al expandir search foco; filtros no mutan lista hasta Aplicar. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** sin resultados, query muy larga, filter stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Sólo consulta. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M02, con foco y scroll restaurados.

### M05 — Crear cliente

- **Entrada y precarga:** + M02 o selector. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `display_name:text required;phone:tel optional;email:email optional;note:text optional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Contacto pasa a requerido si origen requiere aviso/gestión identificada. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** nombre vacío, correo inválido, candidato duplicado, permission. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Client.create + audit. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04 o formulario invocante, con foco y scroll restaurados.

### M06 — Editar cliente

- **Entrada y precarga:** M04. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `display_name:text prefilled;phone:tel;email:email;notes:context`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Sin cambios CTA disabled; información ajena no editable. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** unique conflict, nombre vacío, cambio concurrente. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Client.update fields only. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04, con foco y scroll restaurados.

### M08 — Fusionar clientes

- **Entrada y precarga:** M07. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `primary_client_id:ID required;alias_ids:IDs;preferred_name:text;contact_winners:selectors;impact_ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Agrupar conflictos por campo y contar relaciones de P2/P3/P4, redirección de alias. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** no permisos, identidad cruzada, otros cambios. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Merge event atomically + remap aliases. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04 primario, con foco y scroll restaurados.

### M11 — Nota privada

- **Entrada y precarga:** M04. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `body:textarea required;visibility:enum según capacidades`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Aparece visibilidad sólo si múltiples alcances legítimos. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** nota vacía, acceso insuficiente. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Note event create/version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04, con foco y scroll restaurados.

### M12 — Contacto y consentimiento

- **Entrada y precarga:** M04. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `phone:tel;email:email;consent_type:enum if real;consent_state:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No preseleccionar Sí; timestamp de consentimiento sólo al registrar decisión explícita. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** tel inválido, no vinculado, sin permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Client.contact update + event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04, con foco y scroll restaurados.

### M13 — Archivo/restauración

- **Entrada y precarga:** M04. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `action:archive/restore;reason:select/text;impact_ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Solicitud privacidad abre estado condicionado; no botón borrar datos real. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** compromisos activos, no policy, duplicado. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Client archival state event (no delete). Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M04, con foco y scroll restaurados.

### M17 — Crear/editar servicio

- **Entrada y precarga:** M15/M16. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `name:text required;category:select;duration_minutes:integer >0;price_minor:money>=0;description:textarea;internal_state:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Profesionales se eligen M19; cambios que afectan reservas abren M23. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** duplicado, precio inválido, duración cero, stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Service version after review. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M16, con foco y scroll restaurados.

### M18 — Variantes

- **Entrada y precarga:** M16/M17. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `variant_name:text;duration_minutes:int;price_minor:money;enabled:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Si una variante está en reserva futura, exige M23. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** duplicado por servicio, duración inválida. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** ServiceVariant.create/update (version). Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M17/M16, con foco y scroll restaurados.

### M19 — Elegibilidad profesionales

- **Entrada y precarga:** M16/M17. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `professional_ids:multi-select;scope:active only for new bookings`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Profesionales inactivos visibles en históricos pero no elegibles por defecto. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** nadie habilitado, reservado, permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Eligibility version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M16/M17, con foco y scroll restaurados.

### M20 — Visibilidad servicio

- **Entrada y precarga:** M16. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `public_visible:boolean;preview_scope:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Requisitos de publicación aparecen al activar. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** precio faltante, estado inactivo, sin personal elegible. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Public offering version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M16, con foco y scroll restaurados.

### M21 — Categoría servicio

- **Entrada y precarga:** M15/M17. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `name:text required;status:active/inactive`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Desactivar usada abre revisión de impacto. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** duplicado, vacía, categoría referenciada. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Category upsert/version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** Retorno selector, con foco y scroll restaurados.

### M23 — Impacto servicio

- **Entrada y precarga:** M17/M18/M19/M24. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `original_change:readonly;affected_reservations:list;resolution_per_item:enum;ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Opciones de resolución sólo por permiso y objeto concreto P2. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** una reserva sin resolver, cambio de versión. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Atomic change + referenced P2 resolutions. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** Editor origen, con foco y scroll restaurados.

### M28 — Crear/editar curso

- **Entrada y precarga:** M26/M27. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `name:text required;objective:textarea;modality:enum presencial;instructor_id:ID optional;capacity:int nullable;paid_flag:boolean conditional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Precio sólo si propuesta comercial aprobada; borrador no exige sesiones. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** nombre vacío, capacidad negativa, paid POLICY_REQUIRED. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Course draft/version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M27, con foco y scroll restaurados.

### M29 — Programa curso

- **Entrada y precarga:** M27. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `sections:array title;topics:array title/description/order`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Agregar tema abre inline editor; drag alternativa flechas. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** orden repetido, texto excesivo. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Program version changes. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M27, con foco y scroll restaurados.

### M31 — Crear sesión curso

- **Entrada y precarga:** M30. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `date:date;start_time:time;duration_minutes:int;instructor_id:staff-ID;resource_id:ID`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Siempre revalida superposición con Agenda/curso y horario local. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** sin instructor, fuera de horario, colisión, fecha pasada. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** CourseSession.create + resource occupancy. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M30, con foco y scroll restaurados.

### M32 — Reprogramar sesión

- **Entrada y precarga:** M30. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `new_date:date;new_time:time;new_duration:int;new_instructor:ID;new_resource:ID;reason:text`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Inscritos y ocupación → revisión Antes/Después + impacto. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** pasa fecha, no disponibilidad, stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Session version + impact events. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M30, con foco y scroll restaurados.

### M35 — Inscribir participante

- **Entrada y precarga:** M34. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `client_id:client-ID;status:enum inscrito/en espera;notes:optional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** En espera sólo cuando política de prioridad aprobada; pago separado P4. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** duplicado, cupo completo, identidad ausente, policy. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Enrollment create uniquely course+client. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M34, con foco y scroll restaurados.

### M37 — Cupo/espera

- **Entrada y precarga:** M34/M35. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `capacity:int;candidate_id:ID;decision:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Ascenso requiere prioridad y aceptación válidas. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** espera sin policy, cupo stale, candidato rechaza. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Enrollment position event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M34, con foco y scroll restaurados.

### M38 — Asistencia

- **Entrada y precarga:** M30. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `session_id:ID;participant_statuses:map ID→Presente/Ausente/Pendiente;notes:optional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Sesión futura es consulta, no asistencia confirmada. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** baja, registro duplicado, permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Attendance entries with actor. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M30, con foco y scroll restaurados.

### M39 — Finalización

- **Entrada y precarga:** M27. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `course_id:ID;completion_criteria:readonly;ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No existe certificado real; progreso incompleto impide finalización sin excepción autorizada. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** faltan sesiones, asistencia sin cargar. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Course.completed version/event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M27, con foco y scroll restaurados.

### M40 — Cancelar curso/sesión

- **Entrada y precarga:** M27/M30. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `target_id:ID;reason:text required;impacts:list;resolved_refs:IDs`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Pagos P4 aparecen como tareas de resolución, no devolución automática. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** inscritos no resueltos, fondos, stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Cancellation event + released resource. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M27/M30, con foco y scroll restaurados.

### M44 — Datos perfil público

- **Entrada y precarga:** M43. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `display_name:text;description:textarea;public_phone:tel;public_address:text;website_url:url`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Pueden quedar incompletos en borrador; publicar exige requisitos. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** contacto inválido, dirección incierta, privado. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** PublicProfile.draft only. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M43, con foco y scroll restaurados.

### M45 — Galería

- **Entrada y precarga:** M44. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `media_files:filelist;sort_order:array;alt_text:optional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Vistas previas reales; objeto URL temporal informado. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** archivo inválido, corrupto, muy grande. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Draft media descriptors. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M44, con foco y scroll restaurados.

### M47 — Publicar

- **Entrada y precarga:** M43/M46. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `draft_version:readonly;published_version:readonly;diff:readonly;ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Validación del perfil + servicios + catálogo publicado. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** draft stale, datos incompletos, no acceso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Publish demo version once. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M43, con foco y scroll restaurados.

### M49 — Crear promoción

- **Entrada y precarga:** M48. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `internal_name:text;text_public:textarea;benefit_type:enum;benefit_value:money/percent;target_ids:IDs;starts_at:date;ends_at:date`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Descuentos/stacking solo habilitados si política aprobada; siempre crear borrador. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** fecha mal, objetivo oculto, valor negativo, POLICY_REQUIRED. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Promotion draft. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M48, con foco y scroll restaurados.

### M50 — Elegir objetivos

- **Entrada y precarga:** M49. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `service_ids:IDs;article_ids:IDs`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Mostrar estados inactivos/agotados sin permitir seleccionarlos como disponibles. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** ningún objetivo, desactivado, duplicado. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Sólo draft. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M49, con foco y scroll restaurados.

### M51 — Condiciones promoción

- **Entrada y precarga:** M49. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `start:date;end:date;combinability:enum if policy;usage_limit:int if policy`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Cualquier limitación legal/comercial no definida bloquea activar. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** solape, inicio posterior fin, sin policy. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Draft rule only. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M49, con foco y scroll restaurados.

### M53 — Pausar/finalizar promo

- **Entrada y precarga:** M48. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `action:pause/end;reason:text;impact_ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No toca ventas históricas. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** ya finalizada, promo no activa, stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Promo lifecycle event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M48, con foco y scroll restaurados.

### M56 — Semana local

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `weekdays:map(day→open:boolean, intervals:array start/end)`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Cada día 0..N intervalos ordenados; efecto sobre P2/curso requiere M63. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** overlap, hora de cierre anterior, cierre parcial. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** BusinessSchedule version after impacts. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M57 — Excepción local

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `date_or_range:date;exception_type:closed/special/partial;intervals:array;resource_ids:IDs;reason:text`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Es distinta de ausencia de un solo profesional P2. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** fecha repetida, reserva, curso, feriado no validado. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** ScheduleException create/version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M58 — Reglas de reserva

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `booking_enabled:boolean;public_service_requirements:readonly;buffer_min:int if policy`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Si política no existe, no imponer intervalos inventados. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** regla inválida, existente futura. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** BookingRules version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M59 — Seña/cancelación

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `notice_min_hours:int nullable;deposit_required:boolean conditional;retention_policy:enum POLICY_REQUIRED;no_show_policy:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Sólo guardar una política si el Dueño define datos; no retener dinero. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** ausencia política, inconsistencia P4. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Rules config, no MoneyMovement. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M60 — Anticipación

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `min_notice_minutes:int;max_horizon_days:int`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Min<=max; usa timezone negocio. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** fecha fuera de calendario, min negativo. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** BookingRules version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M61 — Preview disponibilidad

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `date:date;service_id:ID;professional_id:ID optional`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Muestra slots derivados en intersección, no escribe reserva. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** sin slots, servicio oculto, staff indisponible. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Readonly compute. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M63 — Resolver impacto horario

- **Entrada y precarga:** M23/M56/M57. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `affected_objects:list refs;resolution_per_object:enum;final_ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No permitir resolver automáticamente pedidos como si fueran reservas. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** objeto faltante, no autoridad, stale. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Approved schedule+resolutions bundle. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** Editor origen, con foco y scroll restaurados.

### M64 — Recordatorios

- **Entrada y precarga:** M55. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `reminder_enabled:boolean;lead_time:int;channel:enum demo only`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Canal externo sin integración no aparece Enviado. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** sin canal, duplicado, criterio inválido. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** NotificationRule config demo. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M55, con foco y scroll restaurados.

### M67 — Datos internos negocio

- **Entrada y precarga:** M66. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `internal_name:text;admin_phone:tel;address:text;timezone:readonly`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No replica perfil público hasta publish explícito. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** campo inválido, permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** InternalBusinessProfile version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M66, con foco y scroll restaurados.

### M70 — Vincular cuenta

- **Entrada y precarga:** M68/M69. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `staff_id:ID optional;contact:email optional;relationship:enum;role:enum approved`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Invitación demo no envía email, máximo relación canónica. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** staff ya vinculado, último admin, invitación duplicada. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** DemoAccount link event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M69, con foco y scroll restaurados.

### M72 — Cambiar permisos

- **Entrada y precarga:** M69/M71. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `capabilities:map by domain;effective_role:readonly;reason:text optional;ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Diff visible; guard último administrador. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** rol stale, aprobación, revocación mid-flow. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** CapabilitySet version event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M69, con foco y scroll restaurados.

### M73 — Suspender cuenta

- **Entrada y precarga:** M69. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `action:suspend/reactivate;reason:text;impact_ack:boolean`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No inactivar empleado ni borrar dinero. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** last-admin, cuenta en uso, sin permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Account access state event. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M69, con foco y scroll restaurados.

### M74 — Preferencias operativas

- **Entrada y precarga:** M66. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `week_start:enum;date_display:enum;notice_preferences:map`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No cambiar timezone financiera retroactivamente. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** incompatible, invalid, no permission. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Preferences state. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M66, con foco y scroll restaurados.

### M78 — Filtros actividad

- **Entrada y precarga:** M76. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `query:text;period:daterange;actor_id:ID optional;domain:enum;status:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** Restringir antes de exponer resultados por rol. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** rango invertido, sin resultados, no permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** Readonly filtering. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M76, con foco y scroll restaurados.

### M81 — Preferencias avisos

- **Entrada y precarga:** M79/M66. ID y datos existentes se leen de su fuente de verdad; al regresar se conserva el borrador.
- **Contrato de campos:** `types:multi-select;severities:multi-select;scope:enum`. No pedir datos secundarios antes de que la decisión los haga pertinentes. Inputs con label fijo y error debajo del campo.
- **Revelación y dependencias:** No deshabilitar evento de auditoría al silenciar aviso. Si cambia un dato padre, revalidar selecciones dependientes sin perder datos compatibles.
- **Validaciones / estados específicos:** regla obligatoria, sin permiso. `EMPTY, PREFILLED, DIRTY, INVALID, VALID, REVIEW, CONFIRMING, SUCCESS, STALE, UNKNOWN` cuando alcanzables.
- **Escritura autorizada:** AlertPreference version. Ocurre únicamente al confirmar; operation ID, permiso y versión se controlan antes del commit demo.
- **Retorno:** M79/M66, con foco y scroll restaurados.

## Matriz transversal de representaciones visibles

| Estado | Composición | CTA / foco | Continuidad |
|---|---|---|---|
| EMPTY | Labels y hints pertinentes, cero no inferido | Primer campo | Sin writes |
| PREFILLED | Dato derivado con origen legible | CTA según validez | No repetir selección |
| DIRTY | Cambios en campos, no en objeto confirmado | Guardar si válido | Back pide conservar/descartar |
| INVALID | Mensaje junto al campo y resumen si múltiples | Confirmar disabled | Datos preservados |
| REVIEW | Antes/Después e impactos, no sólo título | Confirmar específico | Back a borrador |
| CONFIRMING | Botón protegido / estado de proceso | No doble submit | Cancelación sólo si segura |
| CONFIRMED | Vista de objeto actualizado, evento real | Próxima acción contextual | Volver origen |
| STALE | Qué cambió y cuál saldo/versión actual | Revisar | Borrador retenido |
| UNKNOWN | Referencia de intento y chequeo del resultado | Comprobar operación | No reintentar con ID nuevo a ciegas |
| POLICY_REQUIRED | Política ausente y efecto detenido | Consultar/definir autorización | No false success |
| PERMISSION_DENIED | Explicación sin filtrar dato protegido | Regresar/solicitar acceso si existe | No writes |
| DUPLICATE | Comparación, entidad existente | Abrir existente | No crea copia |


---

# YOUNGKINGZ P5 · COMPONENT SYSTEM + MOTION CATALOG V2.0

**Tipo de evidencia:** especificación propuesta; no video grabado de implementación. Comprobar en navegador real antes de aprobar `DESIGN_FREEZE_APPROVED`.

## 1. Sistema compartido de componentes

| ID | Componente | Anatomía | Estados | Uso / no uso | Target y feedback |
|---|---|---|---|---|---|
| C01 | RootHeader | logo/avisos/cuenta, título directo | normal, root scrolled | sólo M01 y shell; nunca duplicado en detalle | iconos ≥44; root no genera subheader redundante |
| C02 | DetailHeader | back, título dinámico, overflow opt. | default, long, read-only | M02–M83 profundidad real | back preserva origen y scroll |
| C03 | OperationalRow | título, metadata, trailing value, chevron | normal, selected, restricted, archived | listados y navegación, no tabla contable rica | altura base 76, crece si texto ≥2 líneas |
| C04 | SegmentedControl | track e indicador deslizante | 2/3 opciones, loading, reduced | sólo perspectivas mutuamente excluyentes, no categorías del Más | tab animado; no pills separadas |
| C05 | SearchMorph | icon 44→textfield, clear/cancel | closed/open/focused/query/no match | búsqueda local; no para buscar 1000 IDs sin selector | ancho mínimo legible, foco tras layout |
| C06 | FilterSheet | header, grupos, Apply/Reset | draft/applied/disabled | filtros de listados, no navegación entre pantallas | sheet 260–320 ms, foco/teclado estable |
| C07 | EntityPicker | search, agrupaciones, fila seleccionable | empty/one/many/ineligible | profesionales, clientes, objetivos, recursos | selección conserva draft, return |
| C08 | FormField | label, control, hint, error | normal/invalid/disabled/readonly | campos genuinos; no inputs siempre en card | alto base 52, label persistente |
| C09 | MoneyField | prefijo $, cifra, error, metadata | zero/negative-invalid/high/value | sólo precios y costos, no data original de Ledger P4 | numérico en minor units, formato ARS |
| C10 | DateTimePicker | fecha centrada, franjas, slot | selected/unavailable/conflict | sesiones y horarios; no fechas arbitrarias | slots derivados, teclado y scroll |
| C11 | ReviewSurface | título, Antes/Después, afectados, CTA | valid/needs-action/stale/success | cambios a compromisos/roles, no ediciones inocuas | resumen siempre visible antes confirmación |
| C12 | StateBlock | icon vector, título, explicación, CTA | empty/no-results/error/policy/unknown | dentro zona de contenido, no full-screen cuando sólo falla sección | acción específica y recuperable |
| C13 | IdentityHero | nombre, estado, metadata, 1 CTA | long-name/archived/active | cliente, servicio, curso, cuenta | no duplique tabs y hero |
| C14 | InlineEditor | línea transformable, guardado contextual | editing/invalid/unchanged | notas, tema de programa, intervalo simple | expansión localizada |
| C15 | ActivityRow | actor, verbo, objeto, hora | corrected/archived/restricted | historial/auditoría, readonly | no editable |
| C16 | MediaTile | miniatura real, estado, drag handle | loaded/failed/temporary | galería y preview; no imagen dummy como real | reorder transform; botón mover accessible |
| C17 | CalendarRail | fecha/slots, navegación central | today/selected/blocked/empty | cursos y horarios, jamás otro servicio Agenda separado | dirección según movimiento temporal |
| C18 | ImpactRow | entidad afectada, conflicto, estado solución | unresolved/resolved/pending | M23/M62/M63/M40 | progreso real y clear tap |
| C19 | CapabilityRow | nombre, descripción, control, fuente | on/off/inherited/denied | permisos M71–M72 | texto explica alcance, diff en review |
| C20 | PublicationVersion | etiqueta Draft/Publicado + fecha/versión | matched/diff/stale | M43–M47 | jamás confundir preview con actual |
| C21 | PrimaryActionFooter | CTA principal, helper opcional | valid/disabled/loading | FORM/REVIEW, safe-area aware | no se superpone con keyboard/nav |
| C22 | Toast/Result | mensaje corto + acción contextual | success/error/warning | operaciones locales, no sustituir detalle importante | éxito sólo después write real |
| C23 | ContextualPopover | menú anclado al trigger | open/closed/repositioned | 2–5 acciones, nunca formularios complejos | abre cerca origen y corrige borde |
| C24 | AuditEventLink | entity ID, tipo, condición de permiso | live/archived/restricted | M77/M82 | abre objeto propietario y regresa |

## 2. Contratos MOTION (todos los valores en CSS px / ms; TARGET propuesto)

### MO01 · Root Más → sección profunda
- **Consume:** M01, M02/M15/M26/M43/M55/M66/M76; R5-01/11/20/33/41/48/55.
- **Origen:** fila x16..374, altura 72–80, chevron a derecha; scroll actual conservado.
- **Activación:** press feedback 100ms (opacity/color local), se resuelve destino una sola vez.
- **Movimiento:** nuevo screen entra desde `translateX(+24px)` a 0 en 260ms; anterior se desplaza −12px y se inmoviliza; no fade total. El shell permanece fijo, bottom nav según jerarquía actual.
- **Destino estable:** título directo con back y foco en encabezado/landmark; contenido listo para scroll.
- **Reverse:** back 240ms dirección opuesta, scroll de Más intacto.
- **Interrupción:** doble tap durante 260ms no apila duplicados. `prefers-reduced-motion`: cambio directo sin desplazamiento.

### MO02 · IconButton search → SearchField
- **Consume:** M02/M03/M15/M26/M48/M68/M76/M78.
- **Origen:** lupa vector 44×44 en toolbar, filtro y `+` en posiciones estables.
- **Inicio:** press 90ms; width crece de 44 al ancho entre safe inset y Cancelar (verificar viewport 320); placeholder sólo cuando hay ≥100px.
- **Motion:** 220ms `ease-in-out`, transform para reubicar adyacentes y expansión controlada; no recortar texto ya escrito.
- **Final:** foco/teclado tras frame que asegura geometría; Clear y Cancelar accesibles.
- **Reverse:** cerrar teclado, colapsar 200ms, recuperar toolbar; búsqueda activa se conserva si se navega a detalle y vuelve, Cancelar la limpia.
- **Interrupción:** toggle durante apertura cancela de forma reversible; rápido typing no provoca reflows violentos. Reduced: directo.

### MO03 · OperationalRow → Detail
- **Consume:** todas las LIST→DETAIL e HISTORY→DETAIL.
- **Origen:** identidad de fila, posición conocida en viewport, estado de scroll memorizado.
- **Motion:** push 250ms; cuando nombre/imagen representan el mismo ID, continuidad ligera del elemento compartido, pero no forzarla en datos distintos.
- **Final:** encabezado de identidad ocupa posición dominante; foco al título.
- **Back:** 240ms, lista en el mismo scroll, item y filtros; no reinstanciar lista vacía.
- **Stress:** 100+ filas con virtualización no animan cada hermano; reduced sustituye directo.

### MO04 · Sheet / EntityPicker
- **Consume:** filtros, M19, M33, M50, M66, M79.
- **Origen:** botón tocar; bottom sheet aparece desde +100% vertical, scrim gradual; 280ms easing decelerate.
- **Final:** sheet contenido seguro, footer visible, trap foco semántico cuando modal.
- **Dismiss:** swipe sólo si no se pierden cambios, ESC/back accesible; cierra en 250ms.
- **Interrupción:** keyboard, giro o swipe parcial no pierden selección; sheet se reancla dentro viewport.
- **Reduced:** sin trayectoria; foco intacto.

### MO05 · Abrir formulario profundo
- **Consume:** nuevas fichas, servicios, cursos, promociones, cuentas.
- **Origen:** `+` o Editar contextual.
- **Motion:** push 260ms, valores known precargados, CTA footer llega con contenido sin stagger decorativo.
- **Final:** primer campo vacío al alcance; autofoco sólo si no abre teclado agresivamente sin intención.
- **Back:** dirty → confirmación de descarte contextual; cancel sin writes; reduced instantáneo.

### MO06 · Reflow inline condicional
- **Consume:** campos de formulario, notas, variantes, horarios, permisos, estado curso.
- **Origen:** selección de opción, toggle o botón de añadir sección.
- **Motion:** 200ms height/layout localizada; contenido posterior se desplaza sin perder su orden; opacidad pequeña 0.9→1 opcional.
- **Final:** nuevo campo queda cerca del disparador con foco apropiado y error asociado.
- **Interrupción:** otro toggle finaliza en último estado lógico; cambios de datos no dejan medidas antiguas.
- **Reduced:** reflow inmediato sin desplazamiento.

### MO07 · Revisión de impacto / conflicto
- **Consume:** M08/M23/M32/M37/M40/M47/M52/M53/M56/M62/M63/M72/M73/M82.
- **Origen:** botón Revisar, no es Guardar irreversible.
- **Motion:** push 270ms; Antes/Después y afectados aparecen en jerarquía estable. Resolver ítem contrae fila 190ms sin mover CTA de manera inesperada.
- **Confirming:** CTA disabled y loading semántico; sin éxito visual hasta commit.
- **Conflict:** panel estable con datos actualizados, retorno a draft, conservar elecciones compatibles.
- **Reduced:** sin trayectorias.

### MO08 · Reordenamiento de programas/galería
- **Consume:** M29, M45.
- **Origen:** drag handle/menú mover; item mantiene tamaño y legibilidad.
- **Durante:** transform GPU de item, desplazamiento de vecinos al detectar destino; no rerender full list por frame.
- **Final:** snap de 200ms a nueva posición y feedback textual accesible.
- **Cancel:** vuelve a coordenada previa, draft original.
- **Alternativa:** botones Subir/Bajar, compatibles con teclado y reduced-motion.

### MO09 · Selección y actualización temporal
- **Consume:** M30–M33, M56–M63.
- **Origen:** fecha/hora o flechas de calendario.
- **Motion:** al avanzar fecha, track horizontal contenido 200–240ms preservando header/toolbar; sólo slots se sustituyen. Sin bounce.
- **Final:** fecha centrada y franjas nuevas disponibles/deshabilitadas, foco predecible.
- **Conflicto:** inserta motivo bajo slots, no desaparece todo el calendario.
- **Reduced:** cambio inmediato con heading actualizado.

### MO10 · Confirmar estado real
- **Consume:** alta, edición, fusión, calendario, permisos, publicación.
- **Origen:** CTA validado en REVIEW.
- **Respuesta:** press ≤120ms, bloquear doble submit, indicador 160ms si operación aún pendiente.
- **Resultado:** transición semántica localizada en estado/filas, 180–220ms, sólo si acción committed.
- **Unknown:** mensaje verificable con operation ID, no marcar éxito ni reintentar a ciegas.
- **Back:** pantalla resultado permite ver entidad y volver al origen sin toast forzado.

### MO11 · Media preview
- **Consume:** M45, M46.
- **Origen:** miniatura real, rect conocido.
- **Motion:** shared-element si mismo archivo/ID, 230–300ms sin distorsionar ratio; fondo tenue.
- **Final:** imagen fit/contain, texto alternativo y acción salir.
- **Cerrar:** reverse hacia miniatura sólo si aún existe, sino pop normal. Reduced instantáneo.

### MO12 · Segmented Indicator (reutilizado del P3)
- **Consume:** sólo superficies que efectivamente tengan perspectivas mutuamente excluyentes; no root Más.
- **Motion:** indicador x→x' 190–230ms damping alto, sin overshoot; contenido asociado cambia después de que selección sea efectiva (sin await de animación).
- **Interrupción:** pulsaciones rápidas producen último destino y no dejan selección visual desincronizada.

### MO13 · Handoff cross-domain + retorno
- **Consume:** M04/M09/M10/M25/M36/M41/M46/M61/M63/M77/M80/M82.
- **Origen:** fila contextual con ID real.
- **Motion:** push con mismo shell; nuevo módulo recupera su UI de lectura, no duplica objeto.
- **Destino:** ID/permiso verificados; fallback restringido si no accesible.
- **Reverse:** volver a la superficie original con el mismo scroll/filtros/draft; los datos actualizados se reflejan sin flash de reset.
- **Interrupción:** navegar atrás durante loading no crea entidades; reduced motion respeta orden.

### MO14 · Estado de curso cambia
- **Consume:** M27, M26, M39.
- **Origen:** Borrador/Programado/En curso/Finalizado.
- **Motion:** status se actualiza local 160ms; acciones se reorganizan mediante MO06; no fade completo.
- **Seguridad:** no fingir finalización si faltan asistencias o si la operación es POLICY_REQUIRED.

### MO15 · Expandir lista de conflictos
- **Consume:** M23, M62, M63.
- **Origen:** resumen de afectados N; disclosure hacia filas.
- **Motion:** expansión localizada 220ms; contador de resueltos cambia sin número animado largo.
- **Interrupción:** resolución externa P2 mientras expandido revalida version y actualiza ítems in situ.

### MO16 · Fusión cliente
- **Consume:** M08 y M04.
- **Origen:** identidades comparadas.
- **Motion:** durante revisión no fusionar avatares ni representar desaparición; tras commit, principal permanece y alias secundario cambia a redirección textual.
- **Seguridad:** éxito sólo con mapeo de referencias completo.

### MO17 · Publicación draft→publicado
- **Consume:** M43–M47.
- **Origen:** comparar dos versiones identificadas.
- **Motion:** tras publicar, sello `Borrador sin publicar`→`Publicado demo` con transición 160ms; preview de cliente sólo cambia ahora.
- **Rollback/Unknown:** sin indicador de publicado ante fallo, draft retenido.

### MO18 · Promo activada/pausada
- **Consume:** M48/M49/M53.
- **Motion:** status badge local 170ms y fila se reagrupa 200ms, preservando scroll; no confeti.
- **Seguridad:** aplicaciones P4 no se alteran históricamente por este cambio.

### MO19 · Intervalos horarios editables
- **Consume:** M56/M57.
- **Origen:** fila del día; acción Agregar franja.
- **Motion:** inserta interval editor debajo de ese día 190ms; resto reflow local. No abrir pantalla de editor completa para un cambio corto.
- **Validación:** tramo inválido muestra error inline, no se mueve el horario de otros días.

### MO20 · Asistencia lista multisección
- **Consume:** M38.
- **Motion:** Presente/Ausente/Pendiente cambian estado del mismo row, 130ms; contador resume cambios de draft; confirmar guarda una operación de sesión.
- **Seguridad:** mostrar un alumno que cambió de inscripción como conflicto, no quitarlo silenciosamente.

### MO21 · Capabilities antes/después
- **Consume:** M71/M72.
- **Motion:** expand group 180ms; toggle inmediato con draft, review estable; tras commit se actualiza origen y aviso auditado.
- **Interrupción:** revocación propia durante transición aborta write y muestra error contextual, no éxito.

### MO22 · Aviso leído vs resuelto
- **Consume:** M79/M80/M83.
- **Motion:** leer cambia tipografía/punto de aviso 140ms; incidencia sigue en lista hasta cambio real en dominio propietario.
- **Back:** bandeja mismo scroll y selección.

## 3. QA de motion requerido

Por cada contrato verificar: activación, origen/destino, estado estable, cancelación, interrupción, repetición, teclado, reduced-motion, cambio de datos durante transición, pérdida de permiso y scroll. El prototipo iPhone debe demostrarlo con secuencias de frames o video, no únicamente una captura. Metrizar performance real antes de afirmar FPS; no se mide en este documento.

## 4. Fuentes de investigación y decisión

- Apple Human Interface Guidelines — Searching/Search Fields (actualización 2026): búsqueda contextual, alcance visible, filtro combinado. Aplicación PAT-02 y MO02; no exige un patrón idéntico en todos los contextos.
- Apple HIG — Sheets (2026): tareas breves y relacionadas con contexto; evitar sheets encadenados como jerarquía. Aplicación PAT-03/PAT-04/MO04.
- Apple HIG — Motion (consultada 2026): propósito, cancelabilidad y ausencia de espera innecesaria. Aplicación MO01–MO22.
- Material Design / Material Motion: relaciones espaciales y transformación de componentes como guía conceptual; **no** evidencia medida de esta aplicación.
- Fuentes oficiales de proveedores de citas/cursos: guía de separación catálogo/horarios/participantes; no implican adopción de precios, políticas ni diseño visual del proveedor.

**Elección:** `ADAPT`, no copiar skins de iOS o aplicaciones ajenas. YoungKingZ conserva su identidad Dark Premium propia.


---

# YOUNGKINGZ P5 · CROSS-SURFACE STRESS, CORRECTIVES Y ACCEPTANCE

**Auditoría realizada:** documental/conceptual sobre la propuesta; **no** sobre código o capturas de P5 renderizadas. No sustituye Playwright, test de movimiento ni aceptación humana.

## 1. Matriz de stress test por los seis pilares + adversarial

| ID | Pilar | Simulación adversarial | Respuesta TARGET | Hallazgo prevenido |
|---|---|---|---|---|
| ST01 | Funcional | Dos clientes con distintas reservas, deudas y notas se fusionan | mapeo de alias y referencias con diff, historia intacta | fusión destructiva |
| ST02 | Funcional | Servicio 30→45 minutos con 5 reservas y 1 curso | M23 incluye todos los eventos afectados, P2 A19 resuelve antes del commit | calendario falso |
| ST03 | Funcional | Desactivar servicio publicado con reservas futuras | impedir nuevas reservas, mantener contratos confirmados | cancelación accidental |
| ST04 | Funcional | Sesión de curso con instructor en atención | bloquear solo recurso ocupado, alternativa en M62 | bloqueo total local |
| ST05 | Funcional | Curso completo y candidato en espera | estado espera ≠ plaza; sin política no ascender | cupo duplicado |
| ST06 | Funcional | Curso cancelado con alumnos y cobros | cancelar docencia y coordinar obligación P4 sin reintegro falso | monetario ficticio |
| ST07 | Funcional | Cliente sin cuenta, colaborador con cuenta suspendida | separar identidad comercial, profesional y acceso | suspensión rompe historia |
| ST08 | Composición | root Más 7 filas, pantalla 320×700 | scroll único, sin cards redundantes, bottom nav libre | contenedor gigante |
| ST09 | Composición | detalle servicio con 25 profesionales | lista resumida + destino M19; no scroll de chips interminable | densidad mala |
| ST10 | Composición | 50 temas de curso | programa jerárquico con edición localizada, navegación contextual | formulario inmanejable |
| ST11 | Composición | nombre cliente 64 caracteres | multiline/ellipsis contextual, la acción mantiene su tamaño | overlap con chevron |
| ST12 | Componente | todas las secciones usan panel tipo sheet | taxonomy LIST/DETAIL/FORM/REVIEW aplicada por intención | panelización incorrecta |
| ST13 | Componente | búsqueda sobre 1000 eventos vs 20 clientes | SearchMorph local pero filtro por periodo y acceso scope correcto | search global falsa |
| ST14 | Interacción | registrar participante desde curso requiere crear cliente | M35→M66→M35 con draft íntegro | formulario reiniciado |
| ST15 | Interacción | editar una nota abre 4 pantallas | M11 usa editor inline adecuado | demasiados taps |
| ST16 | Interacción | cambio de horario con 12 turnos y 2 cursos | M63 agrupa afectados por dominio y acción concreta | resolución genérica |
| ST17 | Interacción | múltiples filtros y vuelta desde deep link | restaura query/filtros/scroll/origen | back roto |
| ST18 | Motion | pulsar Buscar dos veces en 100ms | MO02 reversible, único input | dos search fields |
| ST19 | Motion | cancelar sheet durante apertura | MO04 llega a closed sin overlay residual | overlay fantasma |
| ST20 | Motion | confirmar publicación mientras transición | MO10 success sólo después de operación válida | falso publicado |
| ST21 | Motion | 500 eventos, filtrar actividad | no animar 500 filas, solo estado/resumen | lag/layout thrash |
| ST22 | Motion | reduced motion activo | feedback/foco conservados sin trayectoria | navegación incomprensible |
| ST23 | Operación | uso bajo presión, teclado y CTA | footer seguro y errores bajo inputs; focus scroll | teclado tapa Confirmar |
| ST24 | Operación | editar permisos propio mientras sesión cambia | rechaza intento con explicación, conserva draft | acceso excesivo |
| ST25 | Operación | marcar aviso leído de caja sin resolver | leído cambia, problema persiste hasta objeto P4 | incidente oculto |
| ST26 | Adversarial | dos operadores cambian horario simultáneamente | versión + revisión; uno no sobrescribe otro | stale overwrite |
| ST27 | Adversarial | borrador de promo con precio servicio cambiado | previsualización se revalida; snapshots P4 intactos | descuento incorrecto |
| ST28 | Adversarial | promoción activa y target desactivado | nuevos usos bloqueados, usos históricos legibles | aplicación inválida |
| ST29 | Adversarial | publicar imágenes Object URL y recargar | mostrar límite temporal, no publicar como remoto permanente | persistencia ficticia |
| ST30 | Adversarial | usuario cambia tamaño de 390→320 durante formulario | valores sobreviven, no escritura ni pérdida de foco | remount destructivo |
| ST31 | Adversarial | permiso retirado después de pantalla de review | segundo permiso en confirmación rechaza | escalada privilegio |
| ST32 | Adversarial | evento auditado apunta a objeto archivado | detalle histórico o estado inaccesible explícito | enlace sin destino |
| ST33 | Adversarial | aviso originado en P3 lleva a P4 por error | destino usa tipo/ID propietario, back al aviso | pérdida contexto |
| ST34 | Accesibilidad | screen reader en fila larga y acción | title+metadata+estado+acción comunicados sin color-only | información inaccesible |
| ST35 | Accesibilidad | mover foto sólo con drag | alternativa Mover arriba/abajo + foco restaurado | exclusión teclado |
| ST36 | Accesibilidad | texto ampliado 200% | filas crecen, CTA visible, no truncar saldo crítico | text overflow |
| ST37 | Consistencia | Persona staff también instructor y usuario | un StaffID, relación AccountID separada | copias paralelas |
| ST38 | Consistencia | Perfil público difiere borrador/publicado | preview Borrador y actual demo separados | publicación fantasma |
| ST39 | Consistencia | M63 afecta reserva, sesión y retiro de pedido | resolutor especializado según dueño, no cancel all | mutación cruzada inválida |
| ST40 | Consistencia | QA navega superficie M01..83 | harness externo, no ID-gallery dentro del teléfono | falso atlas navegable |

## 2. Corrective ledger aplicado a la especificación

| ID | Prioridad | Problema del atlas inicial | Correctivo congelado | Superficies / journeys |
|---|---|---|---|---|
| COR-01 | P0 | Cliente fusionado podía romper ledger | alias canónico, remap trazable y rollback lógico de UI | M07–M14 / R5-03–04 |
| COR-02 | P0 | Servicio editado podía mover compromisos automáticamente | M23 compara y exige resolución P2 A19 | M17–M25 / R5-13–18 |
| COR-03 | P0 | Cursos podían ocupar agenda doble | slot exacto `[start,end)` con recursos/instructor P2 | M30–33/M62 / R5-22–24 |
| COR-04 | P0 | Curso pago implicaba ingreso automático | M41 read/handoff P4; tarifa POLICY_REQUIRED | M27/M41 / R5-31–32 |
| COR-05 | P0 | Publicar era sinónimo de Guardar | draft/published version independientes | M43–47 / R5-33–36 |
| COR-06 | P0 | Política de promoción inferida | draft editable; activar bloqueado por POLICY_REQUIRED | M48–54 / R5-37–40 |
| COR-07 | P0 | Cambio horario podía cancelar citas y cursos por arrastre | M63 revisa compromisos por dominio y sus owners | M55–65 / R5-41–46 |
| COR-08 | P0 | Notificación decía enviada sin servicio externo | distinguir regla, evento demo y entrega externa no disponible | M64/M79–81 / R5-47/57 |
| COR-09 | P0 | Cuenta confundida con profesional | Account/Staff/Client IDs separados; guard último admin | M68–75 / R5-50–54 |
| COR-10 | P1 | Activity confundida con bandeja avisos | audit events readonly, alerts con read/resolution independientes | M76–83 / R5-55–60 |
| COR-11 | P1 | Formulario genérico en todas las pantallas | taxonomía 10 tipos y 24 componentes | M01–M83 |
| COR-12 | P1 | Selector de entidades sin draft preservado | return context en todos los handoffs | M05/M19/M33/M35/M50/M66 |
| COR-13 | P1 | Efectos implícitos tras Confirmar | operación ID, versión, review con consecuencias | Mutaciones sensibles |
| COR-14 | P1 | Animación cosmética sin origen | contratos MO01–MO22; origen/destino, interrupción | Todas las familias |
| COR-15 | P1 | QA simulada por galería de IDs | directorio QA fuera del PhoneFrame, navegación usuario natural | Todas las surfaces |
| COR-16 | P2 | Cards redundantes y baja densidad | operational rows, héroes sólo en ficha | M01/M02/M15/M26/M48/M76 |
| COR-17 | P2 | Search sheet para tarea simple | search inline reversible PAT02 | Listas locales |
| COR-18 | P2 | Estados vacíos genéricos | mensaje+causa+acción contextual | M01–M83 cuando aplicable |
| COR-19 | P2 | Foco y teclado sin contrato | C08/C21 y MO02/MO04/MO05 | Formularios/overlays |
| COR-20 | P2 | UI móvil escalada a desktop | doc de responsive futura sin nueva app | Todos |

**Aplicado** significa corregido en **esta especificación**, NO probado en código renderizado.

## 3. Matriz de cobertura y trazabilidad

### Surface→Journey (cobertura mínima)
- Clientes `M02–M14` ↔ `R5-01–R5-10`; servicios `M15–M25` ↔ `R5-11–R5-19`.
- Cursos `M26–M42` ↔ `R5-20–R5-32`; presencia/promos `M43–M54` ↔ `R5-33–R5-40`.
- Horarios `M55–M65` ↔ `R5-41–R5-47`; acceso `M66–M75` ↔ `R5-48–R5-54`.
- Actividad `M76–M83` ↔ `R5-55–R5-60`; M01 es la entrada compartida a todos.

### Componentes→Surfaces
- C01/C02/C03: navegación M01/listados/detalles; C05/C06: M03/M15/M26/M48/M68/M76/M78.
- C07: M19/M33/M35/M50/M66; C08/C09/C10: formularios y horario/cursos.
- C11/C18: M08/M23/M32/M37/M40/M47/M52/M53/M62/M63/M72/M73.
- C15/C24: M14/M25/M42/M54/M65/M77/M82; C20: M43–M47.

### Interaction→Motion
- PAT01→MO01; PAT02→MO02; PAT03/PAT04→MO04; PAT05→MO06; PAT06→MO05; PAT07→MO07/MO15; PAT08→MO03; PAT09→MO03/MO14; PAT10→MO09/MO19; PAT11→MO08/MO11; PAT12→MO13; PAT13→MO07; PAT14→MO10.

### Data→Visual state
- Cliente archival→M04 status+M13; Servicio publico→M16/M20 y preview M46; curso capacity→M27/M34/M37; draft/publicado→M43/M46/M47; recurso ocupado→M31/M33/M62; accesos→M69/M71/M72; auditoría/avisos→M76/M79/M83.

## 4. Simulaciones de jornadas completas

**SIM-P5-01 Apertura operativa:** Más→Servicios→confirmar oferta→Horarios→preview→Clientes→crear turno P2→volver. Verificar identidad, no duplicaciones y back.

**SIM-P5-02 Curso:** crear borrador, programa, sesiones, instructor, conflicto P2, alternativas, inscribir, cupo lleno, asistencia, cancelación/reprogramación, consultar P4. Verificar no doble ocupación ni cobro inventado.

**SIM-P5-03 Público:** editar perfil, agregar imagen, preview borrador, mantener publicado viejo, confirmar versión demo, crear promoción, bloquear activación sin política y preservar ventas anteriores.

**SIM-P5-04 Cambios adversariales:** un agente cambia duración de servicio, otro edita horario, existe turno y curso futuros; M23/M63 deben revalidar versiones y no confirmar parcial.

**SIM-P5-05 Seguridad y trazabilidad:** enlazar cuenta, asignar permisos, revocar, suspender, intentar desactivar último admin, auditar eventos y alertas, marcar aviso leído sin resolver incidencia.

**SIM-P5-06 Stress operativo:** 100 clientes, 40 servicios, 20 cursos con 50 alumnos, 500 eventos, teclado, usuario vuelve por 5 handoffs, widths 320/390/430, texto ampliado, reduced motion. Medir tiempo y scroll en runtime.

## 5. Gates de aprobación

| Gate | Documento actual | Necesario en prototipo renderizado |
|---|---|---|
| G0 Product Truth | Locked y políticas condicionadas | Comprobar modelos P2/P3/P4 reales |
| G1 Atlas | M01–M83 fichadas | 83 destinos naturales y variantes alcanzables |
| G2 Journeys | 60 fichas paso/resultado | E2E interactivos reales con consecuencias |
| G3 Formularios | 44 contratos explícitos | Inputs reales, validaciones, draft/retorno |
| G4 Composición | Reglas + fichas + wireframes propuestas | Capturas específicas, sin solapamientos |
| G5 Componentes | Biblioteca C01–C24 | Reutilización y consistencia observadas |
| G6 Motion | MO01–MO22 especificados | Secuencias de frames/video, interrupción, reduced |
| G7 Responsive | Target 320/390/430 y futuro desktop | Screenshots y zoom/teclado real |
| G8 Accesibilidad | Reglas por componente | Foco, keyboard, lectores, contraste medidos |
| G9 Integración | Matrices con dueños | Mismo ID y consecuencias reales cruzadas |
| G10 Riesgo | 20 correctivos de diseño documentados | No P0/P1 abiertos; evidencia por correctivo |

## 6. Estado final honesto

- `P5_PRODUCT_SPEC_LOCKED`: se ha definido alcance, entidades, composición, 83 fichas, 60 recorridos, 44 contratos de formulario, 24 componentes, 22 contratos de motion y condiciones de producto.
- `P5_DESIGN_FREEZE_CANDIDATE`: el diseño está suficientemente orientado para construir sin improvisar flujos L0, pero los píxeles finales y el rendimiento permanecen sujetos a revisión visual.
- `P5_VISUAL_FREEZE_NOT_VERIFIED`: no se inspeccionaron pantallas P5 del código real ni se ejecutó Playwright para este trabajo. Por consiguiente, no afirmar `DESIGN_FREEZE_APPROVED` ni `IMPLEMENTATION_PASS`.
- Las ramas `POLICY_REQUIRED` son decisiones del negocio no definidas: el prototipo debe representarlas correctamente, sin fingir su ejecución.

**Próximo paso permitido:** transformar esta especificación en un prompt de implementación/frontend, sin pedir al agente de código que decida estructura, estados, patrones y motion. Luego hacer QA de la implementación y aprobación humana de las vistas.
