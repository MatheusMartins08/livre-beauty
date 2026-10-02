import { services, stylists } from "../content/salon";

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

export function getBookingDates(now = new Date()): string[] {
  const firstDay = new Date(`${localDate(now)}T12:00:00Z`);
  return Array.from(
    { length: 30 },
    (_, index) => new Date(firstDay.getTime() + index * 86_400_000),
  )
    .filter((date) => date.getUTCDay() >= 2 && date.getUTCDay() <= 6)
    .map((date) => date.toISOString().slice(0, 10));
}

function startInstant(date: string, time: string): string {
  const wallTime = new Date(`${date}T${time}:00Z`);
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

function hasMockAppointment(
  stylistId: string,
  date: string,
  start: number,
  duration: number,
): boolean {
  const seed = [...`${stylistId}${date}`].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  // Reproducible demonstration appointments, with no random failures or stored reservations.
  const occupied = seed % 3 === 0 ? [[720, 780]] : [[600, 660]];
  if (seed % 2 === 0) occupied.push([960, 1020]);
  return occupied.some(([from, to]) => start < to && start + duration > from);
}

export function getAvailableSlots(
  request: AvailabilityRequest,
  now = new Date(),
): BookingSlot[] {
  const service = services.find((item) => item.id === request.serviceId);
  if (!service || !getBookingDates(now).includes(request.date)) return [];
  const compatible = stylists.filter(
    (stylist) =>
      stylist.serviceIds.includes(service.id) &&
      (!request.stylistId || stylist.id === request.stylistId),
  );
  const slots: BookingSlot[] = [];
  for (
    let minutes = 9 * 60;
    minutes + service.duration <= 19 * 60;
    minutes += 30
  ) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const startAt = startInstant(request.date, time);
    if (new Date(startAt).getTime() <= now.getTime()) continue;
    const stylist = compatible.find(
      (item) =>
        !hasMockAppointment(item.id, request.date, minutes, service.duration),
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

function localDelay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function loadAvailability(
  request: AvailabilityRequest,
  now?: Date,
): Promise<BookingSlot[]> {
  await localDelay(150);
  return getAvailableSlots(request, now ?? new Date());
}

export async function submitDemoBooking(
  request: BookingRequest,
  now?: Date,
): Promise<BookingResult> {
  await localDelay(300);
  if (Object.keys(validateContactDetails(request.contact)).length) {
    return {
      ok: false,
      code: "contact",
      message: "Confira seus dados antes de continuar.",
    };
  }
  const { slot } = request;
  const available = getAvailableSlots(
    { serviceId: slot.serviceId, stylistId: slot.stylistId, date: slot.date },
    now ?? new Date(),
  );
  const match = available.find(
    (item) =>
      item.id === slot.id &&
      item.startAt === slot.startAt &&
      item.time === slot.time,
  );
  if (!match)
    return {
      ok: false,
      code: "unavailable",
      message:
        "Este horário não está mais disponível. Escolha outro dia ou horário.",
    };
  return { ok: true, slot: match };
}
