import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const directory = path.resolve("output", "qa");
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];
const measurements = [];
const groups = [
  { name: "public", routes: ["/", "/proyectos", "/proyectos/patio-chamberi", "/como-funciona", "/riesgos", "/preguntas-frecuentes", "/acceso", "/registro"] },
  { name: "inversor", routes: ["/inversor", "/inversor/cartera", "/inversor/movimientos", "/inversor/documentos", "/inversor/notificaciones", "/inversor/perfil", "/onboarding"] },
  { name: "promotor", routes: ["/promotor", "/promotor/solicitud", "/promotor/proyectos", "/promotor/hitos"] },
  { name: "admin", routes: ["/admin", "/admin/proyectos", "/admin/usuarios", "/admin/hitos", "/admin/distribuciones", "/admin/incidencias", "/admin/auditoria"] }
];
try {
  for (const group of groups) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (group.name !== "public") {
      const response = await context.request.post("http://127.0.0.1:3000/api/actions", { data: { action: "login", payload: { email: `${group.name}@cimiento.demo`, password: "Demo123!" } } });
      if (!response.ok()) throw new Error(`No se pudo acceder como ${group.name}: ${await response.text()}`);
    }
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on("pageerror", error => failures.push({ route: page.url(), error: error.message }));
    page.on("console", message => { if (message.type() === "error") failures.push({ route: page.url(), error: message.text(), resource: message.location().url }); });
    for (const route of group.routes) {
      const response = await page.goto(`http://127.0.0.1:3000${route}`);
      if (!response?.ok()) failures.push({ route, error: `HTTP ${response?.status()}` });
      await page.locator("main h1").first().waitFor();
      await page.waitForFunction(() => !document.querySelector(".loading-state, .cm-loading"));
      if (route === "/" || route === "/proyectos") await page.locator(".cm-project-card").first().waitFor();
      const size = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }));
      measurements.push({ route, viewport: "desktop", ...size });
      if (size.documentWidth > size.width + 1) failures.push({ route, error: "Desbordamiento horizontal en escritorio" });
      if (route === group.routes[0] || route === "/proyectos") await page.screenshot({ path: path.join(directory, `${group.name === "public" ? route === "/" ? "home" : "market" : group.name}-desktop.png`), fullPage: true });
    }
    if (group.name !== "public") {
      for (const viewport of [{ width: 390, height: 844, name: "mobile" }, { width: 768, height: 1024, name: "tablet" }]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const route of [group.routes[0], group.routes[1]]) {
          await page.goto(`http://127.0.0.1:3000${route}`);
          await page.locator("main h1").first().waitFor();
          await page.waitForFunction(() => !document.querySelector(".loading-state"));
          const size = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }));
          measurements.push({ route, viewport: viewport.name, ...size });
          if (size.documentWidth > size.width + 1) failures.push({ route, error: `Desbordamiento horizontal en ${viewport.name}` });
          if (route === group.routes[0]) await page.screenshot({ path: path.join(directory, `${group.name}-${viewport.name}.png`), fullPage: true });
        }
      }
    }
    await context.close();
  }
} finally { await browser.close(); }
await fs.writeFile(path.join(directory, "ui-verification.json"), JSON.stringify({ measurements, failures }, null, 2));
console.log(`${measurements.length} comprobaciones de pantallas; ${failures.length} errores de consola o desbordamiento.`);
if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
