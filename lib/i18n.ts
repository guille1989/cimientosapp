import en from "@/messages/en.json";
import es from "@/messages/es.json";
export const locales = ["es", "en"] as const;
export type Locale = typeof locales[number];
export type MessageValues = Record<string, string | number | boolean | null | undefined>;
export const LOCALE_COOKIE = "cimiento_locale";
export const defaultLocale: Locale = "es";
export const isLocale = (value: unknown): value is Locale => value === "es" || value === "en";
export const normalizeLocale = (value: unknown): Locale => isLocale(value) ? value : defaultLocale;
export const intlLocale = (locale: Locale) => locale === "en" ? "en-GB" : "es-ES";
const english: Record<string, string> = en;
const spanish: Record<string, string> = es;
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const reversed = new Map(Object.entries(english).map(([source, target]) => [normalize(target), source]));
const escapeRegex = (value: string) => value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
function compileTemplates(entries: [string, string][]) {
  return entries.filter(([source]) => source.includes("{value") && source.replace(/\{value\d+\}/g, "").length >= 10).map(([source, target]) => {
    const names: string[] = []; let position = 0; let pattern = "^";
    for (const match of source.matchAll(/\{(value\d+)\}/g)) {
      pattern += escapeRegex(source.slice(position, match.index)) + "([\\s\\S]*?)";
      names.push(match[1]); position = match.index! + match[0].length;
    }
    pattern += escapeRegex(source.slice(position)) + "$";
    return { source, target, names, regex: new RegExp(pattern) };
  }).sort((a,b) => b.source.length-a.source.length);
}
const templates = {
  en: compileTemplates(Object.entries(english)),
  es: compileTemplates(Object.entries(english).map(([a,b])=>[b,a])),
};
/** Localises curated application messages. Unknown names and authored text are kept verbatim. */
export function translate<T>(locale: Locale, message: T, values?: MessageValues): T {
  if (typeof message !== "string") return message;
  const key = normalize(message);
  const sourceKey = locale === "es" && !Object.hasOwn(spanish,key) ? reversed.get(key) : key;
  let result = locale === "en"
    ? Object.hasOwn(english,key) ? english[key] : undefined
    : sourceKey && Object.hasOwn(spanish,sourceKey) ? spanish[sourceKey] : undefined;
  let parameters = values;
  // Compatibility with system notifications and seed content stored before i18n existed.
  if (result === undefined && !values) for (const template of templates[locale]) {
    const match = template.regex.exec(key);
    if (match) {
      result = template.target;
      parameters = Object.fromEntries(template.names.map((name,i)=>[name,match[i+1]]));
      break;
    }
  }
  result ??= message;
  if (parameters) result = result.replace(/\{([\w]+)\}/g, (token, name) =>
    Object.hasOwn(parameters!, name) ? String(parameters![name] ?? "") : token);
  if (result !== message && message !== message.trim())
    result = (message.match(/^\s+/)?.[0] || "") + result.trim() + (message.match(/\s+$/)?.[0] || "");
  return result as T;
}
export function formatMoney(value: number, locale: Locale, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "EUR", maximumFractionDigits: 2, ...options }).format(value);
}
export function pluralMessage(locale: Locale, count: number, singular: string, plural: string) {
  return translate(locale, new Intl.PluralRules(intlLocale(locale)).select(count) === "one" ? singular : plural, { count });
}
export function formatDate(value: string | Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid", ...options }).format(new Date(value));
}
export function requestLocale(request: Request): Locale {
  const header = request.headers.get("x-cimiento-locale");
  if (isLocale(header)) return header;
  const cookie = request.headers.get("cookie")?.split(";").map(v=>v.trim())
    .find(v=>v.startsWith(LOCALE_COOKIE+"="))?.split("=")[1];
  return normalizeLocale(cookie);
}
