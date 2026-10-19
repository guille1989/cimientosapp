export type InvestmentIntent = { key: string; amount: number };
export const intentStorageKey = (userId: string, projectId: string) =>
  "cimiento:investment:" + userId + ":" + projectId;
export function readInvestmentIntent(storage: Storage, scope: string): InvestmentIntent | null {
  try {
    const value = JSON.parse(storage.getItem(scope) || "null");
    if (value && typeof value.key === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.key) &&
      Number.isSafeInteger(value.amount) && value.amount >= 100) return value;
  } catch { /* Unavailable or invalid storage is handled before submitting. */ }
  return null;
}
export function saveInvestmentIntent(storage: Storage, scope: string, intent: InvestmentIntent) {
  storage.setItem(scope, JSON.stringify(intent));
}
export function clearInvestmentIntent(storage: Storage, scope: string) {
  try { storage.removeItem(scope); } catch { /* Retaining an old key is safer than rotating it on an uncertain result. */ }
}
