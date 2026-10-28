import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({className="",...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className={`yk-button ${className}`} {...props}/>;}
export function Field({label,error,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string;error?:string}){return <label className="yk-field"><span>{label}</span><input {...props}/>{error&&<small>{error}</small>}</label>;}
export function StatusPill({children,tone="neutral"}:{children:ReactNode;tone?:"neutral"|"positive"|"warning"|"danger"}){return <span className={`yk-pill yk-pill-${tone}`}>{children}</span>;}
export function EmptyState({title,detail,action}:{title:string;detail:string;action?:ReactNode}){return <div className="yk-empty"><h2>{title}</h2><p>{detail}</p>{action}</div>;}
