import {
  gallery,
  site,
  testimonials,
  type FAQItem,
  type Testimonial,
} from "@/content/salon";
import {
  homeContent,
  homeFAQGroups,
  type EditorialTitle,
} from "@/content/home";
import { isAllowedImage, isPosition } from "./media";

/** position "" keeps the framing defined by the page layout. */
export interface SitePhoto {
  src: string;
  alt: string;
  position: string;
}
export interface SiteGalleryItem {
  id: string;
  image: string;
  alt: string;
  title: string;
  category: string;
  stylistId: string;
  position: string;
}
export interface SiteContent {
  hero: {
    eyebrow: string;
    title: EditorialTitle;
    description: string;
    caption: string;
    photo: SitePhoto;
  };
  about: {
    label: string;
    title: EditorialTitle;
    description: string;
    photo: SitePhoto;
  };
  manifesto: { title: EditorialTitle; photo: SitePhoto };
  services: { label: string; title: EditorialTitle };
  experts: {
    label: string;
    title: EditorialTitle;
    description: string;
    photo: SitePhoto;
  };
  faq: {
    title: string;
    description: string;
    groups: { title: string; items: FAQItem[] }[];
  };
  reviews: { label: string; title: string; items: Testimonial[] };
  visit: { label: string; title: string };
  contact: {
    address: string;
    location: string;
    whatsapp: string;
    instagram: string;
    phone: string;
    photo: SitePhoto;
  };
  gallery: { items: SiteGalleryItem[] };
}
export type SiteSectionKey = keyof SiteContent;
export const siteSectionKeys: SiteSectionKey[] = [
  "hero",
  "about",
  "manifesto",
  "services",
  "experts",
  "faq",
  "reviews",
  "visit",
  "contact",
  "gallery",
];

// The published texts. A section without a saved row keeps using these values.
export const defaultSiteContent: SiteContent = {
  hero: {
    eyebrow: site.hero.eyebrow,
    title: { ...site.hero.title },
    description: site.hero.description,
    caption: "BEAUTY ATELIÊ · JARDINS, SÃO PAULO",
    photo: {
      src: "/images/hero-salon.jpg",
      alt: "Retrato editorial com cabelo escuro e luz suave",
      position: "",
    },
  },
  about: {
    label: homeContent.about.label,
    title: homeContent.about.title,
    description: homeContent.about.description,
    photo: { ...homeContent.about.photo, position: "" },
  },
  manifesto: {
    title: homeContent.manifesto.title,
    photo: { ...homeContent.manifesto.photo, position: "" },
  },
  services: {
    label: homeContent.services.label,
    title: homeContent.services.title,
  },
  experts: {
    label: homeContent.experts.label,
    title: homeContent.experts.title,
    description: homeContent.experts.description,
    photo: { ...homeContent.experts.photo, position: "" },
  },
  faq: {
    title: homeContent.faq.title,
    description:
      "Do primeiro encontro aos últimos detalhes: tire suas dúvidas antes de chegar.",
    groups: homeFAQGroups,
  },
  reviews: {
    label: homeContent.reviews.label,
    title: homeContent.reviews.title,
    items: testimonials,
  },
  visit: { ...homeContent.visit },
  contact: {
    address: site.address,
    location: site.location,
    whatsapp: "",
    instagram: "",
    phone: "",
    photo: { src: "/images/contact-salon.jpg", alt: "", position: "" },
  },
  gallery: {
    items: gallery.map((item) => ({
      id: item.id,
      image: item.image,
      alt: item.alt,
      title: item.title,
      category: item.category,
      stylistId: item.stylistId ?? "",
      position: "",
    })),
  },
};

type Raw = Record<string, unknown>;

/** Collects every problem instead of stopping at the first one. */
class SectionReader {
  readonly errors: string[] = [];
  constructor(private readonly supabaseUrl: string) {}

  object(value: unknown): Raw {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Raw)
      : {};
  }
  text(value: unknown, label: string, max: number, required = true): string {
    const text = typeof value === "string" ? value.trim() : null;
    if (text === null || (required && !text) || text.length > max) {
      this.errors.push(
        required
          ? `${label}: use de 1 a ${max} caracteres.`
          : `${label}: use até ${max} caracteres.`,
      );
      return "";
    }
    return text;
  }
  title(value: unknown, label: string): EditorialTitle {
    const raw = this.object(value);
    const leading = this.text(raw.leading ?? "", `${label} (meio)`, 40, false);
    return {
      opening: this.text(raw.opening, `${label} (início)`, 60),
      ...(leading ? { leading } : {}),
      emphasis: this.text(raw.emphasis, `${label} (destaque)`, 60),
    };
  }
  position(value: unknown, label: string): string {
    if (value === "" || isPosition(value)) return value;
    this.errors.push(`${label}: enquadramento inválido.`);
    return "";
  }
  image(value: unknown, label: string): string {
    if (isAllowedImage(value, this.supabaseUrl)) return value;
    this.errors.push(`${label}: escolha uma imagem válida.`);
    return "";
  }
  photo(value: unknown, label: string, altRequired = true): SitePhoto {
    const raw = this.object(value);
    return {
      src: this.image(raw.src, label),
      alt: this.text(raw.alt, `${label} (descrição)`, 200, altRequired),
      position: this.position(raw.position, label),
    };
  }
  list<T>(
    value: unknown,
    label: string,
    limits: { min: number; max: number },
    read: (item: Raw, index: number) => T,
  ): T[] {
    if (
      !Array.isArray(value) ||
      value.length < limits.min ||
      value.length > limits.max
    ) {
      this.errors.push(
        `${label}: use de ${limits.min} a ${limits.max} itens.`,
      );
      return [];
    }
    return value.map((item, index) => read(this.object(item), index));
  }
}

function digits(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : null;
}

const readers: {
  [K in SiteSectionKey]: (raw: Raw, reader: SectionReader) => SiteContent[K];
} = {
  hero: (raw, r) => ({
    eyebrow: r.text(raw.eyebrow, "Chamada", 60),
    title: r.title(raw.title, "Título"),
    description: r.text(raw.description, "Texto", 240),
    caption: r.text(raw.caption, "Legenda", 80, false),
    photo: r.photo(raw.photo, "Foto"),
  }),
  about: (raw, r) => ({
    label: r.text(raw.label, "Rótulo", 60),
    title: r.title(raw.title, "Título"),
    description: r.text(raw.description, "Texto", 600),
    photo: r.photo(raw.photo, "Foto"),
  }),
  manifesto: (raw, r) => ({
    title: r.title(raw.title, "Título"),
    photo: r.photo(raw.photo, "Foto"),
  }),
  services: (raw, r) => ({
    label: r.text(raw.label, "Rótulo", 60),
    title: r.title(raw.title, "Título"),
  }),
  experts: (raw, r) => ({
    label: r.text(raw.label, "Rótulo", 60),
    title: r.title(raw.title, "Título"),
    description: r.text(raw.description, "Texto", 400),
    photo: r.photo(raw.photo, "Foto"),
  }),
  faq: (raw, r) => ({
    title: r.text(raw.title, "Título", 120),
    description: r.text(raw.description, "Texto", 200),
    groups: r.list(raw.groups, "Grupos", { min: 1, max: 4 }, (group, index) => ({
      title: r.text(group.title, `Grupo ${index + 1}`, 60),
      items: r.list(
        group.items,
        `Perguntas do grupo ${index + 1}`,
        { min: 1, max: 10 },
        (item, position) => ({
          question: r.text(item.question, `Pergunta ${position + 1}`, 160),
          answer: r.text(item.answer, `Resposta ${position + 1}`, 800),
        }),
      ),
    })),
  }),
  reviews: (raw, r) => ({
    label: r.text(raw.label, "Rótulo", 60),
    title: r.text(raw.title, "Título", 80),
    items: r.list(raw.items, "Depoimentos", { min: 0, max: 9 }, (item, index) => ({
      name: r.text(item.name, `Nome do depoimento ${index + 1}`, 60),
      service: r.text(item.service, `Serviço do depoimento ${index + 1}`, 60),
      quote: r.text(item.quote, `Depoimento ${index + 1}`, 400),
    })),
  }),
  visit: (raw, r) => ({
    label: r.text(raw.label, "Rótulo", 60),
    title: r.text(raw.title, "Título", 80),
  }),
  contact: (raw, r) => {
    let whatsapp = digits(raw.whatsapp) ?? "";
    if (/^\d{10,11}$/.test(whatsapp)) whatsapp = `55${whatsapp}`;
    if (whatsapp && !/^[1-9]\d{11,14}$/.test(whatsapp))
      r.errors.push("WhatsApp: informe DDD e número.");
    let phone = digits(raw.phone) ?? "";
    if (/^55\d{10,11}$/.test(phone)) phone = phone.slice(2);
    if (phone && !/^\d{10,11}$/.test(phone))
      r.errors.push("Telefone: informe DDD e número.");
    const instagramInput =
      typeof raw.instagram === "string" ? raw.instagram.trim() : "";
    const handle = instagramInput.match(
      /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?$/,
    )?.[1];
    if (instagramInput && !handle)
      r.errors.push("Instagram: informe o perfil, como @livrebeauty.");
    return {
      address: r.text(raw.address, "Endereço", 160),
      location: r.text(raw.location, "Bairro e cidade", 80),
      whatsapp,
      instagram: handle ? `https://www.instagram.com/${handle}/` : "",
      phone,
      photo: r.photo(raw.photo, "Foto do WhatsApp", false),
    };
  },
  gallery: (raw, r) => ({
    items: r.list(raw.items, "Galeria", { min: 0, max: 24 }, (item, index) => {
      const label = `Imagem ${index + 1}`;
      return {
        id: r.text(item.id, `${label} (código)`, 40),
        image: r.image(item.image, label),
        alt: r.text(item.alt, `${label} (descrição)`, 200),
        title: r.text(item.title, `${label} (título)`, 60),
        category: r.text(item.category, `${label} (categoria)`, 40),
        stylistId: r.text(item.stylistId ?? "", `${label} (profissional)`, 80, false),
        position: r.position(item.position ?? "", label),
      };
    }),
  }),
};

/** Validates one section; any error means the section must not be used. */
export function parseSiteSection<K extends SiteSectionKey>(
  key: K,
  raw: unknown,
  supabaseUrl: string,
): { value: SiteContent[K]; errors: string[] } {
  const reader = new SectionReader(supabaseUrl);
  const value = readers[key](reader.object(raw), reader);
  return { value, errors: reader.errors };
}

/** Saved sections over the defaults; an invalid section falls back entirely. */
export function mergeSiteContent(
  rows: { key: string; content: unknown }[],
  supabaseUrl: string,
): SiteContent {
  const content = { ...defaultSiteContent };
  for (const row of rows) {
    if (!siteSectionKeys.includes(row.key as SiteSectionKey)) continue;
    const key = row.key as SiteSectionKey;
    const { value, errors } = parseSiteSection(key, row.content, supabaseUrl);
    if (!errors.length) Object.assign(content, { [key]: value });
  }
  return content;
}
