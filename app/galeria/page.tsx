import { PageMotion } from "@/components/page-motion";
import { gallery } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { GalleryGrid } from "@/components/gallery-grid";
import { BookingCTA, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Galeria",
  "Explore referências visuais de cortes, balayage, cor, textura e cuidado no universo Livre Beauty.",
  "/galeria",
);

export default function GalleryPage() {
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
        <GalleryGrid items={gallery} filters />
      </section>
      <BookingCTA
        title="Uma referência. Muitas possibilidades."
        description="Traga o que inspira você. Vamos conversar sobre um resultado que respeite seus fios."
      />
    </PageMotion>
  );
}
