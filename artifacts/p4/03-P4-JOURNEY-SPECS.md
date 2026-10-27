# Especificación ejecutable de recorridos

Formato común para R4-01–R4-54:

- Entrada: raíz Finanzas o handoff P2/P3 indicado en la matriz de aceptación.
- Precondiciones: fixture base y permiso correspondiente; Caja abierta cuando interviene efectivo.
- Validación: importe entero positivo, saldo y versión vigentes, identidad/origen preservados.
- Escritura: sólo la operación descrita; una operación monetaria = un ID estable.
- Consecuencia: ledger, obligación, Caja o adaptación externa según la matriz de consecuencias.
- Excepción: estados del contrato sin confirmación artificial.
- Retorno: back local conserva contexto; handoff vuelve al root de origen.
- Prueba: caso `R4-nn` de `tests/finance-ui.spec.ts` más dominio/cross-domain asociado.

Las 54 fichas se materializan una por fila en [10-P4-ACCEPTANCE.md](10-P4-ACCEPTANCE.md), con entrada, resultado y evidencia; esto evita duplicar una segunda fuente de verdad.
