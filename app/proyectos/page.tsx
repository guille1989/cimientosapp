import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { Marketplace } from "@/components/projects";
export async function generateMetadata() { const locale=await getServerLocale(); return {title:translate(locale,"Proyectos inmobiliarios | Cimiento")}; }
export default function ProjectsPage() { return <Marketplace />; }
