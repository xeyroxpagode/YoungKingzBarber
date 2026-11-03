"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, Field, StatusPill } from "@youngkingz/ui";
import {
  searchClients,
  createClient,
  updateClient,
  addClientContact,
  createClientNote,
  listClientAccountLinks,
  clientContactLabel,
  clientProfileDisplayName,
  type ClientProfileSummary,
  type CreateClientProfileInput,
  type UpdateClientProfileInput,
  type AddClientContactInput,
  type CreateClientNoteInput
} from "./api";

type View = "list" | "detail" | "edit";
type ContactForm = { type: "telefono" | "email" | "whatsapp"; value: string; label: string; isPrimary: boolean };

export function ClientsWorkspace() {
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ClientProfileSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createForm, setCreateForm] = useState<CreateClientProfileInput | null>(null);
  const [editForm, setEditForm] = useState<UpdateClientProfileInput>({ expectedRevision: 0, name: "", firstName: undefined, lastName: undefined });
  const [contactForm, setContactForm] = useState<ContactForm>({ type: "telefono", value: "", label: "", isPrimary: false });
  const [noteText, setNoteText] = useState("");
  const profile = profiles.find((p) => p.id === selected);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await searchClients(query.trim() || undefined, undefined, 20);
      setProfiles(result.items);
      setNextCursor(result.nextCursor);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || moreLoading) return;
    setMoreLoading(true);
    try {
      const result = await searchClients(query.trim() || undefined, nextCursor, 20);
      setProfiles((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar más resultados.");
    } finally {
      setMoreLoading(false);
    }
  }, [nextCursor, moreLoading, query, load]);

  const openCreate = () => {
    setCreateForm({ name: "", firstName: "", lastName: "", contacts: [] });
  };

  const saveCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm) return;
    setBusy(true);
    setError("");
    try {
      const result = await createClient(createForm);
      setMessage("Cliente creado.");
      setCreateForm(null);
      await load();
      setSelected(result.clientProfileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;
    setEditForm({ expectedRevision: profile.revision, name: profile.name, firstName: profile.firstName ?? undefined, lastName: profile.lastName ?? undefined });
    setView("edit");
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError("");
    try {
      await updateClient(profile.id, editForm);
      setMessage("Ficha actualizada.");
      await load();
      setView("detail");
    } catch (err) {
      setError(err instanceof Error && (err as { code?: string }).code === "STALE_REVISION" ? "La ficha cambió en otra sesión. Actualizá antes de guardar." : err instanceof Error ? err.message : "No se pudo guardar la ficha.");
    } finally {
      setBusy(false);
    }
  };

  const addContact = async () => {
    if (!profile) return;
    const input: AddClientContactInput = { type: contactForm.type, value: contactForm.value.trim(), label: contactForm.label.trim() || undefined, isPrimary: contactForm.isPrimary };
    if (!input.value) return;
    setBusy(true);
    setError("");
    try {
      await addClientContact(profile.id, input);
      setMessage("Contacto agregado.");
      setContactForm({ type: "telefono", value: "", label: "", isPrimary: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el contacto.");
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const input: CreateClientNoteInput = { text: noteText.trim() };
    if (!input.text) return;
    setBusy(true);
    setError("");
    try {
      await createClientNote(profile.id, input);
      setNoteText("");
      setMessage("Nota registrada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la nota.");
    } finally {
      setBusy(false);
    }
  };

  if (view === "list") {
    return (
      <div className="content clients-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">Clientes · CRM</span>
            <h1 className="page-title">Clientes</h1>
            <p>Fichas comerciales independientes de cuentas y reservas.</p>
          </div>
          <div className="inline">
            <Button onClick={openCreate} disabled={busy}>Nuevo cliente</Button>
          </div>
        </header>
        {error && <div className="notice error" role="alert">{error}</div>}
        {message && <div className="notice success" role="status">{message}</div>}
        {createForm && (
          <section className="stack" style={{ marginTop: "1rem" }}>
            <h3>Nuevo cliente</h3>
            <form className="stack" onSubmit={saveCreate}>
              <Field label="Nombre comercial" value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.currentTarget.value })} required />
              <Field label="Nombre" value={createForm.firstName ?? ""} onChange={(event) => setCreateForm({ ...createForm, firstName: event.currentTarget.value || undefined })} />
              <Field label="Apellido" value={createForm.lastName ?? ""} onChange={(event) => setCreateForm({ ...createForm, lastName: event.currentTarget.value || undefined })} />
              <Field label="Contacto principal" value={createForm.contacts?.[0]?.value ?? ""} onChange={(event) => {
                const contacts = createForm.contacts ?? [];
                if (contacts.length === 0) contacts.push({ type: "telefono", value: "", label: "", isPrimary: true });
                contacts[0].value = event.currentTarget.value;
                setCreateForm({ ...createForm, contacts });
              }} />
              <div className="modal-actions">
                <Button type="button" onClick={() => setCreateForm(null)}>Cancelar</Button>
                <Button type="submit" disabled={busy || !createForm.name.trim()}>Crear cliente</Button>
              </div>
            </form>
          </section>
        )}
        <section className="split">
          <div className="directory">
            <div className="directory-tools">
              <Field label="Buscar cliente" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Nombre o contacto" />
            </div>
            {loading ? (
              <div className="stack skeleton-list"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
            ) : profiles.length ? (
              <>
                <div className="directory-list">
                  {profiles.map((item) => (
                    <button
                      key={item.id}
                      className={`staff-row ${selected === item.id ? "active" : ""}`}
                      onClick={() => {
                        setError("");
                        setSelected(item.id);
                        setView("detail");
                      }}
                    >
                      <div>
                        <div className="staff-name">{item.name}</div>
                        <div className="staff-meta">{item.primaryContact ? `${clientContactLabel(item.primaryContact.type as "telefono" | "email" | "whatsapp")}: ${item.primaryContact.value}` : "Sin contacto"}</div>
                      </div>
                      <StatusPill tone={item.lifecycleState === "active" ? "neutral" : "warning"}>{item.lifecycleState === "active" ? "Activo" : "Archivado"}</StatusPill>
                    </button>
                  ))}
                </div>
                {nextCursor && <Button onClick={loadMore} disabled={moreLoading}>Cargar más</Button>}
                <p className="muted">{total} ficha{total !== 1 ? "s" : ""} en este negocio.</p>
              </>
            ) : (
              <EmptyState title="Sin clientes" detail="No hay fichas que coincidan con la búsqueda." action={<Button onClick={openCreate}>Crear el primero</Button>} />
            )}
          </div>
          {selected && profile ? (
            <div className="detail member-panel">
              <header className="detail-head">
                <button className="button ghost" onClick={() => { setSelected(null); setView("list"); }}>← Volver al listado</button>
                <h2>{profile.name}</h2>
                <p className="muted">{clientProfileDisplayName(profile)} · Revisión {profile.revision}</p>
              </header>
              <section className="stack">
                <h3>Contactos</h3>
                <p className="muted">Los contactos son datos comerciales, no identidad acreditada.</p>
                <form className="stack" onSubmit={(event) => { event.preventDefault(); addContact(); }}>
                  <Field label="Tipo" value={contactForm.type} onChange={(event) => setContactForm({ ...contactForm, type: event.currentTarget.value as ContactForm["type"] })}>
                    <select value={contactForm.type} onChange={(event) => setContactForm({ ...contactForm, type: event.currentTarget.value as ContactForm["type"] })}>
                      <option value="telefono">Teléfono</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </Field>
                  <Field label="Valor" value={contactForm.value} onChange={(event) => setContactForm({ ...contactForm, value: event.currentTarget.value })} placeholder="Teléfono, email o WhatsApp" />
                  <Field label="Etiqueta" value={contactForm.label} onChange={(event) => setContactForm({ ...contactForm, label: event.currentTarget.value })} placeholder="Ej. trabajo, casa" />
                  <label className="yk-field"><input type="checkbox" checked={contactForm.isPrimary} onChange={(event) => setContactForm({ ...contactForm, isPrimary: event.currentTarget.checked })} /> Principal</label>
                  <Button type="submit" disabled={busy || !contactForm.value.trim()}>Agregar contacto</Button>
                </form>
                <h3>Notas internas</h3>
                <p className="muted">Las notas son internas del negocio y no se exponen públicamente.</p>
                <form className="stack" onSubmit={saveNote}>
                  <Field label="Nota" value={noteText} onChange={(event) => setNoteText(event.currentTarget.value)} placeholder="Escribí una nota interna…" />
                  <Button type="submit" disabled={busy || !noteText.trim()}>Registrar nota</Button>
                </form>
                <h3>Vínculos de cuenta</h3>
                <p className="muted">Los vínculos requieren acreditación de titularidad (procedimiento U02/U04).</p>
                <Button onClick={() => { listClientAccountLinks(profile.id).then((links) => setMessage(links.length ? `${links.length} vínculo(s) registrado(s).` : "Sin vínculos.")); }}>Ver vínculos</Button>
              </section>
              <Button onClick={openEdit} disabled={busy}>Editar ficha</Button>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  if (view === "detail" && profile) {
    return (
      <div className="content clients-content">
        <header className="page-header">
          <div>
            <button className="button ghost" onClick={() => { setSelected(null); setView("list"); }}>← Volver</button>
            <h1 className="page-title">{profile.name}</h1>
          </div>
        </header>
        <section className="stack">
          <h2>Ficha de cliente</h2>
          <dl className="detail-grid">
            <dt>Nombre comercial</dt><dd>{profile.name}</dd>
            <dt>Nombre y apellido</dt><dd>{clientProfileDisplayName(profile) || "—"}</dd>
            <dt>Estado</dt><dd><StatusPill tone={profile.lifecycleState === "active" ? "neutral" : "warning"}>{profile.lifecycleState === "active" ? "Activo" : "Archivado"}</StatusPill></dd>
            <dt>Revisión</dt><dd>{profile.revision}</dd>
            <dt>Contacto principal</dt><dd>{profile.primaryContact ? `${clientContactLabel(profile.primaryContact.type as "telefono" | "email" | "whatsapp")}: ${profile.primaryContact.value}` : "Sin contacto"}</dd>
            <dt>Creada</dt><dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
            <dt>Modificada</dt><dd>{new Date(profile.updatedAt).toLocaleDateString()}</dd>
          </dl>
          <div className="inline">
            <Button onClick={() => setView("edit")} disabled={busy}>Editar datos</Button>
            <Button className="ghost" onClick={() => { setView("list"); }}>Volver al listado</Button>
          </div>
        </section>
      </div>
    );
  }

  if (view === "edit" && profile) {
    return (
      <div className="content clients-content">
        <header className="page-header">
          <div>
            <button className="button ghost" onClick={() => setView("detail")}>← Volver</button>
            <h1 className="page-title">Editar cliente</h1>
          </div>
        </header>
        {error && <div className="notice error" role="alert">{error}</div>}
        <form className="stack" onSubmit={saveEdit}>
          <Field label="Nombre comercial" value={editForm.name ?? ""} onChange={(event) => setEditForm({ ...editForm, name: event.currentTarget.value })} required />
          <Field label="Nombre" value={editForm.firstName ?? ""} onChange={(event) => setEditForm({ ...editForm, firstName: event.currentTarget.value || undefined })} />
          <Field label="Apellido" value={editForm.lastName ?? ""} onChange={(event) => setEditForm({ ...editForm, lastName: event.currentTarget.value || undefined })} />
          <p className="muted">Los contactos se editan desde el detalle de la ficha.</p>
          <div className="modal-actions">
            <Button type="button" onClick={() => setView("detail")} className="ghost">Cancelar</Button>
            <Button type="submit" disabled={busy || !(editForm.name ?? "").trim()}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    );
  }

  return <div className="content"><EmptyState title="Sin acceso" detail="No se pudo cargar la sección de Clientes." /></div>;
}
