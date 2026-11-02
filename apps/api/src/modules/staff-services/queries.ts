import { DomainError } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { rows, sql } from "../../lib/sql.js";

type StaffRow = {
  id: string; firstName: string; lastName: string | null;
  employmentStatus: string; revision: number | string;
};
type ServiceRow = {
  id: string; name: string; lifecycle: "ACTIVE" | "ARCHIVED";
  publication: "UNPUBLISHED" | "PUBLISHED";
};
type AssignmentRow = { serviceId: string };

function staffDisplayName(row: StaffRow): string {
  return `${row.firstName} ${row.lastName ?? ""}`.trim();
}

export async function getStaffServices(actor: Actor, staffMemberId: string) {
  const [staff] = await rows<StaffRow>(sql`
    select sm.id, p.first_name "firstName", p.last_name "lastName",
           sm.employment_status::text "employmentStatus", sm.revision
    from team.staff_members sm
    join iam.persons p on p.id = sm.person_id
    where sm.business_id = ${actor.businessId} and sm.id = ${staffMemberId}`);
  if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found", 404);

  const [set] = await rows<{ id: string; revision: number | string }>(sql`
    select id, revision from team.staff_service_sets
    where business_id = ${actor.businessId} and staff_member_id = ${staffMemberId}`);
  const revision = set ? Number(set!.revision) : 0;

  const setIdValue = set?.id ?? null;
  const current = await rows<AssignmentRow>(sql`
    select service_id "serviceId" from team.staff_service_assignments
    where business_id = ${actor.businessId}
      and staff_service_set_id = ${setIdValue}
    order by service_id`);
  const currentServiceIds = current.map((row) => row.serviceId);

  const services = await rows<ServiceRow>(sql`
    select id, name, lifecycle::text lifecycle, publication::text publication
    from catalog.services
    where business_id = ${actor.businessId}
    order by name`);

  const options = services.map((service) => ({
    id: service.id,
    name: service.name,
    lifecycle: service.lifecycle,
    publication: service.publication,
    assigned: currentServiceIds.includes(service.id),
    assignable: service.lifecycle === "ACTIVE"
  }));

  return {
    staffMemberId: staff.id,
    displayName: staffDisplayName(staff),
    employmentStatus: staff.employmentStatus,
    revision,
    serviceIds: currentServiceIds,
    services: options
  };
}

export async function getMyServices(actor: Actor) {
  const [staff] = await rows<{ id: string; employmentStatus: string }>(sql`
    select id, employment_status::text "employmentStatus"
    from team.staff_members
    where business_id = ${actor.businessId} and id = ${actor.staffMemberId}`);
  if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found", 404);

  const current = await rows<{ id: string; name: string; lifecycle: string; publication: string }>(sql`
    select s.id, s.name, s.lifecycle::text lifecycle, s.publication::text publication
    from catalog.services s
    join team.staff_service_assignments a
      on a.business_id = s.business_id and a.service_id = s.id
    where a.business_id = ${actor.businessId}
      and a.staff_service_set_id = (
        select id from team.staff_service_sets
        where business_id = ${actor.businessId} and staff_member_id = ${actor.staffMemberId}
      )
    order by s.name`);

  return {
    staffMemberId: staff.id,
    employmentStatus: staff.employmentStatus,
    services: current.map((item) => ({
      id: item.id,
      name: item.name,
      lifecycle: item.lifecycle as "ACTIVE" | "ARCHIVED",
      publication: item.publication as "UNPUBLISHED" | "PUBLISHED",
      assigned: true
    }))
  };
}
