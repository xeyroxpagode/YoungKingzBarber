import { useEffect, useState } from "react"
import { CloseIcon } from "../../components/Icons"
import { SegmentedControl } from "../../components/SegmentedControl"
import { profesionalesActivos } from "../../state/agenda"

type FiltrosAgenda = {
  vista: "lista" | "grilla"
  periodo: "dia" | "semana"
  profesionales: string[]
  estados: string[]
  query: string
}

type FiltrosSheetAgendaProps = {
  open: boolean
  onClose: () => void
  filtros: FiltrosAgenda
  onAplicar: (f: Partial<FiltrosAgenda>) => void
}

export function FiltrosSheetAgenda({
  open,
  onClose,
  filtros,
  onAplicar,
}: FiltrosSheetAgendaProps) {
  const [borrador, setBorrador] = useState({ ...filtros })
  const profesionales = profesionalesActivos()
  const estados: { id: string; label: string }[] = [
    { id: "confirmado", label: "Confirmado" },
    { id: "en_atencion", label: "En atención" },
    { id: "finalizado", label: "Finalizado" },
    { id: "ausente", label: "Ausente" },
    { id: "cancelado", label: "Cancelado" },
  ]

  useEffect(() => {
    if (!open) return
    setBorrador({ ...filtros })
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, onClose])

  if (!open) return null

  const toggleTodos = (campo: "profesionales" | "estados") => {
    setBorrador((b) => ({ ...b, [campo]: [] }))
  }

  const toggleItem = (campo: "profesionales" | "estados", id: string) => {
    setBorrador((b) => {
      const actual = b[campo] as string[]
      const ya = actual.includes(id)
      const siguiente = ya ? actual.filter((x) => x !== id) : [...actual, id]
      if (siguiente.length === 0) return { ...b, [campo]: [] as unknown as string[] }
      return { ...b, [campo]: siguiente }
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(11,10,9,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Cerrar filtros" />
      <div
        style={{
          background: "var(--color-surface)",
          borderTop: `1px solid var(--color-border)`,
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          width: "100%",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          animation: "sheetIn var(--motion-structural) var(--motion-ease-out) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: `1px solid var(--color-border-subtle)`,
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
            Filtros de agenda
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              border: `1px solid var(--color-border-subtle)`,
              background: "var(--color-surface)",
              color: "var(--color-ink-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* VISTA */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-2)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Vista
              </p>
              <SegmentedControl
                options={[
                  { id: "lista", label: "Lista" },
                  { id: "grilla", label: "Grilla" },
                ]}
                value={borrador.vista}
                onChange={(v) =>
                  setBorrador((b) => ({ ...b, vista: v as "lista" | "grilla" }))
                }
                size="compact"
              />
            </div>

            {/* PERÍODO */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-2)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Período
              </p>
              <SegmentedControl
                options={[
                  { id: "dia", label: "Día" },
                  { id: "semana", label: "Semana" },
                ]}
                value={borrador.periodo}
                onChange={(v) =>
                  setBorrador((b) => ({ ...b, periodo: v as "dia" | "semana" }))
                }
                size="compact"
              />
            </div>

            {/* PROFESIONALES */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-2)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Profesionales
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-button)",
                    border: `1px solid ${
                      borrador.profesionales.length === 0
                        ? "var(--color-brand)"
                        : "var(--color-border-subtle)"
                    }`,
                    background: borrador.profesionales.length === 0
                      ? "var(--color-brand-soft)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleTodos("profesionales")}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${
                        borrador.profesionales.length === 0
                          ? "var(--color-brand)"
                          : "var(--color-ink-3)"
                      }`,
                      background: borrador.profesionales.length === 0
                        ? "var(--color-brand)"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {borrador.profesionales.length === 0 && (
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          background: "var(--color-ink-inverse)",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: borrador.profesionales.length === 0
                        ? "var(--color-brand)"
                        : "var(--color-ink)",
                    }}
                  >
                    Todos
                  </span>
                </label>
                {profesionales.map((p) => {
                  const sel = borrador.profesionales.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-button)",
                        border: `1px solid ${
                          sel ? "var(--color-brand)" : "var(--color-border-subtle)"
                        }`,
                        background: sel ? "var(--color-brand-soft)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleItem("profesionales", p.id)}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${
                            sel ? "var(--color-brand)" : "var(--color-ink-3)"
                          }`,
                          background: sel ? "var(--color-brand)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sel && (
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              background: "var(--color-ink-inverse)",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: sel ? "var(--color-brand)" : "var(--color-ink)",
                        }}
                      >
                        {p.nombre}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ESTADOS */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-2)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Estados
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-button)",
                    border: `1px solid ${
                      borrador.estados.length === 0
                        ? "var(--color-brand)"
                        : "var(--color-border-subtle)"
                    }`,
                    background: borrador.estados.length === 0
                      ? "var(--color-brand-soft)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleTodos("estados")}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${
                        borrador.estados.length === 0
                          ? "var(--color-brand)"
                          : "var(--color-ink-3)"
                      }`,
                      background: borrador.estados.length === 0
                        ? "var(--color-brand)"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {borrador.estados.length === 0 && (
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          background: "var(--color-ink-inverse)",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: borrador.estados.length === 0
                        ? "var(--color-brand)"
                        : "var(--color-ink)",
                    }}
                  >
                    Todos
                  </span>
                </label>
                {estados.map((e) => {
                  const sel = borrador.estados.includes(e.id)
                  return (
                    <label
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-button)",
                        border: `1px solid ${
                          sel ? "var(--color-brand)" : "var(--color-border-subtle)"
                        }`,
                        background: sel ? "var(--color-brand-soft)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleItem("estados", e.id)}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${
                            sel ? "var(--color-brand)" : "var(--color-ink-3)"
                          }`,
                          background: sel ? "var(--color-brand)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sel && (
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              background: "var(--color-ink-inverse)",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: sel ? "var(--color-brand)" : "var(--color-ink)",
                        }}
                      >
                        {e.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "16px 20px 24px",
            borderTop: `1px solid var(--color-border-subtle)`,
          }}
        >
          <button
            type="button"
            onClick={() => setBorrador({ ...filtros, vista: "lista", periodo: "dia", profesionales: [], estados: [], query: filtros.query })}
            style={{
              borderRadius: "var(--radius-button)",
              border: `1px solid var(--color-border)`,
              background: "transparent",
              color: "var(--color-ink-2)",
              fontSize: 14,
              fontWeight: 600,
              padding: "9px 16px",
            }}
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={() => {
              onAplicar(borrador)
              onClose()
            }}
            style={{
              borderRadius: "var(--radius-button)",
              border: `1px solid var(--color-brand)`,
              background: "var(--color-brand)",
              color: "var(--color-ink-inverse)",
              fontSize: 14,
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
