import { describe, expect, it } from "vitest";
import { canonicalizeServiceIds, diffSets, serviceSetsEqual } from "../../../apps/api/src/modules/staff-services/domain";

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";
const ID3 = "33333333-3333-4333-8333-333333333333";

describe("H02.U04 staff-services domain canonicalization", () => {
  it("validates UUIDs and rejects invalid ids", () => {
    expect(() => canonicalizeServiceIds(["not-a-uuid"])).toThrow();
  });

  it("deduplicates repeated ids", () => {
    expect(canonicalizeServiceIds([ID1, ID2, ID1, ID3, ID2])).toEqual([ID1, ID2, ID3]);
  });

  it("sorts deterministically", () => {
    expect(canonicalizeServiceIds([ID3, ID1, ID2])).toEqual([ID1, ID2, ID3]);
  });

  it("empty input yields empty set", () => {
    expect(canonicalizeServiceIds([])).toEqual([]);
  });

  it("set equality is order independent after canonicalization", () => {
    expect(serviceSetsEqual(canonicalizeServiceIds([ID1, ID2]), canonicalizeServiceIds([ID2, ID1]))).toBe(true);
    expect(serviceSetsEqual(canonicalizeServiceIds([ID1, ID2]), canonicalizeServiceIds([ID1, ID2, ID3]))).toBe(false);
    expect(serviceSetsEqual([], [])).toBe(true);
  });

  it("diff computes added and removed correctly", () => {
    expect(diffSets([ID1, ID2], [ID2, ID3])).toEqual({ added: [ID3], removed: [ID1] });
    expect(diffSets([ID1, ID2], [ID1, ID2])).toEqual({ added: [], removed: [] });
    expect(diffSets([], [ID1])).toEqual({ added: [ID1], removed: [] });
    expect(diffSets([ID1], [])).toEqual({ added: [], removed: [ID1] });
  });

  it("duplicate input collapses to same semantics as deduped input", () => {
    const raw = [ID2, ID1, ID1, ID2];
    const canonical = canonicalizeServiceIds(raw);
    expect(canonical).toEqual([ID1, ID2]);
    expect(serviceSetsEqual(canonical, [ID1, ID2])).toBe(true);
  });
});
