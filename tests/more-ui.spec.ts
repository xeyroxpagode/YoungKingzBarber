import { expect, test, type Page } from "@playwright/test"

async function openMore(page:Page,surface="M01",extra=""){
  const params=new URLSearchParams({p5Surface:surface})
  if(extra)for(const [key,value] of new URLSearchParams(extra))params.set(key,value)
  await page.goto(`/?${params}`)
  await page.getByLabel("Ir a Más").click()
  await expect(page.getByTestId(`surface-${surface}`)).toBeVisible()
}

const journeys:Array<[string,string,string]> = [
  ["R5-01","M02","Clientes activos"],["R5-02","M05","Identidad canónica"],["R5-03","M07","Posible coincidencia"],["R5-04","M08","Historia intacta"],["R5-05","M12","Consentimiento"],["R5-06","M04","Crear turno"],["R5-07","M10","Pedidos de Inventario"],["R5-08","M14","Historial de identidad"],["R5-09","M11","Notas privadas"],["R5-10","M13","historia se conserva"],
  ["R5-11","M15","Catálogo único"],["R5-12","M17","Revisar y guardar versión"],["R5-13","M23","Antes"],["R5-14","M23","Compromisos afectados"],["R5-15","M19","Profesionales reales"],["R5-16","M20","Publicación demo"],["R5-17","M20","nuevas reservas públicas"],["R5-18","M24","reservas futuras requieren resolución"],["R5-19","M25","Historia inmutable"],
  ["R5-20","M28","Guardar curso borrador"],["R5-21","M29","Programa ordenado"],["R5-22","M31","Duración"],["R5-23","M33","Instructores"],["R5-24","M62","Conflictos por recurso"],["R5-25","M35","Situación comercial separada"],["R5-26","M37","plazas confirmadas"],["R5-27","M37","Gestionar espera"],["R5-28","M38","Participantes"],["R5-29","M39","Progreso por participante"],["R5-30","M32","participantes afectados"],["R5-31","M41","Situación económica"],["R5-32","M40","Sin reembolsos"],
  ["R5-33","M44","Editando borrador"],["R5-34","M45","Archivos locales temporales"],["R5-35","M46","BORRADOR"],["R5-36","M47","Publicación sólo demo"],["R5-37","M49","Activación condicionada"],["R5-38","M51","Regla pendiente"],["R5-39","M52","POLICY_REQUIRED"],["R5-40","M53","Historia preservada"],
  ["R5-41","M56","Lunes"],["R5-42","M57","Motivo"],["R5-43","M63","Objetos afectados"],["R5-44","M60","Anticipación mínima"],["R5-45","M59","POLICY_REQUIRED"],["R5-46","M61","Servicio"],["R5-47","M64","Canal no conectado"],
  ["R5-48","M67","Datos internos"],["R5-49","M68","AccountID separado"],["R5-50","M70","Integrante"],["R5-51","M71","Capacidades explícitas"],["R5-52","M72","Revisión atómica"],["R5-53","M73","Acceso separado"],["R5-54","M73","no borra auditoría"],
  ["R5-55","M78","Dominio"],["R5-56","M77","Trazabilidad"],["R5-57","M80","Objeto propietario"],["R5-58","M79","Pendientes"],["R5-59","M83","Incidencias cruzadas"],["R5-60","M82","Corrección compensatoria"],
]

test.describe("P5 Más — R5-01 a R5-60",()=>{
  for(const [journey,surface,evidence] of journeys){
    test(`${journey} llega a ${surface} y expone consecuencia contractual`,async({page})=>{
      await openMore(page,surface)
      await expect(page.getByText(new RegExp(evidence,"i")).first()).toBeVisible()
      await page.getByLabel("Volver").click()
      await expect(page.getByTestId("surface-M01")).toBeVisible()
    })
  }
})

test.describe("P5 Más — recorridos mutantes y handoffs",()=>{
  test("alta duplicada conserva identidad y deriva a revisión",async({page})=>{
    await openMore(page,"M05")
    await page.getByLabel("Nombre").fill("Juan Pérez")
    await page.getByRole("button",{name:"Revisar y registrar"}).click()
    await expect(page.getByTestId("surface-M07")).toBeVisible()
  })
  test("nota privada muta la ficha y produce auditoría",async({page})=>{
    await openMore(page,"M11")
    await page.getByLabel("Nueva nota").fill("Prefiere atención por la mañana")
    await page.getByRole("button",{name:"Agregar nota"}).click()
    await expect(page.getByText("Cambio confirmado")).toBeVisible()
    await expect(page.getByText("Prefiere atención por la mañana")).toBeVisible()
  })
  test("crear servicio interno no lo publica",async({page})=>{
    await openMore(page,"M17","serviceId=SV-NEW")
    await page.getByLabel("Nombre").fill("Diseño editorial")
    await page.getByLabel("Precio ARS").fill("24000")
    await page.getByRole("button",{name:"Crear servicio interno"}).click()
    await expect(page.getByText("Oculto").first()).toBeVisible()
  })
  test("curso pago queda POLICY_REQUIRED sin crear cobro",async({page})=>{
    await openMore(page,"M28","courseId=CRS-NEW")
    await page.getByLabel("Nombre").fill("Técnicas avanzadas")
    await page.getByRole("checkbox").check()
    await expect(page.getByText("POLICY_REQUIRED")).toBeVisible()
    await page.getByRole("button",{name:"Guardar curso borrador"}).click()
    await expect(page.getByText(/precio y cobro requieren política/i)).toBeVisible()
  })
  test("publicar perfil sólo actualiza versión demo",async({page})=>{
    await openMore(page,"M47")
    await page.getByRole("button",{name:"Publicar versión demo"}).click()
    await expect(page.getByText(/no hubo despliegue externo/i)).toBeVisible()
  })
  test("promoción sin política no ofrece confirmación falsa",async({page})=>{
    await openMore(page,"M52")
    await expect(page.getByText("POLICY_REQUIRED")).toBeVisible()
    await expect(page.getByRole("button",{name:/activar promoción/i})).toHaveCount(0)
  })
  test("cambio horario con compromisos deriva a impacto",async({page})=>{
    await openMore(page,"M56")
    const start=page.getByLabel("Lunes inicio 1")
    await start.fill("18:00")
    await page.getByRole("button",{name:"Revisar horario semanal"}).click()
    await expect(page.getByTestId("surface-M63")).toBeVisible()
  })
  test("seña no inventa política ni dinero",async({page})=>{
    await openMore(page,"M59")
    await expect(page.getByText(/No se ejecuta dinero/i)).toBeVisible()
  })
  test("agenda recibe cliente y devuelve al borrador precompletado",async({page})=>{
    await openMore(page,"M04","clientId=CL01")
    await page.getByRole("button",{name:"Crear turno"}).click()
    await expect(page.getByText("Nuevo turno")).toBeVisible()
    await expect(page.getByText("Juan Pérez").first()).toBeVisible()
  })
  test("cuenta y staff preservan identificadores separados",async({page})=>{
    await openMore(page,"M69","accountId=ACC-01")
    await expect(page.getByText("AccountID")).toBeVisible()
    await expect(page.getByText("StaffID")).toBeVisible()
  })
  test("último administrador no puede suspenderse",async({page})=>{
    await openMore(page,"M73","accountId=ACC-OWNER")
    await page.getByRole("button",{name:"Suspender cuenta demo"}).click()
    await expect(page.getByText(/último administrador/i)).toBeVisible()
  })
  test("campana y M79 comparten el mismo aviso y lectura",async({page})=>{
    await page.goto("/")
    await page.getByLabel(/avisos/i).first().click()
    await expect(page.getByText("Stock bajo")).toBeVisible()
    await page.getByText("Stock bajo").click()
    await page.getByLabel("Cerrar avisos y actividad").click()
    await page.getByLabel("Ir a Más").click()
    await page.getByText("Actividad y avisos").click()
    await page.getByText("Avisos",{exact:false}).first().click()
    await expect(page.getByRole("button",{name:/Stock bajo.*Leído/i})).toBeVisible()
  })
})

test("P5 renderiza las 83 superficies reales sin galería visible",async({page})=>{
  for(let n=1;n<=83;n++){
    const surface=`M${String(n).padStart(2,"0")}`
    await openMore(page,surface)
    await expect(page.getByTestId(`surface-${surface}`)).toBeVisible()
  }
})
