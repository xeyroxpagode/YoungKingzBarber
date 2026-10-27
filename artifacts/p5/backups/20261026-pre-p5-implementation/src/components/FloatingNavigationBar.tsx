import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react"

export type FloatingNavItem = {
  id: string
  icon: ReactNode
  accessibilityLabel: string
  isAction?: boolean
  badge?: number
  onPress?: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

export type FloatingNavBarProps = {
  items: FloatingNavItem[]
  activeId: string
  onSelect: (id: string) => void
  /** Safe-area bottom de la pantalla (px). */
  safeBottom?: number
}

const METRICS = {
  barHeight: 68,
  barPadX: 4,
  activeSize: 52,
  activeOffset: 4,
  fabSize: 56,
  itemMinHeight: 44,
  hitTarget: 44,
} as const

const PALETTE = {
  surface: "rgba(20, 18, 16, 0.92)",
  border: "rgba(255, 255, 255, 0.06)",
  icon: "#8A8178",
  activeIcon: "#FFFFFF",
  activeSurface: "rgba(139, 92, 246, 0.18)",
  activeBorder: "rgba(139, 92, 246, 0.35)",
  accent: "#8B5CF6",
  badge: "#D64C5A",
  badgeBorder: "#141210",
} as const

export function FloatingNavigationBar({
  items,
  activeId,
  onSelect,
  safeBottom = 0,
}: FloatingNavBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const [barWidth, setBarWidth] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  const matchedIndex = items.findIndex(
    (item) => item.id === activeId && !item.isAction,
  )
  const activeIndex = matchedIndex >= 0 ? matchedIndex : -1

  useLayoutEffect(() => {
    const node = barRef.current
    if (!node) return
    const update = () => setBarWidth(node.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  const itemWidth =
    barWidth > 0
      ? Math.max(0, barWidth - METRICS.barPadX) / Math.max(items.length, 1)
      : 0
  const indicatorLeft =
    itemWidth > 0
      ? METRICS.activeOffset +
        (itemWidth - METRICS.activeSize) / 2 +
        activeIndex * itemWidth
      : 0

  return (
    <div
      className="pb-5 pt-2 bg-transparent"
      style={{ paddingBottom: Math.max(safeBottom, 12) }}
    >
      <div
        ref={barRef}
        role="tablist"
        className="flex items-center rounded-[28px] relative overflow-hidden"
        style={{
          height: METRICS.barHeight,
          paddingInline: METRICS.barPadX,
          background: PALETTE.surface,
          border: `1px solid ${PALETTE.border}`,
          boxShadow:
            "0 8px 24px rgba(26,23,20,0.12), 0 2px 8px rgba(26,24,22,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        {activeIndex >= 0 && itemWidth > 0 && (
          <span
            aria-hidden
            data-testid="floating-nav-indicator"
            className="absolute rounded-full pointer-events-none"
            style={{
              width: METRICS.activeSize,
              height: METRICS.activeSize,
              top: (METRICS.barHeight - METRICS.activeSize) / 2,
              left: indicatorLeft,
              background: PALETTE.activeSurface,
              border: `1px solid ${PALETTE.activeBorder}`,
              // 260 ms (`--motion-structural`: un cambio de slot es un cambio de
              // profundidad) con `--motion-ease-move`. Con reduced motion el
              // indicador CORTA: puede saltar de slot, pero nunca rebotear.
              transition: reduceMotion
                ? "none"
                : "left var(--motion-structural) var(--motion-ease-move)",
            }}
          />
        )}

        {items.map((item) => {
          const isActive = item.id === activeId && !item.isAction
          const isAction = Boolean(item.isAction)

          return (
            <button
              key={item.id}
              type="button"
              ref={item.buttonRef}
              role={isAction ? "button" : "tab"}
              aria-label={item.accessibilityLabel}
              aria-selected={isAction ? undefined : isActive}
              className="pressable relative flex-1 min-w-0 flex items-center justify-center border-none bg-transparent"
              style={{
                height: "100%",
                minHeight: METRICS.itemMinHeight,
                zIndex: 1,
                color: isActive || isAction ? PALETTE.activeIcon : PALETTE.icon,
              }}
              onClick={() => {
                if (isAction) {
                  item.onPress?.()
                  return
                }
                onSelect(item.id)
              }}
            >
              {item.badge && item.badge > 0 ? (
                <span
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    top: 8,
                    left: "50%",
                    marginLeft: 6,
                    minWidth: 16,
                    height: 16,
                    paddingInline: 3,
                    background: PALETTE.badge,
                    border: `1.5px solid ${PALETTE.badgeBorder}`,
                  }}
                >
                  <span className="text-[9px] leading-[11px] font-[700] text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                </span>
              ) : null}

              {isAction ? (
                <span
                  className="flex items-center justify-center rounded-full text-white"
                  style={{
                    width: METRICS.fabSize,
                    height: METRICS.fabSize,
                    background: PALETTE.accent,
                    boxShadow: "0 4px 12px rgba(26,23,20,0.10)",
                  }}
                >
                  {item.icon}
                </span>
              ) : (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: METRICS.activeSize,
                    height: METRICS.activeSize,
                  }}
                >
                  {item.icon}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
