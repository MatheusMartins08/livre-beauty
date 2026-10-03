import { test, expect } from "@playwright/test";

test("header stays readable while scrolling and shared chrome stays consistent between routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sobre");
  const colors = () =>
    page.evaluate(() =>
      Object.fromEntries(
        ["body", ".site-header", ".site-footer"].map((selector) => {
          const style = getComputedStyle(document.querySelector(selector)!);
          return [
            selector,
            { color: style.color, background: style.backgroundColor },
          ];
        }),
      ),
    );
  const baseline = await colors();
  await page.locator(".site-header .wordmark").click();
  await expect(page.locator("[data-home-page]")).toBeVisible();
  const header = page.locator(".site-header");
  await expect(header).toHaveClass(/header-on-hero/);
  await expect(header).toHaveCSS("color", "rgb(36, 33, 31)");
  await page
    .locator("#sobre-title")
    .evaluate((element) =>
      element.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await expect(header).toHaveClass(/header-solid/);
  await expect(header).toHaveCSS(
    "background-color",
    "rgba(246, 241, 235, 0.95)",
  );
  await expect(header).toHaveCSS("color", "rgb(36, 33, 31)");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).toHaveClass(/header-on-hero/);
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Sobre", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sobre$/);
  await expect.poll(colors).toEqual(baseline);
  await page.goBack();
  await expect(page.locator("[data-home-page]")).toBeVisible();
  await expect(header).toHaveCSS("color", "rgb(36, 33, 31)");
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`both hero actions fit the first screen at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const name of ["Agendar horário", "Conhecer serviços"]) {
      const link = page.locator("[data-home-hero]").getByRole("link", { name });
      await expect(link).toBeInViewport({ ratio: 1 });
      const box = await link.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
  });
}

test("homepage FAQ reverses smoothly, announces state, and settles after quick toggles", async ({
  page,
}) => {
  await page.goto("/");
  const question = page.getByRole("button", {
    name: "Como funciona a primeira consulta?",
  });
  const entry = page.locator("details").filter({ has: question });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(entry.getByText(/Começamos com uma conversa/)).toBeVisible();
  await question.evaluate((element) => {
    (element as HTMLElement).click();
    (element as HTMLElement).click();
    (element as HTMLElement).click();
  });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await expect(entry).not.toHaveAttribute("open");
  await expect(question).toBeFocused();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(() =>
      entry
        .locator(".faq-answer")
        .evaluate(
          (element) =>
            element
              .getAnimations()
              .filter((animation) => animation.playState === "running").length,
        ),
    )
    .toBe(0);
  await expect(entry.locator(".faq-answer")).toHaveCSS("overflow", "visible");
});

test("homepage remains readable and its FAQ works without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Beleza sem fórmulas." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Como funciona a primeira consulta?" })
      .click();
    await expect(
      page.getByText(/Começamos com uma conversa sobre sua rotina/),
    ).toBeVisible();
    await expect(page.locator(".site-header")).toHaveCSS(
      "color",
      "rgb(36, 33, 31)",
    );
  } finally {
    await context.close();
  }
});

test("changing reduced motion removes reveals and parallax while keeping content visible", async ({
  page,
}) => {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const element of await page
    .locator("[data-home-reveal], [data-hero-copy], [data-home-parallax]")
    .all()) {
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveCSS("transform", "none");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".site-header .wordmark").click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-hero-image]")).toHaveCSS(
    "transform",
    "none",
  );
});

test("mobile menu navigation is immediate, restores scrolling and can reopen after Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  const dialog = page.getByRole("dialog", { name: "Menu de navegação" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Serviços", exact: true }).click();
  await expect(page).toHaveURL(/\/servicos$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.goBack();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("home channels remain demonstrative and the map loads only on request", async ({
  page,
}) => {
  const external: string[] = [];
  await page.route("https://www.openstreetmap.org/**", async (route) => {
    external.push(route.request().url());
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><p>Mapa ilustrativo</p>",
    });
  });
  await page.goto("/");
  const visit = page
    .locator("section")
    .filter({ has: page.locator("#visite-title") });
  for (const name of ["Instagram", "WhatsApp", "Telefone"]) {
    await visit.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  expect(external).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  await visit.getByRole("button", { name: "Explorar a região" }).click();
  await expect(
    page.getByTitle("Mapa ilustrativo da região dos Jardins, São Paulo"),
  ).toBeVisible();
  await expect.poll(() => external.length).toBe(1);
});
