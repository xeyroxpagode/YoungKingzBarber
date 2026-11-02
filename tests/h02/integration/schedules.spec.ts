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
const password = "YoungKingz-U03!26";
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
let barberToken = "";
let barberStaffId = "";
let barberAssignmentId = "";
let multiToken = "";
let multiStaffId = "";
let multiBarberAssignmentId = "";

async function signIn(email: string) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.session!.access_token;
}
// Purge orphaned throwaway identities from any previously aborted run so createUser
// never collides on a claimable email.
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
const day = (pairs: [string, string][]) => pairs.map(([start, end]) => ({ start, end }));
const week = (MONDAY: [string, string][] = [], TUESDAY: [string, string][] = []) => ({ MONDAY: day(MONDAY), TUESDAY: day(TUESDAY) });

beforeAll(async () => {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await purgeTestUsers();
  const [a] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u03-a-${suffix}`}, 'U03 A', 'America/Argentina/Buenos_Aires', 'ACTIVE') returning id`;
  const [b] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u03-b-${suffix}`}, 'U03 B', 'UTC', 'ACTIVE') returning id`;
  businessA = a!.id;
  businessB = b!.id;
  const owner = await createActor(businessA, "OWNER"); ownerToken = owner.token; ownerAccountId = owner.accountId;
  const ownerB = await createActor(businessB, "OWNER"); ownerBToken = ownerB.token;
  const reception = await createActor(businessA, "RECEPTIONIST"); receptionistToken = reception.token; receptionistStaffId = reception.staffId; receptionistAssignmentId = reception.assignmentId;
  const barber = await createActor(businessA, "BARBER"); barberToken = barber.token; barberStaffId = barber.staffId; barberAssignmentId = barber.assignmentId;
  app = await buildApp();
}, 60_000);

afterAll(async () => {
  await app?.close();
  for (const businessId of [businessA, businessB]) {
    if (!businessId) continue;
    await db`delete from team.staff_schedule_intervals where business_id = ${businessId}`;
    await db`delete from team.staff_weekly_schedules where business_id = ${businessId}`;
    const staff = await db`select id, person_id from team.staff_members where business_id = ${businessId}`;
    const people = staff.map((item) => item.person_id);
    const accounts = people.length ? await db`select id from iam.user_accounts where person_id = any(${people})` : [];
    const accountIds = accounts.map((item) => item.id);
    await db`delete from system.audit_events where business_id = ${businessId}`;
    await db`delete from system.operation_attempts where business_id = ${businessId}`;
    await db`delete from team.professional_profiles where business_id = ${businessId}`;
    await db`delete from iam.access_sessions where business_id = ${businessId}`;
    await db`delete from iam.user_context_preferences where business_id = ${businessId}`;
    await db`delete from iam.capability_grants where business_id = ${businessId}`;
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

describe("H02.U03 schedule reads, ownership, and privacy", () => {
  it("reports revision 0 and an empty seven-day week when no schedule is persisted", async () => {
    const target = await createStaff();
    const [detail, team] = await Promise.all([request(ownerToken, "GET", `/v1/staff/${target.id}/schedule`), request(ownerToken, "GET", "/v1/schedules/team")]);
    expect(detail.body).toMatchObject({ staffMemberId: target.id, revision: 0, hasSchedule: false });
    expect(Object.keys(detail.body.week)).toHaveLength(7);
    expect(team.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ staffMemberId: target.id, hasSchedule: false })]));
  });

  it("never leaks H01 private data through schedule reads", async () => {
    const [team, detail] = await Promise.all([request(receptionistToken, "GET", "/v1/schedules/team"), request(receptionistToken, "GET", `/v1/staff/${barberStaffId}/schedule`)]);
    for (const payload of [team.body, detail.body]) {
      const serialized = JSON.stringify(payload);
      for (const forbidden of ["phone", "email", "accountId", "session", "grant", "secret", "authUserId"]) expect(serialized).not.toContain(forbidden);
    }
    expect(detail.body).not.toHaveProperty("phone");
    expect(detail.body).not.toHaveProperty("email");
    expect(detail.body).not.toHaveProperty("accountId");
  });

  it("exposes schedule read to Owner and Receptionist but hides team reads from Barber", async () => {
    expect((await request(receptionistToken, "GET", "/v1/schedules/team")).status).toBe(200);
    expect((await request(barberToken, "GET", "/v1/schedules/team")).status).toBe(403);
    expect((await request(barberToken, "GET", `/v1/staff/${barberStaffId}/schedule`)).status).toBe(403);
    expect((await request(barberToken, "GET", "/v1/schedules/me")).body).toMatchObject({ staffMemberId: barberStaffId, revision: 0, hasSchedule: false });
  });
});

describe("H02.U03 replace flow, revision, no-op, and clear", () => {
  it("creates on first write, increments on change, ignores semantic no-op, and clears effectively", async () => {
    const target = await createStaff();
    const created = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { ...week([["10:00", "19:00"]]), SATURDAY: [{ start: "09:00", end: "18:00" }] } });
    expect(created.body.data).toMatchObject({ revision: 1, hasSchedule: true, changed: true });
    expect(created.body.data.week.MONDAY).toEqual([{ start: "10:00", end: "19:00" }]);

    const updated = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 1, week: { MONDAY: [{ start: "10:00", end: "13:00" }, { start: "14:00", end: "19:00" }] } });
    expect(updated.body.data).toMatchObject({ revision: 2, changed: true });
    expect(updated.body.data.week.MONDAY).toEqual([{ start: "10:00", end: "13:00" }, { start: "14:00", end: "19:00" }]);

    // Save the same canonical week written out of order — no revision bump, no audit.
    const auditBefore = await db`select count(*)::int count from system.audit_events where resource_id = ${(await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`)[0]!.id} and action like 'schedules.weekly.%'`;
    const noop = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 2, week: { MONDAY: [{ start: "14:00", end: "19:00" }, { start: "10:00", end: "13:00" }] } });
    expect(noop.body.data).toMatchObject({ revision: 2, changed: false });
    const auditAfter = await db`select count(*)::int count from system.audit_events where resource_id = ${(await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`)[0]!.id} and action like 'schedules.weekly.%'`;
    expect(auditAfter[0]!.count).toBe(auditBefore[0]!.count);

    // Clearing a populated week is an effective change: intervals removed, row preserved, revision bump.
    const scheduleId = (await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`)[0]!.id;
    const cleared = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 2, week: {} });
    expect(cleared.body.data).toMatchObject({ revision: 3, hasSchedule: true, changed: true });
    const [intervals] = await db`select count(*)::int count from team.staff_schedule_intervals where weekly_schedule_id = ${scheduleId}`;
    expect(intervals!.count).toBe(0);
    const [schedule] = await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(schedule!.id).toBe(scheduleId);
  });

  it("keeps an empty first write as a non-event without creating a row", async () => {
    const target = await createStaff();
    const result = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: {} });
    expect(result.body.data).toMatchObject({ revision: 0, hasSchedule: false, changed: false });
    const [schedule] = await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(schedule).toBeUndefined();
  });

  it("rejects overlaps and overnight before persisting", async () => {
    const target = await createStaff();
    const overlap = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "14:00" }, { start: "13:00", end: "18:00" }] } });
    expect(overlap.status).toBe(400);
    expect(overlap.body.error.code).toBe("VALIDATION_ERROR");
    expect(overlap.body.error.details.issue).toBe("INTERVAL_OVERLAP");
    const overnight = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "19:00", end: "10:00" }] } });
    expect(overnight.status).toBe(400);
    const [schedule] = await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(schedule).toBeUndefined();
  });

  it("enforces one schedule per staff member", async () => {
    const target = await createStaff();
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } });
    const [count] = await db`select count(*)::int count from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(count!.count).toBe(1);
  });
});

describe("H02.U03 staff states and lifecycle preservation", () => {
  it("allows ACTIVE and ONBOARDING edits but rejects INACTIVE", async () => {
    const active = await createStaff();
    expect((await request(ownerToken, "PUT", `/v1/staff/${active.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } })).status).toBe(200);
    const onboarding = await createStaff(businessA, "ONBOARDING");
    expect((await request(ownerToken, "PUT", `/v1/staff/${onboarding.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } })).status).toBe(200);
    const inactive = await createStaff(businessA, "INACTIVE");
    const rejected = await request(ownerToken, "PUT", `/v1/staff/${inactive.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } });
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe("SCHEDULE_STAFF_NOT_EDITABLE");
  });

  it("preserves schedule through offboard and reonboard without creating lifecycle state", async () => {
    const target = await createStaff();
    const created = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }], FRIDAY: [{ start: "10:00", end: "20:00" }] } });
    const scheduleId = created.body.data.staffMemberId ? (await db`select id from team.staff_weekly_schedules where staff_member_id = ${target.id}`)[0]!.id : "";
    const [staffBefore] = await db`select revision from team.staff_members where id = ${target.id}`;
    const offboard = await request(ownerToken, "POST", `/v1/staff/${target.id}/access/offboard`, { revision: Number(staffBefore!.revision), reason: "End relationship" }, randomUUID());
    expect(offboard.status).toBe(200);
    const [afterOffboard] = await db`select sws.id id, sws.revision::int revision from team.staff_weekly_schedules sws join team.staff_members sm on sm.id = sws.staff_member_id where sws.staff_member_id = ${target.id} and sm.employment_status = 'INACTIVE'`;
    expect(afterOffboard).toMatchObject({ id: scheduleId, revision: 1 });
    // Inactive staff can no longer be edited.
    expect((await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 1, week: { MONDAY: [{ start: "11:00", end: "19:00" }] } })).body.error.code).toBe("SCHEDULE_STAFF_NOT_EDITABLE");
    const reonboard = await request(ownerToken, "POST", `/v1/staff/${target.id}/access/reonboard`, { revision: offboard.body.data.revision, reason: "Return" }, randomUUID());
    expect(reonboard.status).toBe(200);
    const [afterReonboard] = await db`select id, revision::int revision from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(afterReonboard).toMatchObject({ id: scheduleId, revision: 1 });
    const detail = await request(ownerToken, "GET", `/v1/staff/${target.id}/schedule`);
    expect(detail.body).toMatchObject({ revision: 1, hasSchedule: true, employmentStatus: "ONBOARDING" });
  });
});

describe("H02.U03 authorization, delegation, and multi-role context", () => {
  it("denies Receptionist manage by default and allows it after a Receptionist grant", async () => {
    const target = await createStaff();
    expect((await request(receptionistToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "09:00", end: "18:00" }] } })).status).toBe(403);
    const granted = await request(ownerToken, "POST", `/v1/staff/${receptionistStaffId}/grants`, { roleAssignmentId: receptionistAssignmentId, capability: "schedules.manage" });
    expect(granted.status).toBe(200);
    expect((await request(receptionistToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "09:00", end: "18:00" }] } })).status).toBe(200);
    // Barber assignment must not receive schedules.manage.
    const barberDenied = await request(ownerToken, "POST", `/v1/staff/${barberStaffId}/grants`, { roleAssignmentId: barberAssignmentId, capability: "schedules.manage" });
    expect(barberDenied.status).toBe(409);
    await db`update iam.capability_grants set revoked_at = now() where staff_member_id = ${receptionistStaffId} and capability = 'schedules.manage' and revoked_at is null`;
  });

  it("honours the active role context for a Staff holding OWNER and BARBER", async () => {
    const email = `multi-${suffix}@example.test`;
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    authUserIds.push(created.data.user.id);
    const [person] = await db`insert into iam.persons(first_name, last_name) values ('Multi', ${suffix}) returning id`;
    const [staff] = await db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${businessA}, ${person!.id}, 'ACTIVE', 'ACTIVE') returning id`;
    const [account] = await db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status) values (${person!.id}, ${created.data.user.id}, ${email}, 'ACTIVE') returning id`;
    await db`insert into iam.account_security_states(account_id) values (${account!.id})`;
    await db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${businessA}, ${staff!.id})`;
    await db`insert into iam.staff_role_states(business_id, staff_member_id) values (${businessA}, ${staff!.id})`;
    await db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${businessA}, ${staff!.id}, 'OWNER', now(), ${ownerAccountId})`;
    const [barberAssignment] = await db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${businessA}, ${staff!.id}, 'BARBER', now(), ${ownerAccountId}) returning id`;
    multiToken = await signIn(email);
    multiStaffId = staff!.id as string;
    multiBarberAssignmentId = barberAssignment!.id as string;

    const ownerContext = await request(multiToken, "GET", "/v1/iam/context");
    expect(ownerContext.body.capabilities).toEqual(expect.arrayContaining(["schedules.manage", "schedules.read"]));
    expect((await request(multiToken, "GET", "/v1/schedules/team")).status).toBe(200);

    const contextRevision = ownerContext.body.revision as number;
    const switched = await request(multiToken, "PUT", "/v1/iam/context", { roleAssignmentId: multiBarberAssignmentId, revision: contextRevision });
    expect(switched.status).toBe(200);
    const barberContext = await request(multiToken, "GET", "/v1/iam/context");
    expect(barberContext.body.capabilities).not.toContain("schedules.manage");
    expect(barberContext.body.capabilities).not.toContain("schedules.read");
    expect(barberContext.body.capabilities).toContain("schedules.self.read");
    expect((await request(multiToken, "GET", "/v1/schedules/team")).status).toBe(403);
    expect((await request(multiToken, "GET", "/v1/schedules/me")).body).toMatchObject({ staffMemberId: multiStaffId });
    expect((await request(multiToken, "PUT", `/v1/staff/${multiStaffId}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } })).status).toBe(403);
  });
});

describe("H02.U03 tenancy, concurrency, and idempotency", () => {
  it("hides cross-Business targets as NOT_FOUND for reads and writes", async () => {
    const target = await createStaff(businessB);
    await request(ownerBToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } });
    expect((await request(ownerToken, "GET", `/v1/staff/${target.id}/schedule`)).status).toBe(404);
    expect((await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } })).status).toBe(404);
    expect((await request(ownerToken, "GET", "/v1/schedules/team")).body.items.every((item: { staffMemberId: string }) => item.staffMemberId !== target.id)).toBe(true);
  });

  it("serializes concurrent writes so exactly one wins with STALE_REVISION", async () => {
    const target = await createStaff();
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } });
    const current = (await request(ownerToken, "GET", `/v1/staff/${target.id}/schedule`)).body;
    const [a, b] = await Promise.all([
      request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: current.revision, week: { MONDAY: [{ start: "08:00", end: "12:00" }] } }),
      request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: current.revision, week: { MONDAY: [{ start: "12:00", end: "16:00" }] } })
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect([a.body.error?.code, b.body.error?.code]).toContain("STALE_REVISION");
  });

  it("serializes two revision=0 writes without creating duplicate schedules", async () => {
    const target = await createStaff();
    const [a, b] = await Promise.all([
      request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }),
      request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "12:00", end: "20:00" }] } })
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect([a.body.error?.code, b.body.error?.code]).toContain("STALE_REVISION");
    const [count] = await db`select count(*)::int count from team.staff_weekly_schedules where staff_member_id = ${target.id}`;
    expect(count!.count).toBe(1);
  });

  it("serializes schedule replace against offboard into only valid final states", async () => {
    const target = await createStaff();
    const [replace, offboard] = await Promise.all([
      request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }),
      request(ownerToken, "POST", `/v1/staff/${target.id}/access/offboard`, { revision: target.revision, reason: "Race offboard" })
    ]);
    expect(offboard.status).toBe(200);
    expect([200, 409]).toContain(replace.status);
    const [state] = await db`select sm.employment_status::text employment, sws.id schedule_id from team.staff_members sm left join team.staff_weekly_schedules sws on sws.staff_member_id = sm.id where sm.id = ${target.id}`;
    expect(["INACTIVE"]).toContain(state!.employment);
    if (state!.schedule_id) expect(state!.employment).toBe("INACTIVE");
  });

  it("replays succeeded operations before revision re-evaluation and rejects conflicting reuse", async () => {
    const target = await createStaff();
    const operation = randomUUID();
    const first = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }, operation);
    const replay = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }, operation);
    expect(replay.body).toEqual({ ...first.body, replayed: true });
    // A changed payload under the same operationId is a conflict, not a replay.
    const conflict = await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "12:00", end: "20:00" }] } }, operation);
    expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    // Same operationId, different Staff also conflicts.
    const other = await createStaff();
    expect((await request(ownerToken, "PUT", `/v1/staff/${other.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "12:00", end: "20:00" }] } }, operation)).body.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("consumes a failed operation id as a terminal conflict and never double-audits", async () => {
    const target = await createStaff(businessB);
    const operation = randomUUID();
    await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }, operation); // NOT_FOUND, FAILED
    expect((await request(ownerToken, "PUT", `/v1/staff/${target.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } }, operation)).body.error.code).toBe("CONFLICT");
    const good = await createStaff();
    await request(ownerToken, "PUT", `/v1/staff/${good.id}/schedule`, { expectedRevision: 0, week: { MONDAY: [{ start: "10:00", end: "19:00" }] } });
    await request(ownerToken, "PUT", `/v1/staff/${good.id}/schedule`, { expectedRevision: 1, week: { MONDAY: [{ start: "12:00", end: "20:00" }] } });
    const scheduleId = (await db`select id from team.staff_weekly_schedules where staff_member_id = ${good.id}`)[0]!.id;
    const [created] = await db`select count(*)::int count from system.audit_events where resource_id = ${scheduleId} and action = 'schedules.weekly.created'`;
    const [updated] = await db`select count(*)::int count from system.audit_events where resource_id = ${scheduleId} and action = 'schedules.weekly.updated'`;
    expect(created!.count).toBe(1);
    expect(updated!.count).toBe(1);
  });
});
