# P6 product contract implementado

P6 responde exclusivamente cuánto cobró el negocio, cómo avanza la jornada y qué requiere atención. La root conserva PhoneFrame, TopBar, campana, cuenta y la BottomNav de cinco roots.

La superficie permanente contiene exactamente:

1. Cobrado hoy.
2. Turnos de hoy.
3. Requiere atención.

No se añadieron gráficos, ocupación, reportes, feeds, formularios ni una cuarta sección. Las acciones residen en sus módulos propietarios. Los escenarios visuales (`summaryScenario`) son fixtures aislados para QA; no alteran el estado principal ni elevan datos de prueba a política.

R01–R06 se resolvieron como familias dentro de la única Home. R04 delega el detalle a P4; R05 se expresa como incidencia; R06 continúa en la campana global.
