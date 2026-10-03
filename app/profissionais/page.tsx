import { PageMotion } from "@/components/page-motion";
import { services, stylists } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { StylistDirectory } from "@/components/stylist-directory";
import { BookingCTA, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Profissionais",
  "Conheça a equipe do Livre Beauty e encontre especialidades em cortes, cor, textura, penteados e extensões.",
  "/profissionais",
);

export default function ProfessionalsPage() {
  return (
    <PageMotion>
      <PageIntro
        eyebrow="NOSSA EQUIPE"
        title="Mãos que cuidam. Olhares que entendem."
        emphasis="entendem."
        description="Técnicas diferentes, uma mesma intenção: ouvir com atenção e criar com você."
      />
      <section
        className="container pb-16 md:pb-24"
        aria-label="Encontre seu profissional"
      >
        <StylistDirectory items={stylists} services={services} />
        <div className="mt-12">
        </div>
      </section>
      <BookingCTA
        title="Escolha com quem viver seu próximo capítulo."
        description="Conheça as especialidades ou deixe a escolha aberta. O cuidado começa na conversa."
      />
    </PageMotion>
  );
}
