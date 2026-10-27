import { useEffect, useState } from "react"
import { AccountPanel } from "../overlays/AccountPanel"
import { NotificationsPanel } from "../overlays/NotificationsPanel"

export type OverlayKind = "notifications" | "account"

type OverlayHostProps = {
  overlay: OverlayKind | null
  onClose: () => void
}

export function OverlayHost({ overlay, onClose }: OverlayHostProps) {
  const [visibleOverlay, setVisibleOverlay] = useState<OverlayKind | null>(
    overlay,
  )
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (overlay) {
      setVisibleOverlay(overlay)
      setClosing(false)
      return
    }
    if (!visibleOverlay) return
    setClosing(true)
    const timer = window.setTimeout(() => {
      setVisibleOverlay(null)
      setClosing(false)
    }, 195)
    return () => window.clearTimeout(timer)
  }, [overlay, visibleOverlay])

  if (!visibleOverlay) return null

  return (
    <div
      className={`absolute inset-0 z-50 ${
        closing ? "overlay-layer-exiting" : ""
      }`}
      data-testid="overlay-host"
    >
      {visibleOverlay === "notifications" ? (
        <NotificationsPanel onClose={onClose} />
      ) : (
        <AccountPanel onClose={onClose} />
      )}
    </div>
  )
}
