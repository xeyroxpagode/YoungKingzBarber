"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { ClientsWorkspace } from "@/features/clients/ClientsWorkspace";

export default function ClientsPage() {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api<{ capabilities: string[] }>("/v1/iam/context")
      .then((context) => {
        if (context.capabilities.includes("clients.read")) setAuthorized(true);
        else router.replace("/account");
      })
      .catch(() => router.replace("/account"));
  }, [router]);

  if (!authorized) return <div className="content"><div className="skeleton" role="status" aria-label="Verificando acceso a Clientes" /></div>;
  return <ClientsWorkspace />;
}
