import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { deploymentConfig } from "./deployment-config.mjs";
import { postgresSchemaPath, syncPostgresSchema } from "./sync-postgres-schema.mjs";

export function loadDeploymentEnv() {
  // Node 24 preserves variables already supplied by Vercel or the shell.
  try { process.loadEnvFile(".env"); } catch (error) { if (error.code !== "ENOENT") throw error; }
}
export function runNodeModule(modulePath, args, env = process.env) {
  const result = spawnSync(process.execPath, [modulePath, ...args], { stdio: "inherit", env });
  if (result.error) throw new Error("No se pudo iniciar la herramienta de despliegue.");
  if (result.status !== 0) throw new Error("El paso de despliegue ha fallado. Revisa el error anterior.");
}
export function deployDatabase() {
  loadDeploymentEnv();
  const config = deploymentConfig(process.env);
  syncPostgresSchema();
  runNodeModule("node_modules/prisma/build/index.js", ["generate", "--schema", postgresSchemaPath]);
  runNodeModule("node_modules/prisma/build/index.js", ["migrate", "deploy", "--schema", postgresSchemaPath]);
  if (config.seed) {
    // Seeding is a single administrative process: use the direct connection.
    runNodeModule("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"], { ...process.env, DATABASE_URL: config.directURL });
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  try { deployDatabase(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
