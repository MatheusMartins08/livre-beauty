import { expect, test } from "@playwright/test";
import { services, stylists } from "../content/salon";
import { homeFAQs } from "../content/home";

test("removed pages return 404 and navigation keeps only active destinations", async ({ page }) => {
  for (const route of ["/contato", "/faq", ...services.map(({ slug }) => `/servicos/${slug}`)]) {
    expect((await page.request.get(route)).status(), route).toBe(404);
  }
  await page.goto("/");
  await expect(page.locator('a[href="/contato"], a[href="/faq"], a[href^="/servicos/"]')).toHaveCount(0);
  await expect(page.locator(".desktop-nav a")).toHaveCount(5);
  await expect(page.locator("details")).toHaveCount(homeFAQs.length);
  for (const { slug } of services) {
    await expect(page.locator(`main a[href="/servicos#${slug}"]`)).toHaveCount(1);
  }
});

test("the header booking action is a filled primary button whose arrow moves without layout movement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const action = page.locator(".header-book");
  await expect(action).toHaveCSS("background-color", "rgb(36, 33, 31)");
  await expect(action.locator(".action-label")).toHaveCount(1);
  await expect(action.locator(".action-label")).toHaveCSS("text-decoration-line", "none");
  await expect(action.locator(".action-arrow")).toHaveCount(1);
  const before = await action.boundingBox();
  await action.hover();
  await expect.poll(() => action.locator(".action-arrow").evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return [Math.round(matrix.m41), Math.round(matrix.m42), Math.round(matrix.a * 100)];
  })).toEqual([3, -3, 108]);
  expect(await action.boundingBox()).toEqual(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(action.locator(".action-arrow")).toHaveCSS("transform", "none");
});

test("keyboard focus animates service actions and mobile navigation consistently", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const service = page.locator('main a[href="/servicos#corte-autoral"]');
  await service.focus();
  await expect(service).toBeFocused();
  const arrowOffset = (action: typeof service) => action.locator(".action-arrow").evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return [Math.round(matrix.m41), Math.round(matrix.m42)];
  });
  await expect.poll(() => arrowOffset(service)).toEqual([3, -3]);
  await page.setViewportSize({ width: 320, height: 700 });
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Menu de navegação" });
  await page.keyboard.press("Tab");
  const link = menu.getByRole("link", { name: "Profissionais", exact: true });
  await link.focus();
  await expect.poll(() => arrowOffset(link)).toEqual([3, -3]);
  expect(await menu.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("gallery captions are centered without arrows and images still open", async ({ page }) => {
  await page.goto("/galeria");
  await expect(page.locator(".gallery-caption svg")).toHaveCount(0);
  await expect(page.locator(".gallery-caption").first()).toHaveCSS("text-align", "center");
  await page.getByRole("button", { name: "Abrir imagem: Luz em movimento" }).click();
  await expect(page.getByRole("dialog", { name: "Galeria de referências" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir imagem: Luz em movimento" })).toBeFocused();
});

test("professional profiles retain their services without the portfolio section", async ({ page }) => {
  for (const stylist of stylists) {
    await page.goto(`/profissionais/${stylist.slug}`);
    await expect(page.getByRole("heading", { name: "Um olhar para inspirar." })).toHaveCount(0);
    await expect(page.locator(".gallery-grid")).toHaveCount(0);
    await expect(page.getByRole("link", { name: `Agendar com ${stylist.name.split(" ")[0]}`, exact: true })).toHaveAttribute("href", `/agendamento?profissional=${stylist.slug}`);
  }
});

test("public copy and accessible descriptions do not retain presentation notices", async ({ page }) => {
  for (const route of ["/", "/sobre", "/servicos", "/profissionais", "/galeria", "/agendamento", "/politicas", "/privacidade", "/termos", ...stylists.map(({ slug }) => `/profissionais/${slug}`)]) {
    await page.goto(route);
    const text = await page.evaluate(() => [
      document.body.innerText,
      ...Array.from(document.querySelectorAll("[alt], [aria-label], meta[name='description'], meta[property^='og:'], meta[name^='twitter:']"), element => element.getAttribute("alt") || element.getAttribute("aria-label") || element.getAttribute("content") || ""),
    ].join("\n"));
    expect(text, route).not.toMatch(/demonstrativ|ilustrativ|fictíci|simula[çc]|conceito de salão|conceito fictício|versão real/i);
  }
});
