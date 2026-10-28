"use client";

import { useEffect,useState } from "react";
import { Button,StatusPill } from "@youngkingz/ui";
import { api,ApiError } from "@/lib/api/client";

type Context={roleAssignmentId:string;role:string;active:boolean};
type Current={roleAssignmentId:string;role:string;revision:number;capabilities:string[]};
const roleName=(role:string)=>role==="OWNER"?"Dueño":role==="RECEPTIONIST"?"Recepción":"Barbero";

export function ContextWorkspace(){
  const [items,setItems]=useState<Context[]>([]);const [current,setCurrent]=useState<Current>();const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function load(){const [contexts,active]=await Promise.all([api<Context[]>("/v1/iam/contexts"),api<Current>("/v1/iam/context")]);setItems(contexts);setCurrent(active);}
  useEffect(()=>{load().catch(error=>setError(error instanceof ApiError?error.message:"No pudimos cargar tus funciones."));},[]);
  async function change(roleAssignmentId:string){if(!current||roleAssignmentId===current.roleAssignmentId)return;setBusy(true);setError("");try{const result=await api<{revision:number}>("/v1/iam/context",{method:"PUT",operationId:crypto.randomUUID(),body:JSON.stringify({roleAssignmentId,revision:current.revision})});window.localStorage.setItem("yk-context-revision",String(result.revision));window.location.assign("/account");}catch(error){setError(error instanceof ApiError&&error.code==="STALE_REVISION"?"Tu función activa cambió en otra pestaña. Actualizamos la información; revisala antes de intentar de nuevo.":error instanceof ApiError?error.message:"No se pudo cambiar la función activa.");await load().catch(()=>undefined);}finally{setBusy(false);}}
  return <div className="content narrow-content"><header className="page-header"><div><span className="eyebrow">Función activa</span><h1 className="page-title">Elegí cómo vas a trabajar</h1><p>Cambiar de función no cambia tu identidad ni suma permisos.</p></div>{current&&<StatusPill tone="positive">{roleName(current.role)}</StatusPill>}</header>{error&&<div className="notice error" role="alert">{error}</div>}<section className="panel-section"><div className="section-head"><div><h2>Funciones disponibles</h2><p className="muted">El servidor confirma el cambio antes de mostrar información del nuevo contexto.</p></div></div>{items.length<=1?<div className="notice">Tenés una sola función vigente. Young Kingz entra directamente sin pedirte una elección innecesaria.</div>:<div className="context-options">{items.map(item=><Button key={item.roleAssignmentId} className={item.roleAssignmentId===current?.roleAssignmentId?"secondary":""} disabled={busy||item.roleAssignmentId===current?.roleAssignmentId} onClick={()=>change(item.roleAssignmentId)}>{roleName(item.role)}{item.roleAssignmentId===current?.roleAssignmentId?" · activa":""}</Button>)}</div>}</section></div>;
}
