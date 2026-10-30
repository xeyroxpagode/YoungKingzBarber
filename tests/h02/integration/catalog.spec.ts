import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import postgres from "postgres";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../../apps/api/src/app";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? serviceKey;
const db = postgres(databaseUrl, { prepare: false, max: 10 });
const password = "YoungKingz-H02!26";
const suffix = randomUUID().slice(0, 8);
const authUserIds: string[] = [];
let admin: SupabaseClient;
let app: FastifyInstance;
let businessA = "";
let businessB = "";
let ownerToken = "";
let ownerAccountId = "";
let ownerBToken = "";
let receptionistToken = "";
let receptionistStaffId = "";
let receptionistAssignmentId = "";
let barberStaffId = "";
let barberAssignmentId = "";

const terms = (amountMinor: number) => ({ money: { amountMinor, currency: "ARS" }, durationMinutes: 30, preBufferMinutes: 5, postBufferMinutes: 0, conditions: null });

async function signIn(email: string) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.session!.access_token;
}

async function createActor(businessId: string, role: "OWNER" | "RECEPTIONIST" | "BARBER", label: string) {
  const email = `${label}-${suffix}@example.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  authUserIds.push(created.data.user.id);
  const [person] = await db`insert into iam.persons(first_name,last_name) values (${role},'H02') returning id`;
  const [staff] = await db`insert into team.staff_members(business_id,person_id,employment_status,access_status) values (${businessId},${person!.id},'ACTIVE','ACTIVE') returning id`;
  const [account] = await db`insert into iam.user_accounts(person_id,auth_user_id,verified_email,status) values (${person!.id},${created.data.user.id},${email},'ACTIVE') returning id`;
  await db`insert into iam.account_security_states(account_id) values (${account!.id})`;
  await db`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${businessId},${staff!.id})`;
  await db`insert into iam.staff_role_states(business_id,staff_member_id) values (${businessId},${staff!.id})`;
  const [assignment] = await db`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${businessId},${staff!.id},${role},now(),${account!.id}) returning id`;
  return { token: await signIn(email), staffId: staff!.id as string, accountId: account!.id as string, assignmentId: assignment!.id as string };
}

async function request(token: string, method: string, url: string, payload?: unknown, operationId = randomUUID()) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, "x-operation-id": operationId };
  if (payload !== undefined) headers["content-type"] = "application/json";
  const response = await app.inject({ method, url, headers, payload });
  return { status: response.statusCode, body: response.json(), operationId };
}

async function category(token = ownerToken, name = `Category ${randomUUID().slice(0, 6)}`) {
  const response = await request(token, "POST", "/v1/catalog/categories", { name });
  expect(response.status).toBe(200);
  return response.body.data as { id: string; revision: number };
}

async function service(categoryId?: string, initialTerms?: ReturnType<typeof terms>, token = ownerToken) {
  const response = await request(token, "POST", "/v1/catalog/services", { name: `Service ${randomUUID().slice(0, 6)}`, categoryId, initialCommercialTerms: initialTerms });
  expect(response.status).toBe(200);
  return response.body.data as { id: string; revision: number };
}

async function grantReceptionist(capability: string) {
  await db`insert into iam.capability_grants(business_id,staff_member_id,role_assignment_id,capability,granted_by_account_id) values (${businessA},${receptionistStaffId},${receptionistAssignmentId},${capability},${ownerAccountId}) on conflict do nothing`;
}

beforeAll(async () => {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for integration tests");
  admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [businessRowA] = await db`insert into business.businesses(provisioning_key,display_name,timezone,status) values (${`h02-a-${suffix}`},'H02 A','America/Argentina/Buenos_Aires','ACTIVE') returning id`;
  const [businessRowB] = await db`insert into business.businesses(provisioning_key,display_name,timezone,status) values (${`h02-b-${suffix}`},'H02 B','UTC','ACTIVE') returning id`;
  businessA = businessRowA!.id;
  businessB = businessRowB!.id;
  const owner = await createActor(businessA, "OWNER", "owner-a");
  ownerToken = owner.token; ownerAccountId = owner.accountId;
  const ownerB = await createActor(businessB, "OWNER", "owner-b"); ownerBToken = ownerB.token;
  const receptionist = await createActor(businessA, "RECEPTIONIST", "reception");
  receptionistToken = receptionist.token; receptionistStaffId = receptionist.staffId; receptionistAssignmentId = receptionist.assignmentId;
  const barber = await createActor(businessA, "BARBER", "barber"); barberStaffId = barber.staffId; barberAssignmentId = barber.assignmentId;
  app = await buildApp();
}, 60_000);

afterAll(async () => {
  await app?.close();
  for (const businessId of [businessA, businessB]) {
    if (!businessId) continue;
    const staff = await db`select id,person_id from team.staff_members where business_id=${businessId}`;
    const people = staff.map((item) => item.person_id);
    const accounts = people.length ? await db`select id from iam.user_accounts where person_id=any(${people})` : [];
    const accountIds = accounts.map((item) => item.id);
    await db`delete from system.audit_events where business_id=${businessId}`;
    await db`delete from system.operation_attempts where business_id=${businessId}`;
    await db`update catalog.services set current_terms_version_id=null where business_id=${businessId}`;
    await db`delete from catalog.service_terms_versions where business_id=${businessId}`;
    await db`delete from catalog.services where business_id=${businessId}`;
    await db`delete from catalog.service_categories where business_id=${businessId}`;
    await db`delete from iam.access_sessions where business_id=${businessId}`;
    await db`delete from iam.user_context_preferences where business_id=${businessId}`;
    await db`delete from iam.capability_grants where business_id=${businessId}`;
    await db`delete from iam.role_assignments where business_id=${businessId}`;
    await db`delete from iam.staff_role_states where business_id=${businessId}`;
    await db`delete from team.staff_relationship_periods where business_id=${businessId}`;
    await db`delete from team.staff_members where business_id=${businessId}`;
    if (accountIds.length) await db`delete from iam.account_security_states where account_id=any(${accountIds})`;
    if (accountIds.length) await db`delete from iam.user_accounts where id=any(${accountIds})`;
    if (people.length) await db`delete from iam.persons where id=any(${people})`;
    await db`delete from business.businesses where id=${businessId}`;
  }
  for (const id of authUserIds) await admin.auth.admin.deleteUser(id).catch(() => undefined);
  await db.end();
});

describe("H02 P1 database and contracts", () => {
  it("enforces intrinsic Terms constraints and immutable confirmed rows", async () => {
    const c = await category(); const s = await service(c.id, terms(0));
    const [version] = await db`select id from catalog.service_terms_versions where service_id=${s.id}`;
    await expect(db`update catalog.service_terms_versions set price_minor=1 where id=${version!.id}`).rejects.toMatchObject({ code: "55000" });
    await expect(db`insert into catalog.service_terms_versions(business_id,service_id,version_number,price_minor,currency,duration_minutes) values (${businessA},${s.id},2,-1,'ARS',30)`).rejects.toMatchObject({ code: "23514" });
    await expect(db`insert into catalog.service_terms_versions(business_id,service_id,version_number,price_minor,currency,duration_minutes) values (${businessA},${s.id},2,1,'USD',30)`).rejects.toMatchObject({ code: "23514" });
  });

  it("enforces tenant-safe Category and Terms relations", async () => {
    const other = await category(ownerBToken);
    await expect(db`insert into catalog.services(business_id,name,category_id) values (${businessA},'Cross tenant',${other.id})`).rejects.toMatchObject({ code: "23503" });
  });
});

describe("H02 P2 Category matrix", () => {
  it("normalizes active uniqueness, permits archived duplicates, and rejects collision on reactivation", async () => {
    const first = await category(ownerToken, "  Corte  ");
    expect((await request(ownerToken, "POST", "/v1/catalog/categories", { name: "corte" })).body.error.code).toBe("CONFLICT");
    expect((await request(ownerToken, "POST", `/v1/catalog/categories/${first.id}/archive`, { expectedRevision: first.revision })).status).toBe(200);
    await category(ownerToken, "CORTE");
    const collision = await request(ownerToken, "POST", `/v1/catalog/categories/${first.id}/reactivate`, { expectedRevision: first.revision + 1 });
    expect(collision.status).toBe(409); expect(collision.body.error.code).toBe("CONFLICT");
  });

  it("blocks rename while archived and archives unpublished-only impact without touching Service revision", async () => {
    const c = await category(); const s = await service(c.id);
    const archived = await request(ownerToken, "POST", `/v1/catalog/categories/${c.id}/archive`, { expectedRevision: c.revision });
    expect(archived.status).toBe(200);
    const rename = await request(ownerToken, "PATCH", `/v1/catalog/categories/${c.id}`, { name: "No", expectedRevision: c.revision + 1 });
    expect(rename.body.error.code).toBe("CATEGORY_ARCHIVED");
    const current = await request(ownerToken, "GET", `/v1/catalog/services/${s.id}`);
    expect(current.body.revision).toBe(1); expect(current.body.complete).toBe(false); expect(current.body.missingRequirements).toContain("ACTIVE_CATEGORY_REQUIRED");
  });
});

describe("H02 P3 Service and immutable Terms", () => {
  it("creates name-only, partial, and complete drafts without auto-publish", async () => {
    const draft = await service();
    expect((await request(ownerToken, "GET", `/v1/catalog/services/${draft.id}`)).body).toMatchObject({ complete: false, publication: "UNPUBLISHED", revision: 1 });
    const c = await category(); const complete = await service(c.id, terms(10_000));
    expect((await request(ownerToken, "GET", `/v1/catalog/services/${complete.id}`)).body).toMatchObject({ complete: true, publication: "UNPUBLISHED", revision: 1 });
  });

  it("preserves monotonic history, detects semantic no-op, and creates v3 on rollback", async () => {
    const c = await category(); const s = await service(c.id, terms(10_000));
    const v2 = await request(ownerToken, "PUT", `/v1/catalog/services/${s.id}/terms`, { expectedRevision: 1, terms: terms(12_000) });
    expect(v2.body.data).toMatchObject({ versionNumber: 2, revision: 2, changed: true });
    const noop = await request(ownerToken, "PUT", `/v1/catalog/services/${s.id}/terms`, { expectedRevision: 2, terms: terms(12_000) });
    expect(noop.body.data).toMatchObject({ revision: 2, changed: false });
    const v3 = await request(ownerToken, "PUT", `/v1/catalog/services/${s.id}/terms`, { expectedRevision: 2, terms: terms(10_000) });
    expect(v3.body.data.versionNumber).toBe(3);
    const history = await request(ownerToken, "GET", `/v1/catalog/services/${s.id}/terms/history`);
    expect(history.body.map((item: { versionNumber: number }) => item.versionNumber)).toEqual([3, 2, 1]);
    expect(history.body.filter((item: { current: boolean }) => item.current)).toHaveLength(1);
  });

  it("rejects stale revisions before a target-state no-op", async () => {
    const c = await category(); const s = await service(c.id, terms(1));
    await request(ownerToken, "PATCH", `/v1/catalog/services/${s.id}/profile`, { expectedRevision: 1, name: "Changed" });
    const stale = await request(ownerToken, "PUT", `/v1/catalog/services/${s.id}/terms`, { expectedRevision: 1, terms: terms(1) });
    expect(stale.body.error.code).toBe("STALE_REVISION");
  });

  it("isolates cross-Business reads, Category assignment, and history", async () => {
    const c = await category(ownerBToken); const s = await service(c.id, terms(5), ownerBToken);
    expect((await request(ownerToken, "GET", `/v1/catalog/services/${s.id}`)).status).toBe(404);
    expect((await request(ownerToken, "GET", `/v1/catalog/services/${s.id}/terms/history`)).status).toBe(404);
    const own = await service();
    expect((await request(ownerToken, "PATCH", `/v1/catalog/services/${own.id}/profile`, { expectedRevision: 1, categoryId: c.id })).status).toBe(404);
  });
});

describe("H02 P4 publication and lifecycle", () => {
  it("publishes only complete active Services and preserves completeness while Published", async () => {
    const draft = await service();
    const blocked = await request(ownerToken, "POST", `/v1/catalog/services/${draft.id}/publish`, { expectedRevision: 1 });
    expect(blocked.body.error).toMatchObject({ code: "SERVICE_NOT_PUBLISHABLE", details: { missingRequirements: ["CATEGORY_REQUIRED"] } });
    const c = await category(); const s = await service(c.id, terms(10));
    const published = await request(ownerToken, "POST", `/v1/catalog/services/${s.id}/publish`, { expectedRevision: 1 });
    expect(published.body.data).toMatchObject({ publication: "PUBLISHED", revision: 2 });
    const incomplete = await request(ownerToken, "PATCH", `/v1/catalog/services/${s.id}/profile`, { expectedRevision: 2, categoryId: null });
    expect(incomplete.body.error.code).toBe("SERVICE_NOT_PUBLISHABLE");
    const archiveCategory = await request(ownerToken, "POST", `/v1/catalog/categories/${c.id}/archive`, { expectedRevision: c.revision });
    expect(archiveCategory.body.error).toMatchObject({ code: "CATEGORY_IN_USE", details: { publishedServiceCount: 1 } });
  });

  it("archives atomically and reactivates unpublished without requiring a valid Category", async () => {
    const c = await category(); const s = await service(c.id, terms(10));
    await request(ownerToken, "POST", `/v1/catalog/services/${s.id}/publish`, { expectedRevision: 1 });
    const archived = await request(ownerToken, "POST", `/v1/catalog/services/${s.id}/archive`, { expectedRevision: 2 });
    expect(archived.body.data).toMatchObject({ lifecycle: "ARCHIVED", publication: "UNPUBLISHED", revision: 3 });
    await request(ownerToken, "POST", `/v1/catalog/categories/${c.id}/archive`, { expectedRevision: 1 });
    const active = await request(ownerToken, "POST", `/v1/catalog/services/${s.id}/reactivate`, { expectedRevision: 3 });
    expect(active.body.data).toMatchObject({ lifecycle: "ACTIVE", publication: "UNPUBLISHED", revision: 4 });
  });

  it.each([
    ["profile/profile", async (id: string, revision: number) => Promise.all([
      request(ownerToken, "PATCH", `/v1/catalog/services/${id}/profile`, { expectedRevision: revision, name: "A" }),
      request(ownerToken, "PATCH", `/v1/catalog/services/${id}/profile`, { expectedRevision: revision, name: "B" })])],
    ["profile/terms", async (id: string, revision: number) => Promise.all([
      request(ownerToken, "PATCH", `/v1/catalog/services/${id}/profile`, { expectedRevision: revision, name: "A" }),
      request(ownerToken, "PUT", `/v1/catalog/services/${id}/terms`, { expectedRevision: revision, terms: terms(22) })])],
    ["terms/terms", async (id: string, revision: number) => Promise.all([
      request(ownerToken, "PUT", `/v1/catalog/services/${id}/terms`, { expectedRevision: revision, terms: terms(22) }),
      request(ownerToken, "PUT", `/v1/catalog/services/${id}/terms`, { expectedRevision: revision, terms: terms(33) })])],
    ["publish/terms", async (id: string, revision: number) => Promise.all([
      request(ownerToken, "POST", `/v1/catalog/services/${id}/publish`, { expectedRevision: revision }),
      request(ownerToken, "PUT", `/v1/catalog/services/${id}/terms`, { expectedRevision: revision, terms: terms(22) })])]
  ])("serializes %s with one revision winner", async (_name, race) => {
    const c = await category(); const s = await service(c.id, terms(11));
    const results = await race(s.id, 1);
    expect(results.map((item) => item.status).sort()).toEqual([200, 409]);
    expect((await db`select count(*)::int count from catalog.service_terms_versions where service_id=${s.id}`)[0]!.count).toBeLessThanOrEqual(2);
  });

  it("serializes publish/category archive and never leaves Published on an archived Category", async () => {
    const c = await category(); const s = await service(c.id, terms(11));
    const results = await Promise.all([
      request(ownerToken, "POST", `/v1/catalog/services/${s.id}/publish`, { expectedRevision: 1 }),
      request(ownerToken, "POST", `/v1/catalog/categories/${c.id}/archive`, { expectedRevision: 1 })
    ]);
    expect(results.map((item) => item.status).sort()).toEqual([200, 409]);
    const [state] = await db`select s.publication::text publication,c.lifecycle::text category_lifecycle from catalog.services s join catalog.service_categories c on c.id=s.category_id where s.id=${s.id}`;
    expect(state!.publication === "PUBLISHED" && state!.category_lifecycle === "ARCHIVED").toBe(false);
  });
});

describe("H02 P3/P5 idempotency, audit, authorization, and operation recovery", () => {
  it("replays Create without duplicate domain effects and fingerprints path IDs", async () => {
    const operationId = randomUUID(); const payload = { name: "Idempotent category" };
    const first = await request(ownerToken, "POST", "/v1/catalog/categories", payload, operationId);
    const replay = await request(ownerToken, "POST", "/v1/catalog/categories", payload, operationId);
    expect(first.status).toBe(200); expect(replay.body.replayed).toBe(true);
    expect((await db`select count(*)::int count from system.audit_events where operation_id=${operationId}`)[0]!.count).toBe(1);
    const c2 = await category();
    const pathOp = randomUUID();
    expect((await request(ownerToken, "POST", `/v1/catalog/categories/${first.body.data.id}/archive`, { expectedRevision: 1 }, pathOp)).status).toBe(200);
    expect((await request(ownerToken, "POST", `/v1/catalog/categories/${c2.id}/archive`, { expectedRevision: 1 }, pathOp)).body.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("persists FAILED operation outcome and allows only own-operation recovery without global capability", async () => {
    await grantReceptionist("catalog.categories.manage");
    const duplicateName = `Failed op ${randomUUID()}`;
    await request(receptionistToken, "POST", "/v1/catalog/categories", { name: duplicateName });
    const failed = await request(receptionistToken, "POST", "/v1/catalog/categories", { name: duplicateName.toUpperCase() });
    expect(failed.status).toBe(409);
    const own = await request(receptionistToken, "GET", `/v1/operations/${failed.operationId}`);
    expect(own.body).toMatchObject({ operationId: failed.operationId, status: "FAILED", responseStatus: 409, errorCode: "CONFLICT" });
    const ownerOperation = (await request(ownerToken, "POST", "/v1/catalog/categories", { name: `Owner op ${randomUUID()}` })).operationId;
    expect((await request(receptionistToken, "GET", `/v1/operations/${ownerOperation}`)).status).toBe(404);
    expect((await request(ownerToken, "GET", `/v1/operations/${ownerOperation}`)).status).toBe(200);
  });

  it("keeps Receptionist read-only by default, delegates management, and rejects Barber grants", async () => {
    expect((await request(receptionistToken, "GET", "/v1/catalog/services")).status).toBe(200);
    const denied = await request(receptionistToken, "POST", "/v1/catalog/services", { name: "Denied" });
    expect(denied.status).toBe(403);
    await grantReceptionist("catalog.services.create");
    const noTerms = await request(receptionistToken, "POST", "/v1/catalog/services", { name: "Reception draft" });
    expect(noTerms.status).toBe(200);
    const withTerms = await request(receptionistToken, "POST", "/v1/catalog/services", { name: "Reception terms", initialCommercialTerms: terms(1) });
    expect(withTerms.status).toBe(403);
    const barberGrant = await request(ownerToken, "POST", `/v1/staff/${barberStaffId}/grants`, { roleAssignmentId: barberAssignmentId, capability: "catalog.services.update_terms" });
    expect(barberGrant.status).toBe(409);
  });
});
