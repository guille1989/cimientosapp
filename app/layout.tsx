import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Cimiento — Invertir en lo que se construye", template: "%s · Cimiento" }, description: "Plataforma de demostración de financiación participativa inmobiliaria. Proyectos ficticios, inversión desde 100 € y seguimiento por hitos.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es" data-scroll-behavior="smooth"><body><AppProvider><AppShell>{children}</AppShell></AppProvider></body></html>; }
