import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const postgresSchemaPath = "prisma/postgresql/schema.prisma";
export function postgresSchema(source) {
  if (!/provider\s*=\s*"sqlite"/.test(source)) throw new Error("El modelo local debe utilizar SQLite.");
  return "// Generated from prisma/schema.prisma. Run npm run db:sync:postgres after model changes.\n" + source
    .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
    .replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
}
export function syncPostgresSchema() {
  const source = fs.readFileSync("prisma/schema.prisma", "utf8");
  const schema = postgresSchema(source);
  fs.mkdirSync("prisma/postgresql", { recursive: true });
  if (!fs.existsSync(postgresSchemaPath) || fs.readFileSync(postgresSchemaPath, "utf8") !== schema)
    fs.writeFileSync(postgresSchemaPath, schema);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) syncPostgresSchema();
