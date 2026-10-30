"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Field } from "@youngkingz/ui";
import { ApiError, api } from "@/lib/api/client";
import { catalogMutation, getCategories, TransportUncertainError, type Category } from "./api";
import { useDirtyGuard } from "./useDirtyGuard";

type MutationState = "IDLE"|"DIRTY"|"SUBMITTING"|"SUCCESS"|"VALIDATION_ERROR"|"FORBIDDEN"|"CONFLICT"|"STALE"|"TRANSPORT_UNCERTAIN";

export function CreateServiceWorkspace() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [categoryId, setCategoryId] = useState("");
  const [withTerms, setWithTerms] = useState(false); const [price, setPrice] = useState(""); const [duration, setDuration] = useState("30"); const [preBuffer, setPreBuffer] = useState("0"); const [postBuffer, setPostBuffer] = useState("0"); const [conditions, setConditions] = useState("");
  const [state, setState] = useState<MutationState>("IDLE"); const [message, setMessage] = useState(""); const [operationId, setOperationId] = useState<string>();
  const dirty = useMemo(() => Boolean(name||description||categoryId||withTerms), [name,description,categoryId,withTerms]);
  useDirtyGuard(dirty && state!=="SUCCESS");

  useEffect(()=>{const controller=new AbortController();Promise.all([getCategories("lifecycle=ACTIVE&limit=100",controller.signal),api<{capabilities:string[]}>("/v1/iam/context",{signal:controller.signal})]).then(([result,context])=>{setCategories(result.items);setCapabilities(context.capabilities);}).catch(()=>setMessage("No pudimos cargar las opciones del formulario."));return()=>controller.abort();},[]);
  useEffect(()=>{if(dirty&&state==="IDLE")setState("DIRTY");},[dirty,state]);
  const canTerms=capabilities.includes("catalog.services.update_terms");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("SUBMITTING"); setMessage("");
    const parsedPrice = Math.round(Number(price.replace(",","."))*100);
    const payload = { name, description: description||null, categoryId: categoryId||null, initialCommercialTerms: withTerms ? { money:{amountMinor:parsedPrice,currency:"ARS"}, durationMinutes:Number(duration), preBufferMinutes:Number(preBuffer), postBufferMinutes:Number(postBuffer), conditions:conditions||null } : undefined };
    try {
      const result=await catalogMutation<{id:string}>("/v1/catalog/services","POST",payload,operationId);setState("SUCCESS");setOperationId(undefined);router.push(`/services/${result.data.id}`);
    } catch(error) {
      if(error instanceof TransportUncertainError){setState("TRANSPORT_UNCERTAIN");setOperationId(error.operationId);setMessage("No sabemos todavía si se confirmó. Reintentá la consulta sin cambiar los datos.");return;}
      if(error instanceof ApiError){setState(error.code==="FORBIDDEN"?"FORBIDDEN":error.code==="STALE_REVISION"?"STALE":error.status===409?"CONFLICT":"VALIDATION_ERROR");setMessage(error.message);}else{setState("TRANSPORT_UNCERTAIN");setMessage("No pudimos confirmar el resultado.");}
    }
  }

  return <div className="content narrow-content"><header className="page-header"><div><span className="eyebrow">Nuevo servicio</span><h1 className="page-title">Crear borrador</h1><p>Podés empezar sólo con el nombre. Publicar siempre es una acción posterior.</p></div><Link className="button ghost" href="/services">Volver</Link></header><form className="panel-section stack" onSubmit={submit}><div className="form-grid"><Field label="Nombre" value={name} onChange={(e)=>setName(e.target.value)} required maxLength={120}/><label className="yk-field"><span>Categoría</span><select value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}><option value="">Sin categoría</option>{categories.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="yk-field wide"><span>Descripción</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} maxLength={2000} rows={4}/></label></div>{canTerms&&<label className="check-row"><input type="checkbox" checked={withTerms} onChange={(e)=>setWithTerms(e.target.checked)}/>Definir términos comerciales iniciales</label>}{withTerms&&canTerms&&<fieldset className="terms-fieldset"><legend>Términos iniciales</legend><div className="form-grid"><Field label="Precio ARS" inputMode="decimal" value={price} onChange={(e)=>setPrice(e.target.value)} required/><Field label="Duración (min)" type="number" min={1} value={duration} onChange={(e)=>setDuration(e.target.value)} required/><Field label="Buffer previo (min)" type="number" min={0} value={preBuffer} onChange={(e)=>setPreBuffer(e.target.value)} required/><Field label="Buffer posterior (min)" type="number" min={0} value={postBuffer} onChange={(e)=>setPostBuffer(e.target.value)} required/><label className="yk-field wide"><span>Condiciones</span><textarea value={conditions} onChange={(e)=>setConditions(e.target.value)} maxLength={2000} rows={3}/></label></div></fieldset>}{message&&<div className={`notice ${state==="SUCCESS"?"success":"error"}`} role="alert">{message}</div>}<div className="form-actions"><Link className="button ghost" href="/services">Cancelar</Link><Button disabled={!name.trim()||state==="SUBMITTING"}>{state==="SUBMITTING"?"Confirmando…":state==="TRANSPORT_UNCERTAIN"?"Consultar resultado":"Crear servicio"}</Button></div></form></div>;
}
