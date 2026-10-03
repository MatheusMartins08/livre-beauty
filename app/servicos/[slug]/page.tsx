import { PageMotion } from "@/components/page-motion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { gallery, services, stylists } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { bookingHref, getService, priceLabel } from "@/lib/utils";
import { GalleryGrid } from "@/components/gallery-grid";
import {
  BookingCTA,
  ButtonLink,
  DemoNote,
  PageIntro,
  Photo,
  SectionHeading,
} from "@/components/ui";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  return pageMetadata(
    service.name,
    service.description,
    `/servicos/${service.slug}`,
  );
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const compatibleStylists = stylists.filter((stylist) =>
    stylist.serviceIds.includes(service.id),
  );
  const references = gallery.filter(
    (item) => item.category === service.category,
  );

  return (
    <PageMotion>
      <PageIntro
        eyebrow={service.category.toLocaleUpperCase("pt-BR")}
        title={service.name}
        description={service.description}
      >
        <Link href="/servicos" className="text-link mt-6 inline-flex">
          Ver todos os serviços
        </Link>
      </PageIntro>
      <section
        className="container detail-intro editorial-split"
        data-page-section
        aria-label="Sobre este cuidado"
      >
        <div data-page-reveal>
          <Photo
            src={service.image}
            alt={`Referência ilustrativa de ${service.category.toLocaleLowerCase("pt-BR")}`}
            aspect="4 / 5"
          />
        </div>
        <div className="detail-copy" data-page-reveal>
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-4xl leading-[1.1] md:text-5xl">
            Feito para os seus fios.
          </h2>
          <p className="max-w-[55ch] text-[var(--text-body)] leading-relaxed">
            {service.detail}
          </p>
          <dl className="my-8 grid grid-cols-2 gap-5 border-y border-[var(--line)] py-6">
            <div>
              <dt className="fine-print mb-2">Tempo reservado</dt>
              <dd>{service.duration} minutos</dd>
            </div>
            <div>
              <dt className="fine-print mb-2">Investimento</dt>
              <dd>{priceLabel(service.price)}</dd>
            </div>
          </dl>
          <h3 className="mb-4 font-[family-name:var(--font-display)] text-2xl">
            Antes e depois do cuidado
          </h3>
          <ul className="mb-8 space-y-3 pl-5 text-[var(--text-body)] leading-relaxed list-disc marker:text-[var(--accent)]">
            {service.care.map((care) => (
              <li key={care}>{care}</li>
            ))}
          </ul>
          <ButtonLink href={bookingHref(service.slug)}>
            Agendar este cuidado
          </ButtonLink>
          <div className="mt-6">
            <DemoNote>
              Valor e duração demonstrativos. A avaliação dos fios define a
              proposta de atendimento antes de começar.
            </DemoNote>
          </div>
        </div>
      </section>
      <section className="section surface-section" data-page-section>
        <div className="container">
          <SectionHeading
            title="Encontre quem cuida de você."
            description="Conheça os olhares e as especialidades por trás deste cuidado."
          />
          <div className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {compatibleStylists.map((stylist) => (
              <article
                key={stylist.id}
                data-page-reveal
                className="compatible-stylist"
              >
                <Link
                  href={`/profissionais/${stylist.slug}`}
                  aria-label={`Conhecer ${stylist.name}`}
                  className="compatible-stylist-photo"
                >
                  <Photo
                    src={stylist.image}
                    alt={`Retrato ilustrativo do perfil fictício de ${stylist.name}`}
                    aspect="3 / 4"
                    sizes="(max-width: 767px) 100px, 160px"
                  />
                </Link>
                <div className="min-w-0">
                  <h3 className="mb-1 font-[family-name:var(--font-display)] text-3xl">
                    <Link href={`/profissionais/${stylist.slug}`}>
                      {stylist.name}
                    </Link>
                  </h3>
                  <p className="fine-print mb-4">{stylist.role}</p>
                  <Link
                    href={bookingHref(service.slug, stylist.slug)}
                    className="text-link"
                  >
                    Agendar com {stylist.name.split(" ")[0]}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {references.length > 0 && (
        <section className="section container">
          <SectionHeading title="Para inspirar sua próxima escolha." />
          <div className="mt-10">
            <GalleryGrid items={references} filters={false} />
          </div>
          <div className="mt-7">
            <DemoNote>
              Referências editoriais ilustrativas. As fotografias não
              representam trabalhos executados pela equipe fictícia, nem
              prometem um resultado específico.
            </DemoNote>
          </div>
        </section>
      )}
      <BookingCTA title="Seu jeito merece um cuidado seu." />
    </PageMotion>
  );
}
