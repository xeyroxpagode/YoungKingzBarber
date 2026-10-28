import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-07 suspend and reactivate", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Susp", lastName: "Test", email: `susp-${ctx.suffix}@example.com`, inviteNow: false, roles: ["BARBER"] });
  const staffId = created.json.data?.id ?? created.json.id;
  const get = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  const susp = await apiRequest(token, "POST", `/v1/staff/${staffId}/access/suspend`, { revision: Number(rev), reason: "test" });
expect(susp.status).toBe(200);
  const get2 = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  const rev2 = get2.json.revision ?? get2.json.data?.revision;
  const react = await apiRequest(token, "POST", `/v1/staff/${staffId}/access/reactivate`, { revision: Number(rev2), reason: "test" });
  expect(react.status).toBe(200);
});
