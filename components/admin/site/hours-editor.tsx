"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import { Panel } from "@/components/admin/ui";
import {
  formatDate,
  timeInMinutes,
  type AdminAppointment,
  type AdminClient,
} from "@/lib/admin";
import {
  exceptionLabels,
  formatWeeklyHours,
  fromMinutes,
  periodsForDate,
  toMinutes,
  validateWeek,
  weekdayNames,
  weekOrder,
  type ExceptionKind,
  type OpeningPeriod,
  type ScheduleException,
} from "@/lib/opening-hours";
import {
  createScheduleException,
  deleteScheduleException,
  saveBookingRules,
  saveOpeningPeriods,
} from "@/lib/site-actions";
import { Checkbox, EditorFeedback, TextField } from "./fields";
import { useEditorAction } from "./use-editor-action";

export interface BookingRules {
  showPrices: boolean;
  bookingWindowDays: number;
  slotIntervalMinutes: number;
  commissionRate: number;
}

export function HoursEditor({
  today,
  appointments,
  clients,
  exceptions,
  settings,
}: {
  today: string;
  appointments: AdminAppointment[];
  clients: AdminClient[];
  exceptions: ScheduleException[];
  settings: BookingRules | null;
}) {
  const upcoming = appointments.filter(
    (item) => item.status === "agendado" && item.date >= today,
  );
  return (
    <div className="lb-editor-stack">
      <WeekForm
        upcoming={upcoming}
        clients={clients}
        exceptions={exceptions}
      />
      <ExceptionsPanel
        today={today}
        upcoming={upcoming}
        exceptions={exceptions}
      />
      {settings && <BookingRulesForm settings={settings} />}
    </div>
  );
}

function fits(appointment: AdminAppointment, periods: { opens_at: string; closes_at: string }[]) {
  const start = timeInMinutes(appointment.time);
  const end = start + (appointment.durationMinutes ?? 0);
  return periods.some(
    (period) => start >= toMinutes(period.opens_at) && end <= toMinutes(period.closes_at),
  );
}

function WeekForm({
  upcoming,
  clients,
  exceptions,
}: {
  upcoming: AdminAppointment[];
  clients: AdminClient[];
  exceptions: ScheduleException[];
}) {
  const { openingPeriods } = useCatalog();
  // Stable keys keep the focused time input while its value changes.
  const keyed = () =>
    openingPeriods.map((period, index) => ({ ...period, key: `saved-${index}` }));
  const [periods, setPeriods] = useState<(OpeningPeriod & { key: string })[]>(keyed);
  const [confirmed, setConfirmed] = useState(false);
  const { result, pending, run } = useEditorAction();
  const errors = validateWeek(periods);
  // Existing appointments are kept; the owner decides whether to contact clients.
  const outside = upcoming.filter(
    (item) => !fits(item, periodsForDate(item.date, periods, exceptions)),
  );

  function update(key: string, next: Partial<OpeningPeriod> | null) {
    setPeriods(
      next
        ? periods.map((period) => (period.key === key ? { ...period, ...next } : period))
        : periods.filter((period) => period.key !== key),
    );
    setConfirmed(false);
  }
  function add(weekday: number) {
    const day = periods.filter((period) => period.weekday === weekday);
    const latest = Math.max(0, ...day.map((period) => toMinutes(period.closes_at)));
    const start = day.length ? Math.min(latest + 60, 22 * 60) : 9 * 60;
    setPeriods([
      ...periods,
      {
        key: crypto.randomUUID(),
        weekday,
        opens_at: fromMinutes(start),
        closes_at: fromMinutes(Math.min(start + 4 * 60, 23 * 60 + 30)),
      },
    ]);
    setConfirmed(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || errors.length || (outside.length && !confirmed)) return;
    void run(
      () =>
        saveOpeningPeriods(
          periods.map(({ weekday, opens_at, closes_at }) => ({
            weekday,
            opens_at,
            closes_at,
          })),
        ),
      () => setConfirmed(false),
    );
  }

  return (
    <Panel
      title="Horários da semana"
      description={`No site: ${formatWeeklyHours(periods)}.`}
    >
      <form className="lb-form lb-editor-body" onSubmit={submit} aria-busy={pending}>
        <div className="lb-week">
          {weekOrder.map((weekday) => {
            const day = periods
              .filter((period) => period.weekday === weekday)
              .sort((a, b) => a.opens_at.localeCompare(b.opens_at));
            const name = weekdayNames[weekday];
            return (
              <fieldset key={weekday} className="lb-week-day">
                <legend>{name.charAt(0).toUpperCase() + name.slice(1)}</legend>
                {!day.length && <span className="lb-badge lb-badge-neutral">Fechado</span>}
                {day.map((period, index) => (
                  <div className="lb-period" key={period.key}>
                    <label className="lb-field">
                      <span className="lb-sr-only">Início do período {index + 1} de {name}</span>
                      <input
                        type="time"
                        step={900}
                        value={period.opens_at}
                        onChange={(event) =>
                          update(period.key, { opens_at: event.target.value })
                        }
                      />
                    </label>
                    <span aria-hidden="true">às</span>
                    <label className="lb-field">
                      <span className="lb-sr-only">Fim do período {index + 1} de {name}</span>
                      <input
                        type="time"
                        step={900}
                        value={period.closes_at}
                        onChange={(event) =>
                          update(period.key, { closes_at: event.target.value })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="lb-icon-button"
                      aria-label={`Remover período ${index + 1} de ${name}`}
                      onClick={() => update(period.key, null)}
                    >
                      <Trash size={17} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {day.length < 6 && (
                  <button type="button" className="lb-text-button" onClick={() => add(weekday)}>
                    <Plus size={16} aria-hidden="true" />
                    {day.length ? "Adicionar período" : "Abrir neste dia"}
                  </button>
                )}
              </fieldset>
            );
          })}
        </div>
        <p className="lb-help">
          Use dois períodos para registrar uma pausa, como 9h às 12h e 13h às 19h.
          Um atendimento precisa caber inteiro em um período.
        </p>
        {errors.length > 0 && (
          <p className="lb-form-error" role="alert">
            {errors.join(" ")}
          </p>
        )}
        {outside.length > 0 && (
          <div className="lb-warning" role="status">
            <p>
              {outside.length} atendimento{outside.length === 1 ? "" : "s"} agendado
              {outside.length === 1 ? "" : "s"} ficaria{outside.length === 1 ? "" : "m"} fora
              dos novos horários. Eles continuam na agenda; combine a mudança com os clientes.
            </p>
            <ul>
              {outside.slice(0, 8).map((item) => (
                <li key={item.id}>
                  {formatDate(item.date)} às {item.time} ·{" "}
                  {clients.find((client) => client.id === item.clientId)?.name ?? "Cliente"}
                </li>
              ))}
            </ul>
            <Checkbox
              label="Entendi, salvar mesmo assim"
              checked={confirmed}
              onChange={setConfirmed}
            />
          </div>
        )}
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          <button
            type="button"
            className="lb-button"
            onClick={() => {
              setPeriods(keyed());
              setConfirmed(false);
            }}
          >
            Descartar alterações
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending || errors.length > 0 || (outside.length > 0 && !confirmed)}
          >
            {pending ? "Salvando…" : "Salvar horários"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function ExceptionsPanel({
  today,
  upcoming,
  exceptions,
}: {
  today: string;
  upcoming: AdminAppointment[];
  exceptions: ScheduleException[];
}) {
  const { stylists } = useCatalog();
  const people = stylists.filter((person) => !person.deleted);
  const [kind, setKind] = useState<ExceptionKind>("fechado");
  const [stylistId, setStylistId] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [opensAt, setOpensAt] = useState("12:00");
  const [closesAt, setClosesAt] = useState("13:00");
  const [reason, setReason] = useState("");
  const { result, setResult, pending, run } = useEditorAction();
  const current = exceptions
    .filter((item) => item.endsOn >= today)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const timed = kind !== "fechado";
  const forSalon = kind === "horario_especial" || !stylistId;
  const affected = upcoming.filter(
    (item) =>
      item.date >= startsOn &&
      item.date <= (endsOn || startsOn) &&
      (forSalon || item.performedBy === stylistId),
  ).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () =>
        createScheduleException({
          kind,
          stylistId: forSalon ? null : stylistId,
          startsOn,
          endsOn: endsOn || startsOn,
          opensAt: timed ? opensAt : null,
          closesAt: timed ? closesAt : null,
          reason,
        }),
      (saved) => {
        setResult(saved);
        setReason("");
      },
    );
  }

  return (
    <Panel
      title="Feriados, folgas e exceções"
      description="Valem para o site e o agendamento nas datas escolhidas, sem alterar a semana."
    >
      <div className="lb-editor-body">
        {current.length ? (
          <ul className="lb-catalog-list">
            {current.map((item) => (
              <li key={item.id}>
                <span className="lb-catalog-copy">
                  <strong>
                    {exceptionLabels[item.kind]}
                    {item.kind !== "fechado" && ` · ${item.opensAt} às ${item.closesAt}`}
                  </strong>
                  <small>
                    {formatDate(item.startsOn)}
                    {item.endsOn !== item.startsOn && ` a ${formatDate(item.endsOn)}`} ·{" "}
                    {item.stylistId
                      ? (stylists.find((person) => person.id === item.stylistId)?.name ??
                        "Profissional")
                      : "Todo o ateliê"}
                    {item.reason && ` · ${item.reason}`}
                  </small>
                </span>
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Remover ${exceptionLabels[item.kind].toLowerCase()} de ${formatDate(item.startsOn)}`}
                  disabled={pending}
                  onClick={() => void run(() => deleteScheduleException(item.id))}
                >
                  <Trash size={17} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lb-help">Nenhuma exceção a partir de hoje.</p>
        )}
        <form className="lb-form" onSubmit={submit} aria-busy={pending}>
          <h3 className="lb-subheading">Nova exceção</h3>
          <div className="lb-form-grid lb-form-grid-2">
            <label className="lb-field">
              Tipo
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as ExceptionKind)}
              >
                <option value="fechado">Fechado o dia todo (feriado ou folga)</option>
                <option value="horario_especial">Horário especial do ateliê</option>
                <option value="bloqueio">Bloqueio de horário</option>
              </select>
            </label>
            <label className="lb-field">
              Para quem
              <select
                value={kind === "horario_especial" ? "" : stylistId}
                disabled={kind === "horario_especial"}
                onChange={(event) => setStylistId(event.target.value)}
              >
                <option value="">Todo o ateliê</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="lb-field">
              De
              <input
                type="date"
                required
                min={today}
                value={startsOn}
                onChange={(event) => {
                  setStartsOn(event.target.value);
                  if (endsOn < event.target.value) setEndsOn(event.target.value);
                }}
              />
            </label>
            <label className="lb-field">
              Até
              <input
                type="date"
                required
                min={startsOn}
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
              />
            </label>
            {timed && (
              <>
                <label className="lb-field">
                  {kind === "bloqueio" ? "Bloquear das" : "Abrir às"}
                  <input
                    type="time"
                    step={900}
                    required
                    value={opensAt}
                    onChange={(event) => setOpensAt(event.target.value)}
                  />
                </label>
                <label className="lb-field">
                  {kind === "bloqueio" ? "Até" : "Fechar às"}
                  <input
                    type="time"
                    step={900}
                    required
                    value={closesAt}
                    onChange={(event) => setClosesAt(event.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          <TextField
            label="Motivo"
            required={false}
            value={reason}
            max={120}
            help="Visível apenas para a equipe."
            onChange={setReason}
          />
          {affected > 0 && (
            <p className="lb-warning" role="status">
              {affected} atendimento{affected === 1 ? "" : "s"} agendado
              {affected === 1 ? "" : "s"} nessas datas continua
              {affected === 1 ? "" : "m"} na agenda. Confira se precisa remarcar.
            </p>
          )}
          <EditorFeedback result={result} />
          <div className="lb-form-actions">
            <button type="submit" className="lb-button lb-button-primary" disabled={pending}>
              {pending ? "Salvando…" : "Adicionar exceção"}
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

function BookingRulesForm({ settings }: { settings: BookingRules }) {
  const [showPrices, setShowPrices] = useState(settings.showPrices);
  const [windowDays, setWindowDays] = useState(String(settings.bookingWindowDays));
  const [slotInterval, setSlotInterval] = useState(settings.slotIntervalMinutes);
  const [commission, setCommission] = useState(
    String(Math.round(settings.commissionRate * 10000) / 100),
  );
  const { result, setResult, pending, run } = useEditorAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () =>
        saveBookingRules({
          showPrices,
          bookingWindowDays: Number(windowDays),
          slotIntervalMinutes: slotInterval,
          commissionRate: Number(commission.replace(",", ".")) / 100,
        }),
      setResult,
    );
  }

  return (
    <Panel
      title="Regras do agendamento"
      description="Preços no site, antecedência máxima, intervalo entre horários e comissão da equipe."
    >
      <form className="lb-form lb-editor-body" onSubmit={submit} aria-busy={pending}>
        <Checkbox
          label="Mostrar preços no site"
          note="Desmarcado, o site mostra “Investimento sob consulta”."
          checked={showPrices}
          onChange={setShowPrices}
        />
        <div className="lb-form-grid lb-form-grid-3">
          <label className="lb-field">
            Agendar com até (dias)
            <input
              type="number"
              min={1}
              max={365}
              required
              value={windowDays}
              onChange={(event) => setWindowDays(event.target.value)}
            />
          </label>
          <label className="lb-field">
            Intervalo entre horários
            <select
              value={slotInterval}
              onChange={(event) => setSlotInterval(Number(event.target.value))}
            >
              {[10, 15, 20, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
            </select>
          </label>
          <label className="lb-field">
            Comissão da equipe (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              required
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
            />
          </label>
        </div>
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          <button type="submit" className="lb-button lb-button-primary" disabled={pending}>
            {pending ? "Salvando…" : "Salvar regras"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
