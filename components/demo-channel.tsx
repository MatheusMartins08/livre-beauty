"use client";

import { useState, type ReactNode } from "react";
import { InstagramLogo, WhatsappLogo, Phone } from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { ActionContent, ButtonLink } from "@/components/ui";

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
    text: "Um atendimento próximo, de terça a sábado, das 9h às 19h. Conheça os serviços e planeje um tempo para você.",
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
  return (
    <>
      <button type="button" className={`action-link ${className}`} onClick={() => setOpen(true)}>
        <ActionContent>{children || data.label}</ActionContent>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label={data.title}>
        <div className="channel-dialog">
          <Icon size={38} weight="light" aria-hidden="true" />
          <p>{data.text}</p>
          <blockquote>{data.message}</blockquote>
          <ButtonLink href={channel === "instagram" ? "/galeria" : "/agendamento"} onClick={() => setOpen(false)}>
            {channel === "instagram" ? "Explorar a galeria" : "Agendar horário"}
          </ButtonLink>
        </div>
      </Dialog>
    </>
  );
}
