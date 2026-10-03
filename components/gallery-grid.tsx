"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { type GalleryItem, stylists } from "@/content/salon";
import { Dialog } from "@/components/dialog";

export function GalleryGrid({
  items,
  filters = false,
}: {
  items: GalleryItem[];
  filters?: boolean;
}) {
  const [category, setCategory] = useState("Todos");
  const [active, setActive] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const grid = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    grid.current?.dispatchEvent(
      new Event("page-layout-change", { bubbles: true }),
    );
  }, [category]);
  const visible =
    category === "Todos"
      ? items
      : items.filter((item) => item.category === category);
  const current = active !== null ? visible[active] : undefined;
  const move = (delta: number) =>
    setActive((previous) =>
      previous === null
        ? null
        : (previous + delta + visible.length) % visible.length,
    );
  const close = () => {
    setActive(null);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      {filters && (
        <div className="filter-bar" role="group" aria-label="Filtrar galeria">
          {["Todos", ...new Set(items.map((item) => item.category))].map(
            (value) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ),
          )}
        </div>
      )}
      <div ref={grid} className="gallery-grid" data-page-section>
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`gallery-tile gallery-tile-${index % 4}`}
            data-page-reveal
            aria-label={`Abrir imagem: ${item.title}`}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setActive(index);
            }}
          >
            <span className="gallery-image">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              />
            </span>
            <span className="gallery-caption">
              <span>
                <strong>{item.title}</strong>
                <span>
                  {item.category}
                  {item.stylistId &&
                    ` · Perfil de ${stylists.find((stylist) => stylist.id === item.stylistId)?.name || "equipe"}`}
                </span>
              </span>
              <ArrowUpRight size={22} weight="light" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      {visible.length === 0 && (
        <p role="status">Ainda não há referências nesta categoria.</p>
      )}
      <Dialog
        open={current !== undefined}
        onClose={close}
        label="Galeria de referências"
        className="lightbox"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {current && (
          <div>
            <div className="lightbox-photo">
              <Image
                key={current.id}
                src={current.image}
                alt={current.alt}
                fill
                sizes="90vw"
              />
            </div>
            <div className="lightbox-bottom">
              <div aria-live="polite">
                <h3>{current.title}</h3>
                <p>{current.category} · Fotografia ilustrativa</p>
              </div>
              <div className="lightbox-controls">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Imagem anterior"
                  onClick={() => move(-1)}
                >
                  <ArrowLeft size={22} />
                </button>
                <span className="fine-print">
                  {(active || 0) + 1} / {visible.length}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Próxima imagem"
                  onClick={() => move(1)}
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
