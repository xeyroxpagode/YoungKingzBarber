import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-06 delegation grant and revoke", async () => {
  const token = await signIn(ctx.email, ctx.password);
  // create receptionist staff
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Recep", lastName: "Test", email: `recep-${ctx.suffix}@example.com`, inviteNow: false, roles: ["RECEPTIONIST"] });
  const staffId = created.json.data?.id ?? created.json.id;
  const roles = await apiRequest(token, "GET", `/v1/staff/${staffId}/roles`);
  const raId = Array.isArray(roles.json) ? roles.json[0]?.id : roles.json.data?.[0]?.id;
  const grant = await apiRequest(token, "POST", `/v1/staff/${staffId}/grants`, { roleAssignmentId: raId, capability: "iam.staff.list" });
  expect(grant.status).toBe(200);
  const grants = await apiRequest(token, "GET", `/v1/staff/${staffId}/grants`);
  const gId = Array.isArray(grants.json) ? grants.json[0]?.id : grants.json.data?.[0]?.id;
  const revoked = await apiRequest(token, "POST", `/v1/grants/${gId}/revoke`);
  expect([200, 204]).toContain(revoked.status);
});
