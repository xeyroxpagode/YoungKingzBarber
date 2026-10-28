import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-05 last owner protected", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const get = await apiRequest(token, "GET", `/v1/staff/${ctx.staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  const res = await apiRequest(token, "PATCH", `/v1/staff/${ctx.staffId}/roles`, { roles: [], revision: Number(rev) });
  expect(res.status).toBe(409);
});
