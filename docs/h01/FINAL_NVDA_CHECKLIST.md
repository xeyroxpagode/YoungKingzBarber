# YOUNGKINGZ — H01 NVDA MANUAL CHECKLIST

## Limitación

No se pudo ejecutar NVDA de forma automatizada desde el entorno disponible. Esta checklist deja el procedimiento manual exacto para un auditor humano con NVDA en Windows.

## Precondiciones

- NVDA instalado y activo.
- Aplicación en http://localhost:3100.
- Cuenta OWNER de prueba creada por los fixtures E2E.
- Navegador Chromium o Firefox.

## Recorridos mínimos

1. Login: verificar que los campos Correo y Contraseña se anuncian con sus labels.
2. Login inválido: verificar anuncio del mensaje de error.
3. Equipo: navegar con Tab y verificar orden de foco y nombres de botones.
4. Detalle de integrante: abrir diálogo de edición de roles; verificar Escape y retorno de foco.
5. Mi cuenta → Mis datos: editar y guardar; verificar mensajes.
6. Mi cuenta → Acceso y seguridad: cambiar correo/contraseña; verificar campos.
7. Mi cuenta → Mis sesiones: paginación e historial.
8. Selector multirol (si aplica): cambio de contexto y anuncio.
9. Confirmación destructiva: diálogo modal, foco atrapado, Escape.

## Resultado esperado

Todos los controles operables por teclado, con labels y mensajes anunciados. Sin foco atrapado fuera de modales.

## Estado

Pendiente de ejecución humana. La certificación automatizada (axe-core + teclado) está aprobada.
