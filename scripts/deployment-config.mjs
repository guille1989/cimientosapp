function postgresURL(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new Error(name + ": introduce una URL PostgreSQL válida."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2)
    throw new Error(name + ": Vercel necesita PostgreSQL persistente; no admite el archivo SQLite local.");
  return value;
}
export function deploymentConfig(env) {
  const databaseURL = postgresURL(env.DATABASE_URL, "DATABASE_URL");
  const directURL = postgresURL(env.DIRECT_URL, "DIRECT_URL");
  if (env.DEMO_MODE !== "true") throw new Error("Configura DEMO_MODE=true: este despliegue solo admite operaciones ficticias.");
  if (env.SEED_DEMO_DATA && !["true", "false"].includes(env.SEED_DEMO_DATA))
    throw new Error("SEED_DEMO_DATA debe ser true o false.");
  if (env.APP_ORIGIN) {
    let origin;
    try { origin = new URL(env.APP_ORIGIN); } catch { throw new Error("APP_ORIGIN debe ser un origen HTTPS válido."); }
    if (origin.protocol !== "https:" || origin.origin !== env.APP_ORIGIN)
      throw new Error("APP_ORIGIN debe usar HTTPS, sin ruta ni barra final. Déjala sin definir para detectar el dominio de Vercel.");
  }
  return { databaseURL, directURL, seed: env.SEED_DEMO_DATA === "true" };
}
