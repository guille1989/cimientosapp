import { randomUUID } from "node:crypto";
import { DomainError } from "./domain";

/** Demo contracts only. Real providers need durable webhooks, reconciliation and an outbox. */
export interface PaymentProvider {
  reserve(input: { userId: string; projectId: string; amountCents: number }): Promise<{ reference: string; administrator: string; simulated: true }>;
  cancel(reference: string): Promise<{ simulated: true }>;
  disburse(input: { projectId: string; milestoneId: string; amountCents: number; certified: boolean; approved: boolean }): Promise<{ reference: string; simulated: true }>;
}
export interface IdentityVerificationProvider {
  verifyFictionalDocument(filename: string): Promise<{ status: "SIMULATED_ACCEPTED"; simulated: true }>;
}
function demoOnly() { if (process.env.DEMO_MODE !== "true") throw new DomainError("Proveedor ficticio desactivado fuera de la demostración.", 503); }
export const paymentProvider: PaymentProvider = {
  async reserve(input) { demoOnly(); if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 10000) throw new DomainError("Importe de reserva ficticia no válido."); return { reference: `DEMO-${randomUUID()}`, administrator: "Entidad de pagos externa simulada", simulated: true }; },
  async cancel(reference) { demoOnly(); if (!reference.startsWith("DEMO-")) throw new DomainError("Referencia ficticia no válida."); return { simulated: true }; },
  async disburse(input) { demoOnly(); if (!input.certified || !input.approved) throw new DomainError("El desembolso requiere certificación simulada y aprobación administrativa."); return { reference: `DEMO-${randomUUID()}`, simulated: true }; },
};
export const identityVerificationProvider: IdentityVerificationProvider = {
  async verifyFictionalDocument(filename) { demoOnly(); if (!/demo|fictici|ejemplo/i.test(filename)) throw new DomainError("Utiliza únicamente el documento ficticio de demostración."); return { status: "SIMULATED_ACCEPTED", simulated: true }; },
};
