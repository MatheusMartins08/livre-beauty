import { PageMotion } from "@/components/page-motion";
import { pageMetadata } from "@/lib/metadata";
import { ButtonLink, PageIntro } from "@/components/ui";

export const metadata = pageMetadata("Privacidade", "Saiba como os dados do agendamento, a navegação e o mapa são tratados no Livre Beauty.", "/privacidade");

export default function PrivacyPage() {
  return (
    <PageMotion animate={false}>
      <PageIntro eyebrow="PRIVACIDADE" title="Sua privacidade, com clareza." emphasis="com clareza." description="Como as informações são utilizadas durante sua navegação." />
      <div className="container legal-prose">
        <section>
          <h2>Dados do agendamento</h2>
          <p>As informações digitadas no agendamento são utilizadas para compor o resumo da sua escolha. Esses dados permanecem somente na memória da página: não são enviados para uma equipe ou serviço externo, nem gravados em banco de dados, armazenamento local ou cookies.</p>
          <p>Ao atualizar ou sair da página, os dados da seleção são descartados. Recursos de preenchimento automático do navegador seguem suas próprias configurações.</p>
        </section>
        <section>
          <h2>Cookies e medição</h2>
          <p>O site não configura cookies de publicidade, análise de audiência ou identificação de clientes e não inclui ferramentas de rastreamento de marketing. O navegador e o ambiente técnico podem usar recursos necessários para carregar e exibir as páginas.</p>
        </section>
        <section>
          <h2>Navegação e conteúdo</h2>
          <p>Fotografias e fontes são servidas com o próprio site. Ao navegar, solicitações técnicas carregam páginas e arquivos. O processamento necessário para entregar esses arquivos depende da configuração do ambiente de hospedagem.</p>
          <p>As escolhas de serviço e profissional podem aparecer na URL do agendamento para preencher sua seleção. Dados pessoais não são inseridos nessa URL.</p>
        </section>
        <section>
          <h2>Canais e pagamentos</h2>
          <p>Os acessos aos canais apresentam informações dentro do próprio site. O aplicativo não transmite mensagens, processa pagamentos ou solicita dados de cartão.</p>
        </section>
        <section>
          <h2>Mapa opcional</h2>
          <p>O mapa da região dos Jardins só é carregado ao escolher Explorar a região na seção de localização da página inicial. Essa ação solicita conteúdo externo diretamente ao OpenStreetMap. O link Como chegar à região também abre o site desse provedor.</p>
          <p>O mapa não recebe os campos do agendamento. Você pode navegar pelo site sem carregá-lo. O funcionamento desse conteúdo externo depende do próprio provedor.</p>
        </section>
        <section>
          <h2>Atualizações</h2>
          <p>Esta página será atualizada quando houver mudanças no tratamento das informações ou nos serviços utilizados pelo site.</p>
        </section>
        <div className="legal-actions"><ButtonLink href="/termos">Ler os termos de uso</ButtonLink></div>
      </div>
    </PageMotion>
  );
}
