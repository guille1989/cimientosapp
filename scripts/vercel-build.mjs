import { deployDatabase, runNodeModule } from "./deploy-database.mjs";

try {
  deployDatabase();
  runNodeModule("node_modules/next/dist/bin/next", ["build", "--webpack"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
