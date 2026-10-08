"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { InstagramLogo, WhatsappLogo, Phone } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { ActionContent, ButtonLink, buttonClassName } from "@/components/ui";
import { useContact } from "@/components/contact-provider";
import { formatPhoneInput } from "@/lib/input-masks";
import styles from "./demo-channel.module.css";

type Channel = "whatsapp" | "instagram" | "phone";
const channels = {
  whatsapp: {
    label: "WhatsApp",
    title: "Converse pelo WhatsApp",
    text: "Uma conversa é o primeiro passo. Conheça os cuidados disponíveis e escolha o que faz sentido para você.",
    message: "Seu cabelo, suas referências, seu tempo. Tudo começa com uma boa conversa.",
    icon: WhatsappLogo,
  },
  instagram: {
    label: "Instagram",
    title: "Livre no Instagram",
    text: "Referências, novos olhares e os detalhes do cuidado. Entre no universo Livre e encontre inspiração para o seu próximo encontro.",
    message: "Texturas, luz e movimento. A beleza tem muitas formas.",
    icon: InstagramLogo,
  },
  phone: {
    label: "Telefone",
    title: "Atendimento por telefone",
    text: "Um atendimento próximo, para conhecer os serviços e planejar um tempo para você.",
    message: "Escolha seu cuidado, conheça os profissionais e encontre o seu horário.",
    icon: Phone,
  },
};

export function DemoChannel({ channel, children, className = "" }: {
  channel: Channel;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const data = channels[channel];
  const Icon = data.icon;
  const contact = useContact();
  const isWhatsApp = channel === "whatsapp";
  const external =
    channel === "instagram" && contact.instagram
      ? { href: contact.instagram, label: "Abrir o Instagram" }
      : channel === "phone" && contact.phone
        ? { href: `tel:+55${contact.phone}`, label: `Ligar para ${formatPhoneInput(contact.phone)}` }
        : null;
  return (
    <>
      <button
        type="button"
        className={`action-link ${className}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <ActionContent>{children || data.label}</ActionContent>
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label={data.title}
        className={isWhatsApp ? styles.popup : ""}
      >
        {isWhatsApp ? (
          <div className={styles.content}>
            {open && (
              <div className={styles.photo}>
                <Image
                  src={contact.photo.src}
                  alt={contact.photo.alt}
                  fill
                  sizes="720px"
                  quality={90}
                  className={styles.photoImage}
                  style={
                    contact.photo.position
                      ? { objectPosition: contact.photo.position }
                      : undefined
                  }
                />
              </div>
            )}
            <div className={styles.copy}>
              <Icon size={36} weight="light" aria-hidden="true" className={styles.icon} />
              <p className={styles.description}>{data.text}</p>
              <blockquote className={styles.quote}>{data.message}</blockquote>
              <div className={styles.actions}>
                <a
                  href={contact.whatsappHref}
                  className={buttonClassName()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir conversa no WhatsApp (abre em nova aba)"
                >
                  <ActionContent>Abrir conversa no WhatsApp</ActionContent>
                </a>
                <ButtonLink href="/agendamento" secondary onClick={() => setOpen(false)}>
                  Agendar horário
                </ButtonLink>
              </div>
              <p className={styles.note}>
                A conversa abre em uma nova aba. Envie a mensagem quando quiser.
              </p>
            </div>
          </div>
        ) : (
          <div className="channel-dialog">
            <Icon size={38} weight="light" aria-hidden="true" />
            <p>{data.text}</p>
            {channel === "phone" && contact.hours && <p>{contact.hours}.</p>}
            <blockquote>{data.message}</blockquote>
            {external && (
              <a
                href={external.href}
                className={buttonClassName({ secondary: true })}
                {...(channel === "instagram"
                  ? {
                      target: "_blank",
                      rel: "noopener noreferrer",
                      "aria-label": `${external.label} (abre em nova aba)`,
                    }
                  : {})}
              >
                <ActionContent>{external.label}</ActionContent>
              </a>
            )}
            <ButtonLink href={channel === "instagram" ? "/galeria" : "/agendamento"} onClick={() => setOpen(false)}>
              {channel === "instagram" ? "Explorar a galeria" : "Agendar horário"}
            </ButtonLink>
          </div>
        )}
      </Dialog>
    </>
  );
}
