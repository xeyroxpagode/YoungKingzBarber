import { api, ApiError } from "@/lib/api/client";

export type MutationResult<T> = { data: T; replayed: boolean };
type OperationStatus<T> = { operationId: string; status: "STARTED" | "SUCCEEDED" | "FAILED"; responseStatus: number | null; responseBody: T | { error?: { code?: string; message?: string; details?: unknown } } | null; errorCode: string | null };

export class TransportUncertainError extends Error {
  constructor(public readonly operationId: string) { super("El servidor todavía está reconciliando la operación."); }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError || (typeof error === "object" && error !== null && "code" in error && "status" in error);
}

export async function catalogMutation<T>(path: string, method: "POST" | "PATCH" | "PUT", body: unknown, existingOperationId?: string): Promise<MutationResult<T>> {
  const operationId = existingOperationId ?? crypto.randomUUID();
  try {
    return await api<MutationResult<T>>(path, { method, operationId, body: JSON.stringify(body) });
  } catch (error) {
    if (isApiError(error)) throw error;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
      try {
        const operation = await api<OperationStatus<T>>(`/v1/operations/${operationId}`);
        if (operation.status === "SUCCEEDED") return { data: operation.responseBody as T, replayed: true };
        if (operation.status === "FAILED") {
          const body = operation.responseBody as { error?: { code?: string; message?: string; details?: unknown } } | null;
          throw new ApiError(body?.error?.code ?? operation.errorCode ?? "REQUEST_FAILED", body?.error?.message ?? "La operación terminó con error", operation.responseStatus ?? 409, body?.error?.details);
        }
      } catch (lookupError) {
        if (isApiError(lookupError) && lookupError.code !== "NOT_FOUND" && lookupError.code !== "REQUEST_FAILED") throw lookupError;
      }
    }
    throw new TransportUncertainError(operationId);
  }
}

export function getServices(query = "", signal?: AbortSignal) { return api<ServiceListResponse>(`/v1/catalog/services${query ? `?${query}` : ""}`, { signal }); }
export function getService(id: string, signal?: AbortSignal) { return api<ServiceDetail>(`/v1/catalog/services/${id}`, { signal }); }
export function getTermsHistory(id: string, signal?: AbortSignal) { return api<TermsVersion[]>(`/v1/catalog/services/${id}/terms/history`, { signal }); }
export function getCategories(query = "", signal?: AbortSignal) { return api<CategoryListResponse>(`/v1/catalog/categories${query ? `?${query}` : ""}`, { signal }); }

export type Terms = { money: { amountMinor: number; currency: "ARS" }; durationMinutes: number; preBufferMinutes: number; postBufferMinutes: number; conditions?: string | null };
export type TermsVersion = Terms & { id: string; versionNumber: number; effectiveFrom: string; current: boolean };
export type Category = { id: string; name: string; lifecycle: "ACTIVE" | "ARCHIVED"; revision: number; activeServiceCount: number; publishedServiceCount: number };
export type ServiceSummary = { id: string; name: string; category: { id: string; name: string; lifecycle: string } | null; lifecycle: "ACTIVE" | "ARCHIVED"; publication: "UNPUBLISHED" | "PUBLISHED"; complete: boolean; revision: number; currentTerms: (Terms & { versionNumber: number }) | null };
export type ServiceDetail = ServiceSummary & { description: string | null; canPublish: boolean; missingRequirements: string[]; createdAt: string; updatedAt: string };
export type ServiceListResponse = { items: ServiceSummary[]; nextCursor: string | null };
export type CategoryListResponse = { items: Category[]; nextCursor: string | null };
