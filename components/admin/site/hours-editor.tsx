"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import { Panel } from "@/components/admin/ui";
import {
  formatDate,
  retentionOptions,
  timeInMinutes,
  type AdminAppointment,
  type AdminClient,
} from "@/lib/admin";
import {
  exceptionLabels,
  formatWeeklyHours,
  fromMinutes,
  ownPeriodsForDate,
  periodsForDate,
  periodsOfWeekday,
  toMinutes,
  validateWeek,
  weekdayNames,
  weekOrder,
  type DayPeriod,
  type ExceptionKind,
  type OpeningPeriod,
  type ScheduleException,
} from "@/lib/opening-hours";
import {
  createScheduleException,
  deleteScheduleException,
  previewHistoryPurge,
  saveBookingRules,
  saveOpeningPeriods,
  type PurgePreview,
} from "@/lib/site-actions";
import { Checkbox, EditorFeedback, TextField } from "./fields";
import { useEditorAction } from "./use-editor-action";

export interface BookingRules {
  showPrices: boolean;
  bookingWindowDays: number;
  slotIntervalMinutes: number;
  commissionRate: number;
  cancelNoticeMinutes: number;
  historyRetentionMonths: number | null;
}

/**
 * The salon's hours (owner) or one professional's: the owner picks anyone,
 * a team member sees only their own (ownStylistId).
 */
export function HoursEditor({
  today,
  appointments,
  clients,
  exceptions,
  settings,
  ownStylistId,
}: {
  today: string;
  appointments: AdminAppointment[];
  clients: AdminClient[];
  exceptions: ScheduleException[];
  settings: BookingRules | null;
  ownStylistId?: string;
}) {
  const { stylists, stylistPeriods } = useCatalog();
  const people = stylists.filter((person) => !person.deleted);
  const [scope, setScope] = useState(ownStylistId ?? "");
  const stylistId = scope || null;
  const person = people.find((item) => item.id === scope);
  const upcoming = appointments.filter(
    (item) =>
      item.status === "agendado" &&
      item.date >= today &&
      (stylistId === null || item.performedBy === stylistId),
  );
  return (
    <div className="lb-editor-stack">
      {!ownStylistId && (
        <label className="lb-field lb-scope-select">
          Horário de
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="">Ateliê (site e agendamento)</option>
            {people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ·{" "}
                {stylistPeriods.some((period) => period.stylistId === item.id)
                  ? "horário próprio"
                  : "segue o ateliê"}
              </option>
            ))}
          </select>
        </label>
      )}
      <WeekForm
        key={`week-${scope}`}
        stylistId={stylistId}
        name={person?.name ?? ""}
        self={Boolean(ownStylistId)}
        upcoming={upcoming}
        clients={clients}
        exceptions={exceptions}
      />
      <ExceptionsPanel
        key={`exceptions-${scope}`}
        stylistId={stylistId}
        name={person?.name ?? ""}
        self={Boolean(ownStylistId)}
        today={today}
        upcoming={upcoming}
        exceptions={exceptions}
      />
      {settings && stylistId === null && <BookingRulesForm settings={settings} />}
    </div>
  );
}

function fits(appointment: AdminAppointment, periods: DayPeriod[]) {
  const start = timeInMinutes(appointment.time);
  const end = start + (appointment.durationMinutes ?? 0);
  return periods.some(
    (period) => start >= toMinutes(period.opens_at) && end <= toMinutes(period.closes_at),
  );
}

type EditablePeriod = OpeningPeriod & { key: string };

// Stable keys keep the focused time input while its value changes.
function keyed(periods: OpeningPeriod[], prefix: string): EditablePeriod[] {
  return periods.map(({ weekday, opens_at, closes_at }, index) => ({
    weekday,
    opens_at,
    closes_at,
    key: `${prefix}-${index}`,
  }));
}

function WeekForm({
  stylistId,
  name,
  self,
  upcoming,
  clients,
  exceptions,
}: {
  stylistId: string | null;
  name: string;
  self: boolean;
  upcoming: AdminAppointment[];
  clients: AdminClient[];
  exceptions: ScheduleException[];
}) {
  const { openingPeriods, stylistPeriods } = useCatalog();
  const saved =
    stylistId === null
      ? openingPeriods
      : stylistPeriods.filter((period) => period.stylistId === stylistId);
  // Without own periods, a professional follows the salon until they customize.
  const following = stylistId !== null && saved.length === 0;
  const [customizing, setCustomizing] = useState(false);
  const editing = !following || customizing;
  const [periods, setPeriods] = useState<EditablePeriod[]>(() => keyed(saved, "saved"));
  const [confirmed, setConfirmed] = useState(false);
  const { result, setResult, pending, run } = useEditorAction();
  const errors = validateWeek(periods);
  const emptyWeek = stylistId !== null && editing && periods.length === 0;
  // Existing appointments are kept; the owner decides whether to contact clients.
  const outside = editing
    ? upcoming.filter((item) => {
        const salon = periodsForDate(
          item.date,
          stylistId === null ? periods : openingPeriods,
          exceptions,
        );
        if (stylistId === null) return !fits(item, salon);
        const own = ownPeriodsForDate(
          item.date,
          stylistId,
          periods.map((period) => ({ ...period, stylistId })),
          exceptions,
        );
        return !fits(item, salon) || (own !== null && !fits(item, own));
      })
    : [];
  // Own periods only count where the salon is also open.
  const beyondSalon =
    stylistId !== null &&
    periods.some(
      (period) =>
        !periodsOfWeekday(period.weekday, openingPeriods).some(
          (salon) => period.opens_at >= salon.opens_at && period.closes_at <= salon.closes_at,
        ),
    );
  const title =
    stylistId === null ? "Horários da semana" : self ? "Minha semana" : `Semana de ${name}`;
  const description =
    stylistId === null
      ? `No site: ${formatWeeklyHours(periods)}.`
      : !editing
        ? `Segue o horário do ateliê: ${formatWeeklyHours(openingPeriods)}.`
        : `${formatWeeklyHours(periods)}. Vale dentro do horário do ateliê.`;

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
  function customize() {
    setPeriods(keyed(openingPeriods, "salon"));
    setCustomizing(true);
    setResult(null);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || errors.length || emptyWeek || (outside.length && !confirmed)) return;
    void run(
      () =>
        saveOpeningPeriods(
          periods.map(({ weekday, opens_at, closes_at }) => ({
            weekday,
            opens_at,
            closes_at,
          })),
          stylistId,
        ),
      (saved) => {
        setConfirmed(false);
        setCustomizing(false);
        setResult(saved);
      },
    );
  }
  function followSalon() {
    if (
      pending ||
      !window.confirm(
        `${self ? "Seu horário" : `O horário de ${name}`} voltará a seguir o do ateliê. Continuar?`,
      )
    )
      return;
    void run(
      () => saveOpeningPeriods([], stylistId),
      (saved) => {
        setPeriods([]);
        setCustomizing(false);
        setResult(saved);
      },
    );
  }

  if (!editing)
    return (
      <Panel title={title} description={description}>
        <div className="lb-editor-body">
          <p className="lb-help">
            {self ? "Você atende" : `${name} atende`} em todos os horários do
            ateliê. Personalize para registrar dias e horários próprios; as
            folgas pontuais ficam nas exceções abaixo.
          </p>
          <EditorFeedback result={result} />
          <div className="lb-form-actions">
            <button type="button" className="lb-button lb-button-primary" onClick={customize}>
              Personalizar horário
            </button>
          </div>
        </div>
      </Panel>
    );

  return (
    <Panel title={title} description={description}>
      <form className="lb-form lb-editor-body" onSubmit={submit} aria-busy={pending}>
        <div className="lb-week">
          {weekOrder.map((weekday) => {
            const day = periods
              .filter((period) => period.weekday === weekday)
              .sort((a, b) => a.opens_at.localeCompare(b.opens_at));
            const dayName = weekdayNames[weekday];
            return (
              <fieldset key={weekday} className="lb-week-day">
                <legend>{dayName.charAt(0).toUpperCase() + dayName.slice(1)}</legend>
                {!day.length && (
                  <span className="lb-badge lb-badge-neutral">
                    {stylistId === null ? "Fechado" : "Folga"}
                  </span>
                )}
                {day.map((period, index) => (
                  <div className="lb-period" key={period.key}>
                    <label className="lb-field">
                      <span className="lb-sr-only">Início do período {index + 1} de {dayName}</span>
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
                      <span className="lb-sr-only">Fim do período {index + 1} de {dayName}</span>
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
                      aria-label={`Remover período ${index + 1} de ${dayName}`}
                      onClick={() => update(period.key, null)}
                    >
                      <Trash size={17} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {day.length < 6 && (
                  <button type="button" className="lb-text-button" onClick={() => add(weekday)}>
                    <Plus size={16} aria-hidden="true" />
                    {day.length
                      ? "Adicionar período"
                      : stylistId === null
                        ? "Abrir neste dia"
                        : "Atender neste dia"}
                  </button>
                )}
              </fieldset>
            );
          })}
        </div>
        <p className="lb-help">
          Use dois períodos para registrar uma pausa, como 9h às 12h e 13h às 19h.
          Um atendimento precisa caber inteiro em um período.
          {stylistId !== null &&
            " Dias sem período ficam como folga; o agendamento só oferece horários em que o ateliê também está aberto."}
        </p>
        {errors.length > 0 && (
          <p className="lb-form-error" role="alert">
            {errors.join(" ")}
          </p>
        )}
        {emptyWeek && (
          <p className="lb-form-error" role="alert">
            Adicione ao menos um período, ou use “Voltar ao horário do ateliê”.
          </p>
        )}
        {beyondSalon && (
          <p className="lb-warning" role="status">
            Parte desses horários fica fora do horário do ateliê e não aparece no
            agendamento.
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
          {stylistId !== null && !following && (
            <button
              type="button"
              className="lb-text-button"
              onClick={followSalon}
              disabled={pending}
            >
              Voltar ao horário do ateliê
            </button>
          )}
          <button
            type="button"
            className="lb-button"
            onClick={() => {
              setPeriods(keyed(saved, "saved"));
              setCustomizing(false);
              setConfirmed(false);
              setResult(null);
            }}
          >
            Descartar alterações
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={
              pending || errors.length > 0 || emptyWeek || (outside.length > 0 && !confirmed)
            }
          >
            {pending ? "Salvando…" : "Salvar horários"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

/** Titles that read naturally for the salon and for a professional. */
function exceptionTitle(kind: ExceptionKind, forPerson: boolean) {
  if (!forPerson) return exceptionLabels[kind];
  return kind === "fechado" ? "Folga" : kind === "horario_especial" ? "Horário especial" : "Bloqueio de horário";
}

function ExceptionsPanel({
  stylistId,
  name,
  self,
  today,
  upcoming,
  exceptions,
}: {
  stylistId: string | null;
  name: string;
  self: boolean;
  today: string;
  upcoming: AdminAppointment[];
  exceptions: ScheduleException[];
}) {
  const { stylists } = useCatalog();
  const people = stylists.filter((person) => !person.deleted);
  const [kind, setKind] = useState<ExceptionKind>("fechado");
  // In the salon view the owner may still target one professional.
  const [targetId, setTargetId] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [opensAt, setOpensAt] = useState("12:00");
  const [closesAt, setClosesAt] = useState("13:00");
  const [reason, setReason] = useState("");
  const { result, setResult, pending, run } = useEditorAction();
  const target = stylistId ?? (targetId || null);
  const current = exceptions
    .filter(
      (item) => item.endsOn >= today && (stylistId === null || item.stylistId === stylistId),
    )
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const timed = kind !== "fechado";
  const affected = upcoming.filter(
    (item) =>
      item.date >= startsOn &&
      item.date <= (endsOn || startsOn) &&
      (target === null || item.performedBy === target),
  ).length;
  const title =
    stylistId === null
      ? "Feriados, folgas e exceções"
      : self
        ? "Minhas folgas e exceções"
        : `Folgas e exceções de ${name}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () =>
        createScheduleException({
          kind,
          stylistId: target,
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
      title={title}
      description={
        stylistId === null
          ? "Valem para o site e o agendamento nas datas escolhidas, sem alterar a semana."
          : `Valem para o agendamento nas datas escolhidas. O motivo fica visível ${self ? "para você e para o responsável pelo ateliê" : "para o profissional e para você"}.`
      }
    >
      <div className="lb-editor-body">
        {current.length ? (
          <ul className="lb-catalog-list">
            {current.map((item) => (
              <li key={item.id}>
                <span className="lb-catalog-copy">
                  <strong>
                    {exceptionTitle(item.kind, Boolean(item.stylistId))}
                    {item.kind !== "fechado" && ` · ${item.opensAt} às ${item.closesAt}`}
                  </strong>
                  <small>
                    {formatDate(item.startsOn)}
                    {item.endsOn !== item.startsOn && ` a ${formatDate(item.endsOn)}`}
                    {stylistId === null &&
                      ` · ${
                        item.stylistId
                          ? (stylists.find((person) => person.id === item.stylistId)?.name ??
                            "Profissional")
                          : "Todo o ateliê"
                      }`}
                    {item.reason && ` · ${item.reason}`}
                  </small>
                </span>
                <button
                  type="button"
                  className="lb-icon-button"
                  aria-label={`Remover ${exceptionTitle(item.kind, Boolean(item.stylistId)).toLowerCase()} de ${formatDate(item.startsOn)}`}
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
                <option value="fechado">
                  {target ? "Folga o dia todo" : "Fechado o dia todo (feriado ou folga)"}
                </option>
                <option value="horario_especial">
                  {target ? "Horário especial nessas datas" : "Horário especial do ateliê"}
                </option>
                <option value="bloqueio">Bloqueio de horário</option>
              </select>
            </label>
            {stylistId === null && (
              <label className="lb-field">
                Para quem
                <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
                  <option value="">Todo o ateliê</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
                  {kind === "bloqueio" ? "Bloquear das" : target ? "Atender das" : "Abrir às"}
                  <input
                    type="time"
                    step={900}
                    required
                    value={opensAt}
                    onChange={(event) => setOpensAt(event.target.value)}
                  />
                </label>
                <label className="lb-field">
                  {kind === "bloqueio" || target ? "Até" : "Fechar às"}
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

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function BookingRulesForm({ settings }: { settings: BookingRules }) {
  const [showPrices, setShowPrices] = useState(settings.showPrices);
  const [windowDays, setWindowDays] = useState(String(settings.bookingWindowDays));
  const [slotInterval, setSlotInterval] = useState(settings.slotIntervalMinutes);
  const [commission, setCommission] = useState(
    String(Math.round(settings.commissionRate * 10000) / 100),
  );
  const [cancelHours, setCancelHours] = useState(
    String(Math.round((settings.cancelNoticeMinutes / 60) * 10) / 10),
  );
  const [savedRetention, setSavedRetention] = useState(settings.historyRetentionMonths);
  const [retention, setRetention] = useState(settings.historyRetentionMonths);
  const [preview, setPreview] = useState<PurgePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { result, setResult, pending, run } = useEditorAction();
  // Turning the cleanup on, or shortening it, removes data: confirm first.
  const removesMore =
    retention !== null && (savedRetention === null || retention < savedRetention);

  async function chooseRetention(value: string) {
    const months = value ? Number(value) : null;
    setRetention(months);
    setConfirmed(false);
    setPreview(null);
    if (months === null) return;
    try {
      setPreview(await previewHistoryPurge(months));
    } catch {
      setPreview({ ok: false, message: "Não foi possível calcular a prévia. Tente novamente." });
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || (removesMore && !confirmed)) return;
    void run(
      () =>
        saveBookingRules({
          showPrices,
          bookingWindowDays: Number(windowDays),
          slotIntervalMinutes: slotInterval,
          commissionRate: Number(commission.replace(",", ".")) / 100,
          cancelNoticeMinutes: Math.round(Number(cancelHours.replace(",", ".")) * 60),
          historyRetentionMonths: retention,
        }),
      (saved) => {
        setResult(saved);
        setSavedRetention(retention);
        setConfirmed(false);
      },
    );
  }

  return (
    <Panel
      title="Regras do agendamento"
      description="Preços no site, prazos de agendamento e cancelamento, comissão da equipe e histórico."
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
          <label className="lb-field">
            Cancelar pelo site até (horas antes)
            <input
              type="number"
              min={0}
              max={720}
              step={0.5}
              required
              value={cancelHours}
              onChange={(event) => setCancelHours(event.target.value)}
            />
            <small className="lb-help">
              Depois desse prazo, o cliente fala com o ateliê. Mantenha igual ao
              texto das políticas do salão.
            </small>
          </label>
          <label className="lb-field">
            Excluir histórico antigo
            <select
              value={retention ?? ""}
              onChange={(event) => void chooseRetention(event.target.value)}
            >
              <option value="">Manter todo o histórico</option>
              {retentionOptions.map((months) => (
                <option key={months} value={months}>
                  Após {months} meses
                </option>
              ))}
            </select>
            <small className="lb-help">
              A limpeza roda todo dia às 3h30. Apaga atendimentos anteriores ao
              prazo, clientes sem atendimentos desde então e exceções encerradas;
              os relatórios desses períodos deixam de existir.
            </small>
          </label>
        </div>
        {preview && !preview.ok && (
          <p className="lb-form-error" role="alert">
            {preview.message}
          </p>
        )}
        {removesMore && preview && "cutoff" in preview && (
          <div className="lb-warning" role="status">
            <p>
              Na próxima limpeza seriam excluídos{" "}
              {plural(preview.appointments, "atendimento", "atendimentos")},{" "}
              {plural(preview.clients, "cliente", "clientes")} e{" "}
              {plural(preview.exceptions, "exceção", "exceções")} anteriores a{" "}
              {formatDate(preview.cutoff)}. A exclusão não pode ser desfeita.
            </p>
            <Checkbox
              label="Entendi, ativar a exclusão automática"
              checked={confirmed}
              onChange={setConfirmed}
            />
          </div>
        )}
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending || (removesMore && !confirmed)}
          >
            {pending ? "Salvando…" : "Salvar regras"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
