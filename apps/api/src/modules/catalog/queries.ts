import type { Actor } from "../iam/authorization.js";
import type { CommercialTerms } from "@youngkingz/contracts";
import { DomainError } from "@youngkingz/contracts";
import { rows, sql } from "../../lib/sql.js";
import { derivePublishability } from "./domain.js";

type ServiceRow = {
  id: string; name: string; description: string | null; categoryId: string | null;
  categoryName: string | null; categoryLifecycle: "ACTIVE" | "ARCHIVED" | null;
  lifecycle: "ACTIVE" | "ARCHIVED"; publication: "UNPUBLISHED" | "PUBLISHED";
  revision: number | string; createdAt: Date; updatedAt: Date;
  termsId: string | null; versionNumber: number | string | null; priceMinor: number | string | null;
  currency: "ARS" | null; durationMinutes: number | null; preBufferMinutes: number | null;
  postBufferMinutes: number | null; conditions: string | null; effectiveFrom: Date | null;
};

function termsFrom(row: ServiceRow): (CommercialTerms & { id: string; versionNumber: number; effectiveFrom: Date }) | null {
  if (!row.termsId || row.priceMinor === null || !row.currency || !row.durationMinutes || row.versionNumber === null || !row.effectiveFrom) return null;
  return {
    id: row.termsId,
    versionNumber: Number(row.versionNumber),
    money: { amountMinor: Number(row.priceMinor), currency: row.currency },
    durationMinutes: Number(row.durationMinutes),
    preBufferMinutes: Number(row.preBufferMinutes ?? 0),
    postBufferMinutes: Number(row.postBufferMinutes ?? 0),
    conditions: row.conditions,
    effectiveFrom: row.effectiveFrom
  };
}

function serviceDto(row: ServiceRow) {
  const currentTerms = termsFrom(row);
  const state = derivePublishability({
    name: row.name,
    categoryId: row.categoryId,
    categoryLifecycle: row.categoryLifecycle,
    currentTerms,
    lifecycle: row.lifecycle
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.categoryId ? { id: row.categoryId, name: row.categoryName, lifecycle: row.categoryLifecycle } : null,
    lifecycle: row.lifecycle,
    publication: row.publication,
    revision: Number(row.revision),
    ...state,
    currentTerms,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

const serviceSelect = sql`select s.id,s.name,s.description,s.category_id "categoryId",c.name "categoryName",c.lifecycle::text "categoryLifecycle",
  s.lifecycle::text lifecycle,s.publication::text publication,s.revision,s.created_at "createdAt",s.updated_at "updatedAt",
  t.id "termsId",t.version_number "versionNumber",t.price_minor "priceMinor",t.currency,t.duration_minutes "durationMinutes",
  t.pre_buffer_minutes "preBufferMinutes",t.post_buffer_minutes "postBufferMinutes",t.conditions,t.effective_from "effectiveFrom"
  from catalog.services s
  left join catalog.service_categories c on c.business_id=s.business_id and c.id=s.category_id
  left join catalog.service_terms_versions t on t.business_id=s.business_id and t.service_id=s.id and t.id=s.current_terms_version_id`;

export async function listServices(actor: Actor, query: { q?: string; categoryId?: string; lifecycle?: string; publication?: string; cursor?: string; limit: number }) {
  const items = await rows<ServiceRow>(sql`${serviceSelect}
    where s.business_id=${actor.businessId}
      ${query.q ? sql`and s.name ilike ${`%${query.q}%`}` : sql``}
      ${query.categoryId ? sql`and s.category_id=${query.categoryId}` : sql``}
      ${query.lifecycle ? sql`and s.lifecycle::text=${query.lifecycle}` : sql``}
      ${query.publication ? sql`and s.publication::text=${query.publication}` : sql``}
      ${query.cursor ? sql`and s.created_at<${query.cursor}` : sql``}
    order by s.created_at desc,s.id desc limit ${query.limit + 1}`);
  const hasMore = items.length > query.limit;
  const page = hasMore ? items.slice(0, query.limit) : items;
  return { items: page.map(serviceDto), nextCursor: hasMore ? page.at(-1)?.createdAt : null };
}

export async function getService(actor: Actor, serviceId: string) {
  const item = (await rows<ServiceRow>(sql`${serviceSelect} where s.business_id=${actor.businessId} and s.id=${serviceId}`))[0];
  if (!item) throw new DomainError("NOT_FOUND", "Service not found", 404);
  return serviceDto(item);
}

export async function listServiceTermsHistory(actor: Actor, serviceId: string) {
  const service = await rows<{ currentTermsVersionId: string | null }>(sql`select current_terms_version_id "currentTermsVersionId" from catalog.services where business_id=${actor.businessId} and id=${serviceId}`);
  if (!service.length) throw new DomainError("NOT_FOUND", "Service not found", 404);
  const items = await rows<{ id: string; versionNumber: number | string; priceMinor: number | string; currency: "ARS"; durationMinutes: number; preBufferMinutes: number; postBufferMinutes: number; conditions: string | null; effectiveFrom: Date }>(sql`
    select id,version_number "versionNumber",price_minor "priceMinor",currency,duration_minutes "durationMinutes",
      pre_buffer_minutes "preBufferMinutes",post_buffer_minutes "postBufferMinutes",conditions,effective_from "effectiveFrom"
    from catalog.service_terms_versions where business_id=${actor.businessId} and service_id=${serviceId}
    order by version_number desc`);
  return items.map((item) => ({
    id: item.id,
    versionNumber: Number(item.versionNumber),
    money: { amountMinor: Number(item.priceMinor), currency: item.currency },
    durationMinutes: Number(item.durationMinutes),
    preBufferMinutes: Number(item.preBufferMinutes),
    postBufferMinutes: Number(item.postBufferMinutes),
    conditions: item.conditions,
    effectiveFrom: item.effectiveFrom,
    current: item.id === service[0]!.currentTermsVersionId
  }));
}

type CategoryRow = { id: string; name: string; lifecycle: "ACTIVE" | "ARCHIVED"; revision: number | string; activeServiceCount: number | string; publishedServiceCount: number | string; createdAt: Date; updatedAt: Date };
function categoryDto(row: CategoryRow) { return { ...row, revision: Number(row.revision), activeServiceCount: Number(row.activeServiceCount), publishedServiceCount: Number(row.publishedServiceCount) }; }

export async function listCategories(actor: Actor, query: { lifecycle?: string; cursor?: string; limit: number }) {
  const items = await rows<CategoryRow>(sql`select c.id,c.name,c.lifecycle::text lifecycle,c.revision,c.created_at "createdAt",c.updated_at "updatedAt",
    count(s.id) filter(where s.lifecycle='ACTIVE') "activeServiceCount",
    count(s.id) filter(where s.publication='PUBLISHED') "publishedServiceCount"
    from catalog.service_categories c left join catalog.services s on s.business_id=c.business_id and s.category_id=c.id
    where c.business_id=${actor.businessId}
      ${query.lifecycle ? sql`and c.lifecycle::text=${query.lifecycle}` : sql``}
      ${query.cursor ? sql`and c.created_at<${query.cursor}` : sql``}
    group by c.id order by c.created_at desc,c.id desc limit ${query.limit + 1}`);
  const hasMore = items.length > query.limit;
  const page = hasMore ? items.slice(0, query.limit) : items;
  return { items: page.map(categoryDto), nextCursor: hasMore ? page.at(-1)?.createdAt : null };
}

export async function getCategory(actor: Actor, categoryId: string) {
  const item = (await rows<CategoryRow>(sql`select c.id,c.name,c.lifecycle::text lifecycle,c.revision,c.created_at "createdAt",c.updated_at "updatedAt",
    count(s.id) filter(where s.lifecycle='ACTIVE') "activeServiceCount",
    count(s.id) filter(where s.publication='PUBLISHED') "publishedServiceCount"
    from catalog.service_categories c left join catalog.services s on s.business_id=c.business_id and s.category_id=c.id
    where c.business_id=${actor.businessId} and c.id=${categoryId} group by c.id`))[0];
  if (!item) throw new DomainError("NOT_FOUND", "Category not found", 404);
  const services = await rows(sql`select id,name,lifecycle::text lifecycle,publication::text publication,revision from catalog.services where business_id=${actor.businessId} and category_id=${categoryId} order by name`);
  return { ...categoryDto(item), services };
}
