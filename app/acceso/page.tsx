"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Landmark, LockKeyhole } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui";
import "@/components/investor.css";

export default function AccessPage() {
  const { act } = useApp();
  const [email, setEmail] = useState("inversor@cimiento.demo");
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await act("login", { email, password });
      if (!result.ok) { setError(result.message); return; }
      const role = result.data?.user?.role || result.data?.role || (email.startsWith("admin") ? "ADMIN" : email.startsWith("promotor") ? "PROMOTER" : "INVESTOR");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") && !next.startsWith("//") ? next : role === "ADMIN" ? "/admin" : role === "PROMOTER" ? "/promotor" : "/inversor");
    } catch { setError("No se ha podido iniciar la sesión. Vuelve a intentarlo."); } finally { setBusy(false); }
  }
  return <div className="auth-layout container"><section className="auth-intro"><span className="eyebrow">TU PRÓXIMO CAPÍTULO</span><h1>Construye una visión<br/>a largo plazo.</h1><p>Consulta proyectos, comprende cada operación y sigue su evolución desde un único lugar.</p><div className="auth-principle"><Landmark size={27}/><div><strong>El detalle importa.</strong><p>Accede a la documentación y a los hitos de cada proyecto antes de decidir.</p></div></div><p className="muted">Puedes perder parte o todo el capital. La rentabilidad objetivo no está garantizada.</p></section><section className="auth-form panel"><LockKeyhole size={25}/><h2>Bienvenido a Cimiento</h2><p>Accede al entorno de demostración.</p><form onSubmit={submit}><label className="field">Correo electrónico<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label className="field">Contraseña<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/></label>{error && <p role="alert" className="notice error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Accediendo…" : "Entrar"}<ArrowRight size={17}/></Button></form><p>¿Aún no tienes una cuenta? <Link href="/registro">Crear cuenta de demostración</Link></p><details className="demo-credentials"><summary>Cuentas ficticias disponibles</summary><p>Contraseña común: <code>Demo123!</code></p>{[["inversor", "Inversor"], ["promotor", "Promotor"], ["admin", "Administrador"]].map(([key, text]) => <button type="button" key={key} onClick={() => { setEmail(`${key}@cimiento.demo`); setPassword("Demo123!"); }}>{text}<small>{key}@cimiento.demo</small></button>)}</details></section></div>;
}
