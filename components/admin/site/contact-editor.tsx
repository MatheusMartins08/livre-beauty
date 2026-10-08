"use client";

import type { SiteContent } from "@/lib/site-content";
import { SectionForm } from "./section-form";
import { PhotoField, TextField } from "./fields";

export function ContactEditor({
  contact,
  saved,
}: {
  contact: SiteContent["contact"];
  saved: boolean;
}) {
  return (
    <SectionForm
      sectionKey="contact"
      title="Contato e endereço"
      description="Usados no rodapé, na seção de visita, nos botões de contato e na mensagem após o agendamento."
      initial={contact}
      saved={saved}
    >
      {(value, update, uploads) => (
        <>
          <TextField
            label="Endereço completo"
            value={value.address}
            max={160}
            onChange={(address) => update({ ...value, address })}
          />
          <TextField
            label="Bairro e cidade"
            value={value.location}
            max={80}
            help="Versão curta, exibida no rodapé."
            onChange={(location) => update({ ...value, location })}
          />
          <div className="lb-form-grid lb-form-grid-3">
            <TextField
              label="WhatsApp"
              type="tel"
              required={false}
              value={value.whatsapp}
              max={20}
              placeholder="(11) 99999-9999"
              help="Com DDD. Sem número, os botões abrem o WhatsApp para escolher o contato."
              onChange={(whatsapp) => update({ ...value, whatsapp })}
            />
            <TextField
              label="Telefone"
              type="tel"
              required={false}
              value={value.phone}
              max={20}
              placeholder="(11) 3333-4444"
              onChange={(phone) => update({ ...value, phone })}
            />
            <TextField
              label="Instagram"
              required={false}
              value={value.instagram}
              max={80}
              placeholder="@livrebeauty"
              onChange={(instagram) => update({ ...value, instagram })}
            />
          </div>
          <p className="lb-help">
            Os horários exibidos no site vêm da aba Horários. O mapa da seção de
            visita continua mostrando a região dos Jardins.
          </p>
          <PhotoField
            label="Foto da janela do WhatsApp"
            folder="site"
            uploads={uploads}
            alt="optional"
            allowLayoutPosition
            value={value.photo}
            onChange={(photo) => update({ ...value, photo })}
          />
        </>
      )}
    </SectionForm>
  );
}
