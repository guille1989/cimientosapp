import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
const spanishMetadata: Metadata = { title: { default: "Cimiento — Invertir en lo que se construye", template: "%s · Cimiento" }, description: "Plataforma de demostración de financiación participativa inmobiliaria. Proyectos ficticios, inversión desde 100 € y seguimiento por hitos.", robots: { index: false, follow: false } };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const locale = await getServerLocale(); return <html lang={locale} data-scroll-behavior="smooth"><body><I18nProvider initialLocale={locale}><AppProvider><AppShell>{children}</AppShell></AppProvider></I18nProvider></body></html>; }

export async function generateMetadata(): Promise<Metadata> { const locale = await getServerLocale(); return {...spanishMetadata,title:{default:translate(locale,"Cimiento — Invertir en lo que se construye"),template:"%s · Cimiento"},description:translate(locale,String(spanishMetadata.description)),other:{"content-language":locale}}; }
