import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { formatMoney, translate, type Locale } from "../lib/i18n";

const database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } } });
let projects: string[] = [];
let users: string[] = [];
const acceptances = { loss: true, illiquidity: true, notGuaranteed: true, documents: true };
const action = (request: APIRequestContext, action: string, payload: unknown) => request.post("/api/actions", {data:{action,payload}});
async function login(request: APIRequestContext) {
  expect((await action(request,"login",{email:"inversor@cimiento.demo",password:"Demo123!"})).ok()).toBeTruthy();
}
async function fixtureProject(targetCents=10000) {
  const id="reliability-"+randomUUID();
  const promoter=await database.user.findUniqueOrThrow({where:{email:"promotor@cimiento.demo"}});
  await database.project.create({data:{
    id,slug:id,name:"Proyecto de prueba "+id.slice(-8),city:"Madrid",promoterId:promoter.id,status:"FUNDING",
    fundingDeadline:new Date(Date.now()+86400000),financials:{create:{targetCents,budgetCents:targetCents*2}},
    documents:{create:{name:"Ficha de información clave DEMO",category:"Información del proyecto"}},
  }});
  projects.push(id);
  return await database.project.findUniqueOrThrow({where:{id},include:{documents:true}});
}
test.beforeEach(()=>{projects=[];users=[];});
test.afterEach(async()=>{
  const ids=(await database.investmentCommitment.findMany({where:{projectId:{in:projects}},select:{id:true}})).map(c=>c.id);
  await database.auditEvent.deleteMany({where:{OR:[{entityId:{in:[...projects,...ids]}},{userId:{in:users}}]}});
  await database.distribution.deleteMany({where:{projectId:{in:projects}}});
  await database.transaction.deleteMany({where:{projectId:{in:projects}}});
  await database.investmentCommitment.deleteMany({where:{projectId:{in:projects}}});
  await database.project.deleteMany({where:{id:{in:projects}}});
  await database.user.deleteMany({where:{id:{in:users}}});
});
test.afterAll(()=>database.$disconnect());

test("API: reintentos simultáneos y posteriores conservan un único compromiso y sus movimientos",async({request})=>{
  await login(request);
  const project=await fixtureProject();
  const payload={projectId:project.id,idempotencyKey:randomUUID(),amount:100,acceptances,paymentAccepted:true};
  const responses=await Promise.all(Array.from({length:3},()=>action(request,"invest",payload)));
  for(const response of responses)expect(response.ok(),await response.text()).toBeTruthy();
  const results=await Promise.all(responses.map(r=>r.json()));
  const id=results[0].data.id;
  expect(new Set(results.map(r=>r.data.id)).size).toBe(1);
  expect(results.filter(r=>r.data.replayed===false)).toHaveLength(1);
  expect(await database.investmentCommitment.count({where:{projectId:project.id}})).toBe(1);
  expect(await database.transaction.count({where:{projectId:project.id,type:"COMMITMENT"}})).toBe(1);
  expect(await database.auditEvent.count({where:{entityId:id,action:"INVESTMENT_COMMITTED"}})).toBe(1);
  const funded=await database.project.findUniqueOrThrow({where:{id:project.id}});
  expect(funded.fundedCents).toBe(10000);expect(funded.investorCount).toBe(1);expect(funded.status).toBe("FUNDED");
  const replay=await action(request,"invest",payload);
  expect(replay.ok()).toBeTruthy();expect((await replay.json()).data).toMatchObject({id,replayed:true,status:"REFLECTION"});
  expect((await action(request,"cancelCommitment",{id})).ok()).toBeTruthy();
  const cancelledReplay=await action(request,"invest",payload);
  expect((await cancelledReplay.json()).data).toMatchObject({id,replayed:true,status:"CANCELLED"});
  expect((await action(request,"cancelCommitment",{id})).status()).toBe(400);
  expect(await database.transaction.count({where:{projectId:project.id,type:"CANCELLATION"}})).toBe(1);
  const restored=await database.project.findUniqueOrThrow({where:{id:project.id}});
  expect(restored.fundedCents).toBe(0);expect(restored.investorCount).toBe(0);expect(restored.status).toBe("FUNDING");
  const fresh=await action(request,"invest",{...payload,idempotencyKey:randomUUID()});
  expect(fresh.ok()).toBeTruthy();expect((await fresh.json()).data.id).not.toBe(id);
});

test("API: referencia vinculada a usuario y contenido, validación y reintento tras rechazo",async({request,playwright,baseURL})=>{
  await login(request);
  const project=await fixtureProject(30000),other=await fixtureProject();
  const payload={projectId:project.id,idempotencyKey:randomUUID(),amount:100,acceptances,paymentAccepted:true};
  const first=await action(request,"invest",payload);expect(first.ok()).toBeTruthy();const firstId=(await first.json()).data.id;
  expect((await action(request,"invest",{...payload,amount:200})).status()).toBe(409);
  expect((await action(request,"invest",{...payload,projectId:other.id})).status()).toBe(409);
  const {idempotencyKey:unused,...missing}=payload;void unused;
  expect((await action(request,"invest",missing)).status()).toBe(400);
  expect((await action(request,"invest",{...payload,idempotencyKey:"invalid"})).status()).toBe(400);
  const second=await playwright.request.newContext({baseURL});
  try{
    const email="scope-"+randomUUID()+"@cimiento.demo";
    expect((await action(second,"register",{email,name:"Inversor ficticio",password:"Demo123!",role:"INVESTOR"})).ok()).toBeTruthy();
    const user=await database.user.findUniqueOrThrow({where:{email}});users.push(user.id);
    await database.user.update({where:{id:user.id},data:{onboardingStatus:"APPROVED"}});
    const separate=await action(second,"invest",payload);expect(separate.ok()).toBeTruthy();
    const separateId=(await separate.json()).data.id;expect(separateId).not.toBe(firstId);
    const state=await(await second.get("/api/state")).json();
    expect(state.commitments.some((c:any)=>c.id===firstId)).toBe(false);
    expect(state.commitments.some((c:any)=>c.id===separateId)).toBe(true);
  }finally{await second.dispose();}
  const retry={...payload,idempotencyKey:randomUUID()};
  expect((await action(request,"invest",{...retry,amount:99})).status()).toBe(400);
  expect((await action(request,"invest",retry)).ok()).toBeTruthy();
  expect(await database.investmentCommitment.count({where:{projectId:project.id}})).toBe(3);
  expect((await database.project.findUniqueOrThrow({where:{id:other.id}})).fundedCents).toBe(0);
});

async function completeOnboarding(page:Page,locale:Locale) {
  const t=(message:string)=>translate(locale,message);
  const next=()=>page.getByRole("button",{name:t("Continuar"),exact:true}).click();
  await expect(page.getByRole("heading",{name:t("Datos personales"),exact:true})).toBeVisible();
  await next();
  await page.getByRole("combobox",{name:t("País de residencia fiscal ficticio"),exact:true}).selectOption("España");
  await page.getByRole("button",{name:t("Guardar y continuar más tarde")}).click();
  await page.reload();
  await expect(page.getByRole("heading",{name:t("Residencia fiscal"),exact:true})).toBeVisible();
  await next();
  await page.getByRole("button",{name:t("Adjuntar identidad ficticia"),exact:true}).click();await next();
  for(const [label,value] of [
    ["Situación laboral simulada","employed"],
    ["Experiencia con inversiones no garantizadas","experienced"],
    ["Objetivo de inversión ficticio","diversification"],
    ["¿Qué pérdida podrías soportar en este supuesto?","total"],
    ["Origen ficticio de los fondos","salary"],
  ]){await page.getByRole("combobox",{name:t(label),exact:true}).selectOption(value);await next();}
  for(const [label,value] of [
    ["1. Si el promotor no puede devolver el préstamo…","loss"],
    ["2. ¿Puedo retirar mi inversión en cualquier momento?","illiquid"],
    ["3. En el modelo previsto, ¿quién administra los fondos?","external"],
  ])await page.getByRole("combobox",{name:t(label),exact:true}).selectOption(value);
  await next();
  await page.getByRole("button",{name:t("Aceptar y completar"),exact:true}).click();
  await expect(page.getByRole("heading",{name:t("Advertencias"),exact:true})).toBeVisible();
  await page.getByLabel(t("He leído y acepto expresamente estos riesgos. Comprendo que este entorno, su identificación y sus verificaciones son ficticios."),{exact:true}).check();
  await page.getByRole("button",{name:t("Aceptar y completar"),exact:true}).click();
  await expect(page.getByRole("heading",{name:t("Tu perfil ya tiene una base."),exact:true})).toBeVisible();
}
async function reviewAndConfirm(page:Page,locale:Locale) {
  const t=(message:string)=>translate(locale,message);
  const review=page.getByRole("dialog",{name:t("Revisa tu compromiso"),exact:true});
  await expect(review.getByRole("button",{name:t("Continuar al proveedor simulado")})).toBeDisabled();
  for(const label of [
    "Comprendo que puedo perder parte o todo el capital.",
    "Acepto que puede haber retrasos e impagos y que no existe liquidez garantizada.",
    "Comprendo que la rentabilidad objetivo y el plazo no están garantizados.",
    "He revisado la documentación ficticia y las condiciones de esta demostración.",
  ])await review.getByLabel(t(label),{exact:true}).check();
  await review.getByRole("button",{name:t("Continuar al proveedor simulado")}).click();
  const provider=page.getByRole("dialog",{name:t("Proveedor de pagos simulado"),exact:true});
  await provider.getByLabel(t("Autorizo únicamente el registro de este movimiento ficticio. Comprendo que no se realiza un pago real."),{exact:true}).check();
  await provider.getByRole("button",{name:t("Confirmar compromiso ficticio"),exact:true}).click();
}

for(const locale of ["es","en"] as const)test("Inversor nuevo "+locale+": alta → onboarding → respuesta perdida → recarga → recuperación → cartera → cancelación",async({page,context,baseURL})=>{
  const t=(message:string)=>translate(locale,message);
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await context.addCookies([{name:"cimiento_locale",value:locale,url:baseURL!}]);
  if(locale==="en")await page.setViewportSize({width:390,height:844});
  const email="journey-"+randomUUID()+"@cimiento.demo";
  await page.goto("/registro");
  await page.getByLabel(t("Nombre ficticio"),{exact:true}).fill("Inversor nuevo ficticio");
  await page.getByLabel(t("Correo ficticio"),{exact:true}).fill(email);
  await page.getByLabel(t("Contraseña de demostración")).fill("Demo123!");
  await page.getByLabel(t("Entiendo que esta cuenta solo sirve para probar el entorno ficticio y que no debo facilitar datos reales."),{exact:true}).check();
  await page.getByRole("button",{name:t("Crear mi cuenta"),exact:true}).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  const user=await database.user.findUniqueOrThrow({where:{email}});users.push(user.id);
  const project=await fixtureProject();
  expect((await action(page.request,"invest",{projectId:project.id,idempotencyKey:randomUUID(),amount:100,acceptances,paymentAccepted:true})).status()).toBe(403);
  await completeOnboarding(page,locale);
  await page.goto("/proyectos");
  await page.getByRole("link",{name:t("Ver {value0}").replace("{value0}",project.name),exact:true}).click();
  const amount=page.getByLabel(t("Cantidad personalizada (€)"),{exact:true});
  await amount.fill("99");await expect(page.getByRole("button",{name:t("Invertir · demostración"),exact:true})).toBeDisabled();
  await amount.fill("100");
  const docResponse=await page.request.get("/api/documents/"+project.documents[0].id);
  expect(docResponse.ok()).toBeTruthy();expect(docResponse.headers()["content-language"]).toBe(locale);
  const attempts:any[]=[];let dropped=false;
  await page.route("**/api/actions",async route=>{
    const body=route.request().postDataJSON();
    if(body?.action!=="invest"){await route.continue();return;}
    attempts.push(body.payload);
    if(dropped){await route.continue();return;}
    const response=await route.fetch();expect(response.ok()).toBeTruthy();dropped=true;
    await route.abort("failed");
  });
  await page.getByRole("button",{name:t("Invertir · demostración"),exact:true}).click();
  await reviewAndConfirm(page,locale);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(t("No hemos podido comprobar la confirmación. Conservamos tu solicitud para recuperarla sin duplicarla. Reintenta o consulta tu cartera."));
  expect(await database.investmentCommitment.count({where:{userId:user.id,projectId:project.id}})).toBe(1);
  await page.reload();
  await expect(page.getByRole("button",{name:t("Revisar solicitud pendiente"),exact:true})).toBeVisible();
  await expect(page.getByLabel(t("Cantidad personalizada (€)"),{exact:true})).toHaveCount(0);
  await expect(page.locator(".investment-pending")).toContainText(t("Importe de la solicitud"));
  await expect(page.locator(".investment-pending strong")).toHaveText(formatMoney(100,locale));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.screenshot({path:test.info().outputPath("pending-"+locale+".png"),fullPage:true});
  await page.getByRole("button",{name:t("Revisar solicitud pendiente"),exact:true}).click();
  await reviewAndConfirm(page,locale);
  const success=page.getByRole("dialog",{name:t("Solicitud recuperada"),exact:true});
  await expect(success).toBeVisible();
  expect(await page.evaluate(key=>sessionStorage.getItem(key),"cimiento:investment:"+user.id+":"+project.id)).toBeNull();
  expect(attempts).toHaveLength(2);expect(attempts[1].idempotencyKey).toBe(attempts[0].idempotencyKey);
  await success.getByRole("link",{name:t("Consultar mi cartera"),exact:true}).click();
  const row=page.locator("tbody tr").first();await expect(row).toContainText(project.name);
  await expect(row).toContainText(t("En reflexión"));
  await page.reload();await expect(row).toContainText(project.name);
  await row.getByRole("button",{name:t("Cancelar"),exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:t("Confirmar cancelación"),exact:true}).click();
  await expect(row).toContainText(t("Cancelado"));
  await page.reload();await expect(row).toContainText(t("Cancelado"));
  expect(await database.investmentCommitment.count({where:{userId:user.id,projectId:project.id}})).toBe(1);
  expect(await database.transaction.count({where:{userId:user.id,projectId:project.id,type:"COMMITMENT"}})).toBe(1);
  expect(await database.transaction.count({where:{userId:user.id,projectId:project.id,type:"CANCELLATION"}})).toBe(1);
  expect((await database.project.findUniqueOrThrow({where:{id:project.id}})).fundedCents).toBe(0);
  expect(errors).toEqual([]);
});
