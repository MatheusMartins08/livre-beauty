import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, InstagramLogo, Star } from "@phosphor-icons/react/ssr";
import {
  site,
  services,
  stylists,
  testimonials,
  gallery,
  faqs,
} from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import {
  ButtonLink,
  SectionHeading,
  Photo,
  ServiceCard,
  StylistCard,
  BookingCTA,
  DemoNote,
} from "@/components/ui";
import { BeforeAfterSlider } from "@/components/before-after";
import { FAQAccordion } from "@/components/faq-accordion";
import { DemoChannel } from "@/components/demo-channel";
import { LocationMap } from "@/components/contact";

const heroTitle = `${site.hero.title.opening} ${site.hero.title.emphasis}`;

export const metadata = pageMetadata(
  heroTitle.replace(/\.$/, ""),
  site.description,
  "/",
);

export default function Home() {
  return (
    <>
      <section
        className="hero"
        aria-label="Livre Beauty, salão e ateliê de beleza"
      >
        <Image
          src="/images/hero-salon.jpg"
          alt="Retrato editorial ilustrativo com cabelo escuro e luz suave"
          fill
          preload
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-content container">
          <div className="hero-copy">
            <p className="eyebrow">{site.hero.eyebrow}</p>
            <h1 aria-label={heroTitle}>
              {site.hero.title.opening}
              <br />
              <em>{site.hero.title.emphasis}</em>
            </h1>
            <p className="hero-description">{site.hero.description}</p>
            <div className="hero-actions">
              <ButtonLink href="/agendamento">Agendar horário</ButtonLink>
              <Link href="/servicos" className="text-link">
                Conhecer serviços
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <p className="hero-location">ATELIÊ DE BELEZA · JARDINS, SÃO PAULO</p>
      </section>
      <div className="values-strip">
        <div className="container">
          {site.values.map((value) => (
            <p key={value}>{value}</p>
          ))}
        </div>
      </div>
      <section className="section container story-grid" data-reveal>
        <div className="story-photo-wrap">
          <Photo
            src="/images/salon-interior-01.jpg"
            alt="Ambiente ilustrativo de salão, com materiais naturais e luz acolhedora"
          />
          <div className="story-mark">
            beleza
            <br />
            sem fórmulas.
          </div>
        </div>
        <div className="story-copy">
          <SectionHeading eyebrow="A ESSÊNCIA LIVRE" title={site.story.title} />
          <p>{site.story.description}</p>
          <p>{site.story.second}</p>
          <Link href="/sobre" className="text-link">
            Conheça nossa história
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="section services-section">
        <div className="container">
          <div className="section-top">
            <SectionHeading
              title="Seu cabelo. Novas possibilidades."
              description="Técnica e sensibilidade para traduzir o que faz você se sentir bem."
            />
            <Link href="/servicos" className="text-link">
              Todos os serviços
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="services-grid" data-reveal>
            {services.slice(0, 4).map((service) => (
              <ServiceCard service={service} key={service.id} />
            ))}
          </div>
          <DemoNote>
            Valores demonstrativos. O orçamento é personalizado após a avaliação
            dos fios.
          </DemoNote>
        </div>
      </section>
      <section className="experience-section">
        <Photo
          src="/images/salon-interior-02.jpg"
          alt="Arquitetura ilustrativa de salão com espaço confortável e iluminação suave"
          aspect="16 / 9"
          sizes="100vw"
        />
        <div className="container">
          <div className="experience-copy" data-reveal>
            <h2>{site.experience.title}</h2>
            <p>{site.experience.description}</p>
            <Link href="/sobre" className="text-link">
              Viva a experiência Livre
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <div className="container experience-principles">
        {site.experience.items.map((item) => (
          <div key={item.title} data-reveal>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
      <section className="section container results-grid" data-reveal>
        <div className="results-copy">
          <SectionHeading title="Pequenos detalhes. Um novo olhar." />
          <p>
            Forma, luz e movimento abrem novas possibilidades. Explore duas
            referências da mesma sessão e descubra a diferença no acabamento.
          </p>
          <Link href="/galeria" className="text-link">
            Explore nossas referências
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <BeforeAfterSlider />
      </section>
      <section className="section team-section">
        <div className="container">
          <div className="section-top">
            <SectionHeading
              eyebrow="QUEM CUIDA DE VOCÊ"
              title="Talento com um toque humano."
              description="Diferentes olhares, a mesma intenção: encontrar a beleza que faz sentido para você."
            />
            <Link href="/profissionais" className="text-link">
              Conhecer a equipe
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="team-grid" data-reveal>
            {stylists.map((stylist) => (
              <StylistCard key={stylist.id} stylist={stylist} />
            ))}
          </div>
          <DemoNote>
            Equipe fictícia e retratos ilustrativos, apresentados para
            demonstrar a experiência do salão.
          </DemoNote>
        </div>
      </section>
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-heading">
            <h2>O cuidado deixa boas histórias.</h2>
            <p className="fine-print">
              Relatos fictícios para apresentar a proposta do Livre.
            </p>
          </div>
          <div className="testimonials-grid" data-reveal>
            {testimonials.map((item) => (
              <figure className="testimonial" key={item.name}>
                <div
                  className="testimonial-stars"
                  role="img"
                  aria-label="Avaliação ilustrativa de cinco estrelas"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={12}
                      weight="fill"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote>“{item.quote}”</blockquote>
                <figcaption>
                  <cite>
                    {item.name}
                    <span>{item.service} · Relato demonstrativo</span>
                  </cite>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-top">
          <SectionHeading
            title="Um olhar que continua."
            description="Inspirações, texturas e os detalhes que nos movem."
          />
          <DemoChannel channel="instagram" className="text-link">
            Seguir no Instagram
          </DemoChannel>
        </div>
        <div className="instagram-grid" data-reveal>
          {gallery.slice(0, 6).map((item) => (
            <div className="instagram-tile" key={item.id}>
              <DemoChannel
                channel="instagram"
                className="instagram-photo-button"
              >
                <span className="instagram-photo">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 1023px) 33vw, 17vw"
                  />
                </span>
                <span>
                  <InstagramLogo size={28} weight="light" aria-hidden="true" />
                  <span className="sr-only">Ver apresentação do Instagram</span>
                </span>
              </DemoChannel>
            </div>
          ))}
        </div>
        <DemoNote>
          Seleção editorial de imagens ilustrativas. Sem conexão com um perfil
          real.
        </DemoNote>
      </section>
      <section className="section container faq-home-grid" data-reveal>
        <div>
          <SectionHeading
            title="Tudo começa com clareza."
            description="As respostas para chegar com tranquilidade e aproveitar seu tempo."
          />
          <Link href="/faq" className="text-link">
            Todas as perguntas
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <FAQAccordion items={[faqs[0], faqs[1], faqs[3], faqs[4]]} />
      </section>
      <section className="section container location-home" data-reveal>
        <div>
          <p className="eyebrow">UM RESPIRO NA CIDADE</p>
          <h2>
            Nos encontre
            <br />
            nos Jardins.
          </h2>
          <p className="section-description">
            Um ateliê de portas abertas para as suas possibilidades, no coração
            de São Paulo.
          </p>
          <dl className="location-facts">
            <div>
              <dt>Onde</dt>
              <dd>
                {site.location}
                <br />
                Endereço ilustrativo
              </dd>
            </div>
            <div>
              <dt>Quando</dt>
              <dd>
                Terça a sábado
                <br />
                9h às 19h
              </dd>
            </div>
          </dl>
          <Link href="/contato" className="text-link">
            Vamos conversar
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <LocationMap />
      </section>
      <BookingCTA />
    </>
  );
}
