# P6 projections

## Cobrado

`SUM(movimientos ingreso, confirmados, propios, efectivos en el día)` reutiliza `cobradoEn`. El conteo es `COUNT(DISTINCT operationId)` sobre el mismo conjunto. El fixture base reconcilia:

- `OP-SEED-COBRO-JUAN`: $18.000.
- `OP-SEED-COBRO-SOFIA`: $18.000.
- Resultado: $36.000 y 2 cobros.

Los componentes de un cobro mixto suman importe pero comparten una recepción. Pendientes de verificación, UNKNOWN, fondos ajenos, egresos, retiros, traslados y movimientos de otro día quedan fuera.

## Jornada

Se deduplica por `Reserva.id` y se filtra por fecha efectiva. Estados: finalizados, en atención, pendientes, ausentes y cancelados. Walk-ins se informan aparte. Fixture base: 8 + 1 + 1 + 1 + 1 = 12.

## Consistencia

Las métricas monetarias, conteo y desglose se producen desde un snapshot por render. Error no se convierte en cero; permiso restringido tampoco expone conteos.
