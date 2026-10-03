import Image from "next/image";
import Link from "next/link";
import { Star } from "@phosphor-icons/react/ssr";
import { site, testimonials } from "@/content/salon";
import {
  homeContent as copy,
  homeFAQs,
  homeServices,
  type EditorialTitle,
} from "@/content/home";
import { pageMetadata } from "@/lib/metadata";
import { DemoChannel } from "@/components/demo-channel";
import { LocationMap } from "@/components/location-map";
import { ActionContent } from "@/components/ui";
import { HomeMotion } from "@/components/home-motion";
import { HomeFAQ } from "@/components/home-faq";
import styles from "./home.module.css";

const heroTitle = `${site.hero.title.opening} ${site.hero.title.emphasis}`;
export const metadata = pageMetadata(
  heroTitle.replace(/\.$/, ""),
  site.description,
  "/",
);

function titleLabel(title: EditorialTitle) {
  return [title.opening, title.leading, title.emphasis]
    .filter(Boolean)
    .join(" ");
}
function TitleText({ title }: { title: EditorialTitle }) {
  return (
    <>
      {title.opening}
      <br />
      {title.leading && `${title.leading} `}
      <em>{title.emphasis}</em>
    </>
  );
}

export default function Home() {
  return (
    <HomeMotion className={styles.home}>
      <section
        className={`hero ${styles.hero}`}
        data-home-hero
        aria-label="Livre Beauty, salão e ateliê de beleza"
      >
        <Image
          src="/images/hero-salon.jpg"
          alt="Retrato editorial com cabelo escuro e luz suave"
          fill
          preload
          sizes="(max-width: 767px) 160svh, calc(100vw - 48px)"
          className={styles.heroImage}
          data-hero-image
        />
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.label} data-hero-copy>
              {site.hero.eyebrow}
            </p>
            <h1 aria-label={heroTitle} data-hero-copy>
              {site.hero.title.opening}
              <br />
              <em>{site.hero.title.emphasis}</em>
            </h1>
            <p className={styles.heroDescription} data-hero-copy>
              {site.hero.description}
            </p>
            <div className={styles.heroActions} data-hero-copy>
              <Link href="/agendamento" className={`action-link ${styles.primary}`}>
                <ActionContent>Agendar horário</ActionContent>
              </Link>
              <Link href="/servicos" className={`action-link ${styles.photoLink}`}>
                <ActionContent>Conhecer serviços</ActionContent>
              </Link>
            </div>
          </div>
        </div>
        <p className={styles.heroCaption}>BEAUTY ATELIÊ · JARDINS, SÃO PAULO</p>
      </section>

      <section
        className={`${styles.section} ${styles.about}`}
        aria-labelledby="sobre-title"
        data-home-section
      >
        <div data-home-reveal>
          <p className={styles.label}>{copy.about.label}</p>
          <h2
            id="sobre-title"
            className={styles.largeTitle}
            aria-label={titleLabel(copy.about.title)}
          >
            <TitleText title={copy.about.title} />
          </h2>
          <Link href="/sobre" className={`action-link ${styles.editorialLink}`}>
            <ActionContent>Nossa história</ActionContent>
          </Link>
        </div>
        <div className={styles.aboutRight}>
          <div className={styles.aboutPhoto} data-home-reveal>
            <Image
              src={copy.about.photo.src}
              alt={copy.about.photo.alt}
              fill
              sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1440px) 46vw, 650px"
              data-home-image
            />
          </div>
          <div className={styles.aboutText} data-home-reveal>
            <p>{copy.about.description}</p>
          </div>
        </div>
      </section>

      <section
        className={styles.manifesto}
        aria-labelledby="manifesto-title"
        data-home-section
      >
        <div className={styles.manifestoPhoto} data-home-parallax>
          <Image
            src={copy.manifesto.photo.src}
            alt={copy.manifesto.photo.alt}
            fill
            sizes="(max-width: 767px) calc(100vw - 24px), calc(100vw - 48px)"
          />
        </div>
        <div className={styles.manifestoContent}>
          <h2
            id="manifesto-title"
            aria-label={titleLabel(copy.manifesto.title)}
            data-home-reveal
          >
            <TitleText title={copy.manifesto.title} />
          </h2>
          <DemoChannel channel="instagram" className={`action-link ${styles.photoLink}`}>
            Encontre inspiração no Instagram
          </DemoChannel>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.services}`}
        aria-labelledby="servicos-title"
        data-home-section
      >
        <div className={styles.centered} data-home-reveal>
          <p className={styles.label}>{copy.services.label}</p>
          <h2
            id="servicos-title"
            className={styles.largeTitle}
            aria-label={titleLabel(copy.services.title)}
          >
            <TitleText title={copy.services.title} />
          </h2>
        </div>
        <div className={styles.serviceGrid}>
          {homeServices.map((service, index) => (
            <Link
              href={`/servicos#${service.slug}`}
              key={service.id}
              className={styles.service}
              data-action-group
              data-home-reveal
            >
              <span className={styles.serviceNumber} aria-hidden="true">
                0{index + 1}
              </span>
              <h3>
                {service.category}
              </h3>
              <p>{service.summary}</p>
              <span className={`action-link ${styles.serviceMore}`}><ActionContent>Ver serviço</ActionContent></span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className={styles.experts}
        aria-labelledby="equipe-title"
        data-home-section
      >
        <div className={styles.expertsInner}>
          <div className={styles.expertsCopy} data-home-reveal>
            <p className={styles.label}>{copy.experts.label}</p>
            <h2
              id="equipe-title"
              className={styles.largeTitle}
              aria-label={titleLabel(copy.experts.title)}
            >
              <TitleText title={copy.experts.title} />
            </h2>
            <p className={styles.expertsDescription}>
              {copy.experts.description}
            </p>
            <Link href="/profissionais" className={`action-link ${styles.lightButton}`}>
              <ActionContent>Conhecer a equipe</ActionContent>
            </Link>
          </div>
          <figure className={styles.expertsFigure} data-home-reveal>
            <div className={styles.expertsPhoto}>
              <Image
                src={copy.experts.photo.src}
                alt={copy.experts.photo.alt}
                fill
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1440px) 40vw, 560px"
                data-home-image
              />
            </div>
          </figure>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.faq}`}
        aria-labelledby="faq-title"
        data-home-section
      >
        <div data-home-reveal>
          <p className={styles.label}>{copy.faq.label}</p>
          <h2 id="faq-title" className={styles.sectionTitle}>
            {copy.faq.title}
          </h2>
        </div>
        <div data-home-reveal>
          <HomeFAQ items={homeFAQs} />
        </div>
      </section>

      <section
        className={styles.reviews}
        aria-labelledby="avaliacoes-title"
        data-home-section
      >
        <div className={styles.section}>
          <div className={styles.reviewsHeading} data-home-reveal>
            <div>
              <p className={styles.label}>{copy.reviews.label}</p>
              <h2 id="avaliacoes-title" className={styles.largeTitle}>
                {copy.reviews.title}
              </h2>
            </div>
          </div>
          <div className={styles.reviewGrid}>
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className={styles.review}
                data-home-reveal
              >
                <div
                  className={styles.stars}
                  aria-label="Avaliação: 5 de 5 estrelas"
                  role="img"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={16}
                      weight="fill"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption>
                  <span>{testimonial.name}</span>
                  <span>{testimonial.service}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.visit}`}
        aria-labelledby="visite-title"
        data-home-section
      >
        <div className={styles.visitCopy} data-home-reveal>
          <p className={styles.label}>{copy.visit.label}</p>
          <h2 id="visite-title" className={styles.largeTitle}>
            {copy.visit.title}
          </h2>
          <dl className={styles.visitFacts}>
            <div>
              <dt>Nosso lugar</dt>
              <dd>{site.address}</dd>
            </div>
            <div>
              <dt>Seu tempo</dt>
              <dd>{site.hours}</dd>
            </div>
          </dl>
          <div className={styles.visitChannels}>
            <DemoChannel channel="instagram" className={`action-link ${styles.editorialLink}`} />
            <DemoChannel channel="whatsapp" className={`action-link ${styles.editorialLink}`} />
            <DemoChannel channel="phone" className={`action-link ${styles.editorialLink}`} />
          </div>
        </div>
        <div className={styles.map} data-home-reveal>
          <LocationMap />
        </div>
      </section>
    </HomeMotion>
  );
}
