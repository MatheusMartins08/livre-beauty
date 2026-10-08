"use client";

import type { Ref } from "react";
import { site, type Service, type Stylist } from "@/content/salon";
import type { BookingSlot } from "@/lib/booking-shared";
import { bookingWhatsAppHref } from "@/lib/booking-whatsapp";
import { ActionContent, ButtonLink } from "@/components/ui";
import styles from "./booking.module.css";

export function BookingConfirmation({
  slot,
  service,
  stylist,
  clientName,
  dateText,
  headingRef,
  onRestart,
  whatsappNumber,
}: {
  slot: BookingSlot;
  service?: Service;
  stylist?: Stylist;
  clientName: string;
  dateText: string;
  headingRef: Ref<HTMLHeadingElement>;
  onRestart: () => void;
  whatsappNumber?: string;
}) {
  const whatsappHref = service && stylist
    ? bookingWhatsAppHref({
        slot,
        clientName,
        serviceName: service.name,
        stylistName: stylist.name,
        durationMinutes: service.duration,
        salonName: site.name,
        phoneNumber: whatsappNumber,
      })
    : null;

  return (
    <section
      className={`${styles.confirmation} surface-panel`}
      aria-labelledby="booking-complete"
    >
      <div className={styles.completeMark} aria-hidden="true">✓</div>
      <p className="eyebrow">SEU MOMENTO NO LIVRE</p>
      <h2 id="booking-complete" ref={headingRef} tabIndex={-1}>
        Agendamento confirmado
      </h2>
      <p role="status">Seu horário foi reservado e já está na agenda da equipe.</p>
      <dl className={styles.confirmationDetails}>
        <div>
          <dt>Seu cuidado</dt>
          <dd>{service?.name}</dd>
        </div>
        <div>
          <dt>Profissional</dt>
          <dd>{stylist?.name}</dd>
        </div>
        <div>
          <dt>Dia e horário</dt>
          <dd>{dateText} · {slot.time}</dd>
        </div>
      </dl>
      <p className="fine-print">
        Seus dados foram registrados para organizar este atendimento. Consulte
        nossa política de privacidade para saber como são utilizados.
      </p>
      <div className={styles.confirmationActions}>
        {whatsappHref && (
          <a
            href={whatsappHref}
            className="button"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enviar pelo WhatsApp (abre em nova aba)"
          >
            <ActionContent>Enviar pelo WhatsApp</ActionContent>
          </a>
        )}
        <button type="button" className="button button-secondary" onClick={onRestart}>
          <ActionContent>Escolher outro horário</ActionContent>
        </button>
        <ButtonLink href="/" secondary>Voltar ao início</ButtonLink>
      </div>
      {whatsappHref && (
        <p className="fine-print">Revise a mensagem no WhatsApp antes de enviar.</p>
      )}
    </section>
  );
}
