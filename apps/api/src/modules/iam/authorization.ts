import type { FastifyRequest } from "fastify";
import { DomainError, roleCapabilities, type Capability, type RoleCode } from "@youngkingz/contracts";
import { one, rows, sql } from "../../lib/sql.js";
import { supabaseAdmin } from "../../lib/runtime.js";

export interface Actor {
  accountId: string; personId: string; businessId: string; staffMemberId: string; accessSessionId: string;
  roleAssignmentId: string; role: RoleCode; contextRevision: number; capabilities: Set<Capability>; email: string;
}

type IdentityRow = { account_id: string; person_id: string; business_id: string; staff_member_id: string; account_status: string; access_status: string; employment_status: string; verified_email: string; recovery_required: boolean | null; sessions_valid_after: Date | null };
type RoleRow = { id: string; role: RoleCode };

function bearer(request: FastifyRequest): string {
  const value = request.headers.authorization;
  if (!value?.startsWith("Bearer ")) throw new DomainError("UNAUTHENTICATED", "A valid bearer token is required", 401);
  return value.slice(7);
}

function tokenClaims(token: string): { exp?: number; iat?: number; session_id?: string } {
  try { return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")); } catch { return {}; }
}

export class AuthorizationService {
  async authenticate(request: FastifyRequest): Promise<Actor> {
    const token = bearer(request);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.id || !data.user.email) throw new DomainError("UNAUTHENTICATED", "Identity verification failed", 401);
    const identity = await one<IdentityRow>(sql`
      select ua.id account_id, ua.person_id, sm.business_id, sm.id staff_member_id,
             ua.status account_status, sm.access_status, sm.employment_status, ua.verified_email,
             sec.recovery_required, sec.sessions_valid_after
      from iam.user_accounts ua join team.staff_members sm on sm.person_id = ua.person_id
      left join iam.account_security_states sec on sec.account_id = ua.id
      where ua.auth_user_id = ${data.user.id} order by sm.created_at limit 1`);
    if (!identity) throw new DomainError("FORBIDDEN", "The authenticated identity is not Staff", 403);
    if (identity.account_status !== "ACTIVE" || identity.access_status !== "ACTIVE" || identity.employment_status !== "ACTIVE") throw new DomainError("ACCESS_RESTRICTED", "Staff access is not active", 403);
    const assignments = await rows<RoleRow>(sql`select id, role::text role from iam.role_assignments where business_id = ${identity.business_id} and staff_member_id = ${identity.staff_member_id} and revoked_at is null and effective_at is not null order by created_at`);
    if (!assignments.length) throw new DomainError("FORBIDDEN", "No active responsibility is assigned", 403);
    const claims = tokenClaims(token);
    if (identity.recovery_required) throw new DomainError("ACCESS_RESTRICTED", "Account recovery must be completed", 403);
    if (claims.iat && identity.sessions_valid_after && claims.iat * 1000 < new Date(identity.sessions_valid_after).getTime()) throw new DomainError("SESSION_REVOKED", "Session predates the latest credential security change", 401);
    let session = await one<{ id: string; active_role_assignment_id: string | null; context_revision: number }>(sql`
      select id, active_role_assignment_id, context_revision from iam.access_sessions
      where account_id = ${identity.account_id} and business_id = ${identity.business_id}
        and auth_session_id is not distinct from ${claims.session_id ?? null} and revoked_at is null and expires_at > now()
      order by created_at desc limit 1`);
    if (!session) {
      const revoked = await one<{ id: string }>(sql`select id from iam.access_sessions where account_id=${identity.account_id} and business_id=${identity.business_id} and auth_session_id is not distinct from ${claims.session_id ?? null} and revoked_at is not null order by revoked_at desc limit 1`);
      if (revoked) throw new DomainError("SESSION_REVOKED", "Operational session has been revoked", 401);
      const preferred = await one<{ role_assignment_id: string }>(sql`select role_assignment_id from iam.user_context_preferences where account_id = ${identity.account_id} and business_id = ${identity.business_id}`);
      const active = assignments.find((item) => item.id === preferred?.role_assignment_id) ?? assignments[0]!;
      session = await one<{ id: string; active_role_assignment_id: string; context_revision: number }>(sql`
        insert into iam.access_sessions(account_id,business_id,staff_member_id,active_role_assignment_id,auth_session_id,expires_at)
        values (${identity.account_id},${identity.business_id},${identity.staff_member_id},${active.id},${claims.session_id ?? null},to_timestamp(${claims.exp ?? Math.floor(Date.now()/1000)+3600}))
        returning id, active_role_assignment_id, context_revision`);
    }
    const selected = assignments.find((item) => item.id === session?.active_role_assignment_id) ?? assignments[0]!;
    const grants = await rows<{ capability: Capability }>(sql`select capability from iam.capability_grants where role_assignment_id = ${selected.id} and revoked_at is null and valid_from <= now() and (expires_at is null or expires_at > now())`);
    const capabilities = new Set<Capability>([...roleCapabilities[selected.role], ...grants.map((grant) => grant.capability)]);
    await databaseTouch(session!.id);
    return { accountId: identity.account_id, personId: identity.person_id, businessId: identity.business_id, staffMemberId: identity.staff_member_id, accessSessionId: session!.id, roleAssignmentId: selected.id, role: selected.role, contextRevision: Number(session!.context_revision), capabilities, email: data.user.email };
  }

  require(actor: Actor, capability: Capability): void {
    if (!actor.capabilities.has(capability)) throw new DomainError("FORBIDDEN", `Missing capability: ${capability}`, 403);
  }
}

async function databaseTouch(id: string) { await rows(sql`update iam.access_sessions set last_seen_at = now() where id = ${id} and revoked_at is null returning id`); }

export const authorizationService = new AuthorizationService();
