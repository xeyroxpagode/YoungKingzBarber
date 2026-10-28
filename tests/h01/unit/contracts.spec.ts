import { describe, expect, it } from "vitest";
import { capabilities, createStaffSchema, delegableCapabilities, roleCapabilities } from "@youngkingz/contracts";
import { assertYoungKingzLocalDatabase } from "@youngkingz/config";
import { canonicalJson, stableHash } from "../../../apps/api/src/lib/crypto";

describe("H01 contract invariants",()=>{
  it("defaults to the exact three staff roles",()=>{expect(Object.keys(roleCapabilities)).toEqual(["OWNER","RECEPTIONIST","BARBER"]);});
  it("never delegates authority over roles, grants, access or recovery",()=>{expect(delegableCapabilities.every(item=>!item.includes("roles")&&!item.includes("grants")&&!item.includes("access")&&!item.includes("recover"))).toBe(true);});
  it("requires an email only when an invitation is emitted",()=>{expect(createStaffSchema.safeParse({firstName:"Ana",inviteNow:false}).success).toBe(true);expect(createStaffSchema.safeParse({firstName:"Ana",inviteNow:true}).success).toBe(false);});
  it("keeps idempotency hashes stable across object key order",()=>{expect(stableHash({a:1,b:2})).toBe(stableHash({b:2,a:1}));expect(canonicalJson({b:2,a:1})).toBe('{"a":1,"b":2}');});
  it("refuses destructive database commands outside the isolated local port",()=>{expect(()=>assertYoungKingzLocalDatabase("postgresql://postgres:postgres@localhost:55322/postgres")).not.toThrow();expect(()=>assertYoungKingzLocalDatabase("postgresql://remote.example:5432/prod")).toThrow(/Refusing/);});
  it("gives Owners the H01 catalog but excludes exceptional recovery",()=>{expect(roleCapabilities.OWNER).toContain("iam.audit.read");expect(roleCapabilities.OWNER).not.toContain("iam.security.recover");expect(capabilities).toContain("iam.security.recover");});
});
