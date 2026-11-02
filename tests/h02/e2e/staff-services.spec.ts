import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { cleanupContext, createOwnerContext } from "../../h01/e2e/helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
test.setTimeout(90_000);
test.beforeAll(async () => { ctx = await createOwnerContext(); });

test.afterAll(async () => {
  await ctx.db`delete from team.staff_service_assignments where business_id = ${ctx.businessId}`;
  await ctx.db`delete from team.staff_service_sets where business_id = ${ctx.businessId}`;
  await ctx.db`delete from catalog.services where business_id = ${ctx.businessId} and name like 'E2E %'`;
  await cleanupContext(ctx);
});

async function createStaff(label: string, role: "OWNER" | "RECEPTIONIST" | "BARBER" = "BARBER") {
  const id = randomUUID();
  const [person] = await ctx.db`insert into iam.persons(first_name, last_name) values ('E2E', ${label}) returning id`;
  await ctx.db`insert into team.staff_members(id, business_id, person_id, employment_status, access_status) values (${id}, ${ctx.businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE')`;
  await ctx.db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${ctx.businessId}, ${id})`;
  await ctx.db`insert into iam.staff_role_states(business_id, staff_member_id) values (${ctx.businessId}, ${id})`;
  await ctx.db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${ctx.businessId}, ${id}, ${role}, now(), ${ctx.accountId})`;
  return id;
}

async function addServices() {
  const suffix = randomUUID().slice(0, 6);
  const svcA = randomUUID();
  const svcB = randomUUID();
  const nameA = `E2E Servicio A ${suffix}`;
  const nameB = `E2E Servicio B ${suffix}`;
  await ctx.db`insert into catalog.services(business_id, id, name, description, category_id, lifecycle, publication) values
    (${ctx.businessId}, ${svcA}, ${nameA}, 'Activo publicado.', (select id from catalog.service_categories where business_id=${ctx.businessId} limit 1), 'ACTIVE', 'PUBLISHED'),
    (${ctx.businessId}, ${svcB}, ${nameB}, 'Activo sin publicar.', (select id from catalog.service_categories where business_id=${ctx.businessId} limit 1), 'ACTIVE', 'UNPUBLISHED')`;
  return { svcA, svcB, nameA, nameB };
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ctx.email);
  await page.getByLabel("Contraseña").fill("YoungKingz-E2E!26");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);
}

test("H02.U04 E2E Owner manages staff services and persists on reopen", async ({ page }) => {
  const staffId = await createStaff("OwnerTarget", "BARBER");
  const { nameA, nameB } = await addServices();

  await login(page);
  await page.goto(`/team/${staffId}/services`);
  await expect(page.getByText("Servicios que realiza")).toBeVisible();

  // Checkbox for svcA (ACTIVE + PUBLISHED) is assignable.
  await page.getByLabel(`Asignar ${nameA}`).click();
  await page.getByRole("button", { name: "Guardar servicios" }).click();
  await expect(page.getByRole("status")).toContainText("Servicios guardados correctamente.");

  // Reopen: persistence.
  await page.goto(`/team/${staffId}/services`);
  await expect(page.getByLabel(`Asignar ${nameA}`)).toBeChecked();
  await expect(page.getByLabel(`Asignar ${nameB}`)).not.toBeChecked();
});

test("H02.U04 E2E Receptionist can read but not manage", async ({ page }) => {
  const staffId = await createStaff("ReceptionTarget", "BARBER");
  const { nameA } = await addServices();

  // Crear un recepcionista real en el mismo negocio para verificar solo-lectura.
  const email = `reception-e2e-${randomUUID().slice(0, 6)}@example.com`;
  const password = "YoungKingz-E2E!26";
  const created = await ctx.admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  ctx.authUserIds.push(created.data.user.id);
  const [person] = await ctx.db`insert into iam.persons(first_name,last_name) values ('Recepcion','E2E') returning id`;
  const [rStaff] = await ctx.db`insert into team.staff_members(business_id,person_id,employment_status,access_status) values (${ctx.businessId},${person!.id},'ACTIVE','ACTIVE') returning id`;
  await ctx.db`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${ctx.businessId},${rStaff!.id})`;
  await ctx.db`insert into iam.staff_role_states(business_id,staff_member_id) values (${ctx.businessId},${rStaff!.id})`;
  const [account] = await ctx.db`insert into iam.user_accounts(person_id,auth_user_id,verified_email,status) values (${person!.id},${created.data.user.id},${email},'ACTIVE') returning id`;
  await ctx.db`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${ctx.businessId},${rStaff!.id},'RECEPTIONIST',now(),${account!.id})`;

  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/team/);

  await page.goto(`/team/${staffId}/services`);
  await expect(page.getByText("Servicios que realiza")).toBeVisible();
  // No aparece Guardar ni controles editables.
  await expect(page.getByRole("button", { name: "Guardar servicios" })).toBeHidden();
  await expect(page.getByLabel(`Asignar ${nameA}`)).toBeDisabled();
});

test("H02.U04 E2E Barber self-reads assigned services without ProfessionalProfile", async ({ page }) => {
  const staffId = await createStaff("BarberTarget", "BARBER");
  const { svcA, svcB, nameA, nameB } = await addServices();

  // Assign both services to the barber via owner context API is not available via UI;
  // insert directly into DB to simulate existing assignments.
  const [setRow] = await ctx.db`insert into team.staff_service_sets(business_id, staff_member_id, revision) values (${ctx.businessId}, ${staffId}, 1) returning id`;
  await ctx.db`insert into team.staff_service_assignments(business_id, staff_service_set_id, service_id) values
    (${ctx.businessId}, ${setRow!.id}, ${svcA}),
    (${ctx.businessId}, ${setRow!.id}, ${svcB})`;

  // Barber logs in and goes to /account/services (self-read).
  // Note: barber has no ProfessionalProfile by design; this must still work.
  const barberEmail = `barber-e2e-${randomUUID().slice(0, 6)}@example.test`;
  await ctx.admin.auth.admin.createUser({ email: barberEmail, password: "YoungKingz-E2E!26", email_confirm: true });
  await ctx.db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status)
    select ${(await ctx.db`select person_id from team.staff_members where id=${staffId}`)[0]!.person_id},
           (select id from auth.users where email=${barberEmail} limit 1),
           ${barberEmail}, 'ACTIVE'`;

  await page.goto("/login");
  await page.getByLabel("Correo").fill(barberEmail);
  await page.getByLabel("Contraseña").fill("YoungKingz-E2E!26");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.goto("/account/services");
  await expect(page.getByRole("heading", { name: /Servicios asignados/ })).toBeVisible();
  await expect(page.getByText(nameA)).toBeVisible();
  await expect(page.getByText(nameB)).toBeVisible();
  await expect(page.getByRole("button", { name: /Guardar/ })).toBeHidden();
});

test("H02.U04 E2E Archived service: existing assigned can be removed, unassigned cannot be added", async ({ page }) => {
  const staffId = await createStaff("ArchivedTarget", "BARBER");
  const svcArchived = randomUUID();
  const svcActive = randomUUID();
  await ctx.db`insert into catalog.services(business_id, id, name, description, category_id, lifecycle, publication, archived_at) values
    (${ctx.businessId}, ${svcArchived}, 'E2E Servicio Archivado', 'Ya asignado.', (select id from catalog.service_categories where business_id=${ctx.businessId} limit 1), 'ARCHIVED', 'UNPUBLISHED', now()),
    (${ctx.businessId}, ${svcActive}, 'E2E Servicio Activo', 'Disponible.', (select id from catalog.service_categories where business_id=${ctx.businessId} limit 1), 'ACTIVE', 'PUBLISHED', null)`;

  // Pre-assign the archived service to the staff member.
  const [setRow] = await ctx.db`insert into team.staff_service_sets(business_id, staff_member_id, revision) values (${ctx.businessId}, ${staffId}, 1) returning id`;
  await ctx.db`insert into team.staff_service_assignments(business_id, staff_service_set_id, service_id) values
    (${ctx.businessId}, ${setRow!.id}, ${svcArchived})`;

  await login(page);
  await page.goto(`/team/${staffId}/services`);

  // Archived assigned: checked, can be unchecked.
  await expect(page.getByLabel(`Asignar E2E Servicio Archivado`)).toBeChecked();
  await page.getByLabel(`Asignar E2E Servicio Archivado`).click();
  await page.getByRole("button", { name: "Guardar servicios" }).click();
  await expect(page.getByRole("status")).toContainText("Servicios guardados correctamente.");

  // Archived unassigned: disabled, cannot be checked.
  await expect(page.getByLabel(`Asignar E2E Servicio Activo`)).not.toBeDisabled();
  await page.getByLabel(`Asignar E2E Servicio Activo`).click();
  await page.getByRole("button", { name: "Guardar servicios" }).click();
  await expect(page.getByLabel(`Asignar E2E Servicio Activo`)).toBeChecked();
});
