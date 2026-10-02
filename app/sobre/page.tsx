import { site } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import {
  BookingCTA,
  ButtonLink,
  DemoNote,
  PageIntro,
  Photo,
  SectionHeading,
} from "@/components/ui";

export const metadata = pageMetadata(
  "Sobre",
  "Conheça o conceito Livre Beauty: um ateliê de beleza com escuta, técnica e cuidado individual nos Jardins, São Paulo.",
  "/sobre",
);

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="O ATELIÊ"
        title="A liberdade começa na escuta."
        description="Um espaço para se reconhecer. Um jeito de cuidar que começa com você."
      />
      <div className="container">
        <Photo
          src="/images/salon-interior-01.jpg"
          alt="Ambiente ilustrativo de um ateliê de beleza iluminado e acolhedor"
          aspect="16 / 8"
          className="min-h-64"
          sizes="100vw"
        />
      </div>
      <section className="section container grid gap-8 md:grid-cols-[1fr_1.15fr] md:gap-20">
        <SectionHeading title={site.story.title} />
        <div className="max-w-[60ch] space-y-6 text-[#625D57] leading-relaxed md:pt-2">
          <p>{site.story.description}</p>
          <p>{site.story.second}</p>
          <ButtonLink href="/profissionais" secondary>
            Conhecer a equipe
          </ButtonLink>
        </div>
      </section>
      <section
        className="bg-[#F0ECE5] py-10 md:py-14"
        aria-label="O que orienta nosso cuidado"
      >
        <div className="container grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {site.values.map((value, index) => (
            <p
              key={value}
              className="font-[family-name:var(--font-display)] text-3xl leading-tight"
            >
              <span className="fine-print mb-3 block">0{index + 1}</span>
              {value}
            </p>
          ))}
        </div>
      </section>
      <section className="section container grid items-center gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-24">
        <Photo
          src="/images/salon-interior-02.jpg"
          alt="Detalhes ilustrativos do espaço de cuidado e beleza"
          aspect="4 / 5"
        />
        <div>
          <SectionHeading
            title={site.experience.title}
            description={site.experience.description}
          />
          <ol className="mt-9 space-y-7">
            {site.experience.items.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[2rem_1fr] gap-4 border-t border-[#252422]/15 pt-6"
              >
                <span className="fine-print pt-1">0{index + 1}</span>
                <div>
                  <h3 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
                    {item.title}
                  </h3>
                  <p className="max-w-[45ch] text-[#625D57] leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="container pb-12">
        <DemoNote>
          O Livre Beauty é um conceito de salão fictício. História, equipe,
          localização e fotografias são demonstrativos.
        </DemoNote>
      </div>
      <BookingCTA />
    </>
  );
}
