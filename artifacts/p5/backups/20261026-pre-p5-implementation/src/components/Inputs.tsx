import { type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

type InputFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  disabled = false,
}: InputFieldProps) {
  return (
    <div
      className="flex flex-col gap-2"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <label
        htmlFor={id}
        className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-none outline-none text-[var(--color-ink)] placeholder-[var(--color-ink-4)]"
        style={{
          flex: 1,
          height: 52,
          borderRadius: "var(--radius-button)",
          border: `1px solid ${error ? "var(--color-danger)" : focusedBorder}`,
          background: disabled ? "var(--color-canvas-alt)" : "var(--color-surface)",
          color: "var(--color-ink)",
          fontSize: 15,
          lineHeight: "21px",
          fontWeight: 500,
          padding: "0 14px",
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {error ? (
        <p
          className="text-[11px] leading-[15px] text-[var(--color-danger)] font-[500]"
          style={{ fontSize: 11, lineHeight: "15px", color: "var(--color-danger)", fontWeight: 500 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

type SelectFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { id: string; label: string }[]
  placeholder?: string
  error?: string
  disabled?: boolean
}

let focusedBorder = "var(--color-border)"

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
}: SelectFieldProps) {
  const selected = options.find((o) => o.id === value)

  return (
    <div
      className="flex flex-col gap-2"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <label
        htmlFor={id}
        className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}
      >
        {label}
      </label>
      <div
        className="relative shrink-0"
        style={{ position: "relative", flexShrink: 0 }}
      >
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 border-none outline-none text-[var(--color-ink)]"
          style={{
            flex: 1,
            height: 52,
            borderRadius: "var(--radius-button)",
            border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
            background: disabled ? "var(--color-canvas-alt)" : "var(--color-surface)",
            color: "var(--color-ink)",
            fontSize: 15,
            lineHeight: "21px",
            fontWeight: 500,
            padding: "0 14px",
            appearance: "none",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} strokeWidth={1.9} aria-hidden />
        </span>
      </div>
      {error ? (
        <p
          className="text-[11px] leading-[15px] text-[var(--color-danger)] font-[500]"
          style={{ fontSize: 11, lineHeight: "15px", color: "var(--color-danger)", fontWeight: 500 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
