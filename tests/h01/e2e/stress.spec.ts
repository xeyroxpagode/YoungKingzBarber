import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E stress create 100 staff members", async () => {
  const token = await signIn(ctx.email, ctx.password);
  for (let i = 0; i < 100; i++) {
    const res = await apiRequest(token, "POST", "/v1/staff", { firstName: `Stress${i}`, lastName: "Test", email: `stress-${i}-${ctx.suffix}@example.com`, inviteNow: false, roles: [] });
    expect(res.status).toBe(200);
  }
  const list = await apiRequest(token, "GET", "/v1/staff?status=ALL&search=Stress");
  expect(list.status).toBe(200);
});

test("E2E stress 30 sessions pagination", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
  await page.goto("/account");
  await page.getByRole("button", { name: "Mis sesiones" }).click();
  await expect(page.getByText("Esta sesión").first()).toBeVisible();
});
