"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@youngkingz/ui";
import { api, ApiError } from "@/lib/api/client";

export function ActivationForm({invitationId}:{invitationId?:string}){const [state,setState]=useState<"idle"|"busy"|"done"|"error">("idle");const [message,setMessage]=useState("");const router=useRouter();async function accept(){if(!invitationId){setState("error");setMessage("La invitación no contiene una referencia válida.");return;}setState("busy");try{await api(`/v1/invitations/${invitationId}/accept`,{method:"POST",operationId:crypto.randomUUID()});setState("done");setMessage("Tu identidad quedó vinculada y el acceso fue activado.");setTimeout(()=>router.replace("/team"),900);}catch(error){setState("error");setMessage(error instanceof ApiError?error.message:"No pudimos confirmar la invitación.");}}return <div className="auth-card stack"><span className="eyebrow">Activación Staff</span><h2>Confirmá tu incorporación.</h2><p className="muted">La aceptación es una acción explícita. Abrir este enlace no consume la invitación.</p>{message&&<div className={`notice ${state==="done"?"success":"error"}`}>{message}</div>}<Button onClick={accept} disabled={state==="busy"||state==="done"}>{state==="busy"?"Verificando identidad…":state==="done"?"Acceso confirmado":"Aceptar invitación"}</Button></div>}
