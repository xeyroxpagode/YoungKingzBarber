import { useState, useRef, useEffect, useCallback, type ReactNode } from "react"
import { Search, X } from "lucide-react"

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  onSubmit?: (value: string) => void
  expandable?: boolean
}

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar",
  onClear,
  onSubmit,
  expandable = false,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleFocus = useCallback(() => {
    if (expandable) setExpanded(true)
    setFocused(true)
  }, [expandable])
  const handleBlur = useCallback(() => {
    if (expandable && value === "") setExpanded(false)
    setFocused(false)
  }, [expandable, value])

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  const handleClear = useCallback(() => {
    onChange("")
    onClear?.()
    if (inputRef.current) inputRef.current.focus()
  }, [onChange, onClear])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        onSubmit?.(value)
      }
    },
    [value, onSubmit],
  )

  return (
    <div
      className="relative shrink-0"
      style={{ position: "relative", flexShrink: 0 }}
    >
      {expandable && !expanded ? (
        <button
          type="button"
          className="pressable shrink-0 flex items-center justify-center"
          style={{ width: 40, height: 40, borderRadius: "var(--radius-full)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink-3)" }}
          onClick={() => setExpanded(true)}
          aria-label="Buscar"
        >
          <Search size={19} strokeWidth={1.9} aria-hidden />
        </button>
      ) : null}
      {(expandable ? expanded : true) && (
        <div
          className="flex items-center gap-2 shrink-0"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            borderRadius: "var(--radius-button)",
            border: `1px solid ${focused ? "var(--color-brand)" : "var(--color-border)"}`,
            background: focused ? "var(--color-surface-selected)" : "var(--color-surface)",
            minWidth: expanded ? 220 : undefined,
            transition: focused ? "none" : undefined,
          }}
        >
          <span
            className="shrink-0 text-[var(--color-ink-3)]"
            style={{ color: "var(--color-ink-3)", flexShrink: 0 }}
          >
            <Search size={18} strokeWidth={1.9} aria-hidden />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--color-ink)] placeholder-[var(--color-ink-4)]"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-ink)",
              fontSize: 14,
              lineHeight: "20px",
              fontWeight: 500,
              padding: "9px 4px",
              caretColor: "var(--color-brand)",
            }}
          />
          {value.length > 0 && onClear ? (
            <button
              type="button"
              className="pressable shrink-0 flex items-center justify-center"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              style={{ width: 28, height: 28, borderRadius: "var(--radius-full)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink-3)", padding: 0 }}
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
