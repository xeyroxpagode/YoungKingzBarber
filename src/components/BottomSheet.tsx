import { useEffect, useCallback, useRef } from "react"
import { ChevronRight, X } from "lucide-react"

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  handle?: boolean
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  handle = true,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-60" style={{ display: "contents" }}>
      <button
        type="button"
        className="absolute inset-0 scrim-in"
        style={{ background: "var(--color-scrim)", zIndex: 1 }}
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        data-nav-panel
        className="absolute bottom-0 left-0 right-0 z-2 flex flex-col bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] border-t border-[var(--color-border)] shadow-3 sheet-panel"
        style={{
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          borderTop: `1px solid var(--color-border)`,
          background: "var(--color-surface)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
        }}
      >
        {handle ? (
          <div
            className="flex justify-center px-4 pt-2.5 pb-1"
            style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}
          >
            <div
              className="w-10 h-1.5 rounded-full"
              style={{ width: 40, height: 6, background: "var(--color-ink-4)", borderRadius: "9999px" }}
            />
          </div>
        ) : null}
        {title ? (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-subtle)]" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: `1px solid var(--color-border-subtle)` }}>
            <p className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700 }}>{title}</p>
            <button
              type="button"
              className="pressable w-10 h-10 flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, borderRadius: "9999px", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink-3)" }}
              aria-label="Cerrar"
              onClick={onClose}
            >
              <X size={20} strokeWidth={1.9} aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6" style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

type PopoverProps = {
  open: boolean
  onClose: () => void
  anchor: HTMLElement | null
  children: React.ReactNode
}

export function ContextualMenu({ open, onClose, anchor, children }: PopoverProps) {
  if (!open || !anchor) return null

  const rect = anchor.getBoundingClientRect()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    const onClick = (event: MouseEvent) => {
      if (anchor && !anchor.contains(event.target as Node)) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onClick)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onClick)
    }
  }, [onClose, anchor])

  return (
    <div
      className="absolute z-60"
      style={{
        position: "absolute",
        zIndex: 60,
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 260)),
        minWidth: 220,
        display: "contents",
      }}
    >
      <button
        type="button"
        className="fixed inset-0 z-59"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <div
        data-nav-panel
        className="z-60 w-[260px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-3"
        style={{
          zIndex: 60,
          width: 260,
          borderRadius: "var(--radius-lg)",
          border: `1px solid var(--color-border)`,
          background: "var(--color-surface-raised)",
          boxShadow: "var(--shadow-3)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

type PopoverItemProps = {
  label: string
  hint?: string
  icon?: React.ReactNode
  onPress: () => void
  disabled?: boolean
  destructive?: boolean
}

export function PopoverItem({
  label,
  hint,
  icon,
  onPress,
  disabled = false,
  destructive = false,
}: PopoverItemProps) {
  return (
    <button
      type="button"
      className="pressable flex items-center justify-between w-full text-left"
      disabled={disabled}
      onClick={onPress}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        color: destructive
          ? "var(--color-danger)"
          : disabled
            ? "var(--color-ink-4)"
            : "var(--color-ink)",
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-3 min-w-0" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {icon && (
          <span className="shrink-0" style={{ width: 20, flexShrink: 0 }}>{icon}</span>
        )}
        <span
          className="truncate"
          style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="text-[11px] leading-[15px] text-[var(--color-ink-4)] shrink-0 whitespace-nowrap"
            style={{
              fontSize: 11,
              lineHeight: "15px",
              color: "var(--color-ink-4)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {hint}
          </span>
        )}
      </div>
      <ChevronRight size={17} strokeWidth={1.9} aria-hidden />
    </button>
  )
}
