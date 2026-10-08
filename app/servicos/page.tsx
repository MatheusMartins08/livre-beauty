import { PageMotion } from "@/components/page-motion";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import { pageMetadata } from "@/lib/metadata";
import { ServiceDirectory } from "@/components/service-directory";
import { BookingCTA, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Serviços",
  "Cortes, coloração, balayage, tratamentos, finalização e extensões: conheça os cuidados personalizados do Livre Beauty.",
  "/servicos",
);

export default async function ServicesPage() {
  const { services, bookingSettings } = await getPublicCatalog();
  return (
    <PageMotion>
      <PageIntro
        eyebrow="SERVIÇOS"
        title="Cuidado que acompanha você."
        emphasis="acompanha você."
        description="Da primeira conversa ao último detalhe, cada escolha respeita sua textura, sua rotina e seu jeito de se ver."
      />
      <section
        className="container pb-16 md:pb-24"
        aria-label="Todos os serviços"
      >
        <ServiceDirectory
          items={services}
          showPrices={bookingSettings.show_prices}
        />
        <div className="mt-8 max-w-[75ch]">
          <p className="fine-print">
            O investimento pode variar conforme comprimento, volume e técnica,
            com orçamento combinado antes do atendimento.
          </p>
        </div>
      </section>
      <BookingCTA
        title="Ainda não sabe por onde começar?"
        description="A primeira conversa ajuda a encontrar o cuidado que faz sentido para você."
      />
    </PageMotion>
  );
}
