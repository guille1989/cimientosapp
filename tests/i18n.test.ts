import test from "node:test";
import assert from "node:assert/strict";
import english from "../messages/en.json";
import spanish from "../messages/es.json";
import { formatDate, formatMoney, normalizeLocale, pluralMessage, requestLocale, translate } from "../lib/i18n";

test("catálogos completos y con las mismas interpolaciones", () => {
  assert.deepEqual(Object.keys(english), Object.keys(spanish));
  assert.ok(Object.keys(english).length > 1000);
  for (const [source,target] of Object.entries(english)) {
    const placeholders=(value:string)=>[...value.matchAll(/\{(?:value\d+|count)\}/g)].map(m=>m[0]).sort();
    assert.deepEqual(placeholders(source),placeholders(target),source);
    assert.ok(target.trim(),source);
  }
});
test("traducción con parámetros, texto heredado y nombres propios",()=>{
  assert.equal(translate("en","Explorar proyectos"),"Explore projects");
  assert.equal(translate("es","Entrar"),"Entrar");
  assert.equal(translate("en","Hola, {value0}.",{value0:"Alex"}),"Hello, Alex.");
  assert.equal(translate("en","Puedes cancelar durante las próximas 96 horas desde tu cartera."),"You can cancel from your portfolio within the next 96 hours.");
  assert.equal(translate("en","Patio Chamberí"),"Patio Chamberí");
  assert.equal(translate("en","Texto libre de mi proyecto"),"Texto libre de mi proyecto");
  assert.equal(translate("en","constructor"),"constructor");
  assert.equal(translate("en","__proto__"),"__proto__");
  assert.equal(translate("en"," Riesgos ")," Risks ");
  assert.equal(pluralMessage("en",1,"{count} proyecto abierto","{count} proyectos abiertos"),"1 open project");
  assert.equal(pluralMessage("en",2,"{count} proyecto abierto","{count} proyectos abiertos"),"2 open projects");
  assert.equal(pluralMessage("es",0,"{count} proyecto abierto","{count} proyectos abiertos"),"0 proyectos abiertos");
});
test("fechas, euros y recuperación segura de idioma",()=>{
  assert.equal(formatMoney(1234.5,"en"),"€1,234.50");
  assert.ok(formatMoney(1234.5,"es").includes("1234,50"));
  assert.ok(formatDate("2027-01-15T12:00:00Z","en").includes("Jan"));
  assert.ok(formatDate("2027-01-15T12:00:00Z","es").includes("ene"));
  assert.equal(normalizeLocale("fr"),"es");
  assert.equal(requestLocale(new Request("http://localhost",{headers:{cookie:"cimiento_locale=en"}})),"en");
  assert.equal(requestLocale(new Request("http://localhost",{headers:{"x-cimiento-locale":"de",cookie:"cimiento_locale=en"}})),"en");
});
