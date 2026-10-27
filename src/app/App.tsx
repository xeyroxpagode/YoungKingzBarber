import { useEffect, useState, useSyncExternalStore } from "react"
import { FloatingNavigationBar } from "../components/FloatingNavigationBar"
import { OverlayHost, type OverlayKind } from "../components/OverlayHost"
import { PhoneFrame } from "../components/PhoneFrame"
import { TopBar } from "../components/TopBar"
import { moreStore } from "../state/more"
import { FinanceSurface } from "../surfaces/FinanceSurface"
import { InventorySurface } from "../surfaces/InventorySurface"
import { MoreSurface } from "../surfaces/MoreSurface"
import { OverviewSurface } from "../surfaces/OverviewSurface"
import { TeamSurface } from "../surfaces/TeamSurface"
import { ROOTS, type RootId } from "./navigation"

function RootSurface({ root, onDepthChange, onNavigateRoot }: { root: RootId; onDepthChange: (deep: boolean) => void; onNavigateRoot: (root: RootId) => void }) {
  if (root === "equipo") return <TeamSurface onDepthChange={onDepthChange} onNavigateRoot={(id) => onNavigateRoot(id as RootId)} />
  if (root === "inventario") return <InventorySurface onDepthChange={onDepthChange} onNavigateRoot={(id) => onNavigateRoot(id as RootId)} />
  if (root === "finanzas") return <FinanceSurface onDepthChange={onDepthChange} onNavigateRoot={(id) => onNavigateRoot(id as RootId)} />
  if (root === "mas") return <MoreSurface onDepthChange={onDepthChange} onNavigateRoot={(id) => onNavigateRoot(id as RootId)} />
  return <OverviewSurface onNavigateRoot={(id) => onNavigateRoot(id as RootId)} />
}

function YoungKingZShell() {
  const moreState = useSyncExternalStore(moreStore.subscribe, moreStore.getSnapshot)
  const [activeRoot, setActiveRoot] = useState<RootId>("resumen")
  const [overlay, setOverlay] = useState<OverlayKind | null>(null)
  const [rootDeep, setRootDeep] = useState(false)

  useEffect(() => {
    setOverlay(null)
    setRootDeep(false)
    if (activeRoot === "resumen") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("returnRoot") === "resumen") {
        window.history.replaceState(null, "", window.location.pathname)
      }
    }
  }, [activeRoot])

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{ transform: "translateZ(0)" }}
    >
      <TopBar
        notificationCount={moreState.alerts.filter((item) => !item.read && !item.resolved).length}
        onOpenNotifications={() => setOverlay("notifications")}
        onOpenAccount={() => setOverlay("account")}
      />

      <main
        className="flex-1 min-h-0 flex flex-col overflow-hidden relative"
        data-testid="root-content"
        data-active-root={activeRoot}
      >
        <RootSurface root={activeRoot} onDepthChange={setRootDeep} onNavigateRoot={setActiveRoot} />
        <OverlayHost overlay={overlay} onClose={() => setOverlay(null)} />
      </main>

      {!rootDeep ? <FloatingNavigationBar
        items={ROOTS.map((root) => ({
          id: root.id,
          icon: root.icon,
          accessibilityLabel: `Ir a ${root.label}`,
        }))}
        activeId={activeRoot}
        onSelect={(id) => setActiveRoot(id as RootId)}
        safeBottom={20}
      /> : null}
    </div>
  )
}

export default function App() {
  return (
    <PhoneFrame>
      <YoungKingZShell />
    </PhoneFrame>
  )
}
