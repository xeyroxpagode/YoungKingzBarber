"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, StatusPill } from "@youngkingz/ui";
import { ApiError, api } from "@/lib/api/client";
import { getCategories, getServices, type Category, type ServiceSummary } from "./api";

const money = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount / 100);

export function CatalogWorkspace() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publication, setPublication] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(Object.entries({ q, categoryId, publication, lifecycle }).filter(([, value]) => value)).toString(), [q, categoryId, publication, lifecycle]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    Promise.all([getServices(query, controller.signal), getCategories("limit=100", controller.signal), api<{ capabilities: string[] }>("/v1/iam/context", { signal: controller.signal })])
      .then(([serviceResult, categoryResult, context]) => { setServices(serviceResult.items); setCategories(categoryResult.items); setCapabilities(context.capabilities); })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof ApiError ? reason.message : "No pudimos cargar el catálogo."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  return <div className="content catalog-content"><header className="page-header"><div><span className="eyebrow">Catálogo comercial</span><h1 className="page-title">Servicios</h1><p>Identidad estable, términos versionados y publicación controlada.</p></div><div className="inline"><Link className="button ghost" href="/services/categories">Categorías</Link>{capabilities.includes("catalog.services.create")&&<Link className="button" href="/services/new">Nuevo servicio</Link>}</div></header>
    <section className="catalog-filters" aria-label="Filtros de servicios"><label><span>Buscar</span><input value={q} onChange={(event)=>setQ(event.target.value)} placeholder="Nombre del servicio"/></label><label><span>Categoría</span><select value={categoryId} onChange={(event)=>setCategoryId(event.target.value)}><option value="">Todas</option>{categories.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Publicación</span><select value={publication} onChange={(event)=>setPublication(event.target.value)}><option value="">Todas</option><option value="PUBLISHED">Publicado</option><option value="UNPUBLISHED">No publicado</option></select></label><label><span>Estado</span><select value={lifecycle} onChange={(event)=>setLifecycle(event.target.value)}><option value="">Todos</option><option value="ACTIVE">Activo</option><option value="ARCHIVED">Archivado</option></select></label></section>
    {error&&<div className="notice error" role="alert">{error}</div>}
    {loading?<div className="catalog-grid" role="status"><span className="sr-only">Cargando servicios</span>{Array.from({length:4},(_,index)=><div className="skeleton catalog-skeleton" key={index}/>)}</div>:services.length===0?<EmptyState title="No hay servicios para mostrar" detail="Creá un servicio o ajustá los filtros." action={capabilities.includes("catalog.services.create")?<Link className="button" href="/services/new">Crear servicio</Link>:undefined}/>:<div className="catalog-grid">{services.map((item)=><Link className="service-card" href={`/services/${item.id}`} key={item.id}><div className="service-card-head"><div><strong>{item.name}</strong><span>{item.category?.name??"Sin categoría"}</span></div><StatusPill tone={item.publication==="PUBLISHED"?"positive":"neutral"}>{item.publication==="PUBLISHED"?"Publicado":"No publicado"}</StatusPill></div><dl><div><dt>Precio actual</dt><dd>{item.currentTerms?money(item.currentTerms.money.amountMinor):"Sin definir"}</dd></div><div><dt>Duración</dt><dd>{item.currentTerms?`${item.currentTerms.durationMinutes} min`:"Sin definir"}</dd></div></dl><div className="service-card-foot"><StatusPill tone={item.lifecycle==="ARCHIVED"?"danger":"positive"}>{item.lifecycle==="ARCHIVED"?"Archivado":"Activo"}</StatusPill><StatusPill tone={item.complete?"positive":"warning"}>{item.complete?"Completo":"Incompleto"}</StatusPill></div></Link>)}</div>}
  </div>;
}
