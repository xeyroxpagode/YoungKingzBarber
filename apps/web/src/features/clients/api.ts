import { api } from "@/lib/api/client";

export type ClientProfileSummary = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  lifecycleState: "active" | "archived";
  revision: number;
  primaryContact?: { type: string; value: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientContact = {
  id: string;
  businessId: string;
  clientProfileId: string;
  type: "telefono" | "email" | "whatsapp";
  value: string;
  normalizedValue: string;
  label?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientNote = {
  id: string;
  businessId: string;
  clientProfileId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  replacesNoteId?: string | null;
};

export type ClientAccountLink = {
  id: string;
  businessId: string;
  clientProfileId: string;
  accountId: string;
  authMethod: "staff-verified" | "document" | "pending-u02";
  evidenceReference: string;
  authorityId: string;
  authorityName: string;
  linkedAt: string;
  revokedAt?: string | null;
  auditReference: string;
};

export type ClientSearchResult = {
  items: ClientProfileSummary[];
  nextCursor: string | null;
  total: number;
};

export type CreateClientProfileInput = {
  name: string;
  firstName?: string;
  lastName?: string;
  contacts?: Array<{ type: "telefono" | "email" | "whatsapp"; value: string; label?: string; isPrimary?: boolean }>;
};

export type UpdateClientProfileInput = {
  expectedRevision: number;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type AddClientContactInput = {
  type: "telefono" | "email" | "whatsapp";
  value: string;
  label?: string;
  isPrimary?: boolean;
};

export type UpdateClientContactInput = {
  type?: "telefono" | "email" | "whatsapp";
  value?: string;
  label?: string | null;
  isPrimary?: boolean;
};

export type CreateClientNoteInput = {
  text: string;
  replacesNoteId?: string;
};

export type ClientMutationResult = {
  data: { clientProfileId: string; revision: number; changed: boolean };
  replayed: boolean;
};

export type ClientContactMutationResult = {
  data: { clientProfileId: string; revision: number; changed: boolean; contactId: string };
  replayed: boolean;
};

export type ClientNoteMutationResult = {
  data: { clientProfileId: string; noteId: string; createdAt: string; changed: boolean };
  replayed: boolean;
};

export function searchClients(q?: string, cursor?: string, limit = 20, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return api<ClientSearchResult>(`/v1/clients?${params.toString()}`, { signal });
}

export function getClient(clientId: string, signal?: AbortSignal) {
  return api<ClientProfileSummary>(`/v1/clients/${clientId}`, { signal });
}

export function createClient(input: CreateClientProfileInput) {
  const operationId = crypto.randomUUID();
  return api<ClientMutationResult>("/v1/clients", {
    method: "POST",
    operationId,
    body: JSON.stringify(input)
  }).then((result) => result.data);
}

export function updateClient(clientId: string, input: UpdateClientProfileInput) {
  const operationId = crypto.randomUUID();
  return api<ClientMutationResult>(`/v1/clients/${clientId}`, {
    method: "PATCH",
    operationId,
    body: JSON.stringify(input)
  }).then((result) => result.data);
}

export function addClientContact(clientId: string, input: AddClientContactInput) {
  const operationId = crypto.randomUUID();
  return api<ClientContactMutationResult>(`/v1/clients/${clientId}/contacts`, {
    method: "POST",
    operationId,
    body: JSON.stringify(input)
  }).then((result) => result.data);
}

export function updateClientContact(clientId: string, contactId: string, input: UpdateClientContactInput) {
  const operationId = crypto.randomUUID();
  return api<ClientContactMutationResult>(`/v1/clients/${clientId}/contacts/${contactId}`, {
    method: "PATCH",
    operationId,
    body: JSON.stringify(input)
  }).then((result) => result.data);
}

export function listClientNotes(clientId: string, signal?: AbortSignal) {
  return api<ClientNote[]>(`/v1/clients/${clientId}/notes`, { signal });
}

export function createClientNote(clientId: string, input: CreateClientNoteInput) {
  const operationId = crypto.randomUUID();
  return api<ClientNoteMutationResult>(`/v1/clients/${clientId}/notes`, {
    method: "POST",
    operationId,
    body: JSON.stringify(input)
  }).then((result) => result.data);
}

export function listClientAccountLinks(clientId: string, signal?: AbortSignal) {
  return api<ClientAccountLink[]>(`/v1/clients/${clientId}/account-links`, { signal });
}

export function clientContactLabel(type: ClientContact["type"]): string {
  if (type === "email") return "Email";
  if (type === "whatsapp") return "WhatsApp";
  return "Teléfono";
}

export function clientProfileDisplayName(profile: ClientProfileSummary): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.name;
}
