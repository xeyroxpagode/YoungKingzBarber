import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-03 issue and revoke invitation", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Invitado", lastName: "Test", email: `inv-${ctx.suffix}@example.com`, inviteNow: true, roles: ["BARBER"] });
  expect(created.status).toBe(200);
  const staffId = created.json.data?.id ?? created.json.id;
  const invs = await apiRequest(token, "GET", `/v1/staff/${staffId}/invitations`);
  expect(invs.status).toBe(200);
  const invId = Array.isArray(invs.json) ? invs.json[0]?.id : (invs.json.data?.[0]?.id ?? invs.json.items?.[0]?.id);
  const revoked = await apiRequest(token, "POST", `/v1/invitations/${invId}/revoke`);
  expect([200, 204]).toContain(revoked.status);
});
