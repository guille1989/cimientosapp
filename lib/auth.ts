import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";
import { DomainError } from "./domain";

const COOKIE = "cimiento_demo_session";
export function hashPassword(password: string): string { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPassword(password: string, stored: string): boolean { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export const sessionHash = (value: string) => createHash("sha256").update(value).digest("hex");
// Demo-only adapter. Replace with an audited identity provider before production.
export interface IdentityProvider { currentUser(): Promise<Awaited<ReturnType<typeof db.user.findUnique>>>; createSession(userId: string): Promise<void>; logout(): Promise<void>; }
export const demoIdentity: IdentityProvider = {
  async currentUser() { const value = (await cookies()).get(COOKIE)?.value; if (!value) return null; const session = await db.session.findUnique({ where: { id: sessionHash(value) }, include: { user: true } }); return session && session.expiresAt > new Date() ? session.user : null; },
  async createSession(userId) { const value = randomBytes(32).toString("base64url"); const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }); await db.session.create({ data: { id: sessionHash(value), userId, expiresAt } }); (await cookies()).set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt }); },
  async logout() { const jar = await cookies(); const value = jar.get(COOKIE)?.value; if (value) await db.session.deleteMany({ where: { id: sessionHash(value) } }); jar.delete(COOKIE); },
};
export const getCurrentUser = () => demoIdentity.currentUser();
export function requireDemo() { if (process.env.DEMO_MODE !== "true") throw new DomainError("Este adaptador solo está disponible en modo demostración.", 503); }
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, maximum = 120, period = 60_000) { const now = Date.now(); if (buckets.size > 5000) for (const [k, v] of buckets) if (v.until < now) buckets.delete(k); const current = buckets.get(key); if (!current || current.until < now) buckets.set(key, { count: 1, until: now + period }); else { current.count++; if (current.count > maximum) throw new DomainError("Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo.", 429); } }
export function validateOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next may normalize request.url to localhost while the browser used 127.0.0.1.
  // Compare against the actual HTTP Host; never trust arbitrary forwarded origins.
  const host = request.headers.get("host") || url.host;
  const expected = process.env.APP_ORIGIN || `${url.protocol}//${host}`;
  if (origin && origin !== expected) throw new DomainError("Origen de solicitud no permitido.", 403);
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") throw new DomainError("Solicitud entre sitios no permitida.", 403);
}
