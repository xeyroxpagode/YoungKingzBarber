import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres, { type Sql } from "postgres";

export interface H01Ctx {
  admin: SupabaseClient;
  db: Sql;
  suffix: string;
  email: string;
  password: string;
  authUserId: string;
  businessId: string;
  personId: string;
  staffId: string;
  accountId: string;
  authUserIds: string[];
  personIds: string[];
  staffIds: string[];
  accountIds: string[];
}

export async function createOwnerContext(): Promise<H01Ctx> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
  const dbUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const db = postgres(dbUrl, { prepare: false });
  const suffix = randomUUID().slice(0, 8);
  const email = `owner-e2e-${suffix}@example.com`;
  const password = "YoungKingz-E2E!26";
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const authUserId = created.data.user.id;
  const [biz] = await db`insert into business.businesses(provisioning_key,display_name,timezone,status) values (${`e2e-${suffix}`},'Young Kingz E2E','America/Argentina/Buenos_Aires','ACTIVE') returning id`;
  const [person] = await db`insert into iam.persons(first_name,last_name) values ('Owner','H01 Test') returning id`;
  const [staff] = await db`insert into team.staff_members(business_id,person_id,employment_status,access_status) values (${biz.id},${person.id},'ACTIVE','ACTIVE') returning id`;
  const [account] = await db`insert into iam.user_accounts(person_id,auth_user_id,verified_email,status) values (${person.id},${authUserId},${email},'ACTIVE') returning id`;
  await db`insert into iam.account_security_states(account_id) values (${account.id})`;
  await db`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${biz.id},${staff.id})`;
  await db`insert into iam.staff_role_states(business_id,staff_member_id) values (${biz.id},${staff.id})`;
  await db`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${biz.id},${staff.id},'OWNER',now(),${account.id})`;
  const ctx: H01Ctx = {
    admin, db, suffix, email, password, authUserId,
    businessId: biz.id, personId: person.id, staffId: staff.id, accountId: account.id,
    authUserIds: [authUserId], personIds: [person.id], staffIds: [staff.id], accountIds: [account.id],
  };
  return ctx;
}

export async function cleanupContext(ctx: H01Ctx) {
  const { db, businessId, accountIds, personIds, authUserIds, admin } = ctx;
  const staffRows = await db`select id, person_id from team.staff_members where business_id=${businessId}`;
  const staffIds = staffRows.map((r: any) => r.id);
  const personRows = staffRows;
  const allPids = [...new Set([...personRows.map((r: any) => r.person_id), ...personIds])];
  const accountRows = allPids.length ? await db`select id from iam.user_accounts where person_id = any(${allPids})` : [];
  const allAids = [...new Set([...accountRows.map((r: any) => r.id), ...accountIds])];
  await db.begin(async tx => {
    await tx`delete from system.audit_events where business_id=${businessId}`;
    await tx`delete from system.operation_attempts where business_id=${businessId}`;
    await tx`delete from iam.access_sessions where business_id=${businessId} or account_id = any(${allAids.length?allAids:[null]}) or staff_member_id = any(${staffIds.length?staffIds:[null]})`;
    await tx`delete from iam.user_context_preferences where business_id=${businessId}`;
    await tx`delete from iam.capability_grants where business_id=${businessId}`;
    await tx`delete from iam.account_invitations where business_id=${businessId}`;
    await tx`delete from iam.role_assignments where business_id=${businessId}`;
    await tx`delete from iam.staff_role_states where business_id=${businessId}`;
    await tx`delete from team.staff_relationship_periods where business_id=${businessId}`;
    await tx`delete from team.staff_members where business_id=${businessId}`;
    if (allAids.length) await tx`delete from iam.account_security_states where account_id = any(${allAids})`;
    if (allAids.length) await tx`delete from iam.user_accounts where id = any(${allAids})`;
    if (allPids.length) await tx`delete from iam.persons where id = any(${allPids})`;
    await tx`delete from business.businesses where id=${businessId}`;
  });
  for (const id of authUserIds) await admin.auth.admin.deleteUser(id).catch(() => undefined);
  await db.end();
}

export async function signIn(email: string, password: string): Promise<string> {
  const client = createClient(process.env.SUPABASE_URL ?? "http://127.0.0.1:55321", process.env.SUPABASE_ANON_KEY ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session!.access_token;
}

export async function apiRequest(token: string, method: string, url: string, payload?: unknown, operation?: string) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, "x-operation-id": operation ?? randomUUID() };
  if (payload !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`http://127.0.0.1:4100${url}`, { method, headers, body: payload !== undefined ? JSON.stringify(payload) : undefined });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}
