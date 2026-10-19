import fs from "node:fs";
import path from "node:path";
// Prisma 6 on Windows can fail to initialize a missing SQLite file.
// Only create the default demonstration database when it does not exist.
const envPath = path.resolve(".env");
if (!fs.existsSync(envPath)) fs.copyFileSync(path.resolve(".env.example"), envPath);
const contents = fs.readFileSync(envPath, "utf8");
const match = contents.match(/^DATABASE_URL\s*=\s*["']?file:([^"'\r\n]+)/m);
if (match && !process.env.DATABASE_URL) {
  const target = path.resolve("prisma", match[1].trim());
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.closeSync(fs.openSync(target, "a"));
}
