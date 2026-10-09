"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession } from "./supabase/session";
import { createAdminClient } from "./supabase/admin";
import { retentionOptions } from "./admin";
import { supabaseConfig } from "./supabase/config";
import type { Json } from "./supabase/database.types";
import {
  parseSiteSection,
  siteSectionKeys,
  type SiteSectionKey,
} from "./site-content";
import { isAllowedImage, isPosition, MEDIA_BUCKET, mediaPath } from "./media";
import {
  validateWeek,
  type ExceptionKind,
  type OpeningPeriod,
} from "./opening-hours";

export type EditorResult = { ok: boolean; message: string };
type Session = NonNullable<Awaited<ReturnType<typeof getStaffSession>>>;

const noAccess: EditorResult = {
  ok: false,
  message:
    "Seu acesso expirou ou você não tem permissão para esta alteração. Entre novamente.",
};
const failure: EditorResult = {
  ok: false,
  message: "Não foi possível salvar. Confira os dados e tente novamente.",
};

async function requireOwner(): Promise<Session | null> {
  const session = await getStaffSession();
  return session?.profile.role === "owner" ? session : null;
}

/** Hours of the salon (null) or of one professional: the owner, or that professional. */
async function requireScheduleEditor(
  stylistId: string | null,
): Promise<Session | null> {
  const session = await getStaffSession();
  if (!session) return null;
  if (session.profile.role === "owner") return session;
  return stylistId !== null && stylistId === session.profile.stylist_id
    ? session
    : null;
}

/** Public pages show only the salon's hours; individual hours stay in the panel. */
function refreshSchedule(stylistId: string | null) {
  if (stylistId === null) refreshSite();
  else revalidatePath("/painel");
}

function databaseMessage(error: { code?: string; message?: string }) {
  if (error.code === "42501") return noAccess.message;
  if (error.code?.startsWith("LB") && error.message) return error.message;
  if (error.code === "23P01")
    return "Os horários se sobrepõem. Ajuste os períodos e tente de novo.";
  if (error.code === "23514" && error.message && !/violates|new row/i.test(error.message))
    return error.message;
  return failure.message;
}

/** Every page may show edited content, so the whole site is refreshed. */
function refreshSite() {
  revalidatePath("/", "layout");
}

/** Uploaded images referenced anywhere inside a value. */
function uploadedImages(value: unknown, supabaseUrl: string): string[] {
  if (typeof value === "string")
    return mediaPath(value, supabaseUrl) ? [value] : [];
  if (Array.isArray(value))
    return value.flatMap((item) => uploadedImages(item, supabaseUrl));
  if (value && typeof value === "object")
    return Object.values(value).flatMap((item) =>
      uploadedImages(item, supabaseUrl),
    );
  return [];
}

/** Removes uploads no longer used; a failure only leaves an unused file. */
async function removeUnused(
  session: Session,
  before: unknown,
  after: unknown,
) {
  const { url } = supabaseConfig();
  const kept = new Set(uploadedImages(after, url));
  const paths = uploadedImages(before, url)
    .filter((image) => !kept.has(image))
    .map((image) => mediaPath(image, url)!);
  if (paths.length)
    await session.supabase.storage.from(MEDIA_BUCKET).remove(paths);
}

export async function saveSiteSection(
  key: SiteSectionKey,
  content: unknown,
): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  if (!siteSectionKeys.includes(key)) return failure;
  const { value, errors } = parseSiteSection(key, content, supabaseConfig().url);
  if (errors.length)
    return { ok: false, message: errors.slice(0, 4).join(" ") };
  const previous = await session.supabase
    .from("site_content")
    .select("content")
    .eq("key", key)
    .maybeSingle();
  if (previous.error) return failure;
  const { error } = await session.supabase
    .from("site_content")
    .upsert({ key, content: value as unknown as Json });
  if (error) return { ok: false, message: databaseMessage(error) };
  await removeUnused(session, previous.data?.content, value);
  refreshSite();
  return { ok: true, message: "Alterações publicadas no site." };
}

export async function resetSiteSection(
  key: SiteSectionKey,
): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  if (!siteSectionKeys.includes(key)) return failure;
  const { data, error } = await session.supabase
    .from("site_content")
    .delete()
    .eq("key", key)
    .select("content");
  if (error) return { ok: false, message: databaseMessage(error) };
  await removeUnused(session, data, null);
  refreshSite();
  return { ok: true, message: "O texto original voltou a ser exibido." };
}

function text(value: unknown, min: number, max: number) {
  return typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
    ? value.trim()
    : null;
}
function ids(value: unknown, max: number) {
  return Array.isArray(value) &&
    value.length <= max &&
    value.every((id) => typeof id === "string" && id.length <= 80)
    ? [...new Set(value as string[])]
    : null;
}
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** New rows use the slug as id too, so links and ids stay readable. */
async function availableSlug(
  session: Session,
  table: "services" | "stylists",
  name: string,
) {
  const base = slugify(name) || (table === "services" ? "servico" : "profissional");
  const { data, error } = await session.supabase
    .from(table)
    .select("id,slug");
  if (error) return null;
  const taken = new Set(data.flatMap((row) => [row.id, row.slug]));
  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix++) slug = `${base}-${suffix}`;
  return slug;
}

export interface ServiceInput {
  id: string | null;
  name: string;
  category: string;
  description: string;
  summary: string;
  duration: number;
  price: number;
  image: string;
  imagePosition: string;
  homeImage: string | null;
  homeImageAlt: string;
  homeImagePosition: string;
  active: boolean;
  popular: boolean;
  stylistIds: string[];
  componentIds: string[];
}

export async function saveService(input: ServiceInput): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  const { url } = supabaseConfig();
  const name = text(input?.name, 2, 100);
  const category = text(input?.category, 1, 60);
  const description = text(input?.description, 1, 400);
  const summary = text(input?.summary ?? "", 0, 160);
  const homeImageAlt = text(input?.homeImageAlt ?? "", 0, 200);
  const stylistIds = ids(input?.stylistIds, 50);
  const componentIds = ids(input?.componentIds, 5);
  if (!name || !category || !description || summary === null)
    return { ok: false, message: "Confira o nome, a categoria e as descrições." };
  if (
    !Number.isInteger(input.duration) ||
    input.duration < 5 ||
    input.duration > 720 ||
    !Number.isFinite(input.price) ||
    input.price < 0 ||
    input.price > 100000
  )
    return {
      ok: false,
      message: "Use uma duração de 5 a 720 minutos e um preço de até R$ 100.000.",
    };
  if (
    !isAllowedImage(input.image, url) ||
    !isPosition(input.imagePosition) ||
    !isPosition(input.homeImagePosition) ||
    (input.homeImage !== null && !isAllowedImage(input.homeImage, url)) ||
    homeImageAlt === null ||
    (input.homeImage !== null && !homeImageAlt)
  )
    return { ok: false, message: "Confira as fotos e a descrição da foto da página inicial." };
  if (
    !stylistIds ||
    !componentIds ||
    typeof input.active !== "boolean" ||
    typeof input.popular !== "boolean"
  )
    return failure;
  if (input.id !== null && componentIds.includes(input.id))
    return { ok: false, message: "Um combo não pode incluir a si mesmo." };
  if (componentIds.length === 1)
    return { ok: false, message: "Um combo precisa de pelo menos 2 serviços." };
  const previous = input.id
    ? await session.supabase
        .from("services")
        .select("image,home_image")
        .eq("id", input.id)
        .maybeSingle()
    : null;
  if (previous?.error || (input.id && !previous?.data)) return failure;
  const slug = input.id ? null : await availableSlug(session, "services", name);
  if (!input.id && !slug) return failure;
  const { error } = await session.supabase.rpc("save_service", {
    p_id: input.id ?? slug!,
    p_slug: slug as string,
    p_name: name,
    p_category: category,
    p_description: description,
    p_summary: summary,
    p_duration: input.duration,
    p_price: Math.round(input.price * 100) / 100,
    p_image: input.image,
    p_image_position: input.imagePosition,
    p_home_image: input.homeImage as string,
    p_home_image_alt: homeImageAlt,
    p_home_image_position: input.homeImagePosition,
    p_active: input.active,
    p_stylist_ids: stylistIds,
    p_component_ids: componentIds,
    p_popular: input.popular,
  });
  if (error) return { ok: false, message: databaseMessage(error) };
  await removeUnused(session, previous?.data, [input.image, input.homeImage]);
  refreshSite();
  return { ok: true, message: input.id ? "Serviço atualizado." : "Serviço criado." };
}

export interface StylistInput {
  id: string | null;
  name: string;
  role: string;
  experience: number;
  specialties: string[];
  description: string;
  biography: string;
  image: string;
  imagePosition: string;
  active: boolean;
  serviceIds: string[];
}

export async function saveStylist(input: StylistInput): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  const name = text(input?.name, 2, 100);
  const role = text(input?.role, 1, 80);
  const description = text(input?.description, 1, 400);
  const biography = text(input?.biography, 1, 1500);
  const serviceIds = ids(input?.serviceIds, 50);
  const specialties = Array.isArray(input?.specialties)
    ? input.specialties.map((item) => text(item, 1, 40))
    : null;
  if (!name || !role || !description || !biography)
    return { ok: false, message: "Confira o nome, a função, a descrição e a biografia." };
  if (!specialties || specialties.length > 8 || specialties.some((item) => !item))
    return { ok: false, message: "Use até 8 especialidades com até 40 caracteres cada." };
  if (
    !Number.isInteger(input.experience) ||
    input.experience < 0 ||
    input.experience > 80
  )
    return { ok: false, message: "Informe os anos de experiência (0 a 80)." };
  if (!isAllowedImage(input.image, supabaseConfig().url) || !isPosition(input.imagePosition))
    return { ok: false, message: "Envie uma foto válida." };
  if (!serviceIds || typeof input.active !== "boolean") return failure;
  const previous = input.id
    ? await session.supabase
        .from("stylists")
        .select("image")
        .eq("id", input.id)
        .maybeSingle()
    : null;
  if (previous?.error || (input.id && !previous?.data)) return failure;
  const slug = input.id ? null : await availableSlug(session, "stylists", name);
  if (!input.id && !slug) return failure;
  const { error } = await session.supabase.rpc("save_stylist", {
    p_id: input.id ?? slug!,
    p_slug: slug as string,
    p_name: name,
    p_role: role,
    p_experience: input.experience,
    p_specialties: specialties as string[],
    p_description: description,
    p_biography: biography,
    p_image: input.image,
    p_image_position: input.imagePosition,
    p_active: input.active,
    p_service_ids: serviceIds,
  });
  if (error) return { ok: false, message: databaseMessage(error) };
  await removeUnused(session, previous?.data, input.image);
  refreshSite();
  return {
    ok: true,
    message: input.id ? "Profissional atualizado." : "Profissional cadastrado.",
  };
}

export async function deleteCatalogItem(
  kind: "services" | "stylists",
  id: string,
): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  if ((kind !== "services" && kind !== "stylists") || typeof id !== "string")
    return failure;
  const previous =
    kind === "services"
      ? await session.supabase
          .from("services")
          .select("image,home_image")
          .eq("id", id)
          .maybeSingle()
      : await session.supabase
          .from("stylists")
          .select("image")
          .eq("id", id)
          .maybeSingle();
  if (previous.error) return failure;
  // Team logins of this professional; the function removes their profiles.
  const logins =
    kind === "stylists"
      ? await session.supabase
          .from("staff_profiles")
          .select("user_id")
          .eq("stylist_id", id)
          .eq("role", "staff")
      : null;
  if (logins?.error) return failure;
  const { data, error } = await session.supabase.rpc(
    kind === "services" ? "delete_service" : "delete_stylist",
    { p_id: id },
  );
  if (error) return { ok: false, message: databaseMessage(error) };
  // Archived rows keep their photos for the appointment history.
  if (data === "deleted") await removeUnused(session, previous.data, null);
  refreshSite();
  const removedLogins = await deleteAuthUsers(
    (logins?.data ?? []).map((row) => row.user_id),
  );
  const done =
    data === "deleted"
      ? "Excluído do site e do painel."
      : "Arquivado: saiu do site e do agendamento, e o histórico foi preservado.";
  return {
    ok: true,
    message: removedLogins
      ? done
      : `${done} O acesso ao painel foi bloqueado, mas o login não pôde ser apagado; remova-o em Authentication → Users no Supabase.`,
  };
}

/**
 * The profile is already gone, so the account has no access; deleting the
 * Auth user also frees the username for a new login.
 */
async function deleteAuthUsers(userIds: string[]) {
  if (!userIds.length) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const results = await Promise.all(
    userIds.map((userId) => admin.auth.admin.deleteUser(userId)),
  );
  return results.every((result) => !result.error);
}

export async function reorderCatalog(
  kind: "services" | "stylists",
  order: string[],
): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  const list = ids(order, 200);
  if ((kind !== "services" && kind !== "stylists") || !list) return failure;
  const { error } = await session.supabase.rpc("reorder_catalog", {
    p_kind: kind,
    p_ids: list,
  });
  if (error) return { ok: false, message: databaseMessage(error) };
  refreshSite();
  return { ok: true, message: "Nova ordem publicada." };
}

/**
 * Replaces the week of the salon (stylistId null) or of one professional.
 * For a professional, an empty week means following the salon's hours again.
 */
export async function saveOpeningPeriods(
  periods: OpeningPeriod[],
  stylistId: string | null = null,
): Promise<EditorResult> {
  if (stylistId !== null && typeof stylistId !== "string") return failure;
  const session = await requireScheduleEditor(stylistId);
  if (!session) return noAccess;
  if (
    !Array.isArray(periods) ||
    periods.length > 42 ||
    periods.some(
      (period) =>
        !period ||
        !Number.isInteger(period.weekday) ||
        period.weekday < 0 ||
        period.weekday > 6 ||
        typeof period.opens_at !== "string" ||
        typeof period.closes_at !== "string",
    )
  )
    return failure;
  const errors = validateWeek(periods);
  if (errors.length) return { ok: false, message: errors.join(" ") };
  const { error } = await session.supabase.rpc("save_opening_periods", {
    p_periods: periods.map(({ weekday, opens_at, closes_at }) => ({
      weekday,
      opens_at,
      closes_at,
    })),
    ...(stylistId ? { p_stylist_id: stylistId } : {}),
  });
  if (error) return { ok: false, message: databaseMessage(error) };
  refreshSchedule(stylistId);
  return {
    ok: true,
    message:
      stylistId && !periods.length
        ? "Voltou a seguir o horário do ateliê."
        : "Horários da semana atualizados.",
  };
}

export interface ExceptionInput {
  kind: ExceptionKind;
  stylistId: string | null;
  startsOn: string;
  endsOn: string;
  opensAt: string | null;
  closesAt: string | null;
  reason: string;
}

export async function createScheduleException(
  input: ExceptionInput,
): Promise<EditorResult> {
  if (!input || (input.stylistId !== null && typeof input.stylistId !== "string"))
    return failure;
  const session = await requireScheduleEditor(input.stylistId);
  if (!session) return noAccess;
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  const reason = text(input?.reason ?? "", 0, 120);
  if (
    !input ||
    !["fechado", "horario_especial", "bloqueio"].includes(input.kind) ||
    !date.test(input.startsOn) ||
    !date.test(input.endsOn) ||
    input.endsOn < input.startsOn ||
    reason === null ||
    (input.stylistId !== null && typeof input.stylistId !== "string")
  )
    return { ok: false, message: "Confira o tipo, as datas e o motivo." };
  const timed = input.kind !== "fechado";
  if (
    timed &&
    (!time.test(input.opensAt ?? "") ||
      !time.test(input.closesAt ?? "") ||
      input.closesAt! <= input.opensAt!)
  )
    return { ok: false, message: "Informe um horário de início antes do fim." };
  const { error } = await session.supabase.from("schedule_exceptions").insert({
    kind: input.kind,
    stylist_id: input.stylistId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    opens_at: timed ? input.opensAt : null,
    closes_at: timed ? input.closesAt : null,
    reason,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23P01"
          ? "Já existe um horário especial nessas datas."
          : databaseMessage(error),
    };
  refreshSchedule(input.stylistId);
  return { ok: true, message: "Exceção registrada na agenda." };
}

export async function deleteScheduleException(id: string): Promise<EditorResult> {
  const viewer = await getStaffSession();
  if (!viewer) return noAccess;
  if (typeof id !== "string") return failure;
  // The owner of the row comes from the database, never from the request.
  const { data: row, error: readError } = await viewer.supabase
    .from("schedule_exceptions")
    .select("stylist_id")
    .eq("id", id)
    .maybeSingle();
  if (readError) return failure;
  if (!row) return { ok: false, message: "Esta exceção já foi removida." };
  const session = await requireScheduleEditor(row.stylist_id);
  if (!session) return noAccess;
  const { error } = await session.supabase
    .from("schedule_exceptions")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: databaseMessage(error) };
  refreshSchedule(row.stylist_id);
  return { ok: true, message: "Exceção removida." };
}

export interface BookingRulesInput {
  showPrices: boolean;
  bookingWindowDays: number;
  slotIntervalMinutes: number;
  commissionRate: number;
  /** How long before the start a client may still cancel on the site. */
  cancelNoticeMinutes: number;
  /** Null keeps the whole history. */
  historyRetentionMonths: number | null;
}


export async function saveBookingRules(
  input: BookingRulesInput,
): Promise<EditorResult> {
  const session = await requireOwner();
  if (!session) return noAccess;
  if (
    typeof input?.showPrices !== "boolean" ||
    !Number.isInteger(input.bookingWindowDays) ||
    input.bookingWindowDays < 1 ||
    input.bookingWindowDays > 365 ||
    ![10, 15, 20, 30, 45, 60].includes(input.slotIntervalMinutes) ||
    !Number.isFinite(input.commissionRate) ||
    input.commissionRate < 0 ||
    input.commissionRate > 1 ||
    !Number.isInteger(input.cancelNoticeMinutes) ||
    input.cancelNoticeMinutes < 0 ||
    input.cancelNoticeMinutes > 43200 ||
    (input.historyRetentionMonths !== null &&
      !(retentionOptions as readonly number[]).includes(input.historyRetentionMonths))
  )
    return { ok: false, message: "Confira as regras do agendamento." };
  const { error } = await session.supabase
    .from("salon_settings")
    .update({
      show_prices: input.showPrices,
      booking_window_days: input.bookingWindowDays,
      slot_interval_minutes: input.slotIntervalMinutes,
      demo_commission_rate: Math.round(input.commissionRate * 10000) / 10000,
      cancel_min_notice_minutes: input.cancelNoticeMinutes,
      history_retention_months: input.historyRetentionMonths,
    })
    .eq("id", true);
  if (error) return { ok: false, message: databaseMessage(error) };
  refreshSite();
  return { ok: true, message: "Regras do agendamento atualizadas." };
}

export type PurgePreview =
  | { ok: true; appointments: number; clients: number; exceptions: number; cutoff: string }
  | EditorResult;

/** What a retention period would remove at the next daily cleanup. */
export async function previewHistoryPurge(months: number): Promise<PurgePreview> {
  const session = await requireOwner();
  if (!session) return noAccess;
  if (!(retentionOptions as readonly number[]).includes(months)) return failure;
  const { data, error } = await session.supabase.rpc("preview_history_purge", {
    p_months: months,
  });
  if (error || !data?.[0]) return { ok: false, message: databaseMessage(error ?? {}) };
  return { ok: true, ...data[0] };
}
