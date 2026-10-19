"use client";
import { useI18n } from "@/components/i18n-provider";
import Link from "next/link";
import { statusLabels } from "@/lib/status-labels";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowRight, Download, FileText, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { useApp } from "./app-provider";
import type { Milestone, ProjectDocument, RiskLevel, Role } from "@/lib/types";
import type { ButtonHTMLAttributes, ReactNode } from "react";
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <button className={`button button-${variant} ${className}`} {...props}/>; }
export function Badge({ children, className = "" }: {
    children: ReactNode;
    className?: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <span className={`badge ${className}`}>{_t(children)}</span>; }
export function Money({ value }: {
    value: number;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <>{_t(new Intl.NumberFormat(_locale === "en" ? "en-GB" : "es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value))}</>; }
export function Metric({ label, value, note }: {
    label: string;
    value: ReactNode;
    note?: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="metric"><p>{_t(label)}</p><strong>{_t(value)}</strong>{_t(note && <small>{_t(note)}</small>)}</div>; }
export function RiskBadge({ risk }: {
    risk: RiskLevel | string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <Badge className={`risk risk-${risk}`}>{_t("Riesgo ")}{_t(risk)}{_t(" \u00B7 ")}{_t(({ A: "moderado", B: "medio", C: "alto", D: "muy alto" } as Record<string, string>)[risk] || risk)}</Badge>; }
export function FundingBar({ funded, target }: {
    funded: number;
    target: number;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); const pct = Math.min(100, Math.max(0, target > 0 ? funded / target * 100 : 0)); return <div className="funding-track" role="progressbar" aria-label={_t("Porcentaje de financiaci\u00F3n")} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }}/></div>; }
export function EmptyState({ title, description, children }: {
    title: string;
    description?: string;
    children?: ReactNode;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="empty-state"><FileText size={28} strokeWidth={1.3}/><h3>{_t(title)}</h3>{_t(description && <p>{_t(description)}</p>)}{_t(children)}</div>; }
export function RiskWarning() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <aside className="risk-warning"><AlertTriangle size={19} aria-hidden="true"/><p>{_t("La rentabilidad objetivo no est\u00E1 garantizada. Puedes perder parte o todo el capital. La inversi\u00F3n es il\u00EDquida y no est\u00E1 cubierta por un fondo de garant\u00EDa de dep\u00F3sitos. ")}<Link href="/riesgos">{_t("Conoce los riesgos ")}<ArrowRight size={12}/></Link></p></aside>; }
export function PageHeading({ eyebrow, title, description, children }: {
    eyebrow?: string;
    title: string;
    description?: string;
    children?: ReactNode;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="page-heading"><div>{_t(eyebrow && <p className="eyebrow">{_t(eyebrow)}</p>)}<h1>{_t(title)}</h1>{_t(description && <p className="lead">{_t(description)}</p>)}</div>{_t(children && <div className="heading-actions">{_t(children)}</div>)}</div>; }
export function LoadingState() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="loading-state" role="status"><LoaderCircle className="spin" size={22}/><span>{_t("Cargando Cimiento\u2026")}</span><div className="skeleton"/><div className="skeleton short"/></div>; }
export function ErrorMessage({ message }: {
    message: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return message ? <div className="notice notice-error" role="alert"><AlertTriangle size={18}/>{_t(message)}</div> : null; }
export function DocumentList({ documents }: {
    documents: ProjectDocument[];
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="document-list">{_t(documents.length ? documents.map(d => <a className="document-row" key={d.id} href={`/api/documents/${d.id}`} download><FileText size={21}/><span><strong>{_t(d.name)}</strong><small>{_t(d.category)}{_t(" \u00B7 Documento ficticio")}</small></span><Download size={18}/><span className="sr-only">{_t("Descargar")}</span></a>) : <EmptyState title={_t("Sin documentos publicados")} description={_t("Los documentos aparecer\u00E1n despu\u00E9s de su revisi\u00F3n.")}/>)}</div>; }
export function Timeline({ milestones }: {
    milestones: Milestone[];
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <ol className="timeline">{_t(milestones.map(m => <li key={m.id} className={m.approved ? "complete" : ""}><span className="timeline-node"/><div><small>{_t(new Date(m.expectedDate).toLocaleDateString(_locale === "en" ? "en-GB" : "es-ES", { timeZone: "Europe/Madrid" }))}</small><h3>{_t(m.name)}</h3><p>{_t(m.description)}</p><Badge>{_t(m.approved ? "Validado · certificación simulada" : m.status === "PENDING_APPROVAL" ? "Pendiente de validación" : "Previsto")}</Badge><span className="timeline-amount"><Money value={m.amount}/></span></div></li>))}</ol>; }
export function Modal({ open, onOpenChange, title, children }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal-content" aria-describedby={undefined}><Dialog.Title className="modal-title">{_t(title)}</Dialog.Title><Dialog.Close className="modal-close" aria-label={_t("Cerrar ventana")}><X size={21}/></Dialog.Close>{_t(children)}</Dialog.Content></Dialog.Portal></Dialog.Root>; }
export function RoleGate({ role, children }: {
    role: Role;
    children: ReactNode;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); const { state, loading, error, refresh } = useApp(); if (loading)
    return <LoadingState />; if (error)
    return <EmptyState title={_t("No se pudieron cargar los datos")} description={_t(error)}><Button onClick={() => void refresh()}>{_t("Reintentar")}</Button></EmptyState>; if (!state?.user)
    return <div className="access-state"><LockKeyhole size={36}/><h1>{_t("Tu espacio en Cimiento")}</h1><p>{_t("Inicia sesi\u00F3n con una cuenta de demostraci\u00F3n para continuar.")}</p><Link className="button button-primary" href="/acceso">{_t("Iniciar sesi\u00F3n ")}<ArrowRight size={17}/></Link></div>; if (state.user.role !== role)
    return <div className="access-state"><LockKeyhole size={36}/><h1>{_t("Acceso restringido")}</h1><p>{_t("Esta secci\u00F3n requiere el rol de ")}{_t(role === "ADMIN" ? "administrador" : role === "PROMOTER" ? "promotor" : "inversor")}{_t(".")}</p><Link className="button button-primary" href={state.user.role === "ADMIN" ? "/admin" : state.user.role === "PROMOTER" ? "/promotor" : "/inversor"}>{_t("Ir a mi panel")}</Link></div>; return <>{_t(children)}</>; }
export { statusLabels } from "@/lib/status-labels";
export function StatusBadge({ status }: {
    status: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <Badge className={`status-${status.toLowerCase()}`}>{_t(statusLabels[status] || status)}</Badge>; }
