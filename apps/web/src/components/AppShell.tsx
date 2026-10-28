"use client";
import Link from "next/link";
import { ShieldCheck, Users, UserRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

type Context={role:string;capabilities:string[]};
export function AppShell({children}:{children:React.ReactNode}){const [context,setContext]=useState<Context|null>(null);const router=useRouter();const pathname=usePathname();const canSeeTeam=context?.capabilities.includes("iam.staff.list")??false;useEffect(()=>{api<Context>("/v1/iam/context").then(value=>{setContext(value);if(pathname.startsWith("/team")&&!value.capabilities.includes("iam.staff.list"))router.replace("/account");}).catch(()=>setContext(null));},[pathname,router]);async function logout(){await createClient().auth.signOut({scope:"local"});router.replace("/login");router.refresh();}return <div className="app-shell"><aside className="sidebar"><Link href={canSeeTeam?"/team":"/account"} className="brand-mark">Young<span>Kingz</span></Link><nav className="nav">{canSeeTeam&&<Link href="/team"><Users size={18}/><span>Equipo</span></Link>}<Link href="/context"><ShieldCheck size={18}/><span>Contexto</span></Link><Link href="/account"><UserRound size={18}/><span>Mi cuenta</span></Link></nav><div className="sidebar-foot"><button className="button ghost" onClick={logout}><LogOut size={16}/> Cerrar sesión</button></div></aside><main className="shell-main"><header className="topbar"><span className="eyebrow">Staff · H01</span><Link href="/context" className="context-chip"><span className="context-dot"/>{context?.role??"Verificando acceso"}</Link></header>{children}</main></div>}
