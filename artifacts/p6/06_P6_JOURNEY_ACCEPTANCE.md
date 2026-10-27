# P6 journey acceptance

Los 32 journeys se ejecutan individualmente en `tests/owner-summary-acceptance.spec.ts`.

| Grupo | IDs | Resultado | Evidencia |
|---|---|---|---|
| Economía | J6-01–J6-06 | PASS | Ledger, mixto, pendiente, corrección y terceros |
| Jornada | J6-07–J6-13 | PASS | 8/12, finalizar, reprogramar, cancelar/crear, ausencia, walk-in, filtro |
| Atención | J6-14–J6-24 | PASS | Stock, pedidos, ausencia, vencida, Caja, autorización, UNKNOWN, aviso |
| Continuidad | J6-25–J6-32 | PASS | Vacíos, parcial, retorno, permisos, multirrol, cambio de día |

Cada caso ejecuta una operación o interacción y comprueba la proyección posterior. Resultado aislado: 32/32 PASS dentro de la corrida de 62 tests de aceptación.
