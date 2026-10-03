import { PageMotion } from "@/components/page-motion";
import Link from "next/link";
import { faqs } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { FAQAccordion } from "@/components/faq-accordion";
import { BookingCTA, DemoNote, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Dúvidas frequentes",
  "Tire dúvidas sobre agendamento, consulta, duração, preços, profissionais e políticas na experiência demonstrativa Livre Beauty.",
  "/faq",
);

export default function FAQPage() {
  return (
    <PageMotion>
      <PageIntro
        eyebrow="DÚVIDAS FREQUENTES"
        title="Antes de vir, saiba mais."
        emphasis="saiba mais."
        description="As respostas para planejar seu tempo com tranquilidade."
      />
      <section
        className="container grid items-start gap-10 pb-16 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20 lg:pb-24"
        aria-label="Perguntas e respostas"
      >
        <div className="max-w-[35ch]">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl">
            Podemos ajudar.
          </h2>
          <p className="mb-5 text-[var(--text-body)] leading-relaxed">
            Do primeiro cuidado à manutenção em casa, queremos que cada escolha
            seja bem informada.
          </p>
          <Link href="/contato" className="text-link">
            Ver canais de contato
          </Link>
          <div className="mt-8">
            <DemoNote>
              As respostas apresentam o modelo de atendimento de um salão
              fictício.
            </DemoNote>
          </div>
        </div>
        <div>
          <FAQAccordion items={faqs} />
          <p className="mt-8 text-sm text-[var(--text-body)] leading-relaxed">
            Para consultar as condições com mais detalhes, veja as{" "}
            <Link href="/politicas" className="text-link">
              políticas do salão
            </Link>
            .
          </p>
        </div>
      </section>
      <BookingCTA title="Tudo pronto para seu próximo cuidado?" />
    </PageMotion>
  );
}
