"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession } from "./supabase/session";
import { appointmentFromRow, clientFromRow } from "./admin-data";
import { startInstant, validateContactDetails } from "./booking-shared";
import {
  statusLabels,
  paymentLabels,
  type AdminAppointment,
  type AdminClient,
  type AppointmentStatus,
} from "./admin";

type SaveResult<T> = { ok: true; data: T } | { ok: false; message: string };
const noAccess = {
  ok: false as const,
  message:
    "Seu acesso expirou ou você não tem permissão para esta ação. Entre novamente.",
};

function databaseMessage(error: { code?: string }): string {
  if (error.code === "23P01")
    return "Esse horário se sobrepõe a outro atendimento do profissional ou do cliente. Escolha outro horário.";
  if (error.code === "23505") return "Já existe um cliente com esse telefone.";
  if (error.code === "23514")
    return "Confira o serviço, o profissional e o horário de funcionamento.";
  if (error.code === "42501") return noAccess.message;
  return "Não foi possível salvar. Confira os dados e tente novamente.";
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
  const [service, client, existing] = await Promise.all([
    supabase
      .from("services")
      .select("id,duration,active")
      .eq("id", input.serviceId)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id")
      .eq("id", input.clientId)
      .maybeSingle(),
    supabase.from("appointments").select("*").eq("id", input.id).maybeSingle(),
  ]);
  if (service.error || client.error || existing.error)
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
  // PostgREST may format the same instant with +00:00 instead of Z.
  const sameInstant =
    existing.data &&
    existing.data.service_id === input.serviceId &&
    new Date(existing.data.starts_at).getTime() ===
      new Date(startsAt).getTime();
  if (!sameInstant && !service.data?.active)
    return { ok: false, message: "Escolha um serviço ativo." };
  const endsAt = sameInstant
    ? existing.data!.ends_at
    : new Date(
        new Date(startsAt).getTime() + service.data!.duration * 60000,
      ).toISOString();
  const values = {
    client_id: input.clientId,
    service_id: input.serviceId,
    performed_by: input.performedBy,
    starts_at: startsAt,
    ends_at: endsAt,
    status: input.status,
    price: input.price,
    payment_method: input.paymentMethod,
    notes: input.notes.trim(),
  };
  const result = existing.data
    ? await supabase
        .from("appointments")
        .update(values)
        .eq("id", input.id)
        .select("*")
        .single()
    : await supabase
        .from("appointments")
        .insert({
          ...values,
          id: input.id,
          booked_with: input.performedBy,
          source: "painel",
        })
        .select("*")
        .single();
  if (result.error)
    return { ok: false, message: databaseMessage(result.error) };
  revalidatePath("/painel");
  return { ok: true, data: appointmentFromRow(result.data) };
}

export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<SaveResult<AdminAppointment>> {
  const session = await getStaffSession();
  if (!session) return noAccess;
  if (typeof id !== "string" || !Object.hasOwn(statusLabels, status))
    return { ok: false, message: "Status inválido." };
  const { data, error } = await session.supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { ok: false, message: databaseMessage(error) };
  revalidatePath("/painel");
  return { ok: true, data: appointmentFromRow(data) };
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
