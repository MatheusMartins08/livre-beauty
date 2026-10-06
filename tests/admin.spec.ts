import { expect, test, type Page } from "@playwright/test";

async function section(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  if (
    (await menu.isVisible()) &&
    (await menu.getAttribute("aria-expanded")) === "false"
  )
    await menu.click();
  await page
    .getByRole("navigation", { name: "Navegação do painel" })
    .getByRole("button", { name, exact: true })
    .click();
}

test("owner workspace navigates every section without public chrome", async ({
  page,
}) => {
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "O dia no ateliê" }),
  ).toBeVisible();
  await expect(page.locator(".site-header, .site-footer")).toHaveCount(0);
  await expect(page.locator(".lb-metrics")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Navegação do painel" })
      .getByRole("button", { name: /Planos|Assinantes/ }),
  ).toHaveCount(0);
  for (const name of [
    "Agenda",
    "Clientes",
    "Equipe",
    "Fechamento",
    "Serviços",
  ]) {
    await section(page, name);
    await expect(page.locator(".lb-page-heading h1")).toHaveText(name);
  }
  await page.getByRole("link", { name: "Visitar o site" }).click();
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-footer")).toHaveCount(1);
});

test("employee sees only their agenda, clients and commissions", async ({
  page,
}) => {
  await page.goto("/painel?perfil=funcionario&profissional=rafael");
  await expect(
    page.getByRole("heading", { name: "Seu dia, Rafael" }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Navegação do painel" });
  await expect(
    nav.getByRole("button", { name: "Assinantes", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("button", { name: "Equipe", exact: true }),
  ).toHaveCount(0);
  await section(page, "Minhas comissões");
  await expect(page.locator(".lb-table tbody tr").first()).toContainText(
    "Rafael Costa",
  );
  await expect(page.locator(".lb-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Perfil de demonstração").selectOption("dono");
  await expect(
    page.getByRole("heading", { name: "O dia no ateliê" }),
  ).toBeVisible();
  await expect(
    nav.getByRole("button", { name: "Equipe", exact: true }),
  ).toBeVisible();
});

test("agenda supports filters, empty states and status changes", async ({
  page,
}) => {
  await page.goto("/painel");
  const current = await page.getByLabel("Data do painel").inputValue();
  const weekday = new Date(`${current}T12:00:00Z`).getUTCDay();
  if (weekday < 2) {
    const next = new Date(`${current}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + (2 - weekday));
    await page
      .getByLabel("Data do painel")
      .fill(next.toISOString().slice(0, 10));
  }
  await section(page, "Agenda");
  await page.getByLabel("Filtrar profissional").selectOption("lia");
  await expect(page.locator(".lb-table tbody tr")).toHaveCount(3);
  await page.getByLabel("Buscar atendimento").fill("Não existe");
  await expect(
    page.getByRole("heading", { name: "Nenhum atendimento com esses filtros" }),
  ).toBeVisible();
  await page.getByLabel("Buscar atendimento").fill("");
  const status = page.locator(".lb-status select").first();
  await status.selectOption("cancelado");
  await expect(page.getByRole("status")).toContainText(
    "Status do atendimento atualizado",
  );
  await page.getByLabel("Filtrar status").selectOption("cancelado");
  await expect(page.locator(".lb-table tbody tr")).toHaveCount(1);
});

test("appointment form rejects collisions and closed days, then saves", async ({
  page,
}) => {
  await page.goto("/painel");
  await section(page, "Agenda");
  await page
    .getByRole("button", { name: "Novo agendamento", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const today = await page.getByLabel("Data do painel").inputValue();
  const selected = new Date(`${today}T12:00:00Z`);
  while (selected.getUTCDay() !== 2)
    selected.setUTCDate(selected.getUTCDate() + 1);
  const tuesday = selected.toISOString().slice(0, 10);
  await dialog.getByLabel("Data", { exact: true }).fill(tuesday);
  await dialog.getByLabel("Horário", { exact: true }).fill("09:00");
  await dialog.getByRole("button", { name: "Salvar atendimento" }).click();
  await expect(dialog.getByRole("alert")).toContainText("sobrepõe");
  selected.setUTCDate(selected.getUTCDate() - 2);
  await dialog
    .getByLabel("Data", { exact: true })
    .fill(selected.toISOString().slice(0, 10));
  await dialog.getByRole("button", { name: "Salvar atendimento" }).click();
  await expect(dialog.getByRole("alert")).toContainText("terça a sábado");
  await dialog.getByLabel("Data", { exact: true }).fill(tuesday);
  await dialog.getByLabel("Horário", { exact: true }).fill("11:00");
  await dialog.getByLabel("Observações").fill("Atendimento criado pelo teste");
  await dialog.getByRole("button", { name: "Salvar atendimento" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Atendimento salvo");
  await expect(
    page.locator(".lb-table tbody tr").filter({ hasText: "11:00" }),
  ).toHaveCount(1);
});

test("client validation, history and payroll export work locally", async ({
  page,
}) => {
  await page.goto("/painel");
  await section(page, "Clientes");
  await page.getByRole("button", { name: "Novo cliente" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome completo").fill("Cliente Teste");
  await dialog.getByLabel("Telefone com DDD").fill("123");
  await dialog.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(dialog.getByRole("alert")).toContainText("telefone com DDD");
  await dialog.getByLabel("Telefone com DDD").fill("11999998888");
  await dialog.getByRole("button", { name: "Salvar cliente" }).click();
  await page.getByLabel("Buscar cliente").fill("Cliente Teste");
  await expect(page.locator(".lb-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Ver ficha de Cliente Teste" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Ainda sem atendimentos",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await section(page, "Fechamento");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(
    /^livre-fechamento-.*\.csv$/,
  );
});

test("staff access selects a professional and supports leaving the workspace", async ({
  page,
}) => {
  await page.goto("/painel/entrar");
  await expect(page.locator(".site-header, .site-footer")).toHaveCount(0);
  await page.getByRole("radio", { name: /Funcionário/ }).check();
  await page
    .getByRole("combobox", { name: "Profissional", exact: true })
    .selectOption("sofia");
  await page.getByRole("link", { name: "Explorar painel" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu dia, Sofia" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sair da prévia" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu espaço no ateliê" }),
  ).toBeVisible();
});

test("mobile menu, all sections and dialog fit narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/painel");
  for (const name of [
    "Agenda",
    "Clientes",
    "Equipe",
    "Fechamento",
    "Serviços",
    "Visão geral",
  ]) {
    await section(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Novo agendamento" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const box = await page.getByRole("dialog").boundingBox();
  expect(box!.width).toBeLessThan(390);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("compact agenda keeps every appointment accessible and resets filtered pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/painel");
  const date = await page.getByLabel("Data do painel").inputValue();
  const next = new Date(`${date}T12:00:00Z`);
  while (next.getUTCDay() < 2) next.setUTCDate(next.getUTCDate() + 1);
  await page.getByLabel("Data do painel").fill(next.toISOString().slice(0, 10));
  await section(page, "Agenda");
  const rows = page.locator(".lb-agenda-table tbody tr:visible");
  const pages = page.getByRole("navigation", { name: "Páginas da agenda" });
  const ids = new Set<string>();
  for (let current = 0; current < 3; current++) {
    await expect(rows).toHaveCount(4);
    for (const name of await rows
      .locator("button[aria-label]")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")!),
      ))
      ids.add(name);
    const first = await rows.first().boundingBox();
    expect(first!.height).toBeLessThan(220);
    if (current < 2)
      await pages.getByRole("button", { name: "Próxima página" }).click();
  }
  expect(ids.size).toBe(12);
  await expect(
    pages.getByRole("button", { name: "Próxima página" }),
  ).toBeDisabled();
  await rows
    .first()
    .getByRole("button", { name: /^Editar atendimento/ })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Observações")
    .fill("Edição da última página");
  await page.getByRole("button", { name: "Salvar atendimento" }).click();
  await expect(page.getByRole("status")).toContainText("Atendimento salvo");
  await page.getByLabel("Filtrar profissional").selectOption("lia");
  await expect(rows).toHaveCount(3);
  await expect(pages).toHaveCount(0);
  await page.getByLabel("Filtrar profissional").selectOption("todos");
  await expect(rows).toHaveCount(4);
  await expect(pages).toContainText("1–4 de 12");
  await expect(
    pages.getByRole("button", { name: "Página anterior" }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 1440, height: 844 });
  await expect(rows).toHaveCount(12);
  await expect(pages).toBeHidden();
});

test("compact clients, history and service pages retain all data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/painel");
  await section(page, "Clientes");
  const clients = page.locator(".lb-client-table tbody tr:visible");
  const pages = page.getByRole("navigation", { name: "Páginas de clientes" });
  await expect(clients).toHaveCount(4);
  await pages.getByRole("button", { name: "Próxima página" }).click();
  await pages.getByRole("button", { name: "Próxima página" }).click();
  await expect(clients).toContainText([
    "Laura Mendes",
    "Gabriela Souza",
    "Renata Dias",
    "Luiza Ferreira",
  ]);
  await page
    .getByRole("button", { name: "Ver ficha de Luiza Ferreira" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".lb-history li:visible")).toHaveCount(4);
  await dialog
    .getByRole("navigation", { name: "Páginas do histórico" })
    .getByRole("button", { name: "Próxima página" })
    .click();
  expect(
    await dialog.locator(".lb-history li:visible").count(),
  ).toBeLessThanOrEqual(4);
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByLabel("Buscar cliente").fill("Camila");
  await expect(clients).toHaveCount(1);
  await expect(clients).toContainText("Camila Ribeiro");
  await expect(pages).toHaveCount(0);
  await section(page, "Serviços");
  await expect(page.locator(".lb-catalog-table tbody tr:visible")).toHaveCount(
    4,
  );
  await page
    .getByRole("navigation", { name: "Páginas de serviços" })
    .getByRole("button", { name: "Próxima página" })
    .click();
  await expect(page.locator(".lb-catalog-table tbody tr:visible")).toHaveCount(
    2,
  );
  await expect(
    page.locator(".lb-catalog-table tbody tr:visible"),
  ).toContainText(["Finalização & penteados", "Extensões naturais"]);
});

test("small screens keep the menu reachable and tablet lists stay bounded", async ({
  page,
}) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/painel");
    for (const name of [
      "Agenda",
      "Clientes",
      "Equipe",
      "Fechamento",
      "Serviços",
      "Visão geral",
    ]) {
      await section(page, name);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(
        await page.locator(".lb-table tbody tr:visible").count(),
      ).toBeLessThanOrEqual(4);
    }
    await page.evaluate(() => window.scrollTo(0, 700));
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    expect((await menu.boundingBox())!.y).toBeLessThan(80);
    await section(page, "Equipe");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
});
