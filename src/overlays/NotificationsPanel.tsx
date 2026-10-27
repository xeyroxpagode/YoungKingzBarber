import { useEffect, useState, useSyncExternalStore } from "react"
import { allAuditEvents, markAlertRead, moreStore } from "../state/more"

type NotificationsPanelProps = {
  onClose: () => void
}

type NotificationTab = "avisos" | "actividad"

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [tab, setTab] = useState<NotificationTab>("avisos")
  const state = useSyncExternalStore(moreStore.subscribe, moreStore.getSnapshot)
  const activity = allAuditEvents().slice(0, 12)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <section
      data-nav-panel
      className="absolute inset-0 z-50 flex flex-col bg-[var(--color-canvas-soft)] overlay-layer-in"
      aria-label="Avisos y actividad"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-subtle)]">
        <div>
          <p className="text-[17px] leading-[24px] font-[700] text-[var(--color-ink)]">
            Avisos y actividad
          </p>
          <p className="text-[12px] leading-[16px] text-[var(--color-ink-3)] mt-0.5">
            Contexto YoungKingZ · datos demo
          </p>
        </div>
        <button
          type="button"
          className="pressable w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: "var(--color-ink-3)" }}
          aria-label="Cerrar avisos y actividad"
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

      <div
        className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas-soft)]"
        role="tablist"
        aria-label="Contextos de la campana"
      >
        {(["avisos", "actividad"] as const).map((item) => {
          const selected = tab === item
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item)}
              className="flex-1 py-3 text-[14px] leading-[20px] font-[500] relative"
              style={{
                color: selected
                  ? "var(--color-brand-700)"
                  : "var(--color-ink-3)",
              }}
            >
              {item === "avisos" ? "Avisos" : "Actividad"}
              {item === "avisos" ? (
                <span className="ml-1.5 bg-[var(--color-danger)] text-white text-[9px] font-[700] px-1.5 py-0.5 rounded-full">
                  {state.alerts.filter((item) => !item.read && !item.resolved).length}
                </span>
              ) : null}
              {selected ? (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--color-brand-500)] rounded-full" />
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {tab === "avisos" ? (
          <div
            className="px-5 pt-4 flex flex-col gap-3"
            role="tabpanel"
            aria-label="Avisos"
          >
            {state.alerts.map((notice) => (
              <article
                key={notice.id}
                onClick={() => markAlertRead(notice.id)}
                className="w-full rounded-[14px] px-4 py-3 border"
                style={{
                  background:
                    notice.priority === "high"
                      ? "var(--color-warning-soft)"
                      : "var(--color-surface)",
                  borderColor:
                    notice.priority === "high"
                      ? "rgba(214,134,34,0.18)"
                      : "var(--color-border-subtle)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                    style={{
                      background:
                        notice.priority === "high"
                          ? "var(--color-warning-strong)"
                          : "var(--color-ink-4)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] leading-[21px] font-[600] text-[var(--color-ink)]">
                      {notice.title}
                    </p>
                    <p className="text-[13px] leading-[19px] text-[var(--color-ink-2)] mt-0.5">
                      {notice.detail}
                    </p>
                    <span className="text-[11px] leading-[15px] text-[var(--color-ink-3)] mt-1 inline-block">
                      {notice.domain} · {notice.read ? "Leído" : "Nuevo"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 pt-4" role="tabpanel" aria-label="Actividad">
            <div className="bg-white rounded-[16px] border border-[var(--color-border-subtle)] overflow-hidden">
              {activity.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-[11px] leading-[15px] tabular text-[var(--color-ink-3)]">
                        {event.at.slice(11, 16)}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] leading-[20px] text-[var(--color-ink-2)]">
                        {event.action}
                      </p>
                      <p className="text-[11px] leading-[15px] text-[var(--color-ink-3)]">
                        {event.domain} · {event.actor}
                      </p>
                    </div>
                  </div>
                  {index < activity.length - 1 ? (
                    <div className="h-px ml-[76px] bg-[var(--color-border-subtle)]" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
