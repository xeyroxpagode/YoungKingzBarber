import Link from "next/link";

export default function AccountAreaLayout({children}:{children:React.ReactNode}){
  return <><nav className="content inline" style={{paddingBottom:0}} aria-label="Secciones del área personal"><Link className="button ghost" href="/account">Mi cuenta</Link><Link className="button secondary" href="/account/professional">Mi perfil profesional</Link></nav>{children}</>;
}
