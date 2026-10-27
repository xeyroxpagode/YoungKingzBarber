import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

export type SegmentedControlOption = {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

type SegmentedControlProps = {
  options: SegmentedControlOption[]
  value: string
  onChange: (id: string) => void
  size?: "compact" | "default"
  ariaLabel?: string
  fullWidth?: boolean
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "default",
  ariaLabel = "Selector de vista",
  fullWidth = false,
}: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null)
  const [settled, setSettled] = useState(false)
  const compact = size === "compact"
  const height = compact ? 38 : 44
  const inset = 4

  const measure = useCallback(() => {
    const track = trackRef.current
    const selected = itemRefs.current.get(value)
    if (!track || !selected) return
    const trackBox = track.getBoundingClientRect()
    const box = selected.getBoundingClientRect()
    if (!box.width) return
    const next = { x: box.left - trackBox.left, width: box.width }
    setThumb((previous) =>
      previous && Math.abs(previous.x - next.x) < 0.5 && Math.abs(previous.width - next.width) < 0.5
        ? previous
        : next,
    )
  }, [value])

  useLayoutEffect(measure, [measure, options.length])
  useLayoutEffect(() => {
    if (thumb && !settled) setSettled(true)
  }, [settled, thumb])
  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure])

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      data-testid="segmented-control"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: fullWidth ? "100%" : options.length === 2 ? 264 : "100%",
        maxWidth: "100%",
        height,
        padding: inset,
        marginInline: "auto",
        borderRadius: compact ? 14 : 16,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-muted)",
        overflow: "hidden",
      }}
    >
      {thumb ? (
        <span
          aria-hidden
          data-testid="segmented-control-thumb"
          style={{
            position: "absolute",
            top: inset,
            left: 0,
            width: thumb.width,
            height: height - inset * 2,
            borderRadius: compact ? 10 : 13,
            border: "1px solid rgba(185, 154, 255, 0.28)",
            background: "var(--color-surface-selected)",
            transform: `translate3d(${thumb.x}px, 0, 0)`,
            transition: settled ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            ref={(node) => {
              if (node) itemRefs.current.set(option.id, node)
              else itemRefs.current.delete(option.id)
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={option.label}
            disabled={option.disabled}
            onClick={() => onChange(option.id)}
            className="pressable"
            style={{
              position: "relative",
              zIndex: 1,
              flex: "1 1 0%",
              minWidth: 0,
              height: height - inset * 2,
              paddingInline: 8,
              border: 0,
              borderRadius: compact ? 10 : 13,
              background: "transparent",
              color: selected ? "var(--color-brand-200)" : "var(--color-ink-3)",
              fontSize: compact ? 12 : 14,
              lineHeight: "20px",
              fontWeight: selected ? 700 : 600,
              transition: "color 190ms cubic-bezier(0.22, 1, 0.36, 1), opacity var(--motion-press) var(--ease-out)",
              opacity: option.disabled ? 0.45 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, maxWidth: "100%" }}>
              {option.icon}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{option.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
