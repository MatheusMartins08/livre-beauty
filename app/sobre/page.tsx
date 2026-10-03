import { PageMotion } from "@/components/page-motion";
import { site } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import {
  BookingCTA,
  ButtonLink,
  PageIntro,
  Photo,
  SectionHeading,
} from "@/components/ui";

export const metadata = pageMetadata(
  "Sobre",
  "Conheça o Livre Beauty: um ateliê de beleza com escuta, técnica e cuidado individual nos Jardins, São Paulo.",
  "/sobre",
);

export default function AboutPage() {
  return (
    <PageMotion>
      <PageIntro
        eyebrow="O ATELIÊ"
        title="A liberdade começa na escuta."
        emphasis="na escuta."
        description="Um espaço para se reconhecer. Um jeito de cuidar que começa com você."
      />
      <div className="container about-opening-photo" data-page-section>
        <div data-page-reveal>
          <Photo
            src="/images/salon-interior-01.jpg"
            alt="Ambiente de um ateliê de beleza iluminado e acolhedor"
            aspect="16 / 8"
            className="min-h-64"
            sizes="100vw"
          />
        </div>
      </div>
      <section className="section container editorial-split" data-page-section>
        <div data-page-reveal>
          <SectionHeading title={site.story.title} />
        </div>
        <div className="editorial-prose space-y-6" data-page-reveal>
          <p>{site.story.description}</p>
          <p>{site.story.second}</p>
          <ButtonLink href="/profissionais" secondary>
            Conhecer a equipe
          </ButtonLink>
        </div>
      </section>
      <section
        className="surface-section about-values"
        data-page-section
        aria-label="O que orienta nosso cuidado"
      >
        <div className="container grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {site.values.map((value, index) => (
            <p
              key={value}
              data-page-reveal
              className="font-[family-name:var(--font-display)] text-3xl leading-tight"
            >
              <span className="fine-print mb-3 block">0{index + 1}</span>
              {value}
            </p>
          ))}
        </div>
      </section>
      <section className="dark-section" data-page-section>
        <div className="section container editorial-split about-experience">
          <div data-page-reveal>
            <Photo
              src="/images/salon-interior-02.jpg"
              alt="Detalhes do espaço de cuidado e beleza"
              aspect="4 / 5"
              parallax
            />
          </div>
          <div data-page-reveal>
            <SectionHeading
              title={site.experience.title}
              description={site.experience.description}
            />
            <ol className="mt-9 space-y-7">
              {site.experience.items.map((item, index) => (
                <li
                  key={item.title}
                  className="grid grid-cols-[2rem_1fr] gap-4 border-t border-[var(--line)] pt-6"
                >
                  <span className="fine-print pt-1">0{index + 1}</span>
                  <div>
                    <h3 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
                      {item.title}
                    </h3>
                    <p className="max-w-[45ch] leading-relaxed">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <BookingCTA />
    </PageMotion>
  );
}
