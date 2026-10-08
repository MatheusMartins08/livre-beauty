import { PageMotion } from "@/components/page-motion";
import { pageMetadata } from "@/lib/metadata";
import { PageIntro, TextLink } from "@/components/ui";

export const metadata = pageMetadata(
  "Termos de uso",
  "Conheça as informações de uso, agendamento, conteúdo e privacidade do Livre Beauty.",
  "/termos",
);

export default function TermsPage() {
  return (
    <PageMotion animate={false}>
      <PageIntro
        eyebrow="TERMOS"
        title="Termos de uso."
        emphasis="uso."
        description="Informações para navegar pelo Livre Beauty com clareza."
      />
      <div className="container legal-prose">
        <section>
          <h2>Uso do site</h2>
          <p>
            O site reúne informações sobre o Livre Beauty, seus serviços,
            profissionais e cuidados. Fotografias e referências ajudam a
            conhecer o universo do ateliê e a preparar sua próxima escolha.
          </p>
        </section>
        <section>
          <h2>Escolha de serviço e horário</h2>
          <p>
            O fluxo permite selecionar serviço, profissional, data e horário. A
            confirmação registra a reserva na agenda da equipe e apresenta os
            detalhes do atendimento. A disponibilidade é verificada novamente no
            momento da confirmação; caso o horário tenha sido ocupado, será
            necessário escolher outro.
          </p>
          <p>
            Durações e preços iniciais orientam sua escolha. Comprimento,
            volume, histórico dos fios e avaliação individual podem alterar o
            tempo e o investimento necessários.
          </p>
        </section>
        <section>
          <h2>Canais e localização</h2>
          <p>
            Os acessos aos canais apresentam informações dentro do próprio site.
            Na página inicial, o mapa opcional mostra a região dos Jardins. Ao
            ativá-lo, o navegador carrega conteúdo externo do OpenStreetMap.
          </p>
        </section>
        <section>
          <h2>Imagens e resultados</h2>
          <p>
            As fotografias e fontes têm suas origens e licenças registradas na
            documentação do projeto. Os resultados de cortes, coloração e outros
            procedimentos variam conforme as características dos fios e a
            avaliação individual.
          </p>
        </section>
        <section>
          <h2>Dados informados</h2>
          <p>
            Ao confirmar, os dados de contato e do atendimento são registrados
            no Supabase para uso da equipe autorizada. Informe dados corretos e
            próprios. A página de privacidade explica esse tratamento, os
            cookies do painel e o mapa opcional.
          </p>
        </section>
        <section>
          <h2>Condições de atendimento</h2>
          <p>
            As políticas do salão apresentam os combinados sobre horários,
            cancelamentos, atrasos, acompanhantes e ajustes. O site não processa
            pagamentos ou aplica multas.
          </p>
        </section>
        <section>
          <h2>Atualizações</h2>
          <p>
            O conteúdo pode ser atualizado para refletir mudanças nos serviços,
            nos canais e no funcionamento do site.
          </p>
        </section>
        <div className="legal-actions">
          <TextLink href="/politicas">Consultar as políticas</TextLink>
          <TextLink href="/privacidade">Ler sobre privacidade</TextLink>
        </div>
      </div>
    </PageMotion>
  );
}
