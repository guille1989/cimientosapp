import { test, expect } from "@playwright/test";

test("Promotor: crea borrador, completa solicitud y consulta revisión", async ({ page }) => {
  const errors: string[]=[]; page.on("pageerror",e=>errors.push(e.message));
  await page.request.post("/api/actions", { data: { action: "login", payload: { email: "promotor@cimiento.demo", password: "Demo123!" } } });
  await page.goto("/promotor/solicitud");
  await expect(page.getByRole("heading",{name:"Capital para construir.",exact:true})).toBeVisible();
  await page.getByLabel("Razón social ficticia").fill("Promotora UI · Ficticia");
  await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();
  await expect(page.getByText("Borrador guardado",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  const name=`Residencial de prueba ${Date.now()}`;
  await page.getByLabel("Nombre del proyecto").fill(name);
  await page.getByLabel("Ciudad (España)").fill("Granada");
  await page.getByLabel("Dirección ficticia").fill("Calle de Ejemplo 0 · dirección ficticia");
  await page.getByLabel("Descripción del proyecto").fill("Proyecto ficticio de rehabilitación de ocho viviendas, creado únicamente para verificar el portal.");
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await expect(page.getByLabel("Presupuesto total (€)")).toHaveValue("1500000");
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByLabel("Escritura de titularidad ficticia.pdf").check();
  await page.getByLabel("Licencia de obra ficticia.pdf").check();
  await page.getByLabel("Confirmo que toda la información y la documentación utilizadas son ficticias.").check();
  await page.getByRole("button",{name:"Enviar a revisión"}).click();
  await expect(page.getByRole("heading",{name:"Solicitud enviada a revisión",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Consultar mi solicitud"}).click();
  await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();
  const state=await (await page.request.get("/api/state")).json();
  const project=state.projects.find((p:any)=>p.name===name);
  expect(project.status).toBe("SUBMITTED");expect(project.documents).toHaveLength(2);
  expect(errors).toEqual([]);
});

test("Administrador: evaluación humana, publicación y documento ficticio",async({page})=>{
  const name=`Expediente UI ${Date.now()}`;
  await page.request.post("/api/actions",{data:{action:"login",payload:{email:"promotor@cimiento.demo",password:"Demo123!"}}});
  const created=await page.request.post("/api/actions",{data:{action:"saveApplication",payload:{name,city:"Granada",description:"Proyecto ficticio para verificar la revisión administrativa y la publicación.",useOfFunds:"Construcción y honorarios técnicos mediante hitos ficticios.",guarantees:"Hipoteca ficticia propuesta, sin garantía de recuperación.",exitStrategy:"Venta de las unidades terminadas y amortización del préstamo.",licenses:"Concedidas · ficticias",land:"Propiedad ficticia",planning:"Residencial ficticio",target:600000,budget:1500000,ownCapital:400000,bankFinancing:500000,contingency:150000,duration:18,annualRate:8.5,ltv:60,experience:10,mortgage:true,presales:40,fundingDeadline:"2027-01-01",startDate:"2027-01-15",endDate:"2028-07-15",submit:true}}});
  expect(created.ok()).toBeTruthy();const{id}= (await created.json()).data;
  await page.request.post("/api/actions",{data:{action:"login",payload:{email:"admin@cimiento.demo",password:"Demo123!"}}});
  await page.goto("/admin/proyectos");
  await page.getByLabel("Buscar proyecto",{exact:true}).fill(name);
  await page.getByRole("button",{name:"Abrir expediente",exact:true}).click();
  let editor=page.getByRole("dialog");
  await editor.getByRole("tab",{name:"Análisis de riesgo",exact:true}).click();
  await expect(editor.getByText("Experiencia del promotor",{exact:true})).toBeVisible();
  await expect(editor.getByText("La decisión es humana",{exact:true})).toBeVisible();
  await editor.getByLabel("Decisión administrativa").selectOption("APPROVE");
  await editor.getByLabel("Justificación obligatoria").fill("Revisión técnica y financiera ficticia completada; aprobación humana del expediente de prueba.");
  await editor.getByRole("button",{name:"Guardar y registrar decisión"}).click();
  await expect(editor).toBeHidden();
  await page.getByRole("button",{name:"Abrir expediente",exact:true}).click();editor=page.getByRole("dialog");
  await editor.getByLabel("Decisión administrativa").selectOption("PUBLISH");
  await editor.getByLabel("Justificación obligatoria").fill("Publicación ficticia tras aprobación del equipo de análisis y revisión de documentación.");
  await editor.getByRole("button",{name:"Guardar y registrar decisión"}).click();await expect(editor).toBeHidden();
  await page.getByRole("button",{name:"Abrir expediente",exact:true}).click();editor=page.getByRole("dialog");
  await editor.getByRole("tab",{name:"Documentos",exact:true}).click();
  await editor.getByLabel("Nombre del documento ficticio").fill("Informe de prueba UI");
  await editor.getByRole("button",{name:"Añadir documento de ejemplo"}).click();
  await expect(editor.getByRole("link",{name:"Informe de prueba UI · DEMO"})).toBeVisible();
  await editor.getByRole("button",{name:"Cerrar expediente"}).click();
  const state=await(await page.request.get("/api/state")).json();const project=state.projects.find((p:any)=>p.id===id);
  expect(project.status).toBe("FUNDING");expect(project.riskAssessment.decision).toBe("APPROVED");
  expect(state.audit.some((e:any)=>e.entityId===id&&e.action==="ADMIN_PROJECT_APPROVE")).toBeTruthy();
  await page.goto(`/proyectos/${project.slug}`);await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();
});

test("Las rutas privadas rechazan una sesión anónima desde el servidor",async({page})=>{
  for(const path of ["/inversor","/promotor","/admin"]){await page.goto(path);await expect(page).toHaveURL(/\/acceso$/);}
});
