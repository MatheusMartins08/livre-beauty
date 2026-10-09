"use client";

import { startTransition, useState, type FormEvent } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useCatalog } from "@/components/catalog-provider";
import { MaskedInput } from "@/components/masked-input";
import { formatCurrencyValue, parseCurrencyInput } from "@/lib/input-masks";
import { MAX_BOOKING_SERVICES, selectionError } from "@/lib/booking-shared";
import type { ScheduleException } from "@/lib/opening-hours";
import {
  appointmentError,
  paymentLabels,
  statusLabels,
  type AdminAppointment,
  type AdminClient,
  type AdminRole,
  type AppointmentStatus,
  type PaymentMethod,
} from "@/lib/admin";

export function AppointmentForm({
  appointment,
  date,
  clients,
  appointments,
  exceptions,
  role,
  stylistId,
  onClose,
  onSave,
}: {
  appointment: AdminAppointment | null;
  date: string;
  clients: AdminClient[];
  appointments: AdminAppointment[];
  exceptions: ScheduleException[];
  role: AdminRole;
  stylistId: string;
  onClose: () => void;
  onSave: (appointment: AdminAppointment) => Promise<string | null>;
}) {
  const catalog = useCatalog();
  const original = appointment?.serviceIds ?? [];
  const services = catalog.services.filter(
    (item) => item.active || original.includes(item.id),
  );
  const stylists = catalog.stylists.filter(
    (item) => item.active || item.id === appointment?.performedBy,
  );
  const [selectedStylist, setSelectedStylist] = useState(
    appointment?.performedBy ?? (stylistId || stylists[0]?.id || ""),
  );
  const [serviceIds, setServiceIds] = useState<string[]>(
    appointment?.serviceIds ??
      stylists
        .find((item) => item.id === selectedStylist)
        ?.serviceIds.slice(0, 1) ??
      [],
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const offered = (id: string, person = selectedStylist) =>
    stylists.find((item) => item.id === person)?.serviceIds.includes(id) ||
    original.includes(id);
  const compatible = services.filter((item) => offered(item.id));
  const selected = serviceIds.flatMap(
    (id) => services.find((item) => item.id === id) ?? [],
  );
  // Unchanged services keep the stored duration; new ones use the catalog.
  const sameServices =
    !!appointment && original.join("+") === serviceIds.join("+");
  const listPrice = selected.reduce((sum, item) => sum + item.price, 0);

  function changeService(index: number, id: string) {
    setServiceIds(serviceIds.map((current, position) => (position === index ? id : current)));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const selectedDate = String(form.get("date"));
    const time = String(form.get("time"));
    const status = String(form.get("status")) as AppointmentStatus;
    const clientId = String(form.get("client"));
    const price = parseCurrencyInput(String(form.get("price")));
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      setError("Informe um valor entre R$ 0,00 e R$ 100.000,00.");
      return;
    }
    const invalidSelection =
      selected.length === serviceIds.length
        ? selectionError(serviceIds, services)
        : "Escolha serviços disponíveis.";
    if (invalidSelection) {
      setError(invalidSelection);
      return;
    }
    const next = {
      id: appointment?.id ?? crypto.randomUUID(),
      code: appointment?.code ?? "",
      cancelledByClient: appointment?.cancelledByClient ?? false,
      date: selectedDate,
      time,
      clientId,
      serviceId: serviceIds[0],
      serviceIds,
      serviceNames: selected.map((item) => item.name),
      bookedWith: appointment?.bookedWith ?? selectedStylist,
      performedBy: selectedStylist,
      status,
      price,
      paymentMethod: (String(form.get("payment")) ||
        null) as PaymentMethod | null,
      notes: String(form.get("notes")).trim(),
      durationMinutes: sameServices
        ? appointment.durationMinutes
        : selected.reduce((sum, item) => sum + item.duration, 0),
    };
    const validation = appointmentError(next, appointments, catalog, exceptions);
    if (validation) {
      setError(validation);
      return;
    }
    setPending(true);
    startTransition(async () => {
      try {
        const message = await onSave(next);
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
      label={appointment ? "Editar atendimento" : "Novo agendamento"}
      className="lb-admin lb-modal"
    >
      <form onSubmit={submit} className="lb-form" aria-busy={pending}>
        <label className="lb-field">
          Cliente
          <select
            name="client"
            defaultValue={appointment?.clientId ?? clients[0]?.id}
            required
          >
            {!clients.length && (
              <option value="">Cadastre um cliente antes de agendar</option>
            )}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <div className="lb-form-grid">
          <label className="lb-field">
            Profissional
            <select
              value={selectedStylist}
              disabled={role === "funcionario"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedStylist(value);
                // Keep only what the new professional offers.
                const kept = serviceIds.filter((id) => offered(id, value));
                const first = stylists.find((person) => person.id === value)
                  ?.serviceIds[0];
                setServiceIds(kept.length ? kept : first ? [first] : []);
              }}
            >
              {stylists.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lb-field">
            Data
            <input
              name="date"
              type="date"
              required
              defaultValue={appointment?.date ?? date}
            />
          </label>
          <label className="lb-field">
            Horário
            <input
              name="time"
              type="time"
              step="900"
              required
              defaultValue={appointment?.time ?? "10:00"}
            />
          </label>
          <label className="lb-field">
            Valor combinado (R$)
            <MaskedInput
              mask="currency"
              key={serviceIds.join("+")}
              name="price"
              placeholder="0,00"
              required
              defaultValue={formatCurrencyValue(
                sameServices ? appointment.price : listPrice,
              )}
            />
          </label>
          <label className="lb-field">
            Status
            <select
              name="status"
              defaultValue={appointment?.status ?? "agendado"}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="lb-fieldset">
          <legend>Serviços, na ordem do atendimento</legend>
          {serviceIds.map((id, index) => (
            <div className="lb-service-row" key={index}>
              <label className="lb-field">
                <span className="lb-sr-only">Serviço {index + 1}</span>
                <select
                  value={id}
                  onChange={(event) => changeService(index, event.target.value)}
                >
                  {compatible
                    .filter(
                      (service) =>
                        service.id === id || !serviceIds.includes(service.id),
                    )
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.duration} min
                      </option>
                    ))}
                </select>
              </label>
              {serviceIds.length > 1 && (
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Remover serviço ${index + 1}`}
                  onClick={() =>
                    setServiceIds(serviceIds.filter((_, position) => position !== index))
                  }
                >
                  <Trash size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          {serviceIds.length < MAX_BOOKING_SERVICES &&
            compatible.some((service) => !serviceIds.includes(service.id)) && (
              <button
                type="button"
                className="lb-text-button"
                onClick={() => {
                  const next = compatible.find(
                    (service) => !serviceIds.includes(service.id),
                  );
                  if (next) setServiceIds([...serviceIds, next.id]);
                }}
              >
                <Plus size={16} aria-hidden="true" />
                Adicionar serviço
              </button>
            )}
        </fieldset>
        <label className="lb-field">
          Forma de pagamento
          <select
            name="payment"
            defaultValue={appointment?.paymentMethod ?? ""}
          >
            <option value="">Não informado</option>
            {Object.entries(paymentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="lb-field">
          Observações
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={appointment?.notes}
            placeholder="Referências, cuidados ou informações do atendimento"
          />
        </label>
        <p className="lb-help">
          A duração é a soma dos serviços escolhidos. O valor final é combinado
          com o cliente antes do atendimento.
        </p>
        {error && (
          <p className="lb-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="lb-form-actions">
          <button type="button" className="lb-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending || !clients.length || !serviceIds.length}
          >
            {pending ? "Salvando…" : "Salvar atendimento"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
