"use client";

import { startTransition, useState, type FormEvent } from "react";
import { Eye, PencilSimple, Plus } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useCatalog } from "@/components/catalog-provider";
import { MaskedInput } from "@/components/masked-input";
import { formatPhoneInput } from "@/lib/input-masks";
import { validateContactDetails } from "@/lib/booking-shared";
import {
  charge,
  currency,
  formatDate,
  normalizeSearch,
  paymentLabels,
  statusLabels,
  type AdminAppointment,
  type AdminClient,
  type AdminRole,
} from "@/lib/admin";
import { EmptyState, Initials, Panel, SearchField } from "./ui";
import { MobilePagination, useMobilePagination } from "./mobile-pagination";

export function Clients({
  clients,
  appointments,
  role,
  onSave,
}: {
  clients: AdminClient[];
  appointments: AdminAppointment[];
  role: AdminRole;
  onSave: (client: AdminClient) => Promise<string | null>;
}) {
  const { services } = useCatalog();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminClient | "new" | null>(null);
  const [viewing, setViewing] = useState<AdminClient | null>(null);
  const visible = clients.filter((item) => {
    const term = normalizeSearch(search);
    const digits = term.replace(/\D/g, "");
    return (
      normalizeSearch(`${item.name} ${item.email}`).includes(term) ||
      (digits.length > 0 && item.phone.replace(/\D/g, "").includes(digits))
    );
  });
  const history = viewing
    ? appointments
        .filter((item) => item.clientId === viewing.id)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
        )
    : [];
  const pagination = useMobilePagination(visible.map((item) => item.id));
  const historyPagination = useMobilePagination(history.map((item) => item.id));
  return (
    <>
      <Panel
        title="Clientes do ateliê"
        description={`${clients.length} clientes · informações para um cuidado mais pessoal.`}
        action={
          role === "dono" && (
            <button
              className="lb-button lb-button-primary"
              onClick={() => setEditing("new")}
            >
              <Plus size={17} aria-hidden="true" />
              Novo cliente
            </button>
          )
        }
      >
        <div className="lb-filters">
          <SearchField
            value={search}
            onChange={setSearch}
            label="Buscar cliente"
            placeholder="Nome, telefone ou e-mail…"
          />
        </div>
        {visible.length ? (
          <div className="lb-table-wrap">
            <table className="lb-table lb-client-table">
              <caption className="lb-sr-only">
                Cadastro e histórico de clientes
              </caption>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Último atendimento</th>
                  <th scope="col">Atendimentos</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((client, index) => {
                  const completed = appointments
                    .filter(
                      (item) =>
                        item.clientId === client.id &&
                        item.status === "concluido",
                    )
                    .sort((a, b) => b.date.localeCompare(a.date));
                  const last = completed[0];
                  return (
                    <tr key={client.id} className={pagination.rowClass(index)}>
                      <td data-label="Cliente" className="lb-client-name">
                        <span className="lb-person">
                          <Initials name={client.name} />
                          <span>
                            <strong>{client.name}</strong>
                            <small>
                              {client.notes
                                ? "Possui observações"
                                : "Cliente do ateliê"}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td data-label="Contato" className="lb-client-contact">
                        <span>{formatPhoneInput(client.phone)}</span>
                        <small>{client.email || "Sem e-mail cadastrado"}</small>
                      </td>
                      <td
                        data-label="Último atendimento"
                        className="lb-client-last"
                      >
                        <span>
                          {last
                            ? formatDate(last.date)
                            : "Ainda sem atendimento"}
                        </span>
                        <small>
                          {last
                            ? services.find(
                                (item) => item.id === last.serviceId,
                              )?.name
                            : "Agende o primeiro cuidado"}
                        </small>
                      </td>
                      <td
                        data-label="Atendimentos"
                        className="lb-client-visits"
                      >
                        <strong>{completed.length}</strong>
                        <small>
                          {currency(
                            completed.reduce(
                              (sum, item) => sum + charge(item),
                              0,
                            ),
                          )}{" "}
                          em serviços
                        </small>
                      </td>
                      <td className="lb-client-actions" data-label="Ações">
                        <button
                          className="lb-icon-button"
                          aria-label={`Ver ficha de ${client.name}`}
                          onClick={() => setViewing(client)}
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>
                        {role === "dono" && (
                          <button
                            className="lb-icon-button"
                            aria-label={`Editar cliente ${client.name}`}
                            onClick={() => setEditing(client)}
                          >
                            <PencilSimple size={18} aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {clients.length
              ? "Tente outro nome, telefone ou e-mail para encontrar um cliente."
              : "Os clientes dos seus atendimentos aparecerão aqui."}
          </EmptyState>
        )}
        <MobilePagination {...pagination} label="Páginas de clientes" />
      </Panel>
      {editing && (
        <ClientForm
          key={editing === "new" ? "new" : editing.id}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (client) => {
            const message = await onSave(client);
            if (!message) setEditing(null);
            return message;
          }}
        />
      )}
      {viewing && (
        <Dialog
          open
          onClose={() => setViewing(null)}
          label={viewing.name}
          className="lb-admin lb-modal"
        >
          <div className="lb-client-detail">
            <p>
              {formatPhoneInput(viewing.phone)}
              <br />
              {viewing.email}
            </p>
            <h3>Observações</h3>
            <p>{viewing.notes || "Nenhuma observação cadastrada."}</p>
            <h3>Histórico de atendimentos</h3>
            {history.length ? (
              <ul className="lb-history">
                {history.map((item, index) => (
                  <li
                    key={item.id}
                    className={historyPagination.rowClass(index)}
                  >
                    <div>
                      <strong>
                        {
                          services.find(
                            (service) => service.id === item.serviceId,
                          )?.name
                        }
                      </strong>
                      <small>
                        {formatDate(item.date)} · {item.time} ·{" "}
                        {statusLabels[item.status]}
                      </small>
                    </div>
                    <span>
                      {currency(item.price)}
                      <small>
                        {item.status === "concluido"
                          ? item.paymentMethod
                            ? paymentLabels[item.paymentMethod]
                            : "Pagamento não informado"
                          : "Valor combinado"}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Ainda sem atendimentos. O histórico aparecerá após o primeiro
                agendamento.
              </p>
            )}
            <MobilePagination
              {...historyPagination}
              label="Páginas do histórico"
            />
          </div>
        </Dialog>
      )}
    </>
  );
}

function ClientForm({
  client,
  onClose,
  onSave,
}: {
  client: AdminClient | null;
  onClose: () => void;
  onSave: (client: AdminClient) => Promise<string | null>;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const phone = String(data.get("phone")).trim();
    if (name.length < 2) {
      setError("Informe um nome com pelo menos dois caracteres.");
      return;
    }
    const email = String(data.get("email")).trim();
    const validation = validateContactDetails({ name, phone, email });
    if (Object.keys(validation).length) {
      setError(Object.values(validation)[0]!);
      return;
    }
    setPending(true);
    startTransition(async () => {
      try {
        const message = await onSave({
          id: client?.id ?? crypto.randomUUID(),
          name,
          phone,
          email,
          notes: String(data.get("notes")).trim(),
        });
        if (message) setError(message);
      } catch {
        setError(
          "Não foi possível salvar. Seus dados foram mantidos; tente novamente.",
        );
      } finally {
        setPending(false);
      }
    });
  }
  return (
    <Dialog
      open
      onClose={onClose}
      label={client ? "Editar cliente" : "Novo cliente"}
      className="lb-admin lb-modal"
    >
      <form className="lb-form" onSubmit={submit} aria-busy={pending}>
        <label className="lb-field">
          Nome completo
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            defaultValue={client?.name}
          />
        </label>
        <div className="lb-form-grid">
          <label className="lb-field">
            Telefone com DDD
            <MaskedInput
              mask="phone"
              name="phone"
              autoComplete="tel-national"
              required
              placeholder="(11) 90000-0000"
              defaultValue={client?.phone}
            />
          </label>
          <label className="lb-field">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              defaultValue={client?.email}
            />
          </label>
        </div>
        <label className="lb-field">
          Observações
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={client?.notes}
            placeholder="Preferências e informações para o atendimento"
          />
        </label>
        {error && (
          <p className="lb-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="lb-form-actions">
          <button className="lb-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="lb-button lb-button-primary"
            type="submit"
            disabled={pending}
          >
            {pending ? "Salvando…" : "Salvar cliente"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
