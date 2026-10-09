"use client";

import { useState, type FormEvent } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useCatalog } from "@/components/catalog-provider";
import { MaskedInput } from "@/components/masked-input";
import { Panel } from "@/components/admin/ui";
import { currency } from "@/lib/admin";
import type { CatalogService } from "@/lib/catalog";
import { formatCurrencyValue, parseCurrencyInput } from "@/lib/input-masks";
import { DEFAULT_POSITION } from "@/lib/media";
import {
  deleteCatalogItem,
  reorderCatalog,
  saveService,
  type EditorResult,
} from "@/lib/site-actions";
import {
  Checkbox,
  EditorFeedback,
  ListItemActions,
  moveItem,
  PhotoField,
  TextField,
  useUploads,
} from "./fields";
import { useEditorAction } from "./use-editor-action";

export function ServicesEditor() {
  const { services } = useCatalog();
  const items = services.filter((service) => !service.deleted);
  const [editing, setEditing] = useState<CatalogService | "new" | null>(null);
  const { result, setResult, pending, run } = useEditorAction();

  function remove(service: CatalogService) {
    if (
      !window.confirm(
        `Excluir ${service.name}? Serviços com atendimentos são arquivados para manter o histórico.`,
      )
    )
      return;
    void run(() => deleteCatalogItem("services", service.id));
  }

  return (
    <Panel
      title="Serviços"
      description="Catálogo do site, da página inicial e do agendamento, na ordem abaixo."
      action={
        <button
          type="button"
          className="lb-button lb-button-primary"
          onClick={() => {
            setResult(null);
            setEditing("new");
          }}
        >
          <Plus size={17} aria-hidden="true" />
          Novo serviço
        </button>
      }
    >
      <div className="lb-editor-body">
        <EditorFeedback result={result} />
        <ul className="lb-catalog-list" aria-busy={pending}>
          {items.map((service, index) => (
            <li key={service.id}>
              <span
                className="lb-catalog-thumb"
                style={{
                  backgroundImage: `url("${service.image}")`,
                  backgroundPosition: service.imagePosition,
                }}
                aria-hidden="true"
              />
              <span className="lb-catalog-copy">
                <strong>{service.name}</strong>
                <small>
                  {service.category} · {service.duration} min ·{" "}
                  {currency(service.price)}
                  {service.componentIds.length > 0 && " · combo"}
                  {service.popular && " · mais pedido"}
                </small>
              </span>
              {!service.active && (
                <span className="lb-badge lb-badge-neutral">Inativo</span>
              )}
              <ListItemActions
                label={service.name}
                index={index}
                length={items.length}
                disabled={pending}
                onMove={(from, to) =>
                  void run(() =>
                    reorderCatalog(
                      "services",
                      moveItem(items, from, to).map((item) => item.id),
                    ),
                  )
                }
              />
              <div className="lb-item-actions">
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Editar ${service.name}`}
                  onClick={() => {
                    setResult(null);
                    setEditing(service);
                  }}
                >
                  <PencilSimple size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Excluir ${service.name}`}
                  disabled={pending}
                  onClick={() => remove(service)}
                >
                  <Trash size={17} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {editing && (
        <ServiceForm
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setResult(saved);
            setEditing(null);
          }}
        />
      )}
    </Panel>
  );
}

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: CatalogService | null;
  onClose: () => void;
  onSaved: (result: EditorResult) => void;
}) {
  const { services, stylists } = useCatalog();
  const uploads = useUploads();
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [summary, setSummary] = useState(service?.summary ?? "");
  const [duration, setDuration] = useState(String(service?.duration ?? 60));
  const [price, setPrice] = useState(formatCurrencyValue(service?.price ?? 0));
  const [photo, setPhoto] = useState({
    src: service?.image ?? "",
    alt: "",
    position: service?.imagePosition ?? DEFAULT_POSITION,
  });
  const [homePhoto, setHomePhoto] = useState(
    service?.homeImage
      ? {
          src: service.homeImage,
          alt: service.homeImageAlt,
          position: service.homeImagePosition,
        }
      : null,
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [popular, setPopular] = useState(service?.popular ?? false);
  const [stylistIds, setStylistIds] = useState(
    service
      ? stylists
          .filter((person) => person.serviceIds.includes(service.id))
          .map((person) => person.id)
      : [],
  );
  const [componentIds, setComponentIds] = useState(service?.componentIds ?? []);
  const { result, pending, run } = useEditorAction();
  const people = stylists.filter((person) => !person.deleted);
  // A combo groups simple services; a service inside a combo cannot become one.
  const partOfCombo = services.some(
    (item) => !item.deleted && service && item.componentIds.includes(service.id),
  );
  const parts = services.filter(
    (item) =>
      !item.deleted && item.id !== service?.id && !item.componentIds.length,
  );
  const chosenParts = parts.filter((item) => componentIds.includes(item.id));
  const partsDuration = chosenParts.reduce((sum, item) => sum + item.duration, 0);
  const partsPrice = chosenParts.reduce((sum, item) => sum + item.price, 0);

  function close() {
    uploads.discard();
    onClose();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () =>
        saveService({
          id: service?.id ?? null,
          name,
          category,
          description,
          summary,
          duration: Number(duration),
          price: parseCurrencyInput(price),
          image: photo.src,
          imagePosition: photo.position || DEFAULT_POSITION,
          homeImage: homePhoto?.src || null,
          homeImageAlt: homePhoto?.alt ?? "",
          homeImagePosition: homePhoto?.position || DEFAULT_POSITION,
          active,
          popular,
          stylistIds,
          componentIds: partOfCombo ? [] : componentIds,
        }),
      (saved) => {
        uploads.commit([photo.src, homePhoto?.src]);
        onSaved(saved);
      },
    );
  }

  return (
    <Dialog
      open
      onClose={close}
      label={service ? `Editar ${service.name}` : "Novo serviço"}
      className="lb-admin lb-modal lb-modal-wide"
    >
      <form className="lb-form" onSubmit={submit} aria-busy={pending}>
        <div className="lb-form-grid lb-form-grid-2">
          <TextField label="Nome" value={name} max={100} onChange={setName} />
          <TextField
            label="Categoria"
            value={category}
            max={60}
            help="Título do card na página inicial e filtro da página Serviços."
            onChange={setCategory}
          />
          <label className="lb-field">
            Duração (minutos)
            <input
              type="number"
              min={5}
              max={720}
              step={5}
              required
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
          <label className="lb-field">
            Preço a partir de (R$)
            <MaskedInput
              mask="currency"
              required
              value={price}
              placeholder="0,00"
              onValueChange={setPrice}
            />
          </label>
        </div>
        <TextField
          label="Descrição"
          multiline
          value={description}
          max={400}
          help="Página Serviços e escolha do serviço no agendamento."
          onChange={setDescription}
        />
        <TextField
          label="Resumo para a página inicial"
          required={false}
          value={summary}
          max={160}
          help="Sem resumo, a página inicial usa a descrição."
          onChange={setSummary}
        />
        <PhotoField
          label="Foto do serviço"
          folder="services"
          uploads={uploads}
          alt="none"
          aspect="5 / 4"
          value={photo}
          onChange={setPhoto}
        />
        <Checkbox
          label="Usar outra foto na página inicial"
          checked={homePhoto !== null}
          onChange={(checked) =>
            setHomePhoto(
              checked ? { src: "", alt: "", position: DEFAULT_POSITION } : null,
            )
          }
        />
        {homePhoto && (
          <PhotoField
            label="Foto da página inicial"
            folder="services"
            uploads={uploads}
            value={homePhoto}
            onChange={setHomePhoto}
          />
        )}
        <fieldset className="lb-fieldset">
          <legend>Profissionais que realizam</legend>
          {!people.length && <p className="lb-help">Cadastre um profissional primeiro.</p>}
          <div className="lb-checks">
            {people.map((person) => (
              <Checkbox
                key={person.id}
                label={person.name}
                note={person.active ? undefined : "Profissional inativo"}
                checked={stylistIds.includes(person.id)}
                onChange={(checked) =>
                  setStylistIds(
                    checked
                      ? [...stylistIds, person.id]
                      : stylistIds.filter((id) => id !== person.id),
                  )
                }
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="lb-fieldset">
          <legend>Combo</legend>
          {partOfCombo ? (
            <p className="lb-help">
              Este serviço faz parte de um combo e não pode incluir outros.
            </p>
          ) : (
            <>
              <p className="lb-help">
                Marque de 2 a 5 serviços para vender este item como combo. No
                agendamento, o combo não pode ser escolhido junto com eles.
              </p>
              <div className="lb-checks">
                {parts.map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.name}
                    disabled={
                      !componentIds.includes(item.id) && componentIds.length >= 5
                    }
                    checked={componentIds.includes(item.id)}
                    onChange={(checked) =>
                      setComponentIds(
                        checked
                          ? [...componentIds, item.id]
                          : componentIds.filter((id) => id !== item.id),
                      )
                    }
                  />
                ))}
              </div>
              {chosenParts.length > 0 && (
                <button
                  type="button"
                  className="lb-text-button"
                  onClick={() => {
                    setDuration(String(partsDuration));
                    setPrice(formatCurrencyValue(partsPrice));
                  }}
                >
                  Usar a soma dos serviços: {partsDuration} min ·{" "}
                  {currency(partsPrice)}
                </button>
              )}
            </>
          )}
        </fieldset>
        <Checkbox
          label="Ativo no site e no agendamento"
          checked={active}
          onChange={setActive}
        />
        <Checkbox
          label="Destacar como “Mais pedido”"
          note="Mostra o selo no site e no agendamento. Destaque poucos serviços para o selo fazer diferença."
          checked={popular}
          onChange={setPopular}
        />
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          <button type="button" className="lb-button" onClick={close}>
            Cancelar
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending || componentIds.length === 1}
          >
            {pending ? "Salvando…" : "Salvar serviço"}
          </button>
        </div>
        {componentIds.length === 1 && (
          <p className="lb-help">Um combo precisa de pelo menos 2 serviços.</p>
        )}
      </form>
    </Dialog>
  );
}
