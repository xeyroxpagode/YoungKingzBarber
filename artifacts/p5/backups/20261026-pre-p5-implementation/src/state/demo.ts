export type DemoOwner = {
  name: string
  initials: string
  role: string
}

export type DemoNotice = {
  id: string
  title: string
  body: string
  context: string
  tone: "neutral" | "warning"
}

export type DemoActivity = {
  id: string
  time: string
  text: string
  context: string
}

export const DEMO_OWNER: DemoOwner = {
  name: "Dueño YoungKingZ",
  initials: "YK",
  role: "Experiencia del Dueño",
}

export const DEMO_NOTICES: DemoNotice[] = [
  {
    id: "notice-equipo",
    title: "Revisión pendiente",
    body: "Registro de demostración para la superficie Equipo.",
    context: "Equipo",
    tone: "warning",
  },
  {
    id: "notice-inventario",
    title: "Actualización pendiente",
    body: "Registro de demostración para la superficie Inventario.",
    context: "Inventario",
    tone: "neutral",
  },
]

export const DEMO_ACTIVITY: DemoActivity[] = [
  {
    id: "activity-1",
    time: "Ahora",
    text: "Sesión de prototipo abierta",
    context: "Workspace",
  },
  {
    id: "activity-2",
    time: "09:41",
    text: "Estado demo inicial cargado",
    context: "Sistema",
  },
]
