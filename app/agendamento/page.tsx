import { BookingWizard } from "@/components/booking-wizard";
import { DemoNote, PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { getService, getStylist } from "@/lib/utils";

export const metadata = pageMetadata(
  "Agendamento",
  "Escolha seu serviço, profissional e horário e conheça a experiência de agendamento demonstrativa do Livre Beauty.",
  "/agendamento",
);

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const service =
    typeof query.servico === "string" ? getService(query.servico) : undefined;
  const candidate =
    typeof query.profissional === "string"
      ? getStylist(query.profissional)
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
        description="Escolha seu cuidado, encontre seu profissional e conheça uma experiência pensada para o seu ritmo."
      >
        <DemoNote>
          Agendamento demonstrativo. Nenhuma reserva real é criada e seus dados
          não são enviados.
        </DemoNote>
      </PageIntro>
      <section
        className="container section"
        aria-label="Agendamento demonstrativo"
      >
        <BookingWizard
          initialServiceId={service?.id}
          initialStylistId={stylist?.id}
        />
      </section>
    </div>
  );
}
