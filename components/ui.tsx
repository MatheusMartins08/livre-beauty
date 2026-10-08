import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { type Stylist } from "@/content/salon";
import { bookingHref } from "@/lib/utils";

export function ActionContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="action-label">{children}</span>
      <ArrowUpRight className="action-arrow" size={18} weight="light" aria-hidden="true" />
    </>
  );
}

export function buttonClassName({
  secondary = false,
  light = false,
  compact = false,
}: {
  secondary?: boolean;
  light?: boolean;
  compact?: boolean;
} = {}) {
  return [
    "button",
    secondary && "button-secondary",
    light && "button-light",
    compact && "button-compact",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Filled (primary) or outlined (secondary) action; `light` for dark surfaces. */
export function ButtonLink({
  href,
  children,
  secondary = false,
  light = false,
  compact = false,
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  light?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`${buttonClassName({ secondary, light, compact })} ${className}`.trim()}
      onClick={onClick}
    >
      <ActionContent>{children}</ActionContent>
    </Link>
  );
}

/** Editorial text action: label, underline and arrow. */
export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`action-link ${className}`.trim()}>
      <ActionContent>{children}</ActionContent>
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
  emphasis,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  emphasis?: string;
}) {
  const emphasisStart = emphasis ? title.indexOf(emphasis) : -1;
  return (
    <section className="page-intro container" data-page-section>
      <div className="intro-heading" data-page-reveal>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display-title">
          {emphasisStart >= 0 && emphasis ? (
            <>
              {title.slice(0, emphasisStart)}
              <em>{emphasis}</em>
              {title.slice(emphasisStart + emphasis.length)}
            </>
          ) : (
            title
          )}
        </h1>
      </div>
      <div className="intro-copy" data-page-reveal>
        {description && <p className="page-description">{description}</p>}
        {children}
      </div>
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
  parallax = false,
  position,
}: {
  src: string;
  alt: string;
  aspect?: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
  parallax?: boolean;
  /** Framing chosen in the site editor, as "x% y%". */
  position?: string;
}) {
  return (
    <div className={`photo ${className}`} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        style={position ? { objectPosition: position } : undefined}
        className={`photo-image${parallax ? " photo-parallax" : ""}`}
        data-page-parallax={parallax || undefined}
      />
    </div>
  );
}

export function StylistCard({
  stylist,
}: {
  stylist: Stylist & { imagePosition?: string };
}) {
  return (
    <article className="stylist-card" data-page-section>
      <Link
        href={`/profissionais/${stylist.slug}`}
        className="image-link"
        data-page-reveal
        aria-label={`Conhecer ${stylist.name}`}
      >
        <Photo
          src={stylist.image}
          alt={`Retrato de ${stylist.name}`}
          aspect="3 / 4"
          sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc((100vw - 112px) / 2), 650px"
          position={stylist.imagePosition}
        />
        <span className="image-link-arrow">
          <ArrowUpRight size={24} aria-hidden="true" />
        </span>
      </Link>
      <div className="stylist-card-heading" data-page-reveal>
        <h3>
          <Link href={`/profissionais/${stylist.slug}`} className="action-link action-inline"><ActionContent>{stylist.name}</ActionContent></Link>
        </h3>
        <p className="fine-print">{stylist.role}</p>
      </div>
      <p className="stylist-specialties">{stylist.specialties.join(" · ")}</p>
      <p>{stylist.description}</p>
      <div className="stylist-actions">
        <ButtonLink href={bookingHref(undefined, stylist.slug)} secondary compact>
          Agendar com {stylist.name.split(" ")[0]}
        </ButtonLink>
        <TextLink href={`/profissionais/${stylist.slug}`}>Ver perfil</TextLink>
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
    <section className="booking-cta" data-page-section>
      <div className="container booking-cta-inner" data-page-reveal>
        <p className="eyebrow">VAMOS CRIAR ALGO SEU</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <ButtonLink href="/agendamento" light>Agendar horário</ButtonLink>
      </div>
    </section>
  );
}
