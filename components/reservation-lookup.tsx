"use client";

import { useRef, useState, type FormEvent } from "react";
import { MaskedInput } from "@/components/masked-input";
import { ActionContent, ButtonLink } from "@/components/ui";
import { useWhatsAppHref } from "@/components/contact-provider";
import { BOOKING_TIME_ZONE } from "@/lib/booking-shared";
import {
  cancelReservation,
  lookupReservation,
} from "@/lib/reservation-actions";
import {
  reservationStatusLabels,
  type Reservation,
  type ReservationResult,
} from "@/lib/reservation";
import { formatPrice } from "@/lib/utils";
import styles from "./booking.module.css";

function longDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

function dateTime(instant: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BOOKING_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}

/** Look up and cancel a booking with its code and the phone used to book it. */
export function ReservationLookup({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const whatsappHref = useWhatsAppHref();

  async function run(action: () => Promise<ReservationResult>, success: string) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    setNotice("");
    try {
      const result = await action();
      if (result.ok) {
        setReservation(result.reservation);
        setNotice(success);
      } else {
        setMessage(result.message);
        if (result.reservation) setReservation(result.reservation);
        else if (result.code === "not_found" || result.code === "invalid")
          setReservation(null);
      }
    } catch {
      setMessage("Não foi possível concluir agora. Tente novamente em instantes.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => lookupReservation(code, phone), "");
  }
  function cancel() {
    if (
      !reservation ||
      !window.confirm("Cancelar esta reserva? O horário será liberado para outra pessoa.")
    )
      return;
    void run(
      () => cancelReservation(reservation.code, phone),
      "Reserva cancelada. O horário foi liberado.",
    );
  }

  return (
    <div className={styles.lookup}>
      <form onSubmit={submit} noValidate aria-busy={pending} className={styles.lookupForm}>
        <div className="field">
          <label className="label" htmlFor="reservation-code">
            Código da reserva
          </label>
          <input
            id="reservation-code"
            className="input"
            value={code}
            maxLength={12}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="LB-7KQ2MX"
            onChange={(event) => setCode(event.target.value)}
            aria-describedby="reservation-code-help"
          />
          <p id="reservation-code-help" className="fine-print">
            Está na confirmação do agendamento e na mensagem do WhatsApp.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="reservation-phone">
            Celular usado no agendamento
          </label>
          <MaskedInput
            mask="phone"
            id="reservation-phone"
            className="input"
            autoComplete="tel"
            value={phone}
            placeholder="(11) 99999-9999"
            onValueChange={setPhone}
          />
        </div>
        <button type="submit" className="button" disabled={pending}>
          <ActionContent>{pending ? "Consultando…" : "Consultar reserva"}</ActionContent>
        </button>
      </form>

      {message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.lookupNotice}>
          {notice}
        </p>
      )}

      {reservation && (
        <section
          className={`${styles.confirmation} surface-panel`}
          aria-labelledby="reservation-title"
        >
          <p className="eyebrow">SUA RESERVA</p>
          <h2 id="reservation-title">
            {reservationStatusLabels[reservation.status]}
            {reservation.status === "cancelado" &&
              reservation.cancelledByClient &&
              " por você"}
          </h2>
          <dl className={styles.confirmationDetails}>
            <div>
              <dt>Código</dt>
              <dd className={styles.reservationCode}>{reservation.code}</dd>
            </div>
            <div>
              <dt>{reservation.services.length > 1 ? "Serviços" : "Serviço"}</dt>
              <dd>{reservation.services.join(" + ")}</dd>
            </div>
            <div>
              <dt>Profissional</dt>
              <dd>{reservation.stylistName}</dd>
            </div>
            <div>
              <dt>Dia e horário</dt>
              <dd>
                {longDate(reservation.date)} · {reservation.time} ·{" "}
                {reservation.durationMinutes} min
              </dd>
            </div>
            {reservation.price !== null && (
              <div>
                <dt>Investimento inicial</dt>
                <dd>A partir de {formatPrice(reservation.price)}</dd>
              </div>
            )}
          </dl>
          {reservation.canCancel ? (
            <>
              <p className="fine-print">
                Você pode cancelar pelo site até {dateTime(reservation.cancelUntil)}
                {" "}(horário de São Paulo).
              </p>
              <div className={styles.confirmationActions}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={cancel}
                  disabled={pending}
                >
                  <ActionContent>{pending ? "Cancelando…" : "Cancelar reserva"}</ActionContent>
                </button>
              </div>
            </>
          ) : reservation.status === "agendado" ? (
            <p className="fine-print">
              O prazo para cancelar pelo site terminou em{" "}
              {dateTime(reservation.cancelUntil)}. Para mudanças, fale com o ateliê.
            </p>
          ) : null}
          <div className={styles.confirmationActions}>
            {reservation.status === "agendado" && !reservation.canCancel && (
              <a
                href={whatsappHref}
                className="button"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com o ateliê no WhatsApp (abre em nova aba)"
              >
                <ActionContent>Falar com o ateliê</ActionContent>
              </a>
            )}
            {reservation.status !== "agendado" && (
              <ButtonLink href="/agendamento">Agendar novo horário</ButtonLink>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
