"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession } from "./supabase/session";
import { appointmentFromRow, clientFromRow } from "./admin-data";
import {
  MAX_BOOKING_SERVICES,
  startInstant,
  validateContactDetails,
} from "./booking-shared";
import {
  statusLabels,
  paymentLabels,
  type AdminAppointment,
  type AdminClient,
  type AppointmentStatus,
  type PaymentMethod,
} from "./admin";

type SaveResult<T> = { ok: true; data: T } | { ok: false; message: string };
const noAccess = {
  ok: false as const,
  message:
    "Seu acesso expirou ou você não tem permissão para esta ação. Entre novamente.",
};

function databaseMessage(error: { code?: string; message?: string }): string {
  if (error.code === "23P01")
    return "Esse horário se sobrepõe a outro atendimento do profissional ou do cliente. Escolha outro horário.";
  if (error.code === "23505") return "Já existe um cliente com esse telefone.";
  // Messages raised by our functions are written for the team; constraint
  // names reported by PostgreSQL are not.
  if (error.code?.startsWith("LB") && error.message) return error.message;
  if (error.code === "23514")
    return error.message && !/violates|new row/i.test(error.message)
      ? error.message
      : "Confira o serviço, o profissional e o horário de funcionamento.";
  if (error.code === "42501") return noAccess.message;
  return "Não foi possível salvar. Confira os dados e tente novamente.";
}

async function readAppointment(
  supabase: NonNullable<Awaited<ReturnType<typeof getStaffSession>>>["supabase"],
  id: string,
) {
  const [row, items] = await Promise.all([
    supabase.from("appointments").select("*").eq("id", id).single(),
    supabase
      .from("appointment_services")
      .select("appointment_id,sort_order,service_id,service_name")
      .eq("appointment_id", id),
  ]);
  return row.error || items.error
    ? null
    : appointmentFromRow(row.data, items.data);
}

export async function saveAppointment(
  input: AdminAppointment,
): Promise<SaveResult<AdminAppointment>> {
  const session = await getStaffSession();
  if (!session) return noAccess;
  if (
    !input ||
    [
      "id",
      "clientId",
      "serviceId",
      "performedBy",
      "date",
      "time",
      "notes",
    ].some((key) => typeof input[key as keyof AdminAppointment] !== "string") ||
    !Array.isArray(input.serviceIds) ||
    input.serviceIds.length < 1 ||
    input.serviceIds.length > MAX_BOOKING_SERVICES ||
    input.serviceIds.some((id) => typeof id !== "string") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(input.time) ||
    !Object.hasOwn(statusLabels, input.status) ||
    (input.paymentMethod !== null &&
      !Object.hasOwn(paymentLabels, input.paymentMethod)) ||
    !Number.isFinite(input.price) ||
    input.price < 0 ||
    input.price > 100000 ||
    input.notes.length > 1000
  ) {
    return { ok: false, message: "Confira os dados do atendimento." };
  }
  const { supabase, profile } = session;
  if (profile.role !== "owner" && input.performedBy !== profile.stylist_id)
    return noAccess;
  // Staff only book clients visible to them under RLS, as before.
  const client = await supabase
    .from("clients")
    .select("id")
    .eq("id", input.clientId)
    .maybeSingle();
  if (client.error)
    return {
      ok: false,
      message: "Não foi possível conferir os dados. Tente novamente.",
    };
  if (!client.data) return noAccess;
  let startsAt: string;
  try {
    startsAt = startInstant(input.date, input.time);
  } catch {
    return { ok: false, message: "Informe uma data e um horário válidos." };
  }
  // The function writes the appointment and its services in one transaction.
  // Unchanged services keep their booked duration; the end is computed there.
  const { error } = await supabase.rpc("save_appointment", {
    p_id: input.id,
    p_client_id: input.clientId,
    p_service_ids: input.serviceIds,
    p_performed_by: input.performedBy,
    p_starts_at: startsAt,
    p_status: input.status,
    p_price: input.price,
    // Generated types omit SQL nullability; null means "not informed".
    p_payment_method: input.paymentMethod as PaymentMethod,
    p_notes: input.notes.trim(),
  });
  if (error) return { ok: false, message: databaseMessage(error) };
  const saved = await readAppointment(supabase, input.id);
  revalidatePath("/painel");
  return saved
    ? { ok: true, data: saved }
    : { ok: false, message: "Atendimento salvo. Atualize a agenda para conferir." };
}

export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<SaveResult<AdminAppointment>> {
  const session = await getStaffSession();
  if (!session) return noAccess;
  if (typeof id !== "string" || !Object.hasOwn(statusLabels, status))
    return { ok: false, message: "Status inválido." };
  const { error } = await session.supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { ok: false, message: databaseMessage(error) };
  const saved = await readAppointment(session.supabase, id);
  revalidatePath("/painel");
  return saved
    ? { ok: true, data: saved }
    : { ok: false, message: "Status salvo. Atualize a agenda para conferir." };
}

export async function saveClient(
  input: AdminClient,
): Promise<SaveResult<AdminClient>> {
  const session = await getStaffSession();
  if (!session || session.profile.role !== "owner") return noAccess;
  if (
    !input ||
    ["id", "name", "phone", "email", "notes"].some(
      (key) => typeof input[key as keyof AdminClient] !== "string",
    ) ||
    input.notes.length > 1000 ||
    typeof input.whatsappOptIn !== "boolean" ||
    Object.keys(validateContactDetails(input)).length
  )
    return {
      ok: false,
      message: "Confira o nome, telefone e e-mail do cliente.",
    };
  const { data: existing, error: readError } = await session.supabase
    .from("clients")
    .select("id")
    .eq("id", input.id)
    .maybeSingle();
  if (readError)
    return { ok: false, message: "Não foi possível conferir o cadastro." };
  const values = {
    name: input.name.trim(),
    phone: input.phone,
    email: input.email.trim(),
    notes: input.notes.trim(),
    // The database records the date when consent is given and clears it when withdrawn.
    whatsapp_opt_in: input.whatsappOptIn,
  };
  const result = existing
    ? await session.supabase
        .from("clients")
        .update(values)
        .eq("id", input.id)
        .select("*")
        .single()
    : await session.supabase
        .from("clients")
        .insert({ ...values, id: input.id })
        .select("*")
        .single();
  if (result.error)
    return { ok: false, message: databaseMessage(result.error) };
  revalidatePath("/painel");
  return { ok: true, data: clientFromRow(result.data) };
}
