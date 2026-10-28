import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres, { type Sql } from "postgres";

let email=process.env.H01_TEST_EMAIL??"";
let password=process.env.H01_TEST_PASSWORD??"";
let admin:SupabaseClient|undefined;let db:Sql|undefined;let authUserId="";let businessId="";let accountId="";let staffId="";let personId="";

test.beforeAll(async()=>{
  if(email&&password)return;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;const supabaseUrl=process.env.SUPABASE_URL??"http://127.0.0.1:55321";
  if(!serviceKey)throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to create the isolated E2E Owner");
  const suffix=randomUUID().slice(0,8);email=`owner-e2e-${suffix}@example.com`;password="YoungKingz-E2E!26";
  admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});db=postgres(process.env.DATABASE_URL??"postgresql://postgres:postgres@127.0.0.1:55322/postgres",{prepare:false});
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;authUserId=created.data.user.id;
  [{id:businessId}]=await db`insert into business.businesses(provisioning_key,display_name,timezone,status) values (${`e2e-${suffix}`},'Young Kingz E2E','America/Argentina/Buenos_Aires','ACTIVE') returning id`;
  [{id:personId}]=await db`insert into iam.persons(first_name,last_name) values ('Owner','H01 Test') returning id`;
  [{id:staffId}]=await db`insert into team.staff_members(business_id,person_id,employment_status,access_status) values (${businessId},${personId},'ACTIVE','ACTIVE') returning id`;
  [{id:accountId}]=await db`insert into iam.user_accounts(person_id,auth_user_id,verified_email,status) values (${personId},${authUserId},${email},'ACTIVE') returning id`;
  await db`insert into iam.account_security_states(account_id) values (${accountId})`;await db`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${businessId},${staffId})`;await db`insert into iam.staff_role_states(business_id,staff_member_id) values (${businessId},${staffId})`;await db`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${businessId},${staffId},'OWNER',now(),${accountId})`;
});

test.afterAll(async()=>{
  if(!db||!businessId)return;
  await db.begin(async tx=>{await tx`delete from system.audit_events where business_id=${businessId}`;await tx`delete from system.operation_attempts where business_id=${businessId}`;await tx`delete from iam.access_sessions where business_id=${businessId}`;await tx`delete from iam.user_context_preferences where business_id=${businessId}`;await tx`delete from iam.capability_grants where business_id=${businessId}`;await tx`delete from iam.account_invitations where business_id=${businessId}`;await tx`delete from iam.role_assignments where business_id=${businessId}`;await tx`delete from iam.staff_role_states where business_id=${businessId}`;await tx`delete from team.staff_relationship_periods where business_id=${businessId}`;await tx`delete from iam.account_security_states where account_id=${accountId}`;await tx`delete from iam.user_accounts where id=${accountId}`;await tx`delete from team.staff_members where id=${staffId}`;await tx`delete from iam.persons where id=${personId}`;await tx`delete from business.businesses where id=${businessId}`;});
  await db.end();if(admin&&authUserId)await admin.auth.admin.deleteUser(authUserId);
});

test("login real opens the Owner team surface",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page).toHaveURL(/\/team/);await expect(page.getByRole("heading",{name:"Equipo"})).toBeVisible();await expect(page.getByRole("heading",{name:"Owner H01 Test"})).toBeVisible();await page.screenshot({path:"docs/h01/v1.1/evidence/team-desktop.png",fullPage:true});});

test("Owner can inspect account and active operational sessions",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await page.getByRole("link",{name:"Mi cuenta"}).click();await expect(page.getByRole("heading",{name:"Mi cuenta"})).toBeVisible();await expect(page.getByText(email)).toBeVisible();await page.getByRole("button",{name:"Mis sesiones"}).click();await expect(page.getByText("Esta sesión").first()).toBeVisible();await page.screenshot({path:"docs/h01/v1.1/evidence/account-sessions-desktop.png",fullPage:true});});

test("single-role Owner sees product language and no permanent context root",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page.getByText("Dueño",{exact:true}).first()).toBeVisible();await expect(page.getByRole("link",{name:"Cambiar función"})).toHaveCount(0);await expect(page.getByText("Staff · H01")).toHaveCount(0);});

test("email change starts empty and rejects the current email client-side",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await page.getByRole("link",{name:"Mi cuenta"}).click();await page.getByRole("button",{name:"Acceso y seguridad"}).click();const field=page.getByLabel("Nuevo correo");await expect(field).toHaveValue("");await field.fill(email);await expect(page.getByText("debe ser diferente")).toBeVisible();await expect(page.getByRole("button",{name:"Solicitar cambio"})).toBeDisabled();});

test("last Owner protections are visible before a destructive request",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page.getByText("Tu acceso se administra desde Mi cuenta")).toBeVisible();await expect(page.getByRole("button",{name:"Suspender"})).toHaveCount(0);await page.getByRole("button",{name:"Editar roles"}).click();await expect(page.getByRole("button",{name:"Dueño",exact:true})).toBeDisabled();await expect(page.getByText("único Dueño válido").first()).toBeVisible();});

test("password recovery never discloses account existence",async({page})=>{await page.goto("/recover");await page.getByLabel("Correo").fill("unknown-person@example.test");await page.getByRole("button",{name:"Enviar instrucciones"}).click();await expect(page.getByText("Si el correo corresponde a una cuenta")).toBeVisible();});

test("responsive visual certification uses the real application",async({page})=>{
  test.setTimeout(90_000);
  await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page).toHaveURL(/\/team/);
  for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
    await page.setViewportSize(viewport);await page.goto("/team");await expect(page.getByRole("heading",{name:"Owner H01 Test"})).toBeVisible();await expect(page.getByText("Dueño",{exact:true}).first()).toBeVisible();await page.screenshot({path:`docs/h01/v1.1/evidence/team-${viewport.width}x${viewport.height}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});await page.goto("/account");await expect(page.getByText(email)).toBeVisible();await page.getByRole("button",{name:"Acceso y seguridad"}).click();await expect(page.getByText(email)).toBeVisible();await page.screenshot({path:"docs/h01/v1.1/evidence/account-security-390x844.png",fullPage:true});await page.getByRole("button",{name:"Mis sesiones"}).click();await expect(page.getByText("Esta sesión")).toBeVisible();await page.screenshot({path:"docs/h01/v1.1/evidence/account-sessions-390x844.png",fullPage:true});
});
