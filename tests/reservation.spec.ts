import { expect, test } from "@playwright/test";
import { normalizeReservationCode } from "../lib/reservation";
import { bookingWhatsAppHref } from "../lib/booking-whatsapp";

test("normalizes reservation codes like the database", () => {
  for (const input of ["LB-7KQ2MX", "lb-7kq2mx", "LB 7KQ2MX", "lb7kq2mx", "7kq2mx", " 7KQ-2MX "])
    expect(normalizeReservationCode(input)).toBe("LB-7KQ2MX");
  // 0, O, 1, I and L are never generated; wrong lengths are rejected.
  for (const input of ["", "LB-7KQ2M", "LB-7KQ2MXX", "LB-0KQ2MX", "LB-IKQ2MX", "LB-LKQ2MX", "XX-7KQ2MX"])
    expect(normalizeReservationCode(input)).toBeNull();
});

test("the WhatsApp message carries the reservation code when there is one", () => {
  const booking = {
    slot: {
      id: "x",
      serviceId: "corte",
      stylistId: "lia",
      date: "2026-10-09",
      time: "10:00",
      startAt: "2026-10-09T13:00:00.000Z",
    },
    clientName: "Ana",
    serviceName: "Corte autoral",
    stylistName: "Lia Monteiro",
    durationMinutes: 60,
    salonName: "Livre Beauty",
  };
  const withCode = new URL(bookingWhatsAppHref({ ...booking, code: "LB-7KQ2MX" }));
  expect(withCode.searchParams.get("text")).toContain("Código da reserva: LB-7KQ2MX");
  const withoutCode = new URL(bookingWhatsAppHref(booking));
  expect(withoutCode.searchParams.get("text")).not.toContain("Código da reserva");
});

test("the reservation page prefills a valid code and rejects malformed input locally", async ({
  page,
}) => {
  await page.goto("/agendamento/minha-reserva?codigo=lb-7kq2mx");
  await expect(page.getByLabel("Código da reserva")).toHaveValue("LB-7KQ2MX");
  await page.goto("/agendamento/minha-reserva?codigo=nada");
  await expect(page.getByLabel("Código da reserva")).toHaveValue("");
  await page.getByLabel("Código da reserva").fill("ABC");
  await page.getByLabel("Celular usado no agendamento").fill("11999998888");
  await page.getByRole("button", { name: "Consultar reserva" }).click();
  // Next's route announcer is also an alert; look only inside the page content.
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Informe o código da reserva",
  );
});
