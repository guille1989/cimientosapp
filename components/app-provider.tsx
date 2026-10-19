"use client";
import { useI18n } from "@/components/i18n-provider";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ActionResult, AppState } from "@/lib/types";
type ContextValue = {
    state: AppState | null;
    loading: boolean;
    error: string;
    refresh: () => Promise<void>;
    act: (action: string, payload?: Record<string, any>) => Promise<ActionResult>;
};
const Context = createContext<ContextValue | null>(null);
export function AppProvider({ children }: {
    children: React.ReactNode;
}) {
    const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n();
    const pathname = usePathname();
    const [state, setState] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const refresh = useCallback(async () => {
        try {
            const response = await fetch("/api/state", { cache: "no-store", credentials: "same-origin", headers: {"x-cimiento-locale": _locale} });
            if (!response.ok)
                throw new Error("No hemos podido cargar los datos. Comprueba que la base de datos está preparada.");
            const data = await response.json();
            setState(data);
            setError("");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Error de conexión. Inténtalo de nuevo.");
        }
        finally {
            setLoading(false);
        }
    }, [_locale]);
    useEffect(() => { void refresh(); }, [refresh, pathname]);
    useEffect(() => { const onFocus = () => { void refresh(); }; const timer = setInterval(onFocus, 60000); window.addEventListener("focus", onFocus); return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); }; }, [refresh, _locale]);
    useEffect(() => { if (!toast)
        return; const timer = setTimeout(() => setToast(""), 5500); return () => clearTimeout(timer); }, [toast]);
    const act = useCallback(async (action: string, payload: Record<string, any> = {}): Promise<ActionResult> => {
        try {
            const response = await fetch("/api/actions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "x-cimiento-locale": _locale }, body: JSON.stringify({ action, payload }) });
            const result: ActionResult = await response.json();
            if (!response.ok || !result.ok)
                return { ok: false, status: response.status, message: result.message || "La operación no se ha completado. Revisa los datos." };
            await refresh();
            if (result.message)
                setToast(result.message);
            return result;
        }
        catch {
            return { ok: false, status: 0, message: "No hay conexión con el servidor. Tu operación no se ha confirmado; puedes reintentarlo." };
        }
    }, [refresh]);
    return <Context.Provider value={{ state, loading, error, refresh, act }}>{_t(children)}{_t(toast && <div className="toast" role="status"><span className="status-dot"/>{_t(toast)}<button aria-label={_t("Cerrar notificaci\u00F3n")} onClick={() => setToast("")}>{_t("\u00D7")}</button></div>)}</Context.Provider>;
}
export function useApp() { const context = useContext(Context); if (!context)
    throw new Error("AppProvider requerido"); return context; }
