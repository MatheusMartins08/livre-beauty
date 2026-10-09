"use client";

import { useState, type FormEvent } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useCatalog } from "@/components/catalog-provider";
import { Panel } from "@/components/admin/ui";
import type { CatalogStylist } from "@/lib/catalog";
import { DEFAULT_POSITION } from "@/lib/media";
import {
  deleteCatalogItem,
  reorderCatalog,
  saveStylist,
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
import { StaffAccessPanel, type StaffAccount } from "./staff-access-panel";

export function StylistsEditor({
  accounts,
}: {
  accounts: Record<string, StaffAccount>;
}) {
  const { stylists } = useCatalog();
  const people = stylists.filter((person) => !person.deleted);
  const [editing, setEditing] = useState<CatalogStylist | "new" | null>(null);
  const { result, setResult, pending, run } = useEditorAction();

  function remove(person: CatalogStylist) {
    if (
      !window.confirm(
        `Excluir ${person.name}? Quem tem atendimentos é arquivado para manter o histórico. O acesso dessa pessoa ao painel também é removido.`,
      )
    )
      return;
    void run(() => deleteCatalogItem("stylists", person.id));
  }

  return (
    <Panel
      title="Profissionais"
      description="Equipe exibida no site e disponível no agendamento, na ordem abaixo."
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
          Novo profissional
        </button>
      }
    >
      <div className="lb-editor-body">
        <EditorFeedback result={result} />
        <ul className="lb-catalog-list" aria-busy={pending}>
          {people.map((person, index) => (
            <li key={person.id}>
              <span
                className="lb-catalog-thumb"
                style={{
                  backgroundImage: `url("${person.image}")`,
                  backgroundPosition: person.imagePosition,
                }}
                aria-hidden="true"
              />
              <span className="lb-catalog-copy">
                <strong>{person.name}</strong>
                <small>
                  {person.role} · {person.serviceIds.length} serviço
                  {person.serviceIds.length === 1 ? "" : "s"}
                  {accounts[person.id]?.login &&
                    ` · Painel: ${accounts[person.id].login}${accounts[person.id].active ? "" : " (desativado)"}`}
                </small>
              </span>
              {!person.active && (
                <span className="lb-badge lb-badge-neutral">Inativo</span>
              )}
              <ListItemActions
                label={person.name}
                index={index}
                length={people.length}
                disabled={pending}
                onMove={(from, to) =>
                  void run(() =>
                    reorderCatalog(
                      "stylists",
                      moveItem(people, from, to).map((item) => item.id),
                    ),
                  )
                }
              />
              <div className="lb-item-actions">
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Editar ${person.name}`}
                  onClick={() => {
                    setResult(null);
                    setEditing(person);
                  }}
                >
                  <PencilSimple size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Excluir ${person.name}`}
                  disabled={pending}
                  onClick={() => remove(person)}
                >
                  <Trash size={17} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {editing && (
        <StylistForm
          stylist={editing === "new" ? null : editing}
          account={editing === "new" ? undefined : accounts[editing.id]}
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

function StylistForm({
  stylist,
  account,
  onClose,
  onSaved,
}: {
  stylist: CatalogStylist | null;
  account: StaffAccount | undefined;
  onClose: () => void;
  onSaved: (result: EditorResult) => void;
}) {
  const { services } = useCatalog();
  const available = services.filter((service) => !service.deleted);
  const uploads = useUploads();
  const [name, setName] = useState(stylist?.name ?? "");
  const [role, setRole] = useState(stylist?.role ?? "");
  const [experience, setExperience] = useState(String(stylist?.experience ?? 0));
  const [specialties, setSpecialties] = useState(
    stylist?.specialties.join(", ") ?? "",
  );
  const [description, setDescription] = useState(stylist?.description ?? "");
  const [biography, setBiography] = useState(stylist?.biography ?? "");
  const [photo, setPhoto] = useState({
    src: stylist?.image ?? "",
    alt: "",
    position: stylist?.imagePosition ?? DEFAULT_POSITION,
  });
  const [active, setActive] = useState(stylist?.active ?? true);
  const [serviceIds, setServiceIds] = useState(stylist?.serviceIds ?? []);
  const { result, pending, run } = useEditorAction();

  function close() {
    uploads.discard();
    onClose();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () =>
        saveStylist({
          id: stylist?.id ?? null,
          name,
          role,
          experience: Number(experience),
          specialties: specialties
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          description,
          biography,
          image: photo.src,
          imagePosition: photo.position || DEFAULT_POSITION,
          active,
          serviceIds,
        }),
      (saved) => {
        uploads.commit(photo.src);
        onSaved(saved);
      },
    );
  }

  return (
    <Dialog
      open
      onClose={close}
      label={stylist ? `Editar ${stylist.name}` : "Novo profissional"}
      className="lb-admin lb-modal lb-modal-wide"
    >
      <form className="lb-form" onSubmit={submit} aria-busy={pending}>
        <div className="lb-form-grid lb-form-grid-2">
          <TextField label="Nome" value={name} max={100} onChange={setName} />
          <TextField
            label="Função exibida"
            value={role}
            max={80}
            placeholder="Especialista em cor"
            onChange={setRole}
          />
          <label className="lb-field">
            Anos de experiência
            <input
              type="number"
              min={0}
              max={80}
              required
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </label>
          <TextField
            label="Especialidades"
            value={specialties}
            max={340}
            help="Separe por vírgulas. Até 8."
            onChange={setSpecialties}
          />
        </div>
        <TextField
          label="Descrição curta"
          multiline
          value={description}
          max={400}
          help="Aparece nos cards da equipe."
          onChange={setDescription}
        />
        <TextField
          label="Biografia"
          multiline
          rows={5}
          value={biography}
          max={1500}
          help="Aparece na página do profissional."
          onChange={setBiography}
        />
        <PhotoField
          label="Retrato"
          folder="stylists"
          uploads={uploads}
          alt="none"
          aspect="3 / 4"
          value={photo}
          onChange={setPhoto}
        />
        <fieldset className="lb-fieldset">
          <legend>Serviços que realiza</legend>
          <div className="lb-checks">
            {available.map((service) => (
              <Checkbox
                key={service.id}
                label={service.name}
                note={service.active ? undefined : "Serviço inativo"}
                checked={serviceIds.includes(service.id)}
                onChange={(checked) =>
                  setServiceIds(
                    checked
                      ? [...serviceIds, service.id]
                      : serviceIds.filter((id) => id !== service.id),
                  )
                }
              />
            ))}
          </div>
        </fieldset>
        <Checkbox
          label="Ativo no site e no agendamento"
          checked={active}
          onChange={setActive}
        />
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          <button type="button" className="lb-button" onClick={close}>
            Cancelar
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending}
          >
            {pending ? "Salvando…" : "Salvar profissional"}
          </button>
        </div>
      </form>
      {stylist ? (
        <StaffAccessPanel stylistId={stylist.id} name={stylist.name} account={account} />
      ) : (
        <p className="lb-help">
          Depois de salvar o profissional, abra o cadastro de novo para criar o
          acesso ao painel.
        </p>
      )}
    </Dialog>
  );
}
