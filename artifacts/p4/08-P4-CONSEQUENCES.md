# Matriz de consecuencias

| Acción | Ledger | Obligación | Caja | P2/P3 |
|---|---|---|---|---|
| Crear venta | no | crea por cobrar | no | atención preservada |
| Cobrar | ingreso único | aplica uno o varios saldos | sólo efectivo | pedido P3 puede recibir cobro |
| Pagar | egreso único | reduce saldo | sólo efectivo | liquidación/compra conserva ID |
| Gasto pendiente | no | crea por pagar | no | — |
| Gasto pagado | egreso | crea y salda | si efectivo | — |
| Retiro | retiro | no | si Caja | no es gasto |
| Traslado | dos patas lógicas, neutral | no | origen/destino | no es resultado |
| Anticipo | ingreso o egreso real | no aplica aún | si efectivo | vínculo futuro |
| Aplicar anticipo/crédito | no | reduce saldo | no | no duplica dinero |
| Arqueo | no | no | sólo observación | — |
| Corrección | compensación | no borra historial | reconstrucción | original intacto |
| Entrega terceros | egreso ajeno | reduce custodia | si efectivo | no gasto propio |
