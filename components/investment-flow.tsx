"use client";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useRef, useState } from "react";
import { clearInvestmentIntent, intentStorageKey, readInvestmentIntent, saveInvestmentIntent, type InvestmentIntent } from "@/lib/investment-intent";
import { statusLabels } from "@/lib/status-labels";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, ExternalLink, Building2, CheckCircle2 } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button, Modal } from "@/components/ui";
import { euro } from "@/components/investor-shared";
import type { Project } from "@/lib/types";
import "@/components/investor.css";
export function InvestmentFlow({ project }: {
    project: Project;
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, act } = useApp();
    const [amount, setAmount] = useState("1000");
    const submitting = useRef(false);
    const [pendingRequest, setPendingRequest] = useState<{scope: string; intent: InvestmentIntent} | null>(null);
    const [confirmation, setConfirmation] = useState<{id: string; amount: number; status: string; reflectionEndsAt: string; replayed: boolean} | null>(null);
    const [authRequired, setAuthRequired] = useState(false);
    const scope = state?.user?.role === "INVESTOR" ? intentStorageKey(state.user.id, project.id) : null;
    const pending = pendingRequest?.scope === scope ? pendingRequest?.intent : null;
    useEffect(() => {
        if (!scope) { setPendingRequest(null); return; }
        try {
            const intent = readInvestmentIntent(window.sessionStorage, scope);
            setPendingRequest(intent ? {scope, intent} : null);
            if (intent) setAmount(String(intent.amount));
        } catch { setPendingRequest(null); }
    }, [scope]);
    function review() {
        setStep(0); setError(""); setAuthRequired(false); setConfirmation(null);
        setAcceptances({loss:false, illiquidity:false, notGuaranteed:false, documents:false});
        setPaymentAccepted(false);
        if (pending) setAmount(String(pending.amount));
        setOpen(true);
    }
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [paymentAccepted, setPaymentAccepted] = useState(false);
    const [acceptances, setAcceptances] = useState({ loss: false, illiquidity: false, notGuaranteed: false, documents: false });
    const value = Number(amount);
    const remaining = Math.max(0, project.target - project.funded);
    const estimated = value * project.annualRate / 100 * project.duration / 12;
    const openProject = project.status === "FUNDING" && project.type === "DEBT" && remaining >= project.minInvestment && new Date(project.fundingDeadline).getTime() > Date.now();
    const invalid = !Number.isFinite(value) || value < Math.max(100, project.minInvestment) ? _t("La inversi\u00F3n m\u00EDnima es {value0}.", { value0: _money(Math.max(100, project.minInvestment)) }) : !Number.isInteger(value) ? "Introduce una cantidad entera de euros en esta demostración." : value > remaining ? _t("Quedan {value0} disponibles; no puedes superar el objetivo.", { value0: _money(remaining) }) : "";
    const approved = state?.user?.onboardingStatus === "APPROVED";
    async function confirm() {
        if (submitting.current) return;
        if ((!pending && invalid) || !Object.values(acceptances).every(Boolean) || !paymentAccepted) {
            setError(invalid || "Acepta cada advertencia y la simulación del proveedor de pagos.");
            return;
        }
        if (!scope) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        setAuthRequired(false);
        try {
            const intent = pending || readInvestmentIntent(window.sessionStorage, scope) || { key: crypto.randomUUID(), amount: value };
            saveInvestmentIntent(window.sessionStorage, scope, intent);
            setPendingRequest({ scope, intent });
            const result = await act("invest", { projectId: project.id, amount: intent.amount, idempotencyKey: intent.key, acceptances, paymentAccepted: true });
            if (!result.ok) {
                setAuthRequired(result.status === 401);
                if (result.status === 400 || result.status === 404) {
                    clearInvestmentIntent(window.sessionStorage, scope);
                    setPendingRequest(null);
                }
                setError(result.status === 0 || (result.status || 0) >= 500
                    ? "No hemos podido comprobar la confirmación. Conservamos tu solicitud para recuperarla sin duplicarla. Reintenta o consulta tu cartera."
                    : result.message);
                return;
            }
            if (!result.data?.id) throw new Error("Invalid investment response");
            clearInvestmentIntent(window.sessionStorage, scope);
            setPendingRequest(null);
            setConfirmation(result.data);
            setAmount(String(result.data.amount));
            setStep(2);
        }
        catch {
            setError("No se pudo completar la comprobación. Mantén esta pestaña y reintenta. Si el navegador bloquea su almacenamiento, habilítalo antes de confirmar.");
        }
        finally {
            submitting.current = false;
            setBusy(false);
        }
    }
    return <section className="investment-calculator" aria-label={_t("Simulador de inversi\u00F3n")}><div className="calculator-kicker"><span>{_t("SIMULA TU INVERSI\u00D3N")}</span><span>{_t("DEUDA \u00B7 EUR")}</span></div><h2>{_t("\u00BFQu\u00E9 quieres construir?")}</h2><p className="muted">{_t("Elige un importe para explorar un escenario orientativo.")}</p>{pending && <div className="notice investment-pending" role="status"><p>{_t("Hay una solicitud pendiente de comprobar. Revísala antes de iniciar otra inversión en este proyecto.")}</p><Button type="button" variant="secondary" onClick={review} disabled={busy}>{_t("Revisar solicitud pendiente")}</Button><Link href="/inversor/cartera">{_t("Consultar mi cartera")}</Link></div>}<div className="amount-presets">{_t([100, 500, 1000].map(n => <button type="button" key={n} aria-pressed={value === n} disabled={!!pending || busy} onClick={() => { setAmount(String(n)); setError(""); }}>{_t(_money(n))}</button>))}</div><label className="field">{_t("Cantidad personalizada (\u20AC)")}<input disabled={!!pending || busy} name="investmentAmount" type="number" min={Math.max(100, project.minInvestment)} max={remaining || undefined} step="1" inputMode="numeric" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} aria-describedby="investment-validation"/></label>{_t(invalid && !pending && <p className="field-error" id="investment-validation">{_t(invalid)}</p>)}<dl className="investment-summary"><div><dt>{_t("Capital comprometido")}</dt><dd>{_t(_money(Number.isFinite(value) ? value : 0))}</dd></div><div><dt>{_t("Plazo estimado")}</dt><dd>{_t(project.duration)}{_t(" meses")}</dd></div><div><dt>{_t("Tipo objetivo anual")}</dt><dd>{_t(project.annualRate)}{_t(" %")}</dd></div><div><dt>{_t("Rendimiento bruto estimado")}</dt><dd>{_t(_money(Number.isFinite(estimated) ? estimated : 0))}</dd></div><div><dt>{_t("Comisiones del inversor \u00B7 demo")}</dt><dd>{_t("0 \u20AC")}</dd></div><div className="total"><dt>{_t("Escenario bruto final")}</dt><dd>{_t(_money(Number.isFinite(value + estimated) ? value + estimated : 0))}</dd></div></dl><p className="calculator-note">{_t("C\u00E1lculo simple: capital \u00D7 tipo anual \u00D7 meses / 12. Antes de impuestos. No es una previsi\u00F3n ni una rentabilidad garantizada.")}</p>{_t(!openProject ? <p className="notice">{_t(project.type !== "DEBT" ? "Esta modalidad estará disponible en una fase futura. No admite compromisos." : project.status === "COMING_SOON" ? "Próximamente. Este proyecto aún no admite compromisos." : "La financiación está cerrada. Puedes consultar la información y seguir su evolución.")}</p> : !state?.user ? <Link className="button" href={`/acceso?next=${encodeURIComponent(`/proyectos/${project.slug}`)}`}>{_t("Acceder para invertir ")}<ArrowRight size={17}/></Link> : state.user.role !== "INVESTOR" ? <p className="notice">{_t("Accede con un perfil de inversor para realizar un compromiso ficticio.")}</p> : !approved ? <><p className="notice">{_t("Completa el onboarding y obt\u00E9n la aprobaci\u00F3n simulada antes de comprometer capital.")}</p><Link className="button" href="/onboarding">{_t("Completar mi perfil ")}<ArrowRight size={17}/></Link></> : <Button type="button" disabled={!!invalid || !!pending || busy} onClick={review}>{_t("Invertir \u00B7 demostraci\u00F3n ")}<ArrowRight size={17}/></Button>)}<p className="capital-risk"><LockKeyhole size={14}/>{_t(" Los fondos ser\u00EDan administrados por una entidad de pagos externa. No se mueve dinero real.")}</p><p className="risk-footnote">{_t("Puedes perder parte o todo el capital. Inversi\u00F3n il\u00EDquida y no cubierta por garant\u00EDa de dep\u00F3sitos.")}</p><Modal open={open} onOpenChange={value => { if (!busy)
        setOpen(value); }} title={_t(step === 2 ? confirmation?.replayed ? "Solicitud recuperada" : "Compromiso creado" : step === 1 ? "Proveedor de pagos simulado" : "Revisa tu compromiso")}>
      {_t(step === 0 && <div className="investment-review"><p><strong>{_t(project.name)}</strong>{_t(" \u00B7 ")}{_t(project.city)}</p><dl className="investment-summary"><div><dt>{_t("Compromiso ficticio")}</dt><dd>{_t(_money(value))}</dd></div><div><dt>{_t("Periodo de reflexi\u00F3n")}</dt><dd>{_t(state?.reflectionHours || 96)}{_t(" horas")}</dd></div><div><dt>{_t("Objetivo de financiaci\u00F3n")}</dt><dd>{_t("Todo o nada")}</dd></div></dl><p>{_t("Durante la reflexi\u00F3n puedes cancelar desde tu cartera. Si no se alcanza el objetivo m\u00EDnimo, los compromisos se cancelan y se registra un reembolso ficticio.")}</p><h3>{_t("Documentaci\u00F3n del proyecto")}</h3><ul className="review-docs">{_t(project.documents.map(document => <li key={document.id}><a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">{_t(document.name)} <ExternalLink size={14}/></a></li>))}</ul><fieldset className="risk-acceptances"><legend>{_t("Aceptaciones individuales")}</legend>{_t(([["loss", "Comprendo que puedo perder parte o todo el capital."], ["illiquidity", "Acepto que puede haber retrasos e impagos y que no existe liquidez garantizada."], ["notGuaranteed", "Comprendo que la rentabilidad objetivo y el plazo no están garantizados."], ["documents", "He revisado la documentación ficticia y las condiciones de esta demostración."]] as const).map(([key, text]) => <label className="check-row" key={key}><input type="checkbox" checked={acceptances[key]} onChange={e => setAcceptances(a => ({ ...a, [key]: e.target.checked }))}/><span>{_t(text)}</span></label>))}</fieldset><Button type="button" disabled={!Object.values(acceptances).every(Boolean)} onClick={() => setStep(1)}>{_t("Continuar al proveedor simulado ")}<ArrowRight size={16}/></Button></div>)}
      {_t(step === 1 && <div className="mock-payment"><div className="provider-mark"><Building2 size={30}/><span>{_t("ENTIDAD DE PAGOS")}<br /><strong>{_t("SIMULADOR EXTERNO")}</strong></span></div><p className="notice">{_t("Pantalla ficticia. No introduzcas una tarjeta, una cuenta bancaria ni datos de pago reales.")}</p><dl className="investment-summary"><div><dt>{_t("Importe del compromiso")}</dt><dd>{_t(_money(value))}</dd></div><div><dt>{_t("Referencia")}</dt><dd>{_t("CIMIENTO-DEMO")}</dd></div><div><dt>{_t("Cuenta ficticia")}</dt><dd>{_t("DEMO \u00B7\u00B7\u00B7\u00B7 0000")}</dd></div></dl><label className="check-row"><input type="checkbox" checked={paymentAccepted} onChange={e => setPaymentAccepted(e.target.checked)}/><span>{_t("Autorizo \u00FAnicamente el registro de este movimiento ficticio. Comprendo que no se realiza un pago real.")}</span></label>{_t(error && <p className="notice error" role="alert">{_t(error)}</p>)}{authRequired && <Link className="button secondary" href={"/acceso?next=" + encodeURIComponent("/proyectos/" + project.slug)}>{_t("Acceder para invertir")}</Link>}<div className="button-row"><Button type="button" variant="secondary" onClick={() => setStep(0)} disabled={busy}>{_t("Volver")}</Button><Button type="button" disabled={!paymentAccepted || busy} onClick={() => void confirm()}>{_t(busy ? "Registrando…" : "Confirmar compromiso ficticio")}<Check size={16}/></Button></div></div>)}
      {_t(step === 2 && <div className="investment-success"><CheckCircle2 size={46}/><h3>{_t("Una decisi\u00F3n, con tiempo para reflexionar.")}</h3><p>{_t("Hemos registrado tu compromiso ficticio de ")}<strong>{_t(_money(value))}</strong>{_t(" en ")}{_t(project.name)}{_t(".")}</p><p>{_t(confirmation?.replayed ? "La solicitud ya estaba registrada. Hemos recuperado tu compromiso sin duplicarlo." : "No se ha cobrado dinero real.")}</p>{confirmation && <><p>{_t("Estado")}: {_t(statusLabels[confirmation.status] || confirmation.status)}</p><p>{_t("Reflexión hasta")}: {_date(confirmation.reflectionEndsAt, {hour:"2-digit",minute:"2-digit"})}</p></>}<Link className="button" href="/inversor/cartera" onClick={() => setOpen(false)}>{_t("Consultar mi cartera ")}<ArrowRight size={16}/></Link></div>)}
    </Modal></section>;
}
export default InvestmentFlow;
