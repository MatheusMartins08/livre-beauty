import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import { DemoNote, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Privacidade",
  "Entenda como funciona esta demonstração do Livre Beauty: sem envio ou armazenamento de formulários, pagamentos ou rastreamento de marketing.",
  "/privacidade",
);

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="PRIVACIDADE"
        title="Sua privacidade, com clareza."
        description="Como os dados funcionam nesta experiência demonstrativa."
      />
      <div className="container grid items-start gap-10 pb-16 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20 lg:pb-24">
        <aside className="max-w-[35ch]">
          <DemoNote>
            O Livre Beauty é uma marca fictícia. Esta página descreve o
            funcionamento atual da demonstração, sem integrações de atendimento.
          </DemoNote>
        </aside>
        <div className="space-y-9 text-[#625D57] leading-relaxed">
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Formulários e agendamento
            </h2>
            <p>
              As informações digitadas no contato e no agendamento são usadas
              apenas para mostrar a interação na página. O site não envia esses
              dados para uma equipe, servidor de atendimento ou serviço externo
              e não os grava em banco de dados, armazenamento local ou cookies.
            </p>
            <p className="mt-4">
              Ao atualizar ou sair da página, o estado da simulação é
              descartado. Recursos de preenchimento automático do navegador
              seguem suas próprias configurações. Para explorar a demonstração,
              prefira dados de exemplo.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Cookies e medição
            </h2>
            <p>
              Esta demonstração não configura cookies de publicidade, análise de
              audiência ou identificação de clientes e não inclui ferramentas de
              rastreamento de marketing. O navegador e o ambiente técnico podem
              usar recursos necessários para carregar e exibir as páginas.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Navegação e conteúdo
            </h2>
            <p>
              Fotografias e fontes são servidas com o próprio site. Ao navegar,
              solicitações técnicas carregam páginas e arquivos. Informações que
              o ambiente de hospedagem possa processar para entregar esses
              arquivos dependem da configuração desse ambiente.
            </p>
            <p className="mt-4">
              As escolhas de serviço e profissional podem aparecer na URL do
              agendamento para preencher a simulação. Dados pessoais de
              formulário não são inseridos nessa URL.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Contato e pagamentos
            </h2>
            <p>
              Os canais de WhatsApp, telefone, e-mail e Instagram são
              demonstrativos. Não há processamento de pagamento, solicitação de
              cartão ou transmissão de mensagens nesta versão.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Mapa opcional
            </h2>
            <p>
              O mapa da região dos Jardins só é carregado ao escolher Explorar a
              região na página de contato. Essa ação solicita um mapa externo
              diretamente ao OpenStreetMap; o navegador se comunica com esse
              provedor para exibir o conteúdo. O link de acesso à região também
              abre o site do OpenStreetMap.
            </p>
            <p className="mt-4">
              O mapa não recebe os campos dos formulários. Você pode navegar e
              experimentar o site sem carregá-lo. O funcionamento do conteúdo
              externo depende do próprio provedor.
            </p>
          </section>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[#252422]">
              Se a experiência mudar
            </h2>
            <p>
              A ativação de reservas reais, formulários, ferramentas de medição
              ou canais externos exige que esta página seja atualizada para
              descrever os dados, finalidades e serviços efetivamente
              utilizados.
            </p>
          </section>
          <p className="border-t border-[#252422]/15 pt-7 text-sm">
            Leia também os{" "}
            <Link href="/termos" className="text-link">
              termos de uso
            </Link>{" "}
            desta demonstração.
          </p>
        </div>
      </div>
    </>
  );
}
