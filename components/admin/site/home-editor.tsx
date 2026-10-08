"use client";

import { Plus } from "@phosphor-icons/react";
import type { SiteContent, SiteSectionKey } from "@/lib/site-content";
import { SectionForm } from "./section-form";
import {
  ListItemActions,
  moveItem,
  PhotoField,
  TextField,
  TitleField,
} from "./fields";

export function HomeEditor({
  content,
  savedSections,
}: {
  content: SiteContent;
  savedSections: SiteSectionKey[];
}) {
  const saved = (key: SiteSectionKey) => savedSections.includes(key);
  return (
    <div className="lb-editor-stack">
      <SectionForm
        sectionKey="hero"
        title="Destaque principal"
        description="A primeira tela da página inicial."
        initial={content.hero}
        saved={saved("hero")}
      >
        {(value, update, uploads) => (
          <>
            <TextField
              label="Chamada acima do título"
              value={value.eyebrow}
              max={60}
              onChange={(eyebrow) => update({ ...value, eyebrow })}
            />
            <TitleField
              label="Título"
              value={value.title}
              onChange={(title) => update({ ...value, title })}
            />
            <TextField
              label="Texto"
              multiline
              value={value.description}
              max={240}
              onChange={(description) => update({ ...value, description })}
            />
            <TextField
              label="Legenda no rodapé da foto"
              required={false}
              value={value.caption}
              max={80}
              onChange={(caption) => update({ ...value, caption })}
            />
            <PhotoField
              label="Foto de fundo"
              folder="site"
              uploads={uploads}
              aspect="16 / 9"
              allowLayoutPosition
              value={value.photo}
              onChange={(photo) => update({ ...value, photo })}
            />
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="about"
        title="Sobre nós"
        description="Apresentação do ateliê logo após o destaque."
        initial={content.about}
        saved={saved("about")}
      >
        {(value, update, uploads) => (
          <>
            <TextField
              label="Rótulo"
              value={value.label}
              max={60}
              onChange={(label) => update({ ...value, label })}
            />
            <TitleField
              label="Título"
              value={value.title}
              onChange={(title) => update({ ...value, title })}
            />
            <TextField
              label="Texto"
              multiline
              rows={4}
              value={value.description}
              max={600}
              onChange={(description) => update({ ...value, description })}
            />
            <PhotoField
              label="Foto"
              folder="site"
              uploads={uploads}
              allowLayoutPosition
              value={value.photo}
              onChange={(photo) => update({ ...value, photo })}
            />
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="manifesto"
        title="Frase em destaque"
        description="Faixa com foto ampla e uma frase curta."
        initial={content.manifesto}
        saved={saved("manifesto")}
      >
        {(value, update, uploads) => (
          <>
            <TitleField
              label="Frase"
              value={value.title}
              onChange={(title) => update({ ...value, title })}
            />
            <PhotoField
              label="Foto"
              folder="site"
              uploads={uploads}
              aspect="16 / 9"
              allowLayoutPosition
              value={value.photo}
              onChange={(photo) => update({ ...value, photo })}
            />
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="services"
        title="Título dos serviços"
        description="Os cards vêm do cadastro de serviços, na aba Serviços."
        initial={content.services}
        saved={saved("services")}
      >
        {(value, update) => (
          <>
            <TextField
              label="Rótulo"
              value={value.label}
              max={60}
              onChange={(label) => update({ ...value, label })}
            />
            <TitleField
              label="Título"
              value={value.title}
              onChange={(title) => update({ ...value, title })}
            />
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="experts"
        title="Especialistas"
        description="Chamada para conhecer a equipe."
        initial={content.experts}
        saved={saved("experts")}
      >
        {(value, update, uploads) => (
          <>
            <TextField
              label="Rótulo"
              value={value.label}
              max={60}
              onChange={(label) => update({ ...value, label })}
            />
            <TitleField
              label="Título"
              value={value.title}
              onChange={(title) => update({ ...value, title })}
            />
            <TextField
              label="Texto"
              multiline
              value={value.description}
              max={400}
              onChange={(description) => update({ ...value, description })}
            />
            <PhotoField
              label="Foto"
              folder="site"
              uploads={uploads}
              aspect="3 / 4"
              allowLayoutPosition
              value={value.photo}
              onChange={(photo) => update({ ...value, photo })}
            />
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="faq"
        title="Perguntas frequentes"
        description="Até 4 grupos com até 10 perguntas cada."
        initial={content.faq}
        saved={saved("faq")}
      >
        {(value, update) => (
          <>
            <TextField
              label="Título"
              value={value.title}
              max={120}
              onChange={(title) => update({ ...value, title })}
            />
            <TextField
              label="Texto de apoio"
              value={value.description}
              max={200}
              onChange={(description) => update({ ...value, description })}
            />
            {value.groups.map((group, groupIndex) => {
              const setGroup = (next: typeof group) =>
                update({
                  ...value,
                  groups: value.groups.map((item, index) =>
                    index === groupIndex ? next : item,
                  ),
                });
              return (
                <fieldset className="lb-fieldset lb-list-item" key={groupIndex}>
                  <legend>Grupo {groupIndex + 1}</legend>
                  <ListItemActions
                    label={`grupo ${groupIndex + 1}`}
                    index={groupIndex}
                    length={value.groups.length}
                    onMove={(from, to) =>
                      update({ ...value, groups: moveItem(value.groups, from, to) })
                    }
                    onRemove={
                      value.groups.length > 1
                        ? () =>
                            update({
                              ...value,
                              groups: value.groups.filter(
                                (_, index) => index !== groupIndex,
                              ),
                            })
                        : undefined
                    }
                  />
                  <TextField
                    label="Título do grupo"
                    value={group.title}
                    max={60}
                    onChange={(title) => setGroup({ ...group, title })}
                  />
                  {group.items.map((item, itemIndex) => (
                    <div className="lb-list-item lb-list-item-nested" key={itemIndex}>
                      <ListItemActions
                        label={`pergunta ${itemIndex + 1}`}
                        index={itemIndex}
                        length={group.items.length}
                        onMove={(from, to) =>
                          setGroup({ ...group, items: moveItem(group.items, from, to) })
                        }
                        onRemove={
                          group.items.length > 1
                            ? () =>
                                setGroup({
                                  ...group,
                                  items: group.items.filter(
                                    (_, index) => index !== itemIndex,
                                  ),
                                })
                            : undefined
                        }
                      />
                      <TextField
                        label={`Pergunta ${itemIndex + 1}`}
                        value={item.question}
                        max={160}
                        onChange={(question) =>
                          setGroup({
                            ...group,
                            items: group.items.map((current, index) =>
                              index === itemIndex ? { ...current, question } : current,
                            ),
                          })
                        }
                      />
                      <TextField
                        label="Resposta"
                        multiline
                        value={item.answer}
                        max={800}
                        onChange={(answer) =>
                          setGroup({
                            ...group,
                            items: group.items.map((current, index) =>
                              index === itemIndex ? { ...current, answer } : current,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                  {group.items.length < 10 && (
                    <button
                      type="button"
                      className="lb-text-button"
                      onClick={() =>
                        setGroup({
                          ...group,
                          items: [...group.items, { question: "", answer: "" }],
                        })
                      }
                    >
                      <Plus size={16} aria-hidden="true" />
                      Adicionar pergunta
                    </button>
                  )}
                </fieldset>
              );
            })}
            {value.groups.length < 4 && (
              <button
                type="button"
                className="lb-button"
                onClick={() =>
                  update({
                    ...value,
                    groups: [
                      ...value.groups,
                      { title: "", items: [{ question: "", answer: "" }] },
                    ],
                  })
                }
              >
                <Plus size={16} aria-hidden="true" />
                Adicionar grupo
              </button>
            )}
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="reviews"
        title="Depoimentos"
        description="Até 9 depoimentos, exibidos na ordem abaixo."
        initial={content.reviews}
        saved={saved("reviews")}
      >
        {(value, update) => (
          <>
            <div className="lb-form-grid lb-form-grid-2">
              <TextField
                label="Rótulo"
                value={value.label}
                max={60}
                onChange={(label) => update({ ...value, label })}
              />
              <TextField
                label="Título"
                value={value.title}
                max={80}
                onChange={(title) => update({ ...value, title })}
              />
            </div>
            {value.items.map((item, itemIndex) => {
              const setItem = (next: typeof item) =>
                update({
                  ...value,
                  items: value.items.map((current, index) =>
                    index === itemIndex ? next : current,
                  ),
                });
              return (
                <fieldset className="lb-fieldset lb-list-item" key={itemIndex}>
                  <legend>Depoimento {itemIndex + 1}</legend>
                  <ListItemActions
                    label={`depoimento ${itemIndex + 1}`}
                    index={itemIndex}
                    length={value.items.length}
                    onMove={(from, to) =>
                      update({ ...value, items: moveItem(value.items, from, to) })
                    }
                    onRemove={() =>
                      update({
                        ...value,
                        items: value.items.filter((_, index) => index !== itemIndex),
                      })
                    }
                  />
                  <div className="lb-form-grid lb-form-grid-2">
                    <TextField
                      label="Nome"
                      value={item.name}
                      max={60}
                      onChange={(name) => setItem({ ...item, name })}
                    />
                    <TextField
                      label="Serviço"
                      value={item.service}
                      max={60}
                      onChange={(service) => setItem({ ...item, service })}
                    />
                  </div>
                  <TextField
                    label="Depoimento"
                    multiline
                    value={item.quote}
                    max={400}
                    onChange={(quote) => setItem({ ...item, quote })}
                  />
                </fieldset>
              );
            })}
            {value.items.length < 9 && (
              <button
                type="button"
                className="lb-button"
                onClick={() =>
                  update({
                    ...value,
                    items: [...value.items, { name: "", service: "", quote: "" }],
                  })
                }
              >
                <Plus size={16} aria-hidden="true" />
                Adicionar depoimento
              </button>
            )}
          </>
        )}
      </SectionForm>

      <SectionForm
        sectionKey="visit"
        title="Visite o ateliê"
        description="Título da seção com endereço, horários e mapa. Os dados ficam na aba Contato."
        initial={content.visit}
        saved={saved("visit")}
      >
        {(value, update) => (
          <div className="lb-form-grid lb-form-grid-2">
            <TextField
              label="Rótulo"
              value={value.label}
              max={60}
              onChange={(label) => update({ ...value, label })}
            />
            <TextField
              label="Título"
              value={value.title}
              max={80}
              onChange={(title) => update({ ...value, title })}
            />
          </div>
        )}
      </SectionForm>
    </div>
  );
}
