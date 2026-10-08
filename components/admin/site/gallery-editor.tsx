"use client";

import { Plus } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import type { SiteContent, SiteGalleryItem } from "@/lib/site-content";
import { SectionForm } from "./section-form";
import { ListItemActions, moveItem, PhotoField, TextField } from "./fields";

export function GalleryEditor({
  gallery,
  saved,
}: {
  gallery: SiteContent["gallery"];
  saved: boolean;
}) {
  const { stylists } = useCatalog();
  const people = stylists.filter((person) => !person.deleted);
  return (
    <SectionForm
      sectionKey="gallery"
      title="Galeria"
      description="Até 24 imagens na página Galeria, com filtros pelas categorias."
      initial={gallery}
      saved={saved}
    >
      {(value, update, uploads) => {
        const setItem = (itemIndex: number, next: SiteGalleryItem) =>
          update({
            items: value.items.map((item, index) =>
              index === itemIndex ? next : item,
            ),
          });
        return (
          <>
            {!value.items.length && (
              <p className="lb-help">A galeria está vazia. Adicione a primeira imagem.</p>
            )}
            {value.items.map((item, itemIndex) => (
              <fieldset className="lb-fieldset lb-list-item" key={item.id}>
                <legend>
                  Imagem {itemIndex + 1}
                  {item.title && ` · ${item.title}`}
                </legend>
                <ListItemActions
                  label={`imagem ${itemIndex + 1}`}
                  index={itemIndex}
                  length={value.items.length}
                  onMove={(from, to) => update({ items: moveItem(value.items, from, to) })}
                  onRemove={() =>
                    update({ items: value.items.filter((_, index) => index !== itemIndex) })
                  }
                />
                <PhotoField
                  label="Foto"
                  folder="gallery"
                  uploads={uploads}
                  allowLayoutPosition
                  value={{ src: item.image, alt: item.alt, position: item.position }}
                  onChange={(photo) =>
                    setItem(itemIndex, {
                      ...item,
                      image: photo.src,
                      alt: photo.alt,
                      position: photo.position,
                    })
                  }
                />
                <div className="lb-form-grid lb-form-grid-3">
                  <TextField
                    label="Título"
                    value={item.title}
                    max={60}
                    onChange={(title) => setItem(itemIndex, { ...item, title })}
                  />
                  <TextField
                    label="Categoria"
                    value={item.category}
                    max={40}
                    help="Imagens com a mesma categoria formam um filtro."
                    onChange={(category) => setItem(itemIndex, { ...item, category })}
                  />
                  <label className="lb-field">
                    Profissional
                    <select
                      value={item.stylistId}
                      onChange={(event) =>
                        setItem(itemIndex, { ...item, stylistId: event.target.value })
                      }
                    >
                      <option value="">Equipe do ateliê</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
            ))}
            {value.items.length < 24 && (
              <button
                type="button"
                className="lb-button"
                onClick={() =>
                  update({
                    items: [
                      ...value.items,
                      {
                        id: crypto.randomUUID().slice(0, 8),
                        image: "",
                        alt: "",
                        title: "",
                        category: "",
                        stylistId: "",
                        position: "",
                      },
                    ],
                  })
                }
              >
                <Plus size={16} aria-hidden="true" />
                Adicionar imagem
              </button>
            )}
          </>
        );
      }}
    </SectionForm>
  );
}
