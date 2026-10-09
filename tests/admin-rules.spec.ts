import { expect, test } from "@playwright/test";
import { appointmentError, type AdminAppointment } from "../lib/admin";
import { services, stylists } from "../content/salon";
import type { SalonCatalog } from "../lib/catalog";

const appointment: AdminAppointment = {
  id: "historical",
  code: "LB-7KQ2MX",
  cancelledByClient: false,
  date: "2026-10-08",
  time: "09:00",
  clientId: "client-a",
  serviceId: "corte",
  serviceIds: ["corte"],
  serviceNames: ["Corte autoral"],
  bookedWith: "lia",
  performedBy: "lia",
  status: "concluido",
  price: 180,
  paymentMethod: null,
  notes: "",
  durationMinutes: 60,
};
const catalog: SalonCatalog = {
  services: services.map((service) => ({
    ...service,
    active: true,
    deleted: false,
    summary: "",
    imagePosition: "50% 50%",
    homeImage: null,
    homeImageAlt: "",
    homeImagePosition: "50% 50%",
    componentIds: [],
    popular: false,
  })),
  stylists: stylists.map((stylist) => ({
    ...stylist,
    active: true,
    deleted: false,
    imagePosition: "50% 50%",
  })),
  openingPeriods: [2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opens_at: "09:00",
    closes_at: "19:00",
  })),
  stylistPeriods: [],
  bookingSettings: {
    show_prices: true,
    booking_window_days: 30,
    slot_interval_minutes: 30,
  },
};

test("historical notes can change after the current catalog or opening hours change", () => {
  const closed = { ...catalog, services: [], openingPeriods: [] };
  expect(
    appointmentError(
      { ...appointment, notes: "Updated" },
      [appointment],
      closed,
    ),
  ).toBeNull();
  expect(
    appointmentError({ ...appointment, time: "10:00" }, [appointment], closed),
  ).toContain("dia de funcionamento");
  expect(
    appointmentError(
      appointment,
      [{ ...appointment, status: "cancelado" }],
      closed,
    ),
  ).toContain("dia de funcionamento");
});

test("uses stored appointment duration when catalog duration changes", () => {
  const changed = {
    ...catalog,
    services: catalog.services.map((service) => ({
      ...service,
      duration: 240,
    })),
  };
  const next = {
    ...appointment,
    id: "adjacent",
    time: "10:00",
    clientId: "client-b",
    status: "agendado" as const,
  };
  expect(appointmentError(next, [appointment], changed)).toBeNull();
  expect(
    appointmentError({ ...next, time: "09:30" }, [appointment], changed),
  ).toContain("sobrepõe");
});

test("rejects simultaneous appointments for the same client across professionals", () => {
  const next = {
    ...appointment,
    id: "another",
    performedBy: "marina",
    time: "09:30",
  };
  expect(appointmentError(next, [appointment], catalog)).toContain("cliente");
  expect(
    appointmentError({ ...next, status: "cancelado" }, [appointment], catalog),
  ).toBeNull();
});

test("respects salon closures, special hours and professional blocks", () => {
  const exception = { id: "x", reason: "", startsOn: "2026-10-09", endsOn: "2026-10-09" };
  const next = {
    ...appointment,
    id: "new",
    date: "2026-10-09",
    time: "10:00",
    status: "agendado" as const,
  };
  expect(appointmentError(next, [], catalog)).toBeNull();
  expect(
    appointmentError(next, [], catalog, [
      { ...exception, kind: "fechado", stylistId: null, opensAt: null, closesAt: null },
    ]),
  ).toContain("dia de funcionamento");
  expect(
    appointmentError({ ...next, time: "15:00" }, [], catalog, [
      { ...exception, kind: "horario_especial", stylistId: null, opensAt: "09:00", closesAt: "14:00" },
    ]),
  ).toContain("horário de funcionamento");
  const lunch = { ...exception, kind: "bloqueio" as const, opensAt: "10:30", closesAt: "11:30" };
  expect(
    appointmentError(next, [], catalog, [{ ...lunch, stylistId: "lia" }]),
  ).toContain("indisponível");
  expect(
    appointmentError(next, [], catalog, [{ ...lunch, stylistId: "marina" }]),
  ).toBeNull();
});

test("uses the sum of the services when an appointment has several", () => {
  const multi = {
    ...appointment,
    id: "multi",
    date: "2026-10-09",
    time: "17:00",
    status: "agendado" as const,
    serviceIds: ["corte", "tratamento"],
    serviceNames: ["Corte autoral", "Ritual de tratamento"],
    durationMinutes: undefined,
  };
  expect(appointmentError(multi, [], catalog)).toBeNull();
  expect(appointmentError({ ...multi, time: "17:30" }, [], catalog)).toContain(
    "horário de funcionamento",
  );
});

test("applies a professional's own week inside the salon hours", () => {
  // 2026-10-09 is a Friday; Lia works only Friday afternoons.
  const own = {
    ...catalog,
    stylistPeriods: [{ weekday: 5, opens_at: "13:00", closes_at: "19:00", stylistId: "lia" }],
  };
  const next = {
    ...appointment,
    id: "own-hours",
    date: "2026-10-09",
    time: "10:00",
    status: "agendado" as const,
  };
  expect(appointmentError(next, [], own)).toContain("indisponível");
  expect(appointmentError({ ...next, time: "14:00" }, [], own)).toBeNull();
  // A weekday without own periods is a day off for her, not for others.
  expect(appointmentError({ ...next, date: "2026-10-08", time: "14:00" }, [], own)).toContain(
    "indisponível",
  );
  expect(
    appointmentError({ ...next, date: "2026-10-08", time: "14:00", performedBy: "marina" }, [], own),
  ).toBeNull();
  // Her special hours replace her week on that date.
  expect(
    appointmentError(next, [], own, [
      {
        id: "special",
        kind: "horario_especial",
        stylistId: "lia",
        startsOn: "2026-10-09",
        endsOn: "2026-10-09",
        opensAt: "09:00",
        closesAt: "12:00",
        reason: "",
      },
    ]),
  ).toBeNull();
});
