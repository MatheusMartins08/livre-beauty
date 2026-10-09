"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useCatalog } from "@/components/catalog-provider";
import {
  BOOKING_TIME_ZONE,
  MAX_BOOKING_SERVICES,
  selectionError,
  validateContactDetails,
  type BookingSlot,
  type ContactDetails,
} from "@/lib/booking-shared";
import { loadAvailability, submitDemoBooking } from "@/lib/booking";
import { priceLabel } from "@/lib/utils";
import { ActionContent } from "@/components/ui";
import { BookingCalendar } from "@/components/booking-calendar";
import { BookingConfirmation } from "@/components/booking-confirmation";
import { MaskedInput } from "@/components/masked-input";
import styles from "./booking.module.css";

const steps = [
  "Serviço",
  "Profissional",
  "Dia e horário",
  "Seus dados",
  "Revisão",
];
const titles = [
  "Escolha seu serviço",
  "Com quem você quer estar?",
  "Encontre seu horário",
  "Vamos nos conhecer",
  "Revise sua escolha",
];
const descriptions = [
  `Tudo começa com o cuidado que faz sentido para você. Combine até ${MAX_BOOKING_SERVICES} serviços no mesmo horário.`,
  "Conheça quem cuida de você ou deixe a escolha com a nossa equipe.",
  "Selecione um dia e confira os horários disponíveis.",
  "Informe seus dados para registrar seu agendamento.",
  "Confira os detalhes antes de confirmar seu horário.",
];

function hasExpired(startAt: string) {
  return new Date(startAt).getTime() <= Date.now();
}

function dateLabel(date: string, full = false): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BOOKING_TIME_ZONE,
    weekday: full ? "long" : "short",
    day: "numeric",
    month: full ? "long" : "short",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function BookingWizard({
  initialServiceId = "",
  initialStylistId = "",
  dates,
  whatsappNumber,
}: {
  initialServiceId?: string;
  initialStylistId?: string;
  dates: string[];
  whatsappNumber?: string;
}) {
  const { services, stylists, bookingSettings } = useCatalog();
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>(
    initialServiceId ? [initialServiceId] : [],
  );
  const [stylistChoice, setStylistChoice] = useState(initialStylistId);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [contact, setContact] = useState<ContactDetails>({
    name: "",
    phone: "",
    email: "",
  });
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactDetails, string>>
  >({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingSlot | null>(null);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const selected = serviceIds.flatMap(
    (id) => services.find((item) => item.id === id) ?? [],
  );
  const selectedKey = serviceIds.join("+");
  const totalDuration = selected.reduce((sum, item) => sum + item.duration, 0);
  const totalPrice = selected.reduce((sum, item) => sum + item.price, 0);
  const selectedNames = selected.map((item) => item.name).join(" + ");
  const compatibleStylists = stylists.filter(
    (item) =>
      serviceIds.length > 0 &&
      serviceIds.every((id) => item.serviceIds.includes(id)),
  );
  const selectedStylist = stylists.find(
    (item) =>
      item.id === (confirmation?.stylistId || slot?.stylistId || stylistChoice),
  );
  const investmentLabel = (price: number) =>
    priceLabel(price, bookingSettings.show_prices);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step, confirmation]);

  useEffect(() => {
    if (!date || !selectedKey || !stylistChoice) return;
    let cancelled = false;
    loadAvailability({
      serviceIds: selectedKey.split("+"),
      stylistId: stylistChoice === "any" ? undefined : stylistChoice,
      date,
    })
      .then((available) => {
        if (cancelled) return;
        setSlots(available);
        setLoading(false);
        setLoadError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [date, selectedKey, stylistChoice, retry]);

  function clearTime() {
    setDate("");
    setSlot(null);
    setSlots([]);
    setLoading(false);
    setLoadError(false);
  }

  /** Why a service cannot be added to the current selection, if anything. */
  function addError(id: string) {
    if (serviceIds.includes(id)) return null;
    return serviceIds.length >= MAX_BOOKING_SERVICES
      ? `Escolha até ${MAX_BOOKING_SERVICES} serviços.`
      : selectionError([...serviceIds, id], services);
  }

  function toggleService(id: string) {
    const next = serviceIds.includes(id)
      ? serviceIds.filter((item) => item !== id)
      : [...serviceIds, id];
    if (!serviceIds.includes(id) && addError(id)) return;
    // A professional chosen earlier, or from a profile link, stays while compatible.
    const keepStylist =
      stylistChoice === "any" ||
      stylists.some(
        (item) =>
          item.id === stylistChoice &&
          next.every((serviceId) => item.serviceIds.includes(serviceId)),
      );
    setServiceIds(next);
    if (!keepStylist || !next.length) setStylistChoice("");
    clearTime();
    setMessage("");
  }

  function chooseStylist(id: string) {
    if (id === stylistChoice) return;
    setStylistChoice(id);
    clearTime();
    setMessage("");
  }

  function chooseDate(value: string) {
    if (value === date) return;
    setDate(value);
    setSlot(null);
    setSlots([]);
    setLoading(Boolean(value));
    setLoadError(false);
    setMessage("");
  }

  function moveBack() {
    if (pending) return;
    setMessage("");
    setStep((value) => Math.max(0, value - 1));
  }

  async function continueBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || pending) return;
    setMessage("");
    const invalidSelection =
      selected.length === serviceIds.length
        ? selectionError(serviceIds, services)
        : "Selecione um serviço para continuar.";
    if (step === 0 && invalidSelection) {
      setMessage(invalidSelection);
      document
        .querySelector<HTMLInputElement>('input[name="service"]')
        ?.focus();
      return;
    }
    if (
      step === 1 &&
      (!stylistChoice ||
        (stylistChoice !== "any" &&
          !compatibleStylists.some((item) => item.id === stylistChoice)))
    ) {
      setMessage("Selecione um profissional ou a opção Sem preferência.");
      document
        .querySelector<HTMLInputElement>('input[name="stylist"]')
        ?.focus();
      return;
    }
    if (step === 2) {
      if (!date) {
        setMessage("Selecione um dia para continuar.");
        document.getElementById("booking-date")?.focus();
        return;
      }
      if (!slot) {
        setMessage("Selecione um horário disponível para continuar.");
        const firstTime =
          document.querySelector<HTMLInputElement>('input[name="time"]');
        (firstTime || document.getElementById("booking-date"))?.focus();
        return;
      }
      const available = slots;
      if (
        hasExpired(slot.startAt) ||
        !available.some(
          (item) => item.id === slot.id && item.startAt === slot.startAt,
        )
      ) {
        setSlot(null);
        setMessage(
          "Este horário não está mais disponível. Escolha outro horário.",
        );
        setLoading(true);
        setRetry((value) => value + 1);
        document.getElementById("booking-date")?.focus();
        return;
      }
    }
    if (step === 3 || step === 4) {
      const fieldErrors = validateContactDetails(contact);
      setErrors(fieldErrors);
      const firstError = (
        Object.keys(fieldErrors) as (keyof ContactDetails)[]
      )[0];
      if (firstError) {
        setMessage("Confira os campos indicados para continuar.");
        if (step === 4) setStep(3);
        requestAnimationFrame(() =>
          document.getElementById(`booking-${firstError}`)?.focus(),
        );
        return;
      }
    }
    if (step < 4) {
      setStep((value) => value + 1);
      return;
    }
    if (
      !slot ||
      (slot.serviceIds ?? [slot.serviceId]).join("+") !== selectedKey ||
      slot.date !== date ||
      (stylistChoice !== "any" && slot.stylistId !== stylistChoice)
    ) {
      setMessage("Confira o dia e o horário escolhidos.");
      setStep(2);
      return;
    }
    submitting.current = true;
    setPending(true);
    startTransition(async () => {
      try {
        const result = await submitDemoBooking({
          slot,
          contact,
          withoutPreference: stylistChoice === "any",
          whatsappOptIn,
        });
        if (result.ok) setConfirmation(result.slot);
        else {
          setMessage(result.message);
          if (result.code === "unavailable") {
            clearTime();
            setStep(2);
          } else if (result.code === "services") {
            clearTime();
            setStep(0);
          } else setStep(3);
        }
      } catch {
        setMessage(
          "Não foi possível concluir sua escolha. Seus dados foram mantidos; tente novamente.",
        );
      } finally {
        submitting.current = false;
        setPending(false);
      }
    });
  }

  function restart() {
    setConfirmation(null);
    setStep(0);
    setServiceIds([]);
    setStylistChoice("");
    clearTime();
    setContact({ name: "", phone: "", email: "" });
    setWhatsappOptIn(false);
    setErrors({});
    setMessage("");
  }

  if (confirmation) {
    return (
      <BookingConfirmation
        slot={confirmation}
        services={(confirmation.serviceIds ?? [confirmation.serviceId]).flatMap(
          (id) => services.find((item) => item.id === id) ?? [],
        )}
        stylist={selectedStylist}
        clientName={contact.name}
        dateText={dateLabel(confirmation.date, true)}
        headingRef={heading}
        onRestart={restart}
        whatsappNumber={whatsappNumber}
      />
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <ol className={styles.progress} aria-label="Etapas do agendamento">
          {steps.map((label, index) => (
            <li
              key={label}
              className={index <= step ? styles.reached : ""}
              aria-current={index === step ? "step" : undefined}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                {index < step ? "✓" : index + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <form onSubmit={continueBooking} noValidate aria-busy={pending}>
          <div className={styles.stepIntro}>
            <p className="eyebrow">ETAPA {step + 1} DE 5</p>
            <h2 ref={heading} tabIndex={-1}>
              {titles[step]}
            </h2>
            <p>{descriptions[step]}</p>
          </div>

          {step === 0 && (
            <fieldset
              className={styles.choiceFieldset}
              aria-describedby={message ? "booking-error" : undefined}
            >
              <legend className="sr-only">Serviços desejados</legend>
              <div className={styles.serviceChoices}>
                {services.map((item) => {
                  const checked = serviceIds.includes(item.id);
                  const unavailableReason = addError(item.id);
                  const parts = item.componentIds
                    .flatMap(
                      (id) => services.find((part) => part.id === id)?.name ?? [],
                    )
                    .join(" + ");
                  return (
                    <label
                      key={item.id}
                      className={`${styles.choice} ${checked ? styles.selected : ""} ${unavailableReason ? styles.choiceDisabled : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="service"
                        value={item.id}
                        checked={checked}
                        disabled={Boolean(unavailableReason)}
                        aria-describedby={
                          unavailableReason ? `service-note-${item.id}` : undefined
                        }
                        onChange={() => toggleService(item.id)}
                      />
                      <span className={styles.choiceContent}>
                        <span className={styles.choiceName}>
                          {item.name}
                          {item.popular && (
                            <span className="popular-badge">Mais pedido</span>
                          )}
                        </span>
                        <span className={styles.choiceDescription}>
                          {parts ? `Combo com ${parts}.` : item.description}
                        </span>
                        <span className={styles.choiceMeta}>
                          {item.duration} min · {investmentLabel(item.price)}
                        </span>
                        {unavailableReason && (
                          <span
                            id={`service-note-${item.id}`}
                            className={styles.choiceNote}
                          >
                            {unavailableReason}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              {selected.length > 1 && (
                <p className={`fine-print ${styles.selectionTotal}`} role="status">
                  {selected.length} serviços em sequência · {totalDuration} min ·{" "}
                  {investmentLabel(totalPrice)}
                </p>
              )}
            </fieldset>
          )}

          {step === 1 && (
            <fieldset
              className={styles.choiceFieldset}
              aria-describedby={message ? "booking-error" : undefined}
            >
              <legend className="sr-only">Profissional desejado</legend>
              <div className={styles.stylistChoices}>
                <label
                  className={`${styles.choice} ${stylistChoice === "any" ? styles.selected : ""}`}
                >
                  <input
                    type="radio"
                    required
                    name="stylist"
                    value="any"
                    checked={stylistChoice === "any"}
                    onChange={() => chooseStylist("any")}
                  />
                  <span className={styles.choiceContent}>
                    <span className={styles.choiceName}>Sem preferência</span>
                    <span className={styles.choiceDescription}>
                      Encontramos um profissional compatível com o seu serviço e
                      horário.
                    </span>
                  </span>
                </label>
                {compatibleStylists.map((item) => (
                  <label
                    key={item.id}
                    className={`${styles.choice} ${stylistChoice === item.id ? styles.selected : ""}`}
                  >
                    <input
                      type="radio"
                      required
                      name="stylist"
                      value={item.id}
                      checked={stylistChoice === item.id}
                      onChange={() => chooseStylist(item.id)}
                    />
                    <span className={styles.choiceContent}>
                      <span className={styles.choiceName}>{item.name}</span>
                      <span className={styles.choiceDescription}>
                        {item.role}
                      </span>
                      <span className={styles.choiceMeta}>
                        {item.specialties.join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div className={styles.schedule}>
              <div>
                <BookingCalendar
                  dates={dates}
                  value={date}
                  onChange={chooseDate}
                  invalid={Boolean(message && !date)}
                  describedBy={`booking-timezone${message ? " booking-error" : ""}`}
                />
                <p className="fine-print" id="booking-timezone">
                  Horários de São Paulo (Brasília).
                </p>
              </div>
              <div className={styles.timesArea}>
                {loading && (
                  <p className={styles.loading} role="status">
                    <span aria-hidden="true" className={styles.spinner} />
                    Consultando horários…
                  </p>
                )}
                {loadError && (
                  <div role="alert">
                    <p className="form-error">
                      Não foi possível consultar os horários.
                    </p>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setLoadError(false);
                        setLoading(true);
                        setRetry((value) => value + 1);
                      }}
                    >
                      <ActionContent>Tentar novamente</ActionContent>
                    </button>
                  </div>
                )}
                {!loading &&
                  !loadError &&
                  date &&
                  (slots.length ? (
                    <fieldset
                      className={styles.choiceFieldset}
                      aria-invalid={Boolean(message && !slot)}
                      aria-describedby={message ? "booking-error" : undefined}
                    >
                      <legend className={styles.timeLegend}>
                        Horários para {dateLabel(date)}
                      </legend>
                      <div className={styles.times}>
                        {slots.map((available) => (
                          <label
                            key={available.id}
                            className={`${styles.timeChoice} ${slot?.id === available.id ? styles.selected : ""}`}
                          >
                            <input
                              type="radio"
                              required
                              name="time"
                              value={available.id}
                              checked={slot?.id === available.id}
                              onChange={() => {
                                setSlot(available);
                                setMessage("");
                              }}
                            />
                            <span>{available.time}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : (
                    <p role="status" className={styles.empty}>
                      Não há horários para esse dia. Experimente outra data
                      {stylistChoice !== "any"
                        ? " ou volte e escolha Sem preferência"
                        : ""}
                      .
                    </p>
                  ))}
                {!date && (
                  <p className={styles.empty}>
                    Os horários aparecem depois de escolher um dia.
                  </p>
                )}
                {slot && stylistChoice === "any" && (
                  <p className="fine-print">
                    Para este horário, o cuidado será com{" "}
                    {selectedStylist?.name}.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.contactFields}>
              <div className="field">
                <label className="label" htmlFor="booking-name">
                  Nome completo
                </label>
                <input
                  required
                  id="booking-name"
                  className="input"
                  value={contact.name}
                  autoComplete="name"
                  maxLength={100}
                  onChange={(event) =>
                    setContact({ ...contact, name: event.target.value })
                  }
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "booking-name-error" : undefined
                  }
                />
                {errors.name && (
                  <p id="booking-name-error" className="form-error">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="field">
                <label className="label" htmlFor="booking-phone">
                  Celular com DDD
                </label>
                <MaskedInput
                  mask="phone"
                  required
                  id="booking-phone"
                  className="input"
                  autoComplete="tel"
                  value={contact.phone}
                  placeholder="(11) 99999-9999"
                  onValueChange={(phone) =>
                    setContact({ ...contact, phone })
                  }
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "booking-phone-error" : undefined
                  }
                />
                {errors.phone && (
                  <p id="booking-phone-error" className="form-error">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div className="field">
                <label className="label" htmlFor="booking-email">
                  E-mail
                </label>
                <input
                  required
                  id="booking-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  maxLength={254}
                  placeholder="voce@exemplo.com"
                  onChange={(event) =>
                    setContact({ ...contact, email: event.target.value })
                  }
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "booking-email-error" : undefined
                  }
                />
                {errors.email && (
                  <p id="booking-email-error" className="form-error">
                    {errors.email}
                  </p>
                )}
              </div>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="whatsapp-opt-in"
                  checked={whatsappOptIn}
                  onChange={(event) => setWhatsappOptIn(event.target.checked)}
                  aria-describedby="booking-consent-note"
                />
                <span>
                  Aceito receber pelo WhatsApp mensagens do ateliê sobre meus
                  agendamentos.
                  <small id="booking-consent-note">
                    Opcional. Você pode retirar o consentimento a qualquer
                    momento falando com o ateliê.
                  </small>
                </span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className={styles.review}>
              <dl>
                <div>
                  <dt>{selected.length > 1 ? "Serviços" : "Serviço"}</dt>
                  <dd>
                    {selectedNames}
                    <span>
                      {totalDuration} minutos · {investmentLabel(totalPrice)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Profissional</dt>
                  <dd>
                    {selectedStylist?.name}
                    {stylistChoice === "any" && (
                      <span>Selecionado para o horário escolhido</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Dia e horário</dt>
                  <dd>
                    {date && dateLabel(date, true)} · {slot?.time}
                    <span>Fuso de São Paulo (Brasília)</span>
                  </dd>
                </div>
                <div>
                  <dt>Seus dados</dt>
                  <dd>
                    {contact.name.trim()}
                    <span>
                      {contact.phone} · {contact.email.trim()}
                    </span>
                    <span>
                      {whatsappOptIn
                        ? "Aceita mensagens pelo WhatsApp"
                        : "Sem mensagens pelo WhatsApp"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {message && (
            <p
              id="booking-error"
              role="alert"
              className={`form-error ${styles.error}`}
            >
              {message}
            </p>
          )}
          <div className={styles.actions}>
            {step > 0 && (
              <button
                type="button"
                className="button button-secondary"
                onClick={moveBack}
                disabled={pending}
              >
                <ActionContent>Voltar</ActionContent>
              </button>
            )}
            <button
              type="submit"
              className="button"
              disabled={pending || (step === 2 && loading)}
            >
              <ActionContent>
                {pending
                  ? "Concluindo…"
                  : step === 4
                    ? "Confirmar agendamento"
                    : "Continuar"}
              </ActionContent>
            </button>
          </div>
          {pending && (
            <p role="status" className="fine-print">
              Validando sua escolha…
            </p>
          )}
        </form>
      </div>
      <aside className={styles.summary} aria-label="Resumo da sua escolha">
        <p className="eyebrow">UM TEMPO SÓ SEU</p>
        <h2>Sua escolha</h2>
        <dl>
          <div>
            <dt>{selected.length > 1 ? "Serviços" : "Serviço"}</dt>
            <dd>{selectedNames || "Vamos escolher juntos"}</dd>
          </div>
          <div>
            <dt>Profissional</dt>
            <dd>
              {selectedStylist?.name ||
                (stylistChoice === "any" ? "Sem preferência" : "A escolher")}
            </dd>
          </div>
          <div>
            <dt>Dia e horário</dt>
            <dd>
              {date
                ? `${dateLabel(date)}${slot ? ` · ${slot.time}` : ""}`
                : "A escolher"}
            </dd>
          </div>
        </dl>
        {selected.length > 0 && (
          <div className={styles.investment}>
            <span className="fine-print">
              {totalDuration} minutos de cuidado
            </span>
            <strong>{investmentLabel(totalPrice)}</strong>
            <span className="fine-print">Investimento inicial.</span>
          </div>
        )}
        <p className={styles.summaryNote}>
          Uma boa conversa vem antes de qualquer transformação.
        </p>
      </aside>
    </div>
  );
}
