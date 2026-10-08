import { AdminDashboard } from "@/components/admin/dashboard";
import { salonToday } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/supabase/session";
import { loadCatalog } from "@/lib/supabase/catalog";
import { readAll } from "@/lib/supabase/read-all";
import { appointmentFromRow, clientFromRow } from "@/lib/admin-data";
import { CatalogProvider } from "@/components/catalog-provider";

export default async function PanelPage() {
  const session = await getStaffSession();
  if (!session) redirect("/painel/entrar");
  const { supabase, profile } = session;
  const [catalog, appointments, clients] = await Promise.all([
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
      supabase.from("clients").select("*").order("id").range(from, to),
    ),
  ]);
  return (
    <CatalogProvider catalog={catalog}>
      <AdminDashboard
        today={salonToday()}
        initialRole={profile.role === "owner" ? "dono" : "funcionario"}
        initialStylist={profile.stylist_id ?? ""}
        initialAppointments={appointments.map(appointmentFromRow)}
        initialClients={clients.map(clientFromRow)}
        accountEmail={session.email}
      />
    </CatalogProvider>
  );
}
