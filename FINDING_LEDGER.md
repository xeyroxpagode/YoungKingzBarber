# H02.U03 — Finding Ledger (Certificación Semántica)

Registro de hallazgos durante la certificación. Estado: OPEN hasta que se aplica y verifica el correctivo.

---

## F-01 — Identidad visual: naranja de marca en lugar de violeta

| Campo | Contenido |
|---|---|
| ID | F-01 |
| Categoría | visual |
| EXPECTED | TARGET §38–39: Dark Operational Premium / Muted Violet. Primary = Violet 600 #7355B6, hover = Violet 700 #5E4399, neutros grafito, semánticos (ok/warn/danger) preservados. |
| ACTUAL | `apps/web/src/app/globals.css` `:root` define `--brand:#e7643f` (naranja) y `--brand2:#ff8a62` (naranja claro). Usados en CTAs, hover, focus, enlace activo, punto de contexto, ceja, subnav activa. Focus box-shadow usa `rgb(231 100 63 / 14%)` (naranja). |
| Evidence | `apps/web/src/app/globals.css` líneas 3–6, 10, 23 |
| Impact | La identidad visual no cumple la dirección "Muted Violet". Todos los elementos de marca son naranja. |
| Severity | HIGH |
| Clasificación | implementation / visual |
| Proposed correction | Migrar variables `:root` a paleta violeta oficial y corregir box-shadow de focus a violeta. No tocar --ok/--warn/--danger (semántica propia, §43). |
| Blast radius | Toda la web (AppShell, nav, botones, inputs, focus, calendarios, catálogo, horarios). |
| Authority | Handoff §38–43 (Product Truth visual) |
| State | VERIFIED (tipo de letra blanca sobre primario Violeta 600, acento #BDA4E8 para texto sobre fondo oscuro, focus-ring #BDA4E8; build/typecheck/lint PASS; E2E accesibilidad y contraste PASS) |

---

## F-02 — Navegación paralela "Perfiles profesionales" en /team (U02)

| Campo | Contenido |
|---|---|
| ID | F-02 |
| Categoría | UX / implementation |
| EXPECTED | TARGET §22: Equipo como experiencia única. §24: UX normal ya no expone "Perfiles profesionales" como entrada. §25: `/team/professionals` debe redirigir coherentemente (ya redirige a /team). No debe haber enlace de navegación a una sección rechazada. |
| ACTUAL | `apps/web/src/app/(staff)/team/layout.tsx` renderiza dos enlaces hermanos de igual jerarquía: "Integrantes" y "Perfiles profesionales". El segundo apunta a `/team/professionals` que ahora redirige a `/team` → enlace muerto en la navegación principal. |
| Evidence | `apps/web/src/app/(staff)/team/layout.tsx` línea 4; `apps/web/src/app/(staff)/team/professionals/page.tsx` (redirect) |
| Impact | Experiencia de equipo fragmentada (dos identidades). Enlace navega a un redirect sin contenido. Contradice §22 "Equipo → Integrante". |
| Severity | MEDIUM |
| Clasificación | implementation / UX |
| Proposed correction | Quitar el enlace "Perfiles profesionales" de `team/layout.tsx`. Mantener el redirect de la ruta legacy por si existen deep-links externos. |
| Blast radius | Solo navegación de /team. |
| Authority | Handoff §22, §24, §25 |
| State | VERIFIED (enlace quitado de team/layout.tsx; ruta legacy /team/professionals y /account/professional mantienen redirect; E2E professionals.spec confirma que dejan la superficie de producto) |

---

## F-03 — Buffers se cerran silenciosamente al editar términos de Servicio (U01 regresión)

| Campo | Contenido |
|---|---|
| ID | F-03 |
| Categoría | data / regression |
| EXPECTED | TARGET §35: Al editar precio/duración/otro campo de un Service cuyos Terms actuales tienen buffers != 0, NO convertir silenciosamente a 0. Los buffers históricos se preservan. V1 sin configuración visible de buffers. |
| ACTUAL | `apps/web/src/features/catalog/ServiceDetail.tsx` `saveTerms` envía siempre `preBufferMinutes:0, postBufferMinutes:0` al reemplazar términos, sin leer los valores actuales. La semilla QA tiene `pre_buffer_minutes=5, post_buffer_minutes=5` para "Corte clásico". Editar solo precio produciría nueva versión con buffers 0/0. |
| Evidence | `apps/web/src/features/catalog/ServiceDetail.tsx` línea 31; `supabase/seeds/local-qa.sql` líneas 343–356 |
| Impact | HIGH / POTENTIAL COMMERCIAL SEMANTIC DEFECT (§36). Historia comercial alterada sin política aprobada al editar precio o duración. |
| Severity | HIGH |
| Clasificación | regression / data |
| Proposed correction | En `saveTerms`, leer `service.currentTerms?.preBufferMinutes / postBufferMinutes` y enviarlos de vuelta (preservar), ya que V1 no expone edición de buffers. Nuevo servicio sigue en 0/0 (§35). |
| Blast radius | Solo edición de términos de servicio existente. Creación nueva y historial no afectados. |
| Authority | Handoff §34–36 |
| State | VERIFIED (saveTerms lee preBufferMinutes/postBufferMinutes de currentTerms; build/typecheck/lint PASS; E2E catalog journey y stale preservan términos; semilla con buffers 5/5 intacta) |

---

## Hallazgos revisados y descritos como CONFORME (no son defectos)

| ID | Área | Por qué no es defecto |
|---|---|---|
| — | U03-07 Owner manage | OWNER tiene `schedules.manage` por defecto (contratos + roleCapabilities). |
| — | U03-08 Reception read-only default | RECEPTIONIST tiene `schedules.read` + `schedules.self-read`, NO `schedules.manage`. UI muestra "Sólo lectura" sin CTA de edición. |
| — | U03-09 Reception delegated manage | `schedules.manage` está en `delegableCapabilities`; TeamWorkspace concede/revoca mediante grant humano. Backend autoriza. |
| — | U03-10 Barber Mi horario | BARBER tiene `schedules.self-read`; MyScheduleWorkspace `canManage={false}`; barbero de seed tiene Staff sin ProfessionalProfile y sí tiene horario. |
| — | U03-13 Contiguous canonicalization | `canonicalizeDayIntervals` fusiona toques (10–13 + 13–19 → 10–19). Verificado en dominio y tests. |
| — | U03-14 Stale | STALE_REVISION en comando; UI recarga en STALE. |
| — | U03-15 Dirty guard | `useDirtyGuard` (beforeunload + click en `a[href]`) en WeeklyScheduleEditor. |
| — | U03-16 Transport recovery | `executeOperation` con operationId + request_hash; replay idempotente; cliente consulta `/v1/operations/:id`. |
| — | U03-17 Multi-role | Una sola asignación activa por sesión (no acumulación). Contexto OWNER vs BARBER probado. |
| — | U03-18 Tenant isolation | Todas las consultas filtran por `business_id`; cross-business → 404. |
| — | U02-06 Schedule independent from ProfessionalProfile | Schedule FK apunta a `team.staff_members`, nunca a `professional_profiles`. |
| — | U01-02 Terms history preserved | Terms son inmutables (append-only, trigger rechaza UPDATE). |
| — | U01-03 New service buffers 0/0 | CreateServiceWorkspace default `preBufferMinutes:0, postBufferMinutes:0`; `initialCommercialTerms` opcional. |
