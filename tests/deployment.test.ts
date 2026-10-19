import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { deploymentConfig } from "../scripts/deployment-config.mjs";
import { postgresSchema } from "../scripts/sync-postgres-schema.mjs";
import { expectedRequestOrigin } from "../lib/request-origin";

const environment = {
  DATABASE_URL: "postgresql://demo:fictional@localhost:5432/cimiento",
  DIRECT_URL: "postgresql://demo:fictional@localhost:5432/cimiento",
  DEMO_MODE: "true", SEED_DEMO_DATA: "true",
};
test("Vercel requiere PostgreSQL y modo demostración antes de modificar la base", () => {
  assert.equal(deploymentConfig(environment).seed, true);
  assert.equal(deploymentConfig({...environment, SEED_DEMO_DATA:"false"}).seed, false);
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    assert.throws(()=>deploymentConfig({...environment,[key]:"file:./dev.db"}));
    assert.throws(()=>deploymentConfig({...environment,[key]:undefined}));
  }
  assert.throws(()=>deploymentConfig({...environment,DEMO_MODE:"false"}));
  assert.throws(()=>deploymentConfig({...environment,SEED_DEMO_DATA:"yes"}));
  assert.throws(()=>deploymentConfig({...environment,APP_ORIGIN:"https://cimiento.example/"}));
  assert.doesNotThrow(()=>deploymentConfig({...environment,APP_ORIGIN:"https://cimiento.example"}));
});
test("modelo PostgreSQL sincronizado sin alterar el esquema y las migraciones locales", () => {
  const source=fs.readFileSync("prisma/schema.prisma","utf8");
  assert.equal(fs.readFileSync("prisma/postgresql/schema.prisma","utf8"),postgresSchema(source));
  assert.match(source,/provider\s*=\s*"sqlite"/);
  const config=JSON.parse(fs.readFileSync("vercel.json","utf8"));
  assert.equal(config.framework,"nextjs");
  assert.equal(config.buildCommand,"npm run vercel-build");
  assert.equal(config.outputDirectory,undefined);
});
test("origen HTTPS tras el proxy de Vercel, dominio propio y aislamiento de previews", () => {
  const request=new Request("http://localhost/api/actions",{headers:{host:"preview-123.vercel.app","x-forwarded-host":"attacker.example"}});
  assert.equal(expectedRequestOrigin(request,{VERCEL:"1"}),"https://preview-123.vercel.app");
  assert.equal(expectedRequestOrigin(request,{VERCEL:"1",APP_ORIGIN:"https://cimiento.example"}),"https://cimiento.example");
  assert.equal(expectedRequestOrigin(new Request("http://127.0.0.1:3000/api/actions"),{}),"http://127.0.0.1:3000");
});
