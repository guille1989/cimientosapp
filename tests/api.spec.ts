import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const action = (request: APIRequestContext, action: string, payload: unknown) => request.post("/api/actions", { data: { action, payload } });
const login = async (request: APIRequestContext, role: string) => {
  const response = await action(request, "login", { email: `${role}@cimiento.demo`, password: "Demo123!" });
  expect(response.ok(), `Login ${role}: ${response.status()} ${await response.text()}`).toBeTruthy(); expect((await response.json()).ok).toBe(true);
};

test("API: inversión completa persistida y cancelación durante reflexión", async ({ request }) => {
  await login(request, "inversor");
  const before = await (await request.get("/api/state")).json();
  const project = before.projects.find((p: any) => p.status === "FUNDING"); expect(project).toBeTruthy();
  expect((await action(request, "invest", { projectId: project.id, amount: 99, acceptances: { loss: true, illiquidity: true, notGuaranteed: true, documents: true }, paymentAccepted: true })).status()).toBe(400);
  expect((await action(request, "invest", { projectId: project.id, amount: project.target - project.funded + 100, acceptances: { loss: true, illiquidity: true, notGuaranteed: true, documents: true }, paymentAccepted: true })).status()).toBe(400);
  expect((await action(request, "invest", { projectId: project.id, amount: 100, acceptances: { loss: false, illiquidity: true, notGuaranteed: true, documents: true }, paymentAccepted: true })).status()).toBe(400);
  const confirmation = await action(request, "invest", { projectId: project.id, amount: 100, acceptances: { loss: true, illiquidity: true, notGuaranteed: true, documents: true }, paymentAccepted: true }); expect(confirmation.ok()).toBeTruthy(); const { data } = await confirmation.json();
  try {
    const state = await (await request.get("/api/state")).json(); const commitment = state.commitments.find((c: any) => c.id === data.id); expect(commitment.status).toBe("REFLECTION"); expect(commitment.amount).toBe(100); expect(state.projects.find((p: any) => p.id === project.id).funded).toBe(project.funded + 100);
    const doc = await request.get(`/api/documents/contract-${data.id}`); expect(doc.ok()).toBeTruthy(); expect(await doc.text()).toContain("FICTICIO");
    const csv = await request.get("/api/export?type=COMMITMENT"); expect(csv.ok()).toBeTruthy(); expect(await csv.text()).toContain("DEMOSTRACIÓN");
    const projectCsv = await request.get("/api/export?projectId=p-malaga"); const projectRows = await projectCsv.text(); expect(projectRows).toContain("Casa del Mar"); expect(projectRows).not.toContain("Ribera Nueva"); expect(projectRows).not.toContain("Patio Chamberí");
    const futureCsv = await request.get("/api/export?from=2099-01-01"); expect((await futureCsv.text()).trim().split("\r\n").length).toBe(2);
    expect((await request.get("/api/export?from=2026-02-31")).status()).toBe(400);
    expect((await request.get("/api/export?type=invalid")).status()).toBe(400);
  } finally { const cancelled = await action(request, "cancelCommitment", { id: data.id }); expect(cancelled.ok()).toBeTruthy(); }
  const after = await (await request.get("/api/state")).json(); expect(after.commitments.find((c: any) => c.id === data.id).status).toBe("CANCELLED"); expect(after.projects.find((p: any) => p.id === project.id).funded).toBe(project.funded); expect((await action(request, "cancelCommitment", { id: data.id })).status()).toBe(400);
});

test("API: permisos, privacidad y protección de origen", async ({ request, playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL });
  try {
    const publicState = await (await anonymous.get("/api/state")).json(); expect(publicState.user).toBeNull(); expect(publicState.users).toEqual([]); expect(publicState.commitments).toEqual([]); expect(publicState.projects.every((p: any) => !["DRAFT", "INFO_REQUIRED", "ANALYSIS"].includes(p.status))).toBeTruthy();
    expect((await anonymous.get("/api/documents/contract-seed-p-malaga")).status()).toBe(404);
    expect((await anonymous.get("/api/export")).status()).toBe(401);
    expect((await anonymous.post("/api/actions", { headers: { Origin: "https://untrusted.example" }, data: { action: "login", payload: { email: "admin@cimiento.demo", password: "Demo123!" } } })).status()).toBe(403);
    expect((await anonymous.post("/api/actions", { headers: { Origin: baseURL! }, data: { action: "login", payload: { email: "inversor@cimiento.demo", password: "Demo123!" } } })).ok()).toBeTruthy();
  } finally { await anonymous.dispose(); }
  await login(request, "inversor");
  expect((await action(request, "adminProject", { id: "p-madrid", status: "CANCELLED", justification: "No autorizado" })).status()).toBe(403);
  expect((await action(request, "saveApplication", { name: "Proyecto no autorizado" })).status()).toBe(403);
  const state = await (await request.get("/api/state")).json(); expect(JSON.stringify(state)).not.toContain("passwordHash"); expect(JSON.stringify(state)).not.toContain("session");
  await login(request, "promotor"); const promoterState = await (await request.get("/api/state")).json(); expect(promoterState.projects.some((p: any) => p.id === "p-application")).toBeTruthy();
  expect((await action(request, "invest", { projectId: "p-madrid", amount: 100 })).status()).toBe(403);
  await login(request, "admin"); const adminState = await (await request.get("/api/state")).json(); expect(adminState.users.length).toBeGreaterThanOrEqual(3); expect(adminState.audit.length).toBeGreaterThan(0);
  expect((await action(request, "adminProject", { id: "p-madrid", status: "FUNDED", justification: "Prueba de guardas del objetivo" })).status()).toBe(400);
});

test("API: solicitud del promotor, revisión humana y desembolso protegido", async ({ request, playwright, baseURL }) => {
  const suffix = Date.now(); const email = `promotor-prueba-${suffix}@cimiento.demo`;
  const database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } } });
  let projectId: string | undefined; let userId: string | undefined;
  const outsider = await playwright.request.newContext({ baseURL });
  try {
    const register = await action(request, "register", { name: "Promotor ficticio de prueba", email, password: "PruebaDemo123!", role: "PROMOTER" }); expect(register.ok()).toBeTruthy();
    userId = (await (await request.get("/api/state")).json()).user.id;
    expect((await action(request, "saveApplication", { id: "p-madrid", name: "Intento de editar proyecto ajeno" })).status()).toBe(403);
    const draft = await action(request, "saveApplication", { name: "Expediente de prueba automatizada · ficticio", city: "Madrid", company: "Promotor QA DEMO", description: "Proyecto ficticio de prueba de rehabilitación.", useOfFunds: "Obras y certificaciones ficticias", guarantees: "Garantía ficticia propuesta", exitStrategy: "Venta de unidades residenciales ficticias al terminar la obra.", licenses: "Licencia ficticia concedida", land: "Propiedad ficticia de la sociedad", planning: "Uso residencial ficticio", target: 1000, budget: 2000, ownCapital: 1000, duration: 12, annualRate: 8, fundingDeadline: new Date(Date.now() + 30 * 86400_000).toISOString(), submit: true }); expect(draft.ok()).toBeTruthy(); projectId = (await draft.json()).data.id;
    const submitted = (await (await request.get("/api/state")).json()).projects.find((p: any) => p.id === projectId); expect(submitted.status).toBe("SUBMITTED"); expect(submitted.riskAssessment.factors.length).toBe(10);
    await login(outsider, "promotor"); expect((await action(outsider, "promoterReply", { projectId, message: "Intento de responder expediente ajeno" })).status()).toBe(403);
    await login(request, "admin");
    expect((await action(request, "adminProject", { id: projectId, action: "APPROVE", justification: "sí" })).status()).toBe(400);
    expect((await action(request, "adminProject", { id: projectId, action: "APPROVE", justification: "Revisión humana ficticia del expediente completo." })).ok()).toBeTruthy();
    expect((await action(request, "adminDocument", { projectId, name: "Presupuesto de prueba", category: "Análisis" })).ok()).toBeTruthy();
    expect((await action(request, "adminSaveMilestone", { projectId, name: "Estructura ficticia", description: "Certificación de prueba de estructura", expectedDate: new Date().toISOString(), amount: 250, evidence: "Certificación ficticia DEMO" })).ok()).toBeTruthy();
    const reviewed = (await (await request.get("/api/state")).json()).projects.find((p: any) => p.id === projectId); expect(reviewed.status).toBe("APPROVED"); expect(reviewed.riskAssessment.decision).toBe("APPROVED"); expect(reviewed.documents.length).toBe(1);
    expect((await action(request, "adminMilestone", { id: reviewed.milestones[0].id, certified: true, approved: true, justification: "No debe desembolsar antes de financiar." })).status()).toBe(400);
    expect((await action(request, "adminProject", { id: projectId, action: "PUBLISH", justification: "Publicación ficticia tras revisión documental." })).ok()).toBeTruthy();
    const publicState = await (await outsider.get("/api/state")).json(); expect(publicState.projects.find((p: any) => p.id === projectId).status).toBe("FUNDING");
  } finally {
    await outsider.dispose();
    // Remove only fixtures created by this test, including their sessions and audit rows.
    if (projectId) { await database.auditEvent.deleteMany({ where: { OR: [{ entityId: projectId }, { userId: userId || "" }] } }); const milestones = await database.projectMilestone.findMany({ where: { projectId }, select: { id: true } }); await database.auditEvent.deleteMany({ where: { entityId: { in: milestones.map(m => m.id) } } }); await database.project.delete({ where: { id: projectId } }); }
    if (userId) { await database.auditEvent.deleteMany({ where: { userId } }); await database.user.delete({ where: { id: userId } }); }
    await database.$disconnect();
  }
});

test("API: onboarding valida datos, advertencias y revisión de idoneidad", async ({ request }) => {
  const email = `inversor-prueba-${Date.now()}@cimiento.demo`; let userId: string | undefined;
  const database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } } });
  try {
    expect((await action(request, "register", { name: "Ejemplo ficticio", email: "real@example.com", password: "PruebaDemo123!", role: "INVESTOR" })).status()).toBe(400);
    const registered = await action(request, "register", { name: "Inversor ficticio de prueba", email, password: "PruebaDemo123!", role: "INVESTOR" }); expect(registered.ok()).toBeTruthy(); userId = (await (await request.get("/api/state")).json()).user.id;
    expect((await action(request, "invest", { projectId: "p-madrid", amount: 100 })).status()).toBe(403);
    const values = { name: "Inversor ficticio de prueba", birthYear: "1990", taxCountry: "España", identityFile: "IDENTIDAD_FICTICIA_DEMO.pdf", employment: "employed", experience: "none", objective: "diversification", lossCapacity: "none", sourceOfFunds: "salary", knowledge1: "loss", knowledge2: "illiquid", knowledge3: "external", riskAccepted: false };
    expect((await action(request, "saveOnboarding", { step: 10, values, submit: true })).status()).toBe(400);
    expect((await action(request, "saveOnboarding", { step: 3, values: { name: values.name }, submit: false })).ok()).toBeTruthy();
    const result = await action(request, "saveOnboarding", { step: 10, values: { ...values, riskAccepted: true }, submit: true }); expect(result.ok()).toBeTruthy(); expect((await result.json()).data.status).toBe("REVIEW_REQUIRED");
    const state = await (await request.get("/api/state")).json(); expect(state.onboarding.score).toBe(3); expect(state.onboarding.riskAcknowledged).toBe(true); expect(state.user.onboardingStatus).toBe("REVIEW_REQUIRED");
    expect((await action(request, "invest", { projectId: "p-madrid", amount: 100 })).status()).toBe(403);
    expect((await action(request, "saveProfile", { name: "Inversor ficticio", bankAccount: "ES123400000000" })).status()).toBe(400);
  } finally { if (userId) { await database.auditEvent.deleteMany({ where: { userId } }); await database.user.delete({ where: { id: userId } }); } await database.$disconnect(); }
});

test("API: reflexión vence y financiación incompleta cancela y reembolsa all-or-nothing", async ({ request }) => {
  const database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } } });
  const suffix = Date.now(); const projectId = `qa-lifecycle-${suffix}`; let userId: string | undefined;
  try {
    const investor = await database.user.create({ data: { email: `lifecycle-${suffix}@cimiento.demo`, name: "Inversor ficticio para ciclo automático", role: "INVESTOR", passwordHash: "unusable-test-fixture", onboardingStatus: "APPROVED" } }); userId = investor.id;
    const promoter = await database.user.findFirstOrThrow({ where: { email: "promotor@cimiento.demo" } });
    await database.project.create({ data: { id: projectId, slug: projectId, name: "Proyecto ficticio de prueba del ciclo", city: "Madrid", promoterId: promoter.id, status: "FUNDING", fundedCents: 10000, fundingDeadline: new Date(Date.now() + 86400_000), financials: { create: { targetCents: 100000, budgetCents: 200000 } }, commitments: { create: { id: `${projectId}-commitment`, userId, amountCents: 10000, reflectionEndsAt: new Date(Date.now() - 1000), acceptances: "{}" } } } });
    expect((await request.get("/api/state")).ok()).toBeTruthy(); expect((await database.investmentCommitment.findUniqueOrThrow({ where: { id: `${projectId}-commitment` } })).status).toBe("CONFIRMED");
    await database.project.update({ where: { id: projectId }, data: { fundingDeadline: new Date(Date.now() - 86400_000) } });
    expect((await request.get("/api/state")).ok()).toBeTruthy(); const refunded = await database.investmentCommitment.findUniqueOrThrow({ where: { id: `${projectId}-commitment` } }); expect(refunded.status).toBe("REFUNDED"); expect(refunded.capitalReturnedCents).toBe(10000);
    const project = await database.project.findUniqueOrThrow({ where: { id: projectId } }); expect(project.status).toBe("CANCELLED"); expect(project.fundedCents).toBe(0); expect(await database.transaction.count({ where: { projectId, type: "REFUND", amountCents: 10000 } })).toBe(1);
    expect((await request.get("/api/state")).ok()).toBeTruthy(); expect(await database.transaction.count({ where: { projectId, type: "REFUND" } })).toBe(1);
  } finally { await database.auditEvent.deleteMany({ where: { OR: [{ entityId: projectId }, { entityId: `${projectId}-commitment` }, { userId: userId || "" }] } }); await database.transaction.deleteMany({ where: { projectId } }); await database.investmentCommitment.deleteMany({ where: { projectId } }); await database.project.deleteMany({ where: { id: projectId } }); if (userId) await database.user.delete({ where: { id: userId } }); await database.$disconnect(); }
});

test("API: compromisos concurrentes nunca superan el objetivo", async ({ request }) => {
  await login(request, "inversor"); const database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } } }); const projectId = `qa-capacity-${Date.now()}`;
  try {
    const promoter = await database.user.findFirstOrThrow({ where: { email: "promotor@cimiento.demo" } }); await database.project.create({ data: { id: projectId, slug: projectId, name: "Proyecto ficticio de prueba de concurrencia", city: "Madrid", promoterId: promoter.id, status: "FUNDING", fundingDeadline: new Date(Date.now() + 86400_000), financials: { create: { targetCents: 10000, budgetCents: 20000 } } } });
    const payload = { projectId, amount: 100, acceptances: { loss: true, illiquidity: true, notGuaranteed: true, documents: true }, paymentAccepted: true };
    const responses = await Promise.all([action(request, "invest", payload), action(request, "invest", payload)]); expect(responses.filter(r => r.ok()).length).toBe(1); expect(responses.filter(r => !r.ok())[0].status()).toBeGreaterThanOrEqual(400);
    const project = await database.project.findUniqueOrThrow({ where: { id: projectId } }); expect(project.fundedCents).toBe(10000); expect(project.status).toBe("FUNDED"); expect(await database.investmentCommitment.count({ where: { projectId } })).toBe(1);
    const c = await database.investmentCommitment.findFirstOrThrow({ where: { projectId } }); expect((await action(request, "cancelCommitment", { id: c.id })).ok()).toBeTruthy();
  } finally { const ids = (await database.investmentCommitment.findMany({ where: { projectId }, select: { id: true } })).map(c => c.id); await database.auditEvent.deleteMany({ where: { OR: [{ entityId: projectId }, { entityId: { in: ids } }] } }); await database.transaction.deleteMany({ where: { projectId } }); await database.investmentCommitment.deleteMany({ where: { projectId } }); await database.project.deleteMany({ where: { id: projectId } }); await database.$disconnect(); }
});
