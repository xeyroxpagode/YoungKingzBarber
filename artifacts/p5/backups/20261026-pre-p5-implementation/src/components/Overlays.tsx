import { useEffect, useCallback, useState } from "react"
import { SegmentedControl } from "./SegmentedControl"
import { InputField } from "./Inputs"
import { StatusIndicator } from "./Actions"

type FilterOption = { id: string; label: string }

type FilterSheetProps = {
  open: boolean
  onClose: () => void
  onApply: (filters: { query: string; status: string }) => void
  initialQuery?: string
  initialStatus?: string
  statusOptions?: FilterOption[]
}

export function FilterSheet({
  open,
  onClose,
  onApply,
  initialQuery = "",
  initialStatus = "todos",
  statusOptions = [
    { id: "todos", label: "Todos los estados" },
    { id: "pendiente", label: "Pendiente" },
    { id: "en_atencion", label: "En atención" },
    { id: "finalizado", label: "Finalizado" },
    { id: "cancelado", label: "Cancelado" },
  ],
}: FilterSheetProps) {
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const handleApply = useCallback(() => {
    onApply({ query, status })
  }, [onApply, query, status])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-60" style={{ display: "contents" }}>
      <button
        type="button"
        className="absolute inset-0 scrim-in"
        style={{ background: "var(--color-scrim)", zIndex: 1 }}
        aria-label="Cerrar filtros"
        onClick={onClose}
      />
      <div
        data-nav-panel
        className="absolute bottom-0 left-0 right-0 z-2 flex flex-col bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] border-t border-[var(--color-border)] shadow-3 sheet-panel"
        style={{
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          borderTop: `1px solid var(--color-border)`,
          background: "var(--color-surface)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-subtle)]" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: `1px solid var(--color-border-subtle)` }}>
          <p className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700 }}>
            Filtros
          </p>
          <button
            type="button"
            className="pressable w-10 h-10 flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, borderRadius: "9999px", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink-3)" }}
            aria-label="Cerrar filtros"
            onClick={onClose}
          >
            <span style={{ fontSize: 22, lineHeight: 1, display: "block", color: "var(--color-ink-3)" }}>✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6" style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
          <div className="flex flex-col gap-4">
            <InputField
              id="filtro-busqueda"
              label="Buscar por nombre"
              value={query}
              onChange={setQuery}
              placeholder="Nombre, servicio o barbero"
            />
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] leading-[18px] font-[600] text-[var(--color-ink-2)]"
                style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)" }}
              >
                Estado
              </label>
              <SegmentedControl
                options={statusOptions}
                value={status}
                onChange={setStatus}
                size="compact"
              />
            </div>
            <div
              className="pt-2"
              style={{ paddingTop: 8 }}
              aria-live="polite"
            >
              <StatusIndicator label={`Estado: ${status}`} tone="info" size="small" />
            </div>
          </div>
        </div>
        <div className="px-5 pt-4 pb-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "16px 20px 24px", borderTop: `1px solid var(--color-border-subtle)` }}>
          <button
            type="button"
            className="pressable flex items-center justify-center border-none outline-none"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            Cancelar
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center border-none outline-none"
            onClick={handleApply}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfirmationDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body?: string
  confirmLabel?: string
  destructive?: boolean
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirmar",
  destructive = false,
}: ConfirmationDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-60" style={{ display: "contents" }}>
      <button
        type="button"
        className="absolute inset-0 scrim-in"
        style={{ background: "var(--color-scrim)", zIndex: 1 }}
        aria-label="Cerrar confirmación"
        onClick={onClose}
      />
      <div
        data-nav-panel
        className="absolute top-[40%] left-0 right-0 z-2 flex flex-col bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-3 sheet-panel"
        style={{
          top: "40%",
          left: 0,
          right: 0,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-xl)",
          border: `1px solid var(--color-border)`,
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-3)",
          maxWidth: 320,
          marginInline: "auto",
        }}
      >
        <div className="px-6 pt-6 pb-4" style={{ padding: "24px 24px 16px" }}>
          <p
            className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]"
            style={{ fontSize: 17, lineHeight: "24px", fontWeight: 700, color: "var(--color-ink)" }}
          >
            {title}
          </p>
          {body ? (
            <p
              className="text-[14px] leading-[20px] text-[var(--color-ink-3)] mt-3"
              style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)", marginTop: 12 }}
            >
              {body}
            </p>
          ) : null}
        </div>
        <div className="px-6 pt-3 pb-6 flex items-center justify-end gap-3" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 24px 24px" }}>
          <button
            type="button"
            className="pressable flex items-center justify-center border-none outline-none"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            Cancelar
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center border-none outline-none"
            onClick={onConfirm}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-button)",
              border: `1px solid ${destructive ? "var(--color-danger)" : "var(--color-brand)"}`,
              background: destructive ? "var(--color-danger)" : "var(--color-brand)",
              color: "var(--color-ink-inverse)",
              fontSize: 14,
              lineHeight: "20px",
              fontWeight: 700,
              padding: "9px 16px",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
