# P5 · Dominio e integración P1–P4

## Fuente de verdad

- Clientes y servicios: arrays canónicos de P2 (`state/agenda.ts`); P5 agrega metadata, notas, consentimiento, alias y versiones, no copias paralelas.
- Reservas/atenciones: P2 es dueño; P5 consulta e inicia handoffs con `ClientID`/`ReservationID`.
- Staff: `state/staff.ts` y `PROFESIONALES`; `StaffID` permanece distinto de `AccountID` y `ClientID`.
- Inventario: artículos/pedidos/auditoría de P3; promociones sólo apuntan a IDs existentes y los pedidos vuelven a P3.
- Finanzas: ventas/auditoría/obligaciones de P4; P5 nunca crea cobro por publicar, inscribir o cancelar docencia.
- Perfil, cursos, promociones, reglas, cuentas demo, alertas y auditoría P5: `state/more.ts`.

## Integraciones verificadas

| Origen P5 | Destino | Contexto entregado | Retorno/garantía |
|---|---|---|---|
| M04/M09/M23/M61/M63 | P2 Agenda | `clientId` o `agendaReservation` | P5 conserva memoria; cliente precargado |
| M10/M80/M82 | P3 Inventario | `inventorySurface`, `articleId`/`orderId` | back usa `returnRoot=mas` |
| M10/M41/M59/M80/M82 | P4 Finanzas | `financeSurface`, `financeOrigin` | back usa `returnRoot=mas` |
| M68–M73 | P2 Personal | StaffID real | vínculo, no fusión de identidad |
| TopBar campana | M79–M83 | mismo `moreStore.alerts` | read compartido; resolved independiente |
| P3/P4 audit | M76–M78 | eventos normalizados readonly | original no se reescribe |

## Invariantes

- intervalos `[start,end)`; conflictos sólo sobre recurso/instructor ocupado;
- capacidad nunca se excede; waitlist no asciende sin política;
- draft y publicado usan versiones independientes;
- operation IDs idempotentes y expectedVersion en writes sensibles;
- histórico P1–P4 no se destruye;
- alertas no son auditoría;
- no hay mensajes, pagos, deploy, autenticación o publicación externa fingidos.

`verifyMoreInvariants()` termina vacío en ST40.
