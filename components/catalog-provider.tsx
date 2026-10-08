"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SalonCatalog } from "@/lib/catalog";

const CatalogContext = createContext<SalonCatalog | null>(null);

export function CatalogProvider({
  catalog,
  children,
}: {
  catalog: SalonCatalog;
  children: ReactNode;
}) {
  return (
    <CatalogContext.Provider value={catalog}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("O catálogo do ateliê não foi carregado.");
  return catalog;
}
