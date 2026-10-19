"use client";
import { useI18n } from "@/components/i18n-provider";
import { Button, EmptyState } from "@/components/ui";
export default function Error({ reset }: {
    error: Error;
    reset: () => void;
}) { const { t: _t, locale: _locale, formatMoney: _money, formatDate: _date } = useI18n(); return <EmptyState title={_t("No hemos podido abrir esta pantalla")} description={_t("Puedes reintentar la carga. Las operaciones confirmadas se conservan en la base de datos.")}><Button onClick={reset}>{_t("Reintentar")}</Button></EmptyState>; }
