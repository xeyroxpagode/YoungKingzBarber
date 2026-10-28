import { createStaffSchema, delegableCapabilities, DomainError, grantSchema, lifecycleSchema, roles, updateRolesSchema, updateStaffSchema, type Capability, type RoleCode } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation } from "../system/operations.js";
import { createOpaqueToken } from "../../lib/crypto.js";
import { database, runtime, supabaseAdmin } from "../../lib/runtime.js";
import { rows, sql } from "../../lib/sql.js";

export async function listStaff(actor: Actor, options: { search?: string; status: "CURRENT"|"PENDING"|"SUSPENDED"|"HISTORICAL"|"ALL" }) {
  const search = options.search?.trim() ? `%${options.search.trim()}%` : undefined;
  const statusFilter = options.status === "PENDING" ? sql`and (sm.employment_status='ONBOARDING' or sm.access_status='PENDING_ACTIVATION')`
    : options.status === "SUSPENDED" ? sql`and sm.access_status='SUSPENDED'`
    : options.status === "HISTORICAL" ? sql`and sm.employment_status='INACTIVE'`
    : options.status === "CURRENT" ? sql`and sm.employment_status<>'INACTIVE' and sm.access_status not in ('SUSPENDED','REVOKED','PENDING_ACTIVATION')`
    : sql``;
  return rows(sql`select sm.id, sm.revision, sm.employment_status "employmentStatus", sm.access_status "accessStatus", p.first_name "firstName", p.last_name "lastName", p.phone,
    coalesce(ua.verified_email::text, ai.email::text) email,
    coalesce(array_agg(ra.role::text) filter (where ra.revoked_at is null and ra.effective_at is not null), '{}') roles,
    case when sm.id=${actor.staffMemberId} then true else false end "isSelf",
    case when exists(select 1 from iam.role_assignments own where own.business_id=sm.business_id and own.staff_member_id=sm.id and own.role='OWNER' and own.revoked_at is null and own.effective_at is not null) and iam.valid_owner_count(${actor.businessId})<=1 then true else false end "isLastOwner"
    from team.staff_members sm join iam.persons p on p.id=sm.person_id
    left join iam.user_accounts ua on ua.person_id=p.id
    left join lateral (select email from iam.account_invitations i where i.staff_member_id=sm.id order by i.created_at desc limit 1) ai on true
    left join iam.role_assignments ra on ra.staff_member_id=sm.id
    where sm.business_id=${actor.businessId}
      ${search ? sql`and (p.first_name ilike ${search} or p.last_name ilike ${search} or concat_ws(' ',p.first_name,p.last_name) ilike ${search} or coalesce(ua.verified_email::text,ai.email::text,'') ilike ${search})` : sql``}
      ${statusFilter}
    group by sm.id,p.id,ua.verified_email,ai.email order by p.first_name,p.last_name limit 100`);
}

export async function getStaff(actor: Actor, id: string) {
  const [member] = await rows(sql`select sm.id,sm.revision,sm.employment_status "employmentStatus",sm.access_status "accessStatus",p.first_name "firstName",p.last_name "lastName",p.phone,ua.verified_email::text email,
    case when sm.id=${actor.staffMemberId} then true else false end "isSelf",
    case when exists(select 1 from iam.role_assignments own where own.business_id=sm.business_id and own.staff_member_id=sm.id and own.role='OWNER' and own.revoked_at is null and own.effective_at is not null) and iam.valid_owner_count(${actor.businessId})<=1 then true else false end "isLastOwner"
    from team.staff_members sm join iam.persons p on p.id=sm.person_id left join iam.user_accounts ua on ua.person_id=p.id where sm.business_id=${actor.businessId} and sm.id=${id}`);
  if (!member) throw new DomainError("NOT_FOUND", "Staff member not found", 404);
  return member;
}

export async function createStaff(actor: Actor, raw: unknown, id: string) {
  const input = createStaffSchema.parse(raw);
  const result = await executeOperation({ operationId:id, command:"staff.create", actor, payload:input }, async (tx) => {
    const [person] = await tx`insert into iam.persons(first_name,last_name,phone) values (${input.firstName},${input.lastName ?? null},${input.phone ?? null}) returning id`;
    const [staff] = await tx`insert into team.staff_members(business_id,person_id) values (${actor.businessId},${person!.id}) returning id,revision`;
    await tx`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${actor.businessId},${staff!.id})`;
    await tx`insert into iam.staff_role_states(business_id,staff_member_id) values (${actor.businessId},${staff!.id})`;
    for (const role of input.roles) await tx`insert into iam.role_assignments(business_id,staff_member_id,role,assigned_by_account_id) values (${actor.businessId},${staff!.id},${role},${actor.accountId})`;
    let invitationId: string | undefined;
    if (input.inviteNow && input.email) {
      const token = createOpaqueToken();
      const [invitation] = await tx`insert into iam.account_invitations(business_id,staff_member_id,email,token_hash,expires_at) values (${actor.businessId},${staff!.id},${input.email},${token.hash},now()+interval '72 hours') returning id`;
      invitationId = invitation!.id;
    }
    await audit(tx,{actor,operationId:id,action:"staff.created",capability:"iam.staff.create",resourceType:"STAFF_MEMBER",resourceId:staff!.id,changes:{roles:input.roles,invited:Boolean(invitationId)}});
    return { id: staff!.id as string, revision: Number(staff!.revision), invitationId };
  });
  if (input.inviteNow && input.email && result.data.invitationId && !result.replayed) {
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, { redirectTo: `${runtime.webOrigin}/activate?invitation=${result.data.invitationId}` });
    await database.client`update iam.account_invitations set delivery_status=${error ? "FAILED" : "SENT"},delivery_error_code=${error?.code ?? null},updated_at=now() where id=${result.data.invitationId}`;
  }
  return result;
}

export async function updateStaff(actor: Actor, staffId: string, raw: unknown, operation: string) {
  const input = updateStaffSchema.parse(raw);
  return executeOperation({operationId:operation,command:"staff.update",actor,payload:{staffId,...input}},async(tx)=>{
    const updated=await tx`update iam.persons p set first_name=coalesce(${input.firstName ?? null},p.first_name),last_name=case when ${input.lastName === undefined} then p.last_name else ${input.lastName ?? null} end,phone=case when ${input.phone === undefined} then p.phone else ${input.phone ?? null} end,updated_at=now() from team.staff_members sm where sm.person_id=p.id and sm.id=${staffId} and sm.business_id=${actor.businessId} and sm.revision=${input.revision} returning p.id`;
    if(!updated.length) throw new DomainError("STALE_REVISION","Staff revision is stale",409);
    const [member]=await tx`update team.staff_members set revision=revision+1,updated_at=now() where id=${staffId} and business_id=${actor.businessId} and revision=${input.revision} returning id,revision`;
    await audit(tx,{actor,operationId:operation,action:"staff.updated",capability:"iam.staff.update",resourceType:"STAFF_MEMBER",resourceId:staffId,changes:{fields:Object.keys(input).filter(k=>k!=="revision")}});
    return member!;
  });
}

async function lockAndProtectOwner(tx: any, actor: Actor, staffId: string, removingOwner: boolean) {
  await tx`select pg_advisory_xact_lock(hashtext(${actor.businessId}))`;
  if (!removingOwner) return;
  const target = await tx`select 1 from iam.role_assignments where business_id=${actor.businessId} and staff_member_id=${staffId} and role='OWNER' and revoked_at is null and effective_at is not null`;
  if (target.length) {
    const [{count}] = await tx`select iam.valid_owner_count(${actor.businessId}) count`;
    if (Number(count) <= 1) throw new DomainError("LAST_OWNER_PROTECTED","The last valid Owner cannot be removed",409);
  }
}

export async function replaceRoles(actor: Actor, staffId: string, raw: unknown, operation: string) {
  const input=updateRolesSchema.parse(raw); const requested=new Set<RoleCode>(input.roles);
  return executeOperation({operationId:operation,command:"roles.replace",actor,payload:{staffId,...input}},async(tx)=>{
    const current=await tx`select id,role::text role from iam.role_assignments where business_id=${actor.businessId} and staff_member_id=${staffId} and revoked_at is null`;
    const addingOwner=requested.has("OWNER")&&!current.some((r:any)=>r.role==="OWNER");if(addingOwner&&input.sensitiveConfirmation!=="ASSIGN OWNER")throw new DomainError("VALIDATION_ERROR","Sensitive confirmation is required",400);const removingOwner=current.some((r:any)=>r.role==="OWNER"&&!requested.has("OWNER")); await lockAndProtectOwner(tx,actor,staffId,removingOwner);
    const staff=await tx`select revision from team.staff_members where id=${staffId} and business_id=${actor.businessId} for update`;
    if(!staff.length) throw new DomainError("NOT_FOUND","Staff member not found",404); if(Number(staff[0]!.revision)!==input.revision) throw new DomainError("STALE_REVISION","Staff revision is stale",409);
    for(const assignment of current) if(!requested.has(assignment.role as RoleCode)) { await tx`update iam.role_assignments set revoked_at=now(),revoked_by_account_id=${actor.accountId},revision=revision+1 where id=${assignment.id}`; await tx`update iam.capability_grants set revoked_at=now(),revoked_by_account_id=${actor.accountId} where role_assignment_id=${assignment.id} and revoked_at is null`; }
    for(const role of roles) if(requested.has(role)&&!current.some((r:any)=>r.role===role)) await tx`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${actor.businessId},${staffId},${role},now(),${actor.accountId})`;
    const [updated]=await tx`update team.staff_members set revision=revision+1,updated_at=now() where id=${staffId} returning revision`;
    await tx`update business.businesses set authorization_revision=authorization_revision+1 where id=${actor.businessId}`;
    await audit(tx,{actor,operationId:operation,action:"roles.replaced",capability:"iam.roles.assign",resourceType:"STAFF_MEMBER",resourceId:staffId,changes:{roles:input.roles}}); return {staffId,roles:input.roles,revision:Number(updated!.revision)};
  });
}

export async function roleHistory(actor:Actor,staffId:string){return rows(sql`select id,role::text role,effective_at "effectiveAt",revoked_at "revokedAt",created_at "createdAt" from iam.role_assignments where business_id=${actor.businessId} and staff_member_id=${staffId} order by created_at desc`);}
export async function activeRoles(actor:Actor,staffId:string){return rows(sql`select id,role::text role,effective_at "effectiveAt" from iam.role_assignments where business_id=${actor.businessId} and staff_member_id=${staffId} and revoked_at is null order by created_at`);}
export async function grants(actor:Actor,staffId:string,history=false){return rows(sql`select id,role_assignment_id "roleAssignmentId",capability,scope,valid_from "validFrom",expires_at "expiresAt",revoked_at "revokedAt" from iam.capability_grants where business_id=${actor.businessId} and staff_member_id=${staffId} ${history?sql``:sql`and revoked_at is null`} order by created_at desc`);}

export async function issueGrant(actor:Actor,staffId:string,raw:unknown,operation:string){const input=grantSchema.parse(raw);if(!delegableCapabilities.includes(input.capability))throw new DomainError("FORBIDDEN","Capability is not delegable",403);return executeOperation({operationId:operation,command:"grant.issue",actor,payload:{staffId,...input}},async tx=>{const role=await tx`select 1 from iam.role_assignments where id=${input.roleAssignmentId} and business_id=${actor.businessId} and staff_member_id=${staffId} and role='RECEPTIONIST' and revoked_at is null`;if(!role.length)throw new DomainError("CONFLICT","Grant must target an active Receptionist assignment",409);const [grant]=await tx`insert into iam.capability_grants(business_id,staff_member_id,role_assignment_id,capability,granted_by_account_id,expires_at) values (${actor.businessId},${staffId},${input.roleAssignmentId},${input.capability},${actor.accountId},${input.expiresAt??null}) returning id`;await audit(tx,{actor,operationId:operation,action:"grant.issued",capability:"iam.grants.issue",resourceType:"CAPABILITY_GRANT",resourceId:grant!.id,changes:{capability:input.capability}});return grant!;});}
export async function revokeGrant(actor:Actor,grantId:string,operation:string){return executeOperation({operationId:operation,command:"grant.revoke",actor,payload:{grantId}},async tx=>{const [grant]=await tx`update iam.capability_grants set revoked_at=now(),revoked_by_account_id=${actor.accountId} where id=${grantId} and business_id=${actor.businessId} and revoked_at is null returning id`;if(!grant)throw new DomainError("NOT_FOUND","Active grant not found",404);await audit(tx,{actor,operationId:operation,action:"grant.revoked",capability:"iam.grants.revoke",resourceType:"CAPABILITY_GRANT",resourceId:grantId});return grant;});}

type LifecycleAction="suspend"|"reactivate"|"revoke"|"offboard"|"reonboard";
export async function lifecycle(actor:Actor,staffId:string,action:LifecycleAction,raw:unknown,operation:string){const input=lifecycleSchema.parse(raw);return executeOperation({operationId:operation,command:`access.${action}`,actor,payload:{staffId,...input}},async tx=>{if(staffId===actor.staffMemberId)throw new DomainError("FORBIDDEN","Self-directed administrative lifecycle changes are not allowed",403);await lockAndProtectOwner(tx,actor,staffId,action!=="reactivate"&&action!=="reonboard");const staff=await tx`select * from team.staff_members where id=${staffId} and business_id=${actor.businessId} for update`;if(!staff.length)throw new DomainError("NOT_FOUND","Staff member not found",404);if(Number(staff[0]!.revision)!==input.revision)throw new DomainError("STALE_REVISION","Staff revision is stale",409);
    const access=action==="suspend"?"SUSPENDED":action==="reactivate"?"ACTIVE":action==="reonboard"?"PENDING_ACTIVATION":"REVOKED";const employment=action==="offboard"?"INACTIVE":action==="reonboard"?"ONBOARDING":staff[0]!.employment_status;
    if(action==="offboard")await tx`update team.staff_relationship_periods set ended_at=now(),ended_reason=${input.reason} where staff_member_id=${staffId} and ended_at is null`;
    if(action==="reonboard"){await tx`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${actor.businessId},${staffId})`;await tx`update iam.role_assignments set revoked_at=coalesce(revoked_at,now()),revoked_by_account_id=${actor.accountId} where staff_member_id=${staffId} and revoked_at is null`;}
    await tx`update team.staff_members set access_status=${access},employment_status=${employment},revision=revision+1,updated_at=now() where id=${staffId}`;
    if(action!=="reactivate")await tx`update iam.access_sessions set revoked_at=now(),revoked_reason=${`ACCESS_${action.toUpperCase()}`} where staff_member_id=${staffId} and revoked_at is null`;
    await audit(tx,{actor,operationId:operation,action:`access.${action}`,capability:`iam.access.${action}`,resourceType:"STAFF_MEMBER",resourceId:staffId,changes:{reason:input.reason,access,employment}});return {staffId,accessStatus:access,employmentStatus:employment,revision:input.revision+1};});}
