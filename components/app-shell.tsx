"use client";
import { LanguageSelector } from "@/components/i18n-provider";
import { useI18n } from "@/components/i18n-provider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Bell, Building2, ChartNoAxesCombined, ChevronDown, ClipboardList, FileText, FolderOpen, House, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, Wallet, X, CircleHelp, ListChecks, History } from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";
import type { Role } from "@/lib/types";
const investorLinks = [["/inversor", "Resumen", LayoutDashboard], ["/inversor/cartera", "Mi cartera", FolderOpen], ["/inversor/movimientos", "Movimientos", ChartNoAxesCombined], ["/inversor/documentos", "Documentos", FileText], ["/inversor/notificaciones", "Notificaciones", Bell], ["/inversor/perfil", "Mi perfil", Settings]] as const;
const promoterLinks = [["/promotor", "Resumen", LayoutDashboard], ["/promotor/solicitud", "Solicitar financiación", ClipboardList], ["/promotor/proyectos", "Mis proyectos", Building2], ["/promotor/hitos", "Hitos y desembolsos", ListChecks]] as const;
const adminLinks = [["/admin", "Resumen", LayoutDashboard], ["/admin/proyectos", "Pipeline de proyectos", Building2], ["/admin/usuarios", "Usuarios y verificaciones", Users], ["/admin/hitos", "Hitos y desembolsos", ListChecks], ["/admin/distribuciones", "Distribuciones", Wallet], ["/admin/incidencias", "Incidencias e impagos", ShieldCheck], ["/admin/auditoria", "Auditoría", History]] as const;
export function Brand() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <Link className="brand" href="/" aria-label={_t("Cimiento, inicio")}><span className="brand-symbol"><Building2 size={23} strokeWidth={1.7}/></span>{_t("cimiento")}<span className="brand-period">{_t(".")}</span></Link>; }
export function AppShell({ children }: {
    children: React.ReactNode;
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const pathname = usePathname();
    const router = useRouter();
    const { state, act, error, refresh } = useApp();
    const [mobile, setMobile] = useState(false);
    const [switching, setSwitching] = useState(false);
    const privateArea = /^\/(inversor|promotor|admin)(\/|$)/.test(pathname);
    const area = pathname.startsWith("/admin") ? "ADMIN" : pathname.startsWith("/promotor") ? "PROMOTER" : "INVESTOR";
    const links = area === "ADMIN" ? adminLinks : area === "PROMOTER" ? promoterLinks : investorLinks;
    const home = state?.user?.role === "ADMIN" ? "/admin" : state?.user?.role === "PROMOTER" ? "/promotor" : "/inversor";
    async function switchRole(role: Role) { setSwitching(true); const result = await act("demoLogin", { role }); setSwitching(false); if (result.ok) {
        setMobile(false);
        window.location.assign(role === "ADMIN" ? "/admin" : role === "PROMOTER" ? "/promotor" : "/inversor");
    } }
    return <>
    <a className="skip-link" href="#main-content">{_t("Saltar al contenido")}</a>
    <div className="demo-banner"><span className="status-dot"/><span>{_t("Entorno de demostraci\u00F3n. Los proyectos, rentabilidades y movimientos mostrados son ficticios.")}</span><span className="demo-chip">{_t("DEMO")}</span></div>
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label={_t("Navegaci\u00F3n principal")} className="desktop-nav"><Link className={pathname.startsWith("/proyectos") ? "active" : ""} href="/proyectos">{_t("Explorar proyectos")}</Link><Link href="/como-funciona">{_t("C\u00F3mo funciona")}</Link><Link href="/riesgos">{_t("Riesgos")}</Link><Link href="/promotor/solicitud">{_t("Para promotores ")}<ArrowRight size={13}/></Link></nav><div className="header-actions"><LanguageSelector /><Link className="button button-primary header-account" href={state?.user ? home : "/acceso"}>{_t(state?.user ? "Mi espacio" : "Acceder")}<ArrowRight size={16}/></Link><button className="mobile-menu" aria-label={_t(mobile ? "Cerrar menú" : "Abrir menú")} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{_t(mobile ? <X /> : <Menu />)}</button></div></div></header>
    {_t(mobile && <nav className="mobile-nav" aria-label={_t("Navegaci\u00F3n m\u00F3vil")}>{_t([["/proyectos", "Explorar proyectos"], ["/como-funciona", "Cómo funciona"], ["/riesgos", "Riesgos"], ["/promotor/solicitud", "Solicitar financiación"], ["/preguntas-frecuentes", "Preguntas frecuentes"], ...(privateArea ? links.map(([url, label]) => [url, label]) : [])].map(([url, label]) => <Link key={url} href={url} onClick={() => setMobile(false)}>{_t(label)}<ArrowRight size={16}/></Link>))}</nav>)}
    {_t(error && !privateArea && <div className="connection-error" role="alert">{_t(error)}<button onClick={() => void refresh()}>{_t("Reintentar")}</button></div>)}
    <div className={privateArea ? "workspace-shell" : "public-shell"}>
      {_t(privateArea && <aside className="sidebar"><div className="sidebar-eyebrow">{_t(area === "ADMIN" ? "Administración" : area === "PROMOTER" ? "Portal del promotor" : "Área del inversor")}</div><nav aria-label={_t("Navegaci\u00F3n del panel")}>{_t(links.map(([url, label, Icon]) => <Link key={url} href={url} className={pathname === url ? "active" : ""}><Icon size={18}/>{_t(label)}</Link>))}</nav><div className="sidebar-bottom"><Link href="/proyectos"><House size={17}/>{_t("Volver al mercado ")}<ArrowRight size={14}/></Link><Link href="/preguntas-frecuentes"><CircleHelp size={17}/>{_t("Centro de ayuda")}</Link><div className="sidebar-user"><span className="avatar">{_t(state?.user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "C")}</span><div><strong>{_t(state?.user?.name || "Invitado")}</strong><small>{_t("Cuenta ficticia")}</small></div>{_t(state?.user && <button aria-label={_t("Cerrar sesi\u00F3n")} onClick={async () => { await act("logout"); router.push("/acceso"); }}><LogOut size={17}/></button>)}</div></div></aside>)}
      <main id="main-content" className={privateArea ? "workspace-main" : "public-main"}>{_t(children)}</main>
    </div>
    {_t(!privateArea && <footer className="site-footer"><div className="footer-grid"><div><Brand /><p>{_t("Invertir en lo que se construye.")}<br />{_t("Arquitectura, transparencia y acceso.")}</p></div><div><h3>{_t("La plataforma")}</h3><Link href="/proyectos">{_t("Explorar proyectos")}</Link><Link href="/como-funciona">{_t("C\u00F3mo funciona")}</Link><Link href="/promotor/solicitud">{_t("Solicitar financiaci\u00F3n")}</Link></div><div><h3>{_t("Antes de invertir")}</h3><Link href="/riesgos">{_t("Riesgos de inversi\u00F3n")}</Link><Link href="/preguntas-frecuentes">{_t("Preguntas frecuentes")}</Link><Link href="/registro">{_t("Crear cuenta de demostraci\u00F3n")}</Link></div><div><span className="footer-label">{_t("SOLO DEMOSTRACI\u00D3N")}</span><p>{_t("Cimiento no se presenta como entidad autorizada por la CNMV. No se realizan pagos, identificaci\u00F3n ni inversiones reales.")}</p></div></div><div className="footer-bottom"><span>{_t("\u00A9 2026 Cimiento \u00B7 Todos los datos son ficticios.")}</span><span>{_t("Espa\u00F1a \u00B7 EUR (\u20AC)")}</span></div></footer>)}
    {_t(process.env.NODE_ENV === "development" && <div className="dev-switcher"><label htmlFor="demo-role">{_t("DEV \u00B7 Probar rol")}</label><div><select id="demo-role" value={state?.user?.role || ""} disabled={switching} onChange={e => { if (e.target.value)
        void switchRole(e.target.value as Role); }}><option value="" disabled>{_t("Selecciona")}</option><option value="INVESTOR">{_t("Inversor")}</option><option value="PROMOTER">{_t("Promotor")}</option><option value="ADMIN">{_t("Administrador")}</option></select><ChevronDown size={12} aria-hidden="true"/></div></div>)}
  </>;
}
