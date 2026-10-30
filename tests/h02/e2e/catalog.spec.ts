import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createOwnerContext, cleanupContext, signIn, apiRequest } from "../../h01/e2e/helpers";

let ctx: Awaited<ReturnType<typeof createOwnerContext>>;
const terms = (amountMinor:number)=>({money:{amountMinor,currency:"ARS"},durationMinutes:30,preBufferMinutes:0,postBufferMinutes:0,conditions:null});
test.setTimeout(90_000);

test.beforeAll(async()=>{ctx=await createOwnerContext();});
test.afterAll(async()=>{
  await ctx.db`update catalog.services set current_terms_version_id=null where business_id=${ctx.businessId}`;
  await ctx.db`delete from catalog.service_terms_versions where business_id=${ctx.businessId}`;
  await ctx.db`delete from catalog.services where business_id=${ctx.businessId}`;
  await ctx.db`delete from catalog.service_categories where business_id=${ctx.businessId}`;
  await cleanupContext(ctx);
});

async function login(page:import("@playwright/test").Page){await page.goto("/login");await page.getByLabel("Correo").fill(ctx.email);await page.getByLabel("Contraseña").fill(ctx.password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page).toHaveURL(/\/team/);}
async function loginAs(page:import("@playwright/test").Page,email:string,password:string){await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await page.waitForURL(/\/(team|account)/);}

test("H02 owner journey manages Category, Service, Terms history and lifecycle",async({page})=>{
  await login(page);
  await page.getByRole("link",{name:"Servicios"}).click();
  await expect(page.getByRole("heading",{name:"Servicios",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Categorías"}).click();
  await page.getByLabel("Nueva categoría").fill("Cortes E2E");
  await page.getByRole("button",{name:"Crear categoría"}).click();
  await expect(page.getByText("Categoría creada.")).toBeVisible();
  await page.getByRole("link",{name:"Volver a servicios"}).click();
  await page.getByRole("link",{name:"Nuevo servicio"}).click();
  await page.getByLabel("Nombre").fill("Corte clásico E2E");
  await page.getByLabel("Categoría").selectOption({label:"Cortes E2E"});
  await page.getByLabel("Definir términos comerciales iniciales").check();
  await page.getByLabel("Precio ARS").fill("12000");
  await page.getByRole("button",{name:"Crear servicio"}).click();
  await expect(page.getByRole("heading",{name:"Corte clásico E2E"})).toBeVisible();
  await page.getByRole("button",{name:"Publicar"}).click();
  await expect(page.getByText("Publicado",{exact:true}).first()).toBeVisible();
  await page.getByLabel("Precio ARS").fill("13500");
  await page.getByRole("button",{name:"Guardar nueva versión"}).click();
  await expect(page.getByText("Se creó una nueva versión")).toBeVisible();
  await expect(page.getByText("v2",{exact:true}).first()).toBeVisible();
  page.on("dialog",dialog=>dialog.accept());
  await page.getByRole("button",{name:"No publicar"}).click();
  await expect(page.getByText("No publicado",{exact:true}).first()).toBeVisible();
  await page.getByRole("button",{name:"Archivar"}).click();
  await expect(page.getByText("Archivado",{exact:true}).first()).toBeVisible();
  await page.getByRole("button",{name:"Reactivar"}).click();
  await expect(page.getByText("Activo",{exact:true}).first()).toBeVisible();
});

test("H02 stale conflict preserves local profile input",async({page})=>{
  const token=await signIn(ctx.email,ctx.password);
  const category=await apiRequest(token,"POST","/v1/catalog/categories",{name:"Stale category"});
  const created=await apiRequest(token,"POST","/v1/catalog/services",{name:"Original stale",categoryId:category.json.data.id,initialCommercialTerms:terms(100)});
  const id=created.json.data.id;
  await login(page);await page.goto(`/services/${id}`);
  const name=page.getByLabel("Nombre");await name.fill("Borrador local preservado");
  await apiRequest(token,"PATCH",`/v1/catalog/services/${id}/profile`,{expectedRevision:1,name:"Cambio remoto"});
  await page.getByRole("button",{name:"Guardar perfil"}).click();
  await expect(page.getByText("El servicio cambió en el servidor")).toBeVisible();
  await expect(name).toHaveValue("Borrador local preservado");
});

test("H02 transport recovery reconciles a lost mutation response",async({page})=>{
  const token=await signIn(ctx.email,ctx.password);
  const created=await apiRequest(token,"POST","/v1/catalog/services",{name:"Transport original"});const id=created.json.data.id;
  await login(page);await page.goto(`/services/${id}`);
  await page.getByLabel("Nombre").fill("Transport confirmed");
  let intercepted=false;
  await page.route(`**/v1/catalog/services/${id}/profile`,async route=>{if(intercepted){await route.continue();return;}intercepted=true;await route.fetch();await route.abort("failed");});
  await page.getByRole("button",{name:"Guardar perfil"}).click();
  await expect(page.getByText("Perfil actualizado.")).toBeVisible({timeout:15_000});
  await expect(page.getByRole("heading",{name:"Transport confirmed"})).toBeVisible();
});

test("H02 catalog list meets serious accessibility baseline",async({page})=>{await login(page);await page.goto("/services");await expect(page.getByRole("heading",{name:"Servicios",exact:true})).toBeVisible();await expect(page.getByRole("status")).toHaveCount(0);const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(results.violations.filter(item=>item.impact==="critical"||item.impact==="serious")).toEqual([]);});

test("H02 route UI remains usable across phone, tablet, and desktop",async({page})=>{await login(page);for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){await page.setViewportSize(viewport);await page.goto("/services");await expect(page.getByRole("heading",{name:"Servicios",exact:true})).toBeVisible();await expect(page.getByLabel("Filtros de servicios")).toBeVisible();}});

test("H02 dirty guard prevents accidental profile navigation",async({page})=>{const token=await signIn(ctx.email,ctx.password);const created=await apiRequest(token,"POST","/v1/catalog/services",{name:"Dirty guard"});await login(page);await page.goto(`/services/${created.json.data.id}`);await page.getByLabel("Nombre").fill("Dirty local value");page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("link",{name:"← Servicios"}).click();await expect(page).toHaveURL(new RegExp(`/services/${created.json.data.id}`));await expect(page.getByLabel("Nombre")).toHaveValue("Dirty local value");});

test("H02 delegated Receptionist surface follows capabilities",async({page})=>{const email=`reception-e2e-${ctx.suffix}@example.com`;const created=await ctx.admin.auth.admin.createUser({email,password:ctx.password,email_confirm:true});if(created.error)throw created.error;ctx.authUserIds.push(created.data.user.id);const [person]=await ctx.db`insert into iam.persons(first_name,last_name) values ('Reception','H02 E2E') returning id`;ctx.personIds.push(person!.id);const [staff]=await ctx.db`insert into team.staff_members(business_id,person_id,employment_status,access_status) values (${ctx.businessId},${person!.id},'ACTIVE','ACTIVE') returning id`;ctx.staffIds.push(staff!.id);const [account]=await ctx.db`insert into iam.user_accounts(person_id,auth_user_id,verified_email,status) values (${person!.id},${created.data.user.id},${email},'ACTIVE') returning id`;ctx.accountIds.push(account!.id);await ctx.db`insert into iam.account_security_states(account_id) values (${account!.id})`;await ctx.db`insert into team.staff_relationship_periods(business_id,staff_member_id) values (${ctx.businessId},${staff!.id})`;await ctx.db`insert into iam.staff_role_states(business_id,staff_member_id) values (${ctx.businessId},${staff!.id})`;const [assignment]=await ctx.db`insert into iam.role_assignments(business_id,staff_member_id,role,effective_at,assigned_by_account_id) values (${ctx.businessId},${staff!.id},'RECEPTIONIST',now(),${ctx.accountId}) returning id`;const ownerToken=await signIn(ctx.email,ctx.password);const service=await apiRequest(ownerToken,"POST","/v1/catalog/services",{name:"Delegated service"});await loginAs(page,email,ctx.password);await page.goto(`/services/${service.json.data.id}`);await expect(page.getByRole("heading",{name:"Delegated service"})).toBeVisible();await expect(page.getByRole("button",{name:"Guardar perfil"})).toHaveCount(0);await expect(page.getByRole("button",{name:"Guardar nueva versión"})).toHaveCount(0);await ctx.db`insert into iam.capability_grants(business_id,staff_member_id,role_assignment_id,capability,granted_by_account_id) values (${ctx.businessId},${staff!.id},${assignment!.id},'catalog.services.update_profile',${ctx.accountId})`;await page.reload();await expect(page.getByRole("button",{name:"Guardar perfil"})).toBeVisible();await expect(page.getByRole("button",{name:"Guardar nueva versión"})).toHaveCount(0);await ctx.db`insert into iam.capability_grants(business_id,staff_member_id,role_assignment_id,capability,granted_by_account_id) values (${ctx.businessId},${staff!.id},${assignment!.id},'catalog.services.update_terms',${ctx.accountId})`;await page.reload();await expect(page.getByRole("button",{name:"Guardar nueva versión"})).toBeVisible();});
