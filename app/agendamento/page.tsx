import { BookingWizard } from "@/components/booking-wizard";
import { PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import { CatalogProvider } from "@/components/catalog-provider";
import { getBookingDates } from "@/lib/booking-shared";

export const metadata = pageMetadata(
  "Agendamento",
  "Escolha seu serviço, profissional e horário em uma experiência de agendamento personalizada do Livre Beauty.",
  "/agendamento",
);

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const catalog = await getPublicCatalog();
  const service =
    typeof query.servico === "string"
      ? catalog.services.find((item) => item.slug === query.servico)
      : undefined;
  const candidate =
    typeof query.profissional === "string"
      ? catalog.stylists.find((item) => item.slug === query.profissional)
      : undefined;
  const stylist =
    candidate && (!service || candidate.serviceIds.includes(service.id))
      ? candidate
      : undefined;
  return (
    <div className="booking-page">
      <PageIntro
        eyebrow="SEU MOMENTO NO LIVRE"
        title="Um tempo para você."
        emphasis="para você."
        description="Escolha seu cuidado, encontre seu profissional e conheça uma experiência pensada para o seu ritmo."
      />
      <section className="container section" aria-label="Agendamento">
        <CatalogProvider catalog={catalog}>
          <BookingWizard
            whatsappNumber={process.env.WHATSAPP_NUMBER}
            initialServiceId={service?.id}
            initialStylistId={stylist?.id}
            dates={getBookingDates(
              new Date(),
              catalog.bookingSettings.booking_window_days,
              catalog.businessHours
                .filter((day) => day.active)
                .map((day) => day.weekday),
            )}
          />
        </CatalogProvider>
      </section>
    </div>
  );
}
