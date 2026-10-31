import {
  createProfessionalProfileSchema, DomainError, professionalLifecycleSchema,
  updateMyProfessionalProfileSchema, updateProfessionalProfileSchema
} from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { sameProfessionalPresentation } from "./domain.js";

type ProfileRow = { id: string; staffMemberId: string; status: "ACTIVE" | "INACTIVE"; professionalDisplayName: string | null; bio: string | null; publicTitle: string | null; revision: number | string };

function stale(profile: ProfileRow, expectedRevision: number) {
  if (Number(profile.revision) !== expectedRevision) throw new DomainError("STALE_REVISION", "Professional Profile revision is stale", 409);
}

async function lockProfile(tx: Tx, actor: Actor, professionalProfileId: string): Promise<ProfileRow> {
  const [profile] = await tx`select id,staff_member_id "staffMemberId",status::text status,professional_display_name "professionalDisplayName",bio,public_title "publicTitle",revision from team.professional_profiles where business_id=${actor.businessId} and id=${professionalProfileId} for update` as unknown as ProfileRow[];
  if (!profile) throw new DomainError("NOT_FOUND", "Professional Profile not found", 404);
  return profile;
}

async function lockMyProfile(tx: Tx, actor: Actor): Promise<ProfileRow> {
  const [profile] = await tx`select id,staff_member_id "staffMemberId",status::text status,professional_display_name "professionalDisplayName",bio,public_title "publicTitle",revision from team.professional_profiles where business_id=${actor.businessId} and staff_member_id=${actor.staffMemberId} for update` as unknown as ProfileRow[];
  if (!profile) throw new DomainError("NOT_FOUND", "Professional Profile not found", 404);
  return profile;
}

export async function createProfessionalProfile(actor: Actor, raw: unknown, operationId: string) {
  const input = createProfessionalProfileSchema.parse(raw);
  return executeOperation({ operationId, command: "professionals.profile.create", actor, payload: input }, async (tx) => {
    const [staff] = await tx`select id,employment_status::text "employmentStatus" from team.staff_members where business_id=${actor.businessId} and id=${input.staffMemberId} for update` as unknown as {id:string;employmentStatus:string}[];
    if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found", 404);
    if (staff.employmentStatus !== "ACTIVE") throw new DomainError("PROFESSIONAL_STAFF_NOT_ACTIVE", "Professional Profile requires active Staff", 409);
    const existing = await tx`select id from team.professional_profiles where business_id=${actor.businessId} and staff_member_id=${input.staffMemberId}`;
    if (existing.length) throw new DomainError("PROFESSIONAL_PROFILE_EXISTS", "Staff member already has a Professional Profile", 409);
    const [profile] = await tx`insert into team.professional_profiles(business_id,staff_member_id,professional_display_name,bio,public_title)
      values (${actor.businessId},${input.staffMemberId},${input.professionalDisplayName ?? null},${input.bio ?? null},${input.publicTitle ?? null})
      returning id,status::text status,revision` as unknown as {id:string;status:"ACTIVE";revision:number|string}[];
    await audit(tx,{actor,operationId,action:"professionals.profile.created",capability:"professionals.create",resourceType:"PROFESSIONAL_PROFILE",resourceId:profile!.id,changes:{staffMemberId:input.staffMemberId}});
    return { professionalProfileId: profile!.id, staffMemberId: input.staffMemberId, status: profile!.status, revision: Number(profile!.revision), changed: true };
  });
}

async function updatePresentation(input: { actor: Actor; operationId: string; profile: ProfileRow; tx: Tx; values: { professionalDisplayName?: string|null; bio?: string|null; publicTitle?: string|null }; capability: string }) {
  const next = {
    professionalDisplayName: input.values.professionalDisplayName === undefined ? input.profile.professionalDisplayName : input.values.professionalDisplayName,
    bio: input.values.bio === undefined ? input.profile.bio : input.values.bio,
    publicTitle: input.values.publicTitle === undefined ? input.profile.publicTitle : input.values.publicTitle
  };
  if (sameProfessionalPresentation(input.profile,next)) return { professionalProfileId: input.profile.id, revision: Number(input.profile.revision), changed: false };
  const [updated] = await input.tx`update team.professional_profiles set professional_display_name=${next.professionalDisplayName},bio=${next.bio},public_title=${next.publicTitle},revision=revision+1,updated_at=now() where id=${input.profile.id} returning revision` as unknown as {revision:number|string}[];
  await audit(input.tx,{actor:input.actor,operationId:input.operationId,action:"professionals.profile.updated",capability:input.capability,resourceType:"PROFESSIONAL_PROFILE",resourceId:input.profile.id,changes:{fields:Object.keys(input.values).filter((key)=>input.values[key as keyof typeof input.values]!==undefined)}});
  return { professionalProfileId: input.profile.id, revision: Number(updated!.revision), changed: true };
}

export async function updateProfessionalProfile(actor: Actor, professionalProfileId: string, raw: unknown, operationId: string) {
  const input = updateProfessionalProfileSchema.parse(raw);
  return executeOperation({operationId,command:"professionals.profile.update",actor,payload:{professionalProfileId,...input}},async(tx)=>{
    const profile=await lockProfile(tx,actor,professionalProfileId);stale(profile,input.expectedRevision);
    return updatePresentation({actor,operationId,profile,tx,values:{professionalDisplayName:input.professionalDisplayName,bio:input.bio,publicTitle:input.publicTitle},capability:"professionals.update"});
  });
}

export async function updateMyProfessionalProfile(actor: Actor, raw: unknown, operationId: string) {
  const input = updateMyProfessionalProfileSchema.parse(raw);
  return executeOperation({operationId,command:"professionals.profile.update_my",actor,payload:{staffMemberId:actor.staffMemberId,...input}},async(tx)=>{
    const profile=await lockMyProfile(tx,actor);stale(profile,input.expectedRevision);
    return updatePresentation({actor,operationId,profile,tx,values:{professionalDisplayName:input.professionalDisplayName,bio:input.bio},capability:"professionals.self.update"});
  });
}

export async function deactivateProfessionalProfile(actor: Actor, professionalProfileId: string, raw: unknown, operationId: string) {
  const input=professionalLifecycleSchema.parse(raw);
  return executeOperation({operationId,command:"professionals.profile.deactivate",actor,payload:{professionalProfileId,...input}},async(tx)=>{
    const profile=await lockProfile(tx,actor,professionalProfileId);stale(profile,input.expectedRevision);
    if(profile.status==="INACTIVE")return {professionalProfileId:profile.id,status:profile.status,revision:Number(profile.revision),changed:false};
    const [updated]=await tx`update team.professional_profiles set status='INACTIVE',revision=revision+1,updated_at=now() where id=${profile.id} returning status::text status,revision` as unknown as {status:"INACTIVE";revision:number|string}[];
    await audit(tx,{actor,operationId,action:"professionals.profile.deactivated",capability:"professionals.lifecycle",resourceType:"PROFESSIONAL_PROFILE",resourceId:profile.id,changes:{cause:"EXPLICIT",status:{from:"ACTIVE",to:"INACTIVE"}}});
    return {professionalProfileId:profile.id,status:updated!.status,revision:Number(updated!.revision),changed:true};
  });
}

export async function reactivateProfessionalProfile(actor: Actor, professionalProfileId: string, raw: unknown, operationId: string) {
  const input=professionalLifecycleSchema.parse(raw);
  return executeOperation({operationId,command:"professionals.profile.reactivate",actor,payload:{professionalProfileId,...input}},async(tx)=>{
    const [resolved]=await tx`select staff_member_id "staffMemberId" from team.professional_profiles where business_id=${actor.businessId} and id=${professionalProfileId}` as unknown as {staffMemberId:string}[];
    if(!resolved)throw new DomainError("NOT_FOUND","Professional Profile not found",404);
    const [staff]=await tx`select employment_status::text "employmentStatus" from team.staff_members where business_id=${actor.businessId} and id=${resolved.staffMemberId} for update` as unknown as {employmentStatus:string}[];
    if(!staff)throw new DomainError("NOT_FOUND","Professional Profile not found",404);
    const profile=await lockProfile(tx,actor,professionalProfileId);stale(profile,input.expectedRevision);
    if(staff.employmentStatus!=="ACTIVE")throw new DomainError("PROFESSIONAL_STAFF_NOT_ACTIVE","Professional Profile requires active Staff",409);
    if(profile.status==="ACTIVE")return {professionalProfileId:profile.id,status:profile.status,revision:Number(profile.revision),changed:false};
    const [updated]=await tx`update team.professional_profiles set status='ACTIVE',revision=revision+1,updated_at=now() where id=${profile.id} returning status::text status,revision` as unknown as {status:"ACTIVE";revision:number|string}[];
    await audit(tx,{actor,operationId,action:"professionals.profile.reactivated",capability:"professionals.lifecycle",resourceType:"PROFESSIONAL_PROFILE",resourceId:profile.id,changes:{status:{from:"INACTIVE",to:"ACTIVE"}}});
    return {professionalProfileId:profile.id,status:updated!.status,revision:Number(updated!.revision),changed:true};
  });
}
