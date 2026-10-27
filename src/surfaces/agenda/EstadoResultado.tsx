import { CloseIcon } from "../../components/Icons"

type EstadoResultadoProps = {
  tipo: "confirmado" | "validacion" | "conflicto" | "sin_permisos" | "lectura" | "incierto"
  titulo: string
  cuerpo?: string
  accion?: { label: string; onPress: () => void }
  onCerrar: () => void
}

const TONO: Record<string, { border: string; bg: string; icon: string; color: string }> = {
  confirmado: { border: "var(--color-success)", bg: "var(--color-success-soft)", icon: "✔", color: "var(--color-success)" },
  validacion: { border: "var(--color-danger)", bg: "var(--color-danger-soft)", icon: "⚠", color: "var(--color-danger)" },
  conflicto: { border: "var(--color-warning)", bg: "var(--color-warning-soft)", icon: "⚠", color: "var(--color-warning)" },
  sin_permisos: { border: "var(--color-ink-3)", bg: "var(--color-surface-muted)", icon: "🔒", color: "var(--color-ink-3)" },
  lectura: { border: "var(--color-brand)", bg: "var(--color-brand-soft)", icon: "⟳", color: "var(--color-brand)" },
  incierto: { border: "var(--color-info)", bg: "var(--color-info-soft)", icon: "…", color: "var(--color-info)" },
}

export function EstadoResultado({
  tipo,
  titulo,
  cuerpo,
  accion,
  onCerrar,
}: EstadoResultadoProps) {
  const t = TONO[tipo]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(11,10,9,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button type="button" className="absolute inset-0" onClick={onCerrar} aria-label="Cerrar resultado" />
      <div
        style={{
          background: "var(--color-surface)",
          border: `1px solid ${t.border}`,
          borderRadius: "var(--radius-xl)",
          padding: 24,
          width: 300,
          maxWidth: "85%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          animation: "sheetIn var(--motion-structural) var(--motion-ease-out) both",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-lg)",
            border: `1px solid ${t.border}`,
            background: t.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 26, color: t.color }}>{t.icon}</span>
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>{titulo}</p>
        {cuerpo && (
          <p style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-ink-3)", margin: 0 }}>{cuerpo}</p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onCerrar}
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
            Cerrar
          </button>
          {accion && (
            <button
              type="button"
              onClick={accion.onPress}
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
              {accion.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
