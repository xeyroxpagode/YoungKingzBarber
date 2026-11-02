"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { ChevronLeft } from "lucide-react";
import { EmptyState, StatusPill } from "@youngkingz/ui";
import { getMyServices, type StaffServiceOption } from "@/features/staff-services/api";

export default function MyServicesPage() {
  const [services, setServices] = useState<StaffServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getMyServices()
      .then((data) => {
        setServices(data.services);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar sus servicios.");
      })
      .finally(() => setLoading(false));
  }, []);

  const lifecycleLabel = (option: StaffServiceOption) => {
    if (option.lifecycle === "ARCHIVED") return "Archivado";
    return option.publication === "PUBLISHED" ? "Publicado" : "No publicado";
  };

  const lifecycleTone = (option: StaffServiceOption) => {
    if (option.lifecycle === "ARCHIVED") return "danger";
    return option.publication === "PUBLISHED" ? "positive" : "neutral";
  };

  if (loading) return <div className="stack skeleton-list">{[1, 2, 3].map((i) => <div className="skeleton" key={i} />)}</div>;
  if (error) return <div className="notice error" role="alert">{error}</div>;

  return (
    <div className="content account-services-content">
      <header className="page-header">
        <button className="link-button" onClick={() => window.history.back()}>
          <ChevronLeft size={17} /> Volver a Mi cuenta
        </button>
        <div>
          <span className="eyebrow">Mis servicios</span>
          <h1 className="page-title">Servicios asignados</h1>
          <p className="muted">Servicios que usted puede realizar en Young Kingz. Esta consulta es de sólo lectura.</p>
        </div>
      </header>

      {services.length === 0 ? (
        <EmptyState title="Sin servicios asignados" detail="Aún no tiene servicios asignados. Hable con un Dueño o Recepción para que le asignen servicios del catálogo." />
      ) : (
        <section className="section">
          <div className="section-head">
            <div>
              <h3>Servicios que realiza</h3>
              <p className="muted">Estado de cada servicio segÃºn el catÃ¡logo del negocio.</p>
            </div>
          </div>
          <div className="service-list">
            {services.map((option) => (
              <div key={option.id} className="service-row read-only">
                <span className="service-name">{option.name}</span>
                <StatusPill tone={lifecycleTone(option)}>{lifecycleLabel(option)}</StatusPill>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
