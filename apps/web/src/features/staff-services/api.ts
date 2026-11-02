import { api } from "@/lib/api/client";

export type StaffServiceOption = {
  id: string;
  name: string;
  lifecycle: "ACTIVE" | "ARCHIVED";
  publication: "UNPUBLISHED" | "PUBLISHED";
  assigned: boolean;
  assignable: boolean;
};

export type StaffServicesResponse = {
  staffMemberId: string;
  displayName: string;
  employmentStatus: string;
  revision: number;
  serviceIds: string[];
  services: StaffServiceOption[];
};

export type ReplaceStaffServicesResult = {
  staffMemberId: string;
  revision: number;
  changed: boolean;
  serviceIds: string[];
};

export type MyServicesResponse = {
  staffMemberId: string;
  employmentStatus: string;
  services: StaffServiceOption[];
};

export function getStaffServices(staffMemberId: string, signal?: AbortSignal) {
  return api<StaffServicesResponse>(`/v1/staff/${staffMemberId}/services`, { signal });
}

export function replaceStaffServices(
  staffMemberId: string,
  expectedRevision: number,
  serviceIds: string[]
) {
  const operationId = crypto.randomUUID();
  return api<{ data: ReplaceStaffServicesResult; replayed: boolean }>(`/v1/staff/${staffMemberId}/services`, {
    method: "PUT",
    operationId,
    body: JSON.stringify({ expectedRevision, serviceIds })
  }).then((result) => result.data);
}

export function getMyServices(signal?: AbortSignal) {
  return api<MyServicesResponse>("/v1/staff-services/me", { signal });
}

export function staffServiceStateLabel(option: StaffServiceOption): string {
  if (!option.assigned) return "No asignado";
  if (option.lifecycle === "ARCHIVED") return "Asignado (archivado)";
  return option.publication === "PUBLISHED" ? "Asignado y publicado" : "Asignado";
}
