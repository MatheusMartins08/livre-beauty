import { site, services, stylists } from "@/content/salon";

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
}

export function bookingHref(serviceSlug?: string, stylistSlug?: string) {
  const params = new URLSearchParams();
  if (serviceSlug) params.set("servico", serviceSlug);
  if (stylistSlug) params.set("profissional", stylistSlug);
  return `/agendamento${params.size ? `?${params}` : ""}`;
}

export const getService = (slug: string) =>
  services.find((item) => item.slug === slug);
export const getStylist = (slug: string) =>
  stylists.find((item) => item.slug === slug);
export const priceLabel = (
  price: number,
  showPrices: boolean = site.showPrices,
) =>
  showPrices
    ? `A partir de ${formatPrice(price)}`
    : "Investimento sob consulta";
