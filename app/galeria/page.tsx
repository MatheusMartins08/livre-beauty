import { PageMotion } from "@/components/page-motion";
import { gallery } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { GalleryGrid } from "@/components/gallery-grid";
import { BookingCTA, DemoNote, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Galeria",
  "Explore referências visuais de cortes, balayage, cor, textura e cuidado no universo Livre Beauty. Fotografias ilustrativas.",
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
        <div className="mt-10 max-w-[70ch]">
          <DemoNote>
            Fotografias editoriais ilustrativas, selecionadas para representar o
            conceito Livre. Não são registros de serviços realizados pela equipe
            fictícia. Cada cabelo pede uma avaliação individual.
          </DemoNote>
        </div>
      </section>
      <BookingCTA
        title="Uma referência. Muitas possibilidades."
        description="Traga o que inspira você. Vamos conversar sobre um resultado que respeite seus fios."
      />
    </PageMotion>
  );
}
