import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";
import { randomUUID } from "node:crypto";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-18 concurrent revisions conflict", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const created = await apiRequest(token, "POST", "/v1/staff", { firstName: "Conc", lastName: "Test", email: `conc-${ctx.suffix}@example.com`, inviteNow: false, roles: [] });
  const staffId = created.json.data?.id ?? created.json.id;
  const get = await apiRequest(token, "GET", `/v1/staff/${staffId}`);
  const rev = get.json.revision ?? get.json.data?.revision;
  const a = await apiRequest(token, "PATCH", `/v1/staff/${staffId}`, { firstName: "A", revision: Number(rev) });
  expect(a.status).toBe(200);
  const b = await apiRequest(token, "PATCH", `/v1/staff/${staffId}`, { firstName: "B", revision: Number(rev) });
  expect(b.status).toBe(409);
});

test("E2E-18 idempotency replay", async () => {
  const token = await signIn(ctx.email, ctx.password);
  const id = randomUUID();
  const payload = { firstName: "Idemp", lastName: "Test", email: `idem-${ctx.suffix}@example.com`, inviteNow: false, roles: [] };
  const first = await apiRequest(token, "POST", "/v1/staff", payload, id);
  const replay = await apiRequest(token, "POST", "/v1/staff", payload, id);
  expect(first.status).toBe(200);
  expect(replay.status).toBe(200);
  expect(replay.json.replayed).toBe(true);
});
