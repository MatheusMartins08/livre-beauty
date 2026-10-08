import { PageMotion } from "@/components/page-motion";
import { pageMetadata } from "@/lib/metadata";
import { PageIntro, TextLink } from "@/components/ui";

export const metadata = pageMetadata(
  "Privacidade",
  "Saiba como os dados do agendamento, a navegação e o mapa são tratados no Livre Beauty.",
  "/privacidade",
);

export default function PrivacyPage() {
  return (
    <PageMotion animate={false}>
      <PageIntro
        eyebrow="PRIVACIDADE"
        title="Sua privacidade, com clareza."
        emphasis="com clareza."
        description="Como as informações são utilizadas durante sua navegação."
      />
      <div className="container legal-prose">
        <section>
          <h2>Dados do agendamento</h2>
          <p>
            Ao confirmar um agendamento, seu nome, telefone e e-mail são
            enviados ao servidor e registrados no banco de dados Supabase junto
            com o serviço, profissional, horário e valor inicial. A equipe
            autorizada utiliza essas informações para organizar o atendimento e
            consultar seu histórico.
          </p>
          <p>
            As escolhas ainda não confirmadas ficam na memória da página.
            Atualizar ou sair da página descarta esse preenchimento, mas não
            cancela um agendamento já confirmado. O preenchimento automático do
            navegador segue suas próprias configurações.
          </p>
          <p>
            O acesso aos cadastros e atendimentos exige uma conta autorizada da
            equipe. A consulta pública de disponibilidade informa apenas os
            intervalos ocupados dos profissionais, sem nomes ou contatos de
            clientes. Para solicitar correção ou exclusão de seus dados, entre
            em contato com o ateliê.
          </p>
        </section>
        <section>
          <h2>Cookies e medição</h2>
          <p>
            O acesso ao painel utiliza cookies de sessão do Supabase Auth para
            manter a equipe autenticada. O agendamento público não exige uma
            conta de cliente. O site não inclui ferramentas de publicidade ou
            rastreamento de marketing.
          </p>
        </section>
        <section>
          <h2>Navegação e conteúdo</h2>
          <p>
            Fotografias e fontes são servidas com o próprio site. Ao navegar,
            solicitações técnicas carregam páginas e arquivos. O processamento
            necessário para entregar esses arquivos depende da configuração do
            ambiente de hospedagem.
          </p>
          <p>
            As escolhas de serviço e profissional podem aparecer na URL do
            agendamento para preencher sua seleção. Dados pessoais não são
            inseridos nessa URL.
          </p>
        </section>
        <section>
          <h2>Canais e pagamentos</h2>
          <p>
            Na confirmação do agendamento, Enviar pelo WhatsApp abre esse
            serviço externo com uma mensagem pronta contendo seu nome e os
            detalhes do atendimento. Ao escolher essa ação, essas informações
            são incluídas no link aberto no WhatsApp. Você pode revisar a
            mensagem antes de enviá-la. O envio depende da sua ação no WhatsApp;
            o site não envia mensagens automaticamente.
          </p>
          <p>
            Os demais acessos aos canais apresentam informações dentro do
            próprio site. O aplicativo não processa pagamentos ou solicita
            dados de cartão.
          </p>
        </section>
        <section>
          <h2>Mapa opcional</h2>
          <p>
            O mapa da região dos Jardins só é carregado ao escolher Explorar a
            região na seção de localização da página inicial. Essa ação solicita
            conteúdo externo diretamente ao OpenStreetMap. O link Como chegar à
            região também abre o site desse provedor.
          </p>
          <p>
            O mapa não recebe os campos do agendamento. Você pode navegar pelo
            site sem carregá-lo. O funcionamento desse conteúdo externo depende
            do próprio provedor.
          </p>
        </section>
        <section>
          <h2>Atualizações</h2>
          <p>
            Esta página será atualizada quando houver mudanças no tratamento das
            informações ou nos serviços utilizados pelo site.
          </p>
        </section>
        <div className="legal-actions">
          <TextLink href="/termos">Ler os termos de uso</TextLink>
        </div>
      </div>
    </PageMotion>
  );
}
