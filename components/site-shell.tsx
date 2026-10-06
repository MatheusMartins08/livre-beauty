"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/header";

/** Keeps the public site's chrome out of the staff workspace. */
export function SiteShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isPanel = pathname === "/painel" || pathname.startsWith("/painel/");
  return (
    <>
      {!isPanel && <Header />}
      {children}
      {!isPanel && footer}
    </>
  );
}
