# Auditoría CURRENT → TARGET → REAL GAP

| Área | CURRENT inicial | TARGET contrato | REAL GAP encontrado | Resolución |
|---|---|---|---|---|
| Core | tipos/fixtures/proyecciones, sin operaciones | dominio transaccional completo | comentario refería `financeOps.ts` inexistente; adaptador P2 invertía alquiler; corrección de Caja duplicaba signo | `financeOps.ts`, adaptadores y proyección corregidos |
| UI | lista de 10 obligaciones | F01–F73 | sin root financiero, formularios, estados ni recorridos | raíz, 73 superficies, workbenches y atlas F64 |
| P2 | adapter parcial | handoff e identidad | alquiler tratado como por pagar; liquidación abierta con importe afirmado | dirección/amountKnown y handoff F27/F28 |
| P3 | adapter parcial | compra/pedido sin duplicación | sin retorno ni identidad explícita | F38/F59 y `financeOrigin` |
| Seguridad | permisos tipados | revalidación en confirmación | sin escrituras para ejercerlos | autorización, approval, policy, conflict, unknown |
| Caja | fixture/proyección | apertura, arqueo, cierre, relevo | faltaban comandos y variantes | F43–F51/F67 y tests |
| Auxiliares | no existían | clientes, docs, categorías, recurrencia | F24/F37/F66 inicialmente superficiales durante recuperación | flujos específicos y tests añadidos |
| QA | TypeScript pasaba | dominio + build + E2E + capturas | no había evidencia P4 | suites y 91 capturas |

Gaps residuales aceptados por el contrato: persistencia sólo en memoria, adjuntos de sesión, verificación bancaria manual y políticas no definidas bloqueadas. No se identificó un bloqueo funcional real.
