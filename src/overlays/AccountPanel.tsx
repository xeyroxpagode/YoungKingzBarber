import { useEffect } from "react"
import { DEMO_OWNER } from "../state/demo"

type AccountPanelProps = {
  onClose: () => void
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <section
      className="absolute inset-0 z-50 flex flex-col justify-start"
      aria-label="Cuenta"
    >
      <button
        type="button"
        className="absolute inset-0 scrim-in"
        style={{ background: "var(--color-scrim)" }}
        aria-label="Cerrar cuenta"
        onClick={onClose}
      />
      <div
        data-nav-panel
        className="relative bg-[var(--color-canvas-soft)] rounded-b-[24px] shadow-2xl overlay-layer-in"
        style={{ maxHeight: "75vh" }}
      >
        <div className="px-5 pt-5 pb-4 flex items-center gap-4 border-b border-[var(--color-border-subtle)]">
          <span
            className="flex items-center justify-center rounded-full font-[600] text-white shrink-0"
            style={{
              width: 52,
              height: 52,
              background: "var(--color-ink)",
              fontSize: 15,
            }}
          >
            {DEMO_OWNER.initials}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]">
              {DEMO_OWNER.name}
            </p>
            <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)]">
              {DEMO_OWNER.role}
            </p>
          </div>
          <button
            type="button"
            className="pressable w-11 h-11 flex items-center justify-center rounded-full"
            style={{ color: "var(--color-ink-3)" }}
            aria-label="Cerrar cuenta"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px] leading-[20px] text-[var(--color-ink-2)]">
            Cuenta de demostración independiente. P0 no conecta servicios ni
            datos externos.
          </p>
        </div>
      </div>
    </section>
  )
}
