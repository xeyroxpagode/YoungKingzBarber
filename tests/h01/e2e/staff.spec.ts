import { expect, test } from "@playwright/test";

const email=process.env.H01_TEST_EMAIL;
const password=process.env.H01_TEST_PASSWORD;
if(!email||!password)throw new Error("H01_TEST_EMAIL and H01_TEST_PASSWORD are required for real E2E authentication");

test("login real opens the Owner team surface",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await expect(page).toHaveURL(/\/team/);await expect(page.getByRole("heading",{name:"Equipo"})).toBeVisible();await expect(page.getByRole("heading",{name:"Owner H01 Test"})).toBeVisible();await page.screenshot({path:"docs/h01/evidence/runtime/team.png",fullPage:true});});

test("Owner can inspect account and active operational sessions",async({page})=>{await page.goto("/login");await page.getByLabel("Correo").fill(email);await page.getByLabel("Contraseña").fill(password);await page.getByRole("button",{name:"Ingresar"}).click();await page.getByRole("link",{name:"Mi cuenta"}).click();await expect(page.getByRole("heading",{name:"Mi cuenta"})).toBeVisible();await expect(page.getByText(email)).toBeVisible();await expect(page.getByText("Sesión actual").first()).toBeVisible();await page.screenshot({path:"docs/h01/evidence/runtime/account.png",fullPage:true});});

test("password recovery never discloses account existence",async({page})=>{await page.goto("/recover");await page.getByLabel("Correo").fill("unknown-person@example.test");await page.getByRole("button",{name:"Enviar instrucciones"}).click();await expect(page.getByText("Si el correo corresponde a una cuenta")).toBeVisible();});
