import { DomainError } from "@youngkingz/contracts";
import { z } from "zod";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { canonicalizeContacts, normalizeContactValue, validateUuid, type ContactCanonical, type ContactRow } from "./domain.js";

/**
 * H03.U01 · Comandos de Clientes.
 *
 * Invariantes que esta capa hace cumplir (no la UI):
 *  · Creación y contactos iniciales son atómicos (una transacción).
 *  · Revisión comienza en 1; se incrementa solo en cambios semánticos.
 *  · No-op semántico: sin cambio real → changed=false, sin revisión, sin auditoría.
 *  · Revisión obsoleta → STALE_REVISION (409), sin escritura.
 *  · Idempotencia: mismo operation_id → replay (sin duplicar).
 *  · FK tenant-safe: un contacto nunca puede asociarse a un perfil de otro Business.
 *  · Sin auto-merge: teléfonos compartidos son fichas distintas.
 */

async function lockProfile(tx: Tx, actor: Actor, clientProfileId: string) {
  const [row] = await tx`select id, revision from clients.client_profiles where business_id=${actor.businessId} and id=${clientProfileId} and lifecycle_state='active' for update` as unknown as { id: string; revision: number | string }[];
  if (!row) throw new DomainError("NOT_FOUND", "La ficha de cliente no existe", 404);
  return { id: row.id, revision: Number(row.revision) };
}

async function readContacts(tx: Tx, actor: Actor, clientProfileId: string) {
  return tx`select id, type, value, normalized_value "normalizedValue", label, is_primary "isPrimary" from clients.client_contacts where business_id=${actor.businessId} and client_profile_id=${clientProfileId} order by is_primary desc, created_at asc` as unknown as ContactRow[];
}

async function insertContact(tx: Tx, actor: Actor, clientProfileId: string, contact: ContactCanonical) {
  await tx`insert into clients.client_contacts(id, business_id, client_profile_id, type, value, normalized_value, label, is_primary, created_at, updated_at)
    values (gen_random_uuid(), ${actor.businessId}, ${clientProfileId}, ${contact.type}, ${contact.value}, ${contact.normalizedValue}, ${contact.label}, ${contact.isPrimary}, now(), now())`;
}

async function incrementRevision(tx: Tx, actor: Actor, clientProfileId: string, expectedRevision: number) {
  const [row] = await tx`update clients.client_profiles set revision=revision+1, updated_at=now() where business_id=${actor.businessId} and id=${clientProfileId} and revision=${expectedRevision} returning revision` as unknown as { revision: number | string }[];
  if (!row) throw new DomainError("STALE_REVISION", "La revisión está obsoleta. La ficha fue modificada en otra sesión.", 409);
  return Number(row!.revision);
}

async function readProfileFields(tx: Tx, clientProfileId: string) {
  const [row] = await tx`select name, first_name "firstName", last_name "lastName" from clients.client_profiles where id=${clientProfileId}` as unknown as { name: string; firstName: string | null; lastName: string | null }[];
  return row;
}

export async function createClientProfile(actor: Actor, raw: unknown, operationId: string) {
  const input = zCreateClientProfileSchema.parse(raw);
  const contacts = canonicalizeContacts(input.contacts ?? []);

  return executeOperation(
    { operationId, command: "clients.profile.create", actor, payload: { name: input.name, firstName: input.firstName, lastName: input.lastName, contacts } },
    async (tx) => {
      const [created] = await tx`insert into clients.client_profiles(id, business_id, name, first_name, last_name, lifecycle_state, revision, idempotency_key, created_at, updated_at)
        values (gen_random_uuid(), ${actor.businessId}, ${input.name}, ${input.firstName ?? null}, ${input.lastName ?? null}, 'active', 1, ${operationId}, now(), now())
        returning id, revision` as unknown as { id: string; revision: number | string }[];
      const profileId = created!.id;
      const revision = Number(created!.revision);

      for (const contact of contacts) {
        await insertContact(tx, actor, profileId, contact);
      }

      await audit(tx, {
        actor, operationId, action: "clients.profile.created", capability: "clients.manage",
        resourceType: "CLIENT_PROFILE", resourceId: profileId,
        changes: { clientProfileId: profileId, name: input.name, contactCount: contacts.length }
      });

      return {
        clientProfileId: profileId,
        revision,
        changed: true,
        name: input.name,
        firstName: input.firstName ?? undefined,
        lastName: input.lastName ?? undefined,
        contacts: contacts.map((c) => ({ type: c.type, value: c.value, normalizedValue: c.normalizedValue, label: c.label, isPrimary: c.isPrimary }))
      };
    }
  );
}

export async function updateClientProfile(actor: Actor, clientProfileId: string, raw: unknown, operationId: string) {
  const input = zUpdateClientProfileSchema.parse(raw);
  validateUuid(clientProfileId);

  return executeOperation(
    { operationId, command: "clients.profile.update", actor, payload: { clientProfileId, expectedRevision: input.expectedRevision, name: input.name, firstName: input.firstName, lastName: input.lastName } },
    async (tx) => {
      const profile = await lockProfile(tx, actor, clientProfileId);
      if (input.expectedRevision !== profile.revision) {
        throw new DomainError("STALE_REVISION", "La revisión está obsoleta. La ficha fue modificada en otra sesión.", 409);
      }

      const current = await readProfileFields(tx, clientProfileId);

      const nextName = input.name === undefined ? current.name : input.name.trim();
      if (nextName === "") throw new DomainError("VALIDATION_ERROR", "El nombre es obligatorio.", 400);
      const nextFirstName = input.firstName === undefined ? current.firstName : (input.firstName === null ? null : input.firstName.trim());
      const nextLastName = input.lastName === undefined ? current.lastName : (input.lastName === null ? null : input.lastName.trim());

      const changed = nextName !== current.name || nextFirstName !== current.firstName || nextLastName !== current.lastName;

      if (!changed) {
        return { clientProfileId, revision: profile.revision, changed: false };
      }

      const nextRevision = await incrementRevision(tx, actor, clientProfileId, profile.revision);

      await tx`update clients.client_profiles set name=${nextName}, first_name=${nextFirstName}, last_name=${nextLastName}, updated_at=now() where id=${clientProfileId}`;

      await audit(tx, {
        actor, operationId, action: "clients.profile.updated", capability: "clients.manage",
        resourceType: "CLIENT_PROFILE", resourceId: clientProfileId,
        changes: { clientProfileId, beforeRevision: profile.revision, afterRevision: nextRevision, changedFields: Object.keys(input).filter((k) => k !== "expectedRevision") }
      });

      return { clientProfileId, revision: nextRevision, changed: true, name: nextName };
    }
  );
}

export async function addClientContact(actor: Actor, clientProfileId: string, raw: unknown, operationId: string) {
  const input = zAddClientContactSchema.parse(raw);
  validateUuid(clientProfileId);
  const normalizedValue = normalizeContactValue(input.type, input.value);
  if (normalizedValue === "") throw new DomainError("VALIDATION_ERROR", "El valor del contacto no es válido.", 400);

  return executeOperation(
    { operationId, command: "clients.contact.add", actor, payload: { clientProfileId, type: input.type, value: input.value, label: input.label, isPrimary: input.isPrimary } },
    async (tx) => {
      await lockProfile(tx, actor, clientProfileId);
      const currentContacts = await readContacts(tx, actor, clientProfileId);

      const dup = currentContacts.find((c) => c.type === input.type && c.normalizedValue === normalizedValue);
      if (dup) throw new DomainError("CONFLICT", "Ya existe ese contacto en esta ficha.", 409);

      const isPrimary = input.isPrimary === true || currentContacts.length === 0;
      if (isPrimary) {
        await tx`update clients.client_contacts set is_primary=false, updated_at=now() where business_id=${actor.businessId} and client_profile_id=${clientProfileId} and is_primary=true`;
      }

      await insertContact(tx, actor, clientProfileId, { type: input.type, value: input.value.trim(), normalizedValue, label: input.label ?? null, isPrimary });

      const profile = await lockProfile(tx, actor, clientProfileId);
      const nextRevision = await incrementRevision(tx, actor, clientProfileId, profile.revision);

      await audit(tx, {
        actor, operationId, action: "clients.contact.added", capability: "clients.manage",
        resourceType: "CLIENT_PROFILE", resourceId: clientProfileId,
        changes: { clientProfileId, contactType: input.type, contactValue: input.value, isPrimary }
      });

      return { clientProfileId, revision: nextRevision, changed: true };
    }
  );
}

export async function updateClientContact(actor: Actor, clientProfileId: string, contactId: string, raw: unknown, operationId: string) {
  const input = zUpdateClientContactSchema.parse(raw);
  validateUuid(clientProfileId);
  validateUuid(contactId, "contactId");

  return executeOperation(
    { operationId, command: "clients.contact.update", actor, payload: { clientProfileId, contactId, type: input.type, value: input.value, label: input.label, isPrimary: input.isPrimary } },
    async (tx) => {
      await lockProfile(tx, actor, clientProfileId);

      const [contact] = await tx`select id, type, value, normalized_value "normalizedValue", label, is_primary "isPrimary" from clients.client_contacts where id=${contactId} and business_id=${actor.businessId} and client_profile_id=${clientProfileId} for update` as unknown as ContactRow[];
      if (!contact) throw new DomainError("NOT_FOUND", "El contacto no existe.", 404);

      const nextType = (input.type ?? contact.type) as ContactCanonical["type"];
      const nextValue = input.value === undefined ? contact.value : input.value.trim();
      if (nextValue === "") throw new DomainError("VALIDATION_ERROR", "El valor del contacto es obligatorio.", 400);
      const nextNormalized = normalizeContactValue(nextType, nextValue);
      if (nextNormalized === "") throw new DomainError("VALIDATION_ERROR", "El valor del contacto no es válido.", 400);

      const dup = (await readContacts(tx, actor, clientProfileId)).find((c) => c.id !== contactId && c.type === nextType && c.normalizedValue === nextNormalized);
      if (dup) throw new DomainError("CONFLICT", "Ya existe ese contacto en esta ficha.", 409);

      const nextIsPrimary = input.isPrimary === undefined ? contact.isPrimary : input.isPrimary;
      const nextLabel = input.label === undefined ? contact.label : (input.label === null ? null : input.label.trim());

      const changed = nextType !== contact.type || nextValue !== contact.value || nextNormalized !== contact.normalizedValue ||
        nextIsPrimary !== contact.isPrimary || nextLabel !== contact.label;

      if (!changed) {
        return { clientProfileId, revision: (await lockProfile(tx, actor, clientProfileId)).revision, changed: false, contactId };
      }

      const profile = await lockProfile(tx, actor, clientProfileId);
      const nextRevision = await incrementRevision(tx, actor, clientProfileId, profile.revision);

      if (nextIsPrimary) {
        await tx`update clients.client_contacts set is_primary=false, updated_at=now() where business_id=${actor.businessId} and client_profile_id=${clientProfileId} and is_primary=true`;
      }

      await tx`update clients.client_contacts set type=${nextType}, value=${nextValue}, normalized_value=${nextNormalized}, label=${nextLabel}, is_primary=${nextIsPrimary}, updated_at=now() where id=${contactId} and business_id=${actor.businessId}`;

      await audit(tx, {
        actor, operationId, action: "clients.contact.updated", capability: "clients.manage",
        resourceType: "CLIENT_PROFILE", resourceId: clientProfileId,
        changes: { clientProfileId, contactId, beforeRevision: profile.revision, afterRevision: nextRevision }
      });

      return { clientProfileId, revision: nextRevision, changed: true, contactId };
    }
  );
}

export async function createClientNote(actor: Actor, clientProfileId: string, raw: unknown, operationId: string) {
  const input = zCreateClientNoteSchema.parse(raw);
  validateUuid(clientProfileId);
  const text = input.text.trim();
  if (text === "") throw new DomainError("VALIDATION_ERROR", "El texto de la nota es obligatorio.", 400);

  return executeOperation(
    { operationId, command: "clients.note.create", actor, payload: { clientProfileId, text, replacesNoteId: input.replacesNoteId } },
    async (tx) => {
      await lockProfile(tx, actor, clientProfileId);

      if (input.replacesNoteId) {
        const [replaced] = await tx`select id from clients.client_notes where id=${input.replacesNoteId} and business_id=${actor.businessId} and client_profile_id=${clientProfileId} for update` as unknown as { id: string }[];
        if (!replaced) throw new DomainError("NOT_FOUND", "La nota a reemplazar no existe.", 404);
      }

      const [created] = await tx`insert into clients.client_notes(id, business_id, client_profile_id, text, author_id, author_name, created_at, replaces_note_id)
        values (gen_random_uuid(), ${actor.businessId}, ${clientProfileId}, ${text}, ${actor.accountId}, ${actor.email ?? actor.accountId}, now(), ${input.replacesNoteId ?? null})
        returning id, created_at` as unknown as { id: string; created_at: Date }[];

      await audit(tx, {
        actor, operationId, action: "clients.note.created", capability: "clients.notes.manage",
        resourceType: "CLIENT_PROFILE", resourceId: clientProfileId,
        changes: { clientProfileId, noteId: created!.id, replacesNoteId: input.replacesNoteId }
      });

      return { clientProfileId, noteId: created!.id, createdAt: String(created!.created_at), changed: true };
    }
  );
}

/* ── Esquemas Zod locales ── */

const zCreateClientProfileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  contacts: z.array(z.object({
    type: z.enum(["telefono", "email", "whatsapp"]),
    value: z.string().trim().min(1).max(200),
    label: z.string().trim().max(50).optional(),
    isPrimary: z.boolean().optional()
  })).max(20).optional()
});

const zUpdateClientProfileSchema = z.object({
  expectedRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(200).optional(),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable()
});

const zAddClientContactSchema = z.object({
  type: z.enum(["telefono", "email", "whatsapp"]),
  value: z.string().trim().min(1).max(200),
  label: z.string().trim().max(50).optional(),
  isPrimary: z.boolean().optional()
});

const zUpdateClientContactSchema = z.object({
  type: z.enum(["telefono", "email", "whatsapp"]).optional(),
  value: z.string().trim().min(1).max(200).optional(),
  label: z.string().trim().max(50).optional().nullable(),
  isPrimary: z.boolean().optional()
});

const zCreateClientNoteSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  replacesNoteId: z.string().uuid().optional()
});
