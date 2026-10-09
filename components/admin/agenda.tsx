"use client";

import { useState } from "react";
import { ArrowUpRight, PencilSimple, Plus } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import {
  charge,
  currency,
  normalizeSearch,
  paymentLabels,
  serviceLabel,
  statusLabels,
  type AdminAppointment,
  type AdminClient,
  type AdminRole,
  type AppointmentStatus,
} from "@/lib/admin";
import { EmptyState, Initials, Panel, Person, SearchField } from "./ui";
import { MobilePagination, useMobilePagination } from "./mobile-pagination";

export function Agenda({
  appointments,
  clients,
  role,
  onEdit,
  onNew,
  onStatusChange,
  preview = false,
  onSeeAll,
}: {
  appointments: AdminAppointment[];
  clients: AdminClient[];
  role: AdminRole;
  onEdit: (appointment: AdminAppointment) => void;
  onNew: () => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  preview?: boolean;
  onSeeAll?: () => void;
}) {
  const { services, stylists } = useCatalog();
  const [search, setSearch] = useState("");
  const [professional, setProfessional] = useState("todos");
  const [status, setStatus] = useState("todos");
  const visible = appointments
    .filter((appointment) => {
      const client = clients.find((item) => item.id === appointment.clientId);
      const query = normalizeSearch(search);
      return (
        (normalizeSearch(client?.name ?? "").includes(query) ||
          normalizeSearch(appointment.code).includes(query)) &&
        (professional === "todos" ||
          appointment.performedBy === professional) &&
        (status === "todos" || appointment.status === status)
      );
    })
    .sort(
      (a, b) =>
        a.time.localeCompare(b.time) ||
        a.performedBy.localeCompare(b.performedBy),
    );
  const rows = preview ? visible.slice(0, 6) : visible;
  const pagination = useMobilePagination(
    rows.map((item) => item.id),
    preview ? 3 : 4,
  );
  return (
    <Panel
      title={preview ? "Atendimentos do dia" : "Agenda do dia"}
      description={`${appointments.filter((item) => item.status !== "cancelado").length} horários reservados · acompanhe cada atendimento.`}
      action={
        preview ? (
          <button className="lb-text-button" onClick={onSeeAll}>
            Ver agenda
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button className="lb-button lb-button-primary" onClick={onNew}>
            <Plus size={17} aria-hidden="true" />
            Novo agendamento
          </button>
        )
      }
    >
      {!preview && (
        <div className="lb-filters">
          <SearchField
            value={search}
            onChange={setSearch}
            label="Buscar atendimento"
            placeholder="Buscar cliente ou código…"
          />
          {role === "dono" && (
            <label className="lb-filter">
              <span className="lb-sr-only">Filtrar profissional</span>
              <select
                value={professional}
                onChange={(event) => setProfessional(event.target.value)}
              >
                <option value="todos">Todos os profissionais</option>
                {stylists.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="lb-filter">
            <span className="lb-sr-only">Filtrar status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="todos">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {rows.length ? (
        <div className="lb-table-wrap">
          <table className="lb-table lb-agenda-table">
            <caption className="lb-sr-only">
              Atendimentos da data selecionada
            </caption>
            <thead>
              <tr>
                <th scope="col">Horário</th>
                <th scope="col">Cliente / serviço</th>
                {role === "dono" && <th scope="col">Profissional</th>}
                <th scope="col">Valor</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="lb-sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((appointment, index) => {
                const client = clients.find(
                  (item) => item.id === appointment.clientId,
                );
                const clientName = client?.name ?? "Cliente";
                const service = services.find(
                  (item) => item.id === appointment.serviceId,
                );
                return (
                  <tr
                    key={appointment.id}
                    className={pagination.rowClass(index)}
                  >
                    <td data-label="Horário" className="lb-appointment-time">
                      <strong className="lb-time">{appointment.time}</strong>
                      <small>
                        {appointment.durationMinutes ??
                          service?.duration ??
                          "—"}{" "}
                        min
                      </small>
                      {appointment.code && (
                        <small className="lb-code">{appointment.code}</small>
                      )}
                    </td>
                    <td
                      data-label="Cliente / serviço"
                      className="lb-appointment-client"
                    >
                      <span className="lb-person">
                        <Initials name={clientName} />
                        <span>
                          <strong>{clientName}</strong>
                          <small>
                            {serviceLabel(appointment) ||
                              service?.name ||
                              "Serviço indisponível"}
                          </small>
                        </span>
                      </span>
                    </td>
                    {role === "dono" && (
                      <td
                        data-label="Profissional"
                        className="lb-appointment-professional"
                      >
                        <Person stylistId={appointment.performedBy} compact />
                        {appointment.bookedWith === null ? (
                          <small>Sem preferência</small>
                        ) : (
                          appointment.bookedWith !==
                            appointment.performedBy && (
                            <small>Reatribuído na agenda</small>
                          )
                        )}
                      </td>
                    )}
                    <td data-label="Valor" className="lb-appointment-price">
                      <strong>{currency(charge(appointment))}</strong>
                      <small>
                        {appointment.status === "concluido"
                          ? appointment.paymentMethod
                            ? paymentLabels[appointment.paymentMethod]
                            : "Pagamento não informado"
                          : "Valor combinado"}
                      </small>
                    </td>
                    <td data-label="Status" className="lb-appointment-status">
                      <label
                        className={`lb-status lb-status-${appointment.status}`}
                      >
                        <span className="lb-sr-only">
                          Status de {clientName} às {appointment.time}
                        </span>
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            onStatusChange(
                              appointment.id,
                              event.target.value as AppointmentStatus,
                            )
                          }
                        >
                          {Object.entries(statusLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      {appointment.cancelledByClient && (
                        <small>Cancelado pelo cliente no site</small>
                      )}
                    </td>
                    <td className="lb-row-action">
                      <button
                        className="lb-icon-button"
                        aria-label={`Editar atendimento de ${clientName} às ${appointment.time}`}
                        onClick={() => onEdit(appointment)}
                      >
                        <PencilSimple size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={
            appointments.length
              ? "Nenhum atendimento com esses filtros"
              : "A agenda está livre"
          }
        >
          {appointments.length
            ? "Tente outro nome, profissional ou status."
            : "Escolha outra data ou adicione um agendamento para começar."}
        </EmptyState>
      )}
      {!preview && (
        <MobilePagination {...pagination} label="Páginas da agenda" />
      )}
      {preview && visible.length > 6 && (
        <div className="lb-panel-foot">
          <span>
            Exibindo <span className="lb-desktop-only">6</span>
            <span className="lb-compact-only">3</span> de {visible.length}{" "}
            atendimentos
          </span>
          <button className="lb-text-button" onClick={onSeeAll}>
            Ver todos
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </Panel>
  );
}
