import { AdminDashboard } from "@/components/admin/dashboard";
import { salonToday } from "@/lib/admin";
import { stylists } from "@/content/salon";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string; profissional?: string }>;
}) {
  const params = await searchParams;
  return (
    <AdminDashboard
      today={salonToday()}
      initialRole={params.perfil === "funcionario" ? "funcionario" : "dono"}
      initialStylist={
        stylists.find((item) => item.id === params.profissional)?.id ?? "lia"
      }
    />
  );
}
