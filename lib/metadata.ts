import type { Metadata } from "next";
import { site } from "@/content/salon";

export const siteUrl = new URL(process.env.SITE_URL || "http://localhost:3000");

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: path,
      siteName: site.name,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: "/images/hero-salon.jpg",
          width: 1672,
          height: 941,
          alt: "Livre Beauty · beleza com liberdade",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: ["/images/hero-salon.jpg"],
    },
  };
}

export function salonStructuredData() {
  if (site.isDemo) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: site.name,
    description: site.description,
    url: siteUrl.toString(),
    image: new URL("/images/salon-interior-01.jpg", siteUrl).toString(),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: "São Paulo",
      addressCountry: "BR",
    },
    openingHours: "Tu-Sa 09:00-19:00",
  };
}
