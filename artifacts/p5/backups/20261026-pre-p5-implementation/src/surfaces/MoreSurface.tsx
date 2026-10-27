import { RootPlaceholder } from "./RootPlaceholder"

export function MoreSurface() {
  return (
    <RootPlaceholder
      title="Más"
      description="La raíz Más queda disponible para regroupar las opciones secundarias cuando se definan sus destinos."
      icon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="5.5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18.5" cy="12" r="1.5" fill="currentColor" />
        </svg>
      }
    />
  )
}
