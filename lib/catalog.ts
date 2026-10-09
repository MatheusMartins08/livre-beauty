import type { Service, Stylist } from "@/content/salon";
import type { OpeningPeriod } from "./opening-hours";

export type CatalogService = Service & {
  active: boolean;
  /** Archived rows stay only so the history of appointments keeps its names. */
  deleted: boolean;
  summary: string;
  imagePosition: string;
  homeImage: string | null;
  homeImageAlt: string;
  homeImagePosition: string;
  /** Services included in a combo; empty for a simple service. */
  componentIds: string[];
  /** Highlighted by the owner as "Mais pedido". */
  popular: boolean;
};
export type CatalogStylist = Stylist & {
  active: boolean;
  deleted: boolean;
  imagePosition: string;
};
export interface BookingSettings {
  show_prices: boolean;
  booking_window_days: number;
  slot_interval_minutes: number;
}
export interface SalonCatalog {
  services: CatalogService[];
  stylists: CatalogStylist[];
  /** The salon's weekly periods. */
  openingPeriods: OpeningPeriod[];
  /** Professionals' own weekly periods; empty for visitors (RLS). */
  stylistPeriods: OpeningPeriod[];
  bookingSettings: BookingSettings;
}
