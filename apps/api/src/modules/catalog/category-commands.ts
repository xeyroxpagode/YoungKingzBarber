import { catalogLifecycleSchema, createCategorySchema, DomainError, renameCategorySchema } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { categoryNameNormalization } from "./domain.js";

type CategoryRow = { id: string; name: string; lifecycle: "ACTIVE" | "ARCHIVED"; revision: number | string };

function stale(row: CategoryRow, expectedRevision: number) {
  if (Number(row.revision) !== expectedRevision) throw new DomainError("STALE_REVISION", "Category revision is stale", 409);
}

function uniqueConflict(error: unknown): never {
  if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
    throw new DomainError("CONFLICT", "An active Category with this name already exists", 409);
  }
  throw error;
}

async function lockedCategory(tx: Tx, actor: Actor, categoryId: string): Promise<CategoryRow> {
  const rows = await tx`select id,name,lifecycle::text lifecycle,revision from catalog.service_categories where business_id=${actor.businessId} and id=${categoryId} for update` as unknown as CategoryRow[];
  if (!rows[0]) throw new DomainError("NOT_FOUND", "Category not found", 404);
  return rows[0];
}

export async function createCategory(actor: Actor, raw: unknown, operationId: string) {
  const input = createCategorySchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.category.create", actor, payload: input }, async (tx) => {
    let category: CategoryRow;
    try {
      [category] = await tx`insert into catalog.service_categories(business_id,name) values (${actor.businessId},${input.name}) returning id,name,lifecycle::text lifecycle,revision` as unknown as CategoryRow[];
    } catch (error) { uniqueConflict(error); }
    await audit(tx, { actor, operationId, action: "catalog.category.created", capability: "catalog.categories.manage", resourceType: "SERVICE_CATEGORY", resourceId: category!.id, changes: { name: input.name } });
    return { ...category!, revision: Number(category!.revision), changed: true };
  });
}

export async function renameCategory(actor: Actor, categoryId: string, raw: unknown, operationId: string) {
  const input = renameCategorySchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.category.rename", actor, payload: { categoryId, ...input } }, async (tx) => {
    const category = await lockedCategory(tx, actor, categoryId);
    stale(category, input.expectedRevision);
    if (category.lifecycle === "ARCHIVED") throw new DomainError("CATEGORY_ARCHIVED", "Archived Categories cannot be renamed", 409);
    if (categoryNameNormalization(category.name) === categoryNameNormalization(input.name)) return { id: category.id, revision: Number(category.revision), changed: false };
    let updated: CategoryRow;
    try {
      [updated] = await tx`update catalog.service_categories set name=${input.name},revision=revision+1,updated_at=now() where id=${category.id} returning id,name,lifecycle::text lifecycle,revision` as unknown as CategoryRow[];
    } catch (error) { uniqueConflict(error); }
    await audit(tx, { actor, operationId, action: "catalog.category.renamed", capability: "catalog.categories.manage", resourceType: "SERVICE_CATEGORY", resourceId: categoryId, changes: { from: category.name, to: input.name } });
    return { ...updated!, revision: Number(updated!.revision), changed: true };
  });
}

export async function archiveCategory(actor: Actor, categoryId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.category.archive", actor, payload: { categoryId, ...input } }, async (tx) => {
    const category = await lockedCategory(tx, actor, categoryId);
    stale(category, input.expectedRevision);
    if (category.lifecycle === "ARCHIVED") return { id: category.id, revision: Number(category.revision), lifecycle: category.lifecycle, changed: false };
    const [{ count }] = await tx`select count(*)::int count from catalog.services where business_id=${actor.businessId} and category_id=${categoryId} and publication='PUBLISHED'` as unknown as { count: number }[];
    if (Number(count) > 0) throw new DomainError("CATEGORY_IN_USE", "Category is used by Published Services", 409, { publishedServiceCount: Number(count) });
    const [updated] = await tx`update catalog.service_categories set lifecycle='ARCHIVED',archived_at=now(),revision=revision+1,updated_at=now() where id=${categoryId} returning id,lifecycle::text lifecycle,revision` as unknown as CategoryRow[];
    await audit(tx, { actor, operationId, action: "catalog.category.archived", capability: "catalog.categories.manage", resourceType: "SERVICE_CATEGORY", resourceId: categoryId, changes: { lifecycle: { from: "ACTIVE", to: "ARCHIVED" } } });
    return { ...updated!, revision: Number(updated!.revision), changed: true };
  });
}

export async function reactivateCategory(actor: Actor, categoryId: string, raw: unknown, operationId: string) {
  const input = catalogLifecycleSchema.parse(raw);
  return executeOperation({ operationId, command: "catalog.category.reactivate", actor, payload: { categoryId, ...input } }, async (tx) => {
    const category = await lockedCategory(tx, actor, categoryId);
    stale(category, input.expectedRevision);
    if (category.lifecycle === "ACTIVE") return { id: category.id, revision: Number(category.revision), lifecycle: category.lifecycle, changed: false };
    let updated: CategoryRow;
    try {
      [updated] = await tx`update catalog.service_categories set lifecycle='ACTIVE',archived_at=null,revision=revision+1,updated_at=now() where id=${categoryId} returning id,name,lifecycle::text lifecycle,revision` as unknown as CategoryRow[];
    } catch (error) { uniqueConflict(error); }
    await audit(tx, { actor, operationId, action: "catalog.category.reactivated", capability: "catalog.categories.manage", resourceType: "SERVICE_CATEGORY", resourceId: categoryId, changes: { lifecycle: { from: "ARCHIVED", to: "ACTIVE" } } });
    return { ...updated!, revision: Number(updated!.revision), changed: true };
  });
}
