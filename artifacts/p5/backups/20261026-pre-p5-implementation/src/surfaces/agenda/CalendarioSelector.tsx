import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CloseIcon } from "../../components/Icons"
import { demoTodayKey, demoTodayLabel, addDaysISO } from "../../state/agenda"

type CalendarioSelectorProps = {
  open: boolean
  onClose: () => void
  onSelect: (key: string) => void
  fechaKey: string
}

export function CalendarioSelector({
  open,
  onClose,
  onSelect,
  fechaKey,
}: CalendarioSelectorProps) {
  const [mesKey, setMesKey] = useState(fechaKey)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, onClose])

  if (!open) return null
  const hoyKey = demoTodayKey()
  const dias = generarDiasMes(mesKey)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(11,10,9,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Cerrar calendario" />
      <div
        style={{
          background: "var(--color-surface)",
          border: `1px solid var(--color-border)`,
          borderRadius: "var(--radius-xl)",
          padding: 20,
          width: 334,
          maxWidth: "90%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "sheetIn var(--motion-structural) var(--motion-ease-out) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={() => setMesKey(addDaysISO(mesKey, -30))}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border-subtle)`,
              background: "var(--color-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} strokeWidth={1.9} aria-hidden />
          </button>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
            {mesLabel(mesKey)}
          </p>
          <button
            type="button"
            onClick={() => setMesKey(addDaysISO(mesKey, 30))}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border-subtle)`,
              background: "var(--color-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={20} strokeWidth={1.9} aria-hidden />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            textAlign: "center",
          }}
        >
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div
              key={`${d}-${i}`}
              style={{ fontSize: 12, color: "var(--color-ink-4)", fontWeight: 600 }}
            >
              {d}
            </div>
          ))}
          {dias.map((dia) => {
            const key = diaKey(dia)
            const sel = key === fechaKey
            const isHoy = key === hoyKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelect(key)
                  onClose()
                }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${sel ? "var(--color-brand)" : "transparent"}`,
                  background: sel
                    ? "var(--color-brand)"
                    : isHoy
                    ? "var(--color-surface-selected)"
                    : "transparent",
                  color: sel
                    ? "var(--color-ink-inverse)"
                    : isHoy
                    ? "var(--color-brand)"
                    : "var(--color-ink)",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dia.getDate()}
              </button>
            )
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(hoyKey)
              onClose()
            }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-brand)",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            Hoy
          </button>
        </div>
      </div>
    </div>
  )
}

function mesLabel(iso: string): string {
  const d = new Date(iso)
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ]
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function diaKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function generarDiasMes(iso: string): Date[] {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay() + (first.getDay() === 0 ? -6 : 1))
  const days: Date[] = []
  let cur = new Date(start)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}
