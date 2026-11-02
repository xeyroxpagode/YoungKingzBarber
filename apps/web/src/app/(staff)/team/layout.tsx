import Link from "next/link";

export default function TeamAreaLayout({children}:{children:React.ReactNode}){
  return <><nav className="content inline" style={{paddingBottom:0}} aria-label="Secciones de Equipo"><Link className="button ghost" href="/team">Integrantes</Link></nav>{children}</>;
}
