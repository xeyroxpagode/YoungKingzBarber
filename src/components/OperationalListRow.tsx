import { type ReactNode } from "react"

type OperationalListRowProps = {
  time?: string
  avatar?: ReactNode
  initials?: string
  title: string
  detail?: string
  status?: string
  statusTone?: "neutral" | "success" | "warning" | "danger" | "info"
  trailing?: ReactNode
  onPress?: () => void
  disabled?: boolean
}

const STATUS_COLOR: Record<
  string,
  { bg: string; dot: string; text: string }
> = {
  neutral: {
    bg: "rgba(138, 129, 120, 0.10)",
    dot: "var(--color-ink-3)",
    text: "var(--color-ink-3)",
  },
  success: {
    bg: "rgba(74, 158, 92, 0.10)",
    dot: "var(--color-success)",
    text: "var(--color-success)",
  },
  warning: {
    bg: "rgba(217, 134, 34, 0.10)",
    dot: "var(--color-warning)",
    text: "var(--color-warning)",
  },
  danger: {
    bg: "rgba(214, 76, 90, 0.10)",
    dot: "var(--color-danger)",
    text: "var(--color-danger)",
  },
  info: {
    bg: "rgba(124, 143, 184, 0.10)",
    dot: "var(--color-info)",
    text: "var(--color-info)",
  },
}

export function OperationalListRow({
  time,
  avatar,
  initials,
  title,
  detail,
  status,
  statusTone = "neutral",
  trailing,
  onPress,
  disabled = false,
}: OperationalListRowProps) {
  const style = STATUS_COLOR[statusTone] ?? STATUS_COLOR.neutral

  return (
    <button
      type="button"
      className="pressable flex items-center justify-between w-full"
      disabled={disabled}
      onClick={onPress}
      style={{
        width: "100%",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--color-ink)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-3 shrink-0" style={{ minWidth: 0 }}>
        {time ? (
          <span
            className="shrink-0"
            style={{
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 600,
              color: "var(--color-ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {time}
          </span>
        ) : null}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "var(--radius-full)",
            background:
              avatar || initials
                ? "var(--color-surface-raised)"
                : "transparent",
          }}
        >
          {avatar ? (
            <span style={{ width: 30, height: 30, borderRadius: "9999px", overflow: "hidden", display: "block" }}>
              {avatar}
            </span>
          ) : initials ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-ink-inverse)",
              }}
            >
              {initials}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-w-0 mx-3" style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 12 }}>
        <p
          className="text-[15px] leading-[21px] font-[600] text-[var(--color-ink)] truncate"
          style={{
            fontSize: 15,
            lineHeight: "21px",
            fontWeight: 600,
            color: "var(--color-ink)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </p>
        {detail ? (
          <p
            className="text-[13px] leading-[18px] text-[var(--color-ink-3)] truncate mt-0.5"
            style={{
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--color-ink-3)",
              marginTop: 2,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {detail}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {status ? (
          <span
            className="shrink-0 flex items-center gap-1.5 rounded-full"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "9999px",
              padding: "2px 8px",
              background: style.bg,
            }}
          >
            <span
              className="shrink-0"
              style={{
                width: 6,
                height: 6,
                borderRadius: "9999px",
                background: style.dot,
                display: "block",
              }}
            />
            <span
              className="text-[11px] leading-[15px] font-[600] tabular-nums"
              style={{
                fontSize: 11,
                lineHeight: "15px",
                fontWeight: 600,
                color: style.text,
              }}
            >
              {status}
            </span>
          </span>
        ) : null}
        {trailing ? (
          <span
            className="shrink-0"
            style={{
              width: 22,
              height: 22,
              borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border-subtle)`,
              background: "var(--color-surface)",
              color: "var(--color-ink-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {trailing}
          </span>
        ) : null}
      </div>
    </button>
  )
}
