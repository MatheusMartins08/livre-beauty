"use client";

import { startTransition, useState, type FormEvent } from "react";
import { Dialog } from "@/components/dialog";
import { useCatalog } from "@/components/catalog-provider";
import { MaskedInput } from "@/components/masked-input";
import { formatCurrencyValue, parseCurrencyInput } from "@/lib/input-masks";
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
  role,
  stylistId,
  onClose,
  onSave,
}: {
  appointment: AdminAppointment | null;
  date: string;
  clients: AdminClient[];
  appointments: AdminAppointment[];
  role: AdminRole;
  stylistId: string;
  onClose: () => void;
  onSave: (appointment: AdminAppointment) => Promise<string | null>;
}) {
  const catalog = useCatalog();
  const services = catalog.services.filter(
    (item) => item.active || item.id === appointment?.serviceId,
  );
  const stylists = catalog.stylists.filter(
    (item) => item.active || item.id === appointment?.performedBy,
  );
  const [selectedStylist, setSelectedStylist] = useState(
    appointment?.performedBy ?? (stylistId || stylists[0]?.id || ""),
  );
  const [serviceId, setServiceId] = useState(
    appointment?.serviceId ??
      stylists.find((item) => item.id === selectedStylist)?.serviceIds[0] ??
      "",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const compatible = services.filter(
    (item) =>
      stylists
        .find((person) => person.id === selectedStylist)
        ?.serviceIds.includes(item.id) || item.id === appointment?.serviceId,
  );
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
    const next = {
      id: appointment?.id ?? crypto.randomUUID(),
      date: selectedDate,
      time,
      clientId,
      serviceId,
      bookedWith: appointment?.bookedWith ?? selectedStylist,
      performedBy: selectedStylist,
      status,
      price,
      paymentMethod: (String(form.get("payment")) ||
        null) as PaymentMethod | null,
      notes: String(form.get("notes")).trim(),
      durationMinutes:
        appointment &&
        appointment.serviceId === serviceId &&
        appointment.date === selectedDate &&
        appointment.time === time
          ? appointment.durationMinutes
          : services.find((item) => item.id === serviceId)?.duration,
    };
    const validation = appointmentError(next, appointments, catalog);
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
                if (
                  !stylists
                    .find((person) => person.id === value)!
                    .serviceIds.includes(serviceId)
                )
                  setServiceId(
                    stylists.find((person) => person.id === value)!
                      .serviceIds[0],
                  );
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
            Serviço
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              {compatible.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
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
              min="09:00"
              max="19:00"
              step="900"
              required
              defaultValue={appointment?.time ?? "10:00"}
            />
          </label>
          <label className="lb-field">
            Valor combinado (R$)
            <MaskedInput
              mask="currency"
              key={serviceId}
              name="price"
              placeholder="0,00"
              required
              defaultValue={
                formatCurrencyValue(
                  appointment?.serviceId === serviceId
                    ? appointment.price
                    : (services.find((item) => item.id === serviceId)?.price ?? 0),
                )
              }
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
          A duração segue o serviço escolhido. O valor final é combinado com o
          cliente antes do atendimento.
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
            disabled={pending || !clients.length || !serviceId}
          >
            {pending ? "Salvando…" : "Salvar atendimento"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
