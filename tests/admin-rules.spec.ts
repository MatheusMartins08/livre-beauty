import { expect, test } from "@playwright/test";
import { appointmentError, type AdminAppointment } from "../lib/admin";
import { services, stylists } from "../content/salon";
import type { SalonCatalog } from "../lib/catalog";

const appointment: AdminAppointment = {
  id: "historical",
  date: "2026-10-08",
  time: "09:00",
  clientId: "client-a",
  serviceId: "corte",
  bookedWith: "lia",
  performedBy: "lia",
  status: "concluido",
  price: 180,
  paymentMethod: null,
  notes: "",
  durationMinutes: 60,
};
const catalog: SalonCatalog = {
  services: services.map((service) => ({ ...service, active: true })),
  stylists: stylists.map((stylist) => ({ ...stylist, active: true })),
  businessHours: Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    active: weekday >= 2,
    opens_at: "09:00",
    closes_at: "19:00",
  })),
  bookingSettings: {
    show_prices: true,
    booking_window_days: 30,
    slot_interval_minutes: 30,
  },
};

test("historical notes can change after the current catalog or opening hours change", () => {
  const closed = {
    ...catalog,
    services: [],
    businessHours: catalog.businessHours.map((day) => ({
      ...day,
      active: false,
    })),
  };
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
