"use client";
import { useI18n } from "@/components/i18n-provider";
import Link from "next/link";
export default function NotFound() { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <div className="access-state"><p className="eyebrow">{_t("404 \u00B7 Esta p\u00E1gina no existe")}</p><h1>{_t("Volvamos a los cimientos.")}</h1><p>{_t("La direcci\u00F3n no est\u00E1 disponible o el proyecto a\u00FAn no se ha publicado.")}</p><Link className="button button-primary" href="/proyectos">{_t("Explorar proyectos")}</Link></div>; }
