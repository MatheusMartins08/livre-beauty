"use client";

import { useEffect, useRef, useState } from "react";
import type { Service, Stylist } from "@/content/salon";
import { StylistCard } from "@/components/ui";

export function StylistDirectory({
  items,
  services,
}: {
  items: Stylist[];
  services: Service[];
}) {
  const [serviceId, setServiceId] = useState("");
  const grid = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    grid.current?.dispatchEvent(
      new Event("page-layout-change", { bubbles: true }),
    );
  }, [serviceId]);
  const visibleStylists = serviceId
    ? items.filter((stylist) => stylist.serviceIds.includes(serviceId))
    : items;

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 border-y border-[var(--line)] py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
          <label className="text-sm" htmlFor="stylist-service">
            Escolha um serviço
          </label>
          <select
            id="stylist-service"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="min-h-11 max-w-full border border-[var(--muted)] bg-transparent px-4 py-2 text-base sm:min-w-60"
          >
            <option value="">Todos os serviços</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <p className="fine-print" role="status" aria-live="polite">
          {visibleStylists.length}{" "}
          {visibleStylists.length === 1
            ? "profissional para cuidar de você"
            : "profissionais para cuidar de você"}
        </p>
      </div>
      <div ref={grid} className="stylist-directory-grid">
        {visibleStylists.map((stylist) => (
          <StylistCard key={stylist.id} stylist={stylist} />
        ))}
      </div>
    </div>
  );
}
