import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  test(`team popup is centered, contained and keyboard accessible at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: "Conversar com a equipe", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Converse pelo WhatsApp" });
    await expect(dialog).toBeVisible();
    await expect.poll(async () => {
      const box = await dialog.boundingBox();
      return box ? Math.abs(box.x + box.width / 2 - viewport.width / 2) : Infinity;
    }).toBeLessThan(2);
    await expect.poll(async () => {
      const box = await dialog.boundingBox();
      return box ? Math.abs(box.y + box.height / 2 - viewport.height / 2) : Infinity;
    }).toBeLessThan(2);
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(viewport.width - 32);
    if (viewport.width === 1440) expect(box.width).toBe(800);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    const close = dialog.getByRole("button", { name: "Fechar", exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("link", { name: "Agendar horário", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await trigger.click();
    await page.mouse.click(2, 2);
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test("WhatsApp opens the configured number and ready message only after explicit action", async ({ page, context }) => {
  const external: string[] = [];
  await context.route("https://wa.me/**", async route => {
    external.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>WhatsApp test</title>" });
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Conversar com a equipe", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Converse pelo WhatsApp" });
  const link = dialog.getByRole("link", { name: "Abrir conversa no WhatsApp (abre em nova aba)", exact: true });
  const href = new URL((await link.getAttribute("href"))!);
  const digits = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  expect(href.hostname).toBe("wa.me");
  expect(href.pathname).toBe(`/${digits}`);
  expect(href.searchParams.get("text")).toContain("Olá, equipe Livre Beauty!");
  expect(href.searchParams.get("text")).toContain("horários disponíveis");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(external).toEqual([]);
  const popupPromise = context.waitForEvent("page");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(external).toEqual([href.toString()]);
  await expect(dialog).toBeVisible();
  await popup.close();
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  // Footer uses the same configured contact and light dialog theme.
  await page.locator("footer").getByRole("button", { name: "WhatsApp", exact: true }).click();
  const footerTitle = page.getByRole("dialog", { name: "Converse pelo WhatsApp" }).getByRole("heading");
  await expect(footerTitle).toHaveCSS("color", "rgb(36, 33, 31)");
  await expect(footerTitle).toHaveCSS("text-transform", "none");
  await expect(page.getByRole("dialog", { name: "Converse pelo WhatsApp" }).getByRole("link", { name: "Abrir conversa no WhatsApp (abre em nova aba)", exact: true })).toHaveAttribute("href", href.toString());
});
