import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-08 revoke access without deleting identity", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Rev", lastName: "Test", email: `rev-${ctx.suffix}@example.com`, inviteNow: false, roles: ["BARBER"] });
  const staffId = created.json.data?.id ?? created.json.id;
  const get = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  const r = await apiRequest(token, "POST", `/v1/staff/${staffId}/access/revoke`, { revision: Number(rev), reason: "test" });
  expect(r.status).toBe(200);
  const get2 = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  expect(get2.status).toBe(200);
});
