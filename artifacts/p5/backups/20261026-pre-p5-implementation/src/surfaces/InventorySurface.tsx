import { useState, useSyncExternalStore } from "react"
import {
  AlertTriangle,
  ArrowLeftRight,
  Box,
  Check,
  ChevronRight,
  ClipboardCheck,
  Filter,
  History,
  Image,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import { BottomSheet } from "../components/BottomSheet"
import { DetailHeader, RootHeader } from "../components/Headers"
import { SegmentedControl } from "../components/SegmentedControl"
import {
  articleById,
  available,
  belowMinimum,
  cancelOrder,
  clientName,
  committed,
  consume,
  correctMovement,
  createArticle,
  customerReturn,
  deactivateArticle,
  deliverOrder,
  deliverPendingSale,
  fitStock,
  inspect,
  inventoryStore,
  locationById,
  loss,
  money,
  orderById,
  orderTotal,
  paidForOrder,
  payOrder,
  physicalTotal,
  prepareOrder,
  quarantineStock,
  receive,
  recount,
  resolveShortage,
  returnToSupplier,
  setAllocation,
  stockRows,
  transfer,
  updateArticle,
  verifyInvariants,
  type Article,
  type Condition,
  type OperationResult,
  type Usage,
} from "../state/inventory"
import { listStaff } from "../state/staff"
import { todasLasAtenciones } from "../state/agenda"

type ScreenId = `I${number}`
type Props = { onDepthChange?: (deep: boolean) => void; onNavigateRoot?: (root: string) => void }
type ResultState = { result: OperationResult; title: string; detail: string }
const SCREEN_NAMES: Record<ScreenId, string> = {
  I1: "Inventario · Para venta",
  I2: "Inventario · Uso interno",
  I3: "Búsqueda",
  I4: "Filtros",
  I5: "Nuevo producto",
  I6: "Nuevo insumo",
  I7: "Coincidencias y artículo mixto",
  I8: "Detalle de producto",
  I9: "Detalle de insumo",
  I10: "Editar artículo",
  I11: "Disponibilidad pública",
  I12: "Imagen",
  I13: "Stock mínimo",
  I14: "Existencias por ubicación",
  I15: "Historial de movimientos",
  I16: "Detalle de movimiento",
  I17: "Registrar movimiento",
  I18: "Recibir mercadería",
  I19: "Recepción múltiple",
  I20: "Compra vinculada",
  I21: "Detalle de recepción",
  I22: "Registrar consumo",
  I23: "Seleccionar atención",
  I24: "Consumos por profesional",
  I25: "Trasladar",
  I26: "Recuento",
  I27: "Revisar diferencia",
  I28: "Pérdida o deterioro",
  I29: "Inspección de cuarentena",
  I30: "Destino de uso",
  I31: "Pedidos para retirar",
  I32: "Detalle de pedido",
  I33: "Preparar pedido",
  I34: "Listo para retirar",
  I35: "Cobro de pedido",
  I36: "Confirmar entrega",
  I37: "Cancelar pedido",
  I38: "Devolución de cliente",
  I39: "Devolución a proveedor",
  I40: "Entregar venta presencial",
  I41: "Operación comercial pendiente",
  I42: "Resolver faltante comprometido",
  I43: "Ubicación",
  I44: "Resultado de operación",
}
const opId = (kind: string) =>
  `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function InventorySurface({ onDepthChange, onNavigateRoot }: Props) {
  const state = useSyncExternalStore(
    inventoryStore.subscribe,
    inventoryStore.getSnapshot,
  )
  const [usage, setUsage] = useState<Usage>("sale")
  const [screen, setScreen] = useState<ScreenId | null>(null)
  const [articleId, setArticleId] = useState("ART-CERA")
  const [orderId, setOrderId] = useState("ORD-1042")
  const [locationId, setLocationId] = useState("LOC-DEP")
  const [movementId, setMovementId] = useState("MOV-001")
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [operationsOpen, setOperationsOpen] = useState(false)
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")
  const [result, setResult] = useState<ResultState | null>(null)
  const navigate = (
    next: ScreenId,
    context?: {
      articleId?: string
      orderId?: string
      locationId?: string
      movementId?: string
    },
  ) => {
    if (context?.articleId) setArticleId(context.articleId)
    if (context?.orderId) setOrderId(context.orderId)
    if (context?.locationId) setLocationId(context.locationId)
    if (context?.movementId) setMovementId(context.movementId)
    setScreen(next)
    onDepthChange?.(true)
    setOperationsOpen(false)
  }
  const goRoot = () => {
    setScreen(null)
    setResult(null)
    onDepthChange?.(false)
  }
  const showResult = (
    title: string,
    detail: string,
    operation: OperationResult,
  ) => {
    setResult({ title, detail, result: operation })
    setScreen("I44")
    onDepthChange?.(true)
  }
  if (screen)
    return (
      <DeepScreen
        screen={screen}
        state={state}
        articleId={articleId}
        orderId={orderId}
        locationId={locationId}
        movementId={movementId}
        result={result}
        navigate={navigate}
        back={goRoot}
        showResult={showResult}
        onNavigateRoot={onNavigateRoot}
      />
    )
  const items = state.articles
    .filter((a) => a.usages.includes(usage))
    .filter(
      (a) =>
        !query.trim() ||
        `${a.name} ${a.sku ?? ""} ${state.categories.find((c) => c.id === a.categoryId)?.name ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .filter(
      (a) =>
        stockFilter === "all" ||
        (stockFilter === "low"
          ? belowMinimum(a, usage)
          : available(a.id, usage) === 0),
    )
  const alertItems = items.filter(
    (a) => belowMinimum(a, usage) || available(a.id, usage) === 0,
  )
  const normalItems = items.filter((a) => !alertItems.includes(a))
  return (
    <div className="inventory-root" data-testid="inventory-root">
      <RootHeader title="Inventario" />
      <div className="inventory-segment">
        <SegmentedControl
          value={usage}
          onChange={(id) => setUsage(id as Usage)}
          options={[
            { id: "sale", label: "Para venta" },
            { id: "internal", label: "Uso interno" },
          ]}
        />
      </div>
      <div className="inventory-toolbar">
        {searching ? (
          <div className="inventory-search">
            <Search size={17} />
            <input
              autoFocus
              aria-label="Buscar inventario"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, SKU o categoría"
            />
            <button
              aria-label="Cancelar búsqueda"
              onClick={() => {
                setSearching(false)
                setQuery("")
              }}
            >
              <X size={17} />
            </button>
          </div>
        ) : (
          <button
            className="inventory-search-trigger"
            aria-label="Buscar"
            onClick={() => setSearching(true)}
          >
            <Search size={18} />
            <span>Buscar</span>
          </button>
        )}
        <button
          className={`inventory-icon-button ${
            stockFilter !== "all" ? "is-active" : ""
          }`}
          aria-label="Filtrar"
          onClick={() => setFilterOpen(true)}
        >
          <Filter size={19} />
        </button>
        <button
          className="inventory-icon-button inventory-icon-button--primary"
          aria-label={usage === "sale" ? "Nuevo producto" : "Nuevo insumo"}
          onClick={() => navigate(usage === "sale" ? "I5" : "I6")}
        >
          <Plus size={20} />
        </button>
      </div>
      <button className="inventory-callout-row" onClick={() => navigate("I31")}>
        <span className="inventory-glyph">
          <ShoppingBag size={19} />
        </span>
        <span>
          <strong>Pedidos para retirar</strong>
          <small>
            {
              state.orders.filter((o) =>
                ["received", "preparing", "ready", "incident"].includes(
                  o.status,
                ),
              ).length
            }{" "}
            pendientes · cobro separado
          </small>
        </span>
        <ChevronRight size={18} />
      </button>
      <div className="inventory-scroll scrollbar-none">
        {!items.length ? (
          <Empty
            title={query ? "Sin coincidencias" : "Sin artículos"}
            detail={
              query
                ? "Probá otra búsqueda o restablecé los filtros."
                : "Creá el primer artículo de este contexto."
            }
            action={
              query || stockFilter !== "all"
                ? () => {
                    setQuery("")
                    setStockFilter("all")
                  }
                : undefined
            }
          />
        ) : (
          <>
            {alertItems.length ? (
              <ArticleGroup
                title="Requieren atención"
                items={alertItems}
                usage={usage}
                open={(a) =>
                  navigate(usage === "sale" ? "I8" : "I9", { articleId: a.id })
                }
              />
            ) : null}
            {normalItems.length ? (
              <ArticleGroup
                title={
                  alertItems.length
                    ? "Otros artículos"
                    : usage === "sale"
                      ? "Productos"
                      : "Insumos"
                }
                items={normalItems}
                usage={usage}
                open={(a) =>
                  navigate(usage === "sale" ? "I8" : "I9", { articleId: a.id })
                }
              />
            ) : null}
            <button
              className="inventory-explore"
              onClick={() => setOperationsOpen(true)}
            >
              <MoreHorizontal size={18} /> Explorar operaciones y registros
            </button>
          </>
        )}
      </div>
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={stockFilter}
        onApply={(v) => {
          setStockFilter(v)
          setFilterOpen(false)
        }}
        usage={usage}
      />
      <OperationsSheet
        open={operationsOpen}
        onClose={() => setOperationsOpen(false)}
        navigate={navigate}
      />
    </div>
  )
}

function ArticleGroup({
  title,
  items,
  usage,
  open,
}: {
  title: string
  items: Article[]
  usage: Usage
  open: (a: Article) => void
}) {
  return (
    <section className="inventory-group">
      <div className="inventory-heading">
        <span>{title}</span>
        <small>{items.length}</small>
      </div>
      {items.map((a) => (
        <button key={a.id} className="inventory-item" onClick={() => open(a)}>
          <span className="inventory-thumb">
            <Box size={20} />
          </span>
          <span className="inventory-item-copy">
            <strong>{a.name}</strong>
            <small>
              {usage === "sale"
                ? `${
                    a.priceCents ? money(a.priceCents) : "Sin precio"
                  } · ${available(a.id, usage)} disponible`
                : `${available(a.id, usage)} ${a.unit} · ${
                    stockRows(a.id)
                      .map((x) => x.location.name)
                      .join(", ") || "Sin ubicación"
                  }`}
            </small>
            {!a.active ? (
              <em>Desactivado</em>
            ) : belowMinimum(a, usage) ? (
              <em>Stock bajo</em>
            ) : null}
          </span>
          <ChevronRight size={18} />
        </button>
      ))}
    </section>
  )
}
function FilterSheet({
  open,
  onClose,
  value,
  onApply,
  usage,
}: {
  open: boolean
  onClose: () => void
  value: "all" | "low" | "out"
  onApply: (v: "all" | "low" | "out") => void
  usage: Usage
}) {
  const [draft, setDraft] = useState(value)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Filtros · ${usage === "sale" ? "Para venta" : "Uso interno"}`}
    >
      <div className="inventory-sheet">
        <fieldset>
          <legend>Stock</legend>
          {[
            ["all", "Todos"],
            ["low", "Bajo mínimo"],
            ["out", "Agotado"],
          ].map(([id, label]) => (
            <label key={id}>
              <input
                type="radio"
                name="stock-filter"
                checked={draft === id}
                onChange={() => setDraft(id as typeof draft)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="inventory-field">
          <span>Categoría</span>
          <select aria-label="Categoría">
            <option>Todas las categorías</option>
            <option>Styling</option>
            <option>Cabello</option>
            <option>Barba</option>
            <option>Higiene</option>
          </select>
        </label>
        <label className="inventory-field">
          <span>Orden</span>
          <select aria-label="Orden">
            <option>Nombre A–Z</option>
            <option>Nombre Z–A</option>
            <option>Menor disponibilidad</option>
            <option>Mayor disponibilidad</option>
          </select>
        </label>
        <div className="inventory-actions">
          <button className="secondary" onClick={() => setDraft("all")}>
            Restablecer
          </button>
          <button className="primary" onClick={() => onApply(draft)}>
            Aplicar
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
function OperationsSheet({
  open,
  onClose,
  navigate,
}: {
  open: boolean
  onClose: () => void
  navigate: (id: ScreenId) => void
}) {
  const rows: [ScreenId, string, React.ReactNode][] = [
    ["I18", "Recibir mercadería", <PackageCheck />],
    ["I22", "Registrar consumo", <Trash2 />],
    ["I25", "Trasladar", <ArrowLeftRight />],
    ["I26", "Recuento", <ClipboardCheck />],
    ["I28", "Pérdida o deterioro", <AlertTriangle />],
    ["I29", "Inspección de cuarentena", <RotateCcw />],
    ["I30", "Cambiar destino de uso", <Box />],
  ]
  return (
    <BottomSheet open={open} onClose={onClose} title="Registrar movimiento">
      <div className="inventory-operation-list">
        {rows.map(([id, label, icon]) => (
          <button key={id} onClick={() => navigate(id)}>
            {icon}
            <span>{label}</span>
            <ChevronRight size={17} />
          </button>
        ))}
        <button onClick={() => navigate("I15")}>
          <History />
          <span>Historial de movimientos</span>
          <ChevronRight size={17} />
        </button>
      </div>
    </BottomSheet>
  )
}

type DeepProps = {
  screen: ScreenId
  state: ReturnType<typeof inventoryStore.getSnapshot>
  articleId: string
  orderId: string
  locationId: string
  movementId: string
  result: ResultState | null
  navigate: (
    id: ScreenId,
    c?: {
      articleId?: string
      orderId?: string
      locationId?: string
      movementId?: string
    },
  ) => void
  back: () => void
  showResult: (title: string, detail: string, result: OperationResult) => void
  onNavigateRoot?: (root: string) => void
}
function DeepScreen(p: DeepProps) {
  return (
    <div
      className="inventory-deep"
      data-testid={`surface-${p.screen}`}
      data-surface={p.screen}
    >
      <DetailHeader
        title={SCREEN_NAMES[p.screen]}
        subtitle={p.screen}
        onBack={p.back}
      />
      <div className="inventory-deep-scroll scrollbar-none">
        {p.screen === "I5" || p.screen === "I6" ? (
          <CreateArticleScreen
            usage={p.screen === "I5" ? "sale" : "internal"}
            state={p.state}
            onReview={() => p.navigate("I7")}
            done={(r, id) => {
              if (r.ok && id)
                p.navigate(p.screen === "I5" ? "I8" : "I9", { articleId: id })
              else
                p.showResult(
                  "No se pudo crear",
                  r.reason ?? "Revisá los datos",
                  r,
                )
            }}
          />
        ) : null}
        {p.screen === "I7" ? (
          <InfoScreen
            title="Una identidad, dos destinos"
            text="Los SKU exactos se bloquean. Si el artículo ya existe, habilitá el otro destino y conservá su stock e historial."
            actions={[
              {
                label: "Ver Shampoo profesional",
                run: () => p.navigate("I8", { articleId: "ART-SHAMPOO" }),
              },
              {
                label: "Administrar destinos",
                run: () => p.navigate("I30", { articleId: "ART-SHAMPOO" }),
              },
            ]}
          />
        ) : null}
        {p.screen === "I8" || p.screen === "I9" ? (
          <ArticleDetail {...p} />
        ) : null}
        {["I10", "I11", "I12", "I13"].includes(p.screen) ? (
          <ArticleEditor {...p} />
        ) : null}
        {p.screen === "I14" ? <LocationBalances {...p} /> : null}
        {p.screen === "I15" ? <MovementHistory {...p} /> : null}
        {p.screen === "I16" ? <MovementDetail {...p} /> : null}
        {p.screen === "I17" ? (
          <InfoScreen
            title="Operaciones disponibles"
            text="Elegí una operación compatible. Abrir una opción no modifica existencias."
            actions={[
              ["I18", "Recibir"],
              ["I22", "Consumir"],
              ["I25", "Trasladar"],
              ["I26", "Recontar"],
              ["I28", "Pérdida/deterioro"],
              ["I30", "Destino de uso"],
            ].map(([id, label]) => ({
              label,
              run: () => p.navigate(id as ScreenId),
            }))}
          />
        ) : null}
        {p.screen === "I18" || p.screen === "I19" ? (
          <ReceiveScreen {...p} multiple={p.screen === "I19"} />
        ) : null}
        {p.screen === "I20" ? <PurchaseScreen {...p} /> : null}
        {p.screen === "I21" ? <ReceiptDetail {...p} /> : null}
        {p.screen === "I22" ? <ConsumeScreen {...p} /> : null}
        {p.screen === "I23" ? <AttentionPicker {...p} /> : null}
        {p.screen === "I24" ? <ConsumptionByStaff {...p} /> : null}
        {p.screen === "I25" ? <TransferScreen {...p} /> : null}
        {p.screen === "I26" || p.screen === "I27" ? (
          <CountScreen {...p} review={p.screen === "I27"} />
        ) : null}
        {p.screen === "I28" ? <LossScreen {...p} /> : null}
        {p.screen === "I29" ? <InspectScreen {...p} /> : null}
        {p.screen === "I30" ? <AllocationScreen {...p} /> : null}
        {p.screen === "I31" ? <OrdersList {...p} /> : null}
        {p.screen === "I32" || p.screen === "I34" ? (
          <OrderDetail {...p} />
        ) : null}
        {p.screen === "I33" ? <PrepareScreen {...p} /> : null}
        {p.screen === "I35" ? <PaymentScreen {...p} /> : null}
        {p.screen === "I36" ? <DeliveryScreen {...p} /> : null}
        {p.screen === "I37" ? <CancelScreen {...p} /> : null}
        {p.screen === "I38" ? <ReturnScreen {...p} /> : null}
        {p.screen === "I39" ? <SupplierReturnScreen {...p} /> : null}
        {p.screen === "I40" || p.screen === "I41" ? (
          <InPersonSaleScreen {...p} />
        ) : null}
        {p.screen === "I42" ? <ShortageScreen {...p} /> : null}
        {p.screen === "I43" ? <LocationDetail {...p} /> : null}
        {p.screen === "I44" ? (
          <ResultScreen result={p.result} back={p.back} />
        ) : null}
      </div>
    </div>
  )
}

function ArticleDetail(p: DeepProps) {
  const a = articleById(p.articleId)!
  const isSale = p.screen === "I8"
  return (
    <>
      <div className="inventory-identity">
        <span className="inventory-hero-icon">
          <Box size={30} />
        </span>
        <h1>{a.name}</h1>
        <p>
          {p.state.categories.find((c) => c.id === a.categoryId)?.name} ·{" "}
          {a.sku ?? "Sin código"}
        </p>
        {!a.active ? (
          <Badge tone="danger">Desactivado</Badge>
        ) : a.published && isSale ? (
          <Badge tone="success">Publicado</Badge>
        ) : null}
      </div>
      <MetricGrid
        items={
          isSale
            ? [
                ["Precio", a.priceCents ? money(a.priceCents) : "—"],
                ["Físico apto", String(fitStock(a.id))],
                ["Comprometido", String(committed(a.id))],
                ["Disponible", String(available(a.id, "sale"))],
              ]
            : [
                ["Apto total", String(fitStock(a.id))],
                ["Mínimo", String(a.minimumInternal)],
                ["Cuarentena", String(quarantineStock(a.id))],
                [
                  "Consumos",
                  String(
                    p.state.consumptions
                      .filter((x) => x.articleId === a.id)
                      .reduce((n, x) => n + x.quantity, 0),
                  ),
                ],
              ]
        }
      />
      <Section title="Acciones">
        <NavRow
          icon={<MapPin />}
          label="Existencias por ubicación"
          hint="Saldos reconciliados"
          onClick={() => p.navigate("I14")}
        />
        {!isSale && (
          <NavRow
            icon={<UserRound />}
            label="Consumos por profesional"
            onClick={() => p.navigate("I24")}
          />
        )}
        <NavRow
          icon={<History />}
          label="Historial de movimientos"
          onClick={() => p.navigate("I15")}
        />
        <NavRow
          icon={<Plus />}
          label="Registrar movimiento"
          hint="Ingreso, consumo, traslado y más"
          onClick={() => p.navigate("I17")}
        />
      </Section>
      <Section title="Administrar">
        <NavRow
          icon={<Box />}
          label="Editar artículo"
          onClick={() => p.navigate("I10")}
        />
        {isSale && (
          <NavRow
            icon={<Check />}
            label="Disponibilidad pública"
            onClick={() => p.navigate("I11")}
          />
        )}
        <NavRow
          icon={<Image />}
          label="Imagen"
          onClick={() => p.navigate("I12")}
        />
        <NavRow
          icon={<AlertTriangle />}
          label="Stock mínimo"
          onClick={() => p.navigate("I13")}
        />
        <NavRow
          icon={<ArrowLeftRight />}
          label="Destinos de uso"
          onClick={() => p.navigate("I30")}
        />
      </Section>
      <button
        className="danger-action"
        onClick={() =>
          p.showResult(
            "Artículo desactivado",
            "Se conservan movimientos y relaciones.",
            deactivateArticle(a.id, opId("deactivate")),
          )
        }
      >
        Desactivar artículo
      </button>
    </>
  )
}
function CreateArticleScreen({
  usage,
  state,
  done,
  onReview,
}: {
  usage: Usage
  state: DeepProps["state"]
  done: (r: OperationResult, id?: string) => void
  onReview: () => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [sku, setSku] = useState("")
  const [unit, setUnit] = useState(usage === "sale" ? "unidad" : "envase")
  const [price, setPrice] = useState("")
  const [mixed, setMixed] = useState(false)
  const [error, setError] = useState("")
  const submit = () => {
    const r = createArticle(
      {
        name,
        sku,
        categoryId: category,
        unit,
        usages: mixed ? ["sale", "internal"] : [usage],
        priceCents:
          usage === "sale" || mixed
            ? Math.round(Number(price) * 100)
            : undefined,
      },
      opId("create"),
    )
    if (!r.ok) setError(r.reason ?? "Error")
    done(r, r.id)
  }
  return (
    <div className="inventory-form">
      <div className="image-placeholder">
        <Image />
        <span>Imagen opcional</span>
      </div>
      <Field label="Nombre" value={name} onChange={setName} />
      <Select
        label="Categoría"
        value={category}
        onChange={setCategory}
        options={[
          { id: "", label: "Elegir categoría" },
          ...state.categories.map((c) => ({ id: c.id, label: c.name })),
        ]}
      />
      <Field label="SKU o código (opcional)" value={sku} onChange={setSku} />
      <Select
        label="Unidad canónica"
        value={unit}
        onChange={setUnit}
        options={[
          { id: "unidad", label: "Unidad" },
          { id: "envase", label: "Envase" },
          { id: "ml", label: "Mililitros" },
        ]}
      />
      {usage === "sale" || mixed ? (
        <Field
          label="Precio de venta"
          type="number"
          value={price}
          onChange={setPrice}
        />
      ) : null}
      <label className="check-field">
        <input
          type="checkbox"
          checked={mixed}
          onChange={(e) => setMixed(e.target.checked)}
        />
        <span>
          También usar para {usage === "sale" ? "uso interno" : "venta"}
        </span>
      </label>
      <p className="form-note">
        Se crea con stock cero y sin publicación automática.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button className="primary wide" onClick={submit}>
        Crear {usage === "sale" ? "producto" : "insumo"}
      </button>
      <button className="link-action" onClick={onReview}>
        Revisar coincidencias
      </button>
    </div>
  )
}
function ArticleEditor(p: DeepProps) {
  const a = articleById(p.articleId)!
  const [name, setName] = useState(a.name)
  const [price, setPrice] = useState(String((a.priceCents ?? 0) / 100))
  const [published, setPublished] = useState(a.published)
  const [minimum, setMinimum] = useState(
    String(a.usages.includes("sale") ? a.minimumSale : a.minimumInternal),
  )
  const [preview, setPreview] = useState<string | undefined>(a.image)
  const save = () => {
    const changes =
      p.screen === "I10"
        ? { name, priceCents: Math.round(Number(price) * 100) }
        : p.screen === "I11"
          ? { published, priceCents: Math.round(Number(price) * 100) }
          : p.screen === "I13"
            ? {
                [a.usages.includes("sale") ? "minimumSale" : "minimumInternal"]:
                  Number(minimum),
              }
            : {}
    p.showResult(
      "Cambios guardados",
      "El stock físico y la historia no fueron reescritos.",
      updateArticle(a.id, changes, opId("article-update")),
    )
  }
  if (p.screen === "I12")
    return (
      <div className="inventory-form">
        <div className="image-preview">
          {preview ? (
            <img src={preview} alt="Vista previa" />
          ) : (
            <Image size={34} />
          )}
        </div>
        <label className="file-field">
          <span>Elegir imagen local</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && f.size <= 5_000_000) setPreview(URL.createObjectURL(f))
            }}
          />
        </label>
        <p className="form-note">
          Vista previa temporal en esta sesión. PNG, JPG o WebP, máximo 5 MB.
        </p>
        {preview && (
          <button
            className="secondary wide"
            onClick={() => setPreview(undefined)}
          >
            Quitar imagen
          </button>
        )}
        <button className="primary wide" onClick={save}>
          Guardar imagen
        </button>
      </div>
    )
  return (
    <div className="inventory-form">
      {p.screen === "I10" && (
        <>
          <Field label="Nombre" value={name} onChange={setName} />
          {a.usages.includes("sale") && (
            <Field
              label="Precio"
              type="number"
              value={price}
              onChange={setPrice}
            />
          )}
          <p className="form-note">
            Cambiar el nombre no crea otro artículo. Los precios históricos
            permanecen.
          </p>
        </>
      )}
      {p.screen === "I11" && (
        <>
          <label className="switch-field">
            <span>
              <strong>Publicado</strong>
              <small>{available(a.id, "sale")} disponibles para venta</small>
            </span>
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
          </label>
          <Field
            label="Precio"
            type="number"
            value={price}
            onChange={setPrice}
          />
          <p className="form-note">
            Publicar no crea stock ni cancela pedidos existentes.
          </p>
        </>
      )}
      {p.screen === "I13" && (
        <>
          <Field
            label="Stock mínimo"
            type="number"
            value={minimum}
            onChange={setMinimum}
          />
          <div className="callout">
            Cantidad relevante actual:{" "}
            {available(a.id, a.usages.includes("sale") ? "sale" : "internal")}{" "}
            {a.unit}. El mínimo no edita existencias.
          </div>
        </>
      )}
      <button className="primary wide" onClick={save}>
        Guardar cambios
      </button>
    </div>
  )
}
function LocationBalances(p: DeepProps) {
  const a = articleById(p.articleId)!
  return (
    <>
      <MetricGrid
        items={[
          ["Físico total", String(physicalTotal(a.id))],
          ["Apto", String(fitStock(a.id))],
          ["Cuarentena", String(quarantineStock(a.id))],
          ["Comprometido", String(committed(a.id))],
        ]}
      />
      <Section title="Ubicaciones">
        {stockRows(a.id).map((r) => (
          <NavRow
            key={r.location.id}
            icon={<MapPin />}
            label={r.location.name}
            hint={`${r.fit} apto · ${r.quarantine} cuarentena · ${r.committed} comprometido`}
            onClick={() => p.navigate("I43", { locationId: r.location.id })}
          />
        ))}
      </Section>
    </>
  )
}
function MovementHistory(p: DeepProps) {
  const [q, setQ] = useState("")
  const rows = p.state.movements
    .filter((m) => m.articleId === p.articleId)
    .filter(
      (m) =>
        !q ||
        m.type.includes(q.toLowerCase()) ||
        m.reason.toLowerCase().includes(q.toLowerCase()),
    )
    .slice()
    .reverse()
  return (
    <>
      <div className="inventory-search standalone">
        <Search size={17} />
        <input
          aria-label="Buscar movimientos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tipo o motivo"
        />
      </div>
      <Section title="Historial confirmado">
        {rows.map((m) => (
          <NavRow
            key={m.id}
            icon={<History />}
            label={`${movementLabel(m.type)} · ${m.quantity}`}
            hint={`${m.id} · ${m.reason}`}
            onClick={() => p.navigate("I16", { movementId: m.id })}
          />
        ))}
      </Section>
    </>
  )
}
function MovementDetail(p: DeepProps) {
  const m =
    p.state.movements.find((x) => x.id === p.movementId) ?? p.state.movements[0]
  const a = articleById(m.articleId)!
  return (
    <>
    <div className="record-card">
      <Badge tone="success">Confirmado</Badge>
      <h2>{movementLabel(m.type)}</h2>
      <Data label="ID" value={m.id} />
      <Data label="Artículo" value={a.name} />
      <Data label="Cantidad" value={`${m.quantity} ${a.unit}`} />
      <Data
        label="Origen"
        value={
          m.fromLocationId ? (locationById(m.fromLocationId)?.name ?? "—") : "—"
        }
      />
      <Data
        label="Destino"
        value={
          m.toLocationId ? (locationById(m.toLocationId)?.name ?? "—") : "—"
        }
      />
      <Data label="Actor" value={m.actor} />
      <Data label="Motivo" value={m.reason} />
      <Data label="Operación" value={m.operationId} />
      <p className="form-note">
        Una operación confirmada no se reescribe. Las correcciones se registran
        como eventos vinculados.
      </p>
    </div>
    <button className="secondary wide" onClick={() => p.showResult("Corrección registrada", "El movimiento original permanece en el historial.", correctMovement(m.id, 1, "Corrección autorizada", opId("correction")))}>Registrar corrección vinculada</button>
    </>
  )
}
function ReceiveScreen(p: DeepProps & { multiple: boolean }) {
  const [article, setArticle] = useState(p.articleId)
  const [quantity, setQuantity] = useState("1")
  const [location, setLocation] = useState("LOC-DEP")
  const [condition, setCondition] = useState<Condition>("fit")
  const [document, setDocument] = useState("")
  const [lines, setLines] = useState<{
    articleId: string
    quantity: number
    locationId: string
    condition: Condition
  }[]>([])
  const current = {
    id: `RL-${lines.length + 1}`,
    articleId: article,
    quantity: Number(quantity),
    locationId: location,
    condition,
  }
  const confirm = () => {
    const all = p.multiple ? (lines.length ? lines : [current]) : [current]
    const r = receive(
      all,
      { supplierId: "SUP-1", document: document || undefined },
      opId("receipt"),
    )
    p.showResult(
      r.ok ? "Recepción confirmada" : "Recepción rechazada",
      r.ok
        ? `${all.length} línea(s) registradas atómicamente.`
        : (r.reason ?? "Error"),
      r,
    )
  }
  return (
    <div className="inventory-form">
      <Select
        label="Artículo"
        value={article}
        onChange={setArticle}
        options={p.state.articles.map((a) => ({ id: a.id, label: a.name }))}
      />
      <Field
        label="Cantidad"
        type="number"
        value={quantity}
        onChange={setQuantity}
      />
      <Select
        label="Ubicación"
        value={location}
        onChange={setLocation}
        options={p.state.locations.map((l) => ({ id: l.id, label: l.name }))}
      />
      <Select
        label="Condición"
        value={condition}
        onChange={(v) => setCondition(v as Condition)}
        options={[
          { id: "fit", label: "Apta" },
          { id: "quarantine", label: "En revisión" },
        ]}
      />
      <Field
        label="Documento (opcional)"
        value={document}
        onChange={setDocument}
      />
      {p.multiple && (
        <>
          <button
            className="secondary wide"
            onClick={() => setLines([...lines, current])}
          >
            Agregar línea
          </button>
          {lines.map((l, i) => (
            <div className="line-summary" key={i}>
              {articleById(l.articleId)?.name} · {l.quantity} ·{" "}
              {locationById(l.locationId)?.name}
            </div>
          ))}
        </>
      )}
      <p className="form-note">
        La recepción crea entrada física; no registra un pago.
      </p>
      <button className="primary wide" onClick={confirm}>
        Revisar y confirmar
      </button>
      {!p.multiple ? (
        <button className="secondary wide" onClick={() => p.navigate("I19")}>
          Recibir múltiples artículos
        </button>
      ) : null}
      <button className="link-action" onClick={() => p.navigate("I20")}>
        Vincular compra
      </button>
    </div>
  )
}
function PurchaseScreen(p: DeepProps) {
  const purchase = p.state.purchases[0]
  const obligation = p.state.obligations.find((x) => x.originId === purchase.id)
  return (
    <>
      <div className="option-card">
        <Receipt />
        <span>
          <strong>Sólo recepción física</strong>
          <small>No crea obligación económica.</small>
        </span>
      </div>
      <div className="option-card is-selected">
        <WalletCards />
        <span>
          <strong>Compra existente {purchase.document}</strong>
          <small>
            {money(purchase.totalCents)} ·{" "}
            {purchase.status === "pending" ? "Pago pendiente" : "Pagada"}
          </small>
        </span>
      </div>
      <div className="record-card">
        <Data label="Compra" value={purchase.id} />
        <Data label="Recepción vinculada" value="REC-901" />
        <Data label="Obligación" value={obligation?.id ?? "—"} />
        <Data
          label="Saldo"
          value={money(
            (obligation?.totalCents ?? 0) - (obligation?.paidCents ?? 0),
          )}
        />
      </div>
      <button className="primary wide" onClick={() => p.navigate("I21")}>
        Ver recepción vinculada
      </button>
      <button className="secondary wide" onClick={() => { window.history.replaceState(null, "", `?financeSurface=F38&returnRoot=inventario&financeOrigin=${encodeURIComponent(purchase.id)}`); p.onNavigateRoot?.("finanzas") }}>
        Continuar obligación en Finanzas
      </button>
    </>
  )
}
function ReceiptDetail(p: DeepProps) {
  const r = p.state.receipts[0]
  return (
    <>
    <div className="record-card">
      <Badge tone="success">Confirmada</Badge>
      <h2>{r.id}</h2>
      <Data label="Fecha" value="24 oct 2026 · 14:00" />
      <Data
        label="Proveedor"
        value={
          p.state.suppliers.find((x) => x.id === r.supplierId)?.name ??
          "Sin proveedor"
        }
      />
      <Data label="Documento" value={r.document ?? "—"} />
      {r.lines.map((l) => (
        <Data
          key={l.id}
          label={articleById(l.articleId)?.name ?? l.articleId}
          value={`${l.quantity} · ${locationById(l.locationId)?.name}`}
        />
      ))}
      <Data label="Compra vinculada" value={r.purchaseId ?? "Sin compra"} />
    </div>
    <button className="secondary wide" onClick={() => p.navigate("I39")}>Devolución a proveedor</button>
    </>
  )
}
function ConsumeScreen(p: DeepProps) {
  const [article, setArticle] = useState(
    p.articleId === "ART-CERA" ? "ART-HOJAS" : p.articleId,
  )
  const [quantity, setQuantity] = useState("1")
  const [location, setLocation] = useState("LOC-DEP")
  const [staff, setStaff] = useState("")
  const [attention, setAttention] = useState("")
  const [reason, setReason] = useState("Uso en servicio")
  const confirm = () => {
    const r = consume(
      {
        articleId: article,
        quantity: Number(quantity),
        locationId: location,
        staffId: staff || undefined,
        attentionId: attention || undefined,
        reason,
      },
      opId("consume"),
    )
    p.showResult(
      r.ok ? "Consumo registrado" : "Consumo rechazado",
      r.reason ?? "El movimiento quedó vinculado y no creó gasto.",
      r,
    )
  }
  return (
    <div className="inventory-form">
      <Select
        label="Artículo"
        value={article}
        onChange={setArticle}
        options={p.state.articles
          .filter((a) => a.usages.includes("internal"))
          .map((a) => ({ id: a.id, label: a.name }))}
      />
      <Field
        label="Cantidad"
        type="number"
        value={quantity}
        onChange={setQuantity}
      />
      <Select
        label="Origen"
        value={location}
        onChange={setLocation}
        options={stockRows(article).map((x) => ({
          id: x.location.id,
          label: `${x.location.name} · ${x.fit - x.committed} libres`,
        }))}
      />
      <Select
        label="Profesional (opcional)"
        value={staff}
        onChange={setStaff}
        options={[
          { id: "", label: "Consumo general" },
          ...listStaff().map((s) => ({ id: s.id, label: s.name })),
        ]}
      />
      <Select
        label="Atención (opcional)"
        value={attention}
        onChange={setAttention}
        options={[
          { id: "", label: "Sin atención" },
          ...todasLasAtenciones().map((a) => ({ id: a.id, label: a.id })),
        ]}
      />
      <Field label="Motivo" value={reason} onChange={setReason} />
      <button className="secondary wide" onClick={() => p.navigate("I23")}>
        Buscar atención existente
      </button>
      <button className="secondary wide" onClick={() => p.navigate("I24")}>
        Ver consumos por profesional
      </button>
      <button className="primary wide" onClick={confirm}>
        Revisar y confirmar consumo
      </button>
    </div>
  )
}
function AttentionPicker(p: DeepProps) {
  const attentions = todasLasAtenciones()
  return (
    <>
      <div className="inventory-search standalone">
        <Search size={17} />
        <input
          aria-label="Buscar atención"
          placeholder="Cliente o referencia"
        />
      </div>
      <Section title="Atenciones existentes">
        {attentions.length ? (
          attentions.map((a) => (
            <NavRow
              key={a.id}
              icon={<UserRound />}
              label={a.id}
              hint={`${a.profesionalId} · ${a.estado}`}
              onClick={() => p.navigate("I22")}
            />
          ))
        ) : (
          <Empty
            title="Sin atenciones compatibles"
            detail="Podés volver y registrar un consumo general."
          />
        )}
      </Section>
    </>
  )
}
function ConsumptionByStaff(p: DeepProps) {
  const staff = listStaff()
  return (
    <Section title="Período · octubre 2026">
      {staff.map((s) => {
        const total = p.state.consumptions
          .filter((c) => c.staffId === s.id)
          .reduce((n, c) => n + c.quantity, 0)
        return total ? (
          <NavRow
            key={s.id}
            icon={<UserRound />}
            label={s.name}
            hint={`${total} unidades · movimientos identificados`}
            onClick={() => p.navigate("I15")}
          />
        ) : null
      })}
      <NavRow
        icon={<Box />}
        label="Consumo general"
        hint={`${p.state.consumptions.filter((c) => !c.staffId).reduce((n, c) => n + c.quantity, 0)} unidades`}
        onClick={() => p.navigate("I15")}
      />
    </Section>
  )
}
function TransferScreen(p: DeepProps) {
  const [article, setArticle] = useState(
    p.articleId === "ART-CERA" ? "ART-HOJAS" : p.articleId,
  )
  const [from, setFrom] = useState("LOC-DEP")
  const [to, setTo] = useState("LOC-ALEX")
  const [quantity, setQuantity] = useState("1")
  const confirm = () => {
    const before = physicalTotal(article)
    const r = transfer(
      { articleId: article, quantity: Number(quantity), from, to },
      opId("transfer"),
    )
    p.showResult(
      r.ok ? "Traslado confirmado" : "Traslado rechazado",
      r.ok ? `Total global conservado en ${before}.` : (r.reason ?? "Error"),
      r,
    )
  }
  return (
    <div className="inventory-form">
      <Select
        label="Artículo"
        value={article}
        onChange={setArticle}
        options={p.state.articles.map((a) => ({ id: a.id, label: a.name }))}
      />
      <Select
        label="Origen"
        value={from}
        onChange={setFrom}
        options={p.state.locations.map((l) => ({
          id: l.id,
          label: `${l.name} · ${fitStock(article, l.id)} apto`,
        }))}
      />
      <Select
        label="Destino"
        value={to}
        onChange={setTo}
        options={p.state.locations.map((l) => ({ id: l.id, label: l.name }))}
      />
      <Field
        label="Cantidad"
        type="number"
        value={quantity}
        onChange={setQuantity}
      />
      <button className="primary wide" onClick={confirm}>
        Revisar y confirmar traslado
      </button>
    </div>
  )
}
function CountScreen(p: DeepProps & { review: boolean }) {
  const [counted, setCounted] = useState(
    String(fitStock(p.articleId, "LOC-DEP")),
  )
  const registered = fitStock(p.articleId, "LOC-DEP")
  const diff = Number(counted) - registered
  if (p.review)
    return (
      <>
        <MetricGrid
          items={[
            ["Registrado", String(registered)],
            ["Contado", counted],
            ["Diferencia", `${diff > 0 ? "+" : ""}${diff}`],
            [
              "Pedidos afectados",
              diff < 0 && registered + diff < committed(p.articleId, "LOC-DEP")
                ? "Sí"
                : "No",
            ],
          ]}
        />
        <div className="callout">
          Una diferencia positiva crea ajuste de ingreso; una negativa crea
          salida. Cero conserva el registro de recuento.
        </div>
        <button
          className="primary wide"
          onClick={() => {
            const r = recount(
              {
                articleId: p.articleId,
                locationId: "LOC-DEP",
                condition: "fit",
                counted: Number(counted),
                reason: "Recuento manual",
              },
              opId("count"),
            )
            p.showResult(
              r.ok ? "Recuento confirmado" : "Recuento en conflicto",
              r.reason ?? `Diferencia ${diff} registrada.`,
              r,
            )
          }}
        >
          Confirmar diferencia
        </button>
      </>
    )
  return (
    <div className="inventory-form">
      <Select
        label="Artículo"
        value={p.articleId}
        onChange={(v) => p.navigate("I26", { articleId: v })}
        options={p.state.articles.map((a) => ({ id: a.id, label: a.name }))}
      />
      <Select
        label="Ubicación"
        value="LOC-DEP"
        onChange={() => {}}
        options={[
          { id: "LOC-DEP", label: `Depósito · registrado ${registered}` },
        ]}
      />
      <Field
        label="Cantidad contada"
        type="number"
        value={counted}
        onChange={setCounted}
      />
      <button className="primary wide" onClick={() => p.navigate("I27")}>
        Revisar diferencia
      </button>
    </div>
  )
}
function LossScreen(p: DeepProps) {
  const [quantity, setQuantity] = useState("1")
  const [destination, setDestination] = useState<"quarantine" | "discard">(
    "quarantine",
  )
  return (
    <div className="inventory-form">
      <Select
        label="Artículo"
        value={p.articleId}
        onChange={(v) => p.navigate("I28", { articleId: v })}
        options={p.state.articles.map((a) => ({ id: a.id, label: a.name }))}
      />
      <Field
        label="Cantidad"
        type="number"
        value={quantity}
        onChange={setQuantity}
      />
      <Select
        label="Destino"
        value={destination}
        onChange={(v) => setDestination(v as typeof destination)}
        options={[
          { id: "quarantine", label: "Cuarentena" },
          { id: "discard", label: "Descarte definitivo" },
        ]}
      />
      <div className="callout">
        Cuarentena conserva el físico total. Descartar lo reduce.
      </div>
      <button
        className="primary wide"
        onClick={() => {
          const r = loss(
            {
              articleId: p.articleId,
              locationId: "LOC-DEP",
              quantity: Number(quantity),
              destination,
              reason: "Deterioro informado",
            },
            opId("loss"),
          )
          p.showResult(
            r.ok ? "Movimiento registrado" : "Operación rechazada",
            r.reason ?? "Historial actualizado.",
            r,
          )
        }}
      >
        Confirmar
      </button>
    </div>
  )
}
function InspectScreen(p: DeepProps) {
  const article = quarantineStock(p.articleId) > 0 ? p.articleId : "ART-CERA"
  const [quantity, setQuantity] = useState("1")
  const [decision, setDecision] = useState<"recover" | "discard" | "keep">(
    "recover",
  )
  return (
    <div className="inventory-form">
      <div className="callout">
        {articleById(article)?.name}: {quarantineStock(article, "LOC-DEP")} en
        revisión.
      </div>
      <Field
        label="Cantidad a resolver"
        type="number"
        value={quantity}
        onChange={setQuantity}
      />
      <Select
        label="Decisión"
        value={decision}
        onChange={(v) => setDecision(v as typeof decision)}
        options={[
          { id: "recover", label: "Recuperar apto" },
          { id: "discard", label: "Descartar" },
          { id: "keep", label: "Mantener en revisión" },
        ]}
      />
      <button
        className="primary wide"
        onClick={() => {
          const before = physicalTotal(article)
          const r = inspect(
            {
              articleId: article,
              locationId: "LOC-DEP",
              quantity: Number(quantity),
              decision,
            },
            opId("inspect"),
          )
          p.showResult(
            r.ok ? "Inspección registrada" : "Inspección rechazada",
            r.ok
              ? `Físico previo ${before}; recuperación no crea stock.`
              : (r.reason ?? "Error"),
            r,
          )
        }}
      >
        Confirmar inspección
      </button>
    </div>
  )
}
function AllocationScreen(p: DeepProps) {
  const a = articleById(p.articleId)!
  const [sale, setSale] = useState(
    String(
      a.usages.includes("sale")
        ? Math.min(
            fitStock(a.id),
            Math.max(
              committed(a.id),
              available(a.id, "sale") + committed(a.id),
            ),
          )
        : 0,
    ),
  )
  const [internal, setInternal] = useState(
    String(a.usages.includes("internal") ? available(a.id, "internal") : 0),
  )
  return (
    <div className="inventory-form">
      <h2>{a.name}</h2>
      <MetricGrid
        items={[
          ["Físico apto", String(fitStock(a.id))],
          ["Comprometido", String(committed(a.id))],
        ]}
      />
      <Field
        label="Asignado a venta"
        type="number"
        value={sale}
        onChange={setSale}
      />
      <Field
        label="Asignado a uso interno"
        type="number"
        value={internal}
        onChange={setInternal}
      />
      <p className="form-note">
        Cambiar asignaciones no produce una entrada física.
      </p>
      <button
        className="primary wide"
        onClick={() => {
          const r = setAllocation(
            a.id,
            Number(sale),
            Number(internal),
            opId("allocation"),
          )
          p.showResult(
            r.ok ? "Destino actualizado" : "Asignación rechazada",
            r.reason ?? "Se conserva una sola identidad.",
            r,
          )
        }}
      >
        Guardar destinos
      </button>
    </div>
  )
}
function OrdersList(p: DeepProps) {
  const groups: [string, string[]][] = [
    ["Requieren preparación", ["received", "preparing", "incident"]],
    ["Listos para retirar", ["ready"]],
    ["Historial", ["delivered", "cancelled"]],
  ]
  return (
    <>
      <div className="inventory-search standalone">
        <Search size={17} />
        <input
          aria-label="Buscar pedido"
          placeholder="Número, cliente o producto"
        />
      </div>
      {groups.map(([label, statuses]) => (
        <Section key={label} title={label}>
          {p.state.orders
            .filter((o) => statuses.includes(o.status))
            .map((o) => (
              <NavRow
                key={o.id}
                icon={<ShoppingBag />}
                label={`${o.number} · ${clientName(o.clientId)}`}
                hint={`${o.lines.length} productos · ${orderStatus(o.status)}`}
                onClick={() => p.navigate("I32", { orderId: o.id })}
              />
            ))}
        </Section>
      ))}
      <Section title="Operaciones relacionadas">
        <NavRow icon={<RotateCcw />} label="Devolución de cliente" onClick={() => p.navigate("I38")} />
        <NavRow icon={<Receipt />} label="Devolución a proveedor" onClick={() => p.navigate("I39")} />
        <NavRow icon={<PackageCheck />} label="Venta presencial pendiente" onClick={() => p.navigate("I41")} />
      </Section>
    </>
  )
}
function OrderDetail(p: DeepProps) {
  const o = orderById(p.orderId)!
  const paid = paidForOrder(o.id)
  const action =
    o.status === "received" || o.status === "preparing"
      ? { label: "Preparar pedido", id: "I33" as ScreenId }
      : o.status === "ready"
        ? { label: "Registrar retiro", id: "I34" as ScreenId }
        : o.status === "incident"
          ? { label: "Resolver faltante", id: "I42" as ScreenId }
          : null
  return (
    <>
      <div className="record-card">
        <Badge
          tone={
            o.status === "incident"
              ? "danger"
              : o.status === "ready"
                ? "success"
                : "neutral"
          }
        >
          {orderStatus(o.status)}
        </Badge>
        <h2>
          {o.number} · {clientName(o.clientId)}
        </h2>
        {o.lines.map((l) => (
          <Data
            key={l.id}
            label={`${l.quantity} × ${articleById(l.articleId)?.name}`}
            value={money(l.quantity * l.unitPriceCents)}
          />
        ))}
        <Data label="Total" value={money(orderTotal(o))} />
        <Data label="Cobrado" value={money(paid)} />
        <Data label="Saldo" value={money(orderTotal(o) - paid)} />
        <Data
          label="Preparación"
          value={
            o.preparedLocationId
              ? (locationById(o.preparedLocationId)?.name ?? "—")
              : "Pendiente"
          }
        />
      </div>
      {action && (
        <button className="primary wide" onClick={() => p.navigate(action.id)}>
          {action.label}
        </button>
      )}
      {o.status === "ready" && (
        <button
          className="secondary wide"
          onClick={() => p.navigate(paid === orderTotal(o) ? "I36" : "I35")}
        >
          {paid === orderTotal(o) ? "Confirmar entrega" : "Registrar cobro"}
        </button>
      )}
      {!["delivered", "cancelled"].includes(o.status) && (
        <button className="danger-action" onClick={() => p.navigate("I37")}>
          Cancelar pedido
        </button>
      )}
    </>
  )
}
function PrepareScreen(p: DeepProps) {
  const o = orderById(p.orderId)!
  return (
    <>
      <div className="callout">
        Preparar conserva los compromisos y no descuenta físico.
      </div>
      <Section title="Comprobación física">
        {o.lines.map((l) => (
          <div className="check-line" key={l.id}>
            <Check />
            <span>
              <strong>{articleById(l.articleId)?.name}</strong>
              <small>
                {l.quantity} requeridas · {committed(l.articleId)} comprometidas
                · {fitStock(l.articleId)} aptas
              </small>
            </span>
          </div>
        ))}
      </Section>
      <button
        className="primary wide"
        onClick={() => {
          const r = prepareOrder(o.id, opId("prepare"))
          p.showResult(
            r.ok ? "Pedido listo" : "Faltante detectado",
            r.reason ?? "Material comprobado; físico sin cambios.",
            r,
          )
        }}
      >
        Confirmar preparación
      </button>
      <button className="secondary wide" onClick={() => p.navigate("I42")}>
        Resolver faltante
      </button>
    </>
  )
}
function PaymentScreen(p: DeepProps) {
  const o = orderById(p.orderId)!
  const due = orderTotal(o) - paidForOrder(o.id)
  const [amount, setAmount] = useState(String(due / 100))
  const [method, setMethod] = useState<"cash" | "transfer">("transfer")
  return (
    <div className="inventory-form">
      <MetricGrid
        items={[
          ["Total", money(orderTotal(o))],
          ["Cobrado", money(paidForOrder(o.id))],
          ["Saldo", money(due)],
        ]}
      />
      <Field
        label="Importe"
        type="number"
        value={amount}
        onChange={setAmount}
      />
      <Select
        label="Medio"
        value={method}
        onChange={(v) => setMethod(v as typeof method)}
        options={[
          { id: "transfer", label: "Transferencia" },
          { id: "cash", label: "Efectivo · Caja abierta" },
        ]}
      />
      <button
        className="primary wide"
        onClick={() => {
          const r = payOrder(
            o.id,
            Math.round(Number(amount) * 100),
            method,
            opId("payment"),
          )
          p.showResult(
            r.ok ? "Cobro registrado" : "Cobro rechazado",
            r.reason ??
              (method === "transfer"
                ? "No modificó efectivo."
                : "Vinculado a sesión de Caja."),
            r,
          )
        }}
      >
        Revisar y registrar cobro
      </button>
    </div>
  )
}
function DeliveryScreen(p: DeepProps) {
  const o = orderById(p.orderId)!
  return (
    <>
      <div className="record-card">
        <Badge tone="success">Revisión final</Badge>
        <h2>
          {o.number} · {clientName(o.clientId)}
        </h2>
        <Data
          label="Preparado"
          value={
            o.preparedLocationId
              ? (locationById(o.preparedLocationId)?.name ?? "—")
              : "No"
          }
        />
        <Data
          label="Cobro"
          value={`${money(paidForOrder(o.id))} de ${money(orderTotal(o))}`}
        />
        {o.lines.map((l) => (
          <Data
            key={l.id}
            label={articleById(l.articleId)?.name ?? "Artículo"}
            value={`${l.quantity} unidades`}
          />
        ))}
      </div>
      <button
        className="primary wide"
        onClick={() => {
          const r = deliverOrder(o.id, opId("delivery"))
          p.showResult(
            r.ok ? "Entrega confirmada" : "Entrega bloqueada",
            r.reason ?? "Físico y compromiso reducidos exactamente una vez.",
            r,
          )
        }}
      >
        Confirmar entrega
      </button>
    </>
  )
}
function CancelScreen(p: DeepProps) {
  const o = orderById(p.orderId)!
  const [reason, setReason] = useState("Cliente desistió")
  return (
    <div className="inventory-form">
      <div className="callout">
        Se liberarán{" "}
        {p.state.commitments
          .filter((c) => c.orderId === o.id && c.status === "active")
          .reduce((n, c) => n + c.quantity, 0)}{" "}
        unidades comprometidas. El físico se conserva.
      </div>
      <Field label="Motivo" value={reason} onChange={setReason} />
      <Data label="Cobros registrados" value={money(paidForOrder(o.id))} />
      <p className="form-note">
        Si hay cobros se crea una obligación de devolución; no se reembolsa
        automáticamente.
      </p>
      <button
        className="danger wide"
        onClick={() => {
          const r = cancelOrder(o.id, reason, opId("cancel"))
          p.showResult(
            r.ok ? "Pedido cancelado" : "Cancelación bloqueada",
            r.reason ?? "Historia conservada.",
            r,
          )
        }}
      >
        Confirmar cancelación
      </button>
    </div>
  )
}
function ReturnScreen(p: DeepProps) {
  const delivered =
    p.state.orders.find((o) => o.status === "delivered") ?? orderById(p.orderId)
  if (!delivered)
    return (
      <Empty
        title="Sin ventas entregadas"
        detail="Las devoluciones sólo parten de una entrega real."
      />
    )
  const line = delivered.lines[0]
  const [qty, setQty] = useState("1")
  const [condition, setCondition] = useState<Condition | "discarded">("fit")
  return (
    <div className="inventory-form">
      <div className="callout">
        Origen: {delivered.number} · {clientName(delivered.clientId)}
      </div>
      <Select
        label="Línea"
        value={line.articleId}
        onChange={() => {}}
        options={[
          {
            id: line.articleId,
            label: articleById(line.articleId)?.name ?? "Artículo",
          },
        ]}
      />
      <Field label="Cantidad" type="number" value={qty} onChange={setQty} />
      <Select
        label="Condición"
        value={condition}
        onChange={(v) => setCondition(v as typeof condition)}
        options={[
          { id: "fit", label: "Apta" },
          { id: "quarantine", label: "Dañada · cuarentena" },
          { id: "discarded", label: "Dañada · descarte" },
        ]}
      />
      <p className="form-note">El reembolso es una operación separada.</p>
      <button
        className="primary wide"
        onClick={() => {
          const r = customerReturn(
            {
              orderId: delivered.id,
              articleId: line.articleId,
              quantity: Number(qty),
              locationId: "LOC-DEP",
              condition,
            },
            opId("return"),
          )
          p.showResult(
            r.ok ? "Devolución registrada" : "Devolución rechazada",
            r.reason ?? "Precio histórico sin cambios.",
            r,
          )
        }}
      >
        Confirmar devolución
      </button>
    </div>
  )
}
function SupplierReturnScreen(p: DeepProps) {
  const [dispatched, setDispatched] = useState(false)
  return <div className="inventory-form"><div className="callout">Compra PUR-901 · Shampoo profesional · hasta 10 envases recibidos.</div><Field label="Cantidad" type="number" value="1" onChange={() => {}}/><label className="check-field"><input type="checkbox" checked={dispatched} onChange={(event) => setDispatched(event.target.checked)}/><span>Mercadería despachada físicamente</span></label><p className="form-note">Preparar la solicitud no descuenta físico. El crédito o reembolso queda separado.</p><button className="primary wide" onClick={() => { const r = returnToSupplier({ purchaseId: "PUR-901", articleId: "ART-SHAMPOO", quantity: 1, locationId: "LOC-DEP", dispatched }, opId("supplier-return")); p.showResult(r.ok ? "Devolución registrada" : "Devolución rechazada", r.reason ?? (dispatched ? "Despacho físico confirmado; crédito pendiente." : "Solicitud preparada sin salida física."), r) }}>Confirmar estado</button></div>
}
function InPersonSaleScreen(p: DeepProps) {
  const sale = p.state.sales.find((entry) => entry.status === "pending_delivery")
  if (p.screen === "I41") return sale ? <InfoScreen title="Ventas elegibles" text="Sólo operaciones comerciales existentes con productos pendientes." actions={[{ label: `Venta ${sale.id} · ${clientName(sale.clientId)}`, run: () => p.navigate("I40") }]}/> : <Empty title="Sin ventas pendientes" detail="No se crean ventas nuevas desde este selector."/>
  if (!sale) return <Empty title="Sin venta elegible" detail="La operación ya fue entregada o corregida."/>
  return <><div className="record-card"><Badge tone="success">Pagada · entrega pendiente</Badge><h2>{sale.id} · {clientName(sale.clientId)}</h2>{sale.lines.map((line) => <Data key={line.id} label={articleById(line.articleId)?.name ?? line.articleId} value={`${line.quantity} pendiente`}/>)}<Data label="Cobrado" value={money(sale.paidCents)}/><Data label="Origen" value="Depósito"/></div><button className="primary wide" onClick={() => { const r = deliverPendingSale(sale.id, "LOC-DEP", opId("sale-delivery")); p.showResult(r.ok ? "Entrega presencial registrada" : "Entrega bloqueada", r.reason ?? "Venta y pago originales conservados.", r) }}>Confirmar entrega pendiente</button></>
}
function ShortageScreen(p: DeepProps) {
  const a = articleById(p.articleId)!
  const missing = Math.max(0, committed(a.id) - fitStock(a.id))
  const [strategy, setStrategy] = useState<"reassign" | "pending" | "adjust">("reassign")
  return (
    <>
      <MetricGrid
        items={[
          ["Artículo", a.name],
          ["Físico apto", String(fitStock(a.id))],
          ["Comprometido", String(committed(a.id))],
          ["Faltante", String(missing)],
        ]}
      />
      <Section title="Resolución">
        <button className={`option-card ${strategy === "reassign" ? "is-selected" : ""}`} onClick={() => setStrategy("reassign")}>
          <ArrowLeftRight />
          <span>
            <strong>Reasignar unidades aptas</strong>
            <small>Mueve unidades reales de otra ubicación.</small>
          </span>
        </button>
        <button className={`option-card ${strategy === "pending" ? "is-selected" : ""}`} onClick={() => setStrategy("pending")}>
          <AlertTriangle />
          <span>
            <strong>Pendiente de reposición</strong>
            <small>
              Deja demanda explícita, sin compromiso físico ficticio.
            </small>
          </span>
        </button>
        <button className={`option-card ${strategy === "adjust" ? "is-selected" : ""}`} onClick={() => setStrategy("adjust")}>
          <Receipt />
          <span>
            <strong>Revisar ajuste del pedido</strong>
            <small>Exige motivo y consecuencia comercial.</small>
          </span>
        </button>
      </Section>
      <button className="primary wide" onClick={() => { const r = resolveShortage(p.orderId, a.id, strategy, opId("shortage")); p.showResult(r.ok ? "Resolución aplicada" : "Resolución bloqueada", r.reason ?? "El conjunto fue revalidado y aplicado de forma atómica.", r) }}>
        Confirmar resolución global
      </button>
      <p className="form-note">
        No se aplican cambios parciales durante la navegación.
      </p>
    </>
  )
}
function LocationDetail(p: DeepProps) {
  const l = locationById(p.locationId)!
  const rows = p.state.articles
    .map((a) => ({
      a,
      fit: fitStock(a.id, l.id),
      q: quarantineStock(a.id, l.id),
    }))
    .filter((x) => x.fit || x.q)
  return (
    <>
      <div className="inventory-identity">
        <span className="inventory-hero-icon">
          <MapPin size={28} />
        </span>
        <h1>{l.name}</h1>
        <p>
          {l.kind === "kit"
            ? `Responsable: ${listStaff().find((s) => s.id === l.staffId)?.name ?? "Sin asignar"}`
            : "Ubicación general"}{" "}
          · {l.active ? "Activa" : "Inactiva"}
        </p>
      </div>
      <Section title="Artículos presentes">
        {rows.map(({ a, fit, q }) => (
          <NavRow
            key={a.id}
            icon={<Box />}
            label={a.name}
            hint={`${fit} apto · ${q} cuarentena`}
            onClick={() =>
              p.navigate(a.usages.includes("sale") ? "I8" : "I9", {
                articleId: a.id,
              })
            }
          />
        ))}
      </Section>
      <button className="secondary wide" onClick={() => p.navigate("I25")}>
        Trasladar
      </button>
      <button className="secondary wide" onClick={() => p.navigate("I26")}>
        Recontar artículo
      </button>
      <button className="secondary wide" onClick={() => p.navigate("I15")}>
        Ver movimientos
      </button>
      <p className="form-note">
        Una ubicación con stock o historial no se elimina físicamente.
      </p>
    </>
  )
}
function ResultScreen({
  result,
  back,
}: {
  result: ResultState | null
  back: () => void
}) {
  const errors = verifyInvariants()
  const ok = result?.result.ok ?? false
  return (
    <div className="result-screen">
      <span className={`result-icon ${ok ? "ok" : "bad"}`}>
        {ok ? <Check /> : <AlertTriangle />}
      </span>
      <h1>{result?.title ?? "Resultado"}</h1>
      <p>{result?.detail ?? "No hay una operación activa."}</p>
      {result?.result.duplicate && (
        <Badge tone="warning">Operación duplicada</Badge>
      )}
      {result?.result.id && <code>{result.result.id}</code>}
      <div className={`invariant-status ${errors.length ? "bad" : "ok"}`}>
        {errors.length
          ? `${errors.length} conflicto(s) de consistencia`
          : `Invariantes globales reconciliadas`}
      </div>
      <button className="primary wide" onClick={back}>
        Volver a Inventario
      </button>
    </div>
  )
}

function InfoScreen({
  title,
  text,
  actions,
}: {
  title: string
  text: string
  actions: { label: string; run: () => void }[]
}) {
  return (
    <>
      <div className="record-card">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {actions.map((a) => (
        <button key={a.label} className="secondary wide" onClick={a.run}>
          {a.label}
        </button>
      ))}
    </>
  )
}
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="deep-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
function NavRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button className="deep-nav-row" onClick={onClick}>
      <span>{icon}</span>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <ChevronRight size={17} />
    </button>
  )
}
function MetricGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="metric-grid">
      {items.map(([l, v]) => (
        <div key={l}>
          <span>{l}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  )
}
function Data({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
function Badge({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "success" | "danger" | "warning" | "neutral"
}) {
  return <span className={`inventory-badge ${tone}`}>{children}</span>
}
function Empty({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: () => void
}) {
  return (
    <div className="inventory-empty">
      <Box />
      <strong>{title}</strong>
      <p>{detail}</p>
      {action && <button onClick={action}>Restablecer</button>}
    </div>
  )
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="inventory-field">
      <span>{label}</span>
      <input
        aria-label={label}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <label className="inventory-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option value={o.id} key={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
function movementLabel(type: string) {
  return (
    ({
      opening: "Apertura",
      receipt: "Ingreso",
      consumption: "Consumo",
      delivery: "Entrega",
      transfer: "Traslado",
      count: "Recuento",
      quarantine: "Cuarentena",
      recovery: "Recuperación",
      discard: "Descarte",
      return: "Devolución",
      correction: "Corrección",
    } as Record<string, string>)[type] ?? type
  )
}
function orderStatus(s: string) {
  return (
    ({
      received: "Recibido",
      preparing: "En preparación",
      ready: "Listo para retirar",
      incident: "Con incidencia",
      delivered: "Entregado",
      cancelled: "Cancelado",
    } as Record<string, string>)[s] ?? s
  )
}
