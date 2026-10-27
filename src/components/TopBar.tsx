import { Bell } from "lucide-react"
import { DEMO_OWNER } from "../state/demo"

type TopBarProps = {
  notificationCount: number
  onOpenNotifications: () => void
  onOpenAccount: () => void
}

export function TopBar({ notificationCount, onOpenNotifications, onOpenAccount }: TopBarProps) {
  return (
    <header
      className="shrink-0"
      style={{ height: 72, background: "var(--color-canvas)", borderBottom: "1px solid var(--color-border-subtle)" }}
    >
      <div style={{ height: "100%", display: "flex", alignItems: "center", padding: "0 12px 0 16px" }}>
        <div aria-label="YoungKingZ" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <span
            aria-hidden
            style={{
              width: 34,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 11,
              background: "linear-gradient(145deg, #342944, #20172E)",
              border: "1px solid rgba(185,154,255,.28)",
              color: "var(--color-brand-200)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".04em",
            }}
          >YK</span>
          <span style={{ color: "var(--color-ink)", fontSize: 15, lineHeight: "20px", fontWeight: 750, letterSpacing: "-.01em" }}>YoungKingZ</span>
        </div>

        <button type="button" className="pressable" style={iconButtonStyle} aria-label="Abrir avisos y actividad" onClick={onOpenNotifications}>
          <Bell size={21} strokeWidth={1.9} aria-hidden />
          {notificationCount > 0 ? (
            <span style={{ position: "absolute", top: 3, right: 3, minWidth: 17, height: 17, paddingInline: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1.5px solid var(--color-canvas)", background: "var(--color-danger-strong)", color: "white", fontSize: 10, lineHeight: "12px", fontWeight: 700 }}>{notificationCount}</span>
          ) : null}
        </button>
        <button type="button" className="pressable" style={{ ...iconButtonStyle, marginLeft: 2 }} aria-label="Abrir cuenta" onClick={onOpenAccount}>
          <span style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--color-surface-raised)", color: "var(--brand-200, #DDD6FE)", fontSize: 11, fontWeight: 750 }}>{DEMO_OWNER.initials}</span>
        </button>
      </div>
    </header>
  )
}

const iconButtonStyle = {
  position: "relative",
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: 0,
  borderRadius: 14,
  background: "transparent",
  color: "var(--color-ink-2)",
} as const
