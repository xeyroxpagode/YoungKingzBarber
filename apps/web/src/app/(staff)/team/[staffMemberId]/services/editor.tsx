"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { ChevronLeft } from "lucide-react";
import { Button, EmptyState, StatusPill } from "@youngkingz/ui";
import { replaceStaffServices, getStaffServices, type StaffServiceOption } from "@/features/staff-services/api";

type Context = { role: string; capabilities: string[] };

type Props = { staffMemberId: string };

export default function StaffServicesEditor({ staffMemberId }: Props) {
  const [services, setServices] = useState<StaffServiceOption[]>([]);
  const [revision, setRevision] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManage = capabilities.includes("staff-services.manage");
  const canEdit = canManage && employmentStatus !== "INACTIVE";
  const assignedIds = new Set(services.filter((s) => s.assigned).map((s) => s.id));
  const dirty =
    selectedIds.size !== assignedIds.size ||
    [...selectedIds].some((id) => !assignedIds.has(id));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const [data, context] = await Promise.all([
        getStaffServices(staffMemberId),
        api<Context>("/v1/iam/context")
      ]);
      setDisplayName(data.displayName);
      setEmploymentStatus(data.employmentStatus);
      setRevision(data.revision);
      setServices(data.services);
      setCapabilities(context.capabilities);
      setSelectedIds(new Set(data.services.filter((s) => s.assigned).map((s) => s.id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }, [staffMemberId]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setError("");
    setMessage("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!canManage || !dirty) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await replaceStaffServices(staffMemberId, revision, [...selectedIds].sort());
      setRevision(result.revision);
      setServices((prev) => prev.map((s) => ({ ...s, assigned: result.serviceIds.includes(s.id) })));
      setSelectedIds(new Set(result.serviceIds));
      setMessage("Servicios guardados correctamente.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "STALE_REVISION") {
          setError("Los servicios de este integrante cambiaron mientras estabas editando. Recargue la página para ver los valores actuales.");
        } else if (err.code === "STAFF_SERVICES_STAFF_NOT_EDITABLE") {
          setError("Este integrante no se encuentra en un estado editable.");
        } else {
          setError(err.message);
        }
      } else {
        setError("No se pudieron guardar los servicios.");
      }
    } finally {
      setSaving(false);
    }
  };

  const reload = () => { load(); setError(""); setMessage(""); };

  const lifecycleLabel = (option: StaffServiceOption) => {
    if (option.lifecycle === "ARCHIVED") return "Archivado";
    return option.publication === "PUBLISHED" ? "Publicado" : "No publicado";
  };

  const lifecycleTone = (option: StaffServiceOption) => {
    if (option.lifecycle === "ARCHIVED") return "danger";
    return option.publication === "PUBLISHED" ? "positive" : "neutral";
  };

  if (loading) return <div className="stack skeleton-list">{[1, 2, 3].map((i) => <div className="skeleton" key={i} />)}</div>;
  if (error) return <div className="notice error" role="alert">{error} <button className="link-button" onClick={reload}>Reintentar</button></div>;

  return (
    <div className="content staff-services-content">
      <header className="page-header">
        <button className="link-button" onClick={() => window.history.back()}>
          <ChevronLeft size={17} /> Volver al integrante
        </button>
        <div>
          <span className="eyebrow">Servicios que realiza</span>
          <h1 className="page-title">{displayName}</h1>
          <p className="muted">Capacidad del integrante para realizar servicios del catálogo.</p>
        </div>
      </header>

      {employmentStatus === "INACTIVE" && (
        <div className="notice" role="status">
          Este integrante tiene la relación laboral finalizada. Los servicios están preservados pero no se pueden modificar.
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <h3>Seleccione los servicios que este integrante puede realizar</h3>
            <p className="muted">Los cambios se guardan al pulsar Guardar. Los servicios archivados ya asignados pueden quitarse; los archivados no asignados no se pueden agregar.</p>
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyState title="Sin servicios en el catálogo" detail="No hay servicios registrados para este negocio." />
        ) : (
          <div className="service-list">
            {services.map((option) => {
              const isAssigned = selectedIds.has(option.id);
              return (
                <label key={option.id} className="service-row">
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    disabled={!canEdit || (!isAssigned && !option.assignable)}
                    onChange={() => toggle(option.id)}
                    aria-label={`Asignar ${option.name}`}
                  />
                  <span className="service-name">{option.name}</span>
                  <StatusPill tone={lifecycleTone(option)}>{lifecycleLabel(option)}</StatusPill>
                  {!option.assignable && !isAssigned && <span className="muted">No disponible para asignar (archivado)</span>}
                </label>
              );
            })}
          </div>
        )}
      </section>

      <div className="form-actions">
        <button className="button ghost" onClick={reload}>Recargar</button>
        {canManage && (
          <Button disabled={!dirty || saving} onClick={save}>
            {saving ? "Guardando..." : dirty ? "Guardar servicios" : "Sin cambios"}
          </Button>
        )}
      </div>
      {message && <div className="notice success" role="status">{message}</div>}
    </div>
  );
}
