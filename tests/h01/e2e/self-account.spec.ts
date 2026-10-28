import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-12 edit profile persists", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const me = await apiRequest(token, "GET", "/v1/iam/me");
  const rev = me.json.revision ?? me.json.data?.revision;
  const upd = await apiRequest(token, "PATCH", "/v1/iam/me", { firstName: "Editado", lastName: "Test", phone: "123", revision: Number(rev) });
  expect(upd.status).toBe(200);
  const me2 = await apiRequest(token, "GET", "/v1/iam/me");
  expect(me2.json.firstName ?? me2.json.data?.firstName).toBe("Editado");
});
