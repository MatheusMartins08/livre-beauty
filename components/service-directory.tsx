import Link from "next/link";
import type { Service } from "@/content/salon";
import { bookingHref, priceLabel } from "@/lib/utils";
import { ButtonLink, Photo } from "@/components/ui";

export function ServiceDirectory({ items }: { items: Service[] }) {
  return (
    <>
      <nav
        aria-label="Categorias de serviços"
        className="flex flex-wrap gap-x-6 gap-y-3 border-y border-[#252422]/15 py-5 md:gap-x-9"
      >
        {items.map((service) => (
          <Link
            className="text-link text-sm"
            key={service.id}
            href={`#${service.slug}`}
          >
            {service.category}
          </Link>
        ))}
      </nav>
      <div>
        {items.map((service, index) => (
          <article
            id={service.slug}
            key={service.id}
            className="grid scroll-mt-28 gap-6 border-b border-[#252422]/15 py-9 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,0.65fr)] md:items-center md:gap-10 md:py-12"
          >
            <Link
              href={`/servicos/${service.slug}`}
              aria-label={`Conhecer ${service.name}`}
              className="image-link"
            >
              <Photo
                src={service.image}
                alt={`Referência ilustrativa de ${service.category.toLocaleLowerCase("pt-BR")}`}
                aspect="4 / 3"
                sizes="(max-width: 767px) 100vw, 30vw"
              />
            </Link>
            <div>
              <p className="fine-print mb-3">
                0{index + 1} / {service.category}
              </p>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-[1.08] md:text-[2.65rem]">
                <Link href={`/servicos/${service.slug}`}>{service.name}</Link>
              </h2>
              <p className="max-w-[45ch] text-[#625D57] leading-relaxed">
                {service.description}
              </p>
              <Link
                href={`/servicos/${service.slug}`}
                className="text-link mt-5 inline-flex"
                aria-label={`Conhecer ${service.name}`}
              >
                Conhecer o cuidado
              </Link>
            </div>
            <div className="flex flex-wrap items-start gap-x-8 gap-y-4 md:block md:justify-self-end">
              <div>
                <p className="fine-print mb-1">Duração aproximada</p>
                <p className="mb-4">{service.duration} minutos</p>
                <p className="mb-5 text-sm">{priceLabel(service.price)}</p>
              </div>
              <ButtonLink href={bookingHref(service.slug)} secondary>
                <span>
                  Agendar<span className="sr-only"> {service.name}</span>
                </span>
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
