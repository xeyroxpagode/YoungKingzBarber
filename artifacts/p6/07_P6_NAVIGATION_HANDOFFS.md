# P6 navigation handoffs

| Origen | Destino real | Parámetros |
|---|---|---|
| Cobrado | Finanzas F09 | período hoy, ingreso, propiedad propia |
| Estado de turno | Equipo Agenda | fecha y estado |
| Reserva afectada | Agenda detalle/lista | `agendaReservation` o `agendaIds` |
| Stock | Inventario I08/I09 o lista filtrada | uso, artículo, filtro |
| Pedido | Inventario I32/I42 | `orderId` |
| Obligación | Finanzas F61 | colección de IDs |
| Caja | Finanzas F48/F49 | sesión o diferencias |
| Verificación | Finanzas F68 | IDs de verificación |
| UNKNOWN | Finanzas F56 | IDs de operación |
| Autorización | Finanzas F71 | IDs de solicitud |
| Curso/acceso | Más M62/M68 | IDs correspondientes |

Todos agregan `returnRoot=resumen`, `businessDate` y `returnScroll`. Los módulos limpian la URL al volver. P6 conserva su scroll en memoria de módulo y recalcula al remontar.

Capturas: `handoff-finance.png`, `handoff-agenda.png`, `handoff-inventory.png`, `return-from-finance.png`, `return-from-inventory.png`.
