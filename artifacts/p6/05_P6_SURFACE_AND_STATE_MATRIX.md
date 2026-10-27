# P6 surface and state matrix

| Familia | Variante | Evidencia funcional |
|---|---|---|
| R01 | Normal | `summary-normal.png`, P6-UI01/02 |
| R01 | Sin cobros | `summary-zero-collected.png`, P6-UI07 |
| R01 | Sin turnos | `summary-no-appointments.png`, P6-UI08 |
| R01 | Parcial | `summary-partial-source.png`, P6-UI10 |
| R01 | Stale | `summary-stale.png`, P6-UI12 |
| R01 | Restringido | `summary-restricted.png`, P6-UI11 |
| R02 | Vacía / una / muchas | Capturas `summary-no-incidents`, `one-incident`, `many-incidents` |
| R02 | Agrupada | ID estable por causa y objetos; ST-10 |
| R03 | 8/12 / vacía / finalizada | Capturas 8-of-12, no-appointments, day-finished |
| R03 | Walk-in / reprogramación | J6-09, J6-12 |
| R04 | Normal / cero / mixto / error | Capturas y P6-D01–D06 |
| R05 | Stock crítico | AT-05/06 y `summary-critical-stock.png` |
| R06 | Actividad | Campana global preservada; no se añadió feed |

El error de una fuente sólo afecta su lectura. La ausencia de datos válida produce `$0` o “Sin turnos”; la indisponibilidad produce `—` y explicación.
