import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { type Service, type Stylist } from "@/content/salon";
import { bookingHref, priceLabel } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  secondary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`button ${secondary ? "button-secondary" : ""} ${className}`}
    >
      {children}
      <ArrowUpRight size={18} weight="light" aria-hidden="true" />
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
      {children}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-intro container">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
      {children}
    </section>
  );
}

export function Photo({
  src,
  alt,
  aspect = "4 / 5",
  className = "",
  sizes = "(max-width: 767px) 100vw, 50vw",
  preload = false,
}: {
  src: string;
  alt: string;
  aspect?: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <div className={`photo ${className}`} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className="photo-image"
      />
    </div>
  );
}

export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <p className="demo-note">
      {children ||
        "Fotografias ilustrativas. Livre Beauty é uma marca fictícia criada para apresentação."}
    </p>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card">
      <Link
        href={`/servicos/${service.slug}`}
        className="image-link"
        aria-label={`Conhecer ${service.name}`}
      >
        <Photo
          src={service.image}
          alt={`Fotografia ilustrativa de ${service.category.toLocaleLowerCase("pt-BR")}`}
          aspect="4 / 5"
          sizes="(max-width: 389px) calc(100vw - 40px), (max-width: 1023px) 50vw, 25vw"
        />
        <span className="image-link-arrow">
          <ArrowUpRight size={24} aria-hidden="true" />
        </span>
      </Link>
      <div className="service-card-heading">
        <h3>
          <Link href={`/servicos/${service.slug}`}>{service.name}</Link>
        </h3>
        <span className="fine-print">{service.duration} min</span>
      </div>
      <p>{service.description}</p>
      <span className="service-price">{priceLabel(service.price)}</span>
      <Link href={bookingHref(service.slug)} className="text-link">
        Agendar horário
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function StylistCard({ stylist }: { stylist: Stylist }) {
  return (
    <article className="stylist-card">
      <Link
        href={`/profissionais/${stylist.slug}`}
        className="image-link"
        aria-label={`Conhecer ${stylist.name}`}
      >
        <Photo
          src={stylist.image}
          alt={`Retrato ilustrativo do perfil fictício de ${stylist.name}`}
          aspect="3 / 4"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
        <span className="image-link-arrow">
          <ArrowUpRight size={24} aria-hidden="true" />
        </span>
      </Link>
      <div className="stylist-card-heading">
        <h3>
          <Link href={`/profissionais/${stylist.slug}`}>{stylist.name}</Link>
        </h3>
        <p className="fine-print">{stylist.role}</p>
      </div>
      <p className="stylist-specialties">{stylist.specialties.join(" · ")}</p>
      <p>{stylist.description}</p>
      <div className="stylist-actions">
        <Link href={`/profissionais/${stylist.slug}`} className="text-link">
          Ver perfil
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <Link href={bookingHref(undefined, stylist.slug)} className="text-link">
          Agendar com {stylist.name.split(" ")[0]}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function BookingCTA({
  title = "Seu próximo capítulo começa aqui.",
  description = "Uma boa conversa. Novas possibilidades. E um tempo reservado para você.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="booking-cta">
      <div className="container booking-cta-inner">
        <p className="eyebrow">VAMOS CRIAR ALGO SEU</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <ButtonLink href="/agendamento">Agendar horário</ButtonLink>
      </div>
    </section>
  );
}
