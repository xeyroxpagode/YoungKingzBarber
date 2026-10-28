import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-15 sessions list and pagination", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const res = await apiRequest(token, "GET", "/v1/iam/access-sessions?view=ACTIVE&limit=5");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.json.items)).toBe(true);
});
