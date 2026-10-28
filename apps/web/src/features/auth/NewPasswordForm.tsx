"use client";
import { useState } from "react";
import { Button, Field } from "@youngkingz/ui";
import { createClient } from "@/lib/supabase/client";
export function NewPasswordForm(){const [password,setPassword]=useState("");const [message,setMessage]=useState("");async function submit(event:React.FormEvent){event.preventDefault();if(password.length<10){setMessage("Usá al menos 10 caracteres.");return;}const {error}=await createClient().auth.updateUser({password});setMessage(error?"No se pudo actualizar la contraseña.":"Contraseña actualizada. Volvé a iniciar sesión en tus otros dispositivos.");}return <form className="auth-card stack" onSubmit={submit}><span className="eyebrow">Nueva credencial</span><h2>Elegí una nueva contraseña.</h2>{message&&<div className="notice">{message}</div>}<Field label="Contraseña nueva" type="password" minLength={10} required value={password} onChange={event=>setPassword(event.target.value)}/><Button>Actualizar contraseña</Button></form>}
