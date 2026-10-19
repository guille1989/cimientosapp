"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Clock3, ShieldCheck } from "lucide-react";
import type { AppState, Commitment, Project } from "@/lib/types";

export const euro = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
export const date = (value: string) => new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
export const statusLabels: Record<string, string> = { REFLECTION: "En reflexión", CONFIRMED: "Confirmado", INVESTED: "En seguimiento", CANCELLED: "Cancelado", REFUNDED: "Cancelado y reembolsado", REPAID: "Devuelto", APPROVED: "Aprobado", PENDING: "Pendiente", REVIEW: "Requiere revisión", REVIEW_REQUIRED: "Requiere revisión", NEEDS_REVIEW: "Requiere revisión", DRAFT: "Borrador", IN_PROGRESS: "En ejecución", DELAYED: "Retrasado", RECOVERY: "En recuperación", FUNDING: "Financiando", FUNDED: "Financiado", COMING_SOON: "Próximamente", SCHEDULED: "Programada", PAID: "Abonada", COMMITMENT: "Compromiso", CANCELLATION: "Cancelación", REFUND: "Reembolso", DISTRIBUTION: "Distribución", CAPITAL_RETURN: "Devolución de capital", ADJUSTMENT: "Ajuste", INTEREST: "Rendimiento" };
Object.assign(statusLabels, { PLANNED: "Previsto", VALIDATION_REQUESTED: "Validación solicitada", DISBURSED: "Desembolsado", DISBURSEMENT: "Desembolso" });
export const label = (value: string) => statusLabels[value] || value.replaceAll("_", " ");
export const activeCommitments = (state: AppState) => state.commitments.filter(c => ["REFLECTION", "CONFIRMED", "INVESTED"].includes(c.status));
export const projectFor = (state: AppState, commitment: Commitment) => state.projects.find(p => p.id === commitment.projectId);
export const estimatedInterest = (amount: number, project?: Project) => project ? amount * project.annualRate / 100 * project.duration / 12 : 0;

export function InvestorNav() {
  const pathname = usePathname();
  return <nav aria-label="Área del inversor" className="account-nav">{[["/inversor", "Resumen"], ["/inversor/cartera", "Mi cartera"], ["/inversor/movimientos", "Movimientos"], ["/inversor/documentos", "Documentos"], ["/inversor/notificaciones", "Notificaciones"], ["/inversor/perfil", "Perfil"]].map(([href, name]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{name}</Link>)}</nav>;
}

export function AccountStatus({ status }: { status: string }) {
  return <span className={`account-status ${status === "APPROVED" ? "approved" : ""}`}>{status === "APPROVED" ? <ShieldCheck size={15}/> : <Clock3 size={15}/>} {label(status)}</span>;
}

export function AllocationChart({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return <section className="allocation panel"><h3>{title}</h3>{total ? <><div className="allocation-strip" aria-hidden="true">{Object.entries(data).map(([key, value], i) => <span key={key} style={{ width: `${value / total * 100}%`, background: ["#08171C", "#6F8B80", "#D5FF5F", "#F0A84B", "#BDCBC4", "#66757B"][i % 6] }}/>)}</div><ul>{Object.entries(data).map(([key, value], i) => <li key={key}><span><i style={{ background: ["#08171C", "#6F8B80", "#D5FF5F", "#F0A84B", "#BDCBC4", "#66757B"][i % 6] }}/>{key}</span><strong>{Math.round(value / total * 100)} %</strong><small>{euro(value)}</small></li>)}</ul></> : <p className="muted">La distribución aparecerá cuando tengas compromisos activos.</p>}</section>;
}

export function MovementIcon({ amount }: { amount: number }) {
  return amount >= 0 ? <ArrowUpRight size={18} aria-hidden="true"/> : <ArrowDownRight size={18} aria-hidden="true"/>;
}
