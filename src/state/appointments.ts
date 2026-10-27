export type TurnoEstado = "finalizado" | "en_atencion" | "confirmado" | "pendiente" | "cancelado"

export type Turno = {
  id: string
  hora: string
  cliente: string
  servicio: string
  barbero: string
  estado: TurnoEstado
}

export type Barbero = {
  id: string
  nombre: string
  funcion: string
  estado: "activo" | "inactivo"
  turnoActual?: string
  avatarInitials: string
}

const ESTADO_LABEL: Record<TurnoEstado, string> = {
  finalizado: "Finalizado",
  en_atencion: "En atención",
  confirmado: "Confirmado",
  pendiente: "Pendiente",
  cancelado: "Cancelado",
}

export function turnoEstadoLabel(estado: TurnoEstado) {
  return ESTADO_LABEL[estado]
}

export const TURNOS_HOY: Turno[] = [
  {
    id: "turno-1",
    hora: "09:00",
    cliente: "Juan Pérez",
    servicio: "Corte",
    barbero: "Alex",
    estado: "finalizado",
  },
  {
    id: "turno-2",
    hora: "09:30",
    cliente: "Martín Gómez",
    servicio: "Corte + barba",
    barbero: "Nico",
    estado: "en_atencion",
  },
  {
    id: "turno-3",
    hora: "10:00",
    cliente: "Lucas Fernández",
    servicio: "Corte",
    barbero: "Leo",
    estado: "confirmado",
  },
  {
    id: "turno-4",
    hora: "10:45",
    cliente: "Sofía Ramírez",
    servicio: "Corte",
    barbero: "Alex",
    estado: "confirmado",
  },
  {
    id: "turno-5",
    hora: "11:30",
    cliente: "Diego Morales",
    servicio: "Barba",
    barbero: "Nico",
    estado: "pendiente",
  },
  {
    id: "turno-6",
    hora: "12:00",
    cliente: "Elena Duarte",
    servicio: "Corte + barba",
    barbero: "Leo",
    estado: "confirmado",
  },
  {
    id: "turno-7",
    hora: "12:45",
    cliente: "Mateo Suárez",
    servicio: "Corte",
    barbero: "Alex",
    estado: "pendiente",
  },
  {
    id: "turno-8",
    hora: "13:30",
    cliente: "Camila Rojas",
    servicio: "Corte + barba",
    barbero: "Nico",
    estado: "confirmado",
  },
  {
    id: "turno-9",
    hora: "14:15",
    cliente: "Tomás Vega",
    servicio: "Corte",
    barbero: "Leo",
    estado: "pendiente",
  },
  {
    id: "turno-10",
    hora: "15:00",
    cliente: "Valeria Mendez",
    servicio: "Barba",
    barbero: "Alex",
    estado: "confirmado",
  },
]

export const TURNOS_REQUIEREN_ATENCION: Turno[] = [
  {
    id: "atencion-1",
    hora: "09:30",
    cliente: "Martín Gómez",
    servicio: "Corte + barba",
    barbero: "Nico",
    estado: "en_atencion",
  },
  {
    id: "atencion-2",
    hora: "11:30",
    cliente: "Diego Morales",
    servicio: "Barba",
    barbero: "Nico",
    estado: "pendiente",
  },
  {
    id: "atencion-3",
    hora: "12:45",
    cliente: "Mateo Suárez",
    servicio: "Corte",
    barbero: "Alex",
    estado: "pendiente",
  },
]

export const BARBEROS: Barbero[] = [
  {
    id: "barbero-1",
    nombre: "Alex Rivera",
    funcion: "Barbero senior",
    estado: "activo",
    turnoActual: "Juan Pérez · Corte",
    avatarInitials: "AR",
  },
  {
    id: "barbero-2",
    nombre: "Nico Salas",
    funcion: "Barbero",
    estado: "activo",
    turnoActual: "Martín Gómez · Corte + barba",
    avatarInitials: "NS",
  },
  {
    id: "barbero-3",
    nombre: "Leo Méndez",
    funcion: "Barbero",
    estado: "activo",
    turnoActual: "Lucas Fernández · Corte",
    avatarInitials: "LM",
  },
  {
    id: "barbero-4",
    nombre: "Samir Ortiz",
    funcion: "Barbero junior",
    estado: "inactivo",
    avatarInitials: "SO",
  },
  {
    id: "barbero-5",
    nombre: "Julieta Pérez",
    funcion: "Barbera",
    estado: "inactivo",
    avatarInitials: "JP",
  },
]

export function barberosActivos() {
  return [...BARBEROS].filter((b) => b.estado === "activo")
}

export function barberosInactivos() {
  return [...BARBEROS].filter((b) => b.estado === "inactivo")
}

export const COBRADO_HOY = 48600
