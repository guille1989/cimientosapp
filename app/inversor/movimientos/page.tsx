"use client";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import { Download } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { EmptyState, LoadingState, PageHeading } from "@/components/ui";
import { date, euro, label } from "@/components/investor-shared";
export default function TransactionsPage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading } = useApp();
    const [type, setType] = useState("");
    const [project, setProject] = useState("");
    const [from, setFrom] = useState("");
    if (loading || !state)
        return <LoadingState />;
    const transactions = state.transactions.filter(t => (!type || t.type === type) && (!project || t.projectId === project) && (!from || t.createdAt.slice(0, 10) >= from));
    const types = [...new Set(state.transactions.map(t => t.type))];
    return <><PageHeading eyebrow={_t("INVERSOR")} title={_t("Movimientos")} description={_t("La trazabilidad de cada compromiso, cancelaci\u00F3n y distribuci\u00F3n ficticia.")}><a className="button secondary" href={`/api/export?type=${encodeURIComponent(type)}&projectId=${encodeURIComponent(project)}&from=${from}`} download><Download size={17}/>{_t("Exportar CSV de demostraci\u00F3n")}</a></PageHeading><div className="notice">{_t("Libro de movimientos de demostraci\u00F3n. Los fondos se muestran administrados por una entidad de pagos externa simulada. Saldo real: no disponible.")}</div><div className="account-toolbar transaction-filters"><label className="field">{_t("Tipo de movimiento")}<select value={type} onChange={e => setType(e.target.value)}><option value="">{_t("Todos")}</option>{_t(types.map(t => <option key={t} value={t}>{_t(label(t))}</option>))}</select></label><label className="field">{_t("Proyecto")}<select value={project} onChange={e => setProject(e.target.value)}><option value="">{_t("Todos los proyectos")}</option>{_t(state.projects.filter(p => state.transactions.some(t => t.projectId === p.id)).map(p => <option key={p.id} value={p.id}>{_t(p.name)}</option>))}</select></label><label className="field">{_t("Desde")}<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><button type="button" className="text-button" onClick={() => { setType(""); setProject(""); setFrom(""); }}>{_t("Limpiar filtros")}</button></div>{_t(transactions.length ? <div className="table-wrap panel"><table><thead><tr><th>{_t("Fecha")}</th><th>{_t("Tipo")}</th><th>{_t("Concepto / proyecto")}</th><th>{_t("Referencia")}</th><th className="number-cell">{_t("Importe ficticio")}</th></tr></thead><tbody>{_t(transactions.map(t => <tr key={t.id}><td>{_t(_date(t.createdAt))}</td><td><span className="account-status">{_t(label(t.type))}</span></td><td><strong>{_t(t.description)}</strong><small>{_t(state.projects.find(p => p.id === t.projectId)?.name || "Cuenta de demostración")}</small></td><td><code>{_t(t.id.slice(0, 12).toUpperCase())}</code></td><td className="number-cell">{_t(_money(t.amount))}</td></tr>))}</tbody></table></div> : <EmptyState title={_t("No hay movimientos con estos filtros")} description={_t("Tus operaciones aparecer\u00E1n aqu\u00ED despu\u00E9s de realizar un compromiso ficticio o recibir una distribuci\u00F3n.")}/>)}<p className="muted small">{_t(transactions.length)}{_t(" movimientos mostrados. Exportaci\u00F3n identificada como ficticia y limitada a tu cuenta.")}</p></>;
}
