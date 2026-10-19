"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui";
import "@/components/investor.css";

export default function RegisterPage() {
  const { act } = useApp();
  const [role, setRole] = useState("INVESTOR"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setBusy(true); setError("");
    try { const result = await act("register", { name: values.get("name"), email: values.get("email"), password: values.get("password"), role }); if (!result.ok) setError(result.message); else window.location.assign(role === "PROMOTER" ? "/promotor" : "/onboarding"); } catch { setError("No se ha podido crear la cuenta. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  return <div className="auth-layout container"><section className="auth-intro"><span className="eyebrow">UNA BASE PARA EMPEZAR</span><h1>Tu acceso<br/>a Cimiento.</h1><p>Explora el funcionamiento de la plataforma con una cuenta ficticia. No se realizan pagos ni comprobaciones de identidad reales.</p><p className="notice">Utiliza un nombre inventado y una dirección terminada en <strong>@cimiento.demo</strong>. No introduzcas datos personales reales.</p><Link href="/proyectos">Explorar los proyectos primero →</Link></section><section className="auth-form panel"><h2>Crear cuenta ficticia</h2><form onSubmit={submit}><fieldset className="role-choice"><legend>¿Cómo quieres participar?</legend><label><input type="radio" name="role" checked={role === "INVESTOR"} onChange={() => setRole("INVESTOR")}/> Quiero invertir</label><label><input type="radio" name="role" checked={role === "PROMOTER"} onChange={() => setRole("PROMOTER")}/> Soy promotor</label></fieldset><label className="field">Nombre ficticio<input name="name" placeholder="Ej. Alex Demo" required minLength={2} maxLength={80} autoComplete="off"/></label><label className="field">Correo ficticio<input name="email" type="email" placeholder="alex@cimiento.demo" required autoComplete="off" pattern="[^@]+@cimiento\.demo" title="Usa una dirección ficticia @cimiento.demo"/></label><label className="field">Contraseña de demostración<input name="password" type="password" minLength={8} required autoComplete="new-password"/><small>Al menos 8 caracteres. No reutilices una contraseña real.</small></label><label className="check-row"><input type="checkbox" required/><span>Entiendo que esta cuenta solo sirve para probar el entorno ficticio y que no debo facilitar datos reales.</span></label>{error && <p role="alert" className="notice error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Creando cuenta…" : "Crear mi cuenta"}<ArrowRight size={17}/></Button></form><p>¿Ya tienes cuenta? <Link href="/acceso">Inicia sesión</Link></p></section></div>;
}
