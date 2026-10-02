import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import { DemoNote, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Termos de uso",
  "Conheça os termos desta apresentação fictícia do Livre Beauty, incluindo simulação de agendamento, conteúdo ilustrativo e privacidade.",
  "/termos",
);

export default function TermsPage() {
  return (
    <>
      <PageIntro
        eyebrow="TERMOS"
        title="Termos de uso."
        description="Informações para explorar a apresentação do Livre Beauty."
      />
      <div className="container grid items-start gap-10 pb-16 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20 lg:pb-24">
        <aside className="max-w-[35ch]">
          <DemoNote>
            Este site apresenta um conceito fictício de salão de beleza e uma
            experiência de navegação demonstrativa.
          </DemoNote>
        </aside>
        <div className="space-y-9 text-[#625D57] leading-relaxed">
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Finalidade da apresentação
            </h2>
            <p>
              Livre Beauty, sua equipe, endereço, experiências, depoimentos,
              preços e condições de atendimento são conteúdo fictício para
              demonstração. Nenhuma informação neste site confirma a existência
              de um estabelecimento, de profissionais vinculados ou de uma
              oferta comercial real.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Agendamento e contato
            </h2>
            <p>
              O fluxo de agendamento permite escolher serviço, profissional,
              data e horário para conhecer a experiência. A conclusão gera
              apenas um resumo da simulação, sem reserva, cobrança ou
              compromisso de atendimento.
            </p>
            <p className="mt-4">
              O formulário de contato também é demonstrativo: nenhuma mensagem é
              transmitida. Os canais sociais e de atendimento não iniciam
              contato com terceiros.
            </p>
            <p className="mt-4">
              Na página de contato, o mapa opcional mostra a região dos Jardins,
              sem indicar um estabelecimento real. Ao ativá-lo, o navegador
              carrega conteúdo externo do OpenStreetMap.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Imagens e resultados
            </h2>
            <p>
              As imagens são referências editoriais ilustrativas. Não documentam
              serviços realizados pela equipe fictícia e não garantem resultados
              de cortes, cor ou outros procedimentos. Em uma experiência real, a
              avaliação individual dos fios orientaria a técnica, a duração e o
              investimento.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Dados informados
            </h2>
            <p>
              Os formulários usam dados apenas na memória da página para
              demonstrar a interação. O aplicativo não persiste essas
              informações nem as envia a uma equipe ou serviço de atendimento.
              Ao testar, utilize dados de exemplo. Veja mais detalhes na{" "}
              <Link href="/privacidade" className="text-link">
                página de privacidade
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Políticas demonstrativas
            </h2>
            <p>
              As{" "}
              <Link href="/politicas" className="text-link">
                políticas do salão
              </Link>{" "}
              exemplificam possíveis combinados de atendimento. Nesta
              apresentação, não há aplicação de multas, condições de pagamento,
              cancelamentos de reservas reais ou prestação de serviços.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Atualizações
            </h2>
            <p>
              O conteúdo pode ser ajustado conforme o projeto evolui. Caso o
              site passe a representar uma operação real, informações
              comerciais, canais, formulários, políticas e termos deverão
              refletir essa operação antes de sua ativação.
            </p>
          </section>
          <p className="border-t border-[#252422]/15 pt-7 text-sm">
            Para conhecer a experiência, explore os{" "}
            <Link href="/servicos" className="text-link">
              serviços
            </Link>{" "}
            ou consulte as{" "}
            <Link href="/faq" className="text-link">
              dúvidas frequentes
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
