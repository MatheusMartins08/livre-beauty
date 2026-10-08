"use server";

import { revalidatePath } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import {
  getAvailableSlots,
  validateContactDetails,
  type AvailabilityRequest,
  type BookingRequest,
  type BookingResult,
  type BookingSlot,
} from "./booking-shared";
import type { Database, Json } from "./supabase/database.types";

export async function loadAvailability(
  request: AvailabilityRequest,
): Promise<BookingSlot[]> {
  if (
    !request ||
    typeof request.serviceId !== "string" ||
    typeof request.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(request.date) ||
    (request.stylistId !== undefined && typeof request.stylistId !== "string")
  )
    return [];
  const catalog = await getPublicCatalog();
  if (!getAvailableSlots(request, new Date(), catalog).length) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_booked_ranges", {
    p_date: request.date,
    ...(request.stylistId ? { p_stylist_id: request.stylistId } : {}),
  });
  if (error)
    throw new Error("Não foi possível consultar os horários. Tente novamente.");
  return getAvailableSlots(request, new Date(), catalog, data ?? []);
}

// Generated PostgREST types omit SQL argument nullability. This narrow adapter
// models the actual RPC contract without editing generated database.types.ts.
type PublicBookingArgs = Omit<
  Database["public"]["Functions"]["create_public_booking"]["Args"],
  "p_stylist_id"
> & { p_stylist_id: string | null };

function isBookingResult(value: Json): value is Json & BookingResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.ok === false)
    return (
      (value.code === "unavailable" || value.code === "contact") &&
      typeof value.message === "string"
    );
  const slot = value.slot;
  return (
    value.ok === true &&
    !!slot &&
    typeof slot === "object" &&
    !Array.isArray(slot) &&
    ["id", "serviceId", "stylistId", "date", "time", "startAt"].every(
      (key) => typeof slot[key] === "string",
    )
  );
}

/** Legacy name retained; the implementation now saves a reservation. */
export async function submitDemoBooking(
  request: BookingRequest,
): Promise<BookingResult> {
  const unavailable: BookingResult = {
    ok: false,
    code: "unavailable",
    message:
      "Este horário não está mais disponível. Escolha outro dia ou horário.",
  };
  if (
    !request?.contact ||
    ["name", "phone", "email"].some(
      (key) =>
        typeof request.contact[key as keyof typeof request.contact] !==
        "string",
    ) ||
    Object.keys(validateContactDetails(request.contact)).length
  ) {
    return {
      ok: false,
      code: "contact",
      message: "Confira seus dados antes de continuar.",
    };
  }
  const { slot, contact } = request;
  if (
    !slot ||
    (request.withoutPreference !== undefined &&
      typeof request.withoutPreference !== "boolean") ||
    ["id", "serviceId", "stylistId", "date", "time", "startAt"].some(
      (key) => typeof slot[key as keyof BookingSlot] !== "string",
    )
  )
    return unavailable;
  const available = await loadAvailability({
    serviceId: slot.serviceId,
    stylistId: request.withoutPreference ? undefined : slot.stylistId,
    date: slot.date,
  });
  if (
    !available.some(
      (item) =>
        (request.withoutPreference || item.id === slot.id) &&
        item.startAt === slot.startAt &&
        item.time === slot.time,
    )
  )
    return unavailable;
  const args: PublicBookingArgs = {
    p_service_id: slot.serviceId,
    p_stylist_id: request.withoutPreference === true ? null : slot.stylistId,
    p_starts_at: slot.startAt,
    p_name: contact.name,
    p_phone: contact.phone,
    p_email: contact.email,
  };
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc(
    "create_public_booking",
    args as Database["public"]["Functions"]["create_public_booking"]["Args"],
  );
  if (error || !isBookingResult(data))
    throw new Error(
      "Não foi possível confirmar o agendamento. Tente novamente.",
    );
  if (data.ok) revalidatePath("/painel");
  return data;
}
