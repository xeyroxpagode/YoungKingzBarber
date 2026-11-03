import type { Actor } from "../iam/authorization.js";
import { rows, sql } from "../../lib/sql.js";

type ProfileRow = {
  id: string; businessId: string; name: string; firstName: string | null; lastName: string | null;
  lifecycleState: string; revision: number | string; idempotencyKey: string | null;
  createdAt: string; updatedAt: string;
};
type ContactRow = {
  id: string; businessId: string; clientProfileId: string; type: string; value: string;
  normalizedValue: string; label: string | null; isPrimary: boolean; createdAt: Date; updatedAt: Date;
};
type NoteRow = {
  id: string; businessId: string; clientProfileId: string; text: string; authorId: string;
  authorName: string; createdAt: Date; replacesNoteId: string | null;
};
type LinkRow = {
  id: string; businessId: string; clientProfileId: string; accountId: string; authMethod: string;
  evidenceReference: string; authorityId: string; authorityName: string; linkedAt: Date;
  revokedAt: Date | null; auditReference: string;
};

/**
 * Búsqueda paginada de perfiles de cliente de un Business.
 * Filtro obligatorio por Business (tenant-safe). Orden estable:
 * updated_at desc, id asc. Cursor compatible con ese orden.
 * Admite teléfonos compartidos: cada ficha es un resultado distinto.
 * Nunca expone perfiles de otro Business (U01-INV-15).
 */
export async function searchClientProfiles(actor: Actor, input: { q?: string; cursor?: string; limit: number }) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const q = input.q?.trim();

  const base = sql`from clients.client_profiles where business_id = ${actor.businessId} and lifecycle_state = 'active'`;
  const where = q
    ? sql`and (lower(name) like lower(${`%${q}%`}) or lower(coalesce(first_name,'')) like lower(${`%${q}%`}) or lower(coalesce(last_name,'')) like lower(${`%${q}%`}))`
    : sql``;

  const [totalRow] = await rows<{ count: string }>(sql`
    select count(*)::int count ${base} ${where}`);
  const total = Number(totalRow!.count);

  const cursorWhere = input.cursor
    ? sql`and (updated_at, id) < (select updated_at, id from clients.client_profiles where id = ${input.cursor})`
    : sql``;

  const items = await rows<ProfileRow>(sql`
    select id, business_id "businessId", name, first_name "firstName", last_name "lastName",
           lifecycle_state "lifecycleState", revision, idempotency_key "idempotencyKey",
           created_at "createdAt", updated_at "updatedAt"
    ${base} ${where} ${cursorWhere}
    order by updated_at desc, id asc
    limit ${limit + 1}`);

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]!.id : null;

  return {
    items: page.map((row) => ({
      id: row.id, businessId: row.businessId, name: row.name,
      firstName: row.firstName ?? undefined, lastName: row.lastName ?? undefined,
      lifecycleState: row.lifecycleState as "active" | "archived",
      revision: Number(row.revision), createdAt: String(row.createdAt), updatedAt: String(row.updatedAt)
    })),
    nextCursor,
    total
  };
}

/** Detalle autorizado de un perfil. Devuelve null si no existe o es de otro Business. */
export async function getClientProfile(actor: Actor, clientProfileId: string): Promise<ProfileRow | null> {
  const [row] = await rows<ProfileRow>(sql`
    select id, business_id "businessId", name, first_name "firstName", last_name "lastName",
           lifecycle_state "lifecycleState", revision, idempotency_key "idempotencyKey",
           created_at "createdAt", updated_at "updatedAt"
    from clients.client_profiles
    where business_id = ${actor.businessId} and id = ${clientProfileId} and lifecycle_state = 'active'`);

  return row ?? null;
}

export async function listClientContacts(actor: Actor, clientProfileId: string) {
  // Verificar que el perfil pertenece al Business (tenant-safe).
  const profile = await getClientProfile(actor, clientProfileId);
  if (!profile) return null;

  const contacts = await rows<ContactRow>(sql`
    select id, business_id "businessId", client_profile_id "clientProfileId", type, value,
           normalized_value "normalizedValue", label, is_primary "isPrimary",
           created_at "createdAt", updated_at "updatedAt"
    from clients.client_contacts
    where business_id = ${actor.businessId} and client_profile_id = ${clientProfileId}
    order by is_primary desc, created_at asc`);
  return contacts;
}

export async function listClientNotes(actor: Actor, clientProfileId: string) {
  const profile = await getClientProfile(actor, clientProfileId);
  if (!profile) return null;

  const notes = await rows<NoteRow>(sql`
    select id, business_id "businessId", client_profile_id "clientProfileId", text,
           author_id "authorId", author_name "authorName", created_at "createdAt",
           replaces_note_id "replacesNoteId"
    from clients.client_notes
    where business_id = ${actor.businessId} and client_profile_id = ${clientProfileId}
    order by created_at desc`);
  return notes;
}

export async function listClientAccountLinks(actor: Actor, clientProfileId: string) {
  const profile = await getClientProfile(actor, clientProfileId);
  if (!profile) return null;

  const links = await rows<LinkRow>(sql`
    select id, business_id "businessId", client_profile_id "clientProfileId", account_id "accountId",
           auth_method "authMethod", evidence_reference "evidenceReference",
           authority_id "authorityId", authority_name "authorityName",
           linked_at "linkedAt", revoked_at "revokedAt", audit_reference "auditReference"
    from clients.client_account_links
    where business_id = ${actor.businessId} and client_profile_id = ${clientProfileId}
    order by linked_at desc`);
  return links;
}
