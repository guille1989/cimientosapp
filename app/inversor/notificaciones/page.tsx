"use client";
import { useI18n } from "@/components/i18n-provider";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Mail } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Button, EmptyState, LoadingState, PageHeading } from "@/components/ui";
import { date } from "@/components/investor-shared";
const preferenceLabels = [["newProjects", "Nuevos proyectos", "Avisos cuando se publique una nueva oportunidad ficticia."], ["construction", "Avances de obra", "Nuevos informes, fotografías y hitos certificados simulados."], ["delays", "Cambios de plazo", "Revisiones del calendario previsto de tus proyectos."], ["distributions", "Distribuciones", "Capital e intereses ficticios registrados."], ["incidents", "Incidencias", "Información sobre retrasos, impagos o recuperación."], ["documents", "Documentos disponibles", "Contratos, informes y certificados de demostración."]];
export default function NotificationsPage() {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const { state, loading, act } = useApp();
    const [preferences, setPreferences] = useState<Record<string, boolean>>({});
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [unreadOnly, setUnreadOnly] = useState(false);
    useEffect(() => { if (state?.user && !ready) {
        setPreferences(Object.fromEntries(preferenceLabels.map(([key]) => [key, state.user?.notificationPreferences?.[key] ?? true])));
        setReady(true);
    } }, [state, ready]);
    if (loading || !state)
        return <LoadingState />;
    async function save() { setBusy(true); setError(""); setMessage(""); try {
        const result = await act("savePreferences", { preferences });
        if (!result.ok)
            setError(result.message);
        else
            setMessage("Preferencias de demostración guardadas.");
    }
    catch {
        setError("No se han guardado los cambios. Vuelve a intentarlo.");
    }
    finally {
        setBusy(false);
    } }
    async function mark(id: string) { setError(""); try {
        const result = await act("markNotification", { id });
        if (!result.ok)
            setError(result.message);
    }
    catch {
        setError("No se ha podido actualizar la notificación.");
    } }
    const notifications = state.notifications.filter(n => !unreadOnly || !n.read);
    return <><PageHeading eyebrow={_t("INVERSOR")} title={_t("Al d\u00EDa, a tu manera.")} description={_t("Consulta la actividad de tus proyectos y elige qu\u00E9 comunicaciones quieres recibir.")}/>{_t(error && <p role="alert" className="notice error">{_t(error)}</p>)}<div className="notification-layout"><section className="panel"><div className="section-heading"><h2><Bell size={20}/>{_t(" Bandeja de actividad")}</h2><label className="inline-check"><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)}/>{_t(" Solo sin leer")}</label></div>{_t(notifications.length ? <ul className="notification-list">{_t(notifications.map(n => <li className={n.read ? "read" : "unread"} key={n.id}><div><span className="small muted">{_t(_date(n.createdAt))} {_t(!n.read && <span className="unread-dot" aria-label={_t("Sin leer")}/>)}</span><h3>{_t(n.title)}</h3><p>{_t(n.content)}</p></div>{_t(!n.read && <button type="button" aria-label={_t(_t("Marcar como le\u00EDda: {value0}", { value0: _t(n.title) }))} onClick={() => void mark(n.id)}><CheckCheck size={19}/></button>)}</li>))}</ul> : <EmptyState title={_t("Est\u00E1s al d\u00EDa")} description={_t("Las nuevas actualizaciones de tus proyectos aparecer\u00E1n aqu\u00ED.")}/>)}</section><section className="panel notification-preferences"><h2><Mail size={20}/>{_t(" Preferencias")}</h2><p className="muted small">{_t("Se guardan en tu cuenta ficticia. Esta demostraci\u00F3n no env\u00EDa correos ni notificaciones externas.")}</p><form onSubmit={e => { e.preventDefault(); void save(); }}>{_t(preferenceLabels.map(([key, title, description]) => <label className="preference-row" key={key}><span><strong>{_t(title)}</strong><small>{_t(description)}</small></span><input type="checkbox" role="switch" aria-label={_t(title)} checked={preferences[key] ?? true} onChange={e => { setPreferences(p => ({ ...p, [key]: e.target.checked })); setMessage(""); }}/></label>))}{_t(message && <p role="status" className="notice success">{_t(message)}</p>)}<Button type="submit" disabled={busy}>{_t(busy ? "Guardando…" : "Guardar preferencias")}</Button></form></section></div></>;
}
