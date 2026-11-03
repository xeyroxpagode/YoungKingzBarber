import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { cleanupContext, createOwnerContext } from "../../h01/e2e/helpers";
import postgres from "postgres";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
let db: ReturnType<typeof postgres>;
let businessId: string;

test.setTimeout(90_000);

test.beforeAll(async () => {
  ctx = await createOwnerContext();
  db = ctx.db;
  businessId = ctx.businessId;
  // Pre-crear un cliente directamente en BD para probar lectura vía UI
  await db`insert into clients.client_profiles(id, business_id, name, first_name, last_name, lifecycle_state, revision, created_at, updated_at)
    values (gen_random_uuid(), ${businessId}, 'Cliente E2E Inicial', 'Juan', 'Pérez', 'active', 1, now(), now())`;
  await db`insert into clients.client_contacts(id, business_id, client_profile_id, type, value, normalized_value, label, is_primary, created_at, updated_at)
    values (gen_random_uuid(), ${businessId}, (select id from clients.client_profiles where business_id = ${businessId} and name = 'Cliente E2E Inicial' limit 1), 'telefono', '11 4444 9000', '1144449000', 'principal', true, now(), now())`;
});

test.afterAll(async () => {
  await db`delete from clients.client_account_links where business_id = ${businessId}`;
  await db`delete from clients.client_notes where business_id = ${businessId}`;
  await db`delete from clients.client_contacts where business_id = ${businessId}`;
  await db`delete from clients.client_profiles where business_id = ${businessId}`;
  await cleanupContext(ctx);
  await db.end();
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill(ctx.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
}

test("H03.U01 E2E Owner: leer cliente en listado y abrir detalle", async ({ page }) => {
  await login(page);

  // Navegar a Clientes
  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(page.locator("h1.page-title")).toHaveText("Clientes");

  // El cliente pre-creado aparece en el listado
  await expect(page.locator(".staff-name", { hasText: "Cliente E2E Inicial" })).toBeVisible();

  // Abrir detalle
  await page.locator(".staff-name", { hasText: "Cliente E2E Inicial" }).first().click();
  await expect(page.getByRole("heading", { name: "Cliente E2E Inicial", exact: false })).toBeVisible();
  await expect(page.getByText("Juan Pérez")).toBeVisible();
});

test("H03.U01 E2E Barbero no accede a Clientes", async ({ page }) => {
  // Crear un barbero en el mismo negocio
  const barberEmail = `barber-e2e-${randomUUID().slice(0, 6)}@example.com`;
  const barberPassword = "YoungKingz-E2E!26";
  await ctx.admin.auth.admin.createUser({ email: barberEmail, password: barberPassword, email_confirm: true });
  const [person] = await db`insert into iam.persons(first_name, last_name) values ('Barber', 'E2E') returning id`;
  const [staff] = await db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE') returning id`;
  await db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  await db`insert into iam.staff_role_states(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  await db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${businessId}, ${staff!.id}, 'BARBER', now(), ${ctx.accountId})`;
  await db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status) values (${person!.id}, (select id from auth.users where email = ${barberEmail}), ${barberEmail}, 'ACTIVE')`;
  await db`insert into iam.account_security_states(account_id) values ((select id from iam.user_accounts where person_id = ${person!.id}))`;

  await page.goto("/login");
  await page.getByLabel("Correo").fill(barberEmail);
  await page.getByLabel("Contraseña").fill(barberPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);

  // El barbero no debe ver el enlace Clientes
  await expect(page.getByRole("link", { name: "Clientes" })).toHaveCount(0);

  // Acceso directo a /clients debe denegar y redirigir a /account
  await page.goto("/clients");
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
});
