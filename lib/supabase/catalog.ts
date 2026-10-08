import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SalonCatalog } from "@/lib/catalog";
import type { Database } from "./database.types";
import { createPublicClient } from "./server";

export async function loadCatalog(
  supabase: SupabaseClient<Database>,
): Promise<SalonCatalog> {
  const [services, stylists, links, hours, settings] = await Promise.all([
    supabase.from("services").select("*").order("sort_order").order("id"),
    supabase.from("stylists").select("*").order("sort_order").order("id"),
    supabase.from("stylist_services").select("*").order("sort_order"),
    supabase.from("business_hours").select("weekday,active,opens_at,closes_at"),
    supabase.rpc("get_booking_settings"),
  ]);
  if (
    [services, stylists, links, hours, settings].some(
      (result) => result.error,
    ) ||
    !settings.data?.[0]
  ) {
    throw new Error(
      "Não foi possível carregar o catálogo do ateliê. Tente novamente.",
    );
  }
  return {
    services: services.data ?? [],
    stylists: (stylists.data ?? []).map((person) => ({
      ...person,
      serviceIds: (links.data ?? [])
        .filter((link) => link.stylist_id === person.id && link.active)
        .map((link) => link.service_id),
    })),
    businessHours: hours.data ?? [],
    bookingSettings: settings.data[0],
  };
}

export const getPublicCatalog = cache(async () => {
  // Supabase's fetch wrapper catches Next's prerender interruption. Stop
  // prerendering first so the catalog is loaded only for an incoming request.
  await connection();
  return loadCatalog(createPublicClient());
});
