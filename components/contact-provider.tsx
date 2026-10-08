"use client";

import { createContext, useContext, type ReactNode } from "react";

const WhatsAppContext = createContext("https://wa.me/");

export function ContactProvider({ href, children }: {
  href: string;
  children: ReactNode;
}) {
  return <WhatsAppContext.Provider value={href}>{children}</WhatsAppContext.Provider>;
}

export function useWhatsAppHref() {
  return useContext(WhatsAppContext);
}
