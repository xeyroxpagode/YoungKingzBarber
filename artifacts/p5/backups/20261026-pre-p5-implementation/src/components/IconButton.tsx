import { type ReactNode } from "react"

type IconButtonProps = {
  icon: ReactNode
  "aria-label": string
  pressed?: boolean
  size?: 32 | 40 | 44
  onPress?: () => void
  variant?: "ghost" | "surface"
  disabled?: boolean
}

export function IconButton({
  icon,
  "aria-label": ariaLabel,
  pressed = false,
  size = 44,
  onPress,
  variant = "ghost",
  disabled = false,
}: IconButtonProps) {
  const dim = size
  const isSurface = variant === "surface"
  return (
    <button
      type="button"
      className="pressable flex items-center justify-center shrink-0 border-none outline-none"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onPress}
      style={{
        width: dim,
        height: dim,
        borderRadius: "var(--radius-full)",
        border: `1px solid ${isSurface ? "var(--color-border)" : "transparent"}`,
        background: isSurface
          ? "var(--color-surface)"
          : "transparent",
        color: pressed
          ? "var(--color-ink)"
          : "var(--color-ink-3)",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon}
    </button>
  )
}
