# P6 stress and correctives

ST-01–ST-20 se ejecutan individualmente en `tests/owner-summary-acceptance.spec.ts`; resultado aislado 20/20 PASS.

Correctivos aplicados durante implementación:

- Reemplazo del `$0` hardcodeado por P4 real.
- Corrección del conteo Agenda que incluía todas las fechas.
- Dedupe de cobros por operación y de reservas por identidad.
- Disponible de stock reconstruido desde un único snapshot P3.
- Eliminación de falsos positivos: Caja abierta a las 14:00, pedido simplemente listo, mínimo cero, atención ajena y aviso leído.
- Diferenciación de error, parcial, stale, permiso y vacío.
- Persistencia de scroll y limpieza de parámetros temporales.
- Reflow a 320 px y corte de motion bajo `prefers-reduced-motion`.

No hubo que corregir regresiones P1–P5 en los slices previos al gate final.
