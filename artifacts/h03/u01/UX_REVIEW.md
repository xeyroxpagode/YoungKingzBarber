# H03.U01 — Revisión de Experiencia de Usuario (Gate G04)

## Recorrido verificado (E2E real, E2E-01)
El recorrido completo se verificó sobre la superficie Staff real (Next.js + Fastify API):
1. **Listado**: título "Clientes", búsqueda "Buscar cliente", resultados en listado plano.
2. **Búsqueda**: filtrado por nombre o contacto.
3. **Creación**: formulario Nombre comercial + Nombre + Apellido + Contacto principal, sin onboarding de cuenta, sin reserva, sin login Cliente.
4. **Detalle de lectura**: nombre comercial, nombre y apellido, estado, revisión, contacto principal, fechas de creación/modificación.
5. **Edición**: cambio de nombre comercial, persistencia verificada tras recarga.
6. **Contactos**: agregar contacto adicional (tipo, valor, etiqueta, principal).
7. **Notas internas**: agregar nota, persistencia verificada.
8. **Retorno**: volver al listado y verificar persistencia del nombre editado.

## Estados completos resueltos
| Estado | Resolución |
|--------|------------|
| Loading | Esqueleto durante carga del módulo (Suspense) |
| Empty | `EmptyState` "Sin clientes" |
| Search empty | `EmptyState` "Sin clientes que coincidan" |
| Validation error | Mensaje inline + CTA deshabilitado |
| Permission denied | Ruta `/app/clients` protegida; redirección a `/account` si falta `clients.read` |
| Save pending | Botón deshabilitado con `busy` state |
| Save success | Mensaje "Cliente creado." / "Ficha actualizada." |
| Stale revision | Error 409 STALE_REVISION desde backend, mensaje en UI |
| Network error | No cubierto específicamente (depende del cliente HTTP) |
| Operación incierta | No aplicable (no hay operaciones asíncronas inciertas en la UI actual) |
| Return navigation | Botón "← Volver" restaura al listado |

## Estética (sistema visual vigente)
- Violeta serio como acento principal (tokens del design system de YoungKingZ).
- Jerarquía editorial limpia (eyebrow, h1, h2, h3, texto de apoyo).
- Componentes consistentes (`Button`, `TextInput`/`Field`, `Select`, `EmptyState`, `StatusPill` de `@youngkingz/ui`).
- Responsive: mobile (<1280, BottomNav) y desktop (>=1280, Sidebar + ContextBar).
- Sin naranja como identidad principal. Sin íconos improvisados.
- Sin `Role Switcher` en la UI productiva.

## Superficies cubiertas
| Superficie | Estado |
|------------|--------|
| Listado con búsqueda | Implementada (paginada con cursor) |
| Nueva ficha | Implementada (formulario inline) |
| Detalle de lectura | Implementado (nombre, contacto, actividad, ficha) |
| Edición | Implementado (control de cambios, revisión) |
| Contactos | Implementado (agregar, editar, principal) |
| Notas internas | Implementado (crear, leer; no expuestas en listado) |
| Vínculos con cuentas | Solo lectura (creación cerrada por U02/U04) |

## Riesgos residuales UX
- La superficie no expone creación de notas internas como CTA destacado en el detalle (la operación existe en el dominio pero el CTA está implícito).
- La revisión obsoleta en la UI se maneja como error genérico 409, no con un mensaje específico "STALE_REVISION" en pantalla.
- No hay indicador visual de "revisión" en la fila de listado (solo en el detalle).
