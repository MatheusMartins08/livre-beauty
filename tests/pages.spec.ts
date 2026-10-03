import { expect, test } from "@playwright/test";

const pages = [
  ["/sobre", "A liberdade começa na escuta."],
  ["/servicos", "Cuidado que acompanha você."],
  ["/profissionais", "Mãos que cuidam. Olhares que entendem."],
  ["/galeria", "Beleza em suas muitas formas."],
  ["/politicas", "Cuidado também é clareza."],
  ["/privacidade", "Sua privacidade, com clareza."],
  ["/termos", "Termos de uso."],
  ["/profissionais/lia-monteiro", "Lia Monteiro"],
  ["/profissionais/rafael-costa", "Rafael Costa"],
  ["/profissionais/marina-alves", "Marina Alves"],
  ["/profissionais/sofia-dias", "Sofia Dias"],
] as const;

for (const [path, title] of pages) {
  test(`${path} has its own accessible page and metadata`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page).toHaveTitle(/Livre Beauty/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S+/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${path}$`),
    );
  });
}

test("service booking keeps the selected service", async ({ page }) => {
  await page.goto("/servicos#corte-autoral");
  await expect(page.locator("#corte-autoral").getByRole("link", { name: "Agendar Corte autoral", exact: true })).toHaveAttribute("href", "/agendamento?servico=corte-autoral");
});

test("professional booking keeps the selected professional", async ({
  page,
}) => {
  await page.goto("/profissionais/lia-monteiro");
  await expect(
    page.getByRole("link", { name: "Agendar com Lia", exact: true }),
  ).toHaveAttribute("href", "/agendamento?profissional=lia-monteiro");
  await expect(
    page.getByRole("link", {
      name: "Agendar Corte autoral com Lia",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
});

test("professional directory filters to a compatible service", async ({
  page,
}) => {
  await page.goto("/profissionais");
  await page
    .getByRole("combobox", { name: "Escolha um serviço" })
    .selectOption("balayage");
  await expect(
    page.getByRole("heading", { name: "Rafael Costa", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lia Monteiro", exact: true }),
  ).toHaveCount(0);
});

test("unknown service and professional return 404", async ({ page }) => {
  for (const path of [
    "/servicos/servico-inexistente",
    "/profissionais/pessoa-inexistente",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});
