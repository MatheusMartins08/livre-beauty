"use client";

import { useState, type KeyboardEvent } from "react";
import type { AdminAppointment, AdminClient } from "@/lib/admin";
import type { ScheduleException } from "@/lib/opening-hours";
import type { SiteContent, SiteSectionKey } from "@/lib/site-content";
import { ContactEditor } from "./contact-editor";
import { GalleryEditor } from "./gallery-editor";
import { HomeEditor } from "./home-editor";
import { HoursEditor, type BookingRules } from "./hours-editor";
import { ServicesEditor } from "./services-editor";
import { StylistsEditor } from "./stylists-editor";
import type { StaffAccount } from "./staff-access-panel";

export interface SiteEditorData {
  content: SiteContent;
  savedSections: SiteSectionKey[];
  settings: BookingRules | null;
  /** Panel accounts by professional id. */
  accounts: Record<string, StaffAccount>;
}

const tabs = [
  { id: "inicio", label: "Página inicial" },
  { id: "servicos", label: "Serviços" },
  { id: "equipe", label: "Profissionais" },
  { id: "galeria", label: "Galeria" },
  { id: "contato", label: "Contato" },
  { id: "horarios", label: "Horários" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export function SiteEditor({
  data,
  today,
  appointments,
  clients,
  exceptions,
}: {
  data: SiteEditorData;
  today: string;
  appointments: AdminAppointment[];
  clients: AdminClient[];
  exceptions: ScheduleException[];
}) {
  const [tab, setTab] = useState<Tab>("inicio");

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = tabs.findIndex((item) => item.id === tab);
    const next =
      tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setTab(next.id);
    document.getElementById(`site-tab-${next.id}`)?.focus();
  }

  return (
    <div className="lb-editor">
      <div
        className="lb-tabs"
        role="tablist"
        aria-label="Áreas do site"
        onKeyDown={onKeyDown}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`site-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`site-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tabs.map((item) => (
        <div
          key={item.id}
          id={`site-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`site-tab-${item.id}`}
          hidden={tab !== item.id}
        >
          {/* Panels stay mounted so unsaved edits survive a tab change. */}
          {item.id === "inicio" && (
            <HomeEditor content={data.content} savedSections={data.savedSections} />
          )}
          {item.id === "servicos" && <ServicesEditor />}
          {item.id === "equipe" && <StylistsEditor accounts={data.accounts} />}
          {item.id === "galeria" && (
            <GalleryEditor
              gallery={data.content.gallery}
              saved={data.savedSections.includes("gallery")}
            />
          )}
          {item.id === "contato" && (
            <ContactEditor
              contact={data.content.contact}
              saved={data.savedSections.includes("contact")}
            />
          )}
          {item.id === "horarios" && (
            <HoursEditor
              today={today}
              appointments={appointments}
              clients={clients}
              exceptions={exceptions}
              settings={data.settings}
            />
          )}
        </div>
      ))}
    </div>
  );
}
