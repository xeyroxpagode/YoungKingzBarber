import type { ReactNode } from "react"

export type RootId = "resumen" | "equipo" | "inventario" | "finanzas" | "mas"

export type RootDefinition = {
  id: RootId
  label: string
  icon: ReactNode
}

export const ROOTS: RootDefinition[] = [
  {
    id: "resumen",
    label: "Resumen",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12.5L12 5l8 7.5V20h-6v-5h-4v5H4v-7.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "equipo",
    label: "Equipo",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <circle
          cx="17"
          cy="9"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M17 16c1.7 0 3 1.3 3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 8.5L12 4l8 4.5v7L12 20l-8-4.5v-7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 8.5L12 13l7.5-4.5M12 13v7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M3 10h18M7 15h4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "mas",
    label: "Más",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="5.5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="18.5" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
]
