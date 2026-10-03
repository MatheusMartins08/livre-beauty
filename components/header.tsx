"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { List } from "@phosphor-icons/react";
import { navigation } from "@/content/salon";
import { ActionContent } from "@/components/ui";
import { Dialog } from "@/components/dialog";

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    const observeHero = () => {
      const hero = document.querySelector("[data-home-hero]");
      if (!hero) return false;
      observer.observe(hero);
      return true;
    };
    // App Router can stream the page after the persistent header has updated.
    const pending = new MutationObserver(() => {
      if (observeHero()) pending.disconnect();
    });
    if (!observeHero())
      pending.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      pending.disconnect();
    };
  }, [isHome]);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  const finishMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setMenuClosing(false);
    setMenuOpen(false);
  };
  const closeMenu = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishMenu();
      return;
    }
    if (closeTimer.current) return;
    setMenuClosing(true);
    closeTimer.current = setTimeout(finishMenu, 150);
  };
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setMenuClosing(false);
    setMenuOpen(true);
  };
  return (
    <>
      <header
        className={`site-header ${isHome && !compact ? "header-on-hero" : "header-solid"}`}
      >
        <div className="header-inner container">
          <Link href="/" className="wordmark">
            livre<span>BEAUTY ATELIÊ</span>
          </Link>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className="action-link"
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <ActionContent>{item.label}</ActionContent>
              </Link>
            ))}
          </nav>
          <Link href="/agendamento" className="action-link header-book">
            <ActionContent>Agendar horário</ActionContent>
          </Link>
          <button
            type="button"
            className="menu-trigger icon-button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={openMenu}
          >
            <List size={27} weight="light" />
          </button>
        </div>
      </header>
      <Dialog
        open={menuOpen}
        onClose={closeMenu}
        label="Menu de navegação"
        className={`mobile-menu${menuClosing ? " menu-closing" : ""}`}
      >
        <p className="wordmark menu-brand">
          livre<span>BEAUTY ATELIÊ</span>
        </p>
        <nav aria-label="Navegação mobile">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="action-link"
              onClick={finishMenu}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <ActionContent>{item.label}</ActionContent>
            </Link>
          ))}
        </nav>
        <Link href="/agendamento" className="action-link button" onClick={finishMenu}>
          <ActionContent>Agendar horário</ActionContent>
        </Link>
        <p className="fine-print">
          Beleza com liberdade. Cuidado com intenção.
        </p>
      </Dialog>
    </>
  );
}
