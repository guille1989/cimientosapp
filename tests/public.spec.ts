import { test, expect } from "@playwright/test";

test("public marketplace filters real projects and list view", async ({ page }) => {
  await page.goto("/proyectos");
  await expect(page.getByRole("heading", { name: /Proyectos con/ })).toBeVisible();
  await expect.poll(() => page.locator(".cm-project-card").count()).toBeGreaterThanOrEqual(6);
  const baseline = await page.locator(".cm-project-card").count();
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await expect(page.locator("#project-filters")).toBeVisible();
  await page.getByRole("combobox", { name: "Ubicación", exact: true }).selectOption("Madrid");
  await expect.poll(() => page.locator(".cm-project-card").count()).toBeGreaterThanOrEqual(1);
  const filteredCount = await page.locator(".cm-project-card").count();
  expect(filteredCount).toBeLessThan(baseline);
  for (const location of await page.locator(".cm-project-location").allTextContents()) expect(location).toContain("Madrid");
  await page.getByRole("button", { name: "Vista de lista" }).click();
  await expect(page.locator(".cm-project-card-list")).toHaveCount(filteredCount);
  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  await expect(page.locator(".cm-project-card")).toHaveCount(baseline);
  await expect(page.locator("#project-filters")).toBeVisible();
  await page.getByRole("combobox", { name: "Tipo de operación", exact: true }).selectOption("EQUITY");
  await expect(page.getByText("Este producto pertenece a una fase posterior.", { exact: false })).toBeVisible();
  await page.getByRole("combobox", { name: "Ubicación", exact: true }).selectOption("Madrid");
  await expect(page.locator(".cm-project-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No hay proyectos con estos criterios." })).toBeVisible();
});

test("project detail has keyboard tabs and downloadable fictitious documents", async ({ page }) => {
  await page.goto("/proyectos/patio-chamberi");
  await expect(page.getByRole("heading", { name: "Patio Chamberí", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Resumen", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Datos financieros", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "El capital y su destino." })).toBeVisible();
  await page.getByRole("tab", { name: "Documentos", exact: true }).click();
  const document = page.locator(".cm-document a").first();
  await expect(document).toBeVisible();
  const response = await page.request.get((await document.getAttribute("href"))!);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/");
  await page.locator(".cm-doc-preview").first().click();
  await expect(page.getByRole("dialog")).toContainText("Documento generado exclusivamente para demostración.");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ampliar representación arquitectónica" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("public pages remain usable on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/proyectos", "/proyectos/patio-chamberi", "/como-funciona", "/riesgos", "/preguntas-frecuentes"]) {
    await page.goto(route);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.getByText("Entorno de demostración. Los proyectos, rentabilidades y movimientos mostrados son ficticios.", { exact: false }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, `horizontal overflow at ${route}`).toBeFalsy();
  }
});
