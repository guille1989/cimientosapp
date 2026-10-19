import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { performAction } from "@/lib/services";
import { DomainError } from "@/lib/domain";
import { rateLimit, validateOrigin } from "@/lib/auth";
import { requestLocale, translate } from "@/lib/i18n";
import { validationMessage } from "@/lib/i18n-validation";
export async function POST(request: Request) {
  const locale=requestLocale(request); const t=<T>(message:T)=>translate(locale,message);
  try { validateOrigin(request); const key = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0] || "local" : "demo-local"; rateLimit(key);
    if (Number(request.headers.get("content-length") || 0) > 60_000) throw new DomainError("La solicitud es demasiado grande.", 413);
    const bodyText = await request.text(); if (bodyText.length > 60_000) throw new DomainError("La solicitud es demasiado grande.", 413);
    let body; try { body = JSON.parse(bodyText); } catch { throw new DomainError("El formato de la solicitud no es válido."); }
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.action !== "string") throw new DomainError("Indica una acción válida.");
    if (["login", "register", "demoLogin"].includes(body.action)) rateLimit(`auth:${key}`, process.env.NODE_ENV === "development" ? 120 : 20);
    const result = await performAction(body.action, body.payload); return NextResponse.json({ ok: true, ...result, message: t(result.message) });
  } catch (error) { if (error instanceof DomainError) return NextResponse.json({ ok: false, message: t(error.message) }, { status: error.status }); if (error instanceof ZodError) return NextResponse.json({ ok: false, message: validationMessage(error,locale) }, { status: 400 }); if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2028", "P2002"].includes(error.code)) return NextResponse.json({ ok: false, message: t("Otra operación ha actualizado los datos. Actualiza la pantalla y vuelve a intentarlo.") }, { status: 409 }); console.error("Action error", error); return NextResponse.json({ ok: false, message: t("No se pudo completar la operación. Actualiza los datos e inténtalo de nuevo.") }, { status: 500 }); }
}
