# Navegación y retorno

- Root Finanzas: tabs Resumen/Movimientos/Pendientes; BottomNav sólo en nivel root.
- Deep routes: pila local `stack`; back vuelve a la superficie anterior, incluido F64.
- Handoff P2: URL transporta `financeSurface`, `returnRoot=equipo` y `financeOrigin`; F27/F28 reutilizan identidad.
- Handoff P3: URL transporta F38, `returnRoot=inventario` y `PUR-901`; back devuelve a Inventario.
- Los parámetros se limpian al retornar para evitar reaperturas accidentales.
- El atlas F64 garantiza alcance verificable de F01–F73, sin duplicar stores ni roots.
