import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-02T11:00:00Z") });
});

async function chooseDateAndTime(page: Page) {
  await page.getByLabel("Dia do atendimento").selectOption("2026-10-03");
  const times = page.getByRole("radio", { name: /^\d{2}:\d{2}/ });
  await expect(times.first()).toBeVisible();
  await times.first().check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}

async function failNextTimeZoneFormatter(page: Page) {
  // Fail the runtime dependency once, leaving the actual adapter and retry flow intact.
  await page.evaluate(() => {
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function (
      ...args: Parameters<typeof Intl.DateTimeFormat>
    ) {
      if (args[1]?.timeZoneName === "longOffset") {
        Intl.DateTimeFormat = OriginalDateTimeFormat;
        throw new Error("Transient time-zone formatter failure");
      }
      return new OriginalDateTimeFormat(...args);
    } as typeof Intl.DateTimeFormat;
  });
}

test("valid query parameters preselect the service and compatible professional", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await expect(
    page.getByRole("radio", { name: /Corte autoral/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("radio", { name: /Lia Monteiro/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Rafael Costa/ })).toHaveCount(
    0,
  );
});

test("ignores unknown query parameters and incompatible professional preselection", async ({
  page,
}) => {
  await page.goto("/agendamento?servico=inexistente&profissional=inexistente");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#booking-error")).toContainText(
    "Selecione um serviço",
  );
  await page.goto("/agendamento?servico=extensoes&profissional=lia-monteiro");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("radio", { name: /Sofia Dias/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Lia Monteiro/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("radio", { name: /Sofia Dias/ }),
  ).not.toBeChecked();
});

test("retains choices when going back and clears downstream choices after a service change", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await chooseDateAndTime(page);
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.getByLabel("Dia do atendimento")).toHaveValue("2026-10-03");
  await expect(page.locator('input[name="time"]:checked')).toHaveCount(1);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Nome completo")).toHaveValue("Pessoa Teste");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("radio", { name: /Extensões naturais/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("radio", { name: /Sofia Dias/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Dia do atendimento")).toHaveValue("");
});

test("validates contact fields with accessible errors and completes one local simulation", async ({
  page,
}) => {
  const postedRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") postedRequests.push(request.url());
  });
  await page.goto("/agendamento?servico=corte-autoral");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("radio", { name: /Sem preferência/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await chooseDateAndTime(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Nome completo")).toBeFocused();
  await expect(page.getByLabel("Nome completo")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await page.getByLabel("Celular com DDD").fill("123");
  await page.getByLabel("E-mail").fill("invalido");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Celular com DDD")).toBeFocused();
  await page.getByLabel("Celular com DDD").fill("(11) 99999-8888");
  await page.getByLabel("E-mail").fill("teste@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Revise sua escolha" }),
  ).toBeVisible();
  await expect(
    page.locator("form dd").filter({ hasText: "Lia Monteiro" }),
  ).toHaveCount(1);
  await expect(
    page.locator("form dd").filter({ hasText: "Pessoa Teste" }),
  ).toContainText("teste@example.com");
  await page.clock.pauseAt(new Date("2026-10-02T11:01:00Z"));
  await page
    .getByRole("button", { name: "Concluir simulação", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect(
    page.getByRole("button", { name: "Concluindo…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Voltar", exact: true }),
  ).toBeDisabled();
  await page.clock.runFor(400);
  await expect(
    page.getByRole("heading", { name: "Simulação concluída" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Simulação concluída" }),
  ).toBeFocused();
  await expect(
    page.getByRole("status").filter({ hasText: "Simulação concluída" }),
  ).toHaveCount(1);
  await expect(page.getByText(/Nenhuma reserva real foi criada/)).toBeVisible();
  expect(postedRequests).toEqual([]);
});

test("shows loading and lets the user retry a temporary availability failure", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await failNextTimeZoneFormatter(page);
  await page.clock.pauseAt(new Date("2026-10-02T11:01:00Z"));
  await page.getByLabel("Dia do atendimento").selectOption("2026-10-03");
  await expect(
    page.getByRole("status").filter({ hasText: "Consultando horários" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  await page.clock.runFor(200);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Não foi possível consultar os horários",
  );
  await expect(page.getByLabel("Dia do atendimento")).toHaveValue("2026-10-03");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await page.clock.runFor(200);
  await expect(
    page.getByRole("radio", { name: /^\d{2}:\d{2}/ }).first(),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("explains a full day and returns focus to the date instead of advancing", async ({
  page,
}) => {
  await page.goto("/agendamento?servico=extensoes&profissional=sofia-dias");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Dia do atendimento").selectOption("2026-10-14");
  await expect(
    page.getByRole("status").filter({ hasText: "Não há horários" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: /^\d{2}:\d{2}/ })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Dia do atendimento")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Encontre seu horário" }),
  ).toBeVisible();
  await page.getByLabel("Dia do atendimento").selectOption("2026-10-15");
  await expect(
    page.getByRole("radio", { name: /^\d{2}:\d{2}/ }).first(),
  ).toBeVisible();
});

test("changing a professional clears the previous date and time", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await chooseDateAndTime(page);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("radio", { name: /Marina Alves/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Dia do atendimento")).toHaveValue("");
  await expect(page.getByRole("radio", { name: /^\d{2}:\d{2}/ })).toHaveCount(
    0,
  );
});

test("retains the review after a temporary submit failure and completes using the keyboard", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await chooseDateAndTime(page);
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await page.getByLabel("Celular com DDD").fill("11999998888");
  await page.getByLabel("E-mail").fill("teste@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await failNextTimeZoneFormatter(page);
  const submit = page.getByRole("button", {
    name: "Concluir simulação",
    exact: true,
  });
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#booking-error")).toContainText(
    "Seus dados foram mantidos",
  );
  await expect(
    page.locator("form dd").filter({ hasText: "Pessoa Teste" }),
  ).toContainText("teste@example.com");
  await expect(submit).toBeEnabled();
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Simulação concluída" }),
  ).toBeFocused();
  await expect(page.locator("#booking-error")).toHaveCount(0);
});

test("revalidates a stale time and returns to date selection", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await chooseDateAndTime(page);
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await page.getByLabel("Celular com DDD").fill("11999998888");
  await page.getByLabel("E-mail").fill("teste@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.clock.setSystemTime(new Date("2026-10-04T01:00:00Z"));
  await page
    .getByRole("button", { name: "Concluir simulação", exact: true })
    .click();
  await expect(page.locator("#booking-error")).toContainText(
    "não está mais disponível",
  );
  await expect(
    page.getByRole("heading", { name: "Encontre seu horário" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Simulação concluída" }),
  ).toHaveCount(0);
});

test("focuses date selection when a chosen time expires before continuing", async ({
  page,
}) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Dia do atendimento").selectOption("2026-10-03");
  const times = page.getByRole("radio", { name: /^\d{2}:\d{2}/ });
  await expect(times.first()).toBeVisible();
  await times.first().check();
  await page.clock.setSystemTime(new Date("2026-10-04T01:00:00Z"));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#booking-error")).toContainText(
    "não está mais disponível",
  );
  await expect(page.getByLabel("Dia do atendimento")).toBeFocused();
  await expect(page.getByLabel("Dia do atendimento")).toHaveAttribute(
    "aria-describedby",
    /booking-error/,
  );
});
