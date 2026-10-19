import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { HowItWorks } from "@/components/public-info";
export async function generateMetadata() { const locale=await getServerLocale(); return {title:translate(locale,"Cómo funciona | Cimiento")}; }
export default function HowPage() { return <HowItWorks />; }
