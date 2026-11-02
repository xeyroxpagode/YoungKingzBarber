import { DomainError, replaceStaffServicesSchema } from "@youngkingz/contracts";
import type { Actor } from "../iam/authorization.js";
import { audit, executeOperation, type Tx } from "../system/operations.js";
import { canonicalizeServiceIds, diffSets } from "./domain.js";

type ServiceRow = { id: string; lifecycle: "ACTIVE" | "ARCHIVED" };

async function lockStaffMember(tx: Tx, actor: Actor, staffMemberId: string) {
  const [staff] = await tx`select id, employment_status::text "employmentStatus" from team.staff_members where business_id=${actor.businessId} and id=${staffMemberId} for update` as unknown as { id: string; employmentStatus: string }[];
  if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found", 404);
  if (staff.employmentStatus === "INACTIVE") throw new DomainError("STAFF_SERVICES_STAFF_NOT_EDITABLE", "Staff member is not editable", 409);
  return staff;
}

async function fetchSet(tx: Tx, actor: Actor, staffMemberId: string) {
  const [row] = await tx`select id, revision from team.staff_service_sets where business_id=${actor.businessId} and staff_member_id=${staffMemberId} for update` as unknown as { id: string; revision: number | string }[];
  return row;
}

async function readCurrent(tx: Tx, actor: Actor, setId: string | null) {
  if (!setId) return [];
  const rows = await tx`select service_id "serviceId" from team.staff_service_assignments where business_id=${actor.businessId} and staff_service_set_id=${setId} order by service_id` as unknown as { serviceId: string }[];
  return rows.map((row) => row.serviceId);
}

async function lockServices(tx: Tx, actor: Actor, serviceIds: string[]): Promise<ServiceRow[]> {
  if (serviceIds.length === 0) return [];
  return tx`select id, lifecycle::text lifecycle from catalog.services where business_id=${actor.businessId} and id = any(${serviceIds}) order by id for update` as unknown as ServiceRow[];
}

async function createSet(tx: Tx, actor: Actor, staffMemberId: string) {
  // Alta atómica: la restricción única (business_id, staff_member_id) garantiza
  // que sólo una transacción cree el set. Si hay conflicto, perdió la carrera.
  const [row] = await tx`insert into team.staff_service_sets(business_id, staff_member_id, revision) values (${actor.businessId}, ${staffMemberId}, 1) on conflict (business_id, staff_member_id) do nothing returning id, revision` as unknown as { id: string; revision: number | string }[];
  if (!row) return null;
  return { id: row!.id, revision: Number(row!.revision) };
}

async function deleteAssignments(tx: Tx, actor: Actor, setId: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return;
  await tx`delete from team.staff_service_assignments where business_id=${actor.businessId} and staff_service_set_id=${setId} and service_id = any(${serviceIds})`;
}

async function insertAssignments(tx: Tx, actor: Actor, setId: string, serviceIds: string[]) {
  for (const id of serviceIds) {
    await tx`insert into team.staff_service_assignments(business_id, staff_service_set_id, service_id, created_at) values (${actor.businessId}, ${setId}, ${id}, now())`;
  }
}

async function incrementRevision(tx: Tx, actor: Actor, setId: string, expectedRevision: number) {
  // Incremento condicional y atómico: sólo aplica si la revisión sigue siendo la
  // esperada. Si otra transacción ya avanzó, afecta 0 filas → STALE_REVISION.
  const [row] = await tx`update team.staff_service_sets set revision=revision+1,updated_at=now() where business_id=${actor.businessId} and id=${setId} and revision=${expectedRevision} returning revision` as unknown as { revision: number | string }[];
  if (!row) throw new DomainError("STALE_REVISION", "Staff services revision is stale", 409);
  return Number(row!.revision);
}

export async function replaceStaffServices(actor: Actor, staffMemberId: string, raw: unknown, operationId: string) {
  const input = replaceStaffServicesSchema.parse(raw);
  const { expectedRevision, serviceIds } = input;
  const target = canonicalizeServiceIds(serviceIds);

  return executeOperation(
    { operationId, command: "staff.services.replace", actor, payload: { staffMemberId, expectedRevision, serviceIds: target } },
    async (tx) => {
      // 5. Lock StaffMember first, per lock order U04 §44.
      await lockStaffMember(tx, actor, staffMemberId);

      // 7. Fetch/lock StaffServiceSet.
      const set = await fetchSet(tx, actor, staffMemberId);
      const currentRevision = set ? Number(set.revision) : 0;

      // 8. expectedRevision validation.
      if (currentRevision !== expectedRevision) throw new DomainError("STALE_REVISION", "Staff services revision is stale", 409);

      // 9. Read current assignments.
      const currentServiceIds = await readCurrent(tx, actor, set ? set.id : null);

      // 10. Compute added/removed.
      const { added, removed } = diffSets(currentServiceIds, target);

      // 14. Semantic no-op: no writes, no revision bump, no audit (U04 §51).
      if (added.length === 0 && removed.length === 0) {
        return { staffMemberId, revision: currentRevision, changed: false, serviceIds: currentServiceIds };
      }

      // 11. Fetch+lock required Service rows in stable order (ORDER BY id).
      const services = await lockServices(tx, actor, target);

      // 12. Validate tenant: every target service must exist in this business.
      const foundIds = new Set(services.map((s) => s.id));
      for (const id of target) if (!foundIds.has(id)) throw new DomainError("NOT_FOUND", `Service not found: ${id}`, 404);

      // 13. Validate added Services are ACTIVE (U04 §38-39).
      for (const service of services) {
        if (added.includes(service.id) && service.lifecycle !== "ACTIVE") {
          throw new DomainError("SERVICE_ARCHIVED", `Service ${service.id} is not active and cannot be newly assigned`, 409);
        }
      }

      // 15. Create parent if required (first write non-empty target, U04 §27).
      // First write creates the set at revision 1; no extra increment (U04 §27).
      // Existing set: increment by one on effective change (U04 §50).
      let setId: string;
      let nextRevision: number;
      if (!set) {
        const created = await createSet(tx, actor, staffMemberId);
        if (!created) throw new DomainError("STALE_REVISION", "Staff services revision is stale", 409); // perdió la carrera de alta
        setId = created.id;
        nextRevision = 1;
      } else {
        setId = set.id;
        nextRevision = await incrementRevision(tx, actor, setId, expectedRevision);
      }

      // 16. Delete removed.
      await deleteAssignments(tx, actor, setId, removed);

      // 17. Insert added.
      await insertAssignments(tx, actor, setId, added);

      // 19. Audit effective change (U04 §54).
      await audit(tx, {
        actor, operationId, action: "staff.services.replaced", capability: "staff-services.manage",
        resourceType: "STAFF_SERVICE_SET", resourceId: setId,
        changes: { staffMemberId, beforeServiceIds: currentServiceIds, afterServiceIds: target, addedServiceIds: added, removedServiceIds: removed }
      });

      return { staffMemberId, revision: nextRevision, changed: true, serviceIds: target };
    }
  );
}
