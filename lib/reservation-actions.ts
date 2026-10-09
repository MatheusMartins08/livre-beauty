"use server";

import { revalidatePath } from "next/cache";
import { createPublicClient } from "./supabase/server";
import type { Json } from "./supabase/database.types";
import {
  normalizeReservationCode,
  type Reservation,
  type ReservationResult,
} from "./reservation";

const invalid: ReservationResult = {
  ok: false,
  code: "invalid",
  message: "Informe o código da reserva, como LB-7KQ2MX, e o celular usado no agendamento.",
};

function isReservation(value: unknown): value is Reservation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    ["code", "status", "stylistName", "date", "time", "startAt", "cancelUntil"].every(
      (key) => typeof item[key] === "string",
    ) &&
    Array.isArray(item.services) &&
    item.services.every((name) => typeof name === "string") &&
    typeof item.durationMinutes === "number" &&
    typeof item.canCancel === "boolean" &&
    typeof item.cancelledByClient === "boolean" &&
    (item.price === null || typeof item.price === "number")
  );
}

function toResult(data: Json): ReservationResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (data.ok === true)
    return isReservation(data.reservation)
      ? { ok: true, reservation: data.reservation }
      : null;
  if (
    (data.code === "not_found" || data.code === "not_active" || data.code === "too_late") &&
    typeof data.message === "string"
  )
    return {
      ok: false,
      code: data.code,
      message: data.message,
      ...(isReservation(data.reservation) ? { reservation: data.reservation } : {}),
    };
  return null;
}

function validInput(code: unknown, phone: unknown) {
  if (typeof code !== "string" || typeof phone !== "string" || phone.length > 40)
    return null;
  const normalized = normalizeReservationCode(code);
  const digits = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return normalized && /^\d{10,11}$/.test(digits) ? { code: normalized, phone: digits } : null;
}

export async function lookupReservation(
  code: string,
  phone: string,
): Promise<ReservationResult> {
  const input = validInput(code, phone);
  if (!input) return invalid;
  const { data, error } = await createPublicClient().rpc("get_reservation", {
    p_code: input.code,
    p_phone: input.phone,
  });
  const result = error ? null : toResult(data);
  if (!result) throw new Error("Não foi possível consultar a reserva. Tente novamente.");
  return result;
}

export async function cancelReservation(
  code: string,
  phone: string,
): Promise<ReservationResult> {
  const input = validInput(code, phone);
  if (!input) return invalid;
  const { data, error } = await createPublicClient().rpc("cancel_reservation", {
    p_code: input.code,
    p_phone: input.phone,
  });
  const result = error ? null : toResult(data);
  if (!result) throw new Error("Não foi possível cancelar a reserva. Tente novamente.");
  if (result.ok) revalidatePath("/painel");
  return result;
}
