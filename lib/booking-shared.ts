import { services, stylists } from "../content/salon";
import type { SalonCatalog } from "./catalog";

export const BOOKING_TIME_ZONE = "America/Sao_Paulo";

export interface BookingSlot {
  id: string;
  serviceId: string;
  stylistId: string;
  date: string;
  time: string;
  startAt: string;
}

export interface AvailabilityRequest {
  serviceId: string;
  stylistId?: string;
  date: string;
}

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}
export interface BookingRequest {
  slot: BookingSlot;
  contact: ContactDetails;
  withoutPreference?: boolean;
}
export interface BookedRange {
  performed_by: string;
  starts_at: string;
  ends_at: string;
}
export type BookingResult =
  | { ok: true; slot: BookingSlot }
  | { ok: false; code: "unavailable" | "contact"; message: string };

function localDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getBookingDates(
  now = new Date(),
  windowDays = 30,
  weekdays = [2, 3, 4, 5, 6],
): string[] {
  const firstDay = new Date(`${localDate(now)}T12:00:00Z`);
  return Array.from(
    { length: windowDays },
    (_, index) => new Date(firstDay.getTime() + index * 86_400_000),
  )
    .filter((date) => weekdays.includes(date.getUTCDay()))
    .map((date) => date.toISOString().slice(0, 10));
}

export function startInstant(date: string, time: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new RangeError("Data ou horário inválido.");
  }
  const wallTime = new Date(`${date}T${time}:00Z`);
  if (
    !Number.isFinite(wallTime.getTime()) ||
    wallTime.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError("Data inválida.");
  }
  const offset =
    new Intl.DateTimeFormat("en", {
      timeZone: BOOKING_TIME_ZONE,
      timeZoneName: "longOffset",
    })
      .formatToParts(wallTime)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMinutes = match
    ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "+" ? 1 : -1)
    : 0;
  return new Date(wallTime.getTime() - offsetMinutes * 60_000).toISOString();
}

export function getAvailableSlots(
  request: AvailabilityRequest,
  now = new Date(),
  catalog?: SalonCatalog,
  booked: BookedRange[] = [],
): BookingSlot[] {
  const service = (catalog?.services ?? services).find(
    (item) => item.id === request.serviceId,
  );
  const weekdays = catalog?.businessHours
    .filter((day) => day.active)
    .map((day) => day.weekday);
  if (
    !service ||
    !getBookingDates(
      now,
      catalog?.bookingSettings.booking_window_days,
      weekdays,
    ).includes(request.date)
  )
    return [];
  const compatible = (catalog?.stylists ?? stylists).filter(
    (stylist) =>
      stylist.serviceIds.includes(service.id) &&
      (!request.stylistId || stylist.id === request.stylistId),
  );
  const slots: BookingSlot[] = [];
  const day = new Date(`${request.date}T12:00:00Z`).getUTCDay();
  const hours = catalog?.businessHours.find((item) => item.weekday === day);
  const minutesOf = (time: string) =>
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const opening = hours?.opens_at ? minutesOf(hours.opens_at) : 540;
  const closing = hours?.closes_at ? minutesOf(hours.closes_at) : 1140;
  for (
    let minutes = opening;
    minutes + service.duration <= closing;
    minutes += catalog?.bookingSettings.slot_interval_minutes ?? 30
  ) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const startAt = startInstant(request.date, time);
    const start = new Date(startAt).getTime();
    if (start <= now.getTime()) continue;
    const stylist = compatible.find(
      (item) =>
        !booked.some(
          (range) =>
            range.performed_by === item.id &&
            start < new Date(range.ends_at).getTime() &&
            start + service.duration * 60000 >
              new Date(range.starts_at).getTime(),
        ),
    );
    if (stylist)
      slots.push({
        id: `${service.id}:${stylist.id}:${request.date}:${time}`,
        serviceId: service.id,
        stylistId: stylist.id,
        date: request.date,
        time,
        startAt,
      });
  }
  return slots;
}

export function validateContactDetails(
  contact: ContactDetails,
): Partial<Record<keyof ContactDetails, string>> {
  const errors: Partial<Record<keyof ContactDetails, string>> = {};
  if (contact.name.trim().length < 2 || contact.name.trim().length > 100)
    errors.name = "Informe seu nome, com pelo menos 2 caracteres.";
  const digits = contact.phone
    .replace(/\D/g, "")
    .replace(/^55(?=\d{10,11}$)/, "");
  if (!/^[+()\d\s.-]+$/.test(contact.phone) || !/^\d{10,11}$/.test(digits))
    errors.phone = "Informe um celular válido com DDD.";
  if (
    contact.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
  )
    errors.email = "Informe um e-mail válido.";
  return errors;
}
