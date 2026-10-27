import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
} from "lucide-react"
import { RootHeader } from "../components/Headers"
import { reservasDelDia, type Reserva } from "../state/agenda"
import { financeStore } from "../state/financeCore"
import { inventoryStore } from "../state/inventory"
import { moreStore } from "../state/more"
import {
  selectOwnerSummary,
  type AppointmentBreakdown,
  type OwnerAttentionIncident,
  type SummaryDestination,
  type SummaryPermissions,
  type SummarySourceOverrides,
} from "../state/ownerSummary"

let overviewScrollMemory = 0

function pesos(cents?: number) {
  if (cents === undefined) return "—"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })
    .format(cents / 100)
    .replace(/\u00a0/g, " ")
}

function scenarioConfig(
  finance: ReturnType<typeof financeStore.getSnapshot>,
  scenario: string | null,
): {
  finance: ReturnType<typeof financeStore.getSnapshot>
  sourceOverrides?: SummarySourceOverrides
  permissions?: SummaryPermissions
  emptyAppointments?: boolean
  emptyAttention?: boolean
  allFinished?: boolean
  attentionLimit?: number
} {
  if (scenario === "no-payments") {
    return {
      finance: {
        ...finance,
        movements: finance.movements.filter(
          (movement) =>
            !(
              movement.kind === "ingreso" &&
              movement.date.slice(0, 10) === "2026-10-24"
            ),
        ),
      },
    }
  }
  if (scenario === "mixed-payment") {
    const template = finance.movements.find((movement) => movement.kind === "ingreso")!
    return {
      finance: {
        ...finance,
        movements: [
          ...finance.movements,
          { ...template, id: "P6-MIX-CASH", operationId: "P6-MIX", medio: "efectivo", amountCents: 1_000_000 },
          { ...template, id: "P6-MIX-TRANSFER", operationId: "P6-MIX", medio: "transferencia", fundAccountId: "FUND-BANK", amountCents: 1_500_000 },
        ],
      },
    }
  }
  if (scenario === "no-appointments") return { finance, emptyAppointments: true }
  if (scenario === "no-incidents") return { finance, emptyAttention: true }
  if (scenario === "all-finished") return { finance, allFinished: true }
  if (scenario === "one-incident") return { finance, attentionLimit: 1 }
  if (scenario === "partial") {
    return { finance, sourceOverrides: { inventory: "unavailable" } }
  }
  if (scenario === "stale") {
    return { finance, sourceOverrides: { finance: "stale" } }
  }
  if (scenario === "restricted") {
    return {
      finance,
      permissions: {
        agenda: true,
        finance: false,
        inventory: false,
        more: true,
      },
    }
  }
  return { finance }
}

export function OverviewSurface({
  onNavigateRoot,
}: {
  onNavigateRoot?: (root: string) => void
}) {
  const finance = useSyncExternalStore(
    financeStore.subscribe,
    financeStore.getSnapshot,
  )
  const inventory = useSyncExternalStore(
    inventoryStore.subscribe,
    inventoryStore.getSnapshot,
  )
  const more = useSyncExternalStore(moreStore.subscribe, moreStore.getSnapshot)
  const scrollRef = useRef<HTMLElement>(null)
  const scenario = new URLSearchParams(window.location.search).get(
    "summaryScenario",
  )
  const config = useMemo(() => scenarioConfig(finance, scenario), [finance, scenario])
  const summary = useMemo(() => {
    const scenarioReservations: Reserva[] | undefined = config.emptyAppointments
      ? []
      : config.allFinished
        ? reservasDelDia("2026-10-24").map((reservation) => ({ ...reservation, estado: "finalizada" as const }))
        : undefined
    const projection = selectOwnerSummary({
      finance: config.finance,
      inventory,
      more,
      reservations: scenarioReservations,
      sourceOverrides: config.sourceOverrides,
      permissions: config.permissions,
    })
    if (config.emptyAttention) return { ...projection, attention: [] }
    if (config.attentionLimit !== undefined) return { ...projection, attention: projection.attention.slice(0, config.attentionLimit) }
    return projection
  }, [config, inventory, more])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = overviewScrollMemory
  }, [])

  const handoff = (destination: SummaryDestination) => {
    overviewScrollMemory = scrollRef.current?.scrollTop ?? 0
    const params = new URLSearchParams(destination.params)
    params.set("returnRoot", "resumen")
    params.set("businessDate", summary.businessDate)
    params.set("returnScroll", String(Math.round(overviewScrollMemory)))
    window.history.replaceState(null, "", `?${params.toString()}`)
    onNavigateRoot?.(destination.root)
  }

  const agendaHandoff = (state?: string) =>
    handoff({
      root: "equipo",
      params: {
        agendaDate: summary.businessDate,
        ...(state ? { agendaStates: state } : {}),
      },
      label: "Abrir Agenda",
    })

  const collectedAvailable = ["available", "partial", "stale"].includes(
    summary.collected.status,
  )
  const appointmentsAvailable = ["available", "partial", "stale"].includes(
    summary.appointments.status,
  )

  return (
    <section
      ref={scrollRef}
      className="owner-summary scrollbar-none"
      data-testid="owner-summary"
      data-summary-scenario={scenario ?? "normal"}
      onScroll={(event) => {
        overviewScrollMemory = event.currentTarget.scrollTop
      }}
    >
      <RootHeader title="Resumen" />

      <div className="owner-summary-context">
        <span>Hoy</span>
        <strong>Sábado 24 de octubre</strong>
        <small>Actualizado 14:00 · Buenos Aires</small>
      </div>

      <section className="owner-summary-block" aria-labelledby="collected-title">
        <div className="owner-summary-heading">
          <span className="owner-summary-icon" aria-hidden>
            <CircleDollarSign size={20} />
          </span>
          <div>
            <h2 id="collected-title">Cobrado hoy</h2>
            <p>Dinero propio confirmado en Finanzas</p>
          </div>
        </div>
        {collectedAvailable ? (
          <>
            <strong className="owner-summary-money" data-testid="collected-total">
              {pesos(summary.collected.amountCents)}
            </strong>
            <p className="owner-summary-support" data-testid="collected-count">
              {summary.collected.operationCount} cobro
              {summary.collected.operationCount === 1 ? "" : "s"} confirmado
              {summary.collected.operationCount === 1 ? "" : "s"}
              {summary.collected.status === "stale" ? " · Datos desactualizados" : ""}
            </p>
            <button
              type="button"
              className="owner-summary-link"
              onClick={() =>
                handoff({
                  root: "finanzas",
                  params: {
                    financeSurface: "F09",
                    period: "hoy",
                    movementKind: "ingreso",
                    ownership: "propia",
                  },
                  label: "Ver movimientos",
                })
              }
            >
              Ver movimientos <ChevronRight size={17} />
            </button>
          </>
        ) : (
          <SourceState
            status={summary.collected.status}
            restricted="El importe no está disponible con tus permisos."
            unavailable="Finanzas no está disponible. No se muestra un cero ficticio."
          />
        )}
      </section>

      <section className="owner-summary-block" aria-labelledby="appointments-title">
        <div className="owner-summary-heading">
          <span className="owner-summary-icon" aria-hidden>
            <CalendarDays size={20} />
          </span>
          <div>
            <h2 id="appointments-title">Turnos de hoy</h2>
            <p>Reservas únicas de la jornada</p>
          </div>
        </div>
        {appointmentsAvailable && summary.appointments.total === 0 ? (
          <div className="owner-summary-empty" data-testid="appointments-empty">
            <strong>Sin turnos para hoy</strong>
            <p>La Agenda sigue disponible para consultar o crear reservas.</p>
          </div>
        ) : appointmentsAvailable && summary.appointments.breakdown ? (
          <>
            <div className="owner-summary-progress-copy">
              <strong data-testid="appointments-progress">
                {summary.appointments.attended}/{summary.appointments.total}
              </strong>
              <span>atendidos</span>
            </div>
            <div
              className="owner-summary-progress"
              role="progressbar"
              aria-label={`${summary.appointments.attended} de ${summary.appointments.total} turnos atendidos`}
              aria-valuemin={0}
              aria-valuemax={summary.appointments.total}
              aria-valuenow={summary.appointments.attended}
            >
              <span
                style={{
                  width: `${Math.round(
                    ((summary.appointments.attended ?? 0) /
                      Math.max(summary.appointments.total ?? 0, 1)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <AppointmentBreakdownRows
              values={summary.appointments.breakdown}
              onSelect={agendaHandoff}
            />
            {summary.appointments.walkIns ? (
              <p className="owner-summary-note">
                {summary.appointments.walkIns} atención sin reserva registrada aparte
              </p>
            ) : null}
            {!summary.appointments.consistent ? (
              <p className="owner-summary-warning" role="alert">
                El desglose no coincide con el total. Revisá la fuente en Agenda.
              </p>
            ) : null}
            <button
              type="button"
              className="owner-summary-link"
              onClick={() => agendaHandoff()}
            >
              Abrir Agenda <ChevronRight size={17} />
            </button>
          </>
        ) : (
          <SourceState
            status={summary.appointments.status}
            restricted="La jornada no está disponible con tus permisos."
            unavailable="Agenda no está disponible. El total permanece sin confirmar."
          />
        )}
      </section>

      <section
        className="owner-summary-block owner-summary-attention"
        aria-labelledby="attention-title"
      >
        <div className="owner-summary-heading">
          <span className="owner-summary-icon" aria-hidden>
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id="attention-title">Requiere atención</h2>
            <p>Situaciones activas con un destino responsable</p>
          </div>
        </div>
        {Object.entries(summary.sources)
          .filter(([, status]) => status === "unavailable" || status === "partial")
          .map(([source, status]) => (
            <div className="owner-summary-source" role="status" key={source}>
              <AlertTriangle size={16} />
              <span>
                Fuente {source} {status === "unavailable" ? "no disponible" : "parcial"}
              </span>
            </div>
          ))}
        {summary.attention.length ? (
          <div className="owner-summary-incidents" data-testid="attention-list">
            {summary.attention.map((incident) => (
              <IncidentRow
                key={incident.id}
                incident={incident}
                onOpen={() => handoff(incident.destination)}
              />
            ))}
          </div>
        ) : (
          <div className="owner-summary-all-clear" data-testid="attention-empty">
            <CheckCircle2 size={22} aria-hidden />
            <div>
              <strong>Sin situaciones que requieran atención</strong>
              <p>Las fuentes disponibles no reportan causas activas.</p>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

function SourceState({
  status,
  restricted,
  unavailable,
}: {
  status: string
  restricted: string
  unavailable: string
}) {
  return (
    <div className="owner-summary-empty" role="status">
      <strong>{status === "restricted" ? "Información restringida" : "—"}</strong>
      <p>{status === "restricted" ? restricted : unavailable}</p>
    </div>
  )
}

const APPOINTMENT_ROWS: Array<{
  key: keyof AppointmentBreakdown
  label: string
  state: string
}> = [
  { key: "finalizados", label: "Finalizados", state: "finalizado" },
  { key: "enAtencion", label: "En atención", state: "en_atencion" },
  { key: "pendientes", label: "Pendientes", state: "confirmado" },
  { key: "ausentes", label: "Ausentes", state: "ausente" },
  { key: "cancelados", label: "Cancelados", state: "cancelado" },
]

function AppointmentBreakdownRows({
  values,
  onSelect,
}: {
  values: AppointmentBreakdown
  onSelect: (state: string) => void
}) {
  return (
    <div className="owner-summary-breakdown" data-testid="appointment-breakdown">
      {APPOINTMENT_ROWS.map((row) => (
        <button type="button" key={row.key} onClick={() => onSelect(row.state)}>
          <span>{row.label}</span>
          <strong>{values[row.key]}</strong>
          <ChevronRight size={16} aria-hidden />
        </button>
      ))}
    </div>
  )
}

function IncidentRow({
  incident,
  onOpen,
}: {
  incident: OwnerAttentionIncident
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className="owner-summary-incident"
      data-severity={incident.severity}
      data-cause={incident.causeKey}
      onClick={onOpen}
    >
      <span className="owner-summary-incident-mark" aria-hidden />
      <span className="owner-summary-incident-copy">
        <strong>{incident.title}</strong>
        <small>{incident.context}</small>
        <em>{incident.destination.label}</em>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
