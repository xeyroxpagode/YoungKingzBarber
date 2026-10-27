import { type ReactNode } from "react"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  body?: string
  action?: {
    label: string
    onPress: () => void
  }
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-6"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, paddingInline: 24 }}
    >
      {icon ? (
        <div
          className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: "var(--radius-lg)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {icon}
        </div>
      ) : null}
      <p
        className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]"
        style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700, color: "var(--color-ink)", textAlign: "center" }}
      >
        {title}
      </p>
      {body ? (
        <p
          className="text-[14px] leading-[20px] text-[var(--color-ink-3)]"
          style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)", textAlign: "center" }}
        >
          {body}
        </p>
      ) : null}
      {action ? (
        <button
          type="button"
          className="pressable flex items-center justify-center gap-2 border-none outline-none"
          onClick={action.onPress}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            borderRadius: "var(--radius-button)",
            border: `1px solid var(--color-brand)`,
            background: "var(--color-brand)",
            color: "var(--color-ink-inverse)",
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 700,
            padding: "9px 16px",
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

type LoadingStateProps = {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2.5 px-6 py-10"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 24px" }}
    >
      <div
        className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full"
        style={{
          width: 32,
          height: 32,
          border: `2px solid var(--color-border)`,
          borderTop: `2px solid var(--color-brand)`,
          borderRadius: "9999px",
          animation: "spin 0.8s linear infinite",
        }}
      />
      {message ? (
        <p
          className="text-[14px] leading-[20px] text-[var(--color-ink-3)]"
          style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)" }}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

type ErrorStateProps = {
  title: string
  body?: string
  onRetry?: () => void
}

export function ErrorState({ title, body, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 px-6"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingInline: 24 }}
    >
      <div
        className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          border: `1px solid var(--color-danger-soft)`,
          background: "var(--color-danger-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>⚠</span>
      </div>
      <p
        className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]"
        style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700, color: "var(--color-ink)", textAlign: "center" }}
      >
        {title}
      </p>
      {body ? (
        <p
          className="text-[14px] leading-[20px] text-[var(--color-ink-3)]"
          style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)", textAlign: "center" }}
        >
          {body}
        </p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          className="pressable flex items-center justify-center gap-2 border-none outline-none"
          onClick={onRetry}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            borderRadius: "var(--radius-button)",
            border: `1px solid var(--color-brand)`,
            background: "var(--color-brand)",
            color: "var(--color-ink-inverse)",
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 700,
            padding: "9px 16px",
          }}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

type SuccessStateProps = {
  title: string
  body?: string
  onClose?: () => void
}

export function SuccessState({ title, body, onClose }: SuccessStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 px-6"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingInline: 24 }}
    >
      <div
        className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center"
        style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", border: `1px solid var(--color-success-soft)`, background: "var(--color-success-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span style={{ fontSize: 26, lineHeight: 1, color: "var(--color-success)" }}>✔</span>
      </div>
      <p
        className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]"
        style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700, color: "var(--color-ink)", textAlign: "center" }}
      >
        {title}
      </p>
      {body ? (
        <p
          className="text-[14px] leading-[20px] text-[var(--color-ink-3)]"
          style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)", textAlign: "center" }}
        >
          {body}
        </p>
      ) : null}
      {onClose ? (
        <button
          type="button"
          className="pressable flex items-center justify-center border-none outline-none"
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            borderRadius: "var(--radius-button)",
            border: `1px solid var(--color-border)`,
            background: "transparent",
            color: "var(--color-ink-2)",
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 600,
            padding: "9px 16px",
          }}
        >
          Aceptar
        </button>
      ) : null}
    </div>
  )
}
