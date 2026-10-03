import { test, expect } from "@playwright/test";

test("home communicates the brand and offers booking immediately", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A beleza de ser você.", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".hero").getByRole("link", { name: "Agendar horário" }),
  ).toBeVisible();
  await expect(
    page.locator(".hero").getByRole("link", { name: "Conhecer serviços" }),
  ).toBeVisible();
});

test("mobile menu closes with Escape and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Menu de navegação" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Menu de navegação" }),
  ).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("gallery filters, navigates in lightbox and restores focus", async ({
  page,
}) => {
  await page.goto("/galeria");
  await page.getByRole("button", { name: "Cortes", exact: true }).click();
  const thumbnail = page.getByRole("button", {
    name: "Abrir imagem: Forma livre",
  });
  await expect(thumbnail).toBeVisible();
  await thumbnail.click();
  await expect(
    page.getByRole("dialog", { name: "Galeria de referências" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(thumbnail).toBeFocused();
});

test("home keeps only the requested editorial sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main section")).toHaveCount(8);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(
    page.locator(".values-strip, .booking-cta, .instagram-grid, .stylist-card"),
  ).toHaveCount(0);
  await expect(page.locator('main a[href^="/servicos/"]')).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Conheça nossos especialistas." }),
  ).toBeVisible();
});

test("contact validates inline and never makes a submission request", async ({
  page,
}) => {
  await page.goto("/contato");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    page.getByText("Informe seu nome.", { exact: true }),
  ).toBeVisible();
  const transmissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") transmissions.push(request.url());
  });
  await page.getByLabel("Nome", { exact: true }).fill("Pessoa de teste");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Assunto", { exact: true }).selectOption("servicos");
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Gostaria de conhecer os serviços.");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Mensagem simulada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mensagem simulada" }),
  ).toBeFocused();
  expect(transmissions).toEqual([]);
  await page.getByRole("button", { name: "Escrever outra mensagem" }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
});

test("lightbox arrow navigation works from the initial close button focus", async ({
  page,
}) => {
  await page.goto("/galeria");
  await page
    .getByRole("button", { name: "Abrir imagem: Luz em movimento" })
    .click();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Forma livre" }),
  ).toBeVisible();
});

test("FAQ answers remain readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/faq");
  await page
    .getByRole("button", { name: "Como funciona a primeira consulta?" })
    .click();
  await expect(
    page
      .locator("details")
      .filter({ hasText: "Como funciona a primeira consulta?" }),
  ).toHaveAttribute("open", "");
  await expect(
    page.getByText(/Começamos com uma conversa sobre sua rotina/),
  ).toBeVisible();
  await context.close();
});

test("FAQ announces its expanded state and supports the keyboard", async ({
  page,
}) => {
  await page.goto("/faq");
  const question = page.getByRole("button", {
    name: "Como funciona a primeira consulta?",
  });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText(/Começamos com uma conversa sobre sua rotina/),
  ).toBeVisible();
});
