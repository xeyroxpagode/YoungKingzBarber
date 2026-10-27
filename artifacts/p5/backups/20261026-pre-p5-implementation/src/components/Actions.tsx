import { type ReactNode } from "react"

type PrimaryActionProps = {
  label: string
  icon?: ReactNode
  onPress: () => void
  disabled?: boolean
  fullWidth?: boolean
}

export function PrimaryAction({
  label,
  icon,
  onPress,
  disabled = false,
  fullWidth = false,
}: PrimaryActionProps) {
  return (
    <button
      type="button"
      className="pressable flex items-center justify-center gap-2 shrink-0 border-none outline-none"
      disabled={disabled}
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexShrink: 0,
        width: fullWidth ? "100%" : "auto",
        height: 52,
        borderRadius: "var(--radius-button)",
        border: `1px solid var(--color-brand)`,
        background: disabled ? "var(--color-ink-4)" : "var(--color-brand)",
        color: disabled ? "rgba(255,255,255,0.5)" : "var(--color-ink-inverse)",
        fontSize: 15,
        lineHeight: "21px",
        fontWeight: 700,
        opacity: disabled ? 0.6 : 1,
        paddingInline: fullWidth ? 16 : 14,
      }}
    >
      {icon && (
        <span
          className="shrink-0"
          style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {icon}
        </span>
      )}
      <span style={{ fontWeight: 700 }}>{label}</span>
    </button>
  )
}

type SecondaryActionProps = {
  label: string
  icon?: ReactNode
  onPress: () => void
  disabled?: boolean
  fullWidth?: boolean
}

export function SecondaryAction({
  label,
  icon,
  onPress,
  disabled = false,
  fullWidth = false,
}: SecondaryActionProps) {
  return (
    <button
      type="button"
      className="pressable flex items-center justify-center gap-2 shrink-0 border-none outline-none"
      disabled={disabled}
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexShrink: 0,
        width: fullWidth ? "100%" : "auto",
        height: 52,
        borderRadius: "var(--radius-button)",
        border: `1px solid var(--color-border)`,
        background: "transparent",
        color: disabled ? "var(--color-ink-4)" : "var(--color-ink)",
        fontSize: 15,
        lineHeight: "21px",
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        paddingInline: fullWidth ? 16 : 14,
      }}
    >
      {icon && (
        <span
          className="shrink-0"
          style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {icon}
        </span>
      )}
      <span style={{ fontWeight: 600 }}>{label}</span>
    </button>
  )
}

type StatusIndicatorProps = {
  label: string
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
  size?: "small" | "default"
}

const STATUS_STYLE: Record<string, { bg: string; dot: string; text: string }> = {
  neutral: { bg: "rgba(138, 129, 120, 0.10)", dot: "var(--color-ink-3)", text: "var(--color-ink-3)" },
  success: { bg: "rgba(74, 158, 92, 0.10)", dot: "var(--color-success)", text: "var(--color-success)" },
  warning: { bg: "rgba(217, 134, 34, 0.10)", dot: "var(--color-warning)", text: "var(--color-warning)" },
  danger: { bg: "rgba(214, 76, 90, 0.10)", dot: "var(--color-danger)", text: "var(--color-danger)" },
  info: { bg: "rgba(124, 143, 184, 0.10)", dot: "var(--color-info)", text: "var(--color-info)" },
}

export function StatusIndicator({
  label,
  tone = "neutral",
  size = "default",
}: StatusIndicatorProps) {
  const style = STATUS_STYLE[tone]
  const fs = size === "small" ? 11 : 12
  const lh = size === "small" ? 15 : 16
  const pad = size === "small" ? "1px 6px" : "2px 8px"
  return (
    <span
      className="flex items-center gap-1.5 rounded-full shrink-0"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderRadius: "9999px",
        padding: pad,
        background: style.bg,
      }}
    >
      <span
        className="shrink-0"
        style={{ width: 6, height: 6, borderRadius: "9999px", background: style.dot, display: "block", flexShrink: 0 }}
      />
      <span
        className="text-[size] leading-[lh] font-[600]"
        style={{
          fontSize: fs,
          lineHeight: `${lh}px`,
          fontWeight: 600,
          color: style.text,
        }}
      >
        {label}
      </span>
    </span>
  )
}
