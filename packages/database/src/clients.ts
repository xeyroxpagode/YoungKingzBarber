import { bigint, boolean, check, foreignKey, pgSchema, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * H03.U01 · Clientes / CRM · esquema Drizzle.
 *
 * Esquema `clients`, aislado por Business mediante `business_id` en cada tabla
 * y FKs tenant-safe (composite `business_id + id` sobre client_profiles).
 *
 * Reglas de integridad reflejadas aquí (no solo en Zod):
 *  · ClientProfile: nombre no vacío tras normalizar espacios; revision >= 1;
 *    lifecycle en ('active','archived'); unique (business_id, id).
 *  · ClientContact: tipo en ('telefono','email','whatsapp'); unique exacto
 *    (business_id, client_profile_id, type, normalized_value) para evitar
 *    duplicados innecesarios dentro de una ficha; FK tenant-safe a
 *    client_profiles(business_id, id).
 *  · ClientNote: texto no vacío; replaces_note_id apunta a nota previa
 *    (historia trazable, sin UPDATE destructivo); FK tenant-safe.
 *  · ClientAccountLink: auth_method en ('staff-verified','document','pending-u02');
 *    no es 1:1 global; FK tenant-safe a client_profiles y a iam.user_accounts.
 *  · Todas las tablas: RLS habilitado en la migración SQL; acceso vía backend
 *    autorizado, nunca expuesto directamente.
 */

export const clientsSchema = pgSchema("clients");

/* ── Proyecciones mínimas para FKs tenant-safe sin importar schema.ts ────── */

const clientsBusinesses = clientsSchema.table("businesses", {
  id: uuid("id").notNull()
}, (table) => [unique("clients_businesses_id_key").on(table.id)]);

const clientsUserAccounts = clientsSchema.table("user_accounts", {
  id: uuid("id").notNull()
}, (table) => [unique("clients_user_accounts_id_key").on(table.id)]);

/* ── ClientProfile ── */

export const clientProfiles = clientsSchema.table("client_profiles", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  lifecycleState: text("lifecycle_state").notNull().default("active"),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("client_profiles_business_id_key").on(table.businessId, table.id),
  foreignKey({
    columns: [table.businessId],
    foreignColumns: [clientsBusinesses.id],
    name: "client_profiles_business_fk"
  }).onDelete("restrict"),
  check("client_profiles_name_check", sql`length(trim(${table.name})) > 0`),
  check("client_profiles_lifecycle_check", sql`${table.lifecycleState} in ('active','archived')`),
  check("client_profiles_revision_check", sql`${table.revision} >= 1`)
]);

/* ── ClientContact ── */

export const clientContacts = clientsSchema.table("client_contacts", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  clientProfileId: uuid("client_profile_id").notNull(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  normalizedValue: text("normalized_value").notNull(),
  label: text("label"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("client_contacts_unique_exact_key").on(table.businessId, table.clientProfileId, table.type, table.normalizedValue),
  foreignKey({
    columns: [table.businessId, table.clientProfileId],
    foreignColumns: [clientProfiles.businessId, clientProfiles.id],
    name: "client_contacts_profile_fk"
  }).onDelete("cascade"),
  check("client_contacts_type_check", sql`${table.type} in ('telefono','email','whatsapp')`)
]);

/* ── ClientNote ── */

export const clientNotes = clientsSchema.table("client_notes", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  clientProfileId: uuid("client_profile_id").notNull(),
  text: text("text").notNull(),
  authorId: uuid("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  replacesNoteId: uuid("replaces_note_id")
}, (table) => [
  foreignKey({
    columns: [table.businessId, table.clientProfileId],
    foreignColumns: [clientProfiles.businessId, clientProfiles.id],
    name: "client_notes_profile_fk"
  }).onDelete("cascade"),
  check("client_notes_text_check", sql`length(trim(${table.text})) > 0`)
]);

/* ── ClientAccountLink ── */

export const clientAccountLinks = clientsSchema.table("client_account_links", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  clientProfileId: uuid("client_profile_id").notNull(),
  accountId: uuid("account_id").notNull(),
  authMethod: text("auth_method").notNull(),
  evidenceReference: text("evidence_reference").notNull(),
  authorityId: uuid("authority_id").notNull(),
  authorityName: text("authority_name").notNull(),
  linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  auditReference: text("audit_reference").notNull()
}, (table) => [
  unique("client_account_links_business_profile_account_key").on(table.businessId, table.clientProfileId, table.accountId),
  foreignKey({
    columns: [table.businessId, table.clientProfileId],
    foreignColumns: [clientProfiles.businessId, clientProfiles.id],
    name: "client_account_links_profile_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.accountId],
    foreignColumns: [clientsUserAccounts.id],
    name: "client_account_links_account_fk"
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.authorityId],
    foreignColumns: [clientsUserAccounts.id],
    name: "client_account_links_authority_fk"
  }).onDelete("restrict"),
  check("client_account_links_auth_method_check", sql`${table.authMethod} in ('staff-verified','document','pending-u02')`)
]);
