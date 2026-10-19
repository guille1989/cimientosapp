"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatMoney, isLocale, LOCALE_COOKIE, translate, type Locale, type MessageValues } from "@/lib/i18n";
type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: <T>(message: T, values?: MessageValues) => T; formatMoney: (value: number, options?: Intl.NumberFormatOptions) => string; formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string };
const Context = createContext<I18nContextValue | null>(null);
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale); const router = useRouter();
  useEffect(()=>{ document.documentElement.lang = locale; },[locale]);
  const setLocale = useCallback((next: Locale) => { if(!isLocale(next)||next===locale)return; document.cookie = LOCALE_COOKIE+"="+next+"; Path=/; Max-Age=31536000; SameSite=Lax"+(location.protocol==="https:"?"; Secure":""); updateLocale(next); document.documentElement.lang=next; router.refresh(); },[locale,router]);
  const t = useCallback(function localize<T>(message: T, values?: MessageValues) { return translate(locale,message,values); },[locale]);
  const value = useMemo(()=>({ locale, setLocale, t, formatMoney:(amount:number,options?:Intl.NumberFormatOptions)=>formatMoney(amount,locale,options), formatDate:(value:string|Date,options?:Intl.DateTimeFormatOptions)=>formatDate(value,locale,options) }),[locale,setLocale,t]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() { const value=useContext(Context); if(!value)throw new Error("I18nProvider is required"); return value; }
export function LanguageSelector() {
  const {locale,setLocale,t}=useI18n();
  return <div className="language-selector"><label className="sr-only" htmlFor="cimiento-language">{t("Idioma")}</label><select id="cimiento-language" aria-label={t("Idioma")} value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="es" lang="es">Español</option><option value="en" lang="en">English</option></select></div>;
}
