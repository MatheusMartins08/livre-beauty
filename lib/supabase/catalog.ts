import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SalonCatalog } from "@/lib/catalog";
import { shortTime, type DayPeriod } from "@/lib/opening-hours";
import type { Database } from "./database.types";
import { createPublicClient } from "./server";

export async function loadCatalog(
  supabase: SupabaseClient<Database>,
): Promise<SalonCatalog> {
  const [services, stylists, links, components, periods, settings] =
    await Promise.all([
      supabase.from("services").select("*").order("sort_order").order("id"),
      supabase.from("stylists").select("*").order("sort_order").order("id"),
      supabase.from("stylist_services").select("*").order("sort_order"),
      supabase
        .from("service_components")
        .select("service_id,component_id")
        .order("sort_order"),
      supabase
        .from("opening_periods")
        .select("weekday,opens_at,closes_at")
        .order("weekday")
        .order("opens_at"),
      supabase.rpc("get_booking_settings"),
    ]);
  if (
    [services, stylists, links, components, periods, settings].some(
      (result) => result.error,
    ) ||
    !settings.data?.[0]
  ) {
    throw new Error(
      "Não foi possível carregar o catálogo do ateliê. Tente novamente.",
    );
  }
  return {
    services: (services.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      description: row.description,
      duration: row.duration,
      price: row.price,
      image: row.image,
      active: row.active,
      deleted: row.deleted_at !== null,
      summary: row.summary,
      imagePosition: row.image_position,
      homeImage: row.home_image,
      homeImageAlt: row.home_image_alt,
      homeImagePosition: row.home_image_position,
      componentIds: (components.data ?? [])
        .filter((component) => component.service_id === row.id)
        .map((component) => component.component_id),
    })),
    stylists: (stylists.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      role: row.role,
      experience: row.experience,
      specialties: row.specialties,
      description: row.description,
      biography: row.biography,
      image: row.image,
      active: row.active,
      deleted: row.deleted_at !== null,
      imagePosition: row.image_position,
      serviceIds: (links.data ?? [])
        .filter((link) => link.stylist_id === row.id && link.active)
        .map((link) => link.service_id),
    })),
    openingPeriods: (periods.data ?? []).map((period) => ({
      weekday: period.weekday,
      opens_at: shortTime(period.opens_at),
      closes_at: shortTime(period.closes_at),
    })),
    bookingSettings: settings.data[0],
  };
}

export const getPublicCatalog = cache(async () => {
  // Supabase's fetch wrapper catches Next's prerender interruption. Stop
  // prerendering first so the catalog is loaded only for an incoming request.
  await connection();
  return loadCatalog(createPublicClient());
});

/** Opening periods per date, with exceptions applied by the database. */
export const getOpeningCalendar = cache(
  async (from: string, to: string): Promise<Map<string, DayPeriod[]>> => {
    await connection();
    const { data, error } = await createPublicClient().rpc(
      "get_opening_calendar",
      { p_from: from, p_to: to },
    );
    if (error)
      throw new Error("Não foi possível consultar os dias de atendimento.");
    const calendar = new Map<string, DayPeriod[]>();
    for (const row of data ?? [])
      calendar.set(row.day, [
        ...(calendar.get(row.day) ?? []),
        { opens_at: shortTime(row.opens_at), closes_at: shortTime(row.closes_at) },
      ]);
    return calendar;
  },
);
