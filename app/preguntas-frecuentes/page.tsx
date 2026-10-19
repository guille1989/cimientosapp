import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { FAQs } from "@/components/public-info";
export async function generateMetadata() { const locale=await getServerLocale(); return {title:translate(locale,"Preguntas frecuentes | Cimiento")}; }
export default function FAQsPage() { return <FAQs />; }
