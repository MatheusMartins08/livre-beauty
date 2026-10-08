import { PageMotion } from "@/components/page-motion";
import { pageMetadata } from "@/lib/metadata";
import { getPublicCatalog } from "@/lib/supabase/catalog";
import { getPublicSite } from "@/lib/supabase/site";
import { GalleryGrid } from "@/components/gallery-grid";
import { BookingCTA, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Galeria",
  "Explore referências visuais de cortes, balayage, cor, textura e cuidado no universo Livre Beauty.",
  "/galeria",
);

export default async function GalleryPage() {
  const [{ content }, catalog] = await Promise.all([
    getPublicSite(),
    // Captions fall back to "equipe" when the catalog is unavailable.
    getPublicCatalog().catch(() => null),
  ]);
  const stylistNames = Object.fromEntries(
    (catalog?.stylists ?? []).map((stylist) => [stylist.id, stylist.name]),
  );
  return (
    <PageMotion>
      <PageIntro
        eyebrow="GALERIA"
        title="Beleza em suas muitas formas."
        emphasis="muitas formas."
        description="Texturas, luz, movimento. Referências para imaginar o que pode ser seu."
      />
      <section
        className="container pb-16 md:pb-24"
        aria-label="Referências de beleza"
      >
        <GalleryGrid
          items={content.gallery.items}
          stylistNames={stylistNames}
          filters
        />
      </section>
      <BookingCTA
        title="Uma referência. Muitas possibilidades."
        description="Traga o que inspira você. Vamos conversar sobre um resultado que respeite seus fios."
      />
    </PageMotion>
  );
}
