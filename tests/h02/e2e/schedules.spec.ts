import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { cleanupContext, createOwnerContext } from "../../h01/e2e/helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.setTimeout(90_000);
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => {
  // Schedules reference Staff with ON DELETE RESTRICT; clear them before h01 cleanup.
  await ctx.db`delete from team.staff_schedule_intervals where business_id = ${ctx.businessId}`;
  await ctx.db`delete from team.staff_weekly_schedules where business_id = ${ctx.businessId}`;
  await cleanupContext(ctx);
});

async function createStaff(label: string) {
  const id = randomUUID();
  const [person] = await ctx.db`insert into iam.persons(first_name, last_name) values ('Barbero', ${label}) returning id`;
  await ctx.db`insert into team.staff_members(id, business_id, person_id, employment_status, access_status) values (${id}, ${ctx.businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE')`;
  await ctx.db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${ctx.businessId}, ${id})`;
  await ctx.db`insert into iam.staff_role_states(business_id, staff_member_id) values (${ctx.businessId}, ${id})`;
  await ctx.db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${ctx.businessId}, ${id}, 'BARBER', now(), ${ctx.accountId})`;
  return id;
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
}

async function openSchedule(page: import("@playwright/test").Page, staffId: string) {
  await login(page);
  await page.goto(`/team/${staffId}/schedule`);
  await expect(page.getByRole("heading", { name: "Semana" })).toBeVisible();
  return page.locator(".day-block", { has: page.getByRole("heading", { name: "Lunes" }) });
}

test("H02.U03 Owner configures a weekly schedule, saves the whole week, and persists on reopen", async ({ page }) => {
  const staffId = await createStaff("Horario");
  const monday = await openSchedule(page, staffId);
  await monday.getByRole("button", { name: "Agregar bloque" }).click();
  await monday.getByLabel("Lunes inicio").fill("10:00");
  await monday.getByLabel("Lunes fin").fill("19:00");
  await page.getByRole("button", { name: "Lunes a Lun–Vie" }).click();
  const saturday = page.locator(".day-block", { has: page.getByRole("heading", { name: "Sábado" }) });
  await saturday.getByRole("button", { name: "Agregar bloque" }).click();
  await saturday.getByLabel("Sábado inicio").fill("10:00");
  await saturday.getByLabel("Sábado fin").fill("18:00");

  await expect(page.getByText("Sin guardar")).toBeVisible();
  await page.getByRole("button", { name: "Guardar horarios" }).click();
  await expect(page.getByText("El horario semanal fue guardado.")).toBeVisible();

  await page.goto(`/team/${staffId}/schedule`);
  await expect(page.getByText("Revisión 1")).toBeVisible();
  await expect(monday.getByLabel("Lunes inicio")).toHaveValue("10:00");
  await expect(monday.getByLabel("Lunes fin")).toHaveValue("19:00");
  await expect(page.locator(".day-block", { has: page.getByRole("heading", { name: "Domingo" }) }).getByText("No trabaja")).toBeVisible();
});

test("H02.U03 split-day Wednesday configures two intervals and persists both", async ({ page }) => {
  const staffId = await createStaff("Dividido");
  await openSchedule(page, staffId);
  const wednesday = page.locator(".day-block", { has: page.getByRole("heading", { name: "Miércoles" }) });
  await wednesday.getByRole("button", { name: "Agregar bloque" }).click(); // block 1 (empty day starts with none)
  await wednesday.getByRole("button", { name: "Agregar bloque" }).click(); // block 2
  await wednesday.getByLabel("Miércoles inicio").nth(0).fill("10:00");
  await wednesday.getByLabel("Miércoles fin").nth(0).fill("13:00");
  await wednesday.getByLabel("Miércoles inicio").nth(1).fill("14:00");
  await wednesday.getByLabel("Miércoles fin").nth(1).fill("19:00");
  await page.getByRole("button", { name: "Guardar horarios" }).click();
  await expect(page.getByText("El horario semanal fue guardado.")).toBeVisible();
  await page.goto(`/team/${staffId}/schedule`);
  await expect(wednesday.locator(".interval-row")).toHaveCount(2);
});

test("H02.U03 editor blocks overlapping blocks before saving", async ({ page }) => {
  const staffId = await createStaff("Solape");
  const monday = await openSchedule(page, staffId);
  await monday.getByRole("button", { name: "Agregar bloque" }).click();
  await monday.getByRole("button", { name: "Agregar bloque" }).click();
  await monday.getByLabel("Lunes inicio").nth(1).fill("14:00");
  await monday.getByLabel("Lunes fin").nth(1).fill("17:00"); // intersects default 09:00–17:00 first block
  await expect(page.getByText(/se superponen/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar horarios" })).toBeDisabled();
});

test("H02.U03 team list shows a daily schedule summary per member", async ({ page }) => {
  await login(page);
  const row = page.locator(".staff-row", { hasText: "Barbero Horario" });
  await expect(row).toBeVisible();
  await expect(row.locator(".schedule-today")).toBeVisible();
});

test("H02.U03 weekly editor meets accessibility baseline and reconciles a lost save response", async ({ page }) => {
  const staffId = await createStaff("Accesible");
  await openSchedule(page, staffId);
  const monday = page.locator(".day-block", { has: page.getByRole("heading", { name: "Lunes" }) });
  await monday.getByRole("button", { name: "Agregar bloque" }).click();
  await monday.getByLabel("Lunes inicio").fill("11:00");
  await monday.getByLabel("Lunes fin").fill("18:00");

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);

  let intercepted = false;
  await page.route(`**/v1/staff/${staffId}/schedule`, async (route) => {
    if (route.request().method() !== "PUT" || intercepted) { await route.continue(); return; }
    intercepted = true;
    await route.fetch();
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Guardar horarios" }).click();
  await expect(page.getByText("El horario semanal fue guardado.")).toBeVisible({ timeout: 15_000 });
});
