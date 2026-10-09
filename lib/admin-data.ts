import "server-only";

import type { AdminAppointment, AdminClient } from "./admin";
import {
  shortTime,
  type ExceptionKind,
  type ScheduleException,
} from "./opening-hours";
import type { Tables } from "./supabase/database.types";

type AppointmentItem = Pick<
  Tables<"appointment_services">,
  "appointment_id" | "sort_order" | "service_id" | "service_name"
>;

/** Items of one appointment; before the first sync it falls back to service_id. */
export function appointmentFromRow(
  row: Tables<"appointments">,
  items: AppointmentItem[] = [],
  fallbackName = "",
): AdminAppointment {
  const own = items
    .filter((item) => item.appointment_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(row.starts_at));
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return {
    id: row.id,
    code: row.code,
    cancelledByClient:
      row.status === "cancelado" && row.client_cancelled_at !== null,
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    clientId: row.client_id,
    serviceId: row.service_id,
    serviceIds: own.length ? own.map((item) => item.service_id) : [row.service_id],
    serviceNames: own.length
      ? own.map((item) => item.service_name)
      : [fallbackName],
    bookedWith: row.booked_with,
    performedBy: row.performed_by,
    status: row.status,
    price: row.price,
    paymentMethod: row.payment_method,
    notes: row.notes,
    durationMinutes:
      (new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) /
      60000,
  };
}

export function exceptionFromRow(
  row: Tables<"schedule_exceptions">,
): ScheduleException {
  return {
    id: row.id,
    kind: row.kind as ExceptionKind,
    stylistId: row.stylist_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    opensAt: row.opens_at && shortTime(row.opens_at),
    closesAt: row.closes_at && shortTime(row.closes_at),
    reason: row.reason,
  };
}

export function clientFromRow(row: Tables<"clients">): AdminClient {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    whatsappOptIn: row.whatsapp_opt_in,
    whatsappOptInAt: row.whatsapp_opt_in_at,
  };
}
