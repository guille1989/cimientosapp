import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { Risks } from "@/components/public-info";
export async function generateMetadata() { const locale=await getServerLocale(); return {title:translate(locale,"Riesgos de la inversión | Cimiento")}; }
export default function RisksPage() { return <Risks />; }
