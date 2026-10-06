import { PageMotion } from "@/components/page-motion";
import { pageMetadata } from "@/lib/metadata";
import { PageIntro, TextLink } from "@/components/ui";

export const metadata = pageMetadata("Termos de uso", "Conheça as informações de uso, agendamento, conteúdo e privacidade do Livre Beauty.", "/termos");

export default function TermsPage() {
  return (
    <PageMotion animate={false}>
      <PageIntro eyebrow="TERMOS" title="Termos de uso." emphasis="uso." description="Informações para navegar pelo Livre Beauty com clareza." />
      <div className="container legal-prose">
        <section>
          <h2>Uso do site</h2>
          <p>O site reúne informações sobre o Livre Beauty, seus serviços, profissionais e cuidados. Fotografias e referências ajudam a conhecer o universo do ateliê e a preparar sua próxima escolha.</p>
        </section>
        <section>
          <h2>Escolha de serviço e horário</h2>
          <p>O fluxo permite selecionar serviço, profissional, data e horário. Ao concluir, você pode consultar um resumo das escolhas feitas e iniciar uma nova seleção.</p>
          <p>Durações e preços iniciais orientam sua escolha. Comprimento, volume, histórico dos fios e avaliação individual podem alterar o tempo e o investimento necessários.</p>
        </section>
        <section>
          <h2>Canais e localização</h2>
          <p>Os acessos aos canais apresentam informações dentro do próprio site. Na página inicial, o mapa opcional mostra a região dos Jardins. Ao ativá-lo, o navegador carrega conteúdo externo do OpenStreetMap.</p>
        </section>
        <section>
          <h2>Imagens e resultados</h2>
          <p>As fotografias e fontes têm suas origens e licenças registradas na documentação do projeto. Os resultados de cortes, coloração e outros procedimentos variam conforme as características dos fios e a avaliação individual.</p>
        </section>
        <section>
          <h2>Dados informados</h2>
          <p>As informações do agendamento ficam na memória da página para compor o resumo. O aplicativo não persiste esses dados nem os envia a uma equipe ou serviço de atendimento. A página de privacidade detalha o funcionamento da navegação e do mapa.</p>
        </section>
        <section>
          <h2>Condições de atendimento</h2>
          <p>As políticas do salão apresentam os combinados sobre horários, cancelamentos, atrasos, acompanhantes e ajustes. O site não processa pagamentos ou aplica multas.</p>
        </section>
        <section>
          <h2>Atualizações</h2>
          <p>O conteúdo pode ser atualizado para refletir mudanças nos serviços, nos canais e no funcionamento do site.</p>
        </section>
        <div className="legal-actions"><TextLink href="/politicas">Consultar as políticas</TextLink><TextLink href="/privacidade">Ler sobre privacidade</TextLink></div>
      </div>
    </PageMotion>
  );
}
