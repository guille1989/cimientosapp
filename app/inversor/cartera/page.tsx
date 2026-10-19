"use client";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, LayoutGrid, List, Download } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button, EmptyState, LoadingState, Modal, PageHeading } from "@/components/ui";
import { date, euro, label } from "@/components/investor-shared";
import type { Commitment } from "@/lib/types";
export default function PortfolioPage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, act } = useApp();
    const [view, setView] = useState<"table" | "cards">("table");
    const [filter, setFilter] = useState("");
    const [cancel, setCancel] = useState<Commitment | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    if (loading || !state)
        return <LoadingState />;
    const items = state.commitments.filter(c => !filter || c.status === filter);
    async function cancelInvestment() { if (!cancel)
        return; setBusy(true); setError(""); try {
        const result = await act("cancelCommitment", { id: cancel.id });
        if (!result.ok)
            setError(result.message);
        else {
            setMessage(result.message || "Compromiso cancelado y reembolso ficticio registrado.");
            setCancel(null);
        }
    }
    catch {
        setError("No se ha podido cancelar. Vuelve a intentarlo.");
    }
    finally {
        setBusy(false);
    } }
    const canCancel = (c: Commitment) => c.status === "REFLECTION" && new Date(c.reflectionEndsAt).getTime() > Date.now();
    return <><PageHeading eyebrow={_t("INVERSOR")} title={_t("Mi cartera")} description={_t("Cada proyecto, su estado y sus pr\u00F3ximos pasos.")}><Link className="button" href="/proyectos">{_t("Explorar proyectos ")}<ArrowRight size={16}/></Link></PageHeading><div className="notice"><Clock3 size={18}/><span>{_t("Los compromisos en reflexi\u00F3n se pueden cancelar hasta la fecha indicada. La devoluci\u00F3n y todos los movimientos son ficticios.")}</span></div><div className="account-toolbar"><label className="field">{_t("Estado")}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">{_t("Todos los estados")}</option>{_t(["REFLECTION", "CONFIRMED", "INVESTED", "REPAID", "CANCELLED", "REFUNDED"].map(s => <option value={s} key={s}>{_t(label(s))}</option>))}</select></label><span>{_t(items.length)}{_t(" operaciones")}</span><div className="view-toggle" aria-label={_t("Vista de cartera")}><button type="button" aria-label={_t("Vista de tabla")} aria-pressed={view === "table"} onClick={() => setView("table")}><List size={19}/></button><button type="button" aria-label={_t("Vista de tarjetas")} aria-pressed={view === "cards"} onClick={() => setView("cards")}><LayoutGrid size={18}/></button></div></div>{_t(message && <p className="notice success" role="status">{_t(message)}</p>)}{_t(error && !cancel && <p className="notice error" role="alert">{_t(error)}</p>)}
    {_t(!items.length ? <EmptyState title={_t(state.commitments.length ? "No hay operaciones con este estado" : "Tu cartera está por construir")} description={_t(state.commitments.length ? "Prueba con otro filtro para ver tus compromisos." : "Conoce los proyectos, revisa su documentación y simula una inversión desde 100 €.")}><Link className="button secondary" href="/proyectos">{_t("Explorar proyectos")}</Link></EmptyState> : view === "table" ? <div className="panel table-wrap portfolio-table"><table><thead><tr><th>{_t("Proyecto")}</th><th>{_t("Compromiso")}</th><th>{_t("Estado")}</th><th>{_t("Obra / plazo")}</th><th>{_t("Objetivo anual")}</th><th>{_t("Capital devuelto")}</th><th>{_t("Intereses")}</th><th>{_t("Acciones")}</th></tr></thead><tbody>{_t(items.map(c => { const p = state.projects.find(p => p.id === c.projectId); return <tr key={c.id}><td><Link className="table-project" href={`/proyectos/${p?.slug || c.projectId}`}>{_t(p?.name || "Proyecto")}<ArrowRight size={14}/></Link><small>{_t(p?.city)}{_t(" \u00B7 ")}{_t(_date(c.createdAt))}</small>{_t(p && ["DELAYED", "RECOVERY"].includes(p.status) && <span className="account-status warning">{_t(label(p.status))}</span>)}</td><td><strong>{_t(_money(c.amount))}</strong></td><td><span className={`account-status ${c.status === "REFLECTION" ? "reflection" : ""}`}>{_t(label(c.status))}</span>{_t(canCancel(c) && <small>{_t("Hasta ")}{_t(new Date(c.reflectionEndsAt).toLocaleString(_locale === "en" ? "en-GB" : "es-ES", { timeZone: "Europe/Madrid" }))}</small>)}</td><td><div className="mini-progress" role="progressbar" aria-label={_t(_t("Progreso de obra {value0}", { value0: p?.name }))} aria-valuenow={p?.progress || 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${p?.progress || 0}%` }}/></div><small>{_t(p?.progress || 0)}{_t(" % \u00B7 ")}{_t(p?.duration || 0)}{_t(" meses")}</small></td><td>{_t(p?.annualRate || 0)}{_t(" %")}<small>{_t("No garantizado")}</small></td><td>{_t(_money(c.capitalReturned))}</td><td>{_t(_money(c.interestReceived))}</td><td><div className="table-actions"><a href={`/api/documents/contract-${c.id}`} target="_blank" rel="noreferrer" aria-label={_t(_t("Descargar contrato ficticio de {value0}", { value0: p?.name }))}><Download size={16}/>{_t(" Contrato")}</a>{_t(canCancel(c) && <Button type="button" variant="ghost" onClick={() => { setCancel(c); setError(""); }}>{_t("Cancelar")}</Button>)}</div></td></tr>; }))}</tbody></table></div> : <div className="portfolio-cards">{_t(items.map(c => { const p = state.projects.find(p => p.id === c.projectId); return <article className="panel portfolio-card" key={c.id}><div className="portfolio-image" style={{ backgroundImage: `url(${p?.image})` }}><span className="account-status">{_t(label(c.status))}</span></div><div className="portfolio-card-body"><span className="eyebrow">{_t(p?.city)}{_t(" \u00B7 DEUDA")}</span><h2><Link href={`/proyectos/${p?.slug || c.projectId}`}>{_t(p?.name)}</Link></h2><dl><div><dt>{_t("Comprometido")}</dt><dd>{_t(_money(c.amount))}</dd></div><div><dt>{_t("Plazo / objetivo anual")}</dt><dd>{_t(p?.duration)}{_t(" meses / ")}{_t(p?.annualRate)}{_t(" %")}</dd></div><div><dt>{_t("Capital devuelto")}</dt><dd>{_t(_money(c.capitalReturned))}</dd></div><div><dt>{_t("Rendimiento recibido")}</dt><dd>{_t(_money(c.interestReceived))}</dd></div><div><dt>{_t("Pr\u00F3xima actualizaci\u00F3n")}</dt><dd>{_t(p?.milestones.find(m => !m.approved)?.expectedDate ? _date(p.milestones.find(m => !m.approved)!.expectedDate) : "Pendiente de planificación")}</dd></div></dl><label>{_t("Progreso de obra \u00B7 ")}{_t(p?.progress || 0)}{_t(" %")}<progress value={p?.progress || 0} max={100}/></label>{_t(canCancel(c) && <><p className="small"><Clock3 size={13}/>{_t(" Reflexi\u00F3n hasta ")}{_t(new Date(c.reflectionEndsAt).toLocaleString(_locale === "en" ? "en-GB" : "es-ES", { timeZone: "Europe/Madrid" }))}</p><Button type="button" variant="secondary" onClick={() => { setCancel(c); setError(""); }}>{_t("Cancelar compromiso")}</Button></>)}<p className="risk-footnote">{_t("Rentabilidad objetivo no garantizada.")}</p></div></article>; }))}</div>)}
    <Modal open={!!cancel} onOpenChange={open => { if (!busy && !open)
        setCancel(null); }} title={_t("Cancelar durante la reflexi\u00F3n")}><p>{_t("Vas a cancelar tu compromiso ficticio de ")}<strong>{_t(_money(cancel?.amount || 0))}</strong>{_t(".")}</p><p>{_t("El capital dejar\u00E1 de estar comprometido y se registrar\u00E1 un reembolso ficticio. No se mueve dinero real.")}</p>{_t(error && <p className="notice error" role="alert">{_t(error)}</p>)}<div className="button-row"><Button type="button" variant="secondary" onClick={() => setCancel(null)} disabled={busy}>{_t("Mantener compromiso")}</Button><Button type="button" variant="danger" onClick={() => void cancelInvestment()} disabled={busy}>{_t(busy ? "Cancelando…" : "Confirmar cancelación")}</Button></div></Modal></>;
}
