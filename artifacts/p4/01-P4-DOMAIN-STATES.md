# Estados de dominio P4

| Área | Estados implementados | Regla |
|---|---|---|
| Operación | `enviado`, `confirmado`, `fallido`, `incierto` | Reintento con mismo ID devuelve `DUPLICATE`. |
| Obligación | `abierta`, `parcial`, `saldada`, importe conocido o `A confirmar` | Saldo = total − cumplido; vencimiento no altera importe. |
| Verificación externa | `declarado`, `comprobante_presentado`, `pendiente_verificacion`, `verificado`, `rechazado` | Archivo o declaración no acreditan dinero. |
| Caja | `abierta`, `cerrada`; arqueo con diferencia | Conteo observa; no corrige esperado. |
| Resultado excepcional | `PERMISSION_DENIED`, `APPROVAL_REQUIRED`, `POLICY_REQUIRED`, `DUPLICATE`, `CONFLICT`, `UNKNOWN`, `CLOSED_CASH` | Ninguno confirma artificialmente. |
| Lectura | `EMPTY`, `NO_MATCH`, `PARTIAL`, `OVERDUE`, `HISTORICAL`, `RETURN_FROM_HANDOFF` | Variantes capturadas o cubiertas por test. |

Los estados se ejercitan en `tests/finance-domain.spec.ts`, `tests/finance-ui.spec.ts` y `tests/finance-cross-domain.spec.ts`.
