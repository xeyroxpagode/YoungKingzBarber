import { expect, test } from "@playwright/test";
import { cleanupContext, createOwnerContext } from "../../h01/e2e/helpers";

// U03 corrective reconciliation: ProfessionalProfile is out of the Product surface
// (U03 §56, §57, §73) while its backend stays intact (§101). These E2E assert the NEW
// product truth instead of the replaced one (§100).

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.setTimeout(120_000);
test.beforeAll(async () => { ctx = await createOwnerContext(); });
test.afterAll(async () => {
  await ctx.db`delete from team.staff_schedule_intervals where business_id = ${ctx.businessId}`;
  await ctx.db`delete from team.staff_weekly_schedules where business_id = ${ctx.businessId}`;
  await cleanupContext(ctx);
});

async function login(page: import("@playwright/test").Page, email: string, expected: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(expected);
}

async function createStaff(role: "RECEPTIONIST" | "BARBER", label: string) {
  const email = `${label}-u03-${ctx.suffix}@example.com`;
  const created = await ctx.admin.auth.admin.createUser({ email, password: ctx.password, email_confirm: true });
  if (created.error) throw created.error;
  ctx.authUserIds.push(created.data.user.id);
  const [person] = await ctx.db`insert into iam.persons(first_name, last_name) values (${label}, 'U03') returning id`;
  ctx.personIds.push(person!.id);
  const [staff] = await ctx.db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${ctx.businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE') returning id`;
  ctx.staffIds.push(staff!.id);
  const [account] = await ctx.db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status) values (${person!.id}, ${created.data.user.id}, ${email}, 'ACTIVE') returning id`;
  ctx.accountIds.push(account!.id);
  await ctx.db`insert into iam.account_security_states(account_id) values (${account!.id})`;
  await ctx.db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${ctx.businessId}, ${staff!.id})`;
  await ctx.db`insert into iam.staff_role_states(business_id, staff_member_id) values (${ctx.businessId}, ${staff!.id})`;
  await ctx.db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${ctx.businessId}, ${staff!.id}, ${role}, now(), ${ctx.accountId})`;
  return { email, staffId: staff!.id as string };
}

test("H02.U03 corrective: /team/professionals and /account/professional leave the Product surface", async ({ page }) => {
  await login(page, ctx.email, /\/team/);
  await expect(page.getByRole("heading", { name: "Equipo", level: 1 })).toBeVisible();
  await page.goto("/team/professionals");
  await page.waitForURL(/\/team$/);
  await expect(page.getByRole("heading", { name: "Perfiles profesionales" })).toHaveCount(0);
  await page.goto("/account/professional");
  await page.waitForURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Mi perfil profesional" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mi perfil profesional" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mi horario" })).toHaveCount(1);
});

test("H02.U03 corrective: buffer fields are removed from Service creation/edition", async ({ page }) => {
  await login(page, ctx.email, /\/team/);
  await page.goto("/services/new");
  await page.getByLabel("Definir términos comerciales iniciales").check();
  await expect(page.getByLabel("Buffer previo (min)")).toHaveCount(0);
  await expect(page.getByLabel("Buffer posterior (min)")).toHaveCount(0);
});

test("H02.U03 corrective: member permissions use a human Administrar horarios toggle, not a raw capability selector", async ({ page }) => {
  await createStaff("RECEPTIONIST", "reception");
  await login(page, ctx.email, /\/team/);
  // Select the reception member to open its detail, then land on its schedule permissions.
  await page.locator(".staff-row", { hasText: "reception U03" }).click();
  await expect(page.getByLabel("Administrar horarios")).toHaveCount(1);
  await expect(page.getByLabel("Administrar horarios")).not.toBeChecked();
  const rawSelect = page.locator("select").filter({ has: page.locator("option", { hasText: "schedules.manage" }) });
  await expect(rawSelect).toHaveCount(0);
});

test("H02.U03 Receptionist sees the operational team by default with no private data and no edit action", async ({ page }) => {
  const reception = await createStaff("RECEPTIONIST", "desk");
  await login(page, reception.email, /\/team/);
  await expect(page.getByRole("heading", { name: "Equipo", level: 1 })).toBeVisible();
  // Operational view must not surface private H01 fields.
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toContain("correo autorizado");
  expect(body).not.toContain("teléfono");
  // Without schedules.manage the member schedule opens read-only.
  await page.goto(`/team/${ctx.staffId}/schedule`);
  await expect(page.getByText("Sólo lectura")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar horarios" })).toHaveCount(0);
});

test("H02.U03 Barber reads Mi horario (self, no ProfessionalProfile required) with no edit action", async ({ page }) => {
  const barber = await createStaff("BARBER", "barber");
  await login(page, barber.email, /\/account/);
  await page.getByRole("link", { name: "Mi horario" }).click();
  await page.waitForURL(/\/account\/schedule/);
  await expect(page.getByRole("heading", { name: "Mi horario" })).toBeVisible();
  await expect(page.getByText("Todavía no configuraste un horario.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar horarios" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Agregar bloque" })).toHaveCount(0);
});
