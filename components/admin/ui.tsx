"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { MagnifyingGlass, CalendarBlank } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";

export function Person({
  stylistId,
  compact = false,
}: {
  stylistId: string;
  compact?: boolean;
}) {
  const { stylists } = useCatalog();
  const person = stylists.find((item) => item.id === stylistId);
  if (!person)
    return <span className="lb-person">Profissional indisponível</span>;
  const size = compact ? 30 : 40;
  return (
    <span className="lb-person">
      <Image
        src={person.image}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
      <span>
        <strong>{person.name}</strong>
        {!compact && <small>{person.role}</small>}
      </span>
    </span>
  );
}
export function Initials({ name }: { name: string }) {
  return (
    <span className="lb-initials" aria-hidden="true">
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function EmptyState({
  title = "Nenhum resultado encontrado",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="lb-empty">
      <CalendarBlank size={30} weight="light" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="lb-search">
      <MagnifyingGlass size={19} aria-hidden="true" />
      <span className="lb-sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="lb-panel" aria-label={title}>
      <div className="lb-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
