import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { demoIdentity, getCurrentUser, hashPassword, requireDemo, verifyPassword } from "./auth";
import { ACTIVE_COMMITMENTS, PUBLIC_STATUSES, DomainError, assertRole, canCancel, cents, euros, milestoneProgress, riskScore, validateInvestment } from "./domain";
import type { AppState, Project, User, Role } from "./types";
import { paymentProvider, identityVerificationProvider } from "./providers";

type Tx = Prisma.TransactionClient;
const json = (value: unknown) => JSON.stringify(value ?? {});
function parseJson(value: string | null | undefined, fallback: any = {}) { try { return JSON.parse(value || "{}"); } catch { return fallback; } }
const text = (max = 5000) => z.string().trim().max(max);
const idSchema = z.string().min(1).max(100);
const money = z.coerce.number().finite().min(0).max(10_000_000);
const roles = ["INVESTOR", "PROMOTER", "ADMIN"] as const;
const statuses = ["DRAFT", "SUBMITTED", "ANALYSIS", "INFO_REQUIRED", "APPROVED", "PUBLISHED", "FUNDING", "FUNDED", "IN_PROGRESS", "REPAID", "DELAYED", "RECOVERY", "CANCELLED", "COMING_SOON"] as const;
const dateValue = z.string().max(100).refine(v => !Number.isNaN(new Date(v).getTime()), "Fecha inválida");
export const reflectionHours = () => Math.min(168, Math.max(1, Number(process.env.REFLECTION_HOURS) || 96));
const projectFields = z.object({
  id: idSchema.optional(), name: text(180).optional(), slug: text(180).regex(/^[a-z0-9-]+$/).optional(), city: text(100).optional(), address: text(250).optional(),
  type: z.enum(["DEBT", "EQUITY", "RENTAL"]).optional(), status: z.enum(statuses).optional(), target: money.optional(), budget: money.optional(),
  ownCapital: money.optional(), bankFinancing: money.optional(), contingency: money.optional(), presales: z.coerce.number().min(0).max(100).optional(),
  minInvestment: z.coerce.number().int().min(100).max(1_000_000).optional(), duration: z.coerce.number().int().min(1).max(120).optional(), annualRate: z.coerce.number().min(0).max(30).optional(),
  ltv: z.coerce.number().min(0).max(200).optional(), risk: z.enum(["A", "B", "C", "D"]).optional(), mortgage: z.boolean().optional(),
  image: z.string().max(1000).refine(v => /^\/(?:images|assets)\/[a-zA-Z0-9/_.-]+$/.test(v) && !v.includes(".."), "Utiliza una imagen local de demostración.").optional(),
  description: text().optional(), useOfFunds: text().optional(), guarantees: text().optional(), exitStrategy: text().optional(),
  experience: z.coerce.number().int().min(0).max(100).optional(), licenses: text(500).optional(), land: text(1000).optional(), planning: text(1000).optional(),
  startDate: dateValue.optional(), endDate: dateValue.optional(), fundingDeadline: dateValue.optional(), risks: text().optional(), reviewMessage: text().optional(),
  company: text(150).optional(), documents: z.array(text(150)).max(20).optional(), submit: z.boolean().optional(), justification: text(2000).optional(),
  action: z.enum(["SAVE", "APPROVE", "REJECT", "PUBLISH", "SUSPEND", "CLOSE"]).optional(), riskReview: z.unknown().optional(),
});
const includeProject = { financials: true, riskAssessment: true, milestones: { orderBy: { expectedDate: "asc" as const } }, documents: true, updates: { orderBy: { createdAt: "desc" as const } }, promoter: { include: { promoterProfile: true } } };

export function userDTO(u: any): User {
  return { id: u.id, name: u.name, email: u.email, role: u.role, onboardingStatus: u.onboardingStatus, notificationPreferences: parseJson(u.notificationPreferences), profile: { ...parseJson(u.investorProfile?.values), taxCountry: u.investorProfile?.fiscalCountry || "España", fiscalCountry: u.investorProfile?.fiscalCountry || "España", bankAccount: u.investorProfile?.bankAccount || "DEMO ES00 0000 0000 0000 0000 0000", ...(u.promoterProfile || {}) } };
}
export function projectDTO(p: any): Project {
  const f = p.financials;
  return { id: p.id, slug: p.slug, name: p.name, city: p.city, address: p.address, promoterId: p.promoterId, promoterName: p.promoter?.promoterProfile?.company || p.promoter?.name || "Promotor ficticio", type: p.type, status: p.status, target: euros(f?.targetCents || 0), funded: euros(p.fundedCents), investors: p.investorCount, minInvestment: euros(p.minInvestmentCents), duration: p.duration, annualRate: p.annualRate, ltv: p.ltv, risk: p.risk as any, mortgage: p.mortgage, image: p.image, description: p.description, useOfFunds: p.useOfFunds, guarantees: p.guarantees, exitStrategy: p.exitStrategy, budget: euros(f?.budgetCents || 0), ownCapital: euros(f?.ownCapitalCents || 0), bankFinancing: euros(f?.bankFinancingCents || 0), contingency: euros(f?.contingencyCents || 0), presales: f?.presales || 0, experience: p.experience, licenses: p.licenses, land: p.land, planning: p.planning, startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString(), fundingDeadline: p.fundingDeadline.toISOString(), createdAt: p.createdAt.toISOString(), risks: p.risks, reviewMessage: p.reviewMessage, progress: milestoneProgress(p.milestones || []), milestones: (p.milestones || []).map((m: any) => ({ id: m.id, projectId: m.projectId, name: m.name, description: m.description, expectedDate: m.expectedDate.toISOString(), actualDate: m.actualDate?.toISOString() || null, amount: euros(m.amountCents), status: m.status, evidence: m.evidence, certified: m.certified, approved: m.approved })), documents: (p.documents || []).map((d: any) => ({ id: d.id, projectId: d.projectId, name: d.name, category: d.category, createdAt: d.createdAt.toISOString() })), updates: (p.updates || []).map((u: any) => ({ id: u.id, projectId: u.projectId, title: u.title, content: u.content, createdAt: u.createdAt.toISOString() })), riskAssessment: p.riskAssessment ? { score: p.riskAssessment.score, factors: parseJson(p.riskAssessment.factors, []), decision: p.riskAssessment.decision, justification: p.riskAssessment.justification, automaticDecision: false } : undefined };
}
async function audit(tx: Tx, userId: string, action: string, entity: string, entityId: string, before: unknown = {}, after: unknown = {}) { await tx.auditEvent.create({ data: { userId, action, entity, entityId, before: json(before), after: json(after) } }); }
async function notify(tx: Tx, userId: string, title: string, content: string) { await tx.notification.create({ data: { userId, title, content } }); }
function requireUser(u: any) { if (!u) throw new DomainError("Inicia sesión para continuar.", 401); return u; }
function ownerOrAdmin(u: any, p: any) { if (u.role !== "ADMIN" && (u.role !== "PROMOTER" || p.promoterId !== u.id)) throw new DomainError("No tienes acceso a este proyecto.", 403); }
async function findProject(tx: Tx, id: string) { const p = await tx.project.findUnique({ where: { id }, include: includeProject }); if (!p) throw new DomainError("Proyecto no encontrado.", 404); return p; }

async function refundProject(tx: Tx, p: any, actorId: string, reason: string) {
  const commitments = await tx.investmentCommitment.findMany({ where: { projectId: p.id, status: { in: ["REFLECTION", "CONFIRMED"] } } });
  if (await tx.investmentCommitment.count({ where: { projectId: p.id, status: "INVESTED" } })) throw new DomainError("Un proyecto desembolsado debe gestionarse mediante una incidencia y recuperación.");
  for (const c of commitments) { await tx.investmentCommitment.update({ where: { id: c.id }, data: { status: "REFUNDED", capitalReturnedCents: c.amountCents } }); await tx.transaction.create({ data: { userId: c.userId, projectId: p.id, type: "REFUND", amountCents: c.amountCents, description: reason } }); await notify(tx, c.userId, "Compromiso cancelado y reembolsado", reason); }
  await tx.project.update({ where: { id: p.id }, data: { status: "CANCELLED", fundedCents: 0, investorCount: 0 } });
  await audit(tx, actorId, "ALL_OR_NOTHING_REFUND", "Project", p.id, { status: p.status, fundedCents: p.fundedCents }, { status: "CANCELLED", reason });
}
export async function settleLifecycle() {
  const now = new Date();
  await db.$transaction(async tx => {
    const failed = await tx.project.findMany({ where: { status: { in: ["FUNDING", "PUBLISHED"] }, fundingDeadline: { lt: now } }, include: { financials: true } });
    for (const p of failed) if (p.fundedCents < (p.financials?.targetCents || 0)) await refundProject(tx, p, p.promoterId, "No se alcanzó el objetivo: cancelación all-or-nothing y reembolso ficticio por el proveedor externo simulado.");
    const expired = await tx.investmentCommitment.findMany({ where: { status: "REFLECTION", reflectionEndsAt: { lte: now } }, include: { project: { include: { financials: true } } } });
    for (const c of expired) { const funded = c.project.fundedCents >= (c.project.financials?.targetCents || Infinity); const status = funded ? "INVESTED" : "CONFIRMED"; await tx.investmentCommitment.update({ where: { id: c.id }, data: { status } }); await audit(tx, c.userId, "REFLECTION_ENDED", "InvestmentCommitment", c.id, { status: "REFLECTION" }, { status }); }
    const confirmed = await tx.investmentCommitment.findMany({ where: { status: "CONFIRMED", project: { status: { in: ["FUNDED", "IN_PROGRESS"] } } } });
    for (const c of confirmed) { await tx.investmentCommitment.update({ where: { id: c.id }, data: { status: "INVESTED" } }); await audit(tx, c.userId, "PROJECT_FUNDED", "InvestmentCommitment", c.id, { status: "CONFIRMED" }, { status: "INVESTED" }); }
  }, { timeout: 15000 });
}
export async function getAppState(): Promise<AppState> {
  requireDemo(); await settleLifecycle();
  const current = await getCurrentUser();
  const owner = current?.id;
  const [projects, user, commitments, transactions, distributions, notifications, users, events, assessment] = await Promise.all([
    db.project.findMany({ where: current?.role === "ADMIN" ? {} : { OR: [{ status: { in: PUBLIC_STATUSES as any } }, ...(current?.role === "PROMOTER" ? [{ promoterId: owner }] : [])] }, include: includeProject, orderBy: { createdAt: "desc" } }),
    owner ? db.user.findUnique({ where: { id: owner }, include: { investorProfile: true, promoterProfile: true } }) : null,
    owner ? db.investmentCommitment.findMany({ where: current?.role === "ADMIN" ? {} : { userId: owner }, orderBy: { createdAt: "desc" } }) : [],
    owner ? db.transaction.findMany({ where: current?.role === "ADMIN" ? {} : { userId: owner }, orderBy: { createdAt: "desc" } }) : [],
    owner ? db.distribution.findMany({ where: current?.role === "ADMIN" ? {} : { userId: owner } }) : [],
    owner ? db.notification.findMany({ where: { userId: owner }, orderBy: { createdAt: "desc" } }) : [],
    current?.role === "ADMIN" ? db.user.findMany({ include: { investorProfile: true, promoterProfile: true }, orderBy: { createdAt: "desc" } }) : [],
    current?.role === "ADMIN" ? db.auditEvent.findMany({ take: 500, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }) : [],
    owner ? db.suitabilityAssessment.findUnique({ where: { userId: owner } }) : null,
  ]);
  return { user: user ? userDTO(user) : null, projects: projects.map(projectDTO), commitments: commitments.map(c => ({ id: c.id, userId: c.userId, projectId: c.projectId, amount: euros(c.amountCents), status: c.status, createdAt: c.createdAt.toISOString(), reflectionEndsAt: c.reflectionEndsAt.toISOString(), capitalReturned: euros(c.capitalReturnedCents), interestReceived: euros(c.interestReceivedCents) })), transactions: transactions.map(t => ({ id: t.id, userId: t.userId, projectId: t.projectId, type: t.type, amount: euros(t.amountCents), description: t.description, createdAt: t.createdAt.toISOString() })), distributions: distributions.map(d => ({ id: d.id, projectId: d.projectId, userId: d.userId, capital: euros(d.capitalCents), interest: euros(d.interestCents), scheduledAt: d.scheduledAt.toISOString(), status: d.status })), notifications: notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })), users: users.map(userDTO), audit: events.map(e => ({ id: e.id, userId: e.userId, userName: e.user.name, action: e.action, entity: e.entity, entityId: e.entityId, before: e.before, after: e.after, createdAt: e.createdAt.toISOString() })), onboarding: user?.investorProfile ? { ...parseJson(user.investorProfile.values), step: user.investorProfile.currentStep, values: parseJson(user.investorProfile.values), status: user.onboardingStatus, score: assessment?.score || 0, suitable: assessment?.suitable || false, riskAcknowledged: assessment?.riskAcknowledged || false } : {}, reflectionHours: reflectionHours(), demo: true };
}

export async function performAction(action: string, raw: unknown) {
  requireDemo();
  const payload = raw ?? {};
  if (action === "login") {
    const v = z.object({ email: z.email().max(180), password: z.string().min(1).max(200) }).parse(payload);
    const u = await db.user.findUnique({ where: { email: v.email.toLowerCase() } });
    if (!u || !verifyPassword(v.password, u.passwordHash)) throw new DomainError("El correo o la contraseña no coinciden.", 401);
    await demoIdentity.createSession(u.id); return { message: "Sesión de demostración iniciada.", data: { role: u.role } };
  }
  if (action === "register") {
    const v = z.object({ name: text(100).min(2), email: z.email().max(180).refine(v => v.toLowerCase().endsWith(".demo"), "Utiliza un correo ficticio terminado en .demo; no introduzcas un correo real."), password: z.string().min(8).max(100), role: z.enum(["INVESTOR", "PROMOTER"]) }).parse(payload);
    if (await db.user.findUnique({ where: { email: v.email.toLowerCase() } })) throw new DomainError("Ya existe una cuenta con este correo.");
    const u = await db.user.create({ data: { name: v.name, email: v.email.toLowerCase(), passwordHash: hashPassword(v.password), role: v.role, ...(v.role === "INVESTOR" ? { investorProfile: { create: {} }, assessment: { create: {} } } : { promoterProfile: { create: { company: `${v.name} · sociedad ficticia` } } }) } });
    await demoIdentity.createSession(u.id); return { message: "Cuenta ficticia creada. Completa tu perfil de demostración.", data: { role: u.role } };
  }
  if (action === "demoLogin") {
    if (process.env.NODE_ENV !== "development") throw new DomainError("El selector de roles solo está disponible en desarrollo.", 403);
    const v = z.object({ role: z.enum(roles) }).parse(payload); const u = await db.user.findUnique({ where: { email: `${v.role === "INVESTOR" ? "inversor" : v.role === "PROMOTER" ? "promotor" : "admin"}@cimiento.demo` } });
    if (!u) throw new DomainError("Carga los datos de demostración antes de continuar.", 503);
    await demoIdentity.createSession(u.id); return { message: "Rol de demostración seleccionado.", data: { role: u.role } };
  }
  if (action === "logout") { await demoIdentity.logout(); return { message: "Has cerrado la sesión." }; }
  const u = requireUser(await getCurrentUser());
  if (action === "saveOnboarding") {
    assertRole(u.role, ["INVESTOR"]);
    const v = z.object({ step: z.coerce.number().int().min(1).max(10), values: z.record(z.string(), z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.array(z.string().max(200)).max(10)])), submit: z.boolean().optional() }).parse(payload);
    const existing = await db.investorProfile.findUnique({ where: { userId: u.id } }); const values = { ...parseJson(existing?.values), ...v.values };
    let score = 0; let suitable = false; let status: "PENDING" | "APPROVED" | "REVIEW_REQUIRED" = "PENDING";
    if (v.submit) {
      for (const key of ["name", "taxCountry", "identityFile", "employment", "experience", "objective", "lossCapacity", "sourceOfFunds", "knowledge1", "knowledge2", "knowledge3"]) if (!String(values[key] || "").trim()) throw new DomainError(`Completa el campo ${key} antes de finalizar.`);
      if (values.riskAccepted !== true) throw new DomainError("Debes aceptar expresamente la pérdida potencial y los riesgos.");
      if (!/demo|fictici|ejemplo/i.test(String(values.identityFile))) throw new DomainError("Selecciona un documento ficticio identificado como DEMO. No uses documentos reales.");
      z.object({ name: text(100).min(2), birthYear: z.coerce.number().int().min(1900).max(new Date().getUTCFullYear() - 18), taxCountry: z.enum(["España", "Portugal", "Francia", "Otro"]), employment: z.enum(["employed", "self", "retired", "other"]), experience: z.enum(["none", "basic", "experienced"]), objective: z.enum(["diversification", "growth", "income", "liquidity"]), lossCapacity: z.enum(["none", "partial", "total"]), sourceOfFunds: z.enum(["salary", "business", "sale", "inheritance", "other"]), knowledge1: z.enum(["guaranteed", "loss", "deposit"]), knowledge2: z.enum(["daily", "illiquid", "secondary"]), knowledge3: z.enum(["cimiento", "external", "promoter"]) }).parse(values);
      await identityVerificationProvider.verifyFictionalDocument(String(values.identityFile));
      score = [values.knowledge1 === "loss", values.knowledge2 === "illiquid", values.knowledge3 === "external"].filter(Boolean).length;
      suitable = score >= 2 && values.lossCapacity !== "none" && values.experience !== "none" && values.objective !== "liquidity"; status = suitable ? "APPROVED" : "REVIEW_REQUIRED";
    }
    await db.$transaction(async tx => {
      await tx.investorProfile.upsert({ where: { userId: u.id }, create: { userId: u.id, values: json(values), currentStep: v.step, fiscalCountry: String(values.taxCountry || "España"), ...(v.submit ? { completedAt: new Date() } : {}) }, update: { values: json(values), currentStep: v.step, fiscalCountry: String(values.taxCountry || "España"), ...(v.submit ? { completedAt: new Date() } : {}) } });
      if (v.submit) { await tx.user.update({ where: { id: u.id }, data: { onboardingStatus: status } }); await tx.suitabilityAssessment.upsert({ where: { userId: u.id }, create: { userId: u.id, answers: json(values), score, suitable, riskAcknowledged: true, status, completedAt: new Date() }, update: { answers: json(values), score, suitable, riskAcknowledged: true, status, completedAt: new Date() } }); await audit(tx, u.id, "ONBOARDING_SUBMITTED", "User", u.id, {}, { status, score }); }
    });
    return { message: v.submit ? suitable ? "Onboarding ficticio aprobado. Puedes simular una inversión." : "El producto podría no ser adecuado. Se requiere revisión del administrador antes de invertir." : "Borrador guardado.", data: { status, score, suitable } };
  }
  if (action === "invest") {
    assertRole(u.role, ["INVESTOR"]);
    if (u.onboardingStatus !== "APPROVED") throw new DomainError("Completa el onboarding y espera su aprobación antes de invertir.", 403);
    const v = z.object({
      projectId: idSchema,
      idempotencyKey: z.uuid("La referencia de la solicitud no es válida. Actualiza la página y vuelve a intentarlo."),
      amount: z.coerce.number().finite().int().min(100).max(10_000_000),
      acceptances: z.object({ loss: z.literal(true), illiquidity: z.literal(true), notGuaranteed: z.literal(true), documents: z.literal(true) }),
      paymentAccepted: z.literal(true),
    }).parse(payload);
    const where = { userId_idempotencyKey: { userId: u.id, idempotencyKey: v.idempotencyKey } };
    const response = (c: { id: string; projectId: string; amountCents: number; status: string; reflectionEndsAt: Date }, replayed: boolean) => {
      if (c.projectId !== v.projectId || c.amountCents !== cents(v.amount))
        throw new DomainError("Esta referencia ya se utilizó con otro proyecto o importe. Consulta tu cartera antes de continuar.", 409);
      return {
        message: replayed ? "La solicitud ya estaba registrada. Hemos recuperado tu compromiso sin duplicarlo." : "Compromiso ficticio registrado. Tu periodo de reflexión está activo.",
        data: { id: c.id, status: c.status, amount: euros(c.amountCents), reflectionEndsAt: c.reflectionEndsAt.toISOString(), replayed },
      };
    };
    // Check before capacity/status: a successful request may have fully funded the project.
    const existing = await db.investmentCommitment.findUnique({ where });
    if (existing) return response(existing, true);
    try {
      return await db.$transaction(async tx => {
        const duplicate = await tx.investmentCommitment.findUnique({ where });
        if (duplicate) return response(duplicate, true);
        const p = await findProject(tx, v.projectId);
        if (p.type !== "DEBT" || p.status !== "FUNDING" || p.fundingDeadline <= new Date()) throw new DomainError("Este proyecto está cerrado o todavía no admite compromisos.");
        const target = p.financials?.targetCents || 0;
        validateInvestment(v.amount, euros(target - p.fundedCents), euros(p.minInvestmentCents));
        const alreadyInvestor = await tx.investmentCommitment.count({ where: { projectId: p.id, userId: u.id, status: { in: ACTIVE_COMMITMENTS as any } } });
        const reserved = await tx.project.updateMany({ where: { id: p.id, status: "FUNDING", fundedCents: p.fundedCents }, data: { fundedCents: { increment: cents(v.amount) } } });
        if (reserved.count !== 1) throw new DomainError("El capital disponible ha cambiado. Actualiza el proyecto e inténtalo de nuevo.", 409);
        const payment = await paymentProvider.reserve({ userId: u.id, projectId: p.id, amountCents: cents(v.amount) });
        const c = await tx.investmentCommitment.create({ data: {
          userId: u.id, projectId: p.id, idempotencyKey: v.idempotencyKey, amountCents: cents(v.amount),
          acceptances: json({ ...v.acceptances, paymentReference: payment.reference, administrator: payment.administrator }),
          reflectionEndsAt: new Date(Date.now() + reflectionHours() * 3600_000),
        } });
        await tx.project.update({ where: { id: p.id }, data: { ...(!alreadyInvestor ? { investorCount: { increment: 1 } } : {}), ...(p.fundedCents + cents(v.amount) === target ? { status: "FUNDED" } : {}) } });
        await tx.transaction.create({ data: { userId: u.id, projectId: p.id, type: "COMMITMENT", amountCents: -c.amountCents, description: "Compromiso ficticio. Fondos administrados por proveedor de pagos externo simulado." } });
        await notify(tx, u.id, "Compromiso registrado", "Puedes cancelar durante las próximas " + reflectionHours() + " horas desde tu cartera.");
        await audit(tx, u.id, "INVESTMENT_COMMITTED", "InvestmentCommitment", c.id, {}, { amount: v.amount, projectId: p.id, idempotencyKey: v.idempotencyKey });
        return response(c, false);
      });
    } catch (error) {
      // A concurrent winner may have committed while this transaction rolled back.
      // The database unique constraint also prevents duplicate movements/audit events.
      const completed = await db.investmentCommitment.findUnique({ where }).catch(() => null);
      if (completed) return response(completed, true);
      throw error;
    }
  }

  if (action === "cancelCommitment") {
    assertRole(u.role, ["INVESTOR"]); const v = z.object({ id: idSchema }).parse(payload);
    await db.$transaction(async tx => { const c = await tx.investmentCommitment.findUnique({ where: { id: v.id } }); if (!c || c.userId !== u.id) throw new DomainError("Compromiso no encontrado.", 404); if (!canCancel(c.status, c.reflectionEndsAt)) throw new DomainError("El periodo de reflexión ha finalizado o el compromiso ya no se puede cancelar.");
      const changed = await tx.investmentCommitment.updateMany({ where: { id: c.id, status: "REFLECTION", reflectionEndsAt: { gt: new Date() } }, data: { status: "CANCELLED" } }); if (!changed.count) throw new DomainError("El compromiso cambió de estado. Actualiza la cartera.", 409);
      const reservation = parseJson(c.acceptances).paymentReference; if (reservation) await paymentProvider.cancel(reservation);
      const p = await findProject(tx, c.projectId); const otherActive = await tx.investmentCommitment.count({ where: { projectId: p.id, userId: u.id, status: { in: ACTIVE_COMMITMENTS as any } } }); await tx.project.update({ where: { id: p.id }, data: { fundedCents: { decrement: c.amountCents }, ...(!otherActive && p.investorCount > 0 ? { investorCount: { decrement: 1 } } : {}), ...(p.status === "FUNDED" ? { status: "FUNDING" } : {}) } });
      await tx.transaction.create({ data: { userId: u.id, projectId: p.id, type: "CANCELLATION", amountCents: c.amountCents, description: "Cancelación ficticia durante el periodo de reflexión. No se ha movido dinero real." } }); await audit(tx, u.id, "COMMITMENT_CANCELLED", "InvestmentCommitment", c.id, { status: c.status }, { status: "CANCELLED" }); await notify(tx, u.id, "Compromiso cancelado", "La reserva ficticia ha sido liberada.");
    }); return { message: "Compromiso cancelado durante el periodo de reflexión." };
  }
  if (action === "saveProfile") {
    const v = z.object({ name: text(100).min(2), taxCountry: text(100).optional(), bankAccount: text(100).optional(), securityNote: text(500).optional(), preferences: z.record(z.string(), z.boolean()).optional() }).parse(payload);
    if (v.bankAccount && !/^DEMO[ A-Z0-9]*$/i.test(v.bankAccount)) throw new DomainError("La cuenta debe comenzar por DEMO. No introduzcas una cuenta bancaria real.");
    await db.$transaction(async tx => { await tx.user.update({ where: { id: u.id }, data: { name: v.name, ...(v.preferences ? { notificationPreferences: json(v.preferences) } : {}) } }); if (u.role === "INVESTOR") await tx.investorProfile.upsert({ where: { userId: u.id }, create: { userId: u.id, fiscalCountry: v.taxCountry, bankAccount: v.bankAccount }, update: { fiscalCountry: v.taxCountry, bankAccount: v.bankAccount } }); await audit(tx, u.id, "PROFILE_UPDATED", "User", u.id, { name: u.name }, { name: v.name }); }); return { message: "Perfil de demostración actualizado." };
  }
  if (action === "savePreferences") { const v = z.object({ preferences: z.record(z.string(), z.boolean()) }).parse(payload); await db.user.update({ where: { id: u.id }, data: { notificationPreferences: json(v.preferences) } }); return { message: "Preferencias guardadas." }; }
  if (action === "markNotification") { const v = z.object({ id: idSchema }).parse(payload); await db.notification.updateMany({ where: { id: v.id, userId: u.id }, data: { read: true } }); return { message: "Notificación marcada como leída." }; }
  if (action === "saveApplication" || action === "adminProject") {
    assertRole(u.role, action === "adminProject" ? ["ADMIN"] : ["PROMOTER"]); const v = projectFields.parse(payload);
    if (action === "adminProject" && (!v.justification || v.justification.length < 8)) throw new DomainError("Añade una justificación de al menos 8 caracteres para registrar la decisión.");
    const result = await db.$transaction(async tx => {
      const existing = v.id ? await findProject(tx, v.id) : null; if (existing) ownerOrAdmin(u, existing);
      if (action === "saveApplication" && existing && !["DRAFT", "INFO_REQUIRED", "SUBMITTED"].includes(existing.status)) throw new DomainError("Este expediente está en revisión. Responde al equipo de análisis para comunicar cambios.");
      let status: any = action === "saveApplication" ? v.submit ? "SUBMITTED" : existing?.status || "DRAFT" : v.status || existing?.status || "DRAFT";
      if (v.action === "APPROVE") status = "APPROVED"; if (v.action === "REJECT") status = "INFO_REQUIRED"; if (v.action === "PUBLISH") status = "FUNDING"; if (v.action === "SUSPEND") status = "DELAYED"; if (v.action === "CLOSE") status = "CANCELLED";
      const financial = { targetCents: cents(v.target ?? euros(existing?.financials?.targetCents || 0)), budgetCents: cents(v.budget ?? euros(existing?.financials?.budgetCents || 0)), ownCapitalCents: cents(v.ownCapital ?? euros(existing?.financials?.ownCapitalCents || 0)), bankFinancingCents: cents(v.bankFinancing ?? euros(existing?.financials?.bankFinancingCents || 0)), contingencyCents: cents(v.contingency ?? euros(existing?.financials?.contingencyCents || 0)), presales: v.presales ?? existing?.financials?.presales ?? 0 };
      if (existing && financial.targetCents < existing.fundedCents) throw new DomainError("El objetivo no puede ser inferior al capital ya comprometido.");
      const source: any = { ...existing, ...v }; const isPublished = PUBLIC_STATUSES.includes(status) && status !== "CANCELLED" && status !== "COMING_SOON";
      if (existing && existing.fundedCents > 0 && !PUBLIC_STATUSES.includes(status)) throw new DomainError("Un proyecto con capital comprometido debe permanecer visible. Gestiona una suspensión o incidencia en su lugar.");
      if (["FUNDED", "IN_PROGRESS", "REPAID", "RECOVERY"].includes(status) && (!existing || existing.fundedCents < financial.targetCents || financial.targetCents <= 0)) throw new DomainError("Ese estado requiere haber alcanzado el objetivo de financiación.");
      if (status === "REPAID" && existing && await tx.investmentCommitment.count({ where: { projectId: existing.id, status: { in: ACTIVE_COMMITMENTS as any } } })) throw new DomainError("Registra primero las devoluciones de capital; todavía quedan compromisos activos.");
      if (v.submit || isPublished) { for (const key of ["name", "city", "description", "useOfFunds", "guarantees", "exitStrategy", "licenses", "land", "planning"]) if (!String(source[key] || "").trim()) throw new DomainError(`Completa ${key} antes de enviar o publicar.`); if (financial.targetCents < 10000 || financial.budgetCents < financial.targetCents) throw new DomainError("El objetivo debe ser al menos 100 € y no superar el presupuesto."); }
      if ((v.submit || isPublished) && financial.targetCents + financial.ownCapitalCents + financial.bankFinancingCents > financial.budgetCents) throw new DomainError("La financiación solicitada, bancaria y el capital propio no pueden superar el presupuesto total.");
      if (["FUNDING", "PUBLISHED"].includes(status) && (v.type || existing?.type || "DEBT") !== "DEBT") throw new DomainError("Equity y rentas están disponibles solo como Próximamente.");
      if (["FUNDING", "PUBLISHED"].includes(status) && !(v.fundingDeadline || existing?.fundingDeadline) ) throw new DomainError("Define una fecha límite de financiación.");
      const data: any = {};
      for (const key of ["name", "city", "address", "type", "duration", "annualRate", "ltv", "risk", "mortgage", "image", "description", "useOfFunds", "guarantees", "exitStrategy", "experience", "licenses", "land", "planning", "risks", "reviewMessage"]) if ((v as any)[key] !== undefined) data[key] = (v as any)[key];
      for (const key of ["startDate", "endDate", "fundingDeadline"]) if ((v as any)[key]) data[key] = new Date((v as any)[key]);
      if (v.minInvestment !== undefined) data.minInvestmentCents = cents(v.minInvestment);
      const p = existing ? await tx.project.update({ where: { id: existing.id }, data: { ...data, status: status === "CANCELLED" ? existing.status : status, financials: { upsert: { create: financial, update: financial } } } }) : await tx.project.create({ data: { ...data, name: v.name || "Nuevo proyecto ficticio", city: v.city || "Por definir", slug: v.slug || `proyecto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, status, promoterId: u.role === "PROMOTER" ? u.id : (await tx.user.findFirst({ where: { role: "PROMOTER" } }))?.id || u.id, financials: { create: financial } } });
      if (v.company && u.role === "PROMOTER") await tx.promoterProfile.upsert({ where: { userId: u.id }, create: { userId: u.id, company: v.company, experience: v.experience || 0 }, update: { company: v.company, experience: v.experience || 0 } });
      if (v.documents) for (const name of v.documents) { const demoName = name.includes("DEMO") ? name : `${name} · DEMO`; if (!(await tx.projectDocument.findFirst({ where: { projectId: p.id, name: demoName } }))) await tx.projectDocument.create({ data: { projectId: p.id, name: demoName, category: "Expediente ficticio" } }); }
      const scored = riskScore({ experience: p.experience, ownCapital: euros(financial.ownCapitalCents), budget: euros(financial.budgetCents), licenses: p.licenses, ltv: p.ltv, contingency: euros(financial.contingencyCents), mortgage: p.mortgage, presales: financial.presales, exitStrategy: p.exitStrategy, duration: p.duration });
      await tx.projectRiskAssessment.upsert({ where: { projectId: p.id }, create: { projectId: p.id, score: scored.score, factors: json(scored.factors), decision: v.action === "APPROVE" ? "APPROVED" : v.action === "REJECT" ? "REJECTED" : "PENDING", justification: v.justification || "Pendiente de evaluación humana." }, update: { score: scored.score, factors: json(scored.factors), ...(v.action === "APPROVE" || v.action === "REJECT" ? { decision: v.action === "APPROVE" ? "APPROVED" : "REJECTED", justification: v.justification, reviewedAt: new Date() } : {}) } });
      if (status === "CANCELLED" && existing) await refundProject(tx, existing, u.id, v.justification || "Cancelación administrativa de demostración.");
      await audit(tx, u.id, action === "adminProject" ? `ADMIN_PROJECT_${v.action || "SAVE"}` : v.submit ? "APPLICATION_SUBMITTED" : "APPLICATION_SAVED", "Project", p.id, existing ? projectDTO(existing) : {}, { ...v, status }); return p.id;
    }); return { message: v.submit ? "Solicitud enviada al equipo de análisis ficticio." : "Proyecto guardado. La puntuación orienta al revisor; no decide automáticamente.", data: { id: result } };
  }
  if (action === "promoterReply") { assertRole(u.role, ["PROMOTER"]); const v = z.object({ projectId: idSchema, message: text(3000).min(5) }).parse(payload); await db.$transaction(async tx => { const p = await findProject(tx, v.projectId); ownerOrAdmin(u, p); await tx.project.update({ where: { id: p.id }, data: { reviewMessage: `Respuesta del promotor: ${v.message}`, ...(p.status === "INFO_REQUIRED" ? { status: "SUBMITTED" } : {}) } }); await audit(tx, u.id, "PROMOTER_REPLIED", "Project", p.id, {}, { message: v.message }); }); return { message: "Respuesta enviada al expediente de demostración." }; }
  if (action === "requestMilestone") { assertRole(u.role, ["PROMOTER"]); const v = z.object({ id: idSchema, evidence: text(2000).min(8) }).parse(payload); await db.$transaction(async tx => { const m = await tx.projectMilestone.findUnique({ where: { id: v.id }, include: { project: true } }); if (!m) throw new DomainError("Hito no encontrado.", 404); ownerOrAdmin(u, m.project); if (m.approved) throw new DomainError("El hito ya fue aprobado."); await tx.projectMilestone.update({ where: { id: m.id }, data: { evidence: `DEMO: ${v.evidence}`, status: "VALIDATION_REQUESTED" } }); await audit(tx, u.id, "MILESTONE_VALIDATION_REQUESTED", "ProjectMilestone", m.id, {}, v); }); return { message: "Validación ficticia solicitada. El desembolso requiere aprobación administrativa." }; }
  if (action === "publishUpdate") { assertRole(u.role, ["PROMOTER", "ADMIN"]); const v = z.object({ projectId: idSchema, title: text(160).min(4), content: text().min(15) }).parse(payload); await db.$transaction(async tx => { const p = await findProject(tx, v.projectId); ownerOrAdmin(u, p); const update = await tx.projectUpdate.create({ data: v }); await audit(tx, u.id, "UPDATE_PUBLISHED", "ProjectUpdate", update.id, {}, v); const investors = await tx.investmentCommitment.findMany({ where: { projectId: p.id, status: { in: ACTIVE_COMMITMENTS as any } }, distinct: ["userId"], select: { userId: true } }); for (const investor of investors) await notify(tx, investor.userId, v.title, `Actualización ficticia de ${p.name}: ${v.content}`); }); return { message: "Actualización ficticia publicada." }; }
  assertRole(u.role, ["ADMIN"]);
  if (action === "adminReviewUser") { const v = z.object({ id: idSchema, status: z.enum(["PENDING", "APPROVED", "REVIEW_REQUIRED"]), justification: text(2000).min(8) }).parse(payload); await db.$transaction(async tx => { const before = await tx.user.findUnique({ where: { id: v.id } }); if (!before || before.role !== "INVESTOR") throw new DomainError("Inversor no encontrado.", 404); if (v.status === "APPROVED") { const a = await tx.suitabilityAssessment.findUnique({ where: { userId: v.id } }); if (!a?.riskAcknowledged) throw new DomainError("El inversor debe completar el onboarding y aceptar los riesgos antes de ser aprobado."); } await tx.user.update({ where: { id: v.id }, data: { onboardingStatus: v.status } }); await tx.suitabilityAssessment.updateMany({ where: { userId: v.id }, data: { status: v.status } }); await notify(tx, v.id, "Revisión del onboarding", `Estado: ${v.status}. ${v.justification}`); await audit(tx, u.id, "INVESTOR_REVIEWED", "User", v.id, { status: before.onboardingStatus }, v); }); return { message: "Revisión ficticia registrada con justificación." }; }
  if (action === "adminSaveMilestone") { const v = z.object({ id: idSchema.optional(), projectId: idSchema, name: text(150).min(3), description: text().min(5), expectedDate: dateValue, amount: money, evidence: text(2000).optional() }).parse(payload); await db.$transaction(async tx => { await findProject(tx, v.projectId); const existing = v.id ? await tx.projectMilestone.findUnique({ where: { id: v.id } }) : null; if (v.id && (!existing || existing.projectId !== v.projectId)) throw new DomainError("Hito no encontrado.", 404); if (existing?.approved) throw new DomainError("No se puede editar un hito ya aprobado o desembolsado."); const data = { projectId: v.projectId, name: v.name, description: v.description, expectedDate: new Date(v.expectedDate), amountCents: cents(v.amount), evidence: v.evidence }; const m = existing ? await tx.projectMilestone.update({ where: { id: existing.id }, data }) : await tx.projectMilestone.create({ data }); await audit(tx, u.id, "MILESTONE_SAVED", "ProjectMilestone", m.id, existing, data); }); return { message: "Hito guardado." }; }
  if (action === "adminMilestone") { const v = z.object({ id: idSchema, certified: z.boolean(), approved: z.boolean(), justification: text(2000).min(8) }).parse(payload); await db.$transaction(async tx => { const m = await tx.projectMilestone.findUnique({ where: { id: v.id }, include: { project: { include: { financials: true } } } }); if (!m) throw new DomainError("Hito no encontrado.", 404); if (m.status === "DISBURSED") throw new DomainError("El hito ya se desembolsó. No puede registrarse de nuevo."); if (v.approved && (!v.certified || !m.evidence)) throw new DomainError("Se requiere evidencia documental y certificación simulada antes del desembolso."); if (v.approved && !["FUNDED", "IN_PROGRESS", "DELAYED"].includes(m.project.status)) throw new DomainError("El proyecto debe estar financiado antes de desembolsar."); if (v.approved && await tx.investmentCommitment.count({ where: { projectId: m.projectId, status: "REFLECTION" } })) throw new DomainError("Espera a que finalicen los periodos de reflexión antes de desembolsar.");
      if (v.approved) { const sum = await tx.projectMilestone.aggregate({ where: { projectId: m.projectId, status: "DISBURSED" }, _sum: { amountCents: true } }); if ((sum._sum.amountCents || 0) + m.amountCents > m.project.fundedCents) throw new DomainError("El desembolso supera el capital financiado disponible."); }
      if (v.approved) await paymentProvider.disburse({ projectId: m.projectId, milestoneId: m.id, amountCents: m.amountCents, certified: v.certified, approved: v.approved });
      await tx.projectMilestone.update({ where: { id: m.id }, data: { certified: v.certified, approved: v.approved, status: v.approved ? "DISBURSED" : "VALIDATION_REQUESTED", ...(v.approved ? { actualDate: new Date() } : {}) } }); if (v.approved) { await tx.project.update({ where: { id: m.projectId }, data: { status: "IN_PROGRESS" } }); await tx.transaction.create({ data: { userId: m.project.promoterId, projectId: m.projectId, type: "DISBURSEMENT", amountCents: m.amountCents, description: `Desembolso ficticio por proveedor externo: ${m.name}` } }); } await audit(tx, u.id, "MILESTONE_REVIEWED", "ProjectMilestone", m.id, { status: m.status, approved: m.approved }, v); }); return { message: "Certificación, aprobación y desembolso ficticio registrados." }; }
  if (action === "adminDocument") { const v = z.object({ projectId: idSchema, name: text(150).optional(), category: text(100).optional(), removeId: idSchema.optional() }).parse(payload); await db.$transaction(async tx => { await findProject(tx, v.projectId); if (v.removeId) { const count = await tx.projectDocument.deleteMany({ where: { id: v.removeId, projectId: v.projectId } }); if (!count.count) throw new DomainError("Documento no encontrado.", 404); } else { if (!v.name?.trim()) throw new DomainError("Indica un nombre para el documento ficticio."); await tx.projectDocument.create({ data: { projectId: v.projectId, name: `${v.name} · DEMO`, category: v.category || "Documento ficticio" } }); } await audit(tx, u.id, "DOCUMENT_MANAGED", "Project", v.projectId, {}, v); }); return { message: "Documento ficticio actualizado. No se almacenan archivos personales." }; }
  if (action === "adminDistribution") { const v = z.object({ projectId: idSchema, capital: money, interest: money, justification: text(2000).min(8) }).parse(payload); if (v.capital + v.interest <= 0) throw new DomainError("Indica un importe positivo."); await db.$transaction(async tx => { const p = await findProject(tx, v.projectId); if (!["FUNDED", "IN_PROGRESS", "DELAYED", "RECOVERY", "REPAID"].includes(p.status)) throw new DomainError("El proyecto no está en fase de devolución."); const commitments = await tx.investmentCommitment.findMany({ where: { projectId: p.id, status: { in: ["INVESTED", "REPAID"] } } }); const outstanding = commitments.reduce((s, c) => s + c.amountCents - c.capitalReturnedCents, 0); if (cents(v.capital) > outstanding) throw new DomainError("El capital supera el pendiente de devolución de los compromisos registrados."); if (!commitments.length || !outstanding) throw new DomainError("No hay capital pendiente para distribuir."); let remainingCapital = cents(v.capital), remainingInterest = cents(v.interest); const relevant = commitments.filter(c => c.amountCents > c.capitalReturnedCents); for (let i = 0; i < relevant.length; i++) { const c = relevant[i]; const balance = c.amountCents - c.capitalReturnedCents; const capital = i === relevant.length - 1 ? remainingCapital : Math.floor(cents(v.capital) * balance / outstanding); const interest = i === relevant.length - 1 ? remainingInterest : Math.floor(cents(v.interest) * balance / outstanding); remainingCapital -= capital; remainingInterest -= interest; await tx.distribution.create({ data: { userId: c.userId, projectId: p.id, capitalCents: capital, interestCents: interest, scheduledAt: new Date(), status: "PAID" } }); await tx.investmentCommitment.update({ where: { id: c.id }, data: { capitalReturnedCents: { increment: capital }, interestReceivedCents: { increment: interest }, ...(c.capitalReturnedCents + capital === c.amountCents ? { status: "REPAID" } : {}) } }); if (capital) await tx.transaction.create({ data: { userId: c.userId, projectId: p.id, type: "CAPITAL_RETURN", amountCents: capital, description: "Devolución ficticia de capital" } }); if (interest) await tx.transaction.create({ data: { userId: c.userId, projectId: p.id, type: "DISTRIBUTION", amountCents: interest, description: "Distribución ficticia bruta. Fiscalidad no calculada." } }); await notify(tx, c.userId, "Distribución ficticia registrada", `Capital ${euros(capital)} €; intereses brutos ${euros(interest)} €.`); } if (cents(v.capital) === outstanding) await tx.project.update({ where: { id: p.id }, data: { status: "REPAID" } }); await audit(tx, u.id, "DISTRIBUTION_RECORDED", "Project", p.id, {}, v); }); return { message: "Distribución ficticia repartida proporcionalmente y registrada en auditoría." }; }
  if (action === "adminIncident") { const v = z.object({ projectId: idSchema, status: z.enum(["DELAYED", "RECOVERY", "IN_PROGRESS"]), description: text(3000).min(8) }).parse(payload); await db.$transaction(async tx => { const p = await findProject(tx, v.projectId); if (!["FUNDED", "IN_PROGRESS", "DELAYED", "RECOVERY"].includes(p.status)) throw new DomainError("Solo se pueden gestionar incidencias de proyectos financiados."); await tx.project.update({ where: { id: p.id }, data: { status: v.status, reviewMessage: v.description } }); await tx.projectUpdate.create({ data: { projectId: p.id, title: v.status === "RECOVERY" ? "Incidencia: gestión de recuperación ficticia" : "Actualización de plazo ficticia", content: v.description } }); const users = await tx.investmentCommitment.findMany({ where: { projectId: p.id }, distinct: ["userId"], select: { userId: true } }); for (const investor of users) await notify(tx, investor.userId, "Incidencia en tu proyecto", `${p.name}: ${v.description}`); await audit(tx, u.id, "INCIDENT_RECORDED", "Project", p.id, { status: p.status }, v); }); return { message: "Incidencia ficticia registrada y comunicada a los inversores." }; }
  if (action === "adminAdvanceTime") { const v = z.object({ id: idSchema.optional() }).parse(payload); await db.$transaction(async tx => { const items = await tx.investmentCommitment.findMany({ where: { ...(v.id ? { id: v.id } : {}), status: "REFLECTION" } }); for (const c of items) { await tx.investmentCommitment.update({ where: { id: c.id }, data: { reflectionEndsAt: new Date(Date.now() - 1000) } }); await audit(tx, u.id, "DEMO_REFLECTION_EXPIRED", "InvestmentCommitment", c.id, { reflectionEndsAt: c.reflectionEndsAt }, { explanation: "Acción explícita de demostración; no altera el reloj real." }); } }); await settleLifecycle(); return { message: "Periodos de reflexión finalizados mediante la herramienta de demostración." }; }
  throw new DomainError("Acción desconocida.", 404);
}
