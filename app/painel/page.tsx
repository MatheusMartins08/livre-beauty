import { AdminDashboard } from "@/components/admin/dashboard";
import { defaultCommissionRate, salonToday } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/supabase/session";
import { loadCatalog } from "@/lib/supabase/catalog";
import { readAll } from "@/lib/supabase/read-all";
import { supabaseConfig } from "@/lib/supabase/config";
import {
  appointmentFromRow,
  clientFromRow,
  exceptionFromRow,
} from "@/lib/admin-data";
import { mergeSiteContent, type SiteSectionKey } from "@/lib/site-content";
import { CatalogProvider } from "@/components/catalog-provider";

export default async function PanelPage() {
  const session = await getStaffSession();
  if (!session) redirect("/painel/entrar");
  const { supabase, profile } = session;
  const isOwner = profile.role === "owner";
  const [catalog, appointments, items, clients, exceptions, rate, owner] =
    await Promise.all([
      loadCatalog(supabase),
      readAll((from, to) =>
        supabase
          .from("appointments")
          .select("*")
          .order("starts_at")
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        supabase
          .from("appointment_services")
          .select("appointment_id,sort_order,service_id,service_name")
          .order("appointment_id")
          .order("sort_order")
          .range(from, to),
      ),
      readAll((from, to) =>
        supabase.from("clients").select("*").order("id").range(from, to),
      ),
      readAll((from, to) =>
        supabase
          .from("schedule_exceptions")
          .select("*")
          .order("starts_on")
          .order("id")
          .range(from, to),
      ),
      supabase.rpc("get_staff_settings"),
      isOwner
        ? Promise.all([
            supabase.from("site_content").select("key,content"),
            supabase.from("salon_settings").select("*").maybeSingle(),
          ])
        : null,
    ]);
  if (owner && (owner[0].error || owner[1].error))
    throw new Error("Não foi possível carregar o conteúdo do site. Tente novamente.");
  const serviceName = (id: string) =>
    catalog.services.find((service) => service.id === id)?.name ?? "";
  return (
    <CatalogProvider catalog={catalog}>
      <AdminDashboard
        today={salonToday()}
        initialRole={isOwner ? "dono" : "funcionario"}
        initialStylist={profile.stylist_id ?? ""}
        initialAppointments={appointments.map((row) =>
          appointmentFromRow(row, items, serviceName(row.service_id)),
        )}
        initialClients={clients.map(clientFromRow)}
        exceptions={exceptions.map(exceptionFromRow)}
        commissionRate={rate.data?.[0]?.commission_rate ?? defaultCommissionRate}
        accountEmail={session.email}
        siteEditor={
          owner
            ? {
                content: mergeSiteContent(
                  owner[0].data ?? [],
                  supabaseConfig().url,
                ),
                savedSections: (owner[0].data ?? []).map(
                  (row) => row.key as SiteSectionKey,
                ),
                settings: owner[1].data
                  ? {
                      showPrices: owner[1].data.show_prices,
                      bookingWindowDays: owner[1].data.booking_window_days,
                      slotIntervalMinutes: owner[1].data.slot_interval_minutes,
                      commissionRate: owner[1].data.demo_commission_rate,
                    }
                  : null,
              }
            : null
        }
      />
    </CatalogProvider>
  );
}
