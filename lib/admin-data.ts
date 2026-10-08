import "server-only";

import type { AdminAppointment, AdminClient } from "./admin";
import type { Tables } from "./supabase/database.types";

export function appointmentFromRow(
  row: Tables<"appointments">,
): AdminAppointment {
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
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    clientId: row.client_id,
    serviceId: row.service_id,
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

export function clientFromRow(row: Tables<"clients">): AdminClient {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
  };
}
