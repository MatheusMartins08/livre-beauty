import { PageMotion } from "@/components/page-motion";
import Link from "next/link";
import { site } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { ContactForm, LocationMap } from "@/components/contact";
import { DemoChannel } from "@/components/demo-channel";
import {
  ButtonLink,
  DemoNote,
  PageIntro,
  SectionHeading,
} from "@/components/ui";

export const metadata = pageMetadata(
  "Contato",
  "Conheça os canais demonstrativos de contato, horários e localização ilustrativa do Livre Beauty na região dos Jardins, São Paulo.",
  "/contato",
);

export default function ContactPage() {
  return (
    <PageMotion>
      <PageIntro
        eyebrow="CONTATO"
        title="Vamos conversar."
        emphasis="conversar."
        description="Sobre uma ideia, uma dúvida ou seu próximo cuidado. Toda boa experiência começa com uma conversa."
      />
      <section
        className="container grid items-start gap-12 pb-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:pb-24"
        aria-label="Entre em contato"
      >
        <div>
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-4xl">
            Um primeiro encontro.
          </h2>
          <p className="mb-7 max-w-[40ch] text-[var(--text-body)] leading-relaxed">
            Conheça nossos canais ou experimente o formulário. Para escolher um
            cuidado e um horário, vá direto ao agendamento.
          </p>
          <ButtonLink href="/agendamento">Agendar horário</ButtonLink>
          <div className="mt-10 flex flex-col items-start gap-4">
            <DemoChannel channel="whatsapp" className="text-link">
              Conversar pelo WhatsApp
            </DemoChannel>
            <DemoChannel channel="phone" className="text-link">
              Ligar para a recepção
            </DemoChannel>
            <DemoChannel channel="email" className="text-link">
              Enviar um e-mail
            </DemoChannel>
            <DemoChannel channel="instagram" className="text-link">
              Conhecer nosso Instagram
            </DemoChannel>
          </div>
          <div className="mt-7 max-w-[45ch]">
            <DemoNote>
              Canais demonstrativos. Nenhuma ligação, mensagem ou acesso a
              perfil externo é iniciado.
            </DemoNote>
          </div>
        </div>
        <div className="border-t border-[var(--line)] pt-7 lg:border-t-0 lg:border-l lg:pl-12 lg:pt-0">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-3xl">
            Deixe sua mensagem.
          </h2>
          <p className="mb-7 text-sm text-[var(--text-body)] leading-relaxed">
            Este formulário é uma simulação. Os dados ficam apenas nesta página
            e a mensagem não é enviada.
          </p>
          <ContactForm />
        </div>
      </section>
      <section className="section surface-section">
        <div className="container">
          <SectionHeading
            title="Um ateliê no coração dos Jardins."
            description="Um espaço pensado para reservar um tempo só seu."
          />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.7fr] lg:items-center lg:gap-16">
            <LocationMap />
            <div>
              <dl className="space-y-7">
                <div>
                  <dt className="fine-print mb-2">Localização ilustrativa</dt>
                  <dd className="max-w-[35ch] leading-relaxed">
                    {site.address}
                  </dd>
                </div>
                <div>
                  <dt className="fine-print mb-2">Horários da proposta</dt>
                  <dd>{site.hours}</dd>
                </div>
                <div>
                  <dt className="fine-print mb-2">Estacionamento</dt>
                  <dd className="text-sm text-[var(--text-body)] leading-relaxed">
                    {site.parking}
                  </dd>
                </div>
              </dl>
              <div className="mt-7">
                <DemoNote>{site.addressNote}</DemoNote>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container py-12 md:py-16">
        <p className="max-w-[60ch] text-[var(--text-body)] leading-relaxed">
          Antes de agendar, você também pode consultar as{" "}
          <Link href="/faq" className="text-link">
            dúvidas frequentes
          </Link>{" "}
          e as{" "}
          <Link href="/politicas" className="text-link">
            políticas do salão
          </Link>
          .
        </p>
      </section>
    </PageMotion>
  );
}
