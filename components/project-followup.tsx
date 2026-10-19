"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CircleHelp } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { useI18n } from "@/components/i18n-provider";
import { statusLabels } from "@/components/investor-shared";
import type { Project } from "@/lib/types";

export function ProjectFollowup({ project, statusLabel, onSectionChange }: {
  project: Project;
  statusLabel: string;
  onSectionChange: (tab: number) => void;
}) {
  const { state } = useApp();
  const { t, locale, formatMoney, formatDate } = useI18n();
  const own = state?.user?.role === "INVESTOR"
    ? state.commitments.filter(c => c.projectId === project.id && c.userId === state.user!.id)
    : [];
  const positions = own.filter(c => ["REFLECTION", "CONFIRMED", "INVESTED", "REPAID"].includes(c.status));
  const active = positions.filter(c => c.status !== "REPAID");
  const nextMilestone = [...project.milestones]
    .filter(m => !m.approved)
    .sort((a, b) => Date.parse(a.expectedDate) - Date.parse(b.expectedDate))[0];
  const latestUpdate = [...project.updates].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const ended = ["REPAID", "CANCELLED"].includes(project.status);
  const future = ["COMING_SOON", "PUBLISHED", "APPROVED", "DRAFT", "SUBMITTED", "ANALYSIS", "INFO_REQUIRED"].includes(project.status);
  const warning = project.status === "RECOVERY"
    ? "La devolución es incierta. Consulta las incidencias y las actualizaciones del proyecto."
    : project.status === "DELAYED"
      ? "El calendario ha cambiado. Las fechas de devolución pueden retrasarse."
      : "";
  const explanation = project.status === "CANCELLED"
    ? "Proyecto cancelado. Consulta el estado de tus compromisos y los reembolsos ficticios en tu cartera."
    : project.status === "REPAID"
      ? "Proyecto devuelto. Puedes consultar su historial y las distribuciones ficticias."
      : future
        ? "Este proyecto todavía no admite inversiones. El calendario y los avances se actualizarán cuando corresponda."
        : "La financiación está cerrada. Consulta el avance de obra y la evolución de la operación.";

  return <section className="cm-followup" aria-label={t("Seguimiento del proyecto")}>
    <div className="cm-summary-top"><span>{t("Seguimiento de obra")}</span><span>{t("Ficticio")}</span></div>
    <h2>{t("La evolución del proyecto")}</h2>
    <dl className="cm-followup-data"><div><dt>{t("Estado del proyecto")}</dt><dd>{t(statusLabel)}</dd></div></dl>
    <p className="cm-followup-copy">{t(explanation)}</p>
    {warning && <p className="cm-followup-warning"><CircleHelp size={18} aria-hidden="true"/>{t(warning)}</p>}

    {own.length > 0 && <section className="cm-followup-position" aria-label={t("Tu posición en este proyecto")}>
      <h3>{t("Tu posición")}</h3>
      {positions.length ? <>
        <dl className="cm-followup-data">
          <div><dt>{t("Capital comprometido activo")}</dt><dd>{formatMoney(active.reduce((sum, c) => sum + c.amount, 0))}</dd></div>
          <div><dt>{t("Capital pendiente de devolución")}</dt><dd>{formatMoney(positions.filter(c => c.status === "INVESTED").reduce((sum, c) => sum + Math.max(0, c.amount - c.capitalReturned), 0))}</dd></div>
          <div><dt>{t("Capital devuelto")}</dt><dd>{formatMoney(positions.reduce((sum, c) => sum + c.capitalReturned, 0))}</dd></div>
          <div><dt>{t("Intereses recibidos")}</dt><dd>{formatMoney(positions.reduce((sum, c) => sum + c.interestReceived, 0))}</dd></div>
        </dl>
        <ul className="cm-followup-commitments" aria-label={t("Estado de tus compromisos")}>{positions.map(c => <li key={c.id}><span>{t(statusLabels[c.status])}</span><strong>{formatMoney(c.amount)}</strong></li>)}</ul>
        <p className="cm-followup-note">{t("El capital pendiente de devolución incluye solo participaciones en seguimiento. Las reservas en reflexión o confirmadas aún no se cuentan como capital invertido.")}</p>
        <dl className="cm-followup-data"><div><dt>{t("Tipo anual objetivo, no garantizado")}</dt><dd>{project.annualRate.toLocaleString(locale === "en" ? "en-GB" : "es-ES")}%</dd></div></dl>
      </> : <p className="cm-followup-copy">{t("No tienes compromisos activos en este proyecto. Los cancelados o reembolsados se conservan en el historial de tu cartera.")}</p>}
      {own.length > positions.length && positions.length > 0 && <p className="cm-followup-note">{t("Los compromisos cancelados o reembolsados se muestran por separado en tu cartera y no se suman a tu posición activa.")}</p>}
      <Link className="cm-text-link" href="/inversor/cartera">{t("Ver mi cartera")} <ArrowRight size={16}/></Link>
    </section>}

    <section className="cm-followup-construction" aria-label={t("Avance de obra")}>
      <div className="cm-followup-progress-label"><h3>{t("Progreso de obra declarado")}</h3><strong>{project.progress}%</strong></div>
      <progress aria-label={t("Progreso de obra declarado")} value={project.progress} max={100}/>
      {!ended && <div className="cm-followup-next"><CalendarDays size={18} aria-hidden="true"/><div><h3>{t("Próximo hito")}</h3>{nextMilestone ? <><strong>{t(nextMilestone.name)}</strong><p>{t("Fecha prevista")}: {formatDate(nextMilestone.expectedDate)}</p></> : <p>{t("Todavía no hay hitos pendientes definidos.")}</p>}</div></div>}
      <button type="button" className="cm-text-link" onClick={() => onSectionChange(2)}>{t("Ver calendario e hitos")} <ArrowRight size={16}/></button>
    </section>

    <section className="cm-followup-update" aria-label={t("Última actualización")}>
      <h3>{t("Última actualización")}</h3>
      {latestUpdate ? <><p className="cm-followup-note">{formatDate(latestUpdate.createdAt)}</p><strong>{t(latestUpdate.title)}</strong><p className="cm-followup-copy">{t(latestUpdate.content)}</p></> : <p className="cm-followup-copy">{t("Aún no se han publicado actualizaciones.")}</p>}
      <button type="button" className="cm-text-link" onClick={() => onSectionChange(4)}>{t("Ver actualizaciones")} <ArrowRight size={16}/></button>
    </section>
    <p className="cm-followup-note">{t("Todos los importes, avances y movimientos son ficticios. Los plazos y la recuperación del capital no están garantizados.")}</p>
  </section>;
}
