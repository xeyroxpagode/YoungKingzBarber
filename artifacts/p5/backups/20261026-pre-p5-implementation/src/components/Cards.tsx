import { type ReactNode } from "react"

type MetricCardProps = {
  label: string
  value: string
  detail?: string
  icon?: ReactNode
  tone?: "neutral" | "brand" | "success" | "warning" | "danger"
  onPress?: () => void
}

const TONE_BG: Record<string, string> = {
  neutral: "var(--color-surface-raised)",
  brand: "var(--color-brand-soft)",
  success: "var(--color-success-soft)",
  warning: "var(--color-warning-soft)",
  danger: "var(--color-danger-soft)",
}

const TONE_TEXT: Record<string, string> = {
  neutral: "var(--color-ink)",
  brand: "var(--color-brand)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "brand",
  onPress,
}: MetricCardProps) {
  return (
    <button
      type="button"
      className="pressable w-full flex flex-col gap-2"
      onClick={onPress}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 16,
        borderRadius: "var(--radius-lg)",
        border: `1px solid var(--color-border)`,
        background: TONE_BG[tone],
        color: "var(--color-ink)",
      }}
    >
      <div className="flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <p
            className="text-[12px] leading-[16px] text-[var(--color-ink-3)] font-[500]"
            style={{
              fontSize: 12,
              lineHeight: "16px",
              color: "var(--color-ink-3)",
              fontWeight: 500,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </p>
          {detail ? (
            <p
              className="text-[11px] leading-[15px] text-[var(--color-ink-4)] mt-1"
              style={{
                fontSize: 11,
                lineHeight: "15px",
                color: "var(--color-ink-4)",
                marginTop: 4,
              }}
            >
              {detail}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div
            className="shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-border-subtle)`,
              background: "var(--color-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p
        className="text-[24px] leading-[30px] font-[700] tabular-nums tracking-tight"
        style={{
          fontSize: 24,
          lineHeight: "30px",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          color: TONE_TEXT[tone],
        }}
      >
        {value}
      </p>
    </button>
  )
}

type InformativeCardProps = {
  title: string
  body?: string
  icon?: ReactNode
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info"
  onPress?: () => void
}

const CARD_TONE_BG: Record<string, string> = {
  neutral: "var(--color-surface-raised)",
  brand: "var(--color-brand-soft)",
  success: "var(--color-success-soft)",
  warning: "var(--color-warning-soft)",
  danger: "var(--color-danger-soft)",
  info: "var(--color-info-soft)",
}

export function InformativeCard({
  title,
  body,
  icon,
  tone = "neutral",
  onPress,
}: InformativeCardProps) {
  return (
    <button
      type="button"
      className="pressable w-full flex items-start gap-3"
      onClick={onPress}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        borderRadius: "var(--radius-lg)",
        border: `1px solid var(--color-border)`,
        background: CARD_TONE_BG[tone],
        color: "var(--color-ink)",
      }}
    >
      {icon ? (
        <div
          className="shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-md)",
            border: `1px solid var(--color-border-subtle)`,
            background: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0" style={{ flex: 1, minWidth: 0 }}>
        <p
          className="text-[15px] leading-[21px] font-[600] text-[var(--color-ink)]"
          style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600 }}
        >
          {title}
        </p>
        {body ? (
          <p
            className="text-[13px] leading-[18px] text-[var(--color-ink-3)] mt-0.5 line-clamp-2"
            style={{
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--color-ink-3)",
              marginTop: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {body}
          </p>
        ) : null}
      </div>
    </button>
  )
}
