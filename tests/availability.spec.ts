import { expect, test } from "@playwright/test";
import {
  getAvailableSlots,
  getBookingDates,
  loadAvailability,
  submitDemoBooking,
} from "../lib/booking";

const fridayMorning = new Date("2026-10-02T11:00:00Z"); // Friday, 08:00 in São Paulo.
const contact = {
  name: "Pessoa Teste",
  phone: "11999998888",
  email: "teste@example.com",
};

test("offers working days within the next 30 São Paulo calendar days", () => {
  const dates = getBookingDates(fridayMorning);
  expect(dates[0]).toBe("2026-10-02");
  expect(dates.at(-1)).toBe("2026-10-31");
  expect(dates).not.toContain("2026-11-01");
  expect(dates).not.toContain("2026-10-04");
  expect(dates).not.toContain("2026-10-05");
});

test("uses São Paulo's calendar when the UTC day has already changed", () => {
  const dates = getBookingDates(new Date("2026-10-03T01:00:00Z"));
  expect(dates[0]).toBe("2026-10-02");
  expect(dates.at(-1)).toBe("2026-10-31");
});

test("rejects Sunday, Monday, past dates, out-of-range and malformed dates", () => {
  for (const date of [
    "2026-10-04",
    "2026-10-05",
    "2026-10-01",
    "2026-11-03",
    "2026-10-99",
    "not-a-date",
  ]) {
    expect(
      getAvailableSlots(
        { serviceId: "corte", stylistId: "lia", date },
        fridayMorning,
      ),
    ).toEqual([]);
  }
});

test("has availability on working days and never offers starts in the past", () => {
  const now = new Date("2026-10-02T15:15:00Z"); // 12:15 locally.
  const slots = getAvailableSlots(
    { serviceId: "corte", stylistId: "lia", date: "2026-10-02" },
    now,
  );
  expect(slots.length).toBeGreaterThan(0);
  expect(
    slots.every((slot) => new Date(slot.startAt).getTime() > now.getTime()),
  ).toBe(true);
  expect(slots.every((slot) => slot.time >= "12:30")).toBe(true);
});

test("fits each service entirely before closing at 19:00", () => {
  const short = getAvailableSlots(
    { serviceId: "corte", stylistId: "lia", date: "2026-10-03" },
    fridayMorning,
  );
  expect(short.length).toBeGreaterThan(0);
  expect(
    short.every((slot) => slot.time >= "09:00" && slot.time <= "18:00"),
  ).toBe(true);
  const long = getAvailableSlots(
    { serviceId: "extensoes", stylistId: "sofia", date: "2026-10-03" },
    fridayMorning,
  );
  expect(long.length).toBeGreaterThan(0);
  expect(
    long.every((slot) => slot.time >= "09:00" && slot.time <= "15:00"),
  ).toBe(true);
  expect(
    getAvailableSlots(
      { serviceId: "corte", date: "2026-10-02" },
      new Date("2026-10-02T22:00:00Z"),
    ),
  ).toEqual([]);
});

test("allows the last day of the horizon and rejects the following working day", () => {
  expect(
    getAvailableSlots({ serviceId: "corte", date: "2026-10-31" }, fridayMorning)
      .length,
  ).toBeGreaterThan(0);
  expect(
    getAvailableSlots(
      { serviceId: "corte", date: "2026-11-03" },
      fridayMorning,
    ),
  ).toEqual([]);
});

test("assigns a compatible professional without preference and rejects incompatible pairs", () => {
  const slots = getAvailableSlots(
    { serviceId: "extensoes", date: "2026-10-03" },
    fridayMorning,
  );
  expect(slots.length).toBeGreaterThan(0);
  expect(slots.every((slot) => slot.stylistId === "sofia")).toBe(true);
  expect(
    getAvailableSlots(
      { serviceId: "extensoes", stylistId: "lia", date: "2026-10-03" },
      fridayMorning,
    ),
  ).toEqual([]);
  expect(
    getAvailableSlots(
      { serviceId: "unknown", date: "2026-10-03" },
      fridayMorning,
    ),
  ).toEqual([]);
  expect(
    getAvailableSlots(
      { serviceId: "corte", stylistId: "unknown", date: "2026-10-03" },
      fridayMorning,
    ),
  ).toEqual([]);
});

test("mock busy periods are deterministic and do not expose every possible start", async () => {
  const request = { serviceId: "corte", stylistId: "lia", date: "2026-10-03" };
  const slots = getAvailableSlots(request, fridayMorning);
  expect(slots.length).toBeGreaterThan(0);
  expect(slots.length).toBeLessThan(19);
  expect(await loadAvailability(request, fridayMorning)).toEqual(slots);
  expect(getAvailableSlots(request, fridayMorning)).toEqual(slots);
});

test("confirmation rechecks the slot and rejects stale or tampered selections", async () => {
  const slot = getAvailableSlots(
    { serviceId: "corte", stylistId: "lia", date: "2026-10-03" },
    fridayMorning,
  )[0];
  expect(slot).toBeDefined();
  expect(await submitDemoBooking({ slot, contact }, fridayMorning)).toEqual({
    ok: true,
    slot,
  });
  const afterStart = new Date(new Date(slot.startAt).getTime() + 1);
  expect(await submitDemoBooking({ slot, contact }, afterStart)).toMatchObject({
    ok: false,
    code: "unavailable",
  });
  expect(
    await submitDemoBooking(
      { slot: { ...slot, stylistId: "rafael" }, contact },
      fridayMorning,
    ),
  ).toMatchObject({ ok: false, code: "unavailable" });
  expect(
    await submitDemoBooking(
      { slot: { ...slot, startAt: "2026-10-03T03:00:00Z" }, contact },
      fridayMorning,
    ),
  ).toMatchObject({ ok: false, code: "unavailable" });
});

test("confirmation refuses invalid contact details", async () => {
  const slot = getAvailableSlots(
    { serviceId: "corte", stylistId: "lia", date: "2026-10-03" },
    fridayMorning,
  )[0];
  expect(
    await submitDemoBooking(
      { slot, contact: { name: " ", phone: "123", email: "wrong" } },
      fridayMorning,
    ),
  ).toMatchObject({ ok: false, code: "contact" });
});
