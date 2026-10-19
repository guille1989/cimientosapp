import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PUBLIC_STATUSES } from "@/lib/domain";
import { formatDate, formatMoney, requestLocale, translate } from "@/lib/i18n";
import { statusLabels } from "@/lib/status-labels";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = requestLocale(request);
  const t = <T>(message:T) => translate(locale,message);
  const { id } = await params;
  const user = await getCurrentUser();
  let content = ""; let name = "cimiento-demo";
  const document = await db.projectDocument.findUnique({ where: { id }, include: { project: true } });
  if (document && (PUBLIC_STATUSES.includes(document.project.status) || user?.role === "ADMIN" || document.project.promoterId === user?.id)) {
    name = t(document.name);
    content = [
      t(document.name),
      t("Proyecto") + ": " + document.project.name,
      t("Categoría") + ": " + t(document.category), "",
      t("Documento generado exclusivamente para demostración."),
      t("Incluye información ficticia de análisis, presupuesto y calendario. No es un contrato válido ni sustituye documentación regulatoria o asesoramiento."), "",
      t("Los fondos se representan administrados por un proveedor externo simulado y se desembolsan por hitos certificados ficticios. Rentabilidad objetivo no garantizada. Posible pérdida total o parcial e iliquidez."),
    ].join("\n");
  }
  if (!content && user) {
    const investmentId = id.replace(/^(contract-|confirmation-|tax-|report-)/, "");
    const commitment = await db.investmentCommitment.findFirst({
      where: { id: investmentId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
      include: { project: true },
    });
    if (commitment) {
      name = (id.startsWith("tax-") ? "tax-demo-" : "confirmation-demo-") + commitment.id;
      content = [
        t("DOCUMENTO FICTICIO SIN VALIDEZ JURÍDICA O FISCAL"),
        t("Referencia") + ": " + commitment.id,
        t("Proyecto") + ": " + commitment.project.name,
        t("Capital ficticio") + ": " + formatMoney(commitment.amountCents / 100, locale),
        t("Estado") + ": " + t(statusLabels[commitment.status] || commitment.status),
        t("Fecha") + ": " + formatDate(commitment.createdAt, locale),
        t("Reflexión hasta") + ": " + formatDate(commitment.reflectionEndsAt, locale, { hour: "2-digit", minute: "2-digit" }), "",
        t("No se ha procesado dinero real. Rentabilidad no garantizada. Puedes perder parte o todo el capital. Este documento no acredita ninguna inversión real."),
      ].join("\n");
    }
  }
  if (!content) return Response.json({ ok: false, message: t("Documento no encontrado o sin permiso de acceso.") }, { status: 404 });
  return new Response(t("Entorno de demostración. Los proyectos, rentabilidades y movimientos mostrados son ficticios.") + "\n\n" + content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Language": locale,
      "Content-Disposition": 'attachment; filename="' + name.replace(/[^a-zA-Z0-9-]/g, "-").slice(0,90) + '.txt"',
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    },
  });
}
