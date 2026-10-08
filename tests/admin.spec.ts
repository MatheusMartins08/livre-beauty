import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { testSupabaseConfig } from "./supabase-config";

test("rejects a forged session cookie", async ({ page, context, baseURL }) => {
  const { url } = testSupabaseConfig();
  const ref = new URL(url).hostname.split(".")[0];
  await context.addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value: "base64-eyJhY2Nlc3NfdG9rZW4iOiJmb3JnZWQifQ",
      url: baseURL!,
    },
  ]);
  await page.goto("/painel?perfil=dono");
  await expect(page).toHaveURL(/\/painel\/entrar$/);
});

test("server actions reject unauthenticated calls independently of the page redirect", async ({
  request,
  baseURL,
}) => {
  test.skip(
    process.env.TEST_PRODUCTION !== "true",
    "Uses the current production action manifest.",
  );
  const manifest = JSON.parse(
    readFileSync(".next/server/server-reference-manifest.json", "utf8"),
  ) as { node: Record<string, { filename: string; exportedName: string }> };
  const actions = Object.entries(manifest.node).filter(
    ([, action]) => action.filename === "lib/admin-actions.ts",
  );
  expect(actions.length).toBe(3);
  for (const [id, action] of actions) {
    const args =
      action.exportedName === "changeAppointmentStatus"
        ? ["not-an-appointment", "cancelado"]
        : [{}];
    const response = await request.post("/painel", {
      headers: {
        "Next-Action": id,
        Accept: "text/x-component",
        Origin: baseURL!,
        "Content-Type": "text/plain;charset=UTF-8",
      },
      data: JSON.stringify(args),
    });
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('"ok":false');
  }
});

test("protects the panel and ignores role selections in the URL", async ({
  page,
}) => {
  for (const route of [
    "/painel",
    "/painel?perfil=dono&profissional=lia",
    "/painel?perfil=funcionario&profissional=rafael",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/painel\/entrar$/);
    await expect(
      page.getByRole("button", { name: "Entrar no painel" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegação do painel" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Perfil de demonstração")).toHaveCount(0);
    await expect(page.locator(".site-header, .site-footer")).toHaveCount(0);
  }
});

test("rejects invalid credentials without exposing accounts or granting access", async ({
  page,
}) => {
  await page.goto("/painel/entrar");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("unregistered@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("invalid-test-password");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page.locator("#login-error")).toContainText(
    "Não foi possível entrar",
  );
  await expect(page).toHaveURL(/\/painel\/entrar$/);
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    "unregistered@example.com",
  );
  await expect(
    page.getByRole("button", { name: /cadastro|registrar|criar conta/i }),
  ).toHaveCount(0);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel\/entrar$/);
});

for (const width of [360, 768, 1440]) {
  test(`login remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/painel/entrar");
    await expect(
      page.getByRole("heading", { name: "Seu espaço no ateliê" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveAttribute(
      "autocomplete",
      "username",
    );
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "Voltar para o site" }).click();
    await expect(page).toHaveURL("/");
  });
}

test("login form works without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/painel/entrar`);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("unregistered@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("invalid-test-password");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page.locator("#login-error")).toContainText(
    "Não foi possível entrar",
  );
  await context.close();
});
