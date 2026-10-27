import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RootHeader, SectionHeader, DetailHeader } from "../../components/Headers"
import { SegmentedControl } from "../../components/SegmentedControl"
import { SearchField } from "../../components/SearchField"
import { EmptyState } from "../../components/Feedback"
import { PrimaryAction, SecondaryAction } from "../../components/Actions"
import { ChevronRightIcon, FilterIcon, PlusIcon } from "../../components/Icons"
import {
  clientePorId,
  contadorResumen,
  estadoVisibleReserva,
  reservasDelDia,
  reservaPorId,
  servicioPorId,
  profesionalPorId,
  turnoEstadoLabel,
  demoTodayKey,
  demoTodayLabel,
  addDaysISO,
  type Reserva,
} from "../../state/agenda"
import { CalendarioSelector } from "./CalendarioSelector"
import { FiltrosSheetAgenda } from "./FiltrosSheetAgenda"
import { EstadoResultado } from "./EstadoResultado"
import { TurnoDetalleView } from "./TurnoDetalleView"
import { NuevoTurnoView } from "./NuevoTurnoView"
import { EditarTurnoView } from "./EditarReprogramarCancelar"
import { ReprogramarTurnoView } from "./EditarReprogramarCancelar"
import { CancelarTurnoView } from "./EditarReprogramarCancelar"
import { AusenciaTurnoView } from "./EditarReprogramarCancelar"
import { RegistrarAtencionView } from "./AtencionFlow"
import { AtencionPresencialView } from "./AtencionFlow"
import { CrearBloqueoView } from "./BloqueosFlow"
import { DetalleBloqueoView } from "./BloqueosFlow"
import { ResolverImpactoView } from "./BloqueosFlow"

type AgendaPage =
  | "lista"
  | "detalle"
  | "nuevo"
  | "servicio"
  | "profesional"
  | "disponibilidad"
  | "cliente"
  | "editar"
  | "reprogramar"
  | "cancelar"
  | "ausencia"
  | "atencion"
  | "presencial"
  | "bloqueo"
  | "detalle-bloqueo"
  | "impacto"
  | "resultado"

type FiltrosAgenda = {
  vista: "lista" | "grilla"
  periodo: "dia" | "semana"
  profesionales: string[]
  estados: string[]
  query: string
}

const FILTROS_DEFECTO: FiltrosAgenda = {
  vista: "lista",
  periodo: "dia",
  profesionales: [],
  estados: [],
  query: "",
}

export function AgendaSurface({
  onSelectPersonal,
  onDepthChange,
  onNavigateRoot,
}: {
  onSelectPersonal?: () => void
  onDepthChange?: (deep: boolean) => void
  onNavigateRoot?: (root: string) => void
} = {}) {
  const initialQuery = new URLSearchParams(window.location.search)
  const initialReservation = initialQuery.get("agendaReservation")
  const initialAction = initialQuery.get("agendaAction")
  const returnRoot = initialQuery.get("returnRoot")
  const initialIds = initialQuery.get("agendaIds")?.split(",").filter(Boolean) ?? []
  const initialStates = initialQuery.get("agendaStates")?.split(",").filter(Boolean) ?? []
  const initialParams: Record<string,string> = {}
  if(initialReservation)initialParams.id=initialReservation
  else { const clientId=initialQuery.get("clientId"); if(clientId)initialParams.clientId=clientId }
  const [pagina, setPaginaState] = useState<AgendaPage>(() => initialReservation ? "detalle" : initialAction === "new" ? "nuevo" : "lista")
  const [params, setParams] = useState<Record<string, string>>(initialParams)
  const [filtros, setFiltrosState] = useState<FiltrosAgenda>({ ...FILTROS_DEFECTO, estados: initialStates })
  const [fechaKey, setFechaKey] = useState(initialQuery.get("agendaDate") ?? initialQuery.get("businessDate") ?? demoTodayKey())
  const [calendarioAbierto, setCalendarioAbierto] = useState(false)
  const [filtroSheetAbierto, setFiltroSheetAbierto] = useState(false)
  const [resultado, setResultado] = useState<{
    tipo: "confirmado" | "validacion" | "conflicto" | "sin_permisos" | "lectura" | "incierto"
    titulo: string
    cuerpo?: string
    accion?: { label: string; onPress: () => void }
  } | null>(null)

  const isDeep = pagina !== "lista"
  useEffect(() => onDepthChange?.(isDeep), [isDeep, onDepthChange])
  useEffect(() => () => onDepthChange?.(false), [onDepthChange])

  const setPagina = (p: AgendaPage, p2: Record<string, string> = {}) => {
    setPaginaState(p)
    setParams(p2)
  }

  const setFiltros = (f: Partial<FiltrosAgenda>) =>
    setFiltrosState((s) => ({ ...s, ...f }))

  const limpiarResultado = () => setResultado(null)

  const reservasDia = useMemo(() => reservasDelDia(fechaKey), [fechaKey])

  const reservasFiltradas = useMemo(() => {
    let out = [...reservasDia]
    const q = filtros.query.toLowerCase()
    if (q) {
      out = out.filter((r) => {
        const c = clientePorId(r.clienteId)?.nombre.toLowerCase() ?? ""
        const p = profesionalPorId(r.profesionalId)?.nombre.toLowerCase() ?? ""
        const s = servicioPorId(r.servicioId)?.nombre.toLowerCase() ?? ""
        return c.includes(q) || p.includes(q) || s.includes(q)
      })
    }
    if (filtros.profesionales.length > 0) {
      out = out.filter((r) => filtros.profesionales.includes(r.profesionalId))
    }
    if (filtros.estados.length > 0) {
      out = out.filter((r) => filtros.estados.includes(estadoVisibleReserva(r)))
    }
    if (initialIds.length > 0) out = out.filter((r) => initialIds.includes(r.id))
    return out.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
  }, [reservasDia, filtros])

  const hayFiltroActivo =
    filtros.profesionales.length > 0 ||
    filtros.estados.length > 0 ||
    filtros.query.length > 0

  const { total, finalizadas, enAtencion, confirmadas, ausentes, canceladas } = contadorResumen()

  const esVacia = reservasFiltradas.length === 0
  const esSinResultados = hayFiltroActivo && esVacia

  const contenido = (() => {
    switch (pagina) {
      case "lista": return filtros.vista === "grilla" ? renderGrilla() : renderLista()
      case "detalle": return renderDetalle()
      case "nuevo": return renderNuevoTurno()
      case "servicio": return <NuevoTurnoView fechaKey={fechaKey} onVolver={() => setPagina("nuevo")} onConfirmado={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Turno creado", cuerpo: "La reserva se agregó a la agenda." }) }} />
      case "profesional": return <NuevoTurnoView fechaKey={fechaKey} onVolver={() => setPagina("nuevo")} onConfirmado={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Turno creado", cuerpo: "La reserva se agregó a la agenda." }) }} />
      case "disponibilidad": return <NuevoTurnoView fechaKey={fechaKey} onVolver={() => setPagina("nuevo")} onConfirmado={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Turno creado", cuerpo: "La reserva se agregó a la agenda." }) }} />
      case "cliente": return <NuevoTurnoView fechaKey={fechaKey} onVolver={() => setPagina("nuevo")} onConfirmado={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Turno creado", cuerpo: "La reserva se agregó a la agenda." }) }} />
      case "editar": return renderEditarTurno()
      case "reprogramar": return renderReprogramar()
      case "cancelar": return renderCancelar()
      case "ausencia": return renderAusencia()
      case "atencion": return renderAtencion()
      case "presencial": return renderPresencial()
      case "bloqueo": return <CrearBloqueoView onVolver={() => setPagina("lista")} onGuardar={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Bloqueo creado" }) }} />
      case "detalle-bloqueo": return <DetalleBloqueoView onVolver={() => setPagina("lista")} />
      case "impacto": return <ResolverImpactoView onVolver={() => setPagina("lista")} onConfirmar={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Impacto resuelto" }) }} />
      case "resultado": return renderResultadoPage()
      default: return renderLista()
    }
  })()

  if (resultado && pagina !== "resultado") {
    return (
      <section className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pb-10">
        <EstadoResultado
          tipo={resultado.tipo}
          titulo={resultado.titulo}
          cuerpo={resultado.cuerpo}
          accion={resultado.accion}
          onCerrar={limpiarResultado}
        />
      </section>
    )
  }

  return (
    <section className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pb-10">
      {contenido}
    </section>
  )

  /* ═════════════════════════════════════════════════════════════════
     A01 — AGENDA LISTA
     ═════════════════════════════════════════════════════════════════ */

  function renderLista() {
    return (
      <>
        <RootHeader
          title="Equipo"
          right={returnRoot ? (
            <button
              type="button"
              className="agenda-return-summary"
              onClick={() => {
                window.history.replaceState(null, "", window.location.pathname)
                onNavigateRoot?.(returnRoot)
              }}
            >
              Volver a Resumen
            </button>
          ) : undefined}
        />
        <SegmentedControl
          options={[
            { id: "agenda", label: "Agenda" },
            { id: "personal", label: "Personal" },
          ]}
          value="agenda"
          onChange={(id) => id === "personal" && onSelectPersonal?.()}
        />
        <div className="flex items-center justify-between px-0 py-3" style={{ paddingInline: 0, paddingTop: 12, paddingBottom: 12 }}>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Día anterior"
            onClick={() => setFechaKey(addDaysISO(`${fechaKey.split("T")[0]}T00:00:00-03:00`, -1))}
            style={{
              width: 44, height: 44, borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)",
              color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} strokeWidth={1.9} aria-hidden />
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Seleccionar fecha"
            onClick={() => setCalendarioAbierto(true)}
            style={{
              minWidth: 172, height: 44, borderRadius: "var(--radius-button)",
              border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)",
              color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <p className="text-[15px] leading-[21px] font-[700] text-[var(--color-ink)]" style={{ margin: 0 }}>
              {demoTodayLabel(fechaKey)}
            </p>
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Día siguiente"
            onClick={() => setFechaKey(addDaysISO(`${fechaKey.split("T")[0]}T00:00:00-03:00`, 1))}
            style={{
              width: 44, height: 44, borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)",
              color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={20} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 px-0 pb-3" style={{ display: "flex", alignItems: "center", gap: 8, paddingInline: 0, paddingBottom: 12 }}>
          {filtros.vista === "lista" ? (
            <SearchField
              placeholder="Buscar turno o cliente"
              value={filtros.query}
              onChange={(v) => setFiltros({ query: v })}
              expandable
              onClear={() => setFiltros({ query: "" })}
            />
          ) : null}
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Abrir filtros"
            onClick={() => setFiltroSheetAbierto(true)}
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-full)",
              border: `1px solid ${hayFiltroActivo ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
              background: hayFiltroActivo ? "var(--color-brand-soft)" : "var(--color-surface)",
              color: hayFiltroActivo ? "var(--color-brand)" : "var(--color-ink-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <FilterIcon />
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0 border-none outline-none"
            onClick={() => setPagina("nuevo")}
            aria-label="Nuevo turno"
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-full)",
              border: `1px solid var(--color-brand)`, background: "var(--color-brand)",
              color: "var(--color-ink-inverse)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PlusIcon />
          </button>
        </div>

        <SectionHeader
          label={fechaKey === demoTodayKey() ? "Hoy" : dateLabelHumano(fechaKey)}
          hint={`${reservasFiltradas.length} turno${reservasFiltradas.length !== 1 ? "s" : ""}`}
        />

        <div className="flex flex-col gap-1" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {esSinResultados ? (
            <EmptyState
              title="Sin resultados"
              body="No hay turnos que coincidan con los filtros seleccionados."
              action={{ label: "Limpiar filtros", onPress: () => setFiltros({ ...FILTROS_DEFECTO, vista: filtros.vista }) }}
            />
          ) : esVacia ? (
            <EmptyState title="Sin turnos" body="No hay turnos para este día." />
          ) : (
            reservasFiltradas.map((r) => renderFilaTurno(r))
          )}
        </div>

        <CalendarioSelector open={calendarioAbierto} onClose={() => setCalendarioAbierto(false)} onSelect={setFechaKey} fechaKey={fechaKey} />
        <FiltrosSheetAgenda open={filtroSheetAbierto} onClose={() => setFiltroSheetAbierto(false)} filtros={filtros} onAplicar={setFiltros} />
      </>
    )
  }

  function renderFilaTurno(r: Reserva) {
    const sv = servicioPorId(r.servicioId)
    const prof = profesionalPorId(r.profesionalId)
    const cli = clientePorId(r.clienteId)
    const ev = estadoVisibleReserva(r)
    const estadoLabel = turnoEstadoLabel(ev as any)

    return (
      <button
        type="button"
        className="pressable flex items-center justify-between w-full"
        key={r.id}
        onClick={() => setPagina("detalle", { id: r.id })}
        style={{
          width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: "var(--radius-md)", background: "transparent", color: "var(--color-ink)",
        }}
      >
        <div className="flex items-center gap-8 shrink-0" style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="shrink-0" style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--color-ink-2)", whiteSpace: "nowrap" }}>
            {timeLabel(r.inicio)}
          </span>
          <div className="flex-1 min-w-0" style={{ flex: 1, minWidth: 0 }}>
            <p className="text-[15px] leading-[21px] font-[600] text-[var(--color-ink)] truncate" style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600, color: "var(--color-ink)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {cli?.nombre ?? r.clienteId}
            </p>
            <p className="text-[13px] leading-[18px] text-[var(--color-ink-3)] truncate mt-0.5" style={{ fontSize: 13, lineHeight: "18px", color: "var(--color-ink-3)", marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {sv?.nombre ?? r.servicioId} · {prof?.nombre ?? r.profesionalId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: "9999px", padding: "2px 8px", background: estadoBg(ev) }}>
            <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: "9999px", background: estadoDot(ev), display: "block" }} />
            <span className="text-[11px] leading-[15px] font-[600]" style={{ fontSize: 11, lineHeight: "15px", fontWeight: 600, color: estadoText(ev) }}>
              {estadoLabel}
            </span>
          </span>
          <span className="shrink-0" style={{ width: 22, height: 22, borderRadius: "var(--radius-full)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <ChevronRightIcon />
          </span>
        </div>
      </button>
    )
  }

  /* ══════════════════════════════════════════════════════════════════
     A02 — AGENDA GRILLA
     ═════════════════════════════════════════════════════════════════ */

  function renderGrilla() {
    return (
      <>
        <RootHeader title="Equipo" />
        <SegmentedControl
          options={[
            { id: "agenda", label: "Agenda" },
            { id: "personal", label: "Personal" },
          ]}
          value="agenda"
          onChange={(id) => id === "personal" && onSelectPersonal?.()}
        />
        <div className="flex items-center justify-between px-0 py-3" style={{ paddingInline: 0, paddingTop: 12, paddingBottom: 12 }}>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Día anterior"
            onClick={() => setFechaKey(addDaysISO(`${fechaKey.split("T")[0]}T00:00:00-03:00`, -1))}
            style={{ width: 44, height: 44, borderRadius: "var(--radius-full)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={20} strokeWidth={1.9} aria-hidden />
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Seleccionar fecha"
            onClick={() => setCalendarioAbierto(true)}
            style={{ minWidth: 172, height: 44, borderRadius: "var(--radius-button)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <p className="text-[15px] leading-[21px] font-[700] text-[var(--color-ink)]" style={{ margin: 0 }}>{demoTodayLabel(fechaKey)}</p>
          </button>
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Día siguiente"
            onClick={() => setFechaKey(addDaysISO(`${fechaKey.split("T")[0]}T00:00:00-03:00`, 1))}
            style={{ width: 44, height: 44, borderRadius: "var(--radius-full)", border: `1px solid var(--color-border-subtle)`, background: "var(--color-surface)", color: "var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronRight size={20} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 px-0 pb-3" style={{ display: "flex", alignItems: "center", gap: 8, paddingInline: 0, paddingBottom: 12 }}>
          <SearchField placeholder="Buscar turno o cliente" value={filtros.query} onChange={(v) => setFiltros({ query: v })} expandable onClear={() => setFiltros({ query: "" })} />
          <button
            type="button"
            className="pressable flex items-center justify-center shrink-0"
            aria-label="Abrir filtros"
            onClick={() => setFiltroSheetAbierto(true)}
            style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-full)", border: `1px solid ${hayFiltroActivo ? "var(--color-brand)" : "var(--color-border-subtle)"}`, background: hayFiltroActivo ? "var(--color-brand-soft)" : "var(--color-surface)", color: hayFiltroActivo ? "var(--color-brand)" : "var(--color-ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FilterIcon />
          </button>
          <button type="button" className="pressable flex items-center justify-center shrink-0 border-none outline-none" onClick={() => setPagina("nuevo")} aria-label="Nuevo turno" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-full)", border: `1px solid var(--color-brand)`, background: "var(--color-brand)", color: "var(--color-ink-inverse)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PlusIcon />
          </button>
        </div>

        <SectionHeader label={fechaKey === demoTodayKey() ? "Hoy" : dateLabelHumano(fechaKey)} hint={`${reservasFiltradas.length} turno${reservasFiltradas.length !== 1 ? "s" : ""}`} />

        <div className="flex flex-col gap-1" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {reservasFiltradas.length === 0 ? (
            <EmptyState title="Sin turnos" body="No hay turnos para este día." />
          ) : (
            <div data-testid="agenda-grid" className="overflow-x-auto scrollbar-none" style={{ overflowX: "auto", width: "100%" }}>
              <div style={{ display: "grid", gridTemplateColumns: "52px repeat(3, minmax(132px, 1fr))", minWidth: 448, height: 40, alignItems: "center", borderBottom: "1px solid var(--color-border-subtle)", color: "var(--color-ink-2)", fontSize: 12, fontWeight: 700 }}>
                <span>Hora</span>
                <span>Alex Martínez</span>
                <span>Nicolás García</span>
                <span>Leo Fernández</span>
              </div>
              <div style={{ display: "flex", minWidth: 448, position: "relative", height: 600 }}>
                <div style={{ minWidth: 52 }} />
                {reservasFiltradas.map((r) => renderBloqueoGrilla(r))}
              </div>
            </div>
          )}
        </div>

        <CalendarioSelector open={calendarioAbierto} onClose={() => setCalendarioAbierto(false)} onSelect={setFechaKey} fechaKey={fechaKey} />
        <FiltrosSheetAgenda open={filtroSheetAbierto} onClose={() => setFiltroSheetAbierto(false)} filtros={filtros} onAplicar={setFiltros} />
      </>
    )
  }

  function renderBloqueoGrilla(r: Reserva) {
    const sv = servicioPorId(r.servicioId)
    const cli = clientePorId(r.clienteId)
    const ev = estadoVisibleReserva(r)
    const minutos = Math.round((new Date(r.fin).getTime() - new Date(r.inicio).getTime()) / 60000)
    const alto = Math.max(44, (minutos / 30) * 56)
    const minutosDesdeInicioDia = new Date(r.inicio).getHours() * 60 + new Date(r.inicio).getMinutes()
    const left = (minutosDesdeInicioDia / (12 * 60)) * 100
    const ancho = (minutos / (12 * 60)) * 100

    return (
      <button
        type="button"
        key={r.id}
        onClick={() => setPagina("detalle", { id: r.id })}
        style={{
          position: "absolute", left: `${left}%`, top: `${alto * 0.3}px`, width: `${Math.max(90, ancho * 100)}%`, height: `${alto}px`,
          borderRadius: "var(--radius-md)", border: `1px solid var(--color-border)`, background: estadoBg(ev),
          color: "var(--color-ink)", fontSize: 12, lineHeight: "16px", fontWeight: 700, padding: "6px 8px",
          overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center",
        }}
      >
        <div style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 700 }}>{cli?.nombre ?? r.clienteId}</div>
        <div style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: 11, marginTop: 2, opacity: 0.9, color: "var(--color-ink-3)" }}>{sv?.nombre ?? r.servicioId}</div>
      </button>
    )
  }

  /* ══════════════════════════════════════════════════════════════════
     Sub-páginas
     ═════════════════════════════════════════════════════════════════ */

  function renderDetalle() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="No se especificó un turno." />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="No se pudo cargar el turno." />
    return <TurnoDetalleView reserva={r} onVolver={() => setPagina("lista")} onEditar={() => setPagina("editar", { id: r.id })} onReprogramar={() => setPagina("reprogramar", { id: r.id })} onCancelar={() => setPagina("cancelar", { id: r.id })} onAusencia={() => setPagina("ausencia", { id: r.id })} onResultado={setResultado} />
  }

  function renderNuevoTurno() {
    return <NuevoTurnoView fechaKey={fechaKey} initialClientId={params.clientId} onVolver={() => setPagina("lista")} onConfirmado={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Turno creado", cuerpo: "La reserva se agregó a la agenda." }) }} />
  }

  function renderEditarTurno() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="" />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="" />
    return <EditarTurnoView reserva={r} onVolver={() => setPagina("detalle", { id: r.id })} onGuardar={() => { setPagina("detalle", { id: r.id }); setResultado({ tipo: "confirmado", titulo: "Turno actualizado" }) }} />
  }

  function renderReprogramar() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="" />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="" />
    return <ReprogramarTurnoView reserva={r} onVolver={() => setPagina("detalle", { id: r.id })} onConfirmar={() => { setPagina("detalle", { id: r.id }); setResultado({ tipo: "confirmado", titulo: "Turno reprogramado" }) }} />
  }

  function renderCancelar() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="" />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="" />
    return <CancelarTurnoView reserva={r} onVolver={() => setPagina("detalle", { id: r.id })} onConfirmar={() => { setPagina("detalle", { id: r.id }); setResultado({ tipo: "confirmado", titulo: "Turno cancelado" }) }} />
  }

  function renderAusencia() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="" />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="" />
    return <AusenciaTurnoView reserva={r} onVolver={() => setPagina("detalle", { id: r.id })} onConfirmar={() => { setPagina("detalle", { id: r.id }); setResultado({ tipo: "confirmado", titulo: "Inasistencia registrada" }) }} />
  }

  function renderAtencion() {
    const id = params.id
    if (!id) return <EmptyState title="Turno no encontrado" body="" />
    const r = reservaPorId(id)
    if (!r) return <EmptyState title="Turno no encontrado" body="" />
    return <RegistrarAtencionView reserva={r} onVolver={() => setPagina("detalle", { id: r.id })} onConfirmar={() => { setPagina("detalle", { id: r.id }); setResultado({ tipo: "confirmado", titulo: "Atención registrada" }) }} />
  }

  function renderPresencial() {
    return <AtencionPresencialView onVolver={() => setPagina("lista")} onConfirmar={() => { setPagina("lista"); setResultado({ tipo: "confirmado", titulo: "Atención presencial registrada" }) }} />
  }

  function renderResultadoPage() {
    if (!resultado) return <EmptyState title="Sin resultado" body="" />
    return <EstadoResultado tipo={resultado.tipo} titulo={resultado.titulo} cuerpo={resultado.cuerpo} accion={resultado.accion} onCerrar={limpiarResultado} />
  }

  /* ══════════════════════════════════════════════════════════════════
     Helpers
     ═════════════════════════════════════════════════════════════════ */

  function estadoBg(ev: string) {
    const b: Record<string, string> = {
      finalizado: "var(--color-success-soft)", en_atencion: "var(--color-warning-soft)",
      confirmado: "var(--color-info-soft)", ausente: "var(--color-danger-soft)", cancelado: "var(--color-danger-soft)",
    }
    return b[ev] ?? "var(--color-surface-muted)"
  }
  function estadoDot(ev: string) {
    const d: Record<string, string> = {
      finalizado: "var(--color-success)", en_atencion: "var(--color-warning)",
      confirmado: "var(--color-info)", ausente: "var(--color-danger)", cancelado: "var(--color-danger)",
    }
    return d[ev] ?? "var(--color-ink-3)"
  }
  function estadoText(ev: string) {
    const t: Record<string, string> = {
      finalizado: "var(--color-success)", en_atencion: "var(--color-warning)",
      confirmado: "var(--color-info)", ausente: "var(--color-danger)", cancelado: "var(--color-danger)",
    }
    return t[ev] ?? "var(--color-ink-3)"
  }
  function timeLabel(iso: string): string {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }
  function dateLabelHumano(iso: string): string {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} de ${months[d.getMonth()]}`
  }
}
