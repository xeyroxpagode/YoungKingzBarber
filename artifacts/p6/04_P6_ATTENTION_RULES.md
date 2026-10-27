# P6 attention rules

## Reglas implementadas

| Regla | Estado | Fuente / observación |
|---|---|---|
| AT-01 | Implementada | Ausencia vigente con reservas afectadas, agrupada |
| AT-02 | Implementada | Reservas activas superpuestas por profesional |
| AT-03 | Implementada | Atención propia completada sin venta |
| AT-04 | Cubierta por AT-01 cuando hay responsabilidades reales | No existe entidad separada de responsabilidad bloqueada |
| AT-05 / AT-06 | Implementadas | Disponible real bajo mínimo, interno/venta separados |
| AT-07 | Implementada | Pedido recibido o en preparación |
| AT-08 | No aplicable al modelo actual | `ready` no posee demora/problema persistido; no se inventa alerta |
| AT-09 | Implementada | Pedido en `incident` |
| AT-10 | Implementada | Recuento diferente sin movimiento de ajuste |
| AT-11 | Implementada | Cuarentena bloquea compromiso sin disponible |
| AT-12 | Implementada | Obligaciones con fecha válida vencida |
| AT-13 | POLICY_REQUIRED | No existe umbral de “próximo”; no se inventó |
| AT-14 | Implementada | Caja abierta después del cierre configurado |
| AT-15 | Implementada | Diferencia de Caja persistida |
| AT-16 / AT-17 / AT-18 | Implementadas | Verificación, UNKNOWN y autorización |
| AT-19 | Cubierta por AT-12 cuando es exigible | Liquidaciones abiertas sin monto firme no alertan |
| AT-20 | Implementada | Obligación de reintegro con saldo |
| AT-21 | No persistible en CURRENT | P5 bloquea el cambio incompatible antes de commit |
| AT-22 | Implementada | Sesión de curso con conflicto real |
| AT-23 | No aplicable en CURRENT | P5 no persiste intentos de publicación fallidos |
| AT-24 | Implementada | Cuenta administrativa necesaria no activa |
| AT-25 | No existe ledger genérico | Se evitan duplicados y avisos sin causa verificable |

Las identidades son estables: `causeKey + IDs ordenados`. Leer un aviso sólo cambia `read`; la causa permanece hasta que cambie el dominio propietario. El orden es severidad, urgencia/impacto y luego clave estable.
