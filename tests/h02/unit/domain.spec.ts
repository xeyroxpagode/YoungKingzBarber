import { describe, expect, it } from "vitest";
import { categoryNameNormalization, commercialTermsEqual, derivePublishability, deriveServiceCompleteness } from "../../../apps/api/src/modules/catalog/domain";

const terms = { money: { amountMinor: 0, currency: "ARS" as const }, durationMinutes: 30, preBufferMinutes: 0, postBufferMinutes: 0 };

describe("H02 catalog domain", () => {
  it("derives completeness and stable requirement codes", () => {
    expect(deriveServiceCompleteness({ name: "Corte", categoryId: null, categoryLifecycle: null, currentTerms: null })).toEqual({
      complete: false, missingRequirements: ["CATEGORY_REQUIRED", "CURRENT_TERMS_REQUIRED"]
    });
    expect(deriveServiceCompleteness({ name: "Corte", categoryId: "category", categoryLifecycle: "ARCHIVED", currentTerms: terms })).toEqual({
      complete: false, missingRequirements: ["ACTIVE_CATEGORY_REQUIRED"]
    });
  });

  it("does not publish an archived service even when complete", () => {
    expect(derivePublishability({ name: "Corte", categoryId: "category", categoryLifecycle: "ACTIVE", currentTerms: terms, lifecycle: "ARCHIVED" }).canPublish).toBe(false);
  });

  it("compares full resulting commercial terms", () => {
    expect(commercialTermsEqual(terms, { ...terms })).toBe(true);
    expect(commercialTermsEqual(terms, { ...terms, money: { amountMinor: 1, currency: "ARS" } })).toBe(false);
    expect(commercialTermsEqual({ ...terms, conditions: null }, { ...terms })).toBe(true);
  });

  it("normalizes category names by case and surrounding whitespace", () => {
    expect(categoryNameNormalization("  Barbería  ")).toBe("barbería");
  });
});
