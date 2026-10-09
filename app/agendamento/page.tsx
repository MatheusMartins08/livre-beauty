import { BookingWizard } from "@/components/booking-wizard";
import Link from "next/link";
import { ActionContent, PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { getOpeningCalendar, getPublicCatalog } from "@/lib/supabase/catalog";
import { getPublicSite, whatsappNumber } from "@/lib/supabase/site";
import { CatalogProvider } from "@/components/catalog-provider";
import { windowDates } from "@/lib/booking-shared";

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
  const window = windowDates(
    new Date(),
    catalog.bookingSettings.booking_window_days,
  );
  const [calendar, { content }] = await Promise.all([
    getOpeningCalendar(window[0], window.at(-1)!),
    getPublicSite(),
  ]);
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
            whatsappNumber={whatsappNumber(content)}
            initialServiceId={service?.id}
            initialStylistId={stylist?.id}
            dates={window.filter((date) => calendar.has(date))}
          />
        </CatalogProvider>
        <p className="fine-print mt-10">
          Já agendou?{" "}
          <Link href="/agendamento/minha-reserva" className="action-link action-inline">
            <ActionContent>Consulte ou cancele sua reserva</ActionContent>
          </Link>
        </p>
      </section>
    </div>
  );
}
