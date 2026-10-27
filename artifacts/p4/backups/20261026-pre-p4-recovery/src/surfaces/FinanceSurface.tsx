import { useSyncExternalStore } from "react"
import { Receipt, WalletCards } from "lucide-react"
import { RootHeader } from "../components/Headers"
import { inventoryStore, money } from "../state/inventory"

export function FinanceSurface() {
  const inventory = useSyncExternalStore(inventoryStore.subscribe, inventoryStore.getSnapshot)
  const pending = inventory.obligations.filter((entry) => entry.status === "pending")
  return <div className="team-screen" data-testid="finance-root"><RootHeader title="Finanzas"/><div className="yk-hero"><span>Obligaciones compartidas</span><strong>{money(pending.reduce((sum, entry) => sum + entry.totalCents - entry.paidCents, 0))}</strong><small>{pending.length} pendientes · originadas sin duplicar pagos</small></div><h2 className="yk-section-title">Desde Inventario</h2>{pending.map((entry) => <div className="yk-operation" key={entry.id}><div><strong>{entry.kind === "purchase" ? "Compra pendiente" : "Devolución pendiente"}</strong><small>{entry.id} · origen {entry.originId}</small></div><div className="yk-total-row"><span>Saldo</span><strong>{money(entry.totalCents - entry.paidCents)}</strong></div></div>)}{!pending.length ? <div className="yk-inline-empty"><WalletCards/><strong>Sin obligaciones pendientes</strong><p>Los hechos económicos compartidos aparecerán aquí.</p></div> : <div className="yk-callout"><Receipt size={17}/> La recepción física y la compra conservan identidades separadas.</div>}</div>
}
