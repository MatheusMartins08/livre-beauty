import { expect, test } from "@playwright/test";
import {
  getAvailableSlots,
  getBookingDates,
  selectionError,
  startInstant,
  validateContactDetails,
} from "../lib/booking-shared";
import {
  blocksForDate,
  formatWeeklyHours,
  ownPeriodsForDate,
  periodsForDate,
  validateWeek,
} from "../lib/opening-hours";

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

test("sums the duration of several services and requires a professional for all of them", () => {
  const slots = getAvailableSlots(
    { serviceIds: ["corte", "tratamento"], date: "2026-10-03" },
    fridayMorning,
  );
  expect(slots.length).toBeGreaterThan(0);
  expect(slots.every((slot) => slot.time <= "17:00")).toBe(true);
  expect(slots.every((slot) => ["lia", "marina"].includes(slot.stylistId))).toBe(true);
  expect(slots[0].id).toBe(`corte+tratamento:${slots[0].stylistId}:2026-10-03:${slots[0].time}`);
  expect(slots[0].serviceIds).toEqual(["corte", "tratamento"]);
  expect(
    getAvailableSlots({ serviceIds: ["corte", "cor"], date: "2026-10-03" }, fridayMorning),
  ).toEqual([]);
  expect(
    getAvailableSlots({ serviceIds: ["corte", "corte"], date: "2026-10-03" }, fridayMorning),
  ).toEqual([]);
});

test("uses every opening period and never crosses a break", () => {
  const slots = getAvailableSlots(
    { serviceId: "corte", stylistId: "lia", date: "2026-10-03" },
    fridayMorning,
    undefined,
    [],
    [
      { opens_at: "09:00", closes_at: "12:00" },
      { opens_at: "13:00", closes_at: "15:00" },
    ],
  );
  const times = slots.map((slot) => slot.time);
  expect(times).toContain("11:00");
  expect(times).not.toContain("11:30");
  expect(times).not.toContain("12:00");
  expect(times).toContain("13:00");
  expect(times.at(-1)).toBe("14:00");
});

test("blocks without a professional apply to the whole team", () => {
  const request = { serviceId: "corte", date: "2026-10-03" };
  const blocked = [
    {
      performed_by: null,
      starts_at: startInstant(request.date, "10:00"),
      ends_at: startInstant(request.date, "12:00"),
    },
  ];
  const times = getAvailableSlots(request, fridayMorning, undefined, blocked).map(
    (slot) => slot.time,
  );
  for (const time of ["09:30", "10:00", "11:30"]) expect(times).not.toContain(time);
  for (const time of ["09:00", "12:00"]) expect(times).toContain(time);
});

test("rejects a combo together with one of its parts", () => {
  const catalog = [
    { id: "corte" },
    { id: "tratamento" },
    { id: "combo", componentIds: ["corte", "tratamento"] },
    { id: "outro-combo", componentIds: ["tratamento", "finalizacao"] },
  ];
  expect(selectionError(["combo"], catalog)).toBeNull();
  expect(selectionError(["corte", "tratamento"], catalog)).toBeNull();
  expect(selectionError(["combo", "corte"], catalog)).toContain("combo");
  expect(selectionError(["combo", "outro-combo"], catalog)).toContain("combo");
  expect(selectionError([], catalog)).toContain("Selecione");
  expect(selectionError(["a", "b", "c", "d", "e", "f"], catalog)).toContain("até 5");
});

test("applies closed days and special hours before the weekly periods", () => {
  const week = [2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opens_at: "09:00",
    closes_at: "19:00",
  }));
  expect(formatWeeklyHours(week)).toBe("Terça a sábado, das 9h às 19h");
  expect(
    formatWeeklyHours([
      ...week.filter((period) => period.weekday !== 6),
      { weekday: 6, opens_at: "09:00", closes_at: "12:30" },
      { weekday: 6, opens_at: "13:30", closes_at: "17:00" },
    ]),
  ).toBe("Terça a sexta, das 9h às 19h · Sábado, das 9h às 12h30 e das 13h30 às 17h");
  const exception = {
    id: "x",
    stylistId: null,
    startsOn: "2026-10-03",
    endsOn: "2026-10-03",
    reason: "",
  };
  expect(
    periodsForDate("2026-10-03", week, [
      { ...exception, kind: "fechado", opensAt: null, closesAt: null },
    ]),
  ).toEqual([]);
  expect(
    periodsForDate("2026-10-05", week, [
      { ...exception, startsOn: "2026-10-05", endsOn: "2026-10-05", kind: "horario_especial", opensAt: "10:00", closesAt: "14:00" },
    ]),
  ).toEqual([{ opens_at: "10:00", closes_at: "14:00" }]);
  expect(
    periodsForDate("2026-10-03", week, [
      { ...exception, stylistId: "lia", kind: "fechado", opensAt: null, closesAt: null },
    ]),
  ).toEqual([{ opens_at: "09:00", closes_at: "19:00" }]);
  expect(
    validateWeek([
      { weekday: 2, opens_at: "09:00", closes_at: "13:00" },
      { weekday: 2, opens_at: "12:00", closes_at: "18:00" },
    ]),
  ).toEqual(["Os períodos de terça não podem se sobrepor."]);
});

test("turns a professional's own week into blocks, like the database", () => {
  const own = [
    { weekday: 6, opens_at: "09:00", closes_at: "12:00", stylistId: "lia" },
    { weekday: 6, opens_at: "14:00", closes_at: "18:00", stylistId: "lia" },
  ];
  // 2026-10-03 is a Saturday: blocked before, between and after her periods.
  expect(blocksForDate("2026-10-03", [], own)).toEqual([
    { stylistId: "lia", start: 0, end: 540 },
    { stylistId: "lia", start: 720, end: 840 },
    { stylistId: "lia", start: 1080, end: 1440 },
  ]);
  // Friday has no period of hers: the whole day is blocked.
  expect(blocksForDate("2026-10-02", [], own)).toEqual([
    { stylistId: "lia", start: 0, end: 1440 },
  ]);
  expect(ownPeriodsForDate("2026-10-03", "marina", own)).toBeNull();
  expect(
    ownPeriodsForDate("2026-10-03", "lia", own, [
      {
        id: "x",
        kind: "horario_especial",
        stylistId: "lia",
        startsOn: "2026-10-03",
        endsOn: "2026-10-03",
        opensAt: "10:00",
        closesAt: "11:00",
        reason: "",
      },
    ]),
  ).toEqual([{ opens_at: "10:00", closes_at: "11:00" }]);
  // A professional's special hours never change the salon's day.
  expect(
    periodsForDate("2026-10-03", [{ weekday: 6, opens_at: "09:00", closes_at: "19:00" }], [
      {
        id: "y",
        kind: "horario_especial",
        stylistId: "lia",
        startsOn: "2026-10-03",
        endsOn: "2026-10-03",
        opensAt: "10:00",
        closesAt: "11:00",
        reason: "",
      },
    ]),
  ).toEqual([{ opens_at: "09:00", closes_at: "19:00" }]);
});
