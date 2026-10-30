import { bigint, foreignKey, integer, pgSchema, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const catalogSchema = pgSchema("catalog");
export const catalogLifecycle = catalogSchema.enum("lifecycle", ["ACTIVE", "ARCHIVED"]);
export const catalogPublication = catalogSchema.enum("publication", ["UNPUBLISHED", "PUBLISHED"]);

export const serviceCategories = catalogSchema.table("service_categories", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  name: text("name").notNull(),
  lifecycle: catalogLifecycle("lifecycle").notNull(),
  revision: bigint("revision", { mode: "number" }).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
}, (table) => [unique("catalog_category_business_id_key").on(table.businessId, table.id)]);

export const services = catalogSchema.table("services", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: uuid("category_id"),
  currentTermsVersionId: uuid("current_terms_version_id"),
  lifecycle: catalogLifecycle("lifecycle").notNull(),
  publication: catalogPublication("publication").notNull(),
  revision: bigint("revision", { mode: "number" }).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("catalog_service_business_id_key").on(table.businessId, table.id),
  foreignKey({ columns: [table.businessId, table.categoryId], foreignColumns: [serviceCategories.businessId, serviceCategories.id], name: "catalog_service_category_fk" })
]);

export const serviceTermsVersions = catalogSchema.table("service_terms_versions", {
  id: uuid("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  serviceId: uuid("service_id").notNull(),
  versionNumber: bigint("version_number", { mode: "number" }).notNull(),
  priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  preBufferMinutes: integer("pre_buffer_minutes").notNull(),
  postBufferMinutes: integer("post_buffer_minutes").notNull(),
  conditions: text("conditions"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
}, (table) => [
  unique("catalog_terms_service_version_key").on(table.businessId, table.serviceId, table.versionNumber),
  unique("catalog_terms_pointer_key").on(table.businessId, table.serviceId, table.id),
  foreignKey({ columns: [table.businessId, table.serviceId], foreignColumns: [services.businessId, services.id], name: "catalog_terms_service_fk" }),
  uniqueIndex("catalog_terms_history_idx").on(table.businessId, table.serviceId, table.versionNumber)
]);
