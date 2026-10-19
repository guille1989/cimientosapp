import type { Project, Role, CommitmentStatus } from "./types";

export class DomainError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = "DomainError"; }
}
export const PUBLIC_STATUSES = ["PUBLISHED", "FUNDING", "FUNDED", "IN_PROGRESS", "REPAID", "DELAYED", "RECOVERY", "CANCELLED", "COMING_SOON"];
export const ACTIVE_COMMITMENTS: CommitmentStatus[] = ["REFLECTION", "CONFIRMED", "INVESTED"];
export const cents = (euros: number) => Math.round(euros * 100);
export const euros = (value: number) => value / 100;
export function fundingPercentage(funded: number, target: number): number { return target <= 0 ? 0 : Math.min(100, Math.round((funded / target) * 1000) / 10); }
export function validateInvestment(amount: number, remaining: number, minimum = 100): void {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < minimum) throw new DomainError(`La inversión mínima es de ${minimum} € y debe ser una cantidad entera.`);
  if (amount > remaining) throw new DomainError("La cantidad supera el capital pendiente del proyecto.");
}
export function canCancel(status: CommitmentStatus, reflectionEndsAt: Date | string, now = new Date()) { return status === "REFLECTION" && new Date(reflectionEndsAt).getTime() > now.getTime(); }
export function commitmentNextStatus(status: CommitmentStatus, reflectionEndsAt: Date | string, funded: boolean, now = new Date()): CommitmentStatus {
  if (status === "REFLECTION" && new Date(reflectionEndsAt).getTime() <= now.getTime()) return funded ? "INVESTED" : "CONFIRMED";
  if (status === "CONFIRMED" && funded) return "INVESTED";
  return status;
}
export function estimatedScenario(amount: number, annualRate: number, months: number) {
  const grossInterest = Math.round(amount * annualRate / 100 * months / 12 * 100) / 100;
  return { capital: amount, grossInterest, grossTotal: amount + grossInterest, fees: 0, annualRate, months, guaranteed: false };
}
export function assertRole(role: Role | undefined, allowed: Role[]) { if (!role || !allowed.includes(role)) throw new DomainError("No tienes permisos para esta acción.", role ? 403 : 401); }
export function milestoneProgress(milestones: { approved: boolean; amount?: number; amountCents?: number }[]) {
  const total = milestones.reduce((s, m) => s + (m.amount ?? m.amountCents ?? 0), 0);
  return total ? Math.round(milestones.filter(m => m.approved).reduce((s, m) => s + (m.amount ?? m.amountCents ?? 0), 0) / total * 100) : 0;
}
export function riskScore(input: { experience: number; ownCapital: number; budget: number; licenses: string; ltv: number; contingency: number; mortgage: boolean; presales: number; exitStrategy: string; duration: number }) {
  const factors = [
    { name: "Experiencia del promotor", score: Math.min(10, input.experience) },
    { name: "Capital propio / presupuesto", score: input.budget > 0 ? Math.min(10, Math.round(input.ownCapital / input.budget * 40)) : 0 },
    { name: "Licencias", score: /concedid|aprobad|vigente/i.test(input.licenses) && !/\bno\b|pendiente|denegad|caducad|\bsin\b/i.test(input.licenses) ? 10 : 2 },
    { name: "LTV", score: input.ltv <= 50 ? 10 : input.ltv <= 65 ? 8 : input.ltv <= 75 ? 5 : 2 },
    { name: "Presupuesto definido", score: input.budget > 0 ? 8 : 0 },
    { name: "Reserva para sobrecostes", score: input.budget > 0 ? Math.min(10, Math.round(input.contingency / input.budget * 100)) : 0 },
    { name: "Garantía hipotecaria", score: input.mortgage ? 10 : 3 },
    { name: "Preventas", score: Math.min(10, Math.round(input.presales / 5)) },
    { name: "Estrategia de salida documentada", score: input.exitStrategy.length >= 20 ? 8 : 2 },
    { name: "Duración", score: input.duration <= 12 ? 10 : input.duration <= 18 ? 7 : input.duration <= 24 ? 5 : 2 },
  ];
  const score = factors.reduce((s, f) => s + f.score, 0);
  return { score, factors, suggestedRisk: score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D", automaticDecision: false };
}
export type MarketplaceFilters = { type?: string; status?: string; city?: string; maxDuration?: number; minRate?: number; risk?: string; minFunded?: number; maxMinimum?: number; mortgage?: boolean; sort?: string; search?: string };
export function filterProjects(projects: Project[], filters: MarketplaceFilters) {
  const result = projects.filter(p => (!filters.type || filters.type === "ALL" || p.type === filters.type) && (!filters.status || filters.status === "ALL" || p.status === filters.status) && (!filters.city || filters.city === "ALL" || p.city === filters.city) && (!filters.maxDuration || p.duration <= filters.maxDuration) && (!filters.minRate || p.annualRate >= filters.minRate) && (!filters.risk || filters.risk === "ALL" || p.risk === filters.risk) && (!filters.minFunded || fundingPercentage(p.funded, p.target) >= filters.minFunded) && (!filters.maxMinimum || p.minInvestment <= filters.maxMinimum) && (filters.mortgage === undefined || p.mortgage === filters.mortgage) && (!filters.search || `${p.name} ${p.city}`.toLowerCase().includes(filters.search.toLowerCase())));
  return result.sort((a, b) => filters.sort === "funding" ? fundingPercentage(b.funded, b.target) - fundingPercentage(a.funded, a.target) : filters.sort === "duration" ? a.duration - b.duration : filters.sort === "return" ? b.annualRate - a.annualRate : filters.sort === "risk" ? a.risk.localeCompare(b.risk) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
