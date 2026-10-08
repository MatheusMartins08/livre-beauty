"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Contact channels edited in the panel; empty values hide their links. */
export interface PublicContact {
  whatsappHref: string;
  instagram: string;
  phone: string;
  hours: string;
  photo: { src: string; alt: string; position: string };
}

const ContactContext = createContext<PublicContact>({
  whatsappHref: "https://wa.me/",
  instagram: "",
  phone: "",
  hours: "",
  photo: { src: "/images/contact-salon.jpg", alt: "", position: "" },
});

export function ContactProvider({ contact, children }: {
  contact: PublicContact;
  children: ReactNode;
}) {
  return <ContactContext.Provider value={contact}>{children}</ContactContext.Provider>;
}

export function useContact() {
  return useContext(ContactContext);
}

export function useWhatsAppHref() {
  return useContext(ContactContext).whatsappHref;
}
