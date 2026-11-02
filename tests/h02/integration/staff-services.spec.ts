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
const password = "YoungKingz-U04!26";
const suffix = randomUUID().slice(0, 8);
const authUserIds: string[] = [];
let admin: SupabaseClient;
let app: FastifyInstance;
let businessA = "";
let businessB = "";
let ownerToken = "";
let _ownerAccountId = "";
let _ownerBToken = "";
let receptionistToken = "";
let _receptionistStaffId = "";
let barberToken = "";
let barberStaffId = "";

async function signIn(email: string) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.session!.access_token;
}

async function purgeTestUsers() {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users) return;
    const victims = data.users.filter((user) => (user.email ?? "").endsWith("@example.test"));
    for (const victim of victims) await admin.auth.admin.deleteUser(victim.id).catch(() => undefined);
    if (data.users.length < 200) return;
  }
}

async function createActor(businessId: string, role: "OWNER" | "RECEPTIONIST" | "BARBER") {
  const email = `${role.toLowerCase()}-${suffix}-${randomUUID().slice(0, 6)}@example.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  authUserIds.push(created.data.user.id);
  const [person] = await db`insert into iam.persons(first_name, last_name) values (${role}, ${suffix}) returning id`;
  const [staff] = await db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE') returning id`;
  const [account] = await db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status) values (${person!.id}, ${created.data.user.id}, ${email}, 'ACTIVE') returning id`;
  await db`insert into iam.account_security_states(account_id) values (${account!.id})`;
  await db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  await db`insert into iam.staff_role_states(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  const [assignment] = await db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${businessId}, ${staff!.id}, ${role}, now(), ${account!.id}) returning id`;
  return { token: await signIn(email), staffId: staff!.id as string, accountId: account!.id as string, assignmentId: assignment!.id as string };
}

async function createStaff(businessId = businessA, status: "ONBOARDING" | "ACTIVE" | "INACTIVE" = "ACTIVE") {
  const [person] = await db`insert into iam.persons(first_name, last_name) values ('Target', ${randomUUID().slice(0, 6)}) returning id`;
  const [staff] = await db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${businessId}, ${person!.id}, ${status}, 'ACTIVE') returning id, revision`;
  await db`insert into iam.staff_role_states(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  if (status !== "INACTIVE") await db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  return { id: staff!.id as string, revision: Number(staff!.revision) };
}

async function request(token: string, method: string, url: string, payload?: unknown, operationId = randomUUID()) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, "x-operation-id": operationId };
  if (payload !== undefined) headers["content-type"] = "application/json";
  const response = await app.inject({ method, url, headers, payload });
  return { status: response.statusCode, body: response.json(), operationId };
}

beforeAll(async () => {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await purgeTestUsers();
  const [a] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u04-a-${suffix}`}, 'U04 A', 'America/Argentina/Buenos_Aires', 'ACTIVE') returning id`;
  const [b] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u04-b-${suffix}`}, 'U04 B', 'UTC', 'ACTIVE') returning id`;
  businessA = a!.id;
  businessB = b!.id;
  const owner = await createActor(businessA, "OWNER"); ownerToken = owner.token; _ownerAccountId = owner.accountId;
  const ownerB = await createActor(businessB, "OWNER"); _ownerBToken = ownerB.token;
  const reception = await createActor(businessA, "RECEPTIONIST"); receptionistToken = reception.token; _receptionistStaffId = reception.staffId;
  const barber = await createActor(businessA, "BARBER"); barberToken = barber.token; barberStaffId = barber.staffId;
  app = await buildApp();
}, 60_000);

afterAll(async () => {
  await app?.close();
  for (const businessId of [businessA, businessB]) {
    if (!businessId) continue;
    await db`delete from team.staff_service_assignments where business_id = ${businessId}`;
    await db`delete from team.staff_service_sets where business_id = ${businessId}`;
    await db`delete from catalog.services where business_id = ${businessId}`;
    const staff = await db`select id, person_id from team.staff_members where business_id = ${businessId}`;
    const people = staff.map((item) => item.person_id);
    const accounts = people.length ? await db`select id from iam.user_accounts where person_id = any(${people})` : [];
    const accountIds = accounts.map((item) => item.id);
    await db`delete from system.audit_events where business_id = ${businessId}`;
    await db`delete from system.operation_attempts where business_id = ${businessId}`;
    await db`delete from iam.access_sessions where business_id = ${businessId}`;
    await db`delete from iam.role_assignments where business_id = ${businessId}`;
    await db`delete from iam.staff_role_states where business_id = ${businessId}`;
    await db`delete from team.staff_relationship_periods where business_id = ${businessId}`;
    await db`delete from team.staff_members where business_id = ${businessId}`;
    if (accountIds.length) await db`delete from iam.account_security_states where account_id = any(${accountIds})`;
    if (accountIds.length) await db`delete from iam.user_accounts where id = any(${accountIds})`;
    if (people.length) await db`delete from iam.persons where id = any(${people})`;
    await db`delete from business.businesses where id = ${businessId}`;
  }
  for (const id of authUserIds) await admin.auth.admin.deleteUser(id).catch(() => undefined);
  await db.end();
});

describe("H02.U04 staff-services read model", () => {
  it("missing set reports revision 0 and empty serviceIds", async () => {
    const target = await createStaff();
    const [detail, my] = await Promise.all([
      request(ownerToken, "GET", `/v1/staff/${target.id}/services`),
      request(barberToken, "GET", "/v1/staff-services/me")
    ]);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ staffMemberId: target.id, revision: 0, serviceIds: [], services: [] });
    expect(my.status).toBe(200);
    expect(my.body.services).toEqual([]);
  });

  it("read does not create persistence", async () => {
    const target = await createStaff();
    await request(ownerToken, "GET", `/v1/staff/${target.id}/services`);
    const [count] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(count!.count).toBe(0);
  });

  it("receptionist can read but not manage", async () => {
    const target = await createStaff();
    expect((await request(receptionistToken, "GET", `/v1/staff/${target.id}/services`)).status).toBe(200);
    expect((await request(receptionistToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [] })).status).toBe(403);
  });

  it("barber self-read works, other staff read forbidden, manage forbidden", async () => {
    const target = await createStaff();
    const my = await request(barberToken, "GET", "/v1/staff-services/me");
    expect(my.status).toBe(200);
    expect(my.body).toMatchObject({ staffMemberId: barberStaffId });
    expect((await request(barberToken, "GET", `/v1/staff/${target.id}/services`)).status).toBe(403);
    expect((await request(barberToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [] })).status).toBe(403);
  });

  it("cross-business staff is NOT_FOUND", async () => {
    const target = await createStaff(businessB);
    expect((await request(ownerToken, "GET", `/v1/staff/${target.id}/services`)).status).toBe(404);
  });
});

describe("H02.U04 replace flow, revision, no-op, clear", () => {
  it("first write creates set revision 1", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    // Insert services directly so they exist for the replace validation.
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'UNPUBLISHED')`;
    const created = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB] });
    expect(created.status).toBe(200);
    expect(created.body.data).toMatchObject({ staffMemberId: target.id, revision: 1, changed: true, serviceIds: [svcA, svcB].sort() });

    const [setCount] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(setCount!.count).toBe(1);
    const [asgCount] = await db`select count(*)::int count from team.staff_service_assignments where staff_service_set_id = (select id from team.staff_service_sets where staff_member_id = ${target.id})`;
    expect(asgCount!.count).toBe(2);
  });

  it("replace increments revision", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    const svcC = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcC}, 'Svc C', 'ACTIVE', 'PUBLISHED')`;
    const first = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB] });
    expect(first.status).toBe(200);
    const replaced = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 1, serviceIds: [svcB, svcC] });
    expect(replaced.status).toBe(200);
    expect(replaced.body.data).toMatchObject({ revision: 2, changed: true, serviceIds: [svcB, svcC].sort() });
  });

  it("same canonical set is no-op (no revision bump, no audit)", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED')`;
    const first = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB] });
    expect(first.status).toBe(200);
    const before = (await request(ownerToken, "GET", `/v1/staff/${target.id}/services`)).body;
    const noop = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 1, serviceIds: [svcB, svcA] });
    expect(noop.status).toBe(200);
    expect(noop.body.data).toMatchObject({ revision: 1, changed: false, serviceIds: [svcA, svcB].sort() });
    const after = (await request(ownerToken, "GET", `/v1/staff/${target.id}/services`)).body;
    expect(after.revision).toBe(before.revision);
  });

  it("duplicate input collapses to same semantics", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED')`;
    const dup = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB, svcA] });
    expect(dup.status).toBe(400); // duplicate ids rejected by schema
  });

  it("clear existing set increments revision and preserves parent", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED')`;
    const first = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB] });
    expect(first.status).toBe(200);
    const cleared = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 1, serviceIds: [] });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data).toMatchObject({ revision: 2, changed: true, serviceIds: [] });
    const [setCount] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(setCount!.count).toBe(1);
    const [asgCount] = await db`select count(*)::int count from team.staff_service_assignments where staff_service_set_id = (select id from team.staff_service_sets where staff_member_id = ${target.id})`;
    expect(asgCount!.count).toBe(0);
  });

  it("empty first write with target [] does not create parent row", async () => {
    const target = await createStaff();
    const result = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [] });
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ revision: 0, changed: false, serviceIds: [] });
    const [setCount] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(setCount!.count).toBe(0);
  });
});

describe("H02.U04 staff lifecycle", () => {
  it("ONBOARDING and ACTIVE are editable; INACTIVE is rejected", async () => {
    const svc = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svc}, 'Svc', 'ACTIVE', 'PUBLISHED')`;
    const onboarding = await createStaff(businessA, "ONBOARDING");
    const active = await createStaff(businessA, "ACTIVE");
    const inactive = await createStaff(businessA, "INACTIVE");
    expect((await request(ownerToken, "PUT", `/v1/staff/${onboarding.id}/services`, { expectedRevision: 0, serviceIds: [svc] })).status).toBe(200);
    expect((await request(ownerToken, "PUT", `/v1/staff/${active.id}/services`, { expectedRevision: 0, serviceIds: [svc] })).status).toBe(200);
    expect((await request(ownerToken, "PUT", `/v1/staff/${inactive.id}/services`, { expectedRevision: 0, serviceIds: [svc] })).status).toBe(409);
  });
});

describe("H02.U04 tenancy", () => {
  it("cross-business service is NOT_FOUND and mixed input rolls back fully", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessB}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED')`;
    const mixed = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA, svcB] });
    expect(mixed.status).toBe(404);
    const [setCount] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(setCount!.count).toBe(0);
  });
});

describe("H02.U04 concurrency", () => {
  it("existing revision race: one success, one STALE_REVISION", async () => {
    const target = await createStaff();
    const svc = randomUUID();
    const svc2 = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svc}, 'Svc', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svc2}, 'Svc2', 'ACTIVE', 'PUBLISHED')`;
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] });
    const current = (await request(ownerToken, "GET", `/v1/staff/${target.id}/services`)).body;
    // A y B son ambas mutaciones genuinas sobre la misma revisión esperada: exactamente una debe ganar.
    const [a, b] = await Promise.all([
      request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: current.revision, serviceIds: [svc2] }),
      request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: current.revision, serviceIds: [] })
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect([a.body.error?.code, b.body.error?.code]).toContain("STALE_REVISION");
    const [count] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(count!.count).toBe(1);
    const [setRow] = await db`select revision from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(Number(setRow!.revision)).toBe(2);
  });

  it("first-write race: one creates revision 1, one gets STALE_REVISION", async () => {
    const target = await createStaff();
    const svc = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svc}, 'Svc', 'ACTIVE', 'PUBLISHED')`;
    const [a, b] = await Promise.all([
      request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] }),
      request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] })
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect([a.body.error?.code, b.body.error?.code]).toContain("STALE_REVISION");
    const [count] = await db`select count(*)::int count from team.staff_service_sets where staff_member_id = ${target.id}`;
    expect(count!.count).toBe(1);
  });
});

describe("H02.U04 idempotency", () => {
  it("same operation replay returns replayed:true without duplicate audit", async () => {
    const target = await createStaff();
    const svc = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svc}, 'Svc', 'ACTIVE', 'PUBLISHED')`;
    const operation = randomUUID();
    const first = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] }, operation);
    expect(first.status).toBe(200);
    expect(first.body.replayed).toBe(false);
    const replay = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] }, operation);
    expect(replay.status).toBe(200);
    expect(replay.body.replayed).toBe(true);
    const [setRow] = await db`select id from team.staff_service_sets where staff_member_id = ${target.id}`;
    const [auditCount] = await db`select count(*)::int count from system.audit_events where action = 'staff.services.replaced' and resource_id = ${setRow!.id}`;
    expect(auditCount!.count).toBe(1);
  });

  it("same operationId with different payload conflicts", async () => {
    const target = await createStaff();
    const svcA = randomUUID();
    const svcB = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svcA}, 'Svc A', 'ACTIVE', 'PUBLISHED'), (${businessA}, ${svcB}, 'Svc B', 'ACTIVE', 'PUBLISHED')`;
    const operation = randomUUID();
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcA] }, operation);
    const conflict = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svcB] }, operation);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });
});

describe("H02.U04 audit", () => {
  it("effective replace produces exactly one domain audit; no-op produces none", async () => {
    const target = await createStaff();
    const svc = randomUUID();
    await db`insert into catalog.services(business_id, id, name, lifecycle, publication) values (${businessA}, ${svc}, 'Svc', 'ACTIVE', 'PUBLISHED')`;
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 0, serviceIds: [svc] });
    const [setRow] = await db`select id from team.staff_service_sets where staff_member_id = ${target.id}`;
    const [count] = await db`select count(*)::int count from system.audit_events where action = 'staff.services.replaced' and resource_id = ${setRow!.id}`;
    expect(count!.count).toBe(1);
    const noop = await request(ownerToken, "PUT", `/v1/staff/${target.id}/services`, { expectedRevision: 1, serviceIds: [svc] });
    expect(noop.body.data.changed).toBe(false);
    const [countAfter] = await db`select count(*)::int count from system.audit_events where action = 'staff.services.replaced' and resource_id = ${setRow!.id}`;
    expect(countAfter!.count).toBe(1);
  });
});
