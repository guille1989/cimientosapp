import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
const directory = new URL("../output/qa/", import.meta.url);
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const viewport of [{ width: 1440, height: 1000, name: "desktop" }, { width: 390, height: 844, name: "mobile" }]) {
  const page = await browser.newPage({ viewport });
  for (const [name, route] of [["home", "/"], ["market", "/proyectos"], ["project", "/proyectos/patio-chamberi"]]) {
    await page.goto(`http://127.0.0.1:3000${route}`);
    await page.locator(name === "project" ? ".cm-detail-heading" : ".cm-project-card").first().waitFor({ timeout: 45000 });
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-${viewport.name}.png`, directory)), fullPage: true });
    console.log(`${name}-${viewport.name}: ${await page.evaluate(() => document.documentElement.scrollWidth)}px / ${viewport.width}px`);
  }
  await page.close();
}
await browser.close();
