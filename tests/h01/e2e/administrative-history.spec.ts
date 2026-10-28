import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-19 audit history returns entries", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const res = await apiRequest(token, "GET", "/v1/audit?limit=10");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.json)).toBe(true);
});
