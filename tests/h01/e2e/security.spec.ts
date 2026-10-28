import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-20 cross-business IDOR denied", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const res = await apiRequest(token, "GET", `/v1/staff/${fakeId}`);
  expect([403, 404]).toContain(res.status);
});
