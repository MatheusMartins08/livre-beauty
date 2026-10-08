import { expect, test, type Page } from "@playwright/test";

const next = (page: Page) =>
  page.getByRole("button", { name: "Continuar", exact: true }).click();
const back = (page: Page) =>
  page.getByRole("button", { name: "Voltar", exact: true }).click();
const timeChoices = (page: Page) =>
  page.getByRole("radio", { name: /^\d{2}:\d{2}/ });

async function schedule(page: Page, any = false) {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await next(page);
  if (any) await page.getByRole("radio", { name: /Sem preferência/ }).check();
  await next(page);
}

async function chooseFutureDay(page: Page) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  for (let month = 0; month < 2; month++) {
    const days = page.locator('input[name="booking-day"]');
    for (let i = 0; i < (await days.count()); i++) {
      const date = await days.nth(i).inputValue();
      if (date > today) {
        await days.nth(i).check();
        await expect(timeChoices(page).first()).toBeVisible();
        return date;
      }
    }
    await page.getByRole("button", { name: "Próximo mês" }).click();
  }
  throw new Error("No future working day available");
}

async function contactStep(page: Page, any = false) {
  await schedule(page, any);
  await chooseFutureDay(page);
  await timeChoices(page).first().check();
  await next(page);
}

async function review(page: Page, any = false) {
  await contactStep(page, any);
  await page.getByLabel("Nome completo").fill("Teste Playwright Reserva");
  await page.getByLabel("Celular com DDD").fill("11900007771");
  await page.getByLabel("E-mail").fill("playwright-reserva@example.com");
  await next(page);
}

test("preselects only compatible query parameters", async ({ page }) => {
  await page.goto(
    "/agendamento?servico=corte-autoral&profissional=lia-monteiro",
  );
  await expect(
    page.getByRole("radio", { name: /Corte autoral/ }),
  ).toBeChecked();
  await next(page);
  await expect(page.getByRole("radio", { name: /Lia Monteiro/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Rafael Costa/ })).toHaveCount(
    0,
  );
  await page.goto("/agendamento?servico=extensoes&profissional=lia-monteiro");
  await next(page);
  await expect(
    page.getByRole("radio", { name: /Sofia Dias/ }),
  ).not.toBeChecked();
  await expect(page.getByRole("radio", { name: /Lia Monteiro/ })).toHaveCount(
    0,
  );
  await page.goto("/agendamento?servico=inexistente&profissional=inexistente");
  await next(page);
  await expect(page.locator("#booking-error")).toContainText(
    "Selecione um serviço",
  );
});

test("calendar validates dates, supports keyboard selection and month navigation", async ({
  page,
}) => {
  await schedule(page);
  await expect(
    page.getByRole("button", { name: "Mês anterior" }),
  ).toBeDisabled();
  await next(page);
  await expect(page.locator("#booking-date")).toBeFocused();
  await expect(
    page.getByRole("group", { name: "Qual dia combina com você?" }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.keyboard.press("Space");
  await expect(page.locator('input[name="booking-day"]:checked')).toHaveCount(
    1,
  );
  if (await page.getByRole("button", { name: "Próximo mês" }).isEnabled()) {
    await page.getByRole("button", { name: "Próximo mês" }).click();
    await expect(
      page.getByRole("button", { name: "Próximo mês" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Mês anterior" }).click();
    await expect(page.locator('input[name="booking-day"]:checked')).toHaveCount(
      1,
    );
  }
  const dates = await page
    .locator('input[name="booking-day"]')
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
  expect(
    dates.every(
      (date) => ![0, 1].includes(new Date(date + "T12:00:00Z").getUTCDay()),
    ),
  ).toBe(true);
});

test("keeps contact when going back and clears dates after a professional change", async ({
  page,
}) => {
  await contactStep(page);
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await back(page);
  await expect(page.locator('input[name="time"]:checked')).toHaveCount(1);
  await next(page);
  await expect(page.getByLabel("Nome completo")).toHaveValue("Pessoa Teste");
  await back(page);
  await back(page);
  await page.getByRole("radio", { name: /Marina Alves/ }).check();
  await next(page);
  await expect(page.locator('input[name="booking-day"]:checked')).toHaveCount(
    0,
  );
  await expect(timeChoices(page)).toHaveCount(0);
});

test("validates contact fields and reviews without saving before confirmation", async ({
  page,
}) => {
  await contactStep(page, true);
  await next(page);
  await expect(page.getByLabel("Nome completo")).toBeFocused();
  await expect(page.getByLabel("Nome completo")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Nome completo").fill("Pessoa Teste");
  await page.getByLabel("Celular com DDD").fill("123");
  await page.getByLabel("E-mail").fill("invalid");
  await next(page);
  await expect(page.getByLabel("Celular com DDD")).toBeFocused();
  await page.getByLabel("Celular com DDD").fill("+55 (11) 99999-8888");
  await page.getByLabel("E-mail").fill("teste@example.com");
  await next(page);
  await expect(
    page.getByRole("heading", { name: "Revise sua escolha" }),
  ).toBeVisible();
  await expect(
    page.locator("form dd").filter({ hasText: "Pessoa Teste" }),
  ).toContainText("teste@example.com");
  await expect(
    page.getByRole("button", { name: "Confirmar agendamento" }),
  ).toBeEnabled();
});

for (const width of [390, 1440]) {
  test(`phone mask supports typing, paste, deletion and review at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await contactStep(page);
    const phone = page.getByLabel("Celular com DDD");
    await phone.pressSequentially("11999998888");
    await expect(phone).toHaveValue("(11) 99999-8888");
    await phone.press("Backspace");
    await expect(phone).toHaveValue("(11) 9999-9888");
    await phone.fill("+55 (11) 99999-8888");
    await expect(phone).toHaveValue("(11) 99999-8888");
    // Editing in the middle must leave the caret next to the edited digit.
    await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(6, 7));
    await phone.press("8");
    await expect(phone).toHaveValue("(11) 98999-8888");
    expect(await phone.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(7);
    // Backspace at the dash deletes the previous digit rather than trapping the caret.
    await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(11, 11));
    await phone.press("Backspace");
    await expect(phone).toHaveValue("(11) 9899-8888");
    // Mobile keyboards can emit input events without a keydown.
    await phone.fill("11999998888");
    await phone.evaluate((input: HTMLInputElement) => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setValue.call(input, input.value.replace("-", ""));
      input.setSelectionRange(10, 10);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
    });
    await expect(phone).toHaveValue("(11) 9999-8888");
    await phone.fill("1133334444");
    await expect(phone).toHaveValue("(11) 3333-4444");
    await phone.fill("");
    await expect(phone).toHaveValue("");
    await phone.fill("11999998888");
    await page.getByLabel("Nome completo").fill("Pessoa Teste");
    await page.getByLabel("E-mail").fill("teste@example.com");
    await next(page);
    await expect(page.locator("form dd").filter({ hasText: "Pessoa Teste" })).toContainText("(11) 99999-8888");
    await back(page);
    await expect(phone).toHaveValue("(11) 99999-8888");
  });
}

test("retries a failed server availability request", async ({ page }) => {
  await schedule(page);
  let fail = true;
  await page.route("**/agendamento**", async (route) => {
    if (
      fail &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      fail = false;
      await route.abort();
    } else await route.continue();
  });
  const days = page.locator('input[name="booking-day"]');
  await days.last().check();
  await expect(
    page.getByRole("alert").filter({ hasText: "Não foi possível consultar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(timeChoices(page).first()).toBeVisible();
});

test("retains the review when confirmation fails and blocks repeated submission", async ({
  page,
}) => {
  await review(page);
  let calls = 0;
  let release: () => void = () => {};
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/agendamento**", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      calls++;
      await wait;
      await route.abort();
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Confirmar agendamento" })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(
    page.getByRole("button", { name: "Concluindo…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Voltar", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page.locator("#booking-error")).toContainText(
    "Seus dados foram mantidos",
  );
  await expect(
    page.locator("form dd").filter({ hasText: "Teste Playwright" }),
  ).toContainText("playwright-reserva@example.com");
  expect(calls).toBe(1);
});

test("returns focus to the calendar when a selected start has expired", async ({
  page,
}) => {
  await schedule(page);
  const date = await chooseFutureDay(page);
  await timeChoices(page).first().check();
  await page.clock.install({ time: new Date(date + "T23:59:00Z") });
  await next(page);
  await expect(page.locator("#booking-error")).toContainText(
    "não está mais disponível",
  );
  await expect(page.locator("#booking-date")).toBeFocused();
});

test("persists one public reservation and confirms its assigned professional", async ({
  page,
}) => {
  test.skip(
    process.env.LIVE_BOOKING_TESTS !== "true",
    "Opt in only on the development project; clean the named fixture afterwards.",
  );
  await review(page, true);
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(
    page.getByRole("heading", { name: "Agendamento confirmado" }),
  ).toBeFocused();
  await expect(page.getByRole("status")).toContainText(
    "já está na agenda da equipe",
  );
  await expect(
    page.locator("dd").filter({ hasText: "Lia Monteiro" }),
  ).toHaveCount(1);
});
