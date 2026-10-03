import { expect, test } from "@playwright/test";
import { services, stylists } from "../content/salon";

const routes = [
  "/",
  "/sobre",
  "/servicos",
  "/profissionais",
  "/galeria",
  "/contato",
  "/agendamento",
  "/faq",
  "/politicas",
  "/privacidade",
  "/termos",
  ...services.map((item) => `/servicos/${item.slug}`),
  ...stylists.map((item) => `/profissionais/${item.slug}`),
];

test("the shared identity and absence of fixed bottom controls hold on every route", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(246, 241, 235)",
    );
    await expect(page.locator(".site-header")).toHaveCSS(
      "color",
      "rgb(36, 33, 31)",
    );
    await expect(page.locator(".site-footer")).toHaveCSS(
      "background-color",
      "rgb(36, 33, 31)",
    );
    await expect(
      page.locator(".floating-contact, .mobile-booking-bar"),
    ).toHaveCount(0);
    await expect(page.locator(".header-book")).toHaveCSS(
      "background-color",
      "rgb(36, 33, 31)",
    );
  }
});

test("service hover and keyboard feedback do not change layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/servicos");
  const service = page.locator(".service-directory-item").first();
  const link = service
    .getByRole("link", { name: "Conhecer Corte autoral", exact: true })
    .first();
  const bounds = await service.boundingBox();
  await service.hover();
  await expect
    .poll(() =>
      service.evaluate(
        (element) => getComputedStyle(element, "::before").opacity,
      ),
    )
    .toBe("1");
  expect((await service.boundingBox())!.height).toBe(bounds!.height);
  await page.mouse.move(0, 0);
  await link.focus();
  await expect
    .poll(() =>
      service.evaluate(
        (element) => getComputedStyle(element, "::before").opacity,
      ),
    )
    .toBe("1");
});

test("specialists have two spacious desktop columns and one mobile column", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profissionais");
  const cards = page.locator(".stylist-card");
  await expect(cards).toHaveCount(4);
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  const third = await cards.nth(2).boundingBox();
  expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  expect(third!.x).toBe(first!.x);
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await cards.nth(1).boundingBox())!.x).toBe(
    (await cards.nth(0).boundingBox())!.x,
  );
});

test("internal FAQ reverses rapidly and keeps keyboard focus", async ({
  page,
}) => {
  await page.goto("/faq");
  const question = page.getByRole("button", {
    name: "Como funciona a primeira consulta?",
  });
  const entry = page.locator("details").filter({ has: question });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await question.evaluate((element) => {
    (element as HTMLElement).click();
    (element as HTMLElement).click();
    (element as HTMLElement).click();
  });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await expect(entry).not.toHaveAttribute("open");
  await expect(question).toBeFocused();
});

test("editorial motion cleans up across routes and responds to reduced motion changes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/sobre");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const target of await page
    .locator("[data-page-reveal], [data-page-parallax]")
    .all()) {
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveCSS("transform", "none");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const route of ["/servicos", "/profissionais", "/galeria", "/sobre"]) {
    await page.locator(`.desktop-nav a[href="${route}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("[data-editorial-page]")).toHaveCount(1);
  }
  await page.locator(".site-header .wordmark").click();
  await expect(page.locator("[data-editorial-page]")).toHaveCount(0);
  await expect(page.locator("[data-home-page]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("internal editorial content and FAQ remain available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/sobre");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".about-experience")).toBeVisible();
    await page.goto("/faq");
    await page
      .getByRole("button", { name: "Como funciona a primeira consulta?" })
      .click();
    await expect(
      page.getByText(/Começamos com uma conversa sobre sua rotina/),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
