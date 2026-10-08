import Image from "next/image";
import Link from "next/link";
import { Star } from "@phosphor-icons/react/ssr";
import { site } from "@/content/salon";
import { homeServices as defaultHomeServices, type EditorialTitle } from "@/content/home";
import { pageMetadata } from "@/lib/metadata";
import { formatWeeklyHours } from "@/lib/opening-hours";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import { getPublicSite } from "@/lib/supabase/site";
import { DemoChannel } from "@/components/demo-channel";
import { LocationMap } from "@/components/location-map";
import { ActionContent, ButtonLink } from "@/components/ui";
import { HomeMotion } from "@/components/home-motion";
import { HomeFAQ } from "@/components/home-faq";
import styles from "./home.module.css";

export async function generateMetadata() {
  const { content } = await getPublicSite();
  return pageMetadata(
    titleLabel(content.hero.title).replace(/\.$/, ""),
    site.description,
    "/",
  );
}

/** Inline framing only when the owner chose one; otherwise the CSS decides. */
function framing(position: string) {
  return position ? { objectPosition: position } : undefined;
}

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

export default async function Home() {
  const [{ content: copy, openingPeriods }, catalog] = await Promise.all([
    getPublicSite(),
    // The homepage stays available with its original cards if the catalog fails.
    getPublicCatalog().catch(() => null),
  ]);
  const homeServices = catalog
    ? catalog.services.map((service) => ({
        id: service.id,
        slug: service.slug,
        category: service.category,
        summary: service.summary || service.description,
        photo: service.homeImage
          ? {
              src: service.homeImage,
              alt: service.homeImageAlt,
              position: service.homeImagePosition,
            }
          : {
              src: service.image,
              alt: `Fotografia de ${service.category.toLocaleLowerCase("pt-BR")}`,
              position: service.imagePosition,
            },
      }))
    : defaultHomeServices;
  return (
    <HomeMotion className={styles.home}>
      <section
        className={`hero ${styles.hero}`}
        data-home-hero
        aria-label="Livre Beauty, salão e ateliê de beleza"
      >
        <Image
          src={copy.hero.photo.src}
          alt={copy.hero.photo.alt}
          fill
          preload
          quality={90}
          sizes="(max-width: 767px) 160svh, calc(100vw - 48px)"
          className={styles.heroImage}
          style={framing(copy.hero.photo.position)}
          data-hero-image
        />
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.label} data-hero-copy>
              {copy.hero.eyebrow}
            </p>
            <h1 aria-label={titleLabel(copy.hero.title)} data-hero-copy>
              <TitleText title={copy.hero.title} />
            </h1>
            <p className={styles.heroDescription} data-hero-copy>
              {copy.hero.description}
            </p>
            <div className={styles.heroActions} data-hero-copy>
              <ButtonLink href="/agendamento" light>
                Agendar horário
              </ButtonLink>
              <Link href="/servicos" className={`action-link ${styles.photoLink}`}>
                <ActionContent>Conhecer serviços</ActionContent>
              </Link>
            </div>
          </div>
        </div>
        {copy.hero.caption && (
          <p className={styles.heroCaption}>{copy.hero.caption}</p>
        )}
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
              style={framing(copy.about.photo.position)}
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
            style={framing(copy.manifesto.photo.position)}
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
          <DemoChannel channel="instagram" className={styles.photoLink}>
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
          {homeServices.map((service) => (
            <Link
              href={`/servicos#${service.slug}`}
              key={service.id}
              className={styles.service}
              data-action-group
              data-home-reveal
            >
              <div className={styles.servicePhoto}>
                <Image
                  src={service.photo.src}
                  alt={service.photo.alt}
                  style={framing(service.photo.position ?? "")}
                  fill
                  sizes="(max-width: 767px) 80px, (max-width: 1023px) calc((100vw - 96px) / 2), (max-width: 1512px) calc((100vw - 176px) / 3), 445px"
                />
              </div>
              <div className={styles.serviceCopy}>
                <h3>{service.category}</h3>
                <p>{service.summary}</p>
                <span className={`action-link ${styles.serviceMore}`}>
                  <ActionContent>Ver serviço</ActionContent>
                </span>
              </div>
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
            <ButtonLink href="/profissionais" light secondary>
              Conhecer a equipe
            </ButtonLink>
          </div>
          <figure className={styles.expertsFigure} data-home-reveal>
            <div className={styles.expertsPhoto}>
              <Image
                src={copy.experts.photo.src}
                alt={copy.experts.photo.alt}
                fill
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1440px) 40vw, 560px"
                style={framing(copy.experts.photo.position)}
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
        <div className={styles.faqHeading} data-home-reveal>
          <h2 id="faq-title" className={styles.faqTitle}>
            {copy.faq.title}
          </h2>
          <p>{copy.faq.description}</p>
        </div>
        <div className={styles.faqGroups}>
          {copy.faq.groups.map((group) => (
            <div className={styles.faqGroup} key={group.title} data-home-reveal>
              <h3 className={styles.faqGroupTitle}>{group.title}</h3>
              <HomeFAQ items={group.items} />
            </div>
          ))}
        </div>
        <div className={styles.faqHelp} data-home-reveal>
          <p>Ainda ficou alguma dúvida? A gente conversa com você.</p>
          <DemoChannel channel="whatsapp" className={styles.editorialLink}>Conversar com a equipe</DemoChannel>
        </div>
      </section>

      {copy.reviews.items.length > 0 && (
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
              {copy.reviews.items.map((testimonial, index) => (
                <figure
                  key={`${testimonial.name}-${index}`}
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
      )}

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
              <dd>{copy.contact.address}</dd>
            </div>
            <div>
              <dt>Seu tempo</dt>
              <dd>{formatWeeklyHours(openingPeriods)}</dd>
            </div>
          </dl>
          <div className={styles.visitChannels}>
            <DemoChannel channel="instagram" className={styles.editorialLink} />
            <DemoChannel channel="whatsapp" className={styles.editorialLink} />
            <DemoChannel channel="phone" className={styles.editorialLink} />
          </div>
        </div>
        <div className={styles.map} data-home-reveal>
          <LocationMap />
        </div>
      </section>
    </HomeMotion>
  );
}
