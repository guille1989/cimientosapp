"use client";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, UserRound, CreditCard, ArrowRight } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button, LoadingState, PageHeading } from "@/components/ui";
import { AccountStatus } from "@/components/investor-shared";
export default function ProfilePage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, act } = useApp();
    const router = useRouter();
    const [name, setName] = useState("");
    const [taxCountry, setTaxCountry] = useState("España");
    const [bankAccount, setBankAccount] = useState("DEMO 0000 0000 0000");
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (state?.user && !ready) {
        setName(state.user.name);
        setTaxCountry(state.user.profile?.taxCountry || "España");
        setBankAccount(state.user.profile?.bankAccount || "DEMO 0000 0000 0000");
        setReady(true);
    } }, [state, ready]);
    if (loading || !state?.user)
        return <LoadingState />;
    async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); setMessage(""); if (!bankAccount.startsWith("DEMO")) {
        setError("La cuenta ficticia debe empezar por DEMO. No introduzcas un IBAN real.");
        setBusy(false);
        return;
    } try {
        const result = await act("saveProfile", { name, taxCountry, bankAccount });
        if (!result.ok)
            setError(result.message);
        else
            setMessage("Perfil ficticio actualizado.");
    }
    catch {
        setError("No se han guardado los cambios. Vuelve a intentarlo.");
    }
    finally {
        setBusy(false);
    } }
    async function logout() { setBusy(true); try {
        const result = await act("logout", {});
        if (!result.ok)
            setError(result.message);
        else
            router.push("/acceso");
    }
    catch {
        setError("No se ha podido cerrar la sesión.");
    }
    finally {
        setBusy(false);
    } }
    return <><PageHeading eyebrow={_t("INVERSOR")} title={_t("Mi perfil")} description={_t("Tus datos de demostraci\u00F3n y preferencias en un mismo lugar.")}/><div className="profile-layout"><form className="panel" onSubmit={save}><h2><UserRound size={21}/>{_t(" Datos personales ficticios")}</h2><p className="muted small">{_t("No introduzcas informaci\u00F3n personal real.")}</p><div className="form-grid"><label className="field">{_t("Nombre ficticio")}<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required/></label><label className="field">{_t("Correo de acceso")}<input value={state.user.email} readOnly/><small>{_t("El correo de acceso no se modifica en la demostraci\u00F3n.")}</small></label><label className="field">{_t("Residencia fiscal ficticia")}<select value={taxCountry} onChange={e => setTaxCountry(e.target.value)}><option value={"Espa\u00F1a"}>{_t("Espa\u00F1a")}</option><option value={"Portugal"}>{_t("Portugal")}</option><option value={"Francia"}>{_t("Francia")}</option><option value={"Otro"}>{_t("Otro")}</option></select></label></div><h2 className="profile-subheading"><CreditCard size={21}/>{_t(" Cuenta de demostraci\u00F3n")}</h2><label className="field">{_t("Referencia bancaria ficticia")}<input value={bankAccount} onChange={e => setBankAccount(e.target.value)} required pattern="DEMO.*" maxLength={40}/><small>{_t("Debe comenzar por DEMO. No uses un IBAN real.")}</small></label><p className="notice">{_t("Los fondos ser\u00EDan administrados por una entidad de pagos externa. Esta cuenta es una referencia inventada y no permite ingresar ni retirar fondos.")}</p>{_t(message && <p className="notice success" role="status">{_t(message)}</p>)}{_t(error && <p className="notice error" role="alert">{_t(error)}</p>)}<Button type="submit" disabled={busy}>{_t(busy ? "Guardando…" : "Guardar cambios")}</Button></form><aside className="profile-aside"><section className="panel"><h2><ShieldCheck size={21}/>{_t(" Verificaci\u00F3n simulada")}</h2><AccountStatus status={state.user.onboardingStatus}/><p>{_t("El onboarding y el test de conocimientos son una demostraci\u00F3n. No sustituyen una identificaci\u00F3n ni una evaluaci\u00F3n real.")}</p><Link href="/onboarding">{_t("Ver mi onboarding ")}<ArrowRight size={15}/></Link></section><section className="panel"><h2>{_t("Preferencias")}</h2><p>{_t("Elige los avisos de proyectos, avances y documentos que quieres recibir en la demostraci\u00F3n.")}</p><Link href="/inversor/notificaciones">{_t("Configurar notificaciones \u2192")}</Link></section><section className="panel"><h2>{_t("Seguridad de la cuenta")}</h2><p>{_t("La sesi\u00F3n est\u00E1 limitada a este entorno ficticio. La autenticaci\u00F3n de producci\u00F3n se conectar\u00EDa a un proveedor especializado con protecci\u00F3n reforzada.")}</p><Button type="button" variant="secondary" disabled={busy} onClick={() => void logout()}><LogOut size={16}/>{_t("Cerrar sesi\u00F3n")}</Button></section></aside></div></>;
}
