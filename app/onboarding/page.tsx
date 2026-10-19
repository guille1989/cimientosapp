"use client";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Save, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button, LoadingState, RoleGate } from "@/components/ui";
import { AccountStatus } from "@/components/investor-shared";
import "@/components/investor.css";
const steps = ["Datos personales", "Residencia fiscal", "Identidad ficticia", "Situación laboral", "Experiencia inversora", "Objetivos", "Capacidad de pérdida", "Origen de fondos", "Conocimientos", "Advertencias"];
type Values = Record<string, string | boolean>;
const initial: Values = { name: "", birthYear: "1988", taxCountry: "España", identityFile: "", employment: "", experience: "", objective: "", lossCapacity: "", sourceOfFunds: "", knowledge1: "", knowledge2: "", knowledge3: "", riskAccepted: false };
export default function OnboardingPage() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <RoleGate role="INVESTOR"><Onboarding /></RoleGate>; }
function Onboarding() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, act } = useApp();
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<Values>(initial);
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [finished, setFinished] = useState(false);
    useEffect(() => { if (state && !ready) {
        const saved = state.onboarding || {};
        const savedValues = saved.values || saved;
        setValues({ ...initial, name: state.user?.name || "", ...savedValues });
        setStep(Math.min(9, Math.max(0, Number(saved.step || 1) - 1)));
        setReady(true);
    } }, [state, ready]);
    if (loading || !state || !ready)
        return <LoadingState />;
    const set = (key: string, value: string | boolean) => { setValues(current => ({ ...current, [key]: value })); setError(""); setMessage(""); };
    const score = [values.knowledge1 === "loss", values.knowledge2 === "illiquid", values.knowledge3 === "external"].filter(Boolean).length;
    const unsuitable = score < 2 || values.lossCapacity === "none" || values.experience === "none" || values.objective === "liquidity";
    const required = [["name", "birthYear"], ["taxCountry"], ["identityFile"], ["employment"], ["experience"], ["objective"], ["lossCapacity"], ["sourceOfFunds"], ["knowledge1", "knowledge2", "knowledge3"], ["riskAccepted"]][step];
    async function save(advance = false) {
        if (advance && required.some(key => !values[key])) {
            setError("Completa todos los campos de este paso antes de continuar.");
            return;
        }
        if (advance && step === 0 && (Number(values.birthYear) > new Date().getFullYear() - 18 || Number(values.birthYear) < 1900)) {
            setError("Introduce un año ficticio correspondiente a una persona mayor de edad.");
            return;
        }
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const result = await act("saveOnboarding", { step: advance && step < 9 ? step + 2 : step + 1, values, submit: advance && step === 9 });
            if (!result.ok) {
                setError(result.message);
                return;
            }
            if (advance && step === 9)
                setFinished(true);
            else if (advance)
                setStep(s => s + 1);
            else
                setMessage("Borrador guardado. Puedes salir y continuar en otro momento.");
        }
        catch {
            setError("No se ha podido guardar. Tus respuestas siguen en pantalla; vuelve a intentarlo.");
        }
        finally {
            setBusy(false);
        }
    }
    function select(key: string, title: string, options: [
        string,
        string
    ][]) { return <label className="field">{_t(title)}<select value={String(values[key] || "")} onChange={e => set(key, e.target.value)} required><option value="">{_t("Selecciona una opci\u00F3n")}</option>{_t(options.map(([value, text]) => <option key={value} value={value}>{_t(text)}</option>))}</select></label>; }
    if (finished)
        return <div className="container onboarding-result"><ShieldCheck size={45}/><span className="eyebrow">{_t("EVALUACI\u00D3N DE DEMOSTRACI\u00D3N")}</span><h1>{_t("Tu perfil ya tiene una base.")}</h1><AccountStatus status={state.user?.onboardingStatus || (unsuitable ? "REVIEW" : "APPROVED")}/><p>{_t("Resultado del test: ")}<strong>{_t(score)}{_t(" de 3 respuestas correctas.")}</strong></p>{_t(unsuitable ? <div className="notice warning"><strong>{_t("Este producto puede no ser adecuado para ti.")}</strong><p>{_t("Tu experiencia, capacidad de p\u00E9rdida o resultado del test requiere revisi\u00F3n manual de demostraci\u00F3n. Un administrador puede revisar tu perfil. La aceptaci\u00F3n de riesgos no garantiza la aprobaci\u00F3n.")}</p></div> : <p>{_t("Has completado los pasos y aceptado expresamente los riesgos. El estado mostrado corresponde exclusivamente a una verificaci\u00F3n simulada.")}</p>)}<div className="button-row"><Link className="button" href="/inversor">{_t("Ir a mi panel ")}<ArrowRight size={17}/></Link><Link className="button secondary" href="/proyectos">{_t("Explorar proyectos")}</Link></div></div>;
    return <div className="container onboarding-layout"><aside><span className="eyebrow">{_t("CONOZC\u00C1MONOS \u00B7 DEMOSTRACI\u00D3N")}</span><h1>{_t("Antes de")}<br />{_t("dar el paso.")}</h1><p>{_t("Estas preguntas ayudan a comprender c\u00F3mo funciona la evaluaci\u00F3n de un inversor. No facilites informaci\u00F3n ni documentos reales.")}</p><ol className="onboarding-steps">{_t(steps.map((name, i) => <li key={name} aria-current={step === i ? "step" : undefined}><span>{_t(i < step ? <Check size={14}/> : String(i + 1).padStart(2, "0"))}</span>{_t(name)}</li>))}</ol></aside><section className="panel onboarding-form"><div className="step-top"><span>{_t("Paso ")}{_t(step + 1)}{_t(" de ")}{_t(steps.length)}</span><span>{_t(Math.round((step + 1) / steps.length * 100))}{_t(" %")}</span></div><progress aria-label={_t("Progreso del onboarding")} value={step + 1} max={steps.length}/><h2>{_t(steps[step])}</h2><p className="muted">{_t("Todos los datos de este formulario deben ser inventados.")}</p><form onSubmit={e => { e.preventDefault(); void save(true); }}>
    {_t(step === 0 && <><label className="field">{_t("Nombre completo ficticio")}<input value={String(values.name)} onChange={e => set("name", e.target.value)} minLength={2} maxLength={80} required/></label><label className="field">{_t("A\u00F1o de nacimiento ficticio")}<input type="number" value={String(values.birthYear)} min={1900} max={new Date().getFullYear() - 18} onChange={e => set("birthYear", e.target.value)} required/><small>{_t("La demostraci\u00F3n est\u00E1 reservada a perfiles mayores de edad.")}</small></label></>)}
    {_t(step === 1 && <>{_t(select("taxCountry", "País de residencia fiscal ficticio", [["España", "España"], ["Portugal", "Portugal"], ["Francia", "Francia"], ["Otro", "Otro país"]]))}<p className="notice">{_t("El mercado inicial de Cimiento es Espa\u00F1a. La fiscalidad depender\u00EDa de la situaci\u00F3n individual y requiere asesoramiento profesional en un servicio real.")}</p></>)}
    {_t(step === 2 && <div className="demo-upload"><ShieldCheck size={32}/><h3>{_t("Identidad de prueba")}</h3><p>{_t("No subas tu DNI, NIE ni pasaporte. Selecciona el archivo ficticio preparado para esta demostraci\u00F3n.")}</p><Button type="button" variant="secondary" onClick={() => set("identityFile", "IDENTIDAD_FICTICIA_DEMO.pdf")}>{_t(values.identityFile ? "Documento ficticio adjuntado ✓" : "Adjuntar identidad ficticia")}</Button>{_t(values.identityFile && <p className="success-text">{_t(String(values.identityFile))}{_t(" \u00B7 Datos inventados \u00B7 Sin archivo real")}</p>)}</div>)}
    {_t(step === 3 && select("employment", "Situación laboral simulada", [["employed", "Trabajo por cuenta ajena"], ["self", "Trabajo por cuenta propia"], ["retired", "Jubilación"], ["other", "Otra situación"]]))}
    {_t(step === 4 && select("experience", "Experiencia con inversiones no garantizadas", [["none", "No tengo experiencia"], ["basic", "Conozco sus riesgos y he invertido alguna vez"], ["experienced", "Tengo experiencia con inversiones similares"]]))}
    {_t(step === 5 && select("objective", "Objetivo de inversión ficticio", [["diversification", "Diversificar a medio o largo plazo"], ["growth", "Buscar crecimiento asumiendo riesgo"], ["income", "Buscar rendimientos potenciales"], ["liquidity", "Necesito recuperar el dinero a corto plazo"]]))}
    {_t(step === 6 && <>{_t(select("lossCapacity", "¿Qué pérdida podrías soportar en este supuesto?", [["none", "No puedo permitirme perder capital"], ["partial", "Podría perder parte del importe"], ["total", "Podría asumir la pérdida de todo el importe invertido"]]))}<div className="notice warning">{_t("Puedes perder parte o la totalidad de la inversi\u00F3n. No debes comprometer dinero necesario para tus gastos o emergencias.")}</div></>)}
    {_t(step === 7 && select("sourceOfFunds", "Origen ficticio de los fondos", [["salary", "Ahorro procedente de trabajo"], ["business", "Actividad empresarial"], ["sale", "Venta de un activo"], ["inheritance", "Herencia ficticia"], ["other", "Otro origen de demostración"]]))}
    {_t(step === 8 && <>{_t(select("knowledge1", "1. Si el promotor no puede devolver el préstamo…", [["guaranteed", "Siempre recupero mi capital"], ["loss", "Puedo perder parte o todo el capital"], ["deposit", "Lo cubre un fondo de garantía de depósitos"]]))}{_t(select("knowledge2", "2. ¿Puedo retirar mi inversión en cualquier momento?", [["daily", "Sí, existe liquidez diaria garantizada"], ["illiquid", "No; puede ser ilíquida hasta su devolución"], ["secondary", "Siempre habrá otro inversor que la compre"]]))}{_t(select("knowledge3", "3. En el modelo previsto, ¿quién administra los fondos?", [["cimiento", "Cimiento en su cuenta operativa"], ["external", "Una entidad de pagos externa"], ["promoter", "El promotor desde el primer día"]]))}</>)}
    {_t(step === 9 && <><div className={`notice ${unsuitable ? "warning" : ""}`}><strong>{_t("Resultado: ")}{_t(score)}{_t(" / 3 respuestas correctas.")}</strong><p>{_t(unsuitable ? "El producto puede no ser adecuado para ti. Este perfil quedará sujeto a revisión manual simulada." : "Has identificado los riesgos principales del modelo. Este resultado no garantiza que una inversión sea adecuada.")}</p></div><ul className="risk-list"><li>{_t("Puedo perder parte o todo el capital.")}</li><li>{_t("La rentabilidad objetivo no est\u00E1 garantizada.")}</li><li>{_t("Los plazos pueden alargarse y puede haber impagos.")}</li><li>{_t("No existe un mercado secundario ni liquidez garantizada.")}</li><li>{_t("La inversi\u00F3n no est\u00E1 cubierta por un fondo de garant\u00EDa de dep\u00F3sitos.")}</li></ul><label className="check-row"><input type="checkbox" checked={!!values.riskAccepted} onChange={e => set("riskAccepted", e.target.checked)} required/><span>{_t("He le\u00EDdo y acepto expresamente estos riesgos. Comprendo que este entorno, su identificaci\u00F3n y sus verificaciones son ficticios.")}</span></label></>)}
    {_t(error && <p className="notice error" role="alert">{_t(error)}</p>)}{_t(message && <p className="notice" role="status">{_t(message)}</p>)}<div className="onboarding-actions"><Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => { setStep(s => s - 1); setError(""); }}><ArrowLeft size={16}/>{_t("Anterior")}</Button><Button type="submit" disabled={busy}>{_t(busy ? "Guardando…" : step === 9 ? "Aceptar y completar" : "Continuar")}<ArrowRight size={16}/></Button></div><Button type="button" variant="ghost" onClick={() => void save(false)} disabled={busy}><Save size={15}/>{_t(" Guardar y continuar m\u00E1s tarde")}</Button></form></section></div>;
}
