"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  InstagramLogo,
  WhatsappLogo,
  Phone,
  Envelope,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";

type Channel = "whatsapp" | "instagram" | "phone" | "email";
const channels = {
  whatsapp: {
    title: "Converse pelo WhatsApp",
    text: "Uma conversa é o primeiro passo. Na versão real, você poderá falar com a recepção e tirar dúvidas antes de agendar.",
    message:
      "Olá! Encontrei vocês pelo site e gostaria de saber mais sobre os serviços e o agendamento.",
    icon: WhatsappLogo,
  },
  instagram: {
    title: "Livre no Instagram",
    text: "Referências, novos olhares e os detalhes do cuidado. Na versão real, este espaço conecta você ao perfil do salão.",
    message:
      "A galeria deste projeto reúne fotografias ilustrativas de banco de imagens.",
    icon: InstagramLogo,
  },
  phone: {
    title: "Atendimento por telefone",
    text: "A proposta do Livre é oferecer um atendimento próximo, de terça a sábado, das 9h às 19h.",
    message:
      "Conheça o fluxo de agendamento ou envie uma mensagem demonstrativa pelo formulário.",
    icon: Phone,
  },
  email: {
    title: "Uma mensagem para a equipe",
    text: "Dúvidas, referências ou um pedido especial. Na versão real, a recepção poderá responder ao seu e-mail.",
    message:
      "Você pode experimentar o formulário de contato nesta apresentação.",
    icon: Envelope,
  },
};

export function DemoChannel({
  channel,
  children,
  className = "text-link",
}: {
  channel: Channel;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const data = channels[channel];
  const Icon = data.icon;
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Icon size={20} weight="light" aria-hidden="true" />
        {children ||
          (channel === "whatsapp"
            ? "WhatsApp"
            : channel === "instagram"
              ? "Instagram"
              : channel === "phone"
                ? "Telefone"
                : "E-mail")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label={data.title}>
        <div className="channel-dialog">
          <Icon size={38} weight="light" aria-hidden="true" />
          <p>{data.text}</p>
          <blockquote>{data.message}</blockquote>
          <p className="demo-note">
            Livre Beauty é uma marca fictícia. Este canal é demonstrativo e
            nenhuma mensagem será enviada.
          </p>
          <Link
            href={channel === "instagram" ? "/galeria" : "/contato"}
            className="button"
            onClick={() => setOpen(false)}
          >
            {channel === "instagram"
              ? "Explorar a galeria"
              : "Conhecer o contato"}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Dialog>
    </>
  );
}

export function FloatingContact() {
  return (
    <>
      <div className="floating-contact">
        <DemoChannel channel="whatsapp" className="floating-whatsapp">
          Vamos conversar
        </DemoChannel>
      </div>
      <div className="mobile-booking-bar">
        <Link href="/agendamento">
          Agendar horário
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <DemoChannel channel="whatsapp" className="mobile-whatsapp">
          <span className="sr-only">WhatsApp</span>
        </DemoChannel>
      </div>
    </>
  );
}
