import { NextResponse } from "next/server";
import { getAppState } from "@/lib/services";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await getAppState(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { console.error("State error", error); return NextResponse.json({ ok: false, message: "No se pudieron cargar los datos. Comprueba las migraciones y el seed, y vuelve a intentarlo." }, { status: 503 }); } }
