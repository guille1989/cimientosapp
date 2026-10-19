import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
const cell = (value: unknown) => typeof value === "number" ? value.toFixed(2) : `"${String(value).replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`;
const validTypes = ["COMMITMENT", "CANCELLATION", "REFUND", "DISTRIBUTION", "CAPITAL_RETURN", "ADJUSTMENT", "DISBURSEMENT"];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, message: "Inicia sesión para exportar tus movimientos." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const projectId = params.get("projectId");
  const from = params.get("from");
  if (type && !validTypes.includes(type)) return Response.json({ ok: false, message: "Tipo de movimiento no válido." }, { status: 400 });
  if (projectId && projectId.length > 100) return Response.json({ ok: false, message: "Proyecto no válido." }, { status: 400 });
  let fromDate: Date | undefined;
  if (from) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return Response.json({ ok: false, message: "Fecha de inicio no válida." }, { status: 400 });
    fromDate = new Date(`${from}T00:00:00.000Z`);
    if (Number.isNaN(fromDate.getTime()) || fromDate.toISOString().slice(0, 10) !== from) return Response.json({ ok: false, message: "Fecha de inicio no válida." }, { status: 400 });
  }
  const items = await db.transaction.findMany({
    where: { userId: user.id, ...(type ? { type: type as any } : {}), ...(projectId ? { projectId } : {}), ...(fromDate ? { createdAt: { gte: fromDate } } : {}) },
    include: { project: { select: { name: true } } }, orderBy: { createdAt: "desc" },
  });
  const lines = ["DEMOSTRACIÓN;Datos ficticios;Sin dinero real", "Fecha;Proyecto;Tipo;Importe EUR;Descripción", ...items.map(t => [t.createdAt.toISOString(), t.project.name, t.type, t.amountCents / 100, t.description].map(cell).join(";"))];
  return new Response("\uFEFF" + lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=cimiento-movimientos-demo.csv", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
