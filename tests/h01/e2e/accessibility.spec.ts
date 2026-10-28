import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createOwnerContext, cleanupContext, signIn } from "./helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => { await cleanupContext(ctx); });

test("accessibility login has no critical violations", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const critical = results.violations.filter(v => v.impact === "critical" || v.impact === "serious");
expect(critical).toEqual([]);
});

test("accessibility team page has no critical violations", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const critical = results.violations.filter(v => v.impact === "critical" || v.impact === "serious");
  expect(critical).toEqual([]);
});
