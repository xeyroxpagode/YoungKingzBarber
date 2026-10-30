import type { CommercialTerms, PublishRequirementCode } from "@youngkingz/contracts";

export interface CompletenessInput {
  name: string;
  categoryId: string | null;
  categoryLifecycle: "ACTIVE" | "ARCHIVED" | null;
  currentTerms: CommercialTerms | null;
}

export function deriveServiceCompleteness(input: CompletenessInput) {
  const missingRequirements: PublishRequirementCode[] = [];
  if (!input.categoryId) missingRequirements.push("CATEGORY_REQUIRED");
  else if (input.categoryLifecycle !== "ACTIVE") missingRequirements.push("ACTIVE_CATEGORY_REQUIRED");
  if (!input.currentTerms) missingRequirements.push("CURRENT_TERMS_REQUIRED");
  return { complete: input.name.trim().length > 0 && missingRequirements.length === 0, missingRequirements };
}

export function derivePublishability(input: CompletenessInput & { lifecycle: "ACTIVE" | "ARCHIVED" }) {
  const completeness = deriveServiceCompleteness(input);
  return { ...completeness, canPublish: input.lifecycle === "ACTIVE" && completeness.complete };
}

export function commercialTermsEqual(left: CommercialTerms | null, right: CommercialTerms): boolean {
  if (!left) return false;
  return left.money.amountMinor === right.money.amountMinor
    && left.money.currency === right.money.currency
    && left.durationMinutes === right.durationMinutes
    && left.preBufferMinutes === right.preBufferMinutes
    && left.postBufferMinutes === right.postBufferMinutes
    && (left.conditions ?? null) === (right.conditions ?? null);
}

export function categoryNameNormalization(name: string): string {
  return name.trim().toLocaleLowerCase("es");
}
