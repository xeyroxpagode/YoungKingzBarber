import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const baseURL=process.env.P5_BASE_URL??"http://127.0.0.1:5173"
const root="artifacts/p5/implementation/evidence"
const screens=join(root,"screens")
const motion=join(root,"motion")
await mkdir(screens,{recursive:true});await mkdir(motion,{recursive:true})
const browser=await chromium.launch()
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"})
const page=await context.newPage();const manifest=[]

async function openSurface(surface,viewport={width:390,height:844},extra=""){
  await page.setViewportSize(viewport)
  const params=new URLSearchParams({p5Surface:surface})
  for(const [key,value] of new URLSearchParams(extra))params.set(key,value)
  await page.goto(`${baseURL}/?${params}`)
  await page.getByLabel("Ir a Más").click()
  await page.getByTestId(`surface-${surface}`).waitFor()
}
async function capture(name,surface,viewport={width:390,height:844},extra="",tags=[]){
  await openSurface(surface,viewport,extra);await page.waitForTimeout(80)
  const file=`${name}.png`;await page.getByTestId("iphone-frame").screenshot({path:join(screens,file)})
  manifest.push({file:`screens/${file}`,surface,viewport:`${viewport.width}x${viewport.height}`,tags})
}

for(let index=1;index<=83;index++){const surface=`M${String(index).padStart(2,"0")}`;await capture(`${surface}-baseline`,surface)}
await capture("responsive-M01-320","M01",{width:320,height:700},"",["responsive","ST08"])
await capture("responsive-M47-390","M47",{width:390,height:844},"",["responsive","publish-review"])
await capture("responsive-M83-430","M83",{width:430,height:932},"",["responsive","cross-domain"])
await capture("policy-required-promotion","M52",{width:390,height:844},"",["POLICY_REQUIRED"])
await capture("policy-required-deposit","M59",{width:390,height:844},"",["POLICY_REQUIRED"])
await capture("resource-conflict","M62",{width:390,height:844},"",["CONFLICT"])
await capture("empty-history","M42",{width:390,height:844},"",["EMPTY"])

await context.close()

const motionContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"no-preference"})
const motionPage=await motionContext.newPage();const temporal=[]
async function motionFrame(sequence,label,delay){if(delay)await motionPage.waitForTimeout(delay);const file=`${sequence}-${label}.png`;await motionPage.getByTestId("iphone-frame").screenshot({path:join(motion,file)});const sample=await motionPage.evaluate(()=>Array.from(document.getAnimations()).map(animation=>({currentTime:animation.currentTime,playState:animation.playState,effect:animation.effect?.getTiming()})));temporal.push({sequence,label,delayMs:delay,file:`motion/${file}`,animations:sample})}

await motionPage.goto(baseURL);await motionPage.getByLabel("Ir a Más").click();await motionPage.getByText("Clientes",{exact:true}).click();await motionFrame("MO01-structural","t000",0);await motionFrame("MO01-structural","t090",90);await motionFrame("MO01-structural","t280",190)
await motionPage.getByLabel("Buscar").click();await motionFrame("MO02-search","t000",0);await motionFrame("MO02-search","t090",90);await motionFrame("MO02-search","t220",130)
await motionPage.goto(`${baseURL}/?p5Surface=M02`);await motionPage.getByLabel("Ir a Más").click();await motionPage.getByLabel("Filtrar").click();await motionFrame("MO04-sheet","t000",0);await motionFrame("MO04-sheet","t120",120);await motionFrame("MO04-sheet","t300",180)

async function openMotion(surface,extra=""){const params=new URLSearchParams({p5Surface:surface});for(const [key,value] of new URLSearchParams(extra))params.set(key,value);await motionPage.goto(`${baseURL}/?${params}`);await motionPage.getByLabel("Ir a Más").click();await motionPage.getByTestId(`surface-${surface}`).waitFor();await motionPage.waitForTimeout(280)}
async function recordMotion(id,surface,action,extra=""){await openMotion(surface,extra);await motionFrame(id,"before",0);await action();await motionFrame(id,"t000",0);await motionFrame(id,"t120",120);await motionFrame(id,"t300",180)}
await recordMotion("MO03-row-detail","M02",()=>motionPage.getByText("Juan Pérez",{exact:true}).click())
await recordMotion("MO05-form-focus","M05",()=>motionPage.getByLabel("Nombre").fill("Ana Motion"))
await recordMotion("MO06-conditional-reflow","M28",()=>motionPage.getByRole("checkbox").check(),"courseId=CRS-NEW")
await recordMotion("MO07-impact-review","M23",()=>motionPage.locator(".more-row").first().click())
await recordMotion("MO08-program-reorder","M29",async()=>{await motionPage.getByLabel("Nueva sección").fill("Cierre");await motionPage.getByRole("button",{name:"Agregar sección"}).click();await motionPage.getByLabel("Mover Preparación abajo").click()})
await recordMotion("MO09-temporal-selection","M46",()=>motionPage.getByRole("button",{name:"Publicado demo"}).click())
await recordMotion("MO10-confirm-real-state","M47",()=>motionPage.getByRole("button",{name:"Publicar versión demo"}).click())
await recordMotion("MO11-media-preview","M45",()=>motionPage.locator('input[type="file"]').setInputFiles({name:"motion.png",mimeType:"image/png",buffer:Buffer.from("motion-evidence")}))
await recordMotion("MO12-segment-indicator","M46",()=>motionPage.getByRole("button",{name:"Publicado demo"}).click())
await recordMotion("MO13-cross-domain","M04",()=>motionPage.getByRole("button",{name:"Crear turno"}).click(),"clientId=CL01")
await recordMotion("MO14-course-status","M40",()=>motionPage.getByRole("button",{name:"Cancelar docencia"}).click())
await recordMotion("MO15-conflict-expand","M62",()=>motionPage.locator(".more-row").first().click())
await recordMotion("MO16-client-merge","M08",()=>motionPage.getByRole("button",{name:"Confirmar fusión"}).click())
await recordMotion("MO17-draft-publish","M47",()=>motionPage.getByRole("button",{name:"Publicar versión demo"}).click())
await recordMotion("MO18-promotion-state","M49",async()=>{await motionPage.getByLabel("Nombre interno").fill("Motion promo");await motionPage.getByLabel("Texto público").fill("Motion público");await motionPage.getByRole("button",{name:"Guardar promoción borrador"}).click()})
await recordMotion("MO19-schedule-interval","M56",()=>motionPage.getByLabel("Lunes inicio 1").fill("09:15"))
await recordMotion("MO20-attendance-list","M38",()=>motionPage.getByLabel("Asistencia de CL01").selectOption("present"))
await recordMotion("MO21-capability-diff","M71",async()=>{await motionPage.getByRole("checkbox").first().uncheck();await motionPage.getByRole("button",{name:"Revisar permisos"}).click()})
await recordMotion("MO22-alert-read","M79",()=>motionPage.getByRole("button",{name:/Stock bajo/i}).click())
await writeFile(join(root,"screenshots-manifest.json"),JSON.stringify(manifest,null,2))
await writeFile(join(root,"temporal-evidence.json"),JSON.stringify(temporal,null,2))
await motionContext.close();await browser.close()
console.log(`P5 evidence captured: ${manifest.length} screenshots, ${temporal.length} temporal frames`)
