import {
  catalogLifecycleSchema, commercialTermsSchema, createServiceSchema, DomainError,
  replaceCommercialTermsSchema, updateServiceProfileSchema, type CommercialTerms
} from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { commercialTermsEqual, deriveServiceCompleteness } from "./domain.js";

type ServiceRow = {
  id: string; name: string; description: string | null; categoryId: string | null;
  currentTermsVersionId: string | null; lifecycle: "ACTIVE" | "ARCHIVED";
  publication: "UNPUBLISHED" | "PUBLISHED"; revision: number | string;
};
type CategoryRow = { id: string; lifecycle: "ACTIVE" | "ARCHIVED"; name: string };

function stale(service: ServiceRow, expectedRevision: number) {
  if (Number(service.revision) !== expectedRevision) throw new DomainError("STALE_REVISION", "Service revision is stale", 409);
}

function activeService(service: ServiceRow) {
  if (service.lifecycle === "ARCHIVED") throw new DomainError("SERVICE_ARCHIVED", "Archived Services cannot be edited", 409);
}

async function lockService(tx: Tx, actor: Actor, serviceId: string): Promise<ServiceRow> {
  const rows = await tx`select id,name,description,category_id "categoryId",current_terms_version_id "currentTermsVersionId",lifecycle::text lifecycle,publication::text publication,revision from catalog.services where business_id=${actor.businessId} and id=${serviceId} for update` as unknown as ServiceRow[];
  if (!rows[0]) throw new DomainError("NOT_FOUND", "Service not found", 404);
  return rows[0];
}

async function lockActiveCategory(tx: Tx, actor: Actor, categoryId: string): Promise<CategoryRow> {
  const rows = await tx`select id,name,lifecycle::text lifecycle from catalog.service_categories where business_id=${actor.businessId} and id=${categoryId} for update` as unknown as CategoryRow[];
  if (!rows[0]) throw new DomainError("NOT_FOUND", "Category not found", 404);
  if (rows[0].lifecycle !== "ACTIVE") throw new DomainError("CATEGORY_UNAVAILABLE", "Category is not available", 409);
  return rows[0];
}

function termsColumns(terms: CommercialTerms) {
  return {
    priceMinor: terms.money.amountMinor,
    currency: terms.money.currency,
    durationMinutes: terms.durationMinutes,
    preBufferMinutes: terms.preBufferMinutes,
    postBufferMinutes: terms.postBufferMinutes,
    conditions: terms.conditions ?? null
  };
}

async function currentTerms(tx: Tx, actor: Actor, service: ServiceRow): Promise<CommercialTerms | null> {
  if (!service.currentTermsVersionId) return null;
  const rows = await tx`select price_minor "priceMinor",currency,duration_minutes "durationMinutes",pre_buffer_minutes "preBufferMinutes",post_buffer_minutes "postBufferMinutes",conditions from catalog.service_terms_versions where business_id=${actor.businessId} and service_id=${service.id} and id=${service.currentTermsVersionId}` as unknown as { priceMinor: number | string; currency: "ARS"; durationMinutes: number; preBufferMinutes: number; postBufferMinutes: number; conditions: string | null }[];
  const item = rows[0];
  return item ? { money: { amountMinor: Number(item.priceMinor), currency: item.currency }, durationMinutes: Number(item.durationMinutes), preBufferMinutes: Number(item.preBufferMinutes), postBufferMinutes: Number(item.postBufferMinutes), conditions: item.conditions } : null;
}

export async function createService(actor: Actor, raw: unknown, operationId: string) {
  const input = createServiceSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.create", actor, payload: input }, async (tx) => {
    if (input.initialCommercialTerms && !actor.capabilities.has("catalog.services.update_terms")) throw new DomainError("FORBIDDEN", "Missing capability: catalog.services.update_terms", 403);
    if (input.categoryId) await lockActiveCategory(tx, actor, input.categoryId);
    const [service] = await tx`insert into catalog.services(business_id,name,description,category_id) values (${actor.businessId},${input.name},${input.description ?? null},${input.categoryId ?? null}) returning id,name,description,category_id "categoryId",current_terms_version_id "currentTermsVersionId",lifecycle::text lifecycle,publication::text publication,revision` as unknown as ServiceRow[];
    let termsVersion: { id: string; versionNumber: number | string } | undefined;
    if (input.initialCommercialTerms) {
      const terms = termsColumns(input.initialCommercialTerms);
      [termsVersion] = await tx`insert into catalog.service_terms_versions(business_id,service_id,version_number,price_minor,currency,duration_minutes,pre_buffer_minutes,post_buffer_minutes,conditions) values (${actor.businessId},${service!.id},1,${terms.priceMinor},${terms.currency},${terms.durationMinutes},${terms.preBufferMinutes},${terms.postBufferMinutes},${terms.conditions}) returning id,version_number "versionNumber"` as unknown as { id: string; versionNumber: number | string }[];
      await tx`update catalog.services set current_terms_version_id=${termsVersion!.id} where id=${service!.id}`;
    }
    await audit(tx, { actor, operationId, action: "catalog.service.created", capability: "catalog.services.create", resourceType: "SERVICE", resourceId: service!.id, changes: { name: input.name, categoryId: input.categoryId ?? null, initialTerms: Boolean(input.initialCommercialTerms) } });
    return { id: service!.id, revision: 1, lifecycle: "ACTIVE" as const, publication: "UNPUBLISHED" as const, currentTermsVersionId: termsVersion?.id ?? null, changed: true };
  });
}

export async function updateServiceProfile(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = updateServiceProfileSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.update_profile", actor, payload: { serviceId, ...input } }, async (tx) => {
    let category: CategoryRow | null | undefined;
    if (input.categoryId) category = await lockActiveCategory(tx, actor, input.categoryId);
    else if (input.categoryId === null) category = null;
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    activeService(service);
    const next = {
      name: input.name ?? service.name,
      description: input.description === undefined ? service.description : input.description,
      categoryId: input.categoryId === undefined ? service.categoryId : input.categoryId
    };
    if (service.publication === "PUBLISHED") {
      const existingCategory = category === undefined && next.categoryId
        ? (await tx`select id,name,lifecycle::text lifecycle from catalog.service_categories where business_id=${actor.businessId} and id=${next.categoryId}` as unknown as CategoryRow[])[0] ?? null
        : category ?? null;
      const completeness = deriveServiceCompleteness({ name: next.name, categoryId: next.categoryId, categoryLifecycle: existingCategory?.lifecycle ?? null, currentTerms: await currentTerms(tx, actor, service) });
      if (!completeness.complete) throw new DomainError("SERVICE_NOT_PUBLISHABLE", "Published Service must remain complete", 409, { missingRequirements: completeness.missingRequirements });
    }
    const changed = next.name !== service.name || next.description !== service.description || next.categoryId !== service.categoryId;
    if (!changed) return { id: service.id, revision: Number(service.revision), changed: false };
    const [updated] = await tx`update catalog.services set name=${next.name},description=${next.description},category_id=${next.categoryId},revision=revision+1,updated_at=now() where id=${service.id} returning revision` as unknown as { revision: number | string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.profile_updated", capability: "catalog.services.update_profile", resourceType: "SERVICE", resourceId: service.id, changes: { from: { name: service.name, description: service.description, categoryId: service.categoryId }, to: next } });
    return { id: service.id, revision: Number(updated!.revision), changed: true };
  });
}

export async function replaceCommercialTerms(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = replaceCommercialTermsSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.replace_terms", actor, payload: { serviceId, ...input } }, async (tx) => {
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    activeService(service);
    const previous = await currentTerms(tx, actor, service);
    if (commercialTermsEqual(previous, input.terms)) return { id: service.id, revision: Number(service.revision), currentTermsVersionId: service.currentTermsVersionId, changed: false };
    const [{ nextVersion }] = await tx`select coalesce(max(version_number),0)+1 "nextVersion" from catalog.service_terms_versions where business_id=${actor.businessId} and service_id=${service.id}` as unknown as { nextVersion: number | string }[];
    const terms = termsColumns(commercialTermsSchema.parse(input.terms));
    const [version] = await tx`insert into catalog.service_terms_versions(business_id,service_id,version_number,price_minor,currency,duration_minutes,pre_buffer_minutes,post_buffer_minutes,conditions) values (${actor.businessId},${service.id},${Number(nextVersion)},${terms.priceMinor},${terms.currency},${terms.durationMinutes},${terms.preBufferMinutes},${terms.postBufferMinutes},${terms.conditions}) returning id,version_number "versionNumber"` as unknown as { id: string; versionNumber: number | string }[];
    const [updated] = await tx`update catalog.services set current_terms_version_id=${version!.id},revision=revision+1,updated_at=now() where id=${service.id} returning revision` as unknown as { revision: number | string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.terms_changed", capability: "catalog.services.update_terms", resourceType: "SERVICE", resourceId: service.id, changes: { fromVersionId: service.currentTermsVersionId, toVersionId: version!.id, versionNumber: Number(version!.versionNumber) } });
    return { id: service.id, revision: Number(updated!.revision), currentTermsVersionId: version!.id, versionNumber: Number(version!.versionNumber), changed: true };
  });
}

export async function publishService(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.publish", actor, payload: { serviceId, ...input } }, async (tx) => {
    const pre = await tx`select category_id "categoryId" from catalog.services where business_id=${actor.businessId} and id=${serviceId}` as unknown as { categoryId: string | null }[];
    if (!pre[0]) throw new DomainError("NOT_FOUND", "Service not found", 404);
    if (!pre[0].categoryId) throw new DomainError("SERVICE_NOT_PUBLISHABLE", "Service is missing publish requirements", 409, { missingRequirements: ["CATEGORY_REQUIRED"] });
    const category = await lockActiveCategory(tx, actor, pre[0].categoryId);
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    activeService(service);
    if (service.categoryId !== category.id) throw new DomainError("STALE_REVISION", "Service Category changed while publishing", 409);
    const completeness = deriveServiceCompleteness({ name: service.name, categoryId: service.categoryId, categoryLifecycle: category.lifecycle, currentTerms: await currentTerms(tx, actor, service) });
    if (!completeness.complete) throw new DomainError("SERVICE_NOT_PUBLISHABLE", "Service is missing publish requirements", 409, { missingRequirements: completeness.missingRequirements });
    if (service.publication === "PUBLISHED") return { id: service.id, revision: Number(service.revision), publication: service.publication, changed: false };
    const [updated] = await tx`update catalog.services set publication='PUBLISHED',revision=revision+1,updated_at=now() where id=${service.id} returning revision,publication::text publication` as unknown as { revision: number | string; publication: string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.published", capability: "catalog.services.publish", resourceType: "SERVICE", resourceId: service.id, changes: { publication: { from: "UNPUBLISHED", to: "PUBLISHED" } } });
    return { id: service.id, revision: Number(updated!.revision), publication: updated!.publication, changed: true };
  });
}

export async function unpublishService(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.unpublish", actor, payload: { serviceId, ...input } }, async (tx) => {
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    activeService(service);
    if (service.publication === "UNPUBLISHED") return { id: service.id, revision: Number(service.revision), publication: service.publication, changed: false };
    const [updated] = await tx`update catalog.services set publication='UNPUBLISHED',revision=revision+1,updated_at=now() where id=${service.id} returning revision,publication::text publication` as unknown as { revision: number | string; publication: string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.unpublished", capability: "catalog.services.publish", resourceType: "SERVICE", resourceId: service.id, changes: { publication: { from: "PUBLISHED", to: "UNPUBLISHED" } } });
    return { id: service.id, revision: Number(updated!.revision), publication: updated!.publication, changed: true };
  });
}

export async function archiveService(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.archive", actor, payload: { serviceId, ...input } }, async (tx) => {
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    if (service.lifecycle === "ARCHIVED") return { id: service.id, revision: Number(service.revision), lifecycle: service.lifecycle, publication: service.publication, changed: false };
    const [updated] = await tx`update catalog.services set lifecycle='ARCHIVED',publication='UNPUBLISHED',archived_at=now(),revision=revision+1,updated_at=now() where id=${service.id} returning revision,lifecycle::text lifecycle,publication::text publication` as unknown as { revision: number | string; lifecycle: string; publication: string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.archived", capability: "catalog.services.lifecycle", resourceType: "SERVICE", resourceId: service.id, changes: { lifecycle: { from: "ACTIVE", to: "ARCHIVED" }, publication: { from: service.publication, to: "UNPUBLISHED" } } });
    return { id: service.id, revision: Number(updated!.revision), lifecycle: updated!.lifecycle, publication: updated!.publication, changed: true };
  });
}

export async function reactivateService(actor: Actor, serviceId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.service.reactivate", actor, payload: { serviceId, ...input } }, async (tx) => {
    const service = await lockService(tx, actor, serviceId);
    stale(service, input.expectedRevision);
    if (service.lifecycle === "ACTIVE") return { id: service.id, revision: Number(service.revision), lifecycle: service.lifecycle, publication: service.publication, changed: false };
    const [updated] = await tx`update catalog.services set lifecycle='ACTIVE',publication='UNPUBLISHED',archived_at=null,revision=revision+1,updated_at=now() where id=${service.id} returning revision,lifecycle::text lifecycle,publication::text publication` as unknown as { revision: number | string; lifecycle: string; publication: string }[];
    await audit(tx, { actor, operationId, action: "catalog.service.reactivated", capability: "catalog.services.lifecycle", resourceType: "SERVICE", resourceId: service.id, changes: { lifecycle: { from: "ARCHIVED", to: "ACTIVE" }, publication: "UNPUBLISHED" } });
    return { id: service.id, revision: Number(updated!.revision), lifecycle: updated!.lifecycle, publication: updated!.publication, changed: true };
  });
}
