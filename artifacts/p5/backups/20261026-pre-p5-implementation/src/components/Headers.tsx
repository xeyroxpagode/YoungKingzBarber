import { type ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

type RootHeaderProps = {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
}

export function RootHeader({
  title,
  subtitle,
  left,
  right,
}: RootHeaderProps) {
  return (
    <div
      className="flex items-center justify-between pt-5 pb-3"
      style={{ display: "flex", paddingInline: 0 }}
    >
      <div className="flex items-center gap-3 shrink-0">{left}</div>
      <div className="flex-1 min-w-0 flex flex-col">
        <p
          className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)] tracking-[-0.01em]"
          style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700 }}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            className="text-[13px] leading-[18px] text-[var(--color-ink-3)] mt-0.5"
            style={{
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--color-ink-3)",
              marginTop: 2,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  )
}

type DetailHeaderProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}

export function DetailHeader({
  title,
  subtitle,
  onBack,
  right,
}: DetailHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 pt-4 pb-3"
      style={{ display: "flex" }}
    >
      <div
        className="flex items-center gap-3 shrink-0"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        {onBack ? (
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Volver"
            onClick={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border)`,
              background: "var(--color-surface)",
              color: "var(--color-ink)",
            }}
          >
            <ChevronLeft size={20} strokeWidth={1.9} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <p
          className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)] tracking-[-0.01em]"
          style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700 }}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            className="text-[13px] leading-[18px] text-[var(--color-ink-3)] mt-0.5"
            style={{
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--color-ink-3)",
              marginTop: 2,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  )
}

type SectionHeaderProps = {
  label: string
  hint?: string
  right?: ReactNode
}

export function SectionHeader({
  label,
  hint,
  right,
}: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between pb-3"
      style={{ display: "flex", paddingInline: 0 }}
    >
      <div className="flex flex-col">
        <p
          className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-3)] uppercase tracking-wider"
          style={{
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-ink-3)",
          }}
        >
          {label}
        </p>
        {hint ? (
          <p
            className="text-[11px] leading-[15px] text-[var(--color-ink-4)] mt-1"
            style={{
              fontSize: 11,
              lineHeight: "15px",
              color: "var(--color-ink-4)",
              marginTop: 4,
            }}
          >
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  )
}
