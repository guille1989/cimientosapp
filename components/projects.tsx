"use client";
import { useI18n } from "@/components/i18n-provider";
import { pluralMessage } from "@/lib/i18n";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, FileText, Grid2X2, List, MapPin, Search, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { InvestmentFlow } from "@/components/investment-flow";
import { ProjectFollowup } from "@/components/project-followup";
import { Modal } from "@/components/ui";
import { filterProjects, fundingPercentage, isProjectOpenForInvestment, PUBLIC_STATUSES } from "@/lib/domain";
import type { Project, ProjectDocument, ProjectStatus } from "@/lib/types";
import "./public.css";
export const projectStatusLabels: Record<ProjectStatus, string> = { DRAFT: "Borrador", SUBMITTED: "Solicitud recibida", ANALYSIS: "En análisis", INFO_REQUIRED: "Información pendiente", APPROVED: "Aprobado", PUBLISHED: "Publicado", FUNDING: "Abierto a inversión", FUNDED: "Financiado", IN_PROGRESS: "En ejecución", REPAID: "Devuelto", DELAYED: "Retrasado", RECOVERY: "En recuperación", CANCELLED: "Cancelado", COMING_SOON: "Próximamente" };
const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const percent = (project: Project) => fundingPercentage(project.funded, project.target);
const types = { DEBT: "Préstamo inmobiliario", EQUITY: "Equity · próximamente", RENTAL: "Rentas · próximamente" };
export function PublicLoading() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="cm-wrap cm-loading" role="status" aria-label={_t("Cargando proyectos")}><div className="cm-skeleton cm-skeleton-title"/><div className="cm-project-grid">{_t([1, 2, 3].map(i => <div className="cm-skeleton cm-skeleton-card" key={i}/>))}</div><span>{_t("Cargando proyectos de demostraci\u00F3n\u2026")}</span></div>; }
export function PublicError({ message, onRetry }: {
    message: string;
    onRetry: () => void;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="cm-wrap cm-empty" role="alert"><CircleHelp size={32}/><h2>{_t("No hemos podido cargar los proyectos.")}</h2><p>{_t(message)}</p><button className="cm-button" onClick={onRetry}>{_t("Volver a intentarlo")}</button></div>; }
export function ProjectCard({ project, list = false }: {
    project: Project;
    list?: boolean;
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    if (project.type !== "DEBT")
        return <article className={`cm-project-card cm-project-future ${list ? "cm-project-card-list" : ""}`}><Link href={`/proyectos/${project.slug}`} className="cm-project-image" aria-label={_t(_t("Ver {value0}", { value0: project.name }))}><img src={project.image || "/assets/cimiento-hero.png"} alt={_t("Representaci\u00F3n arquitect\u00F3nica ilustrativa de un producto futuro")} loading="lazy"/><span className="cm-status cm-status-coming_soon"><i />{_t("Pr\u00F3ximamente")}</span><span className="cm-image-note">{_t("Concepto ficticio")}</span></Link><div className="cm-project-body"><div className="cm-project-location"><MapPin size={13}/>{_t(project.city)}<span>{_t(project.type === "EQUITY" ? "Equity" : "Rentas")}{_t(" \u00B7 Fase futura")}</span></div><Link href={`/proyectos/${project.slug}`} className="cm-project-title"><h3>{_t(project.name)}</h3><ArrowUpRight size={20}/></Link><p className="cm-future-description">{_t(project.type === "EQUITY" ? "Participación en el capital de proyectos inmobiliarios." : "Proyectos orientados al arrendamiento inmobiliario.")}{_t(" Una l\u00EDnea futura de Cimiento.")}</p><div className="cm-future-details"><Building2 size={21}/><div><strong>{_t("Producto en desarrollo")}</strong><p>{_t("No admite compromisos. Sin condiciones de inversi\u00F3n publicadas.")}</p></div></div><div className="cm-project-bottom"><span>{_t("Hoja de ruta \u00B7 Demostraci\u00F3n")}</span><Link href={`/proyectos/${project.slug}`}>{_t("Conocer el concepto ")}<ArrowRight size={15}/></Link></div></div></article>;
    return <article className={`cm-project-card ${list ? "cm-project-card-list" : ""}`}>
    <Link href={`/proyectos/${project.slug}`} className="cm-project-image" aria-label={_t(_t("Ver {value0}", { value0: project.name }))}><img src={project.image || "/assets/cimiento-hero.png"} alt={_t(_t("Representaci\u00F3n arquitect\u00F3nica ficticia de {value0}", { value0: project.name }))} loading="lazy"/><span className={`cm-status cm-status-${project.status.toLowerCase()}`}><i />{_t(projectStatusLabels[project.status])}</span><span className="cm-image-note">{_t("Proyecto ficticio")}</span></Link>
    <div className="cm-project-body"><div className="cm-project-location"><MapPin size={13}/>{_t(project.city)}<span>{_t("Deuda inmobiliaria")}</span></div><Link href={`/proyectos/${project.slug}`} className="cm-project-title"><h3>{_t(project.name)}</h3><ArrowUpRight size={20}/></Link><p className="cm-project-promoter">{_t(project.promoterName)}{_t(" \u00B7 Promotor ficticio")}</p>
      <div className="cm-project-numbers"><div><strong>{_t(project.annualRate.toLocaleString(_locale === "en" ? "en-GB" : "es-ES"))}{_t("%")}</strong><span>{_t("Tipo anual objetivo*")}</span></div><div><strong>{_t(project.duration)} <small>{_t("meses")}</small></strong><span>{_t("Plazo estimado")}</span></div><div><strong className="cm-risk-letter">{_t(project.risk)}</strong><span>{_t("Nivel de riesgo")}</span></div></div>
      <div className="cm-funding-label"><strong>{_t(_money(project.funded))}</strong><span>{_t(percent(project).toFixed(0))}{_t("% financiado")}</span></div><div className="cm-funding-track" role="progressbar" aria-label={_t("Porcentaje financiado")} aria-valuenow={Math.round(percent(project))} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent(project)}%` }}/></div><div className="cm-funding-bottom"><span>{_t("Objetivo ")}{_t(_money(project.target))}</span><span>{_t("Desde ")}{_t(_money(project.minInvestment))}</span></div>
      <div className="cm-project-bottom"><span><ShieldCheck size={14}/>{_t(project.mortgage ? "Garantía hipotecaria" : "Sin garantía hipotecaria")}</span><Link href={`/proyectos/${project.slug}`}>{_t("Ver proyecto ")}<ArrowRight size={15}/></Link></div>
    </div>
  </article>;
}
type Filters = {
    search: string;
    type: string;
    status: string;
    city: string;
    duration: string;
    rate: string;
    risk: string;
    funded: string;
    minimum: string;
    mortgage: string;
};
const initialFilters: Filters = { search: "", type: "", status: "", city: "", duration: "", rate: "", risk: "", funded: "", minimum: "", mortgage: "" };
export function Marketplace() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, error, refresh } = useApp();
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [sort, setSort] = useState("recent");
    const [view, setView] = useState("grid");
    const [showFilters, setShowFilters] = useState(false);
    const projects = (state?.projects || []).filter(p => PUBLIC_STATUSES.includes(p.status));
    const cities = [...new Set(projects.map(p => p.city))].sort();
    const filtered = useMemo(() => filterProjects(projects, { search: filters.search, type: filters.type, status: filters.status, city: filters.city, maxDuration: Number(filters.duration) || undefined, minRate: Number(filters.rate) || undefined, risk: filters.risk, minFunded: Number(filters.funded) || undefined, maxMinimum: Number(filters.minimum) || undefined, mortgage: filters.mortgage ? filters.mortgage === "yes" : undefined, sort: sort === "funded" ? "funding" : sort === "rate" ? "return" : sort }), [projects, filters, sort]);
    const filterCount = Object.values(filters).filter(Boolean).length;
    const change = (field: keyof Filters, value: string) => setFilters(prev => ({ ...prev, [field]: value }));
    if (loading)
        return <PublicLoading />;
    if (error)
        return <PublicError message={_t(error)} onRetry={refresh}/>;
    return <div className="cm-market cm-wrap"><header className="cm-page-heading"><div className="cm-eyebrow">{_t("Elige d\u00F3nde participar")}</div><h1>{_t("Proyectos con")}<br /><em>{_t("los planos abiertos.")}</em></h1><p>{_t("Conoce cada operaci\u00F3n antes de decidir. Documentaci\u00F3n, cifras y seguimiento en un mismo lugar.")}</p><div className="cm-market-summary"><span><i />{pluralMessage(_locale, projects.filter(p => p.status === "FUNDING").length, "{count} proyecto abierto", "{count} proyectos abiertos")}</span><span>{_t("Desde 100 \u20AC")}</span><span>{_t("Operaciones ficticias en Espa\u00F1a")}</span></div></header>
    <div className="cm-market-toolbar"><label className="cm-search"><Search size={18}/><span className="sr-only">{_t("Buscar proyectos")}</span><input value={filters.search} onChange={e => change("search", e.target.value)} placeholder={_t("Buscar proyecto o ciudad")}/></label><button className={`cm-button cm-button-outline ${showFilters ? "cm-active" : ""}`} aria-expanded={showFilters} aria-controls="project-filters" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17}/>{_t("Filtros")}{_t(filterCount > 0 && <b className="cm-count">{_t(filterCount)}</b>)}</button><label className="cm-sort"><span className="sr-only">{_t("Ordenar proyectos")}</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">{_t("M\u00E1s recientes")}</option><option value="funded">{_t("Mayor financiaci\u00F3n")}</option><option value="duration">{_t("Menor duraci\u00F3n")}</option><option value="rate">{_t("Mayor tipo objetivo")}</option><option value="risk">{_t("Menor riesgo")}</option></select></label><div className="cm-view-switch" aria-label={_t("Vista de resultados")}><button aria-label={_t("Vista de tarjetas")} aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={19}/></button><button aria-label={_t("Vista de lista")} aria-pressed={view === "list"} onClick={() => setView("list")}><List size={20}/></button></div></div>
    {_t(showFilters && <div className="cm-filter-panel" id="project-filters"><Filter label={_t("Tipo de operaci\u00F3n")} value={filters.type} onChange={v => change("type", v)} options={[["DEBT", "Deuda inmobiliaria"], ["EQUITY", "Equity · próximamente"], ["RENTAL", "Rentas · próximamente"]]}/><Filter label={_t("Estado")} value={filters.status} onChange={v => change("status", v)} options={Array.from(new Set(projects.map(p => p.status))).map(s => [s, projectStatusLabels[s]])}/><Filter label={_t("Ubicaci\u00F3n")} value={filters.city} onChange={v => change("city", v)} options={cities.map(c => [c, c])}/><Filter label={_t("Plazo m\u00E1ximo")} value={filters.duration} onChange={v => change("duration", v)} options={[["12", "12 meses"], ["18", "18 meses"], ["24", "24 meses"], ["36", "36 meses"]]}/><Filter label={_t("Tipo objetivo m\u00EDnimo")} value={filters.rate} onChange={v => change("rate", v)} options={[["7", "7% anual"], ["9", "9% anual"], ["10", "10% anual"]]}/><Filter label={_t("Nivel de riesgo")} value={filters.risk} onChange={v => change("risk", v)} options={[["A", "A · relativo menor"], ["B", "B · moderado"], ["C", "C · elevado"], ["D", "D · muy elevado"]]}/><Filter label={_t("Financiaci\u00F3n m\u00EDnima")} value={filters.funded} onChange={v => change("funded", v)} options={[["25", "25%"], ["50", "50%"], ["75", "75%"], ["100", "100%"]]}/><Filter label={_t("Inversi\u00F3n m\u00EDnima hasta")} value={filters.minimum} onChange={v => change("minimum", v)} options={[["100", "100 €"], ["500", "500 €"], ["1000", "1.000 €"]]}/><Filter label={_t("Garant\u00EDa hipotecaria")} value={filters.mortgage} onChange={v => change("mortgage", v)} options={[["yes", "Con garantía"], ["no", "Sin garantía"]]}/><button className="cm-clear-filters" onClick={() => setFilters(initialFilters)}><X size={14}/>{_t("Restablecer filtros")}</button></div>)}
    <div className="cm-results-label" role="status" aria-live="polite"><strong>{_t(filtered.length)} {_t(filtered.length === 1 ? "proyecto" : "proyectos")}</strong><span>{_t("Informaci\u00F3n ilustrativa \u00B7 Rentabilidad no garantizada")}</span></div>
    {_t(filters.type && filters.type !== "DEBT" && <div className="cm-notice"><Building2 size={20}/><div><strong>{_t(filters.type === "EQUITY" ? "Equity" : "Proyectos de rentas")}{_t(" \u00B7 Pr\u00F3ximamente")}</strong><p>{_t("Este producto pertenece a una fase posterior. En esta demostraci\u00F3n solo se ofrecen pr\u00E9stamos inmobiliarios ficticios.")}</p></div></div>)}
    {_t(filtered.length ? <div className={view === "list" ? "cm-project-list" : "cm-project-grid"}>{_t(filtered.map(project => <ProjectCard project={project} key={project.id} list={view === "list"}/>))}</div> : <div className="cm-empty"><Search size={30}/><h2>{_t("No hay proyectos con estos criterios.")}</h2><p>{_t("Prueba otra ubicaci\u00F3n o ampl\u00EDa los filtros para explorar las operaciones ficticias.")}</p><button className="cm-button" onClick={() => setFilters(initialFilters)}>{_t("Ver todos los proyectos")}</button></div>)}
    <p className="cm-fineprint">{_t("* El tipo objetivo es una estimaci\u00F3n bruta anual, antes de impuestos, sujeta a la ejecuci\u00F3n del proyecto. Existe riesgo de perder parte o todo el capital y de retrasos. Las garant\u00EDas no evitan la posibilidad de p\u00E9rdida.")}</p><div className="cm-market-cta"><div><h2>{_t("Antes de invertir,")}<br />{_t("conoce el recorrido.")}</h2><p>{_t("Entiende los hitos, los flujos y los riesgos de cada operaci\u00F3n.")}</p></div><Link href="/como-funciona" className="cm-button cm-button-light">{_t("As\u00ED funciona Cimiento ")}<ArrowUpRight size={17}/></Link></div>
  </div>;
}
function Filter({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[][];
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <label className="cm-filter"><span>{_t(label)}</span><select value={value} onChange={e => onChange(e.target.value)}><option value="">{_t("Todos")}</option>{_t(options.map(([v, text]) => <option value={v} key={v}>{_t(text)}</option>))}</select></label>; }
const detailTabs = ["Resumen", "Datos financieros", "Calendario e hitos", "Documentos", "Actualizaciones", "Promotor y riesgos", "Preguntas"];
export function ProjectDetail({ slug }: {
    slug: string;
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, error, refresh } = useApp();
    const [tab, setTab] = useState(0);
    const [gallery, setGallery] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    if (loading)
        return <PublicLoading />;
    if (error)
        return <PublicError message={_t(error)} onRetry={refresh}/>;
    const project = state?.projects.find(p => p.slug === slug || p.id === slug);
    if (!project)
        return <div className="cm-wrap cm-empty"><Building2 size={34}/><h1>{_t("Proyecto no disponible.")}</h1><p>{_t("No existe una ficha p\u00FAblica con esta referencia. Puede estar en revisi\u00F3n o haber sido retirada.")}</p><Link href="/proyectos" className="cm-button">{_t("Volver a proyectos")}</Link></div>;
    if (project.type !== "DEBT")
        return <FutureProjectDetail project={project}/>;
    const available = isProjectOpenForInvestment(project);
    function showSection(index: number) {
        setTab(index);
        requestAnimationFrame(() => document.getElementById(`project-panel-${index}`)?.focus());
    }
    const positions = ["center", "left center", "right center"];
    return <div className="cm-detail cm-wrap"><Link href="/proyectos" className="cm-back"><ChevronLeft size={16}/>{_t("Todos los proyectos")}</Link><header className="cm-detail-heading"><div><div className="cm-eyebrow"><MapPin size={14}/>{_t(project.city)}{_t(" \u00B7 Proyecto ficticio")}</div><h1>{_t(project.name)}</h1><p>{_t(project.address)} <span>{_t("/")}{_t(types[project.type])}</span></p></div><div className={`cm-status cm-status-${project.status.toLowerCase()}`}><i />{_t(projectStatusLabels[project.status])}</div></header>
    <div className="cm-detail-layout"><div className="cm-detail-main"><div className="cm-gallery"><button className="cm-gallery-main" onClick={() => setLightbox(true)} aria-label={_t("Ampliar representaci\u00F3n arquitect\u00F3nica")}><img src={project.image || "/assets/cimiento-hero.png"} style={{ objectPosition: positions[gallery] }} alt={_t(_t("Vista {value0} de la representaci\u00F3n arquitect\u00F3nica ficticia de {value1}", { value0: gallery + 1, value1: project.name }))}/><span><Grid2X2 size={15}/>{_t("Ver imagen")}</span></button><div className="cm-gallery-views" aria-label={_t("Vistas de la imagen")}>{_t([0, 1, 2].map(i => <button key={i} onClick={() => setGallery(i)} className={gallery === i ? "cm-selected" : ""} aria-pressed={gallery === i} aria-label={_t(_t("Ver encuadre {value0}", { value0: i + 1 }))}><img src={project.image || "/assets/cimiento-hero.png"} style={{ objectPosition: positions[i] }} alt={_t("")}/></button>))}<p>{_t("Imagen ilustrativa.")}<br />{_t("Las vistas son encuadres de una misma representaci\u00F3n.")}</p></div></div>
      {_t(project.status === "DELAYED" || project.status === "RECOVERY" ? <div className="cm-notice cm-notice-amber" role="status"><CircleHelp size={21}/><div><strong>{_t(project.status === "RECOVERY" ? "Operación en recuperación" : "Operación retrasada")}</strong><p>{_t(project.status === "RECOVERY" ? "Se analiza la recuperación del préstamo. Los importes y el calendario de devolución son inciertos y pueden producirse pérdidas." : "El calendario previsto se ha ampliado. Consulta las actualizaciones del promotor; la devolución está sujeta a la evolución de la obra y a la salida del proyecto.")}</p></div></div> : null)}
      <div className="cm-tabs" role="tablist" aria-label={_t("Informaci\u00F3n del proyecto")}>{_t(detailTabs.map((label, i) => <button key={label} id={`project-tab-${i}`} role="tab" aria-selected={tab === i} aria-controls={`project-panel-${i}`} tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)} onKeyDown={e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = (i + (e.key === "ArrowRight" ? 1 : -1) + detailTabs.length) % detailTabs.length;
        setTab(next);
        document.getElementById(`project-tab-${next}`)?.focus();
    } }}>{_t(label)}</button>))}</div>
      <section className="cm-tab-panel" role="tabpanel" id={`project-panel-${tab}`} aria-labelledby={`project-tab-${tab}`} tabIndex={0}>
        {_t(tab === 0 && <><span className="cm-eyebrow">{_t("El proyecto, al detalle")}</span><h2>{_t("Una direcci\u00F3n.")}<br />{_t("Un proyecto concreto.")}</h2><p className="cm-large-copy">{_t(project.description)}</p><div className="cm-feature-grid"><DetailBlock icon={<Building2 size={21}/>} title={_t("Uso de los fondos")} text={project.useOfFunds}/><DetailBlock icon={<ShieldCheck size={21}/>} title={_t("Garant\u00EDas")} text={project.guarantees}/><DetailBlock icon={<ArrowUpRight size={21}/>} title={_t("Estrategia de salida")} text={project.exitStrategy}/><DetailBlock icon={<Users size={21}/>} title={_t("Promotor")} text={_t("{value0}. {value1} años de experiencia declarada y ficticia.", {value0: _t(project.promoterName), value1: project.experience})}/></div><div className="cm-info-strip"><Check size={20}/><p><strong>{_t("Financiaci\u00F3n all-or-nothing.")}</strong>{_t(" Si no se alcanza el objetivo m\u00EDnimo al cierre, se cancelan los compromisos y se registra el reembolso ficticio. Los fondos se muestran en custodia de una entidad de pagos externa simulada.")}</p></div><h3>{_t("Situaci\u00F3n del proyecto")}</h3><dl className="cm-data-table"><div><dt>{_t("Licencias")}</dt><dd>{_t(project.licenses)}</dd></div><div><dt>{_t("Terreno")}</dt><dd>{_t(project.land)}</dd></div><div><dt>{_t("Situaci\u00F3n urban\u00EDstica")}</dt><dd>{_t(project.planning)}</dd></div><div><dt>{_t("Cierre de financiaci\u00F3n previsto")}</dt><dd>{_t(_date(project.fundingDeadline))}</dd></div></dl></>)}
        {_t(tab === 1 && <><span className="cm-eyebrow">{_t("Cifras abiertas")}</span><h2>{_t("El capital y su destino.")}</h2><div className="cm-detail-metrics"><Financial label={_t("Presupuesto total")} value={_money(project.budget)}/><Financial label={_t("Capital propio del promotor")} value={_money(project.ownCapital)}/><Financial label={_t("Financiaci\u00F3n bancaria")} value={_money(project.bankFinancing)}/><Financial label={_t("Pr\u00E9stamo participativo")} value={_money(project.target)}/><Financial label={_t("Reserva para sobrecostes")} value={_money(project.contingency)}/><Financial label={_t("Preventas declaradas")} value={`${project.presales}%`}/></div><h3>{_t("Estructura de la operaci\u00F3n")}</h3><dl className="cm-data-table"><div><dt>{_t("Tipo de operaci\u00F3n")}</dt><dd>{_t(types[project.type])}</dd></div><div><dt>{_t("Tipo anual objetivo, no garantizado")}</dt><dd>{_t(project.annualRate)}{_t("% bruto")}</dd></div><div><dt>{_t("Plazo estimado")}</dt><dd>{_t(project.duration)}{_t(" meses")}</dd></div><div><dt>{_t("LTV (pr\u00E9stamo / valoraci\u00F3n)")}</dt><dd>{_t(project.ltv)}{_t("%")}</dd></div><div><dt>{_t("Comisi\u00F3n al inversor en la demostraci\u00F3n")}</dt><dd>{_t("0 \u20AC")}</dd></div><div><dt>{_t("Impuestos")}</dt><dd>{_t("No incluidos en las estimaciones")}</dd></div></dl><p className="cm-fineprint">{_t("Las cifras son ficticias y no son asesoramiento financiero ni fiscal. Un LTV menor o una garant\u00EDa hipotecaria no aseguran la recuperaci\u00F3n del pr\u00E9stamo. La remuneraci\u00F3n depende del cumplimiento de la operaci\u00F3n.")}</p></>)}
        {_t(tab === 2 && <><span className="cm-eyebrow">{_t("Seguimiento de ejecuci\u00F3n")}</span><h2>{_t("Cada hito, a la vista.")}</h2><div className="cm-calendar-bar"><span><CalendarDays size={17}/>{_t("Inicio estimado ")}<strong>{_t(_date(project.startDate))}</strong></span><ArrowRight size={18}/><span>{_t("Salida estimada ")}<strong>{_t(_date(project.endDate))}</strong></span></div><div className="cm-build-progress"><span>{_t("Progreso de obra declarado ")}<strong>{_t(project.progress)}{_t("%")}</strong></span><div className="cm-funding-track"><span style={{ width: `${project.progress}%` }}/></div></div><div className="cm-timeline">{_t(project.milestones.map((m, i) => <article key={m.id}><span className={`cm-timeline-number ${m.approved ? "cm-complete" : ""}`}>{_t(m.approved ? <Check size={15}/> : String(i + 1).padStart(2, "0"))}</span><div><span className="cm-date">{_t(_date(m.expectedDate))}{_t(" \u00B7 ")}{_t(m.approved ? "Aprobado" : m.certified ? "Certificado · pendiente de aprobar" : m.status === "PENDING" ? "Previsto" : m.status)}</span><h3>{_t(m.name)}</h3><p>{_t(m.description)}</p><div className="cm-milestone-meta"><strong>{_t(_money(m.amount))}</strong><span>{_t(m.approved ? "Desembolso ficticio aprobado" : "Desembolso sujeto a certificación y aprobación")}</span></div>{_t(m.actualDate && <p className="cm-date">{_t("Fecha real ficticia: ")}{_t(_date(m.actualDate))}</p>)}{_t(m.evidence && <p className="cm-date">{_t("Evidencia ficticia: ")}{_t(m.evidence)}</p>)}</div></article>))}</div><div className="cm-info-strip"><ShieldCheck size={23}/><p>{_t("El capital se libera por hitos certificados y con aprobaci\u00F3n administrativa. La certificaci\u00F3n y todos los desembolsos se simulan en esta aplicaci\u00F3n.")}</p></div></>)}
        {_t(tab === 3 && <><span className="cm-eyebrow">{_t("Documentaci\u00F3n accesible")}</span><h2>{_t("Lee antes de decidir.")}</h2><p>{_t("Todos los documentos son archivos ficticios creados para esta demostraci\u00F3n. No tienen validez contractual, fiscal ni t\u00E9cnica.")}</p><ProjectDocumentViewer documents={project.documents}/></>)}
        {_t(tab === 4 && <><span className="cm-eyebrow">{_t("Cuaderno de obra")}</span><h2>{_t("Lo que est\u00E1 pasando.")}</h2>{_t(project.updates.length ? <div className="cm-updates">{_t(project.updates.map(update => <article key={update.id}><span className="cm-date">{_t(_date(update.createdAt))}{_t(" \u00B7 Actualizaci\u00F3n ficticia")}</span><h3>{_t(update.title)}</h3><p>{_t(update.content)}</p></article>))}</div> : <div className="cm-empty"><CalendarDays size={26}/><h3>{_t("El seguimiento comienza al publicarse.")}</h3><p>{_t("Las pr\u00F3ximas novedades t\u00E9cnicas y de financiaci\u00F3n aparecer\u00E1n aqu\u00ED y en tu cartera.")}</p></div>)}</>)}
        {_t(tab === 5 && <><span className="cm-eyebrow">{_t("Conocer la contraparte")}</span><h2>{_t("Promotor y riesgos.")}</h2><div className="cm-promoter-block"><div className="cm-company-mark"><Building2 size={32}/></div><div><h3>{_t(project.promoterName)}</h3><p>{_t("Sociedad promotora ficticia \u00B7 Espa\u00F1a")}<br />{_t(project.experience)}{_t(" a\u00F1os de experiencia declarada")}</p></div></div><p>{_t("La sociedad promotora recibe el pr\u00E9stamo y asume su devoluci\u00F3n. La inversi\u00F3n est\u00E1 vinculada a esta operaci\u00F3n concreta, su ejecuci\u00F3n, su comercializaci\u00F3n y su capacidad de repago.")}</p><div className="cm-risk-summary"><div><span>{_t("Calificaci\u00F3n orientativa")}</span><strong>{_t(project.risk)}</strong></div><p>{_t("Escala A\u2013D de menor a mayor riesgo relativo. Evaluaci\u00F3n explicable de experiencia, aportaci\u00F3n propia, licencias, LTV, presupuesto, contingencias, garant\u00EDas, preventas, salida y duraci\u00F3n. La decisi\u00F3n requiere revisi\u00F3n humana; la puntuaci\u00F3n no garantiza resultados.")}</p></div><h3>{_t("Riesgos espec\u00EDficos de esta operaci\u00F3n")}</h3><p>{_t(project.risks)}</p><ul className="cm-risk-list"><li>{_t("P\u00E9rdida parcial o total del capital invertido.")}</li><li>{_t("Retrasos, sobrecostes y menor precio de venta de los inmuebles.")}</li><li>{_t("Impago del promotor y recuperaci\u00F3n incierta de las garant\u00EDas.")}</li><li>{_t("Falta de liquidez: no existe un mercado secundario operativo.")}</li></ul><Link href="/riesgos" className="cm-text-link">{_t("Consulta todas las advertencias de riesgo ")}<ArrowRight size={17}/></Link></>)}
        {_t(tab === 6 && <><span className="cm-eyebrow">{_t("Resolvemos las dudas")}</span><h2>{_t("Sobre esta operaci\u00F3n.")}</h2><div className="cm-faqs">{_t([["¿Qué pasa si no se financia el proyecto?", "La financiación es all-or-nothing. Si no se alcanza el objetivo en el plazo previsto, se cancelan los compromisos y se registra un reembolso ficticio en la cartera."], ["¿Cuándo recibiría capital e intereses?", _t("La previsi\u00F3n es de {value0} meses. El repago depende de la venta, refinanciaci\u00F3n o amortizaci\u00F3n del pr\u00E9stamo. Los plazos y el rendimiento no est\u00E1n garantizados.", { value0: project.duration })], ["¿Puedo cancelar un compromiso?", _t("S\u00ED, durante el periodo de reflexi\u00F3n de {value0} horas desde la confirmaci\u00F3n. La cartera muestra el tiempo disponible y permite cancelarlo.", { value0: state?.reflectionHours || 96 })], ["¿Dónde está el dinero?", "En esta demostración no se mueve dinero. El flujo representa una entidad de pagos externa que mantendría los fondos separados de Cimiento."], ["¿La garantía evita las pérdidas?", "No. Las garantías pueden resultar insuficientes, tardar en ejecutarse o no permitir recuperar el capital. Consulta el expediente y los riesgos de la operación."]].map(([q, a]) => <details key={q}><summary>{_t(q)}<ChevronRight size={17}/></summary><p>{_t(a)}</p></details>))}</div></>)}
      </section>
    </div><aside className="cm-investment-aside"><div className={available ? "cm-investment-summary" : "cm-investment-summary cm-monitoring-summary"}>{available ? <><div className="cm-summary-top"><span>{_t("Pr\u00E9stamo inmobiliario")}</span><span>{_t("Ficticio")}</span></div><div className="cm-annual-rate"><strong>{_t(project.annualRate.toLocaleString(_locale === "en" ? "en-GB" : "es-ES"))}{_t("%")}</strong><span>{_t("anual objetivo")}<br /><b>{_t("No garantizado")}</b></span></div><div className="cm-summary-metrics"><div><strong>{_t(project.duration)}{_t(" meses")}</strong><span>{_t("Plazo estimado")}</span></div><div><strong>{_t(project.ltv)}{_t("%")}</strong><span>{_t("LTV")}</span></div><div><strong>{_t(project.risk)}</strong><span>{_t("Riesgo A\u2013D")}</span></div></div><div className="cm-funding-label"><strong>{_t(_money(project.funded))}</strong><span>{_t(percent(project).toFixed(1))}{_t("%")}</span></div><div className="cm-funding-track"><span style={{ width: `${percent(project)}%` }}/></div><div className="cm-funding-bottom"><span>{_t("de ")}{_t(_money(project.target))}</span><span><Users size={13}/>{_t(project.investors)}{_t(" inversores ficticios")}</span></div></> : <ProjectFollowup project={project} statusLabel={projectStatusLabels[project.status]} onSectionChange={showSection}/>}<InvestmentFlow project={project} mode={available ? "investment" : "recovery"}/><div className="cm-custody"><ShieldCheck size={19}/><p>{_t("Custodia externa y pago simulados.")}<br /><strong>{_t("No se procesa dinero real.")}</strong></p></div></div><div className="cm-aside-risk"><CircleHelp size={18}/><p>{_t("Puedes perder parte o todo el capital. La inversi\u00F3n no est\u00E1 cubierta por un fondo de garant\u00EDa de dep\u00F3sitos. ")}<Link href="/riesgos">{_t("Leer los riesgos")}</Link></p></div></aside></div>
    <Modal open={lightbox} onOpenChange={setLightbox} title={_t(_t("Galer\u00EDa \u00B7 {value0}", { value0: project.name }))}><img src={project.image || "/assets/cimiento-hero.png"} alt={_t(_t("Representaci\u00F3n ficticia de {value0}", { value0: project.name }))}/><p className="cm-fineprint">{_t("Representaci\u00F3n arquitect\u00F3nica ilustrativa. Proyecto ficticio.")}</p></Modal>
  </div>;
}
function Financial({ label, value }: {
    label: string;
    value: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div><span>{_t(label)}</span><strong>{_t(value)}</strong></div>; }
function DetailBlock({ icon, title, text }: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <article><span className="cm-feature-icon">{_t(icon)}</span><h3>{_t(title)}</h3><p>{_t(text)}</p></article>; }
function FutureProjectDetail({ project }: {
    project: Project;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="cm-detail cm-wrap"><Link href="/proyectos" className="cm-back"><ChevronLeft size={16}/>{_t("Todos los proyectos")}</Link><header className="cm-detail-heading"><div><span className="cm-eyebrow">{_t("Hoja de ruta \u00B7 Concepto ficticio")}</span><h1>{_t(project.name)}</h1><p>{_t(project.city)}{_t(" \u00B7 ")}{_t(project.type === "EQUITY" ? "Equity inmobiliario" : "Proyectos de rentas")}</p></div><span className="cm-status cm-status-coming_soon"><i />{_t("Pr\u00F3ximamente")}</span></header><div className="cm-future-detail"><img src={project.image || "/assets/cimiento-hero.png"} alt={_t("Representaci\u00F3n arquitect\u00F3nica ilustrativa de una l\u00EDnea futura")}/><div><span className="cm-eyebrow">{_t("Una fase posterior")}</span><h2>{_t("El siguiente plano.")}<br />{_t("Todav\u00EDa por construir.")}</h2><p>{_t(project.description)}</p><div className="cm-notice"><Building2 size={24}/><div><strong>{_t("Este producto no est\u00E1 disponible.")}</strong><p>{_t("No hay una oferta de inversi\u00F3n, condiciones econ\u00F3micas publicadas, rentabilidad objetivo ni calendario operativo. No se admiten compromisos.")}</p></div></div><p>{_t(project.type === "EQUITY" ? "La futura participación en el capital de una sociedad requiere un modelo de producto, derechos, información y estructura propios, todavía no desarrollados en este MVP." : "Los futuros proyectos vinculados a rentas necesitan un modelo de gestión, información y distribución específico, todavía no desarrollado en este MVP.")}</p><p>{_t("El MVP actual permite probar pr\u00E9stamos inmobiliarios ficticios. El tabl\u00F3n secundario tambi\u00E9n pertenece a una fase posterior y no ofrece liquidez garantizada.")}</p><Link className="cm-button" href="/proyectos">{_t("Explorar el MVP de pr\u00E9stamos ")}<ArrowRight size={17}/></Link><Link className="cm-text-link" href="/riesgos">{_t("Conocer los riesgos ")}<ArrowUpRight size={16}/></Link></div></div></div>; }
export function ProjectDocumentViewer({ documents }: {
    documents: ProjectDocument[];
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const [selected, setSelected] = useState<ProjectDocument | null>(null);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const requestNumber = useRef(0);
    async function viewDocument(document: ProjectDocument) {
        const request = ++requestNumber.current;
        setSelected(document);
        setContent("");
        setError("");
        setLoading(true);
        try {
            const response = await fetch(`/api/documents/${document.id}`);
            if (!response.ok)
                throw new Error("No se ha podido cargar el documento. Puede haberse retirado o requerir permiso de acceso.");
            const text = await response.text();
            if (request === requestNumber.current)
                setContent(text);
        }
        catch (e) {
            if (request === requestNumber.current)
                setError(e instanceof Error ? e.message : "No se ha podido abrir el documento.");
        }
        finally {
            if (request === requestNumber.current)
                setLoading(false);
        }
    }
    return <div className="cm-documents">{_t(documents.length ? documents.map(doc => <div key={doc.id} className="cm-document"><span className="cm-document-icon"><FileText size={23}/></span><span><button onClick={() => void viewDocument(doc)} className="cm-doc-preview"><strong>{_t(doc.name)}</strong></button><small>{_t(doc.category)}{_t(" \u00B7 Ficticio \u00B7 ")}{_t(_date(doc.createdAt))}</small></span><a href={`/api/documents/${doc.id}`} download aria-label={_t(_t("Descargar {value0}", { value0: _t(doc.name) }))}><ArrowDownToLine size={18}/></a></div>) : <div className="cm-empty"><FileText size={24}/><h3>{_t("Documentaci\u00F3n pendiente de publicaci\u00F3n")}</h3><p>{_t("El proyecto no estar\u00E1 abierto a inversi\u00F3n hasta que su expediente est\u00E9 disponible.")}</p></div>)}<Modal open={!!selected} onOpenChange={open => { if (!open)
        setSelected(null); }} title={_t(selected?.name || "Documento ficticio")}>{_t(loading ? <p role="status">{_t("Cargando documento ficticio\u2026")}</p> : error ? <div className="cm-notice cm-notice-amber" role="alert"><div><p>{_t(error)}</p><button className="cm-text-link" onClick={() => selected && void viewDocument(selected)}>{_t("Reintentar")}</button></div></div> : <pre className="cm-doc-content">{_t(content)}</pre>)}{_t(selected && <a className="cm-button" href={`/api/documents/${selected.id}`} download>{_t("Descargar documento ficticio ")}<ArrowDownToLine size={16}/></a>)}</Modal></div>;
}
export function HomeProjects() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, error, refresh } = useApp();
    if (loading)
        return <PublicLoading />;
    if (error)
        return <PublicError message={_t(error)} onRetry={refresh}/>;
    const projects = [...(state?.projects || [])].filter(p => p.type === "DEBT" && PUBLIC_STATUSES.includes(p.status)).sort((a, b) => (a.status === "FUNDING" ? -1 : b.status === "FUNDING" ? 1 : 0)).slice(0, 3);
    return <div className="cm-project-grid">{_t(projects.map(project => <ProjectCard project={project} key={project.id}/>))}</div>;
}
