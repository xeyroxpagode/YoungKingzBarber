import { DomainError, professionalQuerySchema } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { rows, sql } from "../../lib/sql.js";

type ProfileRow = {
  professionalProfileId: string; staffMemberId: string; status: "ACTIVE" | "INACTIVE"; revision: number | string;
  professionalDisplayName: string | null; effectiveDisplayName: string; bio: string | null; publicTitle: string | null;
  staffEmploymentStatus: "ONBOARDING" | "ACTIVE" | "INACTIVE"; professionallyEnabled: boolean;
  createdAt: Date; updatedAt: Date;
};

function mapProfile(row: ProfileRow) {
  return { ...row, revision: Number(row.revision) };
}

const selection = sql`pp.id "professionalProfileId",pp.staff_member_id "staffMemberId",pp.status::text status,pp.revision,
  pp.professional_display_name "professionalDisplayName",
  coalesce(pp.professional_display_name,concat_ws(' ',p.first_name,p.last_name)) "effectiveDisplayName",
  pp.bio,pp.public_title "publicTitle",sm.employment_status::text "staffEmploymentStatus",
  (pp.status='ACTIVE' and sm.employment_status='ACTIVE') "professionallyEnabled",
  pp.created_at "createdAt",pp.updated_at "updatedAt"`;

export async function listProfessionalProfiles(actor: Actor, raw: unknown) {
  const input = professionalQuerySchema.parse(raw);
  const search = input.q ? `%${input.q}%` : undefined;
  const items = await rows<ProfileRow>(sql`select ${selection}
    from team.professional_profiles pp
    join team.staff_members sm on sm.business_id=pp.business_id and sm.id=pp.staff_member_id
    join iam.persons p on p.id=sm.person_id
    where pp.business_id=${actor.businessId}
      ${input.status ? sql`and pp.status=${input.status}` : sql``}
      ${input.cursor ? sql`and pp.created_at<${input.cursor}` : sql``}
      ${search ? sql`and (coalesce(pp.professional_display_name,'') ilike ${search} or p.first_name ilike ${search} or coalesce(p.last_name,'') ilike ${search} or concat_ws(' ',p.first_name,p.last_name) ilike ${search})` : sql``}
    order by pp.created_at desc,pp.id desc limit ${input.limit + 1}`);
  const hasMore = items.length > input.limit;
  const page = hasMore ? items.slice(0, input.limit) : items;
  return { items: page.map(mapProfile), nextCursor: hasMore ? page.at(-1)?.createdAt ?? null : null };
}

export async function getProfessionalProfile(actor: Actor, professionalProfileId: string) {
  const [profile] = await rows<ProfileRow>(sql`select ${selection}
    from team.professional_profiles pp
    join team.staff_members sm on sm.business_id=pp.business_id and sm.id=pp.staff_member_id
    join iam.persons p on p.id=sm.person_id
    where pp.business_id=${actor.businessId} and pp.id=${professionalProfileId}`);
  if (!profile) throw new DomainError("NOT_FOUND", "Professional Profile not found", 404);
  return mapProfile(profile);
}

export async function getMyProfessionalProfile(actor: Actor) {
  const [profile] = await rows<ProfileRow>(sql`select ${selection}
    from team.professional_profiles pp
    join team.staff_members sm on sm.business_id=pp.business_id and sm.id=pp.staff_member_id
    join iam.persons p on p.id=sm.person_id
    where pp.business_id=${actor.businessId} and pp.staff_member_id=${actor.staffMemberId}`);
  return { profile: profile ? mapProfile(profile) : null };
}
