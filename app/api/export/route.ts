import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { intlLocale, requestLocale, translate } from "@/lib/i18n";
import { statusLabels } from "@/lib/status-labels";
const validTypes = ["COMMITMENT","CANCELLATION","REFUND","DISTRIBUTION","CAPITAL_RETURN","ADJUSTMENT","DISBURSEMENT"];
export async function GET(request: Request) {
  const locale=requestLocale(request); const t=<T>(message:T)=>translate(locale,message);
  const user=await getCurrentUser();
  if(!user) return Response.json({ok:false,message:t("Inicia sesión para exportar tus movimientos.")},{status:401});
  const params=new URL(request.url).searchParams;
  const type=params.get("type"), projectId=params.get("projectId"), from=params.get("from");
  if(type&&!validTypes.includes(type))return Response.json({ok:false,message:t("Tipo de movimiento no válido.")},{status:400});
  if(projectId&&projectId.length>100)return Response.json({ok:false,message:t("Proyecto no válido.")},{status:400});
  let fromDate:Date|undefined;
  if(from){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(from))return Response.json({ok:false,message:t("Fecha de inicio no válida.")},{status:400});
    fromDate=new Date(from+"T00:00:00.000Z");
    if(Number.isNaN(fromDate.getTime())||fromDate.toISOString().slice(0,10)!==from)
      return Response.json({ok:false,message:t("Fecha de inicio no válida.")},{status:400});
  }
  const items=await db.transaction.findMany({
    where:{userId:user.id,...(type?{type:type as any}:{}),...(projectId?{projectId}:{}),...(fromDate?{createdAt:{gte:fromDate}}:{})},
    include:{project:{select:{name:true}}},orderBy:{createdAt:"desc"},
  });
  const number=new Intl.NumberFormat(intlLocale(locale),{useGrouping:false,minimumFractionDigits:2,maximumFractionDigits:2});
  const cell=(value:unknown)=>typeof value==="number"?number.format(value):'"'+String(value).replace(/"/g,'""').replace(/^[=+@-]/,"'$&")+'"';
  const lines=[
    t("DEMOSTRACIÓN;Datos ficticios;Sin dinero real"),
    t("Fecha;Proyecto;Tipo;Importe EUR;Descripción"),
    ...items.map(item=>[item.createdAt.toISOString(),item.project.name,t(statusLabels[item.type]||item.type),item.amountCents/100,t(item.description)].map(cell).join(";")),
  ];
  return new Response("\uFEFF"+lines.join("\r\n"),{headers:{
    "Content-Type":"text/csv; charset=utf-8","Content-Language":locale,
    "Content-Disposition":"attachment; filename="+(locale==="en"?"cimiento-transactions-demo.csv":"cimiento-movimientos-demo.csv"),
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
  }});
}
