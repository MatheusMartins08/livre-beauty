import { expect, test } from "@playwright/test";
import { bookingWhatsAppHref } from "../lib/booking-whatsapp";

const booking = {
  slot: {
    id: "confirmed",
    serviceId: "balayage",
    stylistId: "rafael",
    date: "2026-10-09",
    time: "11:00",
    startAt: "2026-10-09T14:00:00.000Z",
  },
  clientName: "  Ana & Júlia  ",
  serviceName: "Balayage & luz",
  stylistName: "Rafael Costa",
  durationMinutes: 180,
  salonName: "Livre Beauty",
  phoneNumber: "553171906379",
};

test("WhatsApp receives the configured recipient and confirmed appointment details", () => {
  const url = new URL(bookingWhatsAppHref(booking));
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/553171906379");
  const text = url.searchParams.get("text")!;
  expect(text).toContain("Nome: Ana & Júlia");
  expect(text).toContain("Serviço: Balayage & luz");
  expect(text).toContain("Profissional: Rafael Costa");
  expect(text).toContain("Data: sexta-feira, 9 de outubro de 2026");
  expect(text).toContain("Horário: 11:00 às 14:00 (horário de São Paulo)");
  expect(text).toContain("Duração prevista: 180 minutos");
  expect(url.searchParams.size).toBe(1);
});

test("WhatsApp keeps São Paulo's date when the UTC date has changed", () => {
  const url = new URL(bookingWhatsAppHref({
    ...booking,
    slot: { ...booking.slot, startAt: "2026-10-10T01:00:00.000Z" },
    durationMinutes: 60,
  }));
  const text = url.searchParams.get("text")!;
  expect(text).toContain("Data: sexta-feira, 9 de outubro de 2026");
  expect(text).toContain("22:00 às 23:00");
});

test("WhatsApp normalizes the recipient without changing its digits", () => {
  expect(new URL(bookingWhatsAppHref({ ...booking, phoneNumber: "+55 (31) 7190-6379" })).pathname).toBe("/553171906379");
  for (const phoneNumber of [undefined, "", "123"]) {
    const url = new URL(bookingWhatsAppHref({ ...booking, phoneNumber }));
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("text")).toContain("Agendamento".toLowerCase());
  }
});
