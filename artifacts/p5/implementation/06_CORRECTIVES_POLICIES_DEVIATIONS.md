# P5 · Correctivos, políticas y desviaciones

## COR-01–COR-20

| ID | Aplicación renderizada | Evidencia | Estado |
|---|---|---|---|
| COR-01 | alias/remap de cliente con historia intacta | ST01, M08/M14 | PASS |
| COR-02 | cambio servicio no mueve reservas; M23 resuelve owner | ST02–03, R5-13–18 | PASS |
| COR-03 | conflicto exacto Agenda/curso/instructor | ST04, M31/M62 | PASS |
| COR-04 | curso pago no crea ingreso | ST06, M41 | PASS |
| COR-05 | guardar draft ≠ publicar | ST20/ST38, M44–M47 | PASS |
| COR-06 | promo sin política no activa | ST27–28, M49–M52 | PASS |
| COR-07 | horario no cancela por arrastre | ST16/ST39, M63 | PASS |
| COR-08 | regla de aviso ≠ entrega externa | M64/M81 | PASS |
| COR-09 | Account/Staff/Client separados y último admin | ST07/ST24/ST37 | PASS |
| COR-10 | audit readonly ≠ alerts read/resolved | ST25, M76–M83 | PASS |
| COR-11 | listas, detalles, forms, review, picker, preview, state | matriz C01–C24 | PASS |
| COR-12 | drafts preservados en selector/retorno | ST14/ST17 | PASS |
| COR-13 | operation ID, versión y review | `state/more.ts`, ST26/ST31 | PASS |
| COR-14 | MO01–MO22 con origen/destino | 85 frames temporales | PASS |
| COR-15 | harness externo por query, sin atlas visible | ST40 | PASS |
| COR-16 | operational rows y héroes sólo en entidades | capturas M01/M02/M15/M26/M48/M76 | PASS |
| COR-17 | búsqueda inline reversible | ST18, MO02 | PASS |
| COR-18 | empty/no-match/policy/conflict con causa/acción | capturas de variantes | PASS |
| COR-19 | foco, Escape, teclado y CTA | ST19/ST22/ST23 | PASS |
| COR-20 | responsive 320/390/430 dentro del mismo PhoneFrame | capturas responsive | PASS |

## Políticas pendientes intencionales

No son errores ocultos ni confirmaciones falsas; aparecen como `POLICY_REQUIRED`:

- tarifa, cobro, reintegro y tratamiento comercial de cursos pagos;
- prioridad/aceptación de lista de espera;
- beneficio, límites y acumulación de promociones;
- cancelación, ausencia, retención o devolución de señas;
- alcance de borrado/retención ante solicitudes de privacidad;
- canales, plantillas y comprobante de entrega de recordatorios;
- recuperación de cuenta, MFA, sesiones remotas e invitaciones productivas.

## Desviaciones no críticas

- El build conserva el warning de Vite por chunk principal >500 kB. No afecta ejecución ni cobertura; code splitting queda como optimización posterior.
- No hay backend productivo, deploy público, proveedor de mensajes, procesador de pagos ni autenticación real, conforme al alcance.
- El pulido artístico pixel-perfect final queda fuera de esta baseline, tal como indica el contrato.

No quedan fallos críticos, recorridos incompletos ni desviaciones funcionales conocidas dentro del alcance frontend demo.
