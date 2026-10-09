import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import {
  defaultSiteContent,
  mergeSiteContent,
  type SiteContent,
} from "@/lib/site-content";
import {
  defaultOpeningPeriods,
  shortTime,
  type OpeningPeriod,
} from "@/lib/opening-hours";
import { supabaseConfig } from "./config";
import { createPublicClient } from "./server";

export interface PublicSite {
  content: SiteContent;
  openingPeriods: OpeningPeriod[];
}

/**
 * Editable texts, photos and weekly hours. Unlike the catalog, the public site
 * keeps its published defaults if the database is unavailable.
 */
export const getPublicSite = cache(async (): Promise<PublicSite> => {
  await connection();
  try {
    const supabase = createPublicClient();
    const [content, periods] = await Promise.all([
      supabase.from("site_content").select("key,content"),
      supabase
        .from("opening_periods")
        .select("weekday,opens_at,closes_at")
        .is("stylist_id", null),
    ]);
    return {
      content: content.error
        ? defaultSiteContent
        : mergeSiteContent(content.data ?? [], supabaseConfig().url),
      openingPeriods: periods.error
        ? defaultOpeningPeriods
        : (periods.data ?? []).map((period) => ({
            weekday: period.weekday,
            opens_at: shortTime(period.opens_at),
            closes_at: shortTime(period.closes_at),
          })),
    };
  } catch {
    return {
      content: defaultSiteContent,
      openingPeriods: defaultOpeningPeriods,
    };
  }
});

/** The number saved in the editor wins over the WHATSAPP_NUMBER fallback. */
export function whatsappNumber(content: SiteContent) {
  const digits =
    content.contact.whatsapp || process.env.WHATSAPP_NUMBER?.replace(/\D/g, "");
  return digits && /^[1-9]\d{9,14}$/.test(digits) ? digits : "";
}
