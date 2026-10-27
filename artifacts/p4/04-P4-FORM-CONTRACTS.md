# Contratos de formularios

| Flujo | Requeridos | Revisión / bloqueo |
|---|---|---|
| Venta | cliente o atención, líneas, cantidades, precios | descuento exige motivo/autorización; duplicado bloqueado. |
| Cobro | obligación, importe, medio(s), aplicaciones | suma de medios y aplicaciones exacta; saldo/versión; externo sin referencia queda pendiente. |
| Pago | obligación, beneficiario, importe, medio y fuente | no supera saldo; efectivo exige Caja. |
| Gasto | concepto, categoría, importe | pendiente no mueve dinero; pagar ahora exige medio/fuente. |
| Obligación comercial | proveedor, documento, líneas/concepto, importe o A confirmar, vencimiento | documento P3 repetido devuelve DUPLICATE. |
| Anticipo/seña | titular, importe, medio, vínculo cuando corresponde | aplicación no crea nuevo dinero; cancelación sin política bloqueada. |
| Caja | sesión, responsable, contado y versión | cierre exige arqueo; diferencia conserva snapshot. |
| Cliente | búsqueda o alta mínima | nombre/teléfono reutilizan coincidencias; cobro futuro exige identidad. |
| Documento | PDF/PNG/JPEG, hasta 5 MB | adjuntar no verifica ni acredita. |

Todos los importes se convierten a centavos al confirmar; los formularios muestran resultado explícito y no dependen sólo de color.
