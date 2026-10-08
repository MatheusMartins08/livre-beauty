import type { Service, Stylist } from "@/content/salon";

export type CatalogService = Service & { active: boolean };
export type CatalogStylist = Stylist & { active: boolean };
export interface BusinessHours {
  weekday: number;
  active: boolean;
  opens_at: string | null;
  closes_at: string | null;
}
export interface BookingSettings {
  show_prices: boolean;
  booking_window_days: number;
  slot_interval_minutes: number;
}
export interface SalonCatalog {
  services: CatalogService[];
  stylists: CatalogStylist[];
  businessHours: BusinessHours[];
  bookingSettings: BookingSettings;
}
