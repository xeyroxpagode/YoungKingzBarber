"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { TeamWorkspace } from "./TeamWorkspace";

export function TeamLanding(){
  const [staffAccess,setStaffAccess]=useState<boolean>();const router=useRouter();
  useEffect(()=>{api<{capabilities:string[]}>("/v1/iam/context").then(context=>{if(context.capabilities.includes("iam.staff.list"))setStaffAccess(true);else if(context.capabilities.includes("professionals.read"))router.replace("/team/professionals");else router.replace("/account");}).catch(()=>router.replace("/account"));},[router]);
  if(!staffAccess)return <div className="content"><div className="skeleton" role="status" aria-label="Verificando acceso a Equipo"/></div>;
  return <TeamWorkspace/>;
}
