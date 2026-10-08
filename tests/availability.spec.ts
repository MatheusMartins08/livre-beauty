import { expect, test } from "@playwright/test";
import {
  getAvailableSlots,
  getBookingDates,
  startInstant,
  validateContactDetails,
} from "../lib/booking-shared";

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

test("uses occupied intervals and permits adjacent appointments", () => {
  const request = { serviceId: "corte", stylistId: "lia", date: "2026-10-03" };
  const busy = [
    {
      performed_by: "lia",
      starts_at: startInstant(request.date, "10:00"),
      ends_at: startInstant(request.date, "11:00"),
    },
  ];
  const slots = getAvailableSlots(request, fridayMorning, undefined, busy);
  for (const time of ["09:30", "10:00", "10:30"])
    expect(slots.map((slot) => slot.time)).not.toContain(time);
  for (const time of ["09:00", "11:00"])
    expect(slots.map((slot) => slot.time)).toContain(time);
  const any = getAvailableSlots(
    { ...request, stylistId: undefined },
    fridayMorning,
    undefined,
    busy,
  );
  expect(any.find((slot) => slot.time === "10:00")?.stylistId).toBe("marina");
});

test("normalizes phone prefixes and rejects invalid contact fields", () => {
  expect(validateContactDetails(contact)).toEqual({});
  expect(
    validateContactDetails({ ...contact, phone: "+55 (11) 99999-8888" }),
  ).toEqual({});
  expect(
    validateContactDetails({ name: " ", phone: "123", email: "wrong" }),
  ).toEqual({
    name: expect.any(String),
    phone: expect.any(String),
    email: expect.any(String),
  });
  expect(
    validateContactDetails({ ...contact, phone: "letters11999998888" }).phone,
  ).toBeTruthy();
});

test("converts local instants and rejects nonexistent dates", () => {
  expect(startInstant("2026-10-03", "09:00")).toBe("2026-10-03T12:00:00.000Z");
  for (const [date, time] of [
    ["2026-02-30", "09:00"],
    ["2026-99-01", "09:00"],
    ["2026-10-03", "24:00"],
    ["2026-10-03", "12:99"],
  ]) {
    expect(() => startInstant(date, time)).toThrow(RangeError);
  }
});
