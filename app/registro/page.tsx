"use client";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui";
import "@/components/investor.css";
export default function RegisterPage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { act } = useApp();
    const [role, setRole] = useState("INVESTOR");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
            const result = await act("register", { name: values.get("name"), email: values.get("email"), password: values.get("password"), role });
            if (!result.ok)
                setError(result.message);
            else
                window.location.assign(role === "PROMOTER" ? "/promotor" : "/onboarding");
        }
        catch {
            setError("No se ha podido crear la cuenta. Inténtalo de nuevo.");
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="auth-layout container"><section className="auth-intro"><span className="eyebrow">{_t("UNA BASE PARA EMPEZAR")}</span><h1>{_t("Tu acceso")}<br />{_t("a Cimiento.")}</h1><p>{_t("Explora el funcionamiento de la plataforma con una cuenta ficticia. No se realizan pagos ni comprobaciones de identidad reales.")}</p><p className="notice">{_t("Utiliza un nombre inventado y una direcci\u00F3n terminada en ")}<strong>{_t("@cimiento.demo")}</strong>{_t(". No introduzcas datos personales reales.")}</p><Link href="/proyectos">{_t("Explorar los proyectos primero \u2192")}</Link></section><section className="auth-form panel"><h2>{_t("Crear cuenta ficticia")}</h2><form onSubmit={submit}><fieldset className="role-choice"><legend>{_t("\u00BFC\u00F3mo quieres participar?")}</legend><label><input type="radio" name="role" checked={role === "INVESTOR"} onChange={() => setRole("INVESTOR")}/>{_t(" Quiero invertir")}</label><label><input type="radio" name="role" checked={role === "PROMOTER"} onChange={() => setRole("PROMOTER")}/>{_t(" Soy promotor")}</label></fieldset><label className="field">{_t("Nombre ficticio")}<input name="name" placeholder={_t("Ej. Alex Demo")} required minLength={2} maxLength={80} autoComplete="off"/></label><label className="field">{_t("Correo ficticio")}<input name="email" type="email" placeholder={_t("alex@cimiento.demo")} required autoComplete="off" pattern="[^@]+@cimiento\.demo" title={_t("Usa una direcci\u00F3n ficticia @cimiento.demo")}/></label><label className="field">{_t("Contrase\u00F1a de demostraci\u00F3n")}<input name="password" type="password" minLength={8} required autoComplete="new-password"/><small>{_t("Al menos 8 caracteres. No reutilices una contrase\u00F1a real.")}</small></label><label className="check-row"><input type="checkbox" required/><span>{_t("Entiendo que esta cuenta solo sirve para probar el entorno ficticio y que no debo facilitar datos reales.")}</span></label>{_t(error && <p role="alert" className="notice error">{_t(error)}</p>)}<Button type="submit" disabled={busy}>{_t(busy ? "Creando cuenta…" : "Crear mi cuenta")}<ArrowRight size={17}/></Button></form><p>{_t("\u00BFYa tienes cuenta? ")}<Link href="/acceso">{_t("Inicia sesi\u00F3n")}</Link></p></section></div>;
}
