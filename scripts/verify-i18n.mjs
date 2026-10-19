import {chromium} from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const baseURL=process.env.CIMIENTO_BASE_URL||"http://127.0.0.1:3000";
const english=JSON.parse(await fs.readFile(new URL("../messages/en.json",import.meta.url),"utf8"));
const directory=path.resolve("output/qa-i18n");
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:"chrome",headless:true});
const failures=[],measurements=[],untranslated=[];
const groups=[
  {name:"public",routes:["/","/proyectos","/proyectos/patio-chamberi","/proyectos/patio-compartido-proximamente","/proyectos/habitar-norte-proximamente","/como-funciona","/riesgos","/preguntas-frecuentes","/acceso","/registro"]},
  {name:"inversor",routes:["/inversor","/inversor/cartera","/inversor/movimientos","/inversor/documentos","/inversor/notificaciones","/inversor/perfil","/onboarding"]},
  {name:"promotor",routes:["/promotor","/promotor/solicitud","/promotor/proyectos","/promotor/hitos"]},
  {name:"admin",routes:["/admin","/admin/proyectos","/admin/usuarios","/admin/hitos","/admin/distribuciones","/admin/incidencias","/admin/auditoria"]},
];
try{
for(const locale of ["es","en"]){
for(const group of groups){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addCookies([{name:"cimiento_locale",value:locale,url:baseURL}]);
  if(group.name!=="public"){
    const response=await context.request.post(baseURL+"/api/actions",{data:{action:"login",payload:{email:group.name+"@cimiento.demo",password:"Demo123!"}}});
    if(!response.ok())throw new Error("Login "+group.name+": "+await response.text());
  }
  const page=await context.newPage();page.setDefaultTimeout(20000);
  page.on("pageerror",error=>failures.push({locale,route:page.url(),error:error.message}));
  page.on("console",message=>{if(message.type()==="error")failures.push({locale,route:page.url(),error:message.text(),resource:message.location().url});});
  async function check(route,viewport){
    const response=await page.goto(baseURL+route);
    if(!response?.ok())failures.push({locale,route,error:"HTTP "+response?.status()});
    await page.locator("main h1").first().waitFor();
    await page.waitForFunction(()=>!document.querySelector(".loading-state,.cm-loading"));
    if(route==="/"||route==="/proyectos")await page.locator(".cm-project-card").first().waitFor();
    const result=await page.evaluate(()=>{
      const walker=document.createTreeWalker(document.querySelector("main"),NodeFilter.SHOW_TEXT);const text=[];
      while(walker.nextNode()){const node=walker.currentNode;const parent=node.parentElement;if(parent&&!parent.closest("script,style,code,pre,textarea,input,select")&&parent.getClientRects().length){const value=node.textContent.replace(/\s+/g," ").trim();if(value)text.push(value);}}
      return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,lang:document.documentElement.lang,text};
    });
    measurements.push({locale,route,viewport,width:result.width,documentWidth:result.documentWidth});
    if(result.documentWidth>result.width+1)failures.push({locale,route,viewport,error:"Horizontal overflow"});
    if(result.lang!==locale)failures.push({locale,route,error:"Incorrect HTML language: "+result.lang});
    if(locale==="en")for(const value of result.text){
      if(Object.hasOwn(english,value)&&english[value]!==value)untranslated.push({route,viewport,text:value});
      else if(/\b(?:fictici[oa]s?|demostración|rentabilidad|financiación|compromisos?|desembolsos?|solicitudes?|inversión|construye|meses|próximamente)\b/i.test(value))untranslated.push({route,viewport,text:value});
    }
  }
  for(const route of group.routes){
    await check(route,"desktop");
    if(route===group.routes[0]||route==="/proyectos")
      await page.screenshot({path:path.join(directory,locale+"-"+(route==="/proyectos"?"market":group.name)+"-desktop.png"),fullPage:true});
  }
  if(group.name!=="public")for(const viewport of [{width:390,height:844,name:"mobile"},{width:768,height:1024,name:"tablet"}]){
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    for(const route of group.routes.slice(0,2))await check(route,viewport.name);
    await page.screenshot({path:path.join(directory,locale+"-"+group.name+"-"+viewport.name+".png"),fullPage:true});
  }
  await context.close();
}
}
}finally{await browser.close();}
const report={measurements,failures,untranslated:[...new Map(untranslated.map(row=>[row.route+" "+row.text,row])).values()]};
await fs.writeFile(path.join(directory,"verification.json"),JSON.stringify(report,null,2));
console.log(measurements.length+" screens checked; "+failures.length+" console/layout errors; "+report.untranslated.length+" possible untranslated messages.");
if(failures.length||report.untranslated.length){console.error(JSON.stringify({failures,untranslated:report.untranslated},null,2));process.exitCode=1;}
