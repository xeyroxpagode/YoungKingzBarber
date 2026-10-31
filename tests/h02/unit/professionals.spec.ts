import { describe,expect,it } from "vitest";
import {
  createProfessionalProfileSchema, delegableCapabilities, roleCapabilities,
  updateMyProfessionalProfileSchema, updateProfessionalProfileSchema
} from "@youngkingz/contracts";
import { effectiveDisplayName, professionallyEnabled, sameProfessionalPresentation } from "../../../apps/api/src/modules/professionals/domain";

describe("H02.U02 Professional Profile contracts",()=>{
  it("keeps professional identity independent from roles",()=>{
    expect(roleCapabilities.OWNER).toContain("professionals.create");
    expect(roleCapabilities.BARBER).toContain("professionals.self.update");
    expect(roleCapabilities.BARBER).not.toContain("professionals.create");
    expect(roleCapabilities.RECEPTIONIST).toContain("professionals.read");
    expect(roleCapabilities.RECEPTIONIST).not.toContain("professionals.update");
  });

  it("delegates management but not self capabilities",()=>{
    expect(delegableCapabilities).toEqual(expect.arrayContaining(["professionals.create","professionals.update","professionals.lifecycle"]));
    expect(delegableCapabilities).not.toContain("professionals.self.update");
  });

  it("normalizes blank presentation fields to null and trims strings",()=>{
    expect(createProfessionalProfileSchema.parse({staffMemberId:"5cd49e1c-17e2-4bee-9b78-59b7106d210e",professionalDisplayName:"  ",bio:" bio "})).toMatchObject({professionalDisplayName:null,bio:"bio"});
  });

  it("uses distinct strict admin and self schemas",()=>{
    expect(updateProfessionalProfileSchema.parse({expectedRevision:1,publicTitle:"Director"}).publicTitle).toBe("Director");
    expect(()=>updateMyProfessionalProfileSchema.parse({expectedRevision:1,publicTitle:"Director"})).toThrow();
    expect(()=>updateMyProfessionalProfileSchema.parse({expectedRevision:1,status:"INACTIVE"})).toThrow();
    expect(()=>updateMyProfessionalProfileSchema.parse({expectedRevision:1,staffMemberId:"5cd49e1c-17e2-4bee-9b78-59b7106d210e"})).toThrow();
  });

  it("enforces V1 string bounds",()=>{
    expect(()=>updateProfessionalProfileSchema.parse({expectedRevision:1,professionalDisplayName:"x".repeat(81)})).toThrow();
    expect(()=>updateProfessionalProfileSchema.parse({expectedRevision:1,bio:"x".repeat(501)})).toThrow();
    expect(()=>updateProfessionalProfileSchema.parse({expectedRevision:1,publicTitle:"x".repeat(81)})).toThrow();
  });
});

describe("H02.U02 Professional Profile domain",()=>{
  it("derives the effective display name without duplicating Person identity",()=>{
    expect(effectiveDisplayName({professionalDisplayName:null,firstName:"Ada",lastName:"Lovelace"})).toBe("Ada Lovelace");
    expect(effectiveDisplayName({professionalDisplayName:"Ada Pro",firstName:"Ada",lastName:"Lovelace"})).toBe("Ada Pro");
  });

  it("derives professionallyEnabled from only profile and employment status",()=>{
    expect(professionallyEnabled("ACTIVE","ACTIVE")).toBe(true);
    expect(professionallyEnabled("ACTIVE","INACTIVE")).toBe(false);
    expect(professionallyEnabled("INACTIVE","ACTIVE")).toBe(false);
  });

  it("detects semantic presentation no-ops",()=>{
    const current={professionalDisplayName:"A",bio:null,publicTitle:"B"};
    expect(sameProfessionalPresentation(current,{...current})).toBe(true);
    expect(sameProfessionalPresentation(current,{...current,bio:"C"})).toBe(false);
  });
});
