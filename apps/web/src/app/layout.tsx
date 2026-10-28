import type { Metadata } from "next";
import "./globals.css";

export const metadata:Metadata={title:"Young Kingz · Staff",description:"Administración segura de identidad y equipo"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
