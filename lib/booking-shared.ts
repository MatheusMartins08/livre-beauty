import { services, stylists } from "../content/salon";
import type { SalonCatalog } from "./catalog";
import {
  defaultOpeningPeriods,
  fromMinutes,
  toMinutes,
  weeklyPeriodsFor,
  type DayPeriod,
} from "./opening-hours";

export const BOOKING_TIME_ZONE = "America/Sao_Paulo";
export const MAX_BOOKING_SERVICES = 5;

export interface BookingSlot {
  id: string;
  serviceId: string;
  serviceIds?: string[];
  stylistId: string;
  date: string;
  time: string;
  startAt: string;
  /** Reservation code returned once the booking is saved. */
  code?: string;
}

export interface AvailabilityRequest {
  /** Services in the order they will be performed; serviceId is the legacy single form. */
  serviceIds?: string[];
  serviceId?: string;
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
  /** Explicit consent to WhatsApp messages from the salon (LGPD); never preselected. */
  whatsappOptIn?: boolean;
}
/** performed_by null is an exception that blocks every professional. */
export interface BookedRange {
  performed_by: string | null;
  starts_at: string;
  ends_at: string;
}
export type BookingResult =
  | { ok: true; slot: BookingSlot }
  | { ok: false; code: "unavailable" | "contact" | "services"; message: string };

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
  return windowDates(now, windowDays).filter((date) =>
    weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()),
  );
}

/** Every local date from today within the booking window. */
export function windowDates(now = new Date(), windowDays = 30): string[] {
  const firstDay = new Date(`${localDate(now)}T12:00:00Z`);
  return Array.from({ length: windowDays }, (_, index) =>
    new Date(firstDay.getTime() + index * 86_400_000).toISOString().slice(0, 10),
  );
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

export function requestedServiceIds(request: {
  serviceIds?: unknown;
  serviceId?: unknown;
}): string[] {
  if (Array.isArray(request.serviceIds))
    return request.serviceIds.filter((id): id is string => typeof id === "string");
  return typeof request.serviceId === "string" ? [request.serviceId] : [];
}

/**
 * Explains why a list of services cannot be booked together, or returns null.
 * A combo already includes its components, so they cannot be added again.
 */
export function selectionError(
  serviceIds: string[],
  catalogServices: { id: string; componentIds?: string[] }[],
): string | null {
  if (!serviceIds.length) return "Selecione um serviço para continuar.";
  if (serviceIds.length > MAX_BOOKING_SERVICES)
    return `Escolha até ${MAX_BOOKING_SERVICES} serviços.`;
  if (new Set(serviceIds).size !== serviceIds.length)
    return "Cada serviço pode ser escolhido uma vez.";
  const parts = serviceIds.flatMap((id) => {
    const components = catalogServices.find((item) => item.id === id)?.componentIds;
    return components?.length ? components : [id];
  });
  return new Set(parts).size !== parts.length
    ? "Um combo escolhido já inclui outro serviço da lista."
    : null;
}

export function getAvailableSlots(
  request: AvailabilityRequest,
  now = new Date(),
  catalog?: SalonCatalog,
  booked: BookedRange[] = [],
  dayPeriods?: DayPeriod[],
): BookingSlot[] {
  const serviceIds = requestedServiceIds(request);
  const serviceCatalog = catalog?.services ?? services;
  const selected = serviceIds.map((id) =>
    serviceCatalog.find((item) => item.id === id),
  );
  const windowDays = catalog?.bookingSettings.booking_window_days ?? 30;
  if (
    !selected.length ||
    selected.some((item) => !item) ||
    selectionError(serviceIds, serviceCatalog) ||
    !windowDates(now, windowDays).includes(request.date)
  )
    return [];
  const duration = selected.reduce((sum, item) => sum + item!.duration, 0);
  const compatible = (catalog?.stylists ?? stylists).filter(
    (stylist) =>
      serviceIds.every((id) => stylist.serviceIds.includes(id)) &&
      (!request.stylistId || stylist.id === request.stylistId),
  );
  const periods =
    dayPeriods ??
    weeklyPeriodsFor(request.date, catalog?.openingPeriods ?? defaultOpeningPeriods);
  const interval = catalog?.bookingSettings.slot_interval_minutes ?? 30;
  const slots: BookingSlot[] = [];
  for (const period of periods) {
    const closing = toMinutes(period.closes_at);
    for (
      let minutes = toMinutes(period.opens_at);
      minutes + duration <= closing;
      minutes += interval
    ) {
      const time = fromMinutes(minutes);
      const startAt = startInstant(request.date, time);
      const start = new Date(startAt).getTime();
      if (start <= now.getTime()) continue;
      const end = start + duration * 60000;
      const stylist = compatible.find(
        (item) =>
          !booked.some(
            (range) =>
              (range.performed_by === null || range.performed_by === item.id) &&
              start < new Date(range.ends_at).getTime() &&
              end > new Date(range.starts_at).getTime(),
          ),
      );
      if (stylist)
        slots.push({
          id: `${serviceIds.join("+")}:${stylist.id}:${request.date}:${time}`,
          serviceId: serviceIds[0],
          serviceIds,
          stylistId: stylist.id,
          date: request.date,
          time,
          startAt,
        });
    }
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
