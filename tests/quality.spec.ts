import { expect, test, type Page } from "@playwright/test";
import { stylists } from "../content/salon";

const routes = [
  "/",
  "/sobre",
  "/servicos",
  "/profissionais",
  "/galeria",
  "/agendamento",
  "/politicas",
  "/privacidade",
  "/termos",
  ...stylists.map(({ slug }) => `/profissionais/${slug}`),
];
const knownRoutes = new Set(routes);
const widths = [320, 390, 768, 1440, 1920];

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`Uncaught: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`Console: ${message.text()}`);
  });
  // Keep errors attached to each test, including errors emitted during image loading.
  pageErrors.set(page, errors);
});

const pageErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => {
  expect(
    pageErrors.get(page),
    "Browser console errors and uncaught exceptions",
  ).toEqual([]);
});

async function checkLinks(page: Page) {
  const current = new URL(page.url());
  const links = await page
    .locator("a[href]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")!),
    );
  for (const href of new Set(links)) {
    const target = new URL(href, current);
    expect(["http:", "https:"], `Supported link protocol: ${href}`).toContain(
      target.protocol,
    );
    if (/^https?:\/\//i.test(href)) {
      expect(
        ["localhost", "127.0.0.1", "[::1]"],
        `No authored localhost navigation URL: ${href}`,
      ).not.toContain(target.hostname);
    }
    if (target.origin !== current.origin) continue;
    const pathname = target.pathname.replace(/\/$/, "") || "/";
    expect(
      knownRoutes.has(pathname),
      `Link resolves to an implemented route: ${href}`,
    ).toBe(true);
    if (!target.hash) continue;
    const id = decodeURIComponent(target.hash.slice(1));
    if (target.pathname === current.pathname) {
      expect(
        await page.evaluate(
          (anchorId) => Boolean(document.getElementById(anchorId)),
          id,
        ),
        `Anchor exists: ${href}`,
      ).toBe(true);
    } else {
      const response = await page.request.get(
        `${target.pathname}${target.search}`,
      );
      expect(response.ok(), `Cross-page anchor route responds: ${href}`).toBe(
        true,
      );
      const html = await response.text();
      expect(
        await page.evaluate(
          ({ html, id }) =>
            Boolean(
              new DOMParser()
                .parseFromString(html, "text/html")
                .getElementById(id),
            ),
          { html, id },
        ),
        `Cross-page anchor exists: ${href}`,
      ).toBe(true);
    }
  }
}

for (const width of widths) {
  test.describe(`${width}px layout`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of routes) {
      test(`${route} remains readable with working photos and links`, async ({
        page,
      }) => {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("main")).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          /(?:^|,)\s*noindex(?:,|$)/,
        );
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          /(?:^|,)\s*nofollow(?:,|$)/,
        );
        const canonical = await page
          .locator('link[rel="canonical"]')
          .getAttribute("href");
        expect(
          canonical,
          "Every page has an absolute canonical URL",
        ).toBeTruthy();
        expect(new URL(canonical!).pathname).toBe(route);
        await page.evaluate(() => document.fonts.ready);

        for (const image of await page.locator("img").all()) {
          await expect(
            image,
            "Content photographs have descriptive alternatives",
          ).toHaveAttribute("alt", /\S+/);
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(
              () =>
                image.evaluate((element) => {
                  const photo = element as HTMLImageElement;
                  return photo.complete && photo.naturalWidth > 0;
                }),
              {
                message: `Photo loads on ${route}: ${await image.getAttribute("alt")}`,
              },
            )
            .toBe(true);
          const src = await image.evaluate(
            (element) => (element as HTMLImageElement).currentSrc,
          );
          expect(
            new URL(src).origin,
            "Photographs are served by this site",
          ).toBe(new URL(page.url()).origin);
        }
        const overflow = await page.evaluate(() => ({
          viewport: window.innerWidth,
          content: Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ),
          elements: [...document.querySelectorAll("body *")]
            .flatMap((element) => {
              const rect = element.getBoundingClientRect();
              if (
                !rect.width ||
                !rect.height ||
                (rect.left >= -1 && rect.right <= window.innerWidth + 1)
              )
                return [];
              return [
                {
                  element: `${element.tagName.toLowerCase()}.${element.className}`,
                  left: rect.left,
                  right: rect.right,
                },
              ];
            })
            .slice(0, 12),
        }));
        expect(
          overflow.content,
          `No horizontal overflow on ${route} at ${width}px: ${JSON.stringify(overflow.elements)}`,
        ).toBeLessThanOrEqual(overflow.viewport + 1);
        await checkLinks(page);
      });
    }
  });
}

test("reduced motion keeps content visible and disables entrance and dialog motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).scrollBehavior),
  ).toBe("auto");
  for (const content of await page.locator("[data-reveal]").all()) {
    await content.scrollIntoViewIfNeeded();
    await expect(content).toBeVisible();
    expect(
      await content.evaluate((element) => getComputedStyle(element).opacity),
    ).toBe("1");
  }
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  await page.goto("/galeria");
  await page
    .getByRole("button", { name: "Abrir imagem: Luz em movimento" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Galeria de referências" });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element).animationDuration,
    ),
  ).toBe("0s");
});

test("mobile navigation contains keyboard focus and restores its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Menu de navegação" });
  await expect(dialog).toBeVisible();
  const focusable = dialog.locator("button, a[href]");
  await focusable.first().focus();
  await page.keyboard.press("Shift+Tab");
  const reverseFocus = await page.evaluate(() => ({
    element: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim().slice(0, 80),
    insideDialog: Boolean(
      document.querySelector("dialog[open]")?.contains(document.activeElement),
    ),
  }));
  await expect(
    focusable.last(),
    `Reverse Tab wraps inside the menu: ${JSON.stringify(reverseFocus)}`,
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(focusable.first()).toBeFocused();
  await page.locator(".site-header .wordmark").focus();
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("local channels preserve focus and never start external navigation", async ({ page, context }) => {
  const externalRequests: string[] = [];
  const popups: string[] = [];
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  await context.route("**/*", async route => {
    if (new URL(route.request().url()).origin !== origin) {
      externalRequests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  context.on("page", popup => popups.push(popup.url()));
  for (const [button, label, destination] of [
    ["WhatsApp", "Converse pelo WhatsApp", "/agendamento"],
    ["Telefone", "Atendimento por telefone", "/agendamento"],
    ["Instagram", "Livre no Instagram", "/galeria"],
  ]) {
    await page.goto("/");
    const trigger = page.locator("main").getByRole("button", { name: button, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: label });
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toContainText(/demonstrativ|fictíci|ilustrativ/i);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    expect(new URL(page.url()).origin).toBe(origin);
  }
  expect(externalRequests).toEqual([]);
  expect(popups).toEqual([]);
});

test("map requests begin only after opting in without a referrer", async ({ page }) => {
  const requests: { url: string; referer?: string }[] = [];
  await page.route("https://www.openstreetmap.org/**", async route => {
    requests.push({ url: route.request().url(), referer: route.request().headers().referer });
    await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><html><body>Mapa dos Jardins</body></html>" });
  });
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Explorar a região" }).click();
  const map = page.getByTitle("Mapa da região dos Jardins, São Paulo");
  await map.scrollIntoViewIfNeeded();
  await expect(map).toBeVisible();
  await expect.poll(() => requests.length).toBe(1);
  expect(new URL(requests[0].url).hostname).toBe("www.openstreetmap.org");
  expect(requests[0].referer).toBeUndefined();
});
