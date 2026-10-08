import { PageMotion } from "@/components/page-motion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import { pageMetadata } from "@/lib/metadata";
import { bookingHref, priceLabel } from "@/lib/utils";
import {
  ActionContent,
  BookingCTA,
  ButtonLink,
  buttonClassName,
  PageIntro,
  Photo,
  SectionHeading,
} from "@/components/ui";

type StylistPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StylistPageProps) {
  const { slug } = await params;
  const { stylists } = await getPublicCatalog();
  const stylist = stylists.find((item) => item.slug === slug);
  if (!stylist) notFound();
  return pageMetadata(
    stylist.name,
    stylist.description,
    `/profissionais/${stylist.slug}`,
  );
}

export default async function StylistPage({ params }: StylistPageProps) {
  const { slug } = await params;
  const { services, stylists, bookingSettings } = await getPublicCatalog();
  const stylist = stylists.find((item) => item.slug === slug);
  if (!stylist) notFound();
  const firstName = stylist.name.split(" ")[0];
  const selectedServices = services.filter((service) =>
    stylist.serviceIds.includes(service.id),
  );

  return (
    <PageMotion>
      <PageIntro
        eyebrow="NOSSA EQUIPE"
        title={stylist.name}
        description={stylist.role}
      >
        <Link href="/profissionais" className="action-link mt-6">
          <ActionContent>Conhecer toda a equipe</ActionContent>
        </Link>
      </PageIntro>
      <section
        className="container detail-intro editorial-split profile-intro"
        data-page-section
        aria-label={`Conheça ${stylist.name}`}
      >
        <div data-page-reveal>
          <Photo
            src={stylist.image}
            alt={`Retrato de ${stylist.name}`}
            aspect="3 / 4"
          />
        </div>
        <div className="detail-copy" data-page-reveal>
          <p className="mb-7 max-w-[34ch] font-[family-name:var(--font-display)] text-3xl leading-[1.2] md:text-[2.6rem]">
            {stylist.description}
          </p>
          <p className="max-w-[55ch] text-[var(--text-body)] leading-relaxed">
            {stylist.biography}
          </p>
          <dl className="my-8 border-y border-[var(--line)] py-6">
            <div className="mb-5">
              <dt className="fine-print mb-2">Experiência</dt>
              <dd>{stylist.experience} anos</dd>
            </div>
            <div>
              <dt className="fine-print mb-2">Especialidades</dt>
              <dd className="leading-relaxed">
                {stylist.specialties.join(" · ")}
              </dd>
            </div>
          </dl>
          <ButtonLink href={bookingHref(undefined, stylist.slug)}>
            Agendar com {firstName}
          </ButtonLink>
        </div>
      </section>
      <section className="section surface-section">
        <div className="container grid gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <SectionHeading
            title={`Cuidados com ${firstName}.`}
            description="Escolha um serviço e leve essa combinação para o seu agendamento."
          />
          <div>
            {selectedServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col gap-5 border-b border-[var(--line)] py-6 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
                    <Link
                      href={`/servicos#${service.slug}`}
                      className="action-link action-inline"
                    >
                      <ActionContent>{service.name}</ActionContent>
                    </Link>
                  </h3>
                  <p className="fine-print">
                    {service.duration} min ·{" "}
                    {priceLabel(service.price, bookingSettings.show_prices)}
                  </p>
                </div>
                <Link
                  href={bookingHref(service.slug, stylist.slug)}
                  className={`${buttonClassName({ secondary: true, compact: true })} shrink-0 self-start sm:self-auto`}
                  aria-label={`Agendar ${service.name} com ${firstName}`}
                >
                  <ActionContent>Agendar este cuidado</ActionContent>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <BookingCTA title="O cuidado começa com uma conversa." />
    </PageMotion>
  );
}
