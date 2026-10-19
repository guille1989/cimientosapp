"use client";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Landmark, LockKeyhole } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui";
import "@/components/investor.css";
export default function AccessPage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { act } = useApp();
    const [email, setEmail] = useState("inversor@cimiento.demo");
    const [password, setPassword] = useState("Demo123!");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setBusy(true);
        try {
            const result = await act("login", { email, password });
            if (!result.ok) {
                setError(result.message);
                return;
            }
            const role = result.data?.user?.role || result.data?.role || (email.startsWith("admin") ? "ADMIN" : email.startsWith("promotor") ? "PROMOTER" : "INVESTOR");
            const next = new URLSearchParams(window.location.search).get("next");
            window.location.assign(next?.startsWith("/") && !next.startsWith("//") ? next : role === "ADMIN" ? "/admin" : role === "PROMOTER" ? "/promotor" : "/inversor");
        }
        catch {
            setError("No se ha podido iniciar la sesión. Vuelve a intentarlo.");
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="auth-layout container"><section className="auth-intro"><span className="eyebrow">{_t("TU PR\u00D3XIMO CAP\u00CDTULO")}</span><h1>{_t("Construye una visi\u00F3n")}<br />{_t("a largo plazo.")}</h1><p>{_t("Consulta proyectos, comprende cada operaci\u00F3n y sigue su evoluci\u00F3n desde un \u00FAnico lugar.")}</p><div className="auth-principle"><Landmark size={27}/><div><strong>{_t("El detalle importa.")}</strong><p>{_t("Accede a la documentaci\u00F3n y a los hitos de cada proyecto antes de decidir.")}</p></div></div><p className="muted">{_t("Puedes perder parte o todo el capital. La rentabilidad objetivo no est\u00E1 garantizada.")}</p></section><section className="auth-form panel"><LockKeyhole size={25}/><h2>{_t("Bienvenido a Cimiento")}</h2><p>{_t("Accede al entorno de demostraci\u00F3n.")}</p><form onSubmit={submit}><label className="field">{_t("Correo electr\u00F3nico")}<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label className="field">{_t("Contrase\u00F1a")}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/></label>{_t(error && <p role="alert" className="notice error">{_t(error)}</p>)}<Button type="submit" disabled={busy}>{_t(busy ? "Accediendo…" : "Entrar")}<ArrowRight size={17}/></Button></form><p>{_t("\u00BFA\u00FAn no tienes una cuenta? ")}<Link href="/registro">{_t("Crear cuenta de demostraci\u00F3n")}</Link></p><details className="demo-credentials"><summary>{_t("Cuentas ficticias disponibles")}</summary><p>{_t("Contrase\u00F1a com\u00FAn: ")}<code>{_t("Demo123!")}</code></p>{_t([["inversor", "Inversor"], ["promotor", "Promotor"], ["admin", "Administrador"]].map(([key, text]) => <button type="button" key={key} onClick={() => { setEmail(`${key}@cimiento.demo`); setPassword("Demo123!"); }}>{_t(text)}<small>{_t(key)}{_t("@cimiento.demo")}</small></button>))}</details></section></div>;
}
