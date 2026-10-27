import { useState } from "react"
import { AgendaSurface } from "./agenda/AgendaSurface"
import { PersonalSurface } from "./personal/PersonalSurface"

export function TeamSurface({ onDepthChange, onNavigateRoot }: { onDepthChange?: (deep: boolean) => void; onNavigateRoot?: (root: string) => void }) {
  const [context, setContext] = useState<"agenda" | "personal">("agenda")

  if (context === "personal") {
    return <PersonalSurface onSelectAgenda={() => setContext("agenda")} onDepthChange={onDepthChange} onNavigateFinance={(surface, originId) => { window.history.replaceState(null, "", `?financeSurface=${surface}&returnRoot=equipo&financeOrigin=${encodeURIComponent(originId)}`); onNavigateRoot?.("finanzas") }} />
  }

  return <AgendaSurface onSelectPersonal={() => setContext("personal")} onDepthChange={onDepthChange} onNavigateRoot={onNavigateRoot} />
}
