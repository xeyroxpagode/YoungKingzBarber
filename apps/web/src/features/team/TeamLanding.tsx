"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { TeamWorkspace } from "./TeamWorkspace";
import { ScheduleTeamWorkspace } from "../schedules/ScheduleTeamWorkspace";

export function TeamLanding() {
  const [view, setView] = useState<"ADMIN" | "OPERATIONAL">();
  const router = useRouter();
  useEffect(() => {
    api<{ capabilities: string[] }>("/v1/iam/context")
      .then((context) => {
        if (context.capabilities.includes("iam.staff.list")) setView("ADMIN");
        else if (context.capabilities.includes("schedules.read")) setView("OPERATIONAL");
        else router.replace("/account");
      })
      .catch(() => router.replace("/account"));
  }, [router]);
  if (view === "ADMIN") return <TeamWorkspace />;
  if (view === "OPERATIONAL") return <ScheduleTeamWorkspace />;
  return <div className="content"><div className="skeleton" role="status" aria-label="Verificando acceso a Equipo" /></div>;
}
