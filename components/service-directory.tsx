import Link from "next/link";
import type { Service } from "@/content/salon";
import { bookingHref, priceLabel } from "@/lib/utils";
import { ButtonLink, Photo } from "@/components/ui";

export function ServiceDirectory({ items }: { items: Service[] }) {
  return (
    <>
      <nav aria-label="Categorias de serviços" className="service-category-nav">
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
            className="service-directory-item"
            data-page-section
          >
            <Link
              href={`/servicos/${service.slug}`}
              aria-label={`Conhecer ${service.name}`}
              className="image-link"
              data-page-reveal
            >
              <Photo
                src={service.image}
                alt={`Referência ilustrativa de ${service.category.toLocaleLowerCase("pt-BR")}`}
                aspect="5 / 4"
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 45vw, 600px"
              />
            </Link>
            <div className="service-directory-copy" data-page-reveal>
              <p className="fine-print mb-3">
                0{index + 1} / {service.category}
              </p>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-[1.08] md:text-[2.65rem]">
                <Link href={`/servicos/${service.slug}`}>{service.name}</Link>
              </h2>
              <p className="max-w-[45ch] text-[var(--text-body)] leading-relaxed">
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
            <div className="service-directory-meta">
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
