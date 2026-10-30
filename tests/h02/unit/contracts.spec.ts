import { describe, expect, it } from "vitest";
import {
  capabilities, commercialTermsSchema, createServiceSchema, delegableCapabilities,
  moneySchema, roleCapabilities, updateServiceProfileSchema
} from "@youngkingz/contracts";

describe("H02 catalog contracts", () => {
  it("accepts zero ARS and rejects float, negative, or other currencies", () => {
    expect(moneySchema.parse({ amountMinor: 0, currency: "ARS" })).toEqual({ amountMinor: 0, currency: "ARS" });
    for (const value of [{ amountMinor: -1, currency: "ARS" }, { amountMinor: 1.2, currency: "ARS" }, { amountMinor: 10, currency: "USD" }]) {
      expect(moneySchema.safeParse(value).success).toBe(false);
    }
  });

  it("validates duration and defaults omitted buffers to zero", () => {
    const terms = commercialTermsSchema.parse({ money: { amountMinor: 10_000, currency: "ARS" }, durationMinutes: 30 });
    expect(terms.preBufferMinutes).toBe(0);
    expect(terms.postBufferMinutes).toBe(0);
    expect(commercialTermsSchema.safeParse({ ...terms, durationMinutes: 0 }).success).toBe(false);
    expect(commercialTermsSchema.safeParse({ ...terms, preBufferMinutes: -1 }).success).toBe(false);
  });

  it("allows minimal draft creation and requires a real profile mutation", () => {
    expect(createServiceSchema.parse({ name: " Corte " }).name).toBe("Corte");
    expect(updateServiceProfileSchema.safeParse({ expectedRevision: 1 }).success).toBe(false);
    expect(updateServiceProfileSchema.safeParse({ expectedRevision: 1, categoryId: null }).success).toBe(true);
  });

  it("publishes the frozen IAM metadata", () => {
    expect(capabilities).toEqual(expect.arrayContaining(["catalog.read", "catalog.services.update_terms", "catalog.categories.manage"]));
    expect(roleCapabilities.OWNER).toEqual(expect.arrayContaining(["catalog.read", "catalog.services.publish"]));
    expect(roleCapabilities.RECEPTIONIST).toContain("catalog.read");
    expect(roleCapabilities.BARBER).not.toContain("catalog.read");
    expect(delegableCapabilities).toContain("catalog.services.update_terms");
  });
});
