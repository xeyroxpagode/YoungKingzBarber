import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-02 create staff and verify persistence", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const res = await apiRequest(token, "POST", "/v1/staff", { firstName: "Nuevo", lastName: "Staff", email: `staff-${ctx.suffix}@example.com`, inviteNow: false, roles: [] });
  expect(res.status).toBe(200);
  const id = res.json.data?.id ?? res.json.id;
  const get = await apiRequest(token, "GET", `/v1/staff/${id}`);
  expect(get.status).toBe(200);
  expect(get.json.firstName ?? get.json.data?.firstName).toBe("Nuevo");
});
