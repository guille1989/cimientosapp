import { test, expect, type Page } from "@playwright/test";
import { translate, type Locale } from "../lib/i18n";
import type { AppState, Commitment, Project, ProjectStatus } from "../lib/types";

let baseline: AppState;
test.beforeAll(async ({ request }) => {
  const response = await request.get("/api/state");
  expect(response.ok()).toBeTruthy();
  baseline = await response.json();
});

function fixture(status: ProjectStatus = "IN_PROGRESS") {
  const state: AppState = structuredClone(baseline);
  state.user = null;
  state.commitments = [];
  state.transactions = [];
  state.notifications = [];
  const source = state.projects.find(p => p.type === "DEBT")!;
  const project: Project = {
    ...source, id: "followup-fixture", slug: "followup-fixture", name: "Proyecto de seguimiento DEMO",
    type: "DEBT", status, target: 10000, funded: 10000, minInvestment: 100, progress: 50,
    fundingDeadline: new Date(Date.now() + 86400000).toISOString(),
    milestones: [
      {id:"complete",projectId:"followup-fixture",name:"Fase completada",description:"DEMO",expectedDate:"2026-01-01T12:00:00Z",amount:5000,status:"DISBURSED",certified:true,approved:true},
      {id:"later",projectId:"followup-fixture",name:"Acabados de prueba",description:"DEMO",expectedDate:"2027-06-01T12:00:00Z",amount:2500,status:"PLANNED",certified:false,approved:false},
      {id:"next",projectId:"followup-fixture",name:"Estructura de prueba",description:"DEMO",expectedDate:"2027-01-01T12:00:00Z",amount:2500,status:"PLANNED",certified:false,approved:false},
    ],
    updates: [
      {id:"old",projectId:"followup-fixture",title:"Informe anterior DEMO",content:"Información anterior de prueba.",createdAt:"2026-01-01T12:00:00Z"},
      {id:"new",projectId:"followup-fixture",title:"Informe reciente DEMO",content:"Avances de prueba registrados para esta fase.",createdAt:"2026-02-01T12:00:00Z"},
    ],
  };
  state.projects = [project];
  return {state, project};
}

async function mockState(page: Page, getState: () => AppState) {
  await page.route("**/api/state", route => route.fulfill({json:getState()}));
}

test("proyectos cerrados muestran seguimiento y enlaces funcionales en lugar de captación", async ({ page }) => {
  let {state, project} = fixture();
  await mockState(page, () => state);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const status of ["FUNDED", "IN_PROGRESS", "DELAYED", "RECOVERY", "REPAID", "CANCELLED", "COMING_SOON"] as const) {
    project.status = status;
    await page.goto("/proyectos/" + project.slug);
    const panel = page.getByRole("region", {name:"Seguimiento del proyecto",exact:true});
    await expect(panel).toBeVisible();
    await expect(page.getByRole("region",{name:"Simulador de inversión",exact:true})).toHaveCount(0);
    await expect(page.getByLabel("Cantidad personalizada (€)",{exact:true})).toHaveCount(0);
    await expect(page.locator(".cm-investment-aside .cm-annual-rate")).toHaveCount(0);
    await expect(panel.getByRole("region",{name:"Tu posición en este proyecto"})).toHaveCount(0);
    await expect(panel.getByRole("progressbar")).toHaveAttribute("value","50");
    if (status === "DELAYED") await expect(panel).toContainText("El calendario ha cambiado.");
    if (status === "RECOVERY") await expect(panel).toContainText("La devolución es incierta.");
    if (["REPAID","CANCELLED"].includes(status)) await expect(panel.getByRole("heading",{name:"Próximo hito",exact:true})).toHaveCount(0);
    else await expect(panel.getByRole("region",{name:"Avance de obra"})).toContainText("Estructura de prueba");
  }
  project.status = "IN_PROGRESS";
  await page.setViewportSize({width:820,height:1180});
  await page.goto("/proyectos/"+project.slug);
  const tabletPanel = await page.getByRole("region",{name:"Seguimiento del proyecto",exact:true}).boundingBox();
  const tabletContainer = await page.locator(".cm-monitoring-summary").boundingBox();
  expect(tabletPanel!.width).toBeGreaterThan(tabletContainer!.width * .85);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  await page.screenshot({path:"output/qa-project-followup/closed-tablet.png",fullPage:true});
  await page.setViewportSize({width:1280,height:800});
  await page.getByRole("button",{name:"Ver calendario e hitos",exact:true}).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab",{name:"Calendario e hitos",exact:true})).toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("tabpanel")).toBeFocused();
  await page.getByRole("button",{name:"Ver actualizaciones",exact:true}).click();
  await expect(page.getByRole("tab",{name:"Actualizaciones",exact:true})).toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("tabpanel")).toContainText("Informe reciente DEMO");
  expect(errors).toEqual([]);
  await page.screenshot({path:"output/qa-project-followup/closed-desktop.png",fullPage:true});
});

test("el simulador solo aparece con financiación abierta, plazo vigente y capital suficiente", async ({ page }) => {
  const {state,project} = fixture("FUNDING");
  project.funded = 5000;
  await mockState(page, () => state);
  await page.goto("/proyectos/" + project.slug);
  await expect(page.getByRole("region",{name:"Simulador de inversión",exact:true})).toBeVisible();
  await expect(page.getByLabel("Cantidad personalizada (€)",{exact:true})).toBeEnabled();
  await expect(page.getByRole("region",{name:"Seguimiento del proyecto",exact:true})).toHaveCount(0);
  for (const reason of ["full","deadline","minimum","published"] as const) {
    project.funded = reason === "full" ? 10000 : reason === "minimum" ? 9950 : 5000;
    project.status = reason === "published" ? "PUBLISHED" : "FUNDING";
    project.fundingDeadline = new Date(Date.now() + (reason === "deadline" ? -86400000 : 86400000)).toISOString();
    await page.reload();
    await expect(page.getByRole("region",{name:"Seguimiento del proyecto",exact:true})).toBeVisible();
    await expect(page.getByLabel("Cantidad personalizada (€)",{exact:true})).toHaveCount(0);
  }
});

for (const locale of ["es","en"] as const) {
  test(`posición propia sin sumar cancelaciones ni datos ajenos, ${locale} móvil`, async ({ page,context,baseURL }) => {
    const t = (message: string) => translate(locale as Locale,message);
    await context.addCookies([{name:"cimiento_locale",value:locale,url:baseURL!}]);
    await page.setViewportSize({width:390,height:844});
    const {state,project} = fixture();
    state.user = {id:"own-user",name:"Inversor DEMO",email:"followup@cimiento.demo",role:"INVESTOR",onboardingStatus:"APPROVED"};
    const commitment = (id:string,status:Commitment["status"],amount:number,capitalReturned=0,interestReceived=0,userId="own-user"):Commitment => ({id,status,amount,capitalReturned,interestReceived,userId,projectId:project.id,createdAt:new Date().toISOString(),reflectionEndsAt:new Date().toISOString()});
    state.commitments = [
      commitment("invested","INVESTED",1000,100,20),
      commitment("cancelled","CANCELLED",9000),
      commitment("refunded","REFUNDED",5000,5000),
      commitment("repaid","REPAID",500,500,30),
      commitment("other-user","INVESTED",99999,99999,99999,"other-user"),
    ];
    await mockState(page, () => state);
    await page.goto("/proyectos/"+project.slug);
    const position = page.getByRole("region",{name:t("Tu posición en este proyecto"),exact:true});
    await expect(position).toBeVisible();
    const moneyRow=(label:string)=>position.locator("dl > div").filter({has:page.getByText(t(label),{exact:true})}).locator("dd");
    const normalized = (value:string|null) => value?.replace(/[^0-9]/g,"");
    expect(normalized(await moneyRow("Capital comprometido activo").textContent())).toBe("100000");
    expect(normalized(await moneyRow("Capital pendiente de devolución").textContent())).toBe("90000");
    expect(normalized(await moneyRow("Capital devuelto").textContent())).toBe("60000");
    expect(normalized(await moneyRow("Intereses recibidos").textContent())).toBe("5000");
    await expect(position.getByRole("listitem")).toHaveCount(2);
    await expect(position.getByRole("link",{name:t("Ver mi cartera")})).toHaveAttribute("href","/inversor/cartera");
    const update = page.getByRole("region",{name:t("Última actualización"),exact:true});
    await expect(update).toContainText("Informe reciente DEMO");
    await expect(update).not.toContainText("Informe anterior DEMO");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    await page.screenshot({path:`output/qa-project-followup/position-mobile-${locale}.png`,fullPage:true});
    state.commitments = state.commitments.filter(c=>["CANCELLED","REFUNDED"].includes(c.status));
    project.milestones=[];
    project.updates=[];
    await page.reload();
    await expect(page.getByText(t("No tienes compromisos activos en este proyecto. Los cancelados o reembolsados se conservan en el historial de tu cartera."),{exact:true})).toBeVisible();
    await expect(page.getByText(t("Todavía no hay hitos pendientes definidos."),{exact:true})).toBeVisible();
    await expect(page.getByRole("region",{name:t("Última actualización"),exact:true})).toContainText(t("Aún no se han publicado actualizaciones."));
  });
}
