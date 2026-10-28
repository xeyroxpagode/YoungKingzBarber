import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-10 multirole context switching", async () => {
  const token = await signIn(ctx.email, ctx.password);
  // add BARBER role to owner
  const get = await apiRequest(token, "GET", `/v1/staff/${ctx.staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  await apiRequest(token, "PATCH", `/v1/staff/${ctx.staffId}/roles`, { roles: ["OWNER", "BARBER"], revision: Number(rev) });
  const ctxs = await apiRequest(token, "GET", "/v1/iam/contexts");
  expect(Array.isArray(ctxs.json) ? ctxs.json.length : ctxs.json.data?.length).toBeGreaterThanOrEqual(2);
  const current = await apiRequest(token, "GET", "/v1/iam/context");
  const barber = (Array.isArray(ctxs.json) ? ctxs.json : ctxs.json.data).find((c: any) => c.role === "BARBER");
  const sw = await apiRequest(token, "PUT", "/v1/iam/context", { roleAssignmentId: barber.roleAssignmentId, revision: Number(current.json.revision ?? current.json.data?.revision) });
  expect(sw.status).toBe(200);
  // barber cannot list staff
  const denied = await apiRequest(token, "GET", "/v1/staff");
  expect(denied.status).toBe(403);
});
