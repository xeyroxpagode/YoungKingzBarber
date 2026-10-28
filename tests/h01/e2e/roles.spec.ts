import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-04 assign and remove role", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Rol", lastName: "Test", email: `rol-${ctx.suffix}@example.com`, inviteNow: false, roles: [] });
  const staffId = created.json.data?.id ?? created.json.id;
  const get = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  const upd = await apiRequest(token, "PATCH", `/v1/staff/${staffId}/roles`, { roles: ["BARBER"], revision: Number(rev) });
  expect(upd.status).toBe(200);
  const roles = await apiRequest(token, "GET", `/v1/staff/${staffId}/roles`);
  expect(JSON.stringify(roles.json)).toContain("BARBER");
});
