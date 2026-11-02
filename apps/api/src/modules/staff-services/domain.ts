import { DomainError } from "@youngkingz/contracts";
import { z } from "zod";

const uuidSchema = z.string().uuid();

// Canonical in-memory representation of a Staff <-> Service assignment set.
// Order has no semantics: [A,B] == [B,A,A]. Validation, deduplication and
// deterministic sorting happen here (U04 §30).
export function canonicalizeServiceIds(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of input) {
    if (!uuidSchema.safeParse(id).success) throw new DomainError("VALIDATION_ERROR", `Invalid service id: ${id}`, 400, { issue: "INVALID_SERVICE_ID", value: id });
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result.sort();
}

export function serviceSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function diffSets(current: readonly string[], target: readonly string[]): { added: string[]; removed: string[] } {
  const currentSet = new Set(current);
  const targetSet = new Set(target);
  const added = target.filter((id) => !currentSet.has(id));
  const removed = current.filter((id) => !targetSet.has(id));
  return { added, removed };
}
