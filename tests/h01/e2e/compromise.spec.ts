import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-17 compromised blocks sessions", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const res = await apiRequest(token, "POST", "/v1/iam/account-security/compromised");
  expect(res.status).toBe(200);
  const me = await apiRequest(token, "GET", "/v1/iam/me");
  expect(me.status).toBe(403);
});
