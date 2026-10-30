import { expect, test } from "@playwright/test";
import { createOwnerContext, cleanupContext } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("E2E-01 login valid and invalid", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
  // invalid
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill("wrong-password-123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("E2E-01 session persists after reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
  await page.reload();
  await expect(page).toHaveURL(/\/team/);
  await expect(page.getByRole("heading", { name: "Equipo" })).toBeVisible();
});
