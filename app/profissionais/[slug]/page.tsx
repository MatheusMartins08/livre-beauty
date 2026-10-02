import { notFound } from "next/navigation";
import Link from "next/link";
import { gallery, services, stylists } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { bookingHref, getStylist, priceLabel } from "@/lib/utils";
import { GalleryGrid } from "@/components/gallery-grid";
import {
  BookingCTA,
  ButtonLink,
  DemoNote,
  PageIntro,
  Photo,
  SectionHeading,
} from "@/components/ui";

type StylistPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return stylists.map((stylist) => ({ slug: stylist.slug }));
}

export async function generateMetadata({ params }: StylistPageProps) {
  const { slug } = await params;
  const stylist = getStylist(slug);
  if (!stylist) notFound();
  return pageMetadata(
    stylist.name,
    stylist.description,
    `/profissionais/${stylist.slug}`,
  );
}

export default async function StylistPage({ params }: StylistPageProps) {
  const { slug } = await params;
  const stylist = getStylist(slug);
  if (!stylist) notFound();
  const firstName = stylist.name.split(" ")[0];
  const selectedServices = services.filter((service) =>
    stylist.serviceIds.includes(service.id),
  );
  const references = gallery.filter((item) => item.stylistId === stylist.id);

  return (
    <>
      <PageIntro
        eyebrow="NOSSA EQUIPE"
        title={stylist.name}
        description={stylist.role}
      >
        <Link href="/profissionais" className="text-link mt-6 inline-flex">
          Conhecer toda a equipe
        </Link>
      </PageIntro>
      <section
        className="container grid items-start gap-10 pb-16 lg:grid-cols-[0.8fr_1fr] lg:gap-24 lg:pb-24"
        aria-label={`Conheça ${stylist.name}`}
      >
        <Photo
          src={stylist.image}
          alt={`Retrato ilustrativo do perfil fictício de ${stylist.name}`}
          aspect="3 / 4"
        />
        <div className="lg:py-7">
          <p className="mb-7 max-w-[34ch] font-[family-name:var(--font-display)] text-3xl leading-[1.2] md:text-[2.6rem]">
            {stylist.description}
          </p>
          <p className="max-w-[55ch] text-[#625D57] leading-relaxed">
            {stylist.biography}
          </p>
          <dl className="my-8 border-y border-[#252422]/15 py-6">
            <div className="mb-5">
              <dt className="fine-print mb-2">
                Experiência no perfil demonstrativo
              </dt>
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
          <div className="mt-6">
            <DemoNote>
              Nome, biografia e experiência fictícios. A imagem é um retrato
              ilustrativo e não identifica um profissional real do Livre.
            </DemoNote>
          </div>
        </div>
      </section>
      <section className="section bg-[#F0ECE5]">
        <div className="container grid gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <SectionHeading
            title={`Cuidados com ${firstName}.`}
            description="Escolha um serviço e leve essa combinação para o seu agendamento."
          />
          <div>
            {selectedServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col gap-5 border-b border-[#252422]/15 py-6 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
                    <Link href={`/servicos/${service.slug}`}>
                      {service.name}
                    </Link>
                  </h3>
                  <p className="fine-print">
                    {service.duration} min · {priceLabel(service.price)}
                  </p>
                </div>
                <Link
                  href={bookingHref(service.slug, stylist.slug)}
                  className="text-link shrink-0"
                  aria-label={`Agendar ${service.name} com ${firstName}`}
                >
                  Agendar este cuidado
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      {references.length > 0 && (
        <section className="section container">
          <SectionHeading
            title="Um olhar para inspirar."
            description={`Referências visuais para as especialidades do perfil de ${firstName}.`}
          />
          <div className="mt-10">
            <GalleryGrid items={references} filters={false} />
          </div>
          <div className="mt-7">
            <DemoNote>
              Portfólio ilustrativo. As imagens são referências editoriais
              associadas às especialidades e não trabalhos realizados por este
              profissional fictício.
            </DemoNote>
          </div>
        </section>
      )}
      <BookingCTA title="O cuidado começa com uma conversa." />
    </>
  );
}
